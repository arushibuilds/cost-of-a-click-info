/* ==========================================================================
   Shared page behaviour
   - mobile navigation toggle
   - Framer "Appear" effects (onInView / onMount) via IntersectionObserver
   - Animated Number Counter (Framer component, layerInView trigger)
   - timeline progress bars (research page)
   - Reveal Text / Text_Color_Letters code component
   ========================================================================== */
(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- navigation ------------------------------------------------------ */
    function initNav() {
        var burger = document.querySelector(".nav-burger");
        var links = document.querySelector(".nav-links");
        if (!burger || !links) return;
        burger.addEventListener("click", function () {
            links.classList.toggle("is-open");
        });
    }

    /* ---- appear effects --------------------------------------------------- */
    // data-appear="y:24,scale:0.97,x:-28,delay:0.1,threshold:0.2,replay"
    function parseAppear(value) {
        var out = { x: 0, y: 0, scale: 1, delay: 0, threshold: 0.15, replay: false, stagger: 0 };
        (value || "").split(",").forEach(function (part) {
            part = part.trim();
            if (!part) return;
            if (part === "replay") { out.replay = true; return; }
            var kv = part.split(":");
            var k = kv[0].trim();
            var v = parseFloat(kv[1]);
            if (k in out && !isNaN(v)) out[k] = v;
        });
        return out;
    }

    function initAppear() {
        var nodes = document.querySelectorAll("[data-appear]");
        if (!nodes.length) return;

        if (reduced || !("IntersectionObserver" in window)) {
            Array.prototype.forEach.call(nodes, function (n) { n.classList.add("is-in"); });
            return;
        }

        Array.prototype.forEach.call(nodes, function (n) {
            var cfg = parseAppear(n.getAttribute("data-appear"));
            n._appear = cfg;
            n.style.transform =
                "translate(" + cfg.x + "px, " + cfg.y + "px) scale(" + cfg.scale + ")";
            n.style.transitionDelay = cfg.delay + "s";
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var cfg = e.target._appear;
                if (e.isIntersecting) {
                    e.target.classList.add("is-in");
                    if (!cfg.replay) io.unobserve(e.target);
                } else if (cfg.replay) {
                    e.target.classList.remove("is-in");
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

        Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
    }

    /* ---- animated number counter ------------------------------------------ */
    /* Optional attributes: data-count-from / -suffix / -prefix / -decimals /
       -duration, plus data-count-scramble, which spins through random values
       before settling on the real figure.                                     */
    function initCounters() {
        var nodes = document.querySelectorAll("[data-count-to]");
        if (!nodes.length) return;

        function cfgOf(node) {
            return {
                from: parseFloat(node.getAttribute("data-count-from")) || 0,
                to: parseFloat(node.getAttribute("data-count-to")) || 0,
                prefix: node.getAttribute("data-count-prefix") || "",
                suffix: node.getAttribute("data-count-suffix") || "",
                decimals: parseInt(node.getAttribute("data-count-decimals"), 10) || 0,
                duration: parseFloat(node.getAttribute("data-count-duration")) || 2000,
                scramble: node.hasAttribute("data-count-scramble")
            };
        }

        function write(node, c, value) {
            node.textContent = c.prefix + value.toFixed(c.decimals) + c.suffix;
        }

        function run(node) {
            var c = cfgOf(node);
            if (reduced) { write(node, c, c.to); return; }

            // the scramble spends the first stretch on random values, then eases
            // from wherever it landed onto the real number
            var spin = c.scramble ? 0.55 : 0;
            var spinMax = Math.max(Math.abs(c.to) * 1.8, 9);
            var handoff = c.from;
            var lastRandom = -1e9;
            var t0 = null;

            function step(t) {
                if (t0 === null) t0 = t;
                var p = Math.min(1, (t - t0) / c.duration);

                if (p < spin) {
                    if (t - lastRandom > 55) {
                        lastRandom = t;
                        handoff = Math.random() * spinMax;
                        write(node, c, handoff);
                    }
                    requestAnimationFrame(step);
                    return;
                }

                var q = spin < 1 ? (p - spin) / (1 - spin) : p;
                // ease [0.44, 0, 0.56, 1] approximated with a smooth in-out
                var e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
                write(node, c, handoff + (c.to - handoff) * e);
                if (p < 1) requestAnimationFrame(step);
            }

            write(node, c, c.from);
            requestAnimationFrame(step);
        }

        function reset(node) {
            var c = cfgOf(node);
            write(node, c, c.from);
        }

        if (!("IntersectionObserver" in window)) {
            Array.prototype.forEach.call(nodes, run);
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                run(e.target);
            });
        }, { threshold: 0.4 });

        Array.prototype.forEach.call(nodes, function (n) {
            reset(n);
            io.observe(n);
        });
    }

    /* ---- research timeline progress bars ---------------------------------- */
    function initTimeline() {
        var bars = document.querySelectorAll(".timeline-bar");
        if (!bars.length) return;

        function update() {
            var vh = window.innerHeight;
            Array.prototype.forEach.call(bars, function (bar) {
                var fill = bar.querySelector(".fill");
                if (!fill) return;
                var r = bar.getBoundingClientRect();
                var start = vh * 0.85;
                var end = vh * 0.25;
                var p = (start - r.top) / Math.max(1, start - end);
                p = Math.max(0, Math.min(1, p));
                fill.style.height = (p * 100).toFixed(2) + "%";
            });
        }

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    }

    /* ---- Reveal Text (Text_Color_Letters) --------------------------------- */
    // Colours each character from #808080 to #eeeeee as the block scrolls
    // between "start 0.75" and "start 0.15" of the viewport.
    function initRevealText() {
        var blocks = document.querySelectorAll("[data-reveal-text]");
        if (!blocks.length) return;

        Array.prototype.forEach.call(blocks, function (block) {
            var text = block.getAttribute("data-reveal-text");
            var startIndex = parseInt(block.getAttribute("data-reveal-start") || "0", 10);
            var words = text.split(" ");
            var total = words.length;
            var charIndex = 0;
            var spans = [];

            block.textContent = "";
            words.forEach(function (word, wi) {
                var wordEl = document.createElement("span");
                var starting = wi / total;
                var ending = (wi + 1) / total;
                var step = (ending - starting) / word.length;
                word.split("").forEach(function (ch, ci) {
                    var s = document.createElement("span");
                    s.textContent = ch;
                    var idx = charIndex + ci;
                    if (idx < startIndex) {
                        s.style.color = "#eeeeee";
                    } else {
                        spans.push({
                            node: s,
                            start: starting + step * ci,
                            end: starting + step * (ci + 1)
                        });
                        s.style.color = "#808080";
                    }
                    wordEl.appendChild(s);
                });
                wordEl.appendChild(document.createTextNode(" "));
                charIndex += word.length + 1;
                block.appendChild(wordEl);
            });

            block._revealSpans = spans;
        });

        function update() {
            var vh = window.innerHeight;
            Array.prototype.forEach.call(blocks, function (block) {
                var spans = block._revealSpans;
                if (!spans) return;
                var top = block.getBoundingClientRect().top;
                var p = (vh * 0.75 - top) / (vh * 0.75 - vh * 0.15);
                p = Math.max(0, Math.min(1, p));
                spans.forEach(function (s) {
                    var local = (p - s.start) / Math.max(1e-6, s.end - s.start);
                    local = Math.max(0, Math.min(1, local));
                    var v = Math.round(0x80 + (0xee - 0x80) * local);
                    var hex = v.toString(16);
                    if (hex.length === 1) hex = "0" + hex;
                    s.node.style.color = "#" + hex + hex + hex;
                });
            });
        }

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    }

    /* ---- expanding chapters (code-your-dream) ----------------------------- */
    // <div data-accordion="single"> with .acc-item > .acc-head + .acc-body
    // "single" keeps at most one row open; any other value allows several.
    function initAccordion() {
        var groups = document.querySelectorAll("[data-accordion]");
        if (!groups.length) return;

        Array.prototype.forEach.call(groups, function (group) {
            var single = group.getAttribute("data-accordion") === "single";
            var items = group.querySelectorAll(".acc-item");

            Array.prototype.forEach.call(items, function (item) {
                var head = item.querySelector(".acc-head");
                var body = item.querySelector(".acc-body");
                if (!head || !body) return;

                item._setOpen = function (open) {
                    item.classList.toggle("is-open", open);
                    head.setAttribute("aria-expanded", open ? "true" : "false");
                    body.setAttribute("aria-hidden", open ? "false" : "true");
                    body.style.height = open ? body.scrollHeight + "px" : "0px";
                };

                item._setOpen(item.classList.contains("is-open"));

                head.addEventListener("click", function () {
                    var open = !item.classList.contains("is-open");
                    if (open && single) {
                        Array.prototype.forEach.call(items, function (other) {
                            if (other !== item && other._setOpen) other._setOpen(false);
                        });
                    }
                    item._setOpen(open);
                });
            });

            window.addEventListener("resize", function () {
                Array.prototype.forEach.call(items, function (item) {
                    if (!item.classList.contains("is-open")) return;
                    var body = item.querySelector(".acc-body");
                    // measure at auto so a re-wrapped paragraph is not clipped
                    if (!body) return;
                    body.style.height = "auto";
                    var h = body.scrollHeight;
                    body.style.height = h + "px";
                });
            });
        });
    }

    /* ---- particles shader stand-in (about page "US divided" backdrop) ------ */
    function initStarfield() {
        var canvases = document.querySelectorAll("[data-starfield]");
        if (!canvases.length) return;

        Array.prototype.forEach.call(canvases, function (canvas) {
            var ctx = canvas.getContext("2d");
            if (!ctx) return;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var stars = [];
            var w = 0, h = 0;

            function size() {
                var r = canvas.getBoundingClientRect();
                w = r.width; h = r.height;
                if (!w || !h) return;
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                if (!stars.length) {
                    for (var i = 0; i < 220; i++) {
                        stars.push({
                            x: Math.random(),
                            y: Math.random(),
                            r: 0.3 + Math.random() * 0.9,
                            a: 0.08 + Math.random() * 0.17,
                            v: 0.004 + Math.random() * 0.012
                        });
                    }
                }
            }

            function draw() {
                if (!w || !h) { size(); }
                ctx.clearRect(0, 0, w, h);
                for (var i = 0; i < stars.length; i++) {
                    var s = stars[i];
                    if (!reduced) {
                        s.y -= s.v / 60;
                        if (s.y < 0) s.y += 1;
                    }
                    ctx.globalAlpha = s.a;
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                if (!reduced) requestAnimationFrame(draw);
            }

            size();
            window.addEventListener("resize", size);
            requestAnimationFrame(draw);
        });
    }

    function boot() {
        initNav();
        initStarfield();
        initAppear();
        initCounters();
        initTimeline();
        initRevealText();
        initAccordion();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
