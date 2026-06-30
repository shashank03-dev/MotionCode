/**
 * Returns a `<script>`-body string (no tags) that, when run as the FIRST script
 * inside the preview iframe, forwards console output and runtime errors to the
 * parent window via postMessage. Kept dependency-free and self-contained so it
 * can be inlined into the iframe's srcDoc.
 */
export function consoleBridgeScript(runId: number): string {
  return `
(function () {
  var RUN_ID = ${JSON.stringify(runId)};
  function serialize(value) {
    try {
      if (typeof value === "string") return value;
      if (value instanceof Error) return value.stack || (value.name + ": " + value.message);
      if (typeof value === "undefined") return "undefined";
      if (typeof value === "function") return value.toString();
      return JSON.stringify(value, function (k, v) {
        if (typeof v === "bigint") return v.toString() + "n";
        return v;
      }, 2);
    } catch (e) {
      return String(value);
    }
  }
  function post(payload) {
    payload.source = "motioncode-preview";
    payload.runId = RUN_ID;
    try { parent.postMessage(payload, "*"); } catch (e) {}
  }
  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(serialize(arguments[i]));
      post({ type: "console", level: level, text: parts.join(" ") });
      original.apply(null, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    var msg = event && event.error ? (event.error.stack || event.error.message) : (event && event.message) || "Unknown error";
    post({ type: "error", text: String(msg) });
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason ? (event.reason.stack || event.reason.message || event.reason) : "Unhandled rejection";
    post({ type: "error", text: String(reason) });
  });
  window.__previewReady = function () { post({ type: "ready" }); };
})();
`;
}
