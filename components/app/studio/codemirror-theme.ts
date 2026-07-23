import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/** Warm-dark MotionCode terminal theme for CodeMirror 6. */
const motionCodeTheme = EditorView.theme(
  {
    "&": {
      color: "#f7f8f8",
      backgroundColor: "transparent",
      fontSize: "12.5px",
      height: "100%",
    },
    ".cm-content": {
      fontFamily:
        "var(--font-space-mono, ui-monospace), SFMono-Regular, Menlo, Consolas, monospace",
      caretColor: "#0099ff",
      padding: "12px 0",
    },
    ".cm-scroller": {
      fontFamily:
        "var(--font-space-mono, ui-monospace), SFMono-Regular, Menlo, Consolas, monospace",
      lineHeight: "1.65",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "rgba(86,84,73,0.85)",
      border: "none",
      fontSize: "11px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255,255,255,0.05)",
      color: "#a6a6a6",
    },
    ".cm-activeLine": { backgroundColor: "rgba(247,248,248,0.025)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#0099ff" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "rgba(0, 153, 255, 0.16)" },
    ".cm-selectionMatch": { backgroundColor: "rgba(255,255,255,0.12)" },
    ".cm-line": { padding: "0 14px" },
    ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
      backgroundColor: "rgba(0, 153, 255, 0.18)",
      color: "inherit",
      outline: "1px solid rgba(0, 153, 255, 0.3)",
    },
  },
  { dark: true },
);

const motionCodeHighlight = HighlightStyle.define([
  { tag: t.comment, color: "#565a60", fontStyle: "italic" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#0099ff" },
  { tag: [t.string, t.special(t.string)], color: "#a6a6a6" },
  { tag: [t.number, t.bool, t.null, t.unit], color: "#f5b97f" },
  { tag: [t.propertyName, t.attributeName], color: "#9ecdf0" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#cbe7d3" },
  { tag: [t.typeName, t.className, t.tagName], color: "#8fd9c9" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "#f7f8f8" },
  { tag: [t.punctuation, t.bracket], color: "rgba(247,248,248,0.6)" },
  { tag: t.invalid, color: "#f58f7c" },
]);

export const motionCodeEditorTheme = [
  motionCodeTheme,
  syntaxHighlighting(motionCodeHighlight),
];
