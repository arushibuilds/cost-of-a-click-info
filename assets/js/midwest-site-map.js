/* ==========================================================================
   MidwestSiteMap — vanilla port of the Framer code component
   `MidwestSiteMap.tsx`.

   Interactive map of the six Midwest data-center sites. Select a marker to
   open its community card; click anywhere else on the map — or the back
   button — to return to the overview. Drag to pan, wheel to zoom, Esc to
   reset.

   Requires state-paths.js (window.STATE_PATHS) to be loaded first.
   ========================================================================== */
(function () {
    "use strict";

    var VB_W = 1000;
    var VB_H = 1068;
    var CX = VB_W / 2;
    var CY = VB_H / 2;
    var SVG_NS = "http://www.w3.org/2000/svg";

    var STATE_LABELS = [
        { name: "MINNESOTA", x: 158.5, y: 248.5 },
        { name: "WISCONSIN", x: 418.5, y: 377.5 },
        { name: "MICHIGAN", x: 713.9, y: 443.8 },
        { name: "IOWA", x: 226.3, y: 588.3 },
        { name: "ILLINOIS", x: 477.1, y: 740 },
        { name: "INDIANA", x: 652.7, y: 724.9 },
        { name: "OHIO", x: 854.9, y: 602 },
        { name: "MISSOURI", x: 245.6, y: 864.8 }
    ];

    var SITES = [
        {
            id: "dekalb",
            city: "DeKalb",
            region: "Illinois",
            abbr: "IL",
            operator: "Meta — DeKalb County",
            why: "Meta's DeKalb campus opened in 2022, with phases two and three completed in 2024 — over 2 million square feet, roughly 250 MW, and more than $800 million invested. It's Meta's largest Illinois data center, roughly an hour west of DePaul in a college town of about 40,000 (home to NIU). Illinois has no mandatory water-disclosure law, and the POWER Act, which would have required one, failed in 2026 — so DeKalb is the clearest case of knowing the scale of a site while being unable to get its water data. It was built on converted farmland, and its expansion phases keep acquiring more parcels.",
            community: "DeKalb residents living with farmland conversion and a groundwater draw — from DeKalb municipal supply and on-site wells — with zero public visibility into volume.",
            sources: "Data Center Frontier · DeKalb Daily Chronicle · Meta sustainability reports",
            image: "assets/img/site-dekalb.png",
            imageAlt: "Aerial view of Meta's DeKalb, Illinois data center buildings surrounded by farmland",
            x: 497.3,
            y: 579.9
        },
        {
            id: "councilbluffs",
            city: "Council Bluffs",
            region: "Iowa",
            abbr: "IA",
            operator: "Google",
            why: "Google's largest US campus — 5 million-plus square feet, 400+ MW, $5 billion-plus invested since opening in 2009 — and the one site in this set with a public per-facility water figure, because a 2022 court case forced disclosure of Google's Oregon facility water use and Google then began publishing per-site numbers voluntarily. Council Bluffs alone reports over one billion gallons of water use per year, drawn from the Missouri River basin. It's the strongest hard number in this set, and a demonstration of what transparency looks like when courts force it — and what every other site lacks without that pressure.",
            community: "Missouri River withdrawals competing with municipal and downstream users in a basin that's been intermittently drought-stressed through the 2020s, serving a city of about 62,000 across the river from Omaha.",
            sources: "Google 2024 Environmental Report (per-site water data) · The Oregonian · Bloomberg 2025",
            image: "assets/img/site-councilbluffs.jpg?v=2",
            imageAlt: "Aerial view of Google's Council Bluffs data center at sunset, with a river in the background",
            x: 91.7,
            y: 647.7
        },
        {
            id: "newcarlisle",
            city: "New Carlisle",
            region: "Indiana",
            abbr: "IN",
            operator: "Amazon Web Services — St. Joseph County",
            why: "The scale pin. At $11 billion across 1,200-plus acres of former farmland, this is the largest data-center project ever announced in the Midwest — larger than any single Meta, Google or Microsoft site in the region. Five to seven million square feet are planned in phases running to 2030, and at full buildout the campus is designed to draw 2,250+ MW, an unprecedented figure for one Midwest campus; AEP Indiana Michigan Power has already warned that transmission upgrades are required to serve the load. Water withdrawal has not been publicly disclosed, and is projected to run into the tens to hundreds of millions of gallons a year from the St. Joseph River aquifer — the same system New Carlisle residents drink from. Indiana requires disclosure of neither water nor energy. Amazon is also the primary cloud partner of Anthropic, so when a visitor runs a prompt through a modern AI system, there is a real chance the compute is running inside a facility like this one.",
            community: "A town of about 1,900 people hosting an $11 billion campus built across an area larger than the town itself. More than $4 billion in state and local tax abatements shift the cost of new road, water and school infrastructure onto existing residents, while LaPorte and St. Joseph County organizers raise concerns about water use, road infrastructure and property-tax burden shifts with no disclosure data to argue from.",
            sources: "South Bend Tribune · Indiana Economic Development Corporation · AEP Indiana Michigan Power filings · Data Center Frontier",
            image: "assets/img/site-newcarlisle.jpg",
            imageAlt: "Aerial view at dusk of Amazon's data center campus near New Carlisle, Indiana",
            x: 626.8,
            y: 586.5
        },
        {
            id: "grandrapids",
            city: "Grand Rapids",
            region: "Michigan",
            abbr: "MI",
            operator: "Switch — Kent County",
            why: "The adaptive-reuse pin. The campus is a pyramid — built in 1989 as Steelcase's corporate development center on the southern edge of Grand Rapids, standing mostly empty after the furniture company left it in 2010, bought by Switch in 2015 and opened in 2017 as a Tier IV data center. The first phase converted the pyramid itself into 225,000 square feet of data center space; 100+ MW is running today, and the campus is designed for up to 1.8 million square feet and 320 MW at full buildout, backed by $5 billion-plus in phased commitments. Switch markets itself as a low-water operator, but no per-facility withdrawal figure is published: the campus draws on Gaines Township municipal supply and on-site wells in the Grand River basin, which drains into Lake Michigan. Michigan has no mandatory disclosure, and the state is becoming a data-center destination — Meta, Google and Microsoft have all announced Michigan investments since 2024 — faster than it is recognized as one.",
            community: "Gaines Township and greater Grand Rapids, where the region's landmark office building went from making furniture to running servers. The Grand River runs through the city and into Lake Michigan, making this a Great Lakes withdrawal story running parallel to Mount Pleasant's — except Michigan's disclosure regime is silent, so residents have no visibility into water or energy use at all.",
            sources: "MLive Media Group · Detroit Free Press · Data Center Frontier · Switch permitting filings · Kent County property records",
            image: "assets/img/site-grandrapids.jpg",
            imageAlt: "The pyramid-shaped former Steelcase corporate development center near Grand Rapids, Michigan, now a Switch data center campus",
            x: 670.9,
            y: 491.1
        },
        {
            id: "mountpleasant",
            city: "Mount Pleasant",
            region: "Wisconsin",
            abbr: "WI",
            operator: "Microsoft — Racine County",
            why: "The sharpest environmental-justice story on the map. In 2017, Wisconsin used eminent domain to clear roughly 2,900 acres in Mount Pleasant for a promised Foxconn factory that was never built at scale — homes demolished, wetlands filled. In 2023 Microsoft announced a data center on the same site: phase one opened in 2024, expanding through 2027 to 250+ MW and $7 billion-plus invested, drawing an estimated 100 million-plus gallons a year — not yet disclosed — from Lake Michigan via the Racine Water Utility. Same community, displaced twice.",
            community: "Mount Pleasant residents displaced by the original Foxconn taking, now living beside the facility that replaced it, plus every downstream user of the Lake Michigan withdrawal and the corporate tax subsidies that benefited two different companies at community expense.",
            sources: "Wisconsin Watch · Milwaukee Journal Sentinel · Belt Magazine",
            image: "assets/img/site-mountpleasant.jpg?v=2",
            imageAlt: "Aerial view of Microsoft's Mount Pleasant data center campus with cooling towers and active construction behind it",
            x: 540.1,
            y: 515.6
        },
        {
            id: "newalbany",
            city: "New Albany",
            region: "Ohio",
            abbr: "OH",
            operator: "Meta, with Google nearby",
            why: "The policy pin. Opened in 2019 and expanded in 2022 and 2024 to 2 million-plus square feet and growing, ~200 MW, and $10 billion-plus invested combined with the adjacent Google campus, New Albany sits inside a large planned business park (Meta, Google, Amazon and others) in a town of about 11,000. Ohio never even proposed water-disclosure legislation, unlike Illinois' failed attempt — you cannot see what you are not allowed to know. Meta originally built here under a shell LLC, “Sidecat LLC,” to delay public awareness.",
            community: "New Albany and the greater Columbus watershed and power grid, where $10 billion-plus has been invested with no public water or energy accountability framework.",
            sources: "Columbus Dispatch · Ohio Environmental Council · local zoning records",
            image: "assets/img/site-newalbany.jpg?v=2",
            imageAlt: "Aerial view of Meta's New Albany, Ohio data center campus surrounded by farmland",
            x: 854.5,
            y: 686.2
        }
    ];

    // ---- deterministic star field -----------------------------------------
    function mulberry32(seed) {
        var a = seed;
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function buildStars(count) {
        var rand = mulberry32(20260804);
        var stars = [];
        for (var i = 0; i < count; i++) {
            stars.push({
                x: +(rand() * VB_W).toFixed(1),
                y: +(rand() * VB_H).toFixed(1),
                r: +(0.7 + rand() * 1.7).toFixed(2),
                o: +(0.12 + rand() * 0.5).toFixed(2),
                d: +(rand() * 6).toFixed(2)
            });
        }
        return stars;
    }

    var NEBULAE = [
        { x: 190, y: 300, r: 210, o: 0.05 },
        { x: 470, y: 430, r: 180, o: 0.045 },
        { x: 790, y: 520, r: 200, o: 0.04 },
        { x: 260, y: 620, r: 170, o: 0.045 },
        { x: 560, y: 790, r: 220, o: 0.038 },
        { x: 330, y: 930, r: 190, o: 0.035 }
    ];

    var EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
    var DUR = 900;

    var SANS = '"Pretendard Variable", Pretendard, ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
    var MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

    var styleInjected = false;
    function injectStyle() {
        if (styleInjected) return;
        styleInjected = true;
        var s = document.createElement("style");
        s.textContent =
            "@keyframes msm-twinkle { 0%,100% { opacity: 0.18 } 50% { opacity: 0.75 } }" +
            // The first sync() lays everything out from its default position.
            // Freezing transitions for that one frame is what stops the markers
            // sliding into place and the card swinging shut on page load.
            ".msm-booting, .msm-booting * { transition: none !important }" +
            ".msm-card::-webkit-scrollbar { width: 8px }" +
            ".msm-card::-webkit-scrollbar-track { background: transparent }" +
            ".msm-card::-webkit-scrollbar-thumb {" +
                "background: rgba(255,255,255,0.18); border-radius: 4px }" +
            ".msm-card:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3) }" +
            ".msm-marker:focus { outline: none }" +
            ".msm-marker:focus-visible { outline: 2px solid rgba(255,255,255,0.75); outline-offset: 4px }";
        document.head.appendChild(s);
    }

    function el(tag, attrs, style) {
        var n = document.createElementNS(SVG_NS, tag);
        if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
        if (style) n.setAttribute("style", style);
        return n;
    }

    function applyFont(node, base, override) {
        var f = Object.assign({}, base, override || {});
        for (var k in f) node.style[k] = f[k];
    }

    window.initMidwestSiteMap = function (host, options) {
        injectStyle();
        var o = options || {};
        var background = o.background || "#000000";
        var mapFill = o.mapFill || "#080808";
        var strokeColor = o.strokeColor || "#ffffff";
        var labelColor = o.labelColor || "#5c5c5c";
        var markerColor = o.markerColor || "#ffffff";
        var panelBackground = o.panelBackground || "#0b0b0b";
        var panelTextColor = o.panelTextColor || "#d9d9d9";
        var zoomLevel = o.zoomLevel != null ? o.zoomLevel : 1.55;
        var enableZoom = o.enableZoom !== false;
        var showStates = o.showStates !== false;
        var showHint = o.showHint !== false;
        var hintText = o.hintText != null ? o.hintText : "Select a site";
        var captionText = o.captionText != null ? o.captionText : "Six sites · Midwest";

        var titleFont = Object.assign(
            { fontFamily: SANS, fontWeight: "600", fontSize: "30px", lineHeight: "1.2", letterSpacing: "-0.015em" },
            o.titleFont || {}
        );
        var bodyFont = Object.assign(
            { fontFamily: SANS, fontWeight: "400", fontSize: "15px", lineHeight: "1.7", letterSpacing: "0.005em" },
            o.bodyFont || {}
        );
        var labelFont = Object.assign(
            { fontFamily: MONO, fontWeight: "500", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase" },
            o.labelFont || {}
        );

        host.style.position = "relative";
        host.style.width = "100%";
        host.style.height = "100%";
        host.style.background = background;
        host.style.overflow = "hidden";
        host.style.userSelect = "none";
        host.style.webkitTapHighlightColor = "transparent";

        var stars = buildStars(170);
        var ALL_STATES_PATH = window.STATE_PATHS.map(function (p) { return p[1]; }).join("");

        // ---- state ---------------------------------------------------------
        var size = { w: 1200, h: 800 };
        var selectedId = null;
        var hoverId = null;
        var view = { k: 1, fx: CX, fy: CY };
        var pan = { x: 0, y: 0 };
        var dragging = false;
        var drag = { active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: 0 };

        // ---- map surface ----------------------------------------------------
        var mapWrap = document.createElement("div");
        mapWrap.style.cssText =
            "position:absolute;left:0;top:0;cursor:grab;touch-action:none;overflow:hidden;" +
            "transition:width " + DUR + "ms " + EASE + ", height " + DUR + "ms " + EASE;
        host.appendChild(mapWrap);

        var svg = el("svg", {
            width: "100%",
            height: "100%",
            viewBox: "0 0 " + VB_W + " " + VB_H,
            preserveAspectRatio: "xMidYMid meet",
            role: "img",
            "aria-label": "Map of six Midwest data center sites"
        }, "display:block");
        mapWrap.appendChild(svg);

        var defs = el("defs");
        svg.appendChild(defs);

        var pattern = el("pattern", {
            id: "msm-dots", width: "13", height: "13", patternUnits: "userSpaceOnUse"
        });
        pattern.appendChild(el("circle", { cx: "6.5", cy: "6.5", r: "0.9", fill: "rgba(255,255,255,0.14)" }));
        defs.appendChild(pattern);

        var neb = el("radialGradient", { id: "msm-neb" });
        neb.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "1" }));
        neb.appendChild(el("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0" }));
        defs.appendChild(neb);

        var glowGrad = el("radialGradient", { id: "msm-glow" });
        glowGrad.appendChild(el("stop", { offset: "0%", "stop-color": markerColor, "stop-opacity": "0.55" }));
        glowGrad.appendChild(el("stop", { offset: "45%", "stop-color": markerColor, "stop-opacity": "0.16" }));
        glowGrad.appendChild(el("stop", { offset: "100%", "stop-color": markerColor, "stop-opacity": "0" }));
        defs.appendChild(glowGrad);

        var clip = el("clipPath", { id: "msm-clip" });
        clip.appendChild(el("path", { d: ALL_STATES_PATH, "clip-rule": "evenodd" }));
        defs.appendChild(clip);

        var group = el("g");
        svg.appendChild(group);

        // land + texture
        var nebulaCircles = [];
        var starCircles = [];
        if (showStates) {
            var landG = el("g", { "clip-path": "url(#msm-clip)" });
            landG.appendChild(el("rect", {
                x: -VB_W, y: -VB_H, width: VB_W * 3, height: VB_H * 3, fill: mapFill
            }));
            landG.appendChild(el("rect", {
                x: -VB_W, y: -VB_H, width: VB_W * 3, height: VB_H * 3, fill: "url(#msm-dots)"
            }));
            NEBULAE.forEach(function (n) {
                var cc = el("circle", { cx: n.x, cy: n.y, r: n.r, fill: "url(#msm-neb)", opacity: n.o });
                nebulaCircles.push({ node: cc, n: n });
                landG.appendChild(cc);
            });
            stars.forEach(function (s) {
                var sc = el("circle", { cx: s.x, cy: s.y, r: s.r, fill: "#ffffff", opacity: s.o },
                    "animation: msm-twinkle 5.5s ease-in-out " + s.d + "s infinite");
                starCircles.push({ node: sc, s: s });
                landG.appendChild(sc);
            });
            group.appendChild(landG);

            window.STATE_PATHS.forEach(function (p) {
                group.appendChild(el("path", {
                    d: p[1],
                    fill: "none",
                    stroke: strokeColor,
                    "stroke-width": 1.4,
                    "stroke-linejoin": "round",
                    "vector-effect": "non-scaling-stroke",
                    opacity: 0.92
                }));
            });
        }

        // state names — counter-scaled to keep a constant size
        var labelGroups = STATE_LABELS.map(function (l) {
            var g = el("g");
            var t = el("text", { x: -2, "text-anchor": "middle", fill: labelColor });
            applyFont(t, labelFont, { pointerEvents: "none" });
            t.textContent = l.name;
            g.appendChild(t);
            group.appendChild(g);
            return { g: g, t: t, l: l };
        });

        // markers
        var markerNodes = SITES.map(function (s) {
            var g = el("g", { role: "button", "aria-label": s.city + ", " + s.region, tabindex: "0" });
            g.setAttribute("class", "msm-marker");
            g.style.cursor = "pointer";

            var halo = el("circle", { fill: "url(#msm-glow)", opacity: 0.75 }, "transition: opacity 300ms ease");
            var ring = el("circle", { fill: "none", stroke: markerColor, "stroke-width": 1, opacity: 0 },
                "transition: all 320ms " + EASE);
            var core = el("circle", { fill: markerColor }, "transition: r 320ms " + EASE);
            var name = el("text", { "text-anchor": "middle", fill: "#ffffff", opacity: 0 });
            applyFont(name, labelFont, {
                fontSize: "11px", letterSpacing: "0.16em",
                pointerEvents: "none", transition: "opacity 220ms ease"
            });
            name.textContent = s.city.toUpperCase();

            g.appendChild(halo);
            g.appendChild(ring);
            g.appendChild(core);
            g.appendChild(name);
            group.appendChild(g);

            g.addEventListener("pointerenter", function () { hoverId = s.id; sync(); });
            g.addEventListener("pointerleave", function () { hoverId = null; sync(); });
            g.addEventListener("pointerup", function (e) {
                e.stopPropagation();
                var moved = drag.moved;
                endDrag();
                if (moved > 3) return;
                if (s.id === selectedId) reset(); else select(s);
            });
            g.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(s); }
            });

            return { g: g, halo: halo, ring: ring, core: core, name: name, site: s };
        });

        // back button
        var back = document.createElement("button");
        back.type = "button";
        back.setAttribute("aria-label", "Back to the full map");
        back.style.cssText =
            "position:absolute;border-radius:50%;border:none;background:#ffffff;display:flex;" +
            "align-items:center;justify-content:center;cursor:pointer;padding:0;opacity:0;" +
            "transform:translateY(-8px) scale(0.9);pointer-events:none;" +
            "transition:opacity 420ms ease, transform 420ms " + EASE;
        back.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" stroke-width="1.8" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M19 12H5M11 18l-6-6 6-6" /></svg>';
        back.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        back.addEventListener("pointerup", function (e) { e.stopPropagation(); });
        back.addEventListener("click", function (e) { e.stopPropagation(); reset(); });
        mapWrap.appendChild(back);

        // caption — narrow screens only
        var caption = document.createElement("div");
        caption.style.cssText =
            "position:absolute;left:20px;top:24px;color:rgba(255,255,255,0.5);" +
            "transition:opacity 320ms ease;pointer-events:none;display:none";
        applyFont(caption, labelFont);
        caption.textContent = captionText;
        mapWrap.appendChild(caption);

        // hint
        var hint = null;
        if (showHint) {
            hint = document.createElement("div");
            hint.style.cssText =
                "position:absolute;color:rgba(255,255,255,0.34);transition:opacity 320ms ease;" +
                "pointer-events:none";
            applyFont(hint, labelFont);
            hint.textContent = hintText;
            mapWrap.appendChild(hint);
        }

        // ---- card -----------------------------------------------------------
        var card = document.createElement("aside");
        card.className = "msm-card";
        card.setAttribute("aria-hidden", "true");
        card.style.cssText =
            "position:absolute;right:0;bottom:0;background:" + panelBackground + ";" +
            // Starts closed. Without this the card's transform is `none` — i.e.
            // fully open — until the first sync() pushes it off-screen.
            "transform:translate(100%, 0);" +
            "transition:transform " + DUR + "ms " + EASE + ";overflow-y:auto;overflow-x:hidden;" +
            "overscroll-behavior:contain;scrollbar-width:thin;" +
            "scrollbar-color:rgba(255,255,255,0.18) transparent;" +
            "box-sizing:border-box;display:flex;flex-direction:column;" +
            "gap:22px;z-index:2";
        host.appendChild(card);

        function section(label, text, color) {
            var wrap = document.createElement("div");
            wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
            var lab = document.createElement("span");
            applyFont(lab, labelFont, { color: "rgba(255,255,255,0.38)" });
            lab.textContent = label;
            var p = document.createElement("p");
            applyFont(p, bodyFont, { color: color, margin: "0" });
            p.textContent = text;
            wrap.appendChild(lab);
            wrap.appendChild(p);
            return wrap;
        }

        function renderCard(site, isMobile) {
            card.innerHTML = "";
            if (!site) return;

            var h2 = document.createElement("h2");
            applyFont(h2, titleFont, {
                color: "#ffffff", margin: "0",
                fontSize: isMobile ? "24px" : titleFont.fontSize
            });
            h2.textContent = site.city + ", " + site.abbr;
            card.appendChild(h2);

            var op = document.createElement("span");
            applyFont(op, labelFont, { color: "rgba(255,255,255,0.42)", marginTop: "-12px" });
            op.textContent = site.operator;
            card.appendChild(op);

            var figure = document.createElement("div");
            figure.style.cssText =
                "width:100%;aspect-ratio:16 / 9;overflow:hidden;background:#151515;flex-shrink:0";
            var img = document.createElement("img");
            img.src = site.image;
            img.alt = site.imageAlt;
            img.style.cssText =
                "width:100%;height:100%;object-fit:cover;" +
                "filter:grayscale(0.35) contrast(1.05) brightness(0.95);display:block";
            figure.appendChild(img);
            card.appendChild(figure);

            card.appendChild(section("Why it matters", site.why, panelTextColor));

            var rule = document.createElement("div");
            rule.style.cssText = "height:1px;width:100%;background:rgba(255,255,255,0.16);flex-shrink:0";
            card.appendChild(rule);

            card.appendChild(section("Community angle", site.community, panelTextColor));
            card.appendChild(section("Sources", site.sources, "rgba(255,255,255,0.45)"));
        }

        // ---- selection --------------------------------------------------------
        function select(site) {
            selectedId = site.id;
            view = { k: zoomLevel, fx: site.x, fy: site.y };
            pan = { x: 0, y: 0 };
            sync();
        }

        function reset() {
            selectedId = null;
            view = { k: 1, fx: CX, fy: CY };
            pan = { x: 0, y: 0 };
            sync();
        }

        window.addEventListener("keydown", function (e) {
            if (e.key === "Escape") reset();
        });

        // ---- pan / zoom -------------------------------------------------------
        mapWrap.addEventListener("pointerdown", function (e) {
            drag = { active: true, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: 0 };
        });
        mapWrap.addEventListener("pointermove", function (e) {
            if (!drag.active) return;
            var dx = e.clientX - drag.sx;
            var dy = e.clientY - drag.sy;
            drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
            if (drag.moved > 3) {
                if (!dragging) { dragging = true; }
                var m = metrics();
                pan = { x: drag.ox + dx * m.unit, y: drag.oy + dy * m.unit };
                sync();
            }
        });
        function endDrag() {
            drag.active = false;
            if (dragging) { dragging = false; sync(); }
        }
        mapWrap.addEventListener("pointerup", function () {
            var moved = drag.moved;
            endDrag();
            if (moved > 3) return;
            if (selectedId !== null) reset();
        });
        mapWrap.addEventListener("pointercancel", endDrag);
        mapWrap.addEventListener("pointerleave", endDrag);

        if (enableZoom) {
            host.addEventListener("wheel", function (e) {
                // Let the community card scroll its own overflow instead of
                // zooming the map out from under it.
                if (card.contains(e.target)) return;
                e.preventDefault();
                var next = Math.min(5, Math.max(0.85, view.k * (e.deltaY > 0 ? 0.9 : 1.1)));
                view.k = next;
                sync();
            }, { passive: false });
        }

        // ---- derived layout ----------------------------------------------------
        function metrics() {
            var isMobile = size.w < 860;
            var panelOpen = selectedId !== null;
            var panelW = isMobile ? size.w : Math.max(320, Math.min(520, Math.round(size.w * 0.33)));
            var panelH = isMobile ? Math.round(size.h * 0.58) : size.h;
            var mapW = isMobile ? size.w : size.w - (panelOpen ? panelW : 0);
            var mapH = isMobile ? size.h - (panelOpen ? panelH : 0) : size.h;
            var s = Math.min(mapW / VB_W, mapH / VB_H);
            var unit = s > 0 ? 1 / s : 1;
            return {
                isMobile: isMobile, panelOpen: panelOpen, panelW: panelW, panelH: panelH,
                mapW: mapW, mapH: mapH, unit: unit
            };
        }

        var lastSelected = " ";

        function sync() {
            var m = metrics();
            var k = view.k;
            var tx = CX - k * view.fx + pan.x;
            var ty = CY - k * view.fy + pan.y;
            var px = m.unit / k;
            var markerR = m.isMobile ? 6.5 : 9;
            var nameSize = m.isMobile ? 9 : 13;
            var nameTracking = m.isMobile ? "0.16em" : "0.3em";
            var motion = dragging ? "none" : "transform " + DUR + "ms " + EASE;

            mapWrap.style.width = m.mapW + "px";
            mapWrap.style.height = m.mapH + "px";
            mapWrap.style.cursor = dragging ? "grabbing" : "grab";

            group.setAttribute("transform", "translate(" + tx + " " + ty + ") scale(" + k + ")");
            group.style.transition = motion;

            pattern.setAttribute("patternTransform", "scale(" + px + ")");
            nebulaCircles.forEach(function (o) { o.node.setAttribute("r", o.n.r / k); });
            starCircles.forEach(function (o) { o.node.setAttribute("r", o.s.r * px); });

            labelGroups.forEach(function (o) {
                o.g.setAttribute("transform", "translate(" + o.l.x + " " + o.l.y + ") scale(" + px + ")");
                o.g.style.transition = motion;
                o.t.style.fontSize = nameSize + "px";
                o.t.style.letterSpacing = nameTracking;
            });

            markerNodes.forEach(function (o) {
                var isSel = o.site.id === selectedId;
                var isHov = o.site.id === hoverId;
                var active = isSel || isHov;
                o.g.setAttribute("transform",
                    "translate(" + o.site.x + " " + o.site.y + ") scale(" + px + ")");
                o.g.style.transition = motion;
                o.halo.setAttribute("r", markerR * 4.2);
                o.halo.setAttribute("opacity", active ? 1 : 0.75);
                o.ring.setAttribute("r", markerR * (active ? 2.2 : 1.7));
                o.ring.setAttribute("opacity", active ? 0.7 : 0);
                o.core.setAttribute("r", markerR * (active ? 1.17 : 1));
                o.name.setAttribute("y", -markerR * 3.3);
                o.name.setAttribute("opacity", isHov && !isSel ? 1 : 0);
            });

            back.style.left = (m.isMobile ? 20 : 40) + "px";
            back.style.top = (m.isMobile ? 20 : 40) + "px";
            back.style.width = (m.isMobile ? 48 : 62) + "px";
            back.style.height = (m.isMobile ? 48 : 62) + "px";
            back.style.opacity = m.panelOpen ? "1" : "0";
            back.style.transform = m.panelOpen
                ? "translateY(0) scale(1)"
                : "translateY(-8px) scale(0.9)";
            back.style.pointerEvents = m.panelOpen ? "auto" : "none";
            var bsvg = back.querySelector("svg");
            bsvg.setAttribute("width", m.isMobile ? 20 : 26);
            bsvg.setAttribute("height", m.isMobile ? 20 : 26);

            caption.style.display = m.isMobile ? "block" : "none";
            caption.style.opacity = m.panelOpen ? "0" : "1";

            if (hint) {
                hint.style.left = (m.isMobile ? 20 : 40) + "px";
                hint.style.bottom = (m.isMobile ? 20 : 36) + "px";
                hint.style.opacity = m.panelOpen ? "0" : "1";
            }

            card.style.width = m.isMobile ? "100%" : m.panelW + "px";
            card.style.height = m.isMobile ? m.panelH + "px" : "100%";
            card.style.borderLeft = m.isMobile ? "none" : "1px solid rgba(255,255,255,0.1)";
            card.style.borderTop = m.isMobile ? "1px solid rgba(255,255,255,0.1)" : "none";
            card.style.padding = m.isMobile ? "28px 24px 36px" : "44px 40px 56px";
            card.style.transform = m.panelOpen
                ? "translate(0, 0)"
                : (m.isMobile ? "translate(0, 100%)" : "translate(100%, 0)");
            card.setAttribute("aria-hidden", m.panelOpen ? "false" : "true");

            var key = String(selectedId) + "|" + m.isMobile;
            if (key !== lastSelected) {
                lastSelected = key;
                var site = null;
                for (var i = 0; i < SITES.length; i++) {
                    if (SITES[i].id === selectedId) { site = SITES[i]; break; }
                }
                renderCard(site, m.isMobile);
            }
        }

        var ro = new ResizeObserver(function (entries) {
            var r = entries[0].contentRect;
            size = { w: Math.round(r.width), h: Math.round(r.height) };
            sync();
        });
        ro.observe(host);

        // Lay the map out once with every transition suppressed, so the page
        // opens on a finished map rather than on the tail of an animation.
        host.classList.add("msm-booting");
        size = { w: host.clientWidth || 1200, h: host.clientHeight || 800 };
        sync();
        function unfreeze() { host.classList.remove("msm-booting"); }
        requestAnimationFrame(function () { requestAnimationFrame(unfreeze); });
        // rAF is paused in a hidden tab; without this the map would stay frozen.
        setTimeout(unfreeze, 250);
    };
})();
