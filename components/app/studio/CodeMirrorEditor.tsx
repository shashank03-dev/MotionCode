"use client";

import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { basicSetup, EditorView } from "codemirror";
import { useEffect, useRef } from "react";

import { motionCodeEditorTheme } from "./codemirror-theme";

export type EditorLanguage = "css" | "javascript";

type CodeMirrorEditorProps = {
  value: string;
  language: EditorLanguage;
  onChange: (value: string) => void;
  onRun?: () => void;
  /** When false the document is read-only (free tier). Defaults to true. */
  editable?: boolean;
};

function languageExtension(language: EditorLanguage) {
  return language === "css" ? css() : javascript({ jsx: true, typescript: true });
}

function editableExtension(editable: boolean) {
  return [EditorState.readOnly.of(!editable), EditorView.editable.of(editable)];
}

export function CodeMirrorEditor({
  value,
  language,
  onChange,
  onRun,
  editable = true,
}: CodeMirrorEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageRef = useRef(new Compartment());
  const editableRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  // Keep latest callbacks without re-running the mount effect.
  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  });

  // Mount once.
  useEffect(() => {
    if (!hostRef.current) return;

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        runKeymap,
        languageRef.current.of(languageExtension(language)),
        editableRef.current.of(editableExtension(editable)),
        motionCodeEditorTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync language when the active framework tab changes.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageRef.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  // Sync read-only state when the plan tier changes (e.g. upgrade mid-session).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editableRef.current.reconfigure(editableExtension(editable)),
    });
  }, [editable]);

  // Sync external value changes (tab switch / reset) without clobbering typing.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}
