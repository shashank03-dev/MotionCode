/**
 * Source for the pre-paint landing-intro gate.
 *
 * This ships as an inline <script> in app/layout.tsx and must run before the
 * first paint, which is why it's a string rather than a module: a deferred or
 * hydrated check would let the overlay paint and then disappear, which is the
 * exact flash the gate exists to prevent.
 *
 * Contract — it sets `data-intro` on <html> to one of:
 *   "play" — first landing of this browser session; the overlay animates.
 *   "seen" — already shown this session (or storage is unavailable); the CSS
 *            keeps the overlay hidden and nothing animates.
 *
 * The flag is written at decision time, not when the animation finishes, so a
 * reload part-way through the intro doesn't replay it.
 *
 * Storage access throws in some privacy modes. On failure we deliberately fall
 * back to "seen": showing an intro we might not be able to dismiss is worse
 * than showing no intro at all.
 */
export const INTRO_STORAGE_KEY = "mc:seen-intro";

export const INTRO_GATE_SCRIPT = `(function(){try{var s=sessionStorage.getItem('${INTRO_STORAGE_KEY}');if(s){document.documentElement.setAttribute('data-intro','seen');}else{document.documentElement.setAttribute('data-intro','play');sessionStorage.setItem('${INTRO_STORAGE_KEY}','1');}}catch(e){document.documentElement.setAttribute('data-intro','seen');}})();`;
