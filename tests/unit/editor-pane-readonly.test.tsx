import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EditorPane } from "@/components/app/studio/EditorPane";
import { CODE_TABS } from "@/lib/generatedCode";

const noop = () => {};

function renderPane(editable: boolean) {
  return renderToStaticMarkup(
    <EditorPane
      tabs={CODE_TABS}
      activeTab="CSS"
      onTabChange={noop}
      value=".box { opacity: 1; }"
      language="css"
      dirty={false}
      copied={false}
      editable={editable}
      onChange={noop}
      onRun={noop}
      onFormat={noop}
      onReset={noop}
      onCopy={noop}
      onDownload={noop}
    />,
  );
}

describe("EditorPane read-only mode (free tier)", () => {
  it("shows only Copy plus an upgrade hint, hiding edit/export controls", () => {
    const markup = renderPane(false);

    expect(markup).toContain("Read-only");
    expect(markup).toContain("Upgrade to edit");
    expect(markup).toContain("Copy");
    // Edit / export affordances are gone.
    expect(markup).not.toContain("Format");
    expect(markup).not.toContain("Download");
    expect(markup).not.toContain(">Run<");
  });

  it("shows the full toolbar when editable (paid tier)", () => {
    const markup = renderPane(true);

    expect(markup).toContain("Format");
    expect(markup).toContain("Download");
    expect(markup).toContain("Reset");
    expect(markup).toContain("Run");
    expect(markup).not.toContain("Read-only");
  });
});
