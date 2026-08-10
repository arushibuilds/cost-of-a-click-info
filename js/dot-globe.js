/* ==========================================================================
   DotGlobe — vanilla port of the Framer code component `DotGlobe.tsx`.
   Raw-WebGL dot-matrix globe: one point-cloud draw call, rotation, tilt,
   hidden-hemisphere culling and shading all in the vertex shader, plus the
   atmospheric treatment (glow -> canvas -> scrim -> grain) and a brief
   periodic glitch: band displacement + a neon community point.

   Requires land-bits.js (window.LAND_BITS) to be loaded first.
   ========================================================================== */
(function () {
    "use strict";

    var LAT_STEP = 1.15; // degrees between dot rows — must match the baked mask

    var VERT = [
        "attribute vec3 aPos;",
        "attribute float aLand;",
        "uniform float uTime;",
        "uniform float uRotSpeed;",
        "uniform float uTilt;",
        "uniform vec3  uLightDir;",
        "uniform float uSize;",
        "uniform float uRadius;",
        "uniform vec2  uViewport;",
        "uniform vec2  uCenter;",
        "uniform float uLandBase;",
        "uniform float uLandLight;",
        "uniform float uRimGain;",
        "uniform float uOceanGain;",
        "uniform float uGlitchAmp;",
        "uniform float uSeed;",
        "varying float vB;",
        "void main() {",
        "  float a = uTime * uRotSpeed;",
        "  float ca = cos(a), sa = sin(a);",
        "  vec3 q = vec3(aPos.x * ca + aPos.z * sa, aPos.y, -aPos.x * sa + aPos.z * ca);",
        "  float ct = cos(uTilt), st = sin(uTilt);",
        "  vec3 w = vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct);",
        "  if (w.z <= 0.02) {",
        "    vB = 0.0;",
        "    gl_PointSize = 0.0;",
        "    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);",
        "    return;",
        "  }",
        "  float light = max(0.0, dot(w, normalize(uLightDir)));",
        "  float limb = pow(1.0 - w.z, 2.4);",
        "  float rim = uRimGain * limb * (0.52 + 0.48 * light);",
        "  vB = aLand > 0.5 ? uLandBase + uLandLight * light + rim : rim * uOceanGain;",
        "  vec2 p = w.xy * uRadius + uCenter;",
        "  if (uGlitchAmp > 0.0) {",
        "    float cellY = floor((p.y + 4096.0) / 22.0);",
        "    float cellX = floor((p.x + 4096.0) / 74.0);",
        "    float rb = fract(sin(cellY * 91.37 + cellX * 47.71 + uSeed * 13.77) * 43758.5453);",
        "    float rs = fract(sin(cellY * 127.1 + cellX * 311.7 + uSeed * 71.31) * 43758.5453);",
        "    float on = step(0.48, rb);",
        "    p.x += uGlitchAmp * on * (rs - 0.5) * 2.0;",
        "    p.y += uGlitchAmp * on * (fract(rs * 7.31) - 0.5) * 0.55;",
        "    float dj = fract(sin(dot(aPos.xz, vec2(12.9898, 78.233)) + uSeed * 1.7) * 43758.5453);",
        "    p += uGlitchAmp * 0.34 * (vec2(dj, fract(dj * 3.71)) - 0.5);",
        "    vB += on * 0.05 + step(0.94, rb) * 0.3;",
        "  }",
        "  gl_Position = vec4(p / (uViewport * 0.5), 0.0, 1.0);",
        "  gl_PointSize = uSize;",
        "}"
    ].join("\n");

    var FRAG = [
        "precision mediump float;",
        "uniform vec3  uColor;",
        "uniform float uOpacity;",
        "varying float vB;",
        "void main() {",
        "  if (vB <= 0.004) discard;",
        "  float d = length(gl_PointCoord - 0.5) * 2.0;",
        "  float cov = smoothstep(1.0, 0.35, d);",
        "  if (cov <= 0.0) discard;",
        "  gl_FragColor = vec4(uColor, min(vB, 1.0) * cov * uOpacity);",
        "}"
    ].join("\n");

    var GRAIN_URL =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

    // Glitch cycle phases, seconds from cycle start.
    var GLITCH_END = 0.5;
    var REVEAL_START = 0.0;
    var REVEAL_FULL = 0.14;
    var REVEAL_HOLD = 0.7;
    var REVEAL_END = 1.2;
    var MARKER_SPREAD = 0.09;

    // Rows of constant latitude, longitude spacing corrected by cos(lat).
    function buildLattice() {
        var D2R = Math.PI / 180;
        var rows = Math.floor(179 / LAT_STEP) + 1;
        var pts = [];
        for (var r = 0; r < rows; r++) {
            var lat = -89.5 + r * LAT_STEP;
            if (lat > 89.5) break;
            var cos = Math.cos(lat * D2R);
            if (cos < 1e-3) continue;
            var count = Math.max(1, Math.round(360 / (LAT_STEP / cos)));
            for (var i = 0; i < count; i++) {
                pts.push([-180 + (360 * i) / count, lat]);
            }
        }
        return pts;
    }

    function toSphere(lon, lat) {
        var D2R = Math.PI / 180;
        var la = lat * D2R;
        var lo = lon * D2R;
        var c = Math.cos(la);
        return [c * Math.sin(lo), Math.sin(la), c * Math.cos(lo)];
    }

    // Same spin + tilt as the vertex shader, for placing the community marker.
    function rotatePoint(pos, angle, tiltRad) {
        var ca = Math.cos(angle);
        var sa = Math.sin(angle);
        var qx = pos[0] * ca + pos[2] * sa;
        var qy = pos[1];
        var qz = -pos[0] * sa + pos[2] * ca;
        var ct = Math.cos(tiltRad);
        var st = Math.sin(tiltRad);
        return [qx, qy * ct - qz * st, qy * st + qz * ct];
    }

    function toRgb(color) {
        var h = String(color || "#ffffff").trim();
        if (h.charAt(0) === "#") {
            h = h.slice(1);
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            var n = parseInt(h.slice(0, 6), 16);
            if (isNaN(n)) return [1, 1, 1];
            return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
        }
        var m = h.match(/rgba?\(([^)]+)\)/);
        if (m) {
            var p = m[1].split(",").map(parseFloat);
            return [p[0] / 255, p[1] / 255, p[2] / 255];
        }
        return [1, 1, 1];
    }

    function layerStyle(el) {
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.pointerEvents = "none";
    }

    window.initDotGlobe = function (host, options) {
        var o = options || {};
        var sizePct = o.sizePct != null ? o.sizePct : 46;
        var offsetX = o.offsetX != null ? o.offsetX : 0.27;
        var offsetY = o.offsetY != null ? o.offsetY : -0.02;
        var rotationPeriod = o.rotationPeriod != null ? o.rotationPeriod : 38.4;
        var tilt = o.tilt != null ? o.tilt : 18;
        var dotColor = o.dotColor || "#ffffff";
        var grainOpacity = o.grainOpacity != null ? o.grainOpacity : 0.06;
        var parallax = o.parallax != null ? o.parallax : 0.03;
        var mobileLayout = !!o.mobileLayout;
        var showGlow = o.showGlow !== false;
        var showScrim = o.showScrim !== false;
        var showGrain = o.showGrain !== false;
        var glitch = o.glitch !== false;
        var glitchInterval = o.glitchInterval != null ? o.glitchInterval : 4;
        var markers = o.markers || [];
        // Passed through verbatim, exactly as the Framer component does. The
        // canvas supplies `rgb(r, g, b)` strings, so the `${accentColor}59`
        // style concatenations below are not valid CSS colours and the browser
        // drops those declarations — which is why the published site renders
        // the community points as flat discs with no halo and no glow. Keeping
        // the strings unconverted reproduces that exactly.
        var accentColor = o.accentColor || "#4b7bd6";

        // keep whatever positioning the page gave the host (Framer wraps the
        // component in its own positioned container); only make it a
        // containing block when the page did not.
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        host.style.overflow = "hidden";
        host.style.pointerEvents = "none";
        host.setAttribute("aria-hidden", "true");

        if (showGlow) {
            var glow = document.createElement("div");
            layerStyle(glow);
            glow.style.background = mobileLayout
                ? "radial-gradient(70% 42% at 56% 78%, rgba(126,138,152,0.14) 0%, rgba(9,10,11,0) 72%)"
                : "radial-gradient(44% 50% at 78% 48%, rgba(126,138,152,0.045) 0%, rgba(94,104,118,0.02) 45%, rgba(9,10,11,0) 72%)";
            host.appendChild(glow);
        }

        var canvas = document.createElement("canvas");
        layerStyle(canvas);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.opacity = "0";
        canvas.style.transition = "opacity 1400ms cubic-bezier(0.22,0.61,0.36,1)";
        host.appendChild(canvas);

        // community points — placed and faded by the render loop
        var markerEls = markers.map(function () {
            var el = document.createElement("div");
            el.style.cssText =
                "position:absolute;left:0;top:0;width:6px;height:6px;margin-left:-3px;" +
                "margin-top:-3px;opacity:0;pointer-events:none;transition:opacity 80ms linear";
            var halo = document.createElement("div");
            halo.style.cssText =
                "position:absolute;left:50%;top:50%;width:30px;height:30px;margin-left:-15px;" +
                "margin-top:-15px;border-radius:50%;background:radial-gradient(circle, " +
                accentColor + "59 0%, " + accentColor + "1f 42%, transparent 70%)";
            var ring = document.createElement("div");
            ring.style.cssText =
                "position:absolute;inset:0;border-radius:50%;background:" + accentColor +
                ";box-shadow:0 0 5px 1px " + accentColor + ", 0 0 12px 3px " + accentColor +
                "b3, 0 0 22px 7px " + accentColor + "4d";
            var core = document.createElement("div");
            core.style.cssText =
                "position:absolute;left:50%;top:50%;width:2.5px;height:2.5px;margin-left:-1.25px;" +
                "margin-top:-1.25px;border-radius:50%;background:#ffffff";
            el.appendChild(halo);
            el.appendChild(ring);
            el.appendChild(core);
            host.appendChild(el);
            return el;
        });

        if (showScrim) {
            var scrim = document.createElement("div");
            layerStyle(scrim);
            scrim.style.background = mobileLayout
                ? "linear-gradient(180deg, rgba(9,10,11,0.96) 0%, rgba(9,10,11,0.86) 38%, rgba(9,10,11,0.45) 66%, rgba(9,10,11,0.1) 100%)"
                : "linear-gradient(90deg, #090a0b 0%, rgba(9,10,11,0.94) 24%, rgba(9,10,11,0.6) 42%, rgba(9,10,11,0) 62%)";
            host.appendChild(scrim);
        }

        if (showGrain) {
            var grain = document.createElement("div");
            layerStyle(grain);
            grain.style.inset = "-10%";
            grain.style.opacity = String(grainOpacity);
            grain.style.backgroundImage = GRAIN_URL;
            grain.style.backgroundRepeat = "repeat";
            host.appendChild(grain);
        }

        var gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: false,
            antialias: false,
            powerPreference: "high-performance"
        });
        if (!gl) return;

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        // geometry: lattice + baked land mask
        var pts = buildLattice();
        var bin = atob(window.LAND_BITS);
        var bits = new Uint8Array(bin.length);
        for (var b = 0; b < bin.length; b++) bits[b] = bin.charCodeAt(b);

        var positions = new Float32Array(pts.length * 3);
        var land = new Float32Array(pts.length);
        for (var i = 0; i < pts.length; i++) {
            var s = toSphere(pts[i][0], pts[i][1]);
            positions[i * 3] = s[0];
            positions[i * 3 + 1] = s[1];
            positions[i * 3 + 2] = s[2];
            land[i] = (bits[i >> 3] >> (i & 7)) & 1;
        }

        function bindAttr(name, data, size) {
            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            var loc = gl.getAttribLocation(prog, name);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        }
        bindAttr("aPos", positions, 3);
        bindAttr("aLand", land, 1);

        function U(name) { return gl.getUniformLocation(prog, name); }
        var uTime = U("uTime");
        var uSize = U("uSize");
        var uRadius = U("uRadius");
        var uViewport = U("uViewport");
        var uCenter = U("uCenter");
        var uGlitchAmp = U("uGlitchAmp");
        var uSeed = U("uSeed");

        var tiltRad = (tilt * Math.PI) / 180;
        var rotSpeed = (Math.PI * 2) / rotationPeriod;
        gl.uniform1f(U("uRotSpeed"), rotSpeed);
        gl.uniform1f(U("uTilt"), tiltRad);
        gl.uniform3f(U("uLightDir"), -0.55, 0.5, 0.38);
        gl.uniform1f(U("uLandBase"), 0.24);
        gl.uniform1f(U("uLandLight"), 0.34);
        gl.uniform1f(U("uRimGain"), 0.85);
        gl.uniform1f(U("uOceanGain"), 0.62);
        var c = toRgb(dotColor);
        gl.uniform3f(U("uColor"), c[0], c[1], c[2]);
        gl.uniform1f(U("uOpacity"), 1.0);
        gl.uniform1f(uGlitchAmp, 0);
        gl.uniform1f(uSeed, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);

        var DOT_SCALE = 0.0073; // dot diameter as a fraction of the globe radius
        var w = 1, h = 1, radius = 100, baseX = 0, baseY = 0, parallaxRange = 0;

        function layout() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = host.clientWidth;
            h = host.clientHeight;
            if (w < 1 || h < 1) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            radius = ((sizePct / 100) * w) / 2;
            baseX = offsetX * w;
            baseY = offsetY * h;
            parallaxRange = parallax * radius;
            gl.uniform2f(uViewport, w, h);
            gl.uniform1f(uRadius, radius);
            gl.uniform1f(uSize, Math.max(1, radius * DOT_SCALE * dpr));
        }
        layout();

        var markerPts = markers.map(function (m) { return toSphere(m.lon, m.lat); });
        var markerDelays = markers.map(function (m) {
            var hash = Math.sin(m.lat * 12.9898 + m.lon * 78.233) * 43758.5453;
            return (hash - Math.floor(hash)) * MARKER_SPREAD;
        });

        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var pointer = { tx: 0, ty: 0, x: 0, y: 0 };
        var elapsed = 0;
        var last = performance.now();
        var raf = 0;
        var running = false;
        var lastCycle = -1;
        var cycleActive = false;

        function render(now) {
            var cx = baseX - pointer.x * parallaxRange;
            var cy = baseY + pointer.y * parallaxRange * 0.6;

            var amp = 0;
            var ct = -1;
            if (glitch && !reducedMotion) {
                var ci = Math.floor(elapsed / glitchInterval);
                ct = elapsed - ci * glitchInterval;
                if (ci !== lastCycle) {
                    lastCycle = ci;
                    cycleActive = markerPts.some(function (mp) {
                        return rotatePoint(mp, elapsed * rotSpeed, tiltRad)[2] > 0.2;
                    });
                }
                if (!cycleActive) ct = -1;
                else if (ct < GLITCH_END) {
                    var g = ct / GLITCH_END;
                    var env = Math.sin(Math.PI * g) * (0.55 + 0.45 * Math.sin(g * 34.0));
                    amp = Math.max(0, env) * radius * 0.045;
                }
            }

            gl.uniform1f(uTime, elapsed);
            gl.uniform2f(uCenter, cx, cy);
            gl.uniform1f(uGlitchAmp, amp);
            gl.uniform1f(uSeed, amp > 0 ? (Math.floor(now / 45) % 997) + 1 : 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, pts.length);

            for (var i = 0; i < markerPts.length; i++) {
                var el = markerEls[i];
                if (!el) continue;
                var op = 0;
                if (ct >= 0) {
                    var t = ct - markerDelays[i];
                    if (t > REVEAL_START && t < REVEAL_END) {
                        if (t < REVEAL_FULL) op = (t - REVEAL_START) / (REVEAL_FULL - REVEAL_START);
                        else if (t > REVEAL_HOLD) op = (REVEAL_END - t) / (REVEAL_END - REVEAL_HOLD);
                        else op = 1;
                    }
                }
                var mw = rotatePoint(markerPts[i], elapsed * rotSpeed, tiltRad);
                if (op > 0 && mw[2] > 0.02) {
                    el.style.opacity = String(op * Math.min(1, mw[2] * 5));
                    el.style.transform = "translate3d(" +
                        (w / 2 + mw[0] * radius + cx) + "px, " +
                        (h / 2 - (mw[1] * radius + cy)) + "px, 0)";
                } else {
                    el.style.opacity = "0";
                }
            }
        }

        function tick(now) {
            if (!running) return;
            raf = requestAnimationFrame(tick);
            var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            elapsed += dt;
            var ease = 1 - Math.exp(-1.1 * dt);
            pointer.x += (pointer.tx - pointer.x) * ease;
            pointer.y += (pointer.ty - pointer.y) * ease;
            render(now);
        }
        function start() {
            if (running) return;
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(tick);
        }
        function stop() {
            running = false;
            cancelAnimationFrame(raf);
        }

        render(last);
        canvas.style.opacity = "1";
        if (!reducedMotion) start();

        var ro = new ResizeObserver(function () {
            layout();
            if (!running) render(performance.now());
        });
        ro.observe(host);

        window.addEventListener("pointermove", function (e) {
            if (reducedMotion || e.pointerType === "touch") return;
            pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
        document.addEventListener("pointerleave", function () {
            pointer.tx = 0;
            pointer.ty = 0;
        });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) stop();
            else if (!reducedMotion) start();
        });
    };
})();
