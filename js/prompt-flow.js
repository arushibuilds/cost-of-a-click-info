/* ==========================================================================
   Prompt page flow
   ask  ->  "follow your prompt"  ->  "someone else's cost is running."  ->  ask
   Any prompt takes the same route; only the timing is fixed.
   ========================================================================== */
(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var TIMING = {
        handoff: 600,   /* beat between hitting send and the ask screen leaving */
        follow: 10000,  /* "Follow your prompt" holds this long */
        cost: 10000     /* "Someone else's cost is running." holds this long */
    };

    var stages = {
        ask: document.getElementById("stage-ask"),
        follow: document.getElementById("stage-follow"),
        cost: document.getElementById("stage-cost")
    };
    var form = document.getElementById("pr-form");
    var input = document.getElementById("pr-input");
    var ghostLayer = document.getElementById("pr-ghosts");

    /* ---- dotted map backdrop --------------------------------------------- */
    // A dot grid clipped to the outline of the contiguous US, plus a hairline
    // of the same outline and a handful of data-center glints.
    function buildMap() {
        var host = document.getElementById("pr-map");
        if (!host || !window.US_MAP) return;

        var w = window.US_MAP.width;
        var h = window.US_MAP.height;
        var glints = [
            [0.33, 0.16], [0.50, 0.27], [0.63, 0.21], [0.66, 0.40],
            [0.72, 0.46], [0.79, 0.36], [0.83, 0.52], [0.90, 0.60],
            [0.17, 0.30], [0.55, 0.62]
        ];

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.innerHTML =
            '<defs>' +
                '<pattern id="prDots" width="7" height="7" patternUnits="userSpaceOnUse">' +
                    '<circle cx="3.5" cy="3.5" r="0.85" fill="#cfd6e2"/>' +
                '</pattern>' +
                '<mask id="prMask">' +
                    '<path d="' + window.US_MAP.path + '" fill="#fff"/>' +
                '</mask>' +
                '<radialGradient id="prFade" cx="50%" cy="46%" r="62%">' +
                    '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
                    '<stop offset="70%" stop-color="#fff" stop-opacity="0.45"/>' +
                    '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
                '</radialGradient>' +
                '<mask id="prVignette">' +
                    '<rect width="' + w + '" height="' + h + '" fill="url(#prFade)"/>' +
                '</mask>' +
            '</defs>' +
            '<g mask="url(#prVignette)">' +
                '<g mask="url(#prMask)">' +
                    '<rect width="' + w + '" height="' + h + '" fill="url(#prDots)"/>' +
                '</g>' +
                '<path d="' + window.US_MAP.path + '" fill="none" stroke="#e8edf5" ' +
                    'stroke-width="0.6" stroke-opacity="0.5"/>' +
            '</g>';

        glints.forEach(function (g, i) {
            var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", (g[0] * w).toFixed(1));
            c.setAttribute("cy", (g[1] * h).toFixed(1));
            c.setAttribute("r", "2.1");
            c.setAttribute("class", "pr-glint");
            c.style.animationDelay = (i * 0.9).toFixed(1) + "s";
            svg.appendChild(c);
        });

        host.appendChild(svg);
    }

    /* ---- drifting background prompts ------------------------------------- */
    var GHOSTS = [
        "write me a poem about the ocean",
        "summarize this article for me",
        "what should I eat tonight",
        "draw me a cat wearing sunglasses",
        "help me write this email",
        "explain quantum computing simply",
        "plan a three day trip to Tokyo",
        "fix the bug in my code"
    ];

    // Percentage positions. Nothing sits in the 40-60% band the headline owns,
    // and right-hand lines are anchored from the right so they cannot run off.
    var GHOST_SPOTS = [
        { top: 14, left: 8 },
        { top: 30, left: 38 },
        { top: 66, left: 5 },
        { top: 79, left: 44 },
        { top: 22, right: 8 },
        { top: 70, right: 6 },
        { top: 88, left: 22 },
        { top: 8, right: 26 }
    ];

    function buildGhosts(userPrompt) {
        if (!ghostLayer) return;
        ghostLayer.innerHTML = "";

        var pool = GHOSTS.slice();
        if (userPrompt) {
            // The visitor's own line leads, and never appears twice if it
            // happens to match one of the stock prompts.
            var key = userPrompt.toLowerCase();
            pool = pool.filter(function (p) { return p.toLowerCase() !== key; });
            pool.unshift(userPrompt);
        }

        GHOST_SPOTS.forEach(function (spot, i) {
            var text = pool[i % pool.length];
            var el = document.createElement("span");
            el.className = "pr-ghost";
            el.textContent = text;
            el.style.top = spot.top + "%";
            if (spot.left !== undefined) el.style.left = spot.left + "%";
            else el.style.right = spot.right + "%";
            // Staggered so a few are always surfacing across the 10s hold.
            el.style.animationDelay = (i * 0.95).toFixed(2) + "s";
            el.style.animationDuration = (6.4 + (i % 3) * 1.1).toFixed(1) + "s";
            ghostLayer.appendChild(el);
        });
    }

    /* ---- stage machine ---------------------------------------------------- */
    var timers = [];

    function clearTimers() {
        timers.forEach(clearTimeout);
        timers = [];
    }

    function show(name) {
        Object.keys(stages).forEach(function (key) {
            var el = stages[key];
            if (!el) return;
            var on = key === name;
            el.classList.toggle("is-active", on);
            el.setAttribute("aria-hidden", on ? "false" : "true");
        });
    }

    function run(userPrompt) {
        clearTimers();

        timers.push(setTimeout(function () {
            show("follow");

            timers.push(setTimeout(function () {
                buildGhosts(userPrompt);
                show("cost");

                timers.push(setTimeout(function () {
                    show("ask");
                    if (input) {
                        input.value = "";
                        input.focus();
                    }
                }, reduced ? 2500 : TIMING.cost));
            }, reduced ? 2500 : TIMING.follow));
        }, reduced ? 0 : TIMING.handoff));
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var value = (input && input.value || "").trim();
            if (!value) {
                if (input) {
                    input.focus();
                    form.classList.remove("is-nudged");
                    // restart the nudge animation
                    void form.offsetWidth;
                    form.classList.add("is-nudged");
                }
                return;
            }
            if (input) input.blur();
            run(value);
        });
    }

    buildMap();
    if (input) input.focus();
})();
