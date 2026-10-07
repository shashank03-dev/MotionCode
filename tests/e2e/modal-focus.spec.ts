import { expect, test } from "@playwright/test";

import {
  assertAppDiagnostics,
  installAppDiagnostics,
  openInteractiveApp,
  tinyGif,
} from "./app-test-helpers";

/**
 * Free-save consent alertdialog focus contract (deterministic, no analyze
 * round-trip needed):
 * - Tab cycles stay inside the dialog after many presses.
 * - Shift+Tab on the first focusable wraps to the last.
 * - Escape closes the dialog and returns focus to the invoker.
 */
test.describe("consent alertdialog focus", () => {
  test("traps Tab, wraps Shift+Tab, and restores focus on Escape", async ({
    page,
  }) => {
    const diagnostics = installAppDiagnostics(page);
    await openInteractiveApp(page);

    // The dropzone (role=button) is the invoker that opens the file picker;
    // Analyze stays disabled until frames exist, so it can't hold focus.
    const dropzone = page.getByTestId("upload-dropzone");
    await expect(dropzone).toBeVisible();
    await dropzone.focus();
    await expect(dropzone).toBeFocused();

    const fileInput = dropzone.locator('input[type="file"]');
    await expect(async () => {
      await fileInput.setInputFiles({
        buffer: tinyGif,
        mimeType: "image/gif",
        name: "focus-trap-motion.gif",
      });
      await expect(
        page.getByRole("alertdialog", { name: /won.t be saved/i }),
      ).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    const dialog = page.getByRole("alertdialog", { name: /won.t be saved/i });
    await expect(dialog).toBeVisible();
    // The dialog moves focus to Continue shortly after mount.
    await expect(
      dialog.getByRole("button", { name: "Continue" }),
    ).toBeFocused({ timeout: 5000 });

    const insideDialog = () =>
      page.evaluate(() => {
        const el = document.querySelector('[role="alertdialog"]');
        return !!el && el.contains(document.activeElement);
      });

    // Many more Tabs than focusables: focus must never leak outside.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await insideDialog()).toBe(true);
    }

    // Shift+Tab on the first focusable wraps to the last (Continue).
    const firstFocusable = dialog.locator("a[href]").first();
    await firstFocusable.focus();
    await expect(firstFocusable).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "Continue" }),
    ).toBeFocused();

    // Escape discards the upload and returns focus to the invoker.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(dropzone).toBeFocused();

    await assertAppDiagnostics(page, diagnostics);
  });
});
