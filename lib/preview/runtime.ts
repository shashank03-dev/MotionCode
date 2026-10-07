/**
 * In-iframe preview runtime. Returned as a `<script>` body (no tags) and
 * inlined into the preview srcDoc after the vendored libraries load.
 *
 * It expects two globals defined just before it runs:
 *   - `__MC_CONFIG`: { framework, intent, durationMs, delayMs, loops }
 *   - `__MC_CODE`:   the user's generated/edited code
 *
 * Responsibilities:
 *   1. Point generated selectors (.card, #hero, …) at the demo element so code
 *      written for an arbitrary element still animates something.
 *   2. Transpile TS / JSX / ES module syntax with the vendored Sucrase build and
 *      evaluate it against the vendored framework globals.
 *   3. Find something to render/call (default export, named component,
 *      variants object, spring hook, animate function).
 *   4. Simulate hover/state toggles so interaction-driven motion is visible.
 *   5. Fall back to spec-driven keyframes when the code can't be shown, and
 *      report which mode ran via `__previewReady(mode)`.
 *
 * Kept as plain ES2017 with no template literals so it can live in a TS
 * template string without escaping.
 */
export const PREVIEW_RUNTIME = String.raw`
(function () {
  var CONFIG = window.__MC_CONFIG || {};
  var CODE = typeof window.__MC_CODE === "string" ? window.__MC_CODE : "";
  var stage = document.getElementById("stage");
  var root = document.getElementById("root");
  var target = document.getElementById("target");
  var reported = false;
  var cycleMs = Math.max(900, (CONFIG.durationMs || 0) + (CONFIG.delayMs || 0) + 700);

  function ready(mode) {
    if (reported) return;
    reported = true;
    window.__previewReady(mode);
  }

  function fallback(reason) {
    if (reason) console.warn(reason);
    var el = document.querySelector("[data-mc-target]");
    if (!el) {
      root.innerHTML = "";
      el = document.createElement("div");
      el.setAttribute("data-mc-target", "");
      el.textContent = "EL";
      root.appendChild(el);
    }
    el.classList.add("mc-fallback");
    ready("fallback");
  }

  // ---------------------------------------------------------------- selectors

  var HEX_COLOR = /^[0-9a-fA-F]{3,8}$/;
  var NAME = "-?[_a-zA-Z][\\w-]*";

  function readCompound(compound) {
    var classes = [];
    var ids = [];
    var re = new RegExp("([.#])(" + NAME + ")", "g");
    var m;
    // Ignore attribute and pseudo-class arguments, e.g. :not(.x) / [href$=".pdf"].
    var cleaned = compound.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "");
    while ((m = re.exec(cleaned))) {
      if (m[1] === ".") classes.push(m[2]);
      else if (!HEX_COLOR.test(m[2])) ids.push(m[2]);
    }
    return { classes: classes, ids: ids };
  }

  /**
   * Map one selector onto stage > root > target. The subject compound lands on
   * the demo element; ancestor compounds land on its wrappers so descendant
   * selectors (.list .item) still match. Within the subject, the first class is
   * the element's identity and any further classes are "state" (.is-visible),
   * applied a frame later so transitions actually run.
   */
  function planSelector(selector, plan) {
    var compounds = selector
      .replace(/::?[\w-]+(\([^)]*\))?/g, function (pseudo) {
        return /^:(hover|focus|focus-visible|focus-within|active)$/.test(pseudo) ? pseudo : "";
      })
      .split(/\s*[\s>+~]\s*/)
      .filter(Boolean);
    if (!compounds.length) return;
    var subject = readCompound(compounds[compounds.length - 1]);
    subject.classes.forEach(function (name, index) {
      (index === 0 ? plan.base : plan.state)[name] = true;
    });
    subject.ids.forEach(function (id) { if (!plan.id) plan.id = id; });
    if (compounds.length > 1) {
      readCompound(compounds[compounds.length - 2]).classes.forEach(function (name) { plan.parent[name] = true; });
    }
    compounds.slice(0, -2).forEach(function (compound) {
      readCompound(compound).classes.forEach(function (name) { plan.outer[name] = true; });
    });
  }

  function newPlan() {
    return { base: {}, state: {}, parent: {}, outer: {}, id: null };
  }

  function applyPlan(plan, el) {
    Object.keys(plan.outer).forEach(function (n) { stage.classList.add(n); });
    Object.keys(plan.parent).forEach(function (n) { root.classList.add(n); });
    Object.keys(plan.base).forEach(function (n) { el.classList.add(n); });
    if (plan.id) el.id = plan.id;
  }

  function stateClasses(plan) {
    return Object.keys(plan.state).filter(function (n) { return !plan.base[n]; });
  }

  /** Selectors referenced from JS string literals: gsap.to(".card", …). */
  function planFromJs(code) {
    var plan = newPlan();
    var re = /(["'\x60])([.#][^"'\x60\n]{0,160})\1/g;
    var m;
    while ((m = re.exec(code))) {
      if (!/^[.#]-?[_a-zA-Z]/.test(m[2])) continue;
      m[2].split(",").forEach(function (sel) { planSelector(sel.trim(), plan); });
    }
    // In JS every referenced class is an identity, not a state toggle.
    Object.keys(plan.state).forEach(function (n) { plan.base[n] = true; });
    plan.state = {};
    return plan;
  }

  // ---------------------------------------------------------------- hover sim

  var POINTER_IN = ["pointerover", "pointerenter", "mouseover", "mouseenter"];
  var POINTER_OUT = ["pointerout", "pointerleave", "mouseout", "mouseleave"];

  function dispatchPointer(el, types) {
    types.forEach(function (type) {
      var init = { bubbles: !/enter|leave/.test(type), cancelable: true, pointerType: "mouse", isPrimary: true, clientX: 1, clientY: 1 };
      var event;
      try {
        event = type.indexOf("pointer") === 0 && typeof PointerEvent === "function"
          ? new PointerEvent(type, init)
          : new MouseEvent(type, init);
      } catch (e) {
        event = new MouseEvent(type, init);
      }
      el.dispatchEvent(event);
    });
  }

  function wantsHover(code) {
    return CONFIG.intent === "hover" || /whileHover|onMouseEnter|onPointerEnter|mouseenter|pointerenter|mouseover/.test(code);
  }

  /** Alternate hover in/out on whatever element the code animates. */
  function simulateHover(getEl) {
    var on = false;
    function tick() {
      var el = getEl();
      if (el) {
        on = !on;
        dispatchPointer(el, on ? POINTER_IN : POINTER_OUT);
      }
    }
    window.setTimeout(tick, 400);
    window.setInterval(tick, cycleMs);
  }

  // ---------------------------------------------------------------- evaluation

  var MODULES = {
    gsap: function () { return window.gsap; },
    "gsap/all": function () { return window.gsap; },
    "@gsap/react": function () { return { useGSAP: function (fn) { window.React && window.React.useLayoutEffect(function () { fn(); }, []); } }; },
    react: function () { return window.React; },
    "react-dom": function () { return window.ReactDOM; },
    "react-dom/client": function () { return window.ReactDOM; },
    "framer-motion": function () { return window.Motion; },
    motion: function () { return window.Motion; },
    "motion/react": function () { return window.Motion; },
    "@react-spring/web": function () { return window.ReactSpring; },
    "react-spring": function () { return window.ReactSpring; },
  };

  function requireShim(name) {
    var factory = MODULES[name];
    var mod = factory ? factory() : undefined;
    if (mod) return mod;
    if (/\.css$/.test(name)) return {};
    console.warn("Preview: \"" + name + "\" isn't available in the sandbox; its imports are undefined.");
    return {};
  }

  var RESERVED = /^(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|await|async|of|arguments|eval)$/;

  /** Top-level-looking declarations: candidates to mount when nothing is exported. */
  function localNames(code) {
    var names = {};
    var re = /(?:function\s*\*?\s*|(?:const|let|var|class)\s+)([A-Za-z_$][\w$]*)/g;
    var m;
    while ((m = re.exec(code))) {
      if (!RESERVED.test(m[1])) names[m[1]] = true;
    }
    return Object.keys(names);
  }

  function evaluate(code, transforms, scope) {
    if (!window.Sucrase) throw new Error("Preview transpiler failed to load.");
    var compiled = window.Sucrase.transform(code, {
      transforms: transforms,
      jsxRuntime: "classic",
      production: true,
      disableESTransforms: true,
    }).code;
    var module = { exports: {} };
    var locals = {};
    var names = localNames(code);
    var capture = names.map(function (name) {
      return "try { __mcLocals[" + JSON.stringify(name) + "] = " + name + "; } catch (e) {}";
    }).join("\n");
    var params = ["require", "module", "exports", "__mcLocals"].concat(Object.keys(scope));
    var args = [requireShim, module, module.exports, locals].concat(Object.keys(scope).map(function (k) { return scope[k]; }));
    // The extra block lets user code redeclare names we pass in (const motion = …).
    var fn = Function.apply(null, params.concat(["{\n" + compiled + "\n;" + capture + "\n}"]));
    fn.apply(window, args);
    return { exports: module.exports, locals: locals };
  }

  function exportList(result) {
    var list = [];
    var exp = result.exports || {};
    if (exp.default !== undefined) list.push(["default", exp.default]);
    Object.keys(exp).forEach(function (k) { if (k !== "default" && k !== "__esModule") list.push([k, exp[k]]); });
    Object.keys(result.locals).forEach(function (k) {
      var v = result.locals[k];
      if (!list.some(function (e) { return e[1] === v; })) list.push([k, v]);
    });
    return list;
  }

  // ---------------------------------------------------------------- CSS

  function runCss() {
    var css = CODE
      // The preview exists to show motion; ignore reduced-motion opt-outs.
      .replace(/prefers-reduced-motion\s*:\s*reduce/g, "prefers-reduced-motion: mc-never");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var stateful = css.replace(/:(hover|focus-visible|focus-within|focus|active)\b/g, ".mc-$1");
    var hasPseudoState = stateful !== css;
    if (hasPseudoState) {
      var stateStyle = document.createElement("style");
      stateStyle.textContent = stateful;
      document.head.appendChild(stateStyle);
    }

    var plan = newPlan();
    var stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    var headerRe = /([^{}]+)\{/g;
    var m;
    while ((m = headerRe.exec(stripped))) {
      var header = m[1].trim();
      if (!header || header.charAt(0) === "@") continue;
      if (/^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$/i.test(header)) continue;
      header.split(",").forEach(function (sel) { planSelector(sel.trim(), plan); });
    }
    applyPlan(plan, target);
    var toggles = stateClasses(plan);
    if (hasPseudoState) toggles = toggles.concat(["mc-hover", "mc-focus", "mc-focus-visible", "mc-focus-within", "mc-active"]);

    function hasAnimation() {
      var cs = getComputedStyle(target);
      return cs.animationName && cs.animationName !== "none";
    }
    function hasTransition() {
      var cs = getComputedStyle(target);
      return (cs.transitionDuration || "0s").split(",").some(function (d) { return parseFloat(d) > 0; });
    }

    // Flush styles so the base state is committed before state classes flip
    // (that's what makes transitions run). Deliberately not requestAnimationFrame:
    // Chromium pauses rAF in offscreen cross-origin iframes, which would stall
    // the ready signal whenever the preview is scrolled away or behind a tab.
    void target.offsetWidth;
    var on = false;
    function flip() {
      on = !on;
      toggles.forEach(function (n) { target.classList.toggle(n, on); });
    }
    if (toggles.length) {
      flip();
      window.setInterval(flip, cycleMs);
    }
    if (hasAnimation()) return ready("code");
    if (toggles.length && hasTransition()) return ready("code");
    var keyframes = /@keyframes\s+([-\w]+)/.exec(stripped);
    if (!toggles.length && keyframes) {
      // Keyframes with no matching rule: play them on the demo element
      // using the spec's timing.
      target.style.animation = keyframes[1] + " " + Math.max(120, CONFIG.durationMs || 0) + "ms " +
        (CONFIG.easing || "ease") + " " + (CONFIG.delayMs || 0) + "ms " + (CONFIG.loops ? "infinite" : "1") + " both";
      return ready("code");
    }
    fallback("The CSS doesn't bind an animation or transition to an element the preview can match. Showing a spec-based preview.");
  }

  // ---------------------------------------------------------------- GSAP

  function countTweens() {
    try { return window.gsap.globalTimeline.getChildren(true, true, true).length; } catch (e) { return 0; }
  }

  function runGsap() {
    var gsap = window.gsap;
    if (!gsap) return fallback("GSAP failed to load. Showing a spec-based preview.");
    applyPlan(planFromJs(CODE), target);
    var hover = wantsHover(CODE);
    var result = evaluate(CODE, ["typescript", "imports"], {
      gsap: gsap,
      target: target,
      element: target,
      el: target,
    });
    if (countTweens() === 0) {
      // Helper-style exports: export function animate(target) { … }
      exportList(result).forEach(function (entry) {
        if (countTweens() > 0 || typeof entry[1] !== "function") return;
        if (/^[A-Z]/.test(entry[0]) && entry[0] !== "default") return;
        try { entry[1](target); } catch (e) { console.error(e); }
      });
    }
    if (hover) simulateHover(function () { return target; });
    if (countTweens() > 0 || hover) return ready("code");
    fallback("The GSAP code didn't create a tween. Showing a spec-based preview.");
  }

  // ---------------------------------------------------------------- React

  function looksLikeComponent(name, value) {
    if (!value) return false;
    if (typeof value === "object" && value.$$typeof) return true;
    return typeof value === "function" && (name === "default" ? !/^use[A-Z]/.test(value.name || "") : /^[A-Z]/.test(name));
  }

  function isTransitionObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function pickVariantStates(variants) {
    var keys = Object.keys(variants).filter(function (k) { return isTransitionObject(variants[k]) || typeof variants[k] === "function"; });
    if (keys.length < 2) return null;
    var from = ["hidden", "initial", "exit", "rest", "idle", "closed", "off", "start", "out"];
    var to = ["visible", "show", "animate", "enter", "hover", "open", "on", "end", "in", "active"];
    var initial = keys.filter(function (k) { return from.indexOf(k) >= 0; })[0] || keys[0];
    var animate = keys.filter(function (k) { return to.indexOf(k) >= 0 && k !== initial; })[0] || keys.filter(function (k) { return k !== initial; })[0];
    return { initial: initial, animate: animate };
  }

  function demoProps() {
    return { className: "element box target", "data-mc-target": "" };
  }

  /** Build something mountable from exports that aren't components. */
  function synthesize(entries, kind) {
    var React = window.React;
    var h = React.createElement;
    var i;
    if (kind === "spring") {
      var animated = window.ReactSpring && window.ReactSpring.animated;
      for (i = 0; i < entries.length; i++) {
        var hook = entries[i][1];
        if (typeof hook === "function" && /^use[A-Z]/.test(entries[i][0])) {
          return function SpringHookPreview() {
            var out = hook();
            var style = Array.isArray(out) ? out[0] : out;
            return h(animated.div, Object.assign(demoProps(), { style: style }), "EL");
          };
        }
      }
      return null;
    }
    var motion = window.Motion && window.Motion.motion;
    for (i = 0; i < entries.length; i++) {
      var value = entries[i][1];
      if (!isTransitionObject(value) || value.$$typeof) continue;
      if (value.animate || value.initial || value.whileHover || value.exit) {
        var direct = value;
        return function MotionPropsPreview() {
          return h(motion.div, Object.assign(demoProps(), direct), "EL");
        };
      }
      var states = pickVariantStates(value);
      if (states) {
        var variants = value;
        var loop = CONFIG.loops;
        return function VariantsPreview() {
          var pair = React.useState(states.initial);
          React.useEffect(function () {
            var flip = false;
            var t = window.setTimeout(function () { pair[1](states.animate); }, 60);
            var id = loop ? window.setInterval(function () {
              flip = !flip;
              pair[1](flip ? states.initial : states.animate);
            }, cycleMs) : null;
            return function () { window.clearTimeout(t); if (id) window.clearInterval(id); };
          }, []);
          return h(motion.div, Object.assign(demoProps(), { variants: variants, initial: states.initial, animate: pair[0] }), "EL");
        };
      }
    }
    return null;
  }

  function wrapBareJsx(code) {
    var trimmed = code.trim();
    if (trimmed.charAt(0) !== "<") return code;
    return "export default function Preview() {\n  return (<>" + trimmed.replace(/;\s*$/, "") + "</>);\n}";
  }

  function runReact(kind) {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    var lib = kind === "spring" ? window.ReactSpring : window.Motion;
    if (!React || !ReactDOM || !lib || !window.Sucrase) {
      return fallback("Preview libraries failed to load. Showing a spec-based preview.");
    }
    var source = wrapBareJsx(CODE);
    var scope = {
      React: React,
      useState: React.useState,
      useEffect: React.useEffect,
      useLayoutEffect: React.useLayoutEffect,
      useRef: React.useRef,
      useMemo: React.useMemo,
      useCallback: React.useCallback,
    };
    // Generated snippets often use the library without importing it.
    ["motion", "AnimatePresence", "useAnimation", "useAnimate", "useInView", "useMotionValue", "useTransform", "useScroll", "useReducedMotion", "animate", "stagger"]
      .forEach(function (k) { if (window.Motion && window.Motion[k]) scope[k] = window.Motion[k]; });
    ["animated", "useSpring", "useSprings", "useTrail", "useTransition", "useChain", "useSpringRef", "config", "a"]
      .forEach(function (k) { if (window.ReactSpring && window.ReactSpring[k]) scope[k] = window.ReactSpring[k]; });

    var result = evaluate(source, ["typescript", "jsx", "imports"], scope);
    var entries = exportList(result);
    var Component = null;
    for (var i = 0; i < entries.length && !Component; i++) {
      if (looksLikeComponent(entries[i][0], entries[i][1])) Component = entries[i][1];
    }
    if (!Component) Component = synthesize(entries, kind);
    if (!Component) return fallback("Couldn't find a component, variants or hook to render. Showing a spec-based preview.");

    var h = React.createElement;
    function Boundary(props) {
      React.Component.call(this, props);
      this.state = { error: null };
    }
    Boundary.prototype = Object.create(React.Component.prototype);
    Boundary.prototype.constructor = Boundary;
    Boundary.getDerivedStateFromError = function (error) { return { error: error }; };
    // React already reports the caught error to console.error.
    Boundary.prototype.componentDidCatch = function () {
      console.warn("The component threw while rendering. Showing a spec-based preview.");
      ready("fallback");
    };
    Boundary.prototype.render = function () {
      if (this.state.error) return h("div", Object.assign(demoProps(), { className: "element box target mc-fallback" }), "EL");
      return this.props.children;
    };
    function Mounted() {
      React.useEffect(function () { ready("code"); }, []);
      return h(Component, null, h("div", demoProps(), "EL"));
    }

    root.innerHTML = "";
    ReactDOM.createRoot(root).render(h(Boundary, null, h(Mounted)));
    if (wantsHover(CODE)) {
        simulateHover(function () { return root.firstElementChild; });
    }
  }

  // ---------------------------------------------------------------- boot

  try {
    if (!CODE.trim()) {
      fallback("No code for this framework yet. Showing a spec-based preview.");
    } else if (CONFIG.framework === "gsap") {
      runGsap();
    } else if (CONFIG.framework === "framer-motion") {
      runReact("framer");
    } else if (CONFIG.framework === "react-spring") {
      runReact("spring");
    } else {
      runCss();
    }
  } catch (error) {
    console.error(error);
    fallback("The code threw before it could run. Showing a spec-based preview.");
  }
})();
`;
