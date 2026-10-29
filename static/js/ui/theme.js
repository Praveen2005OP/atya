// ── Theme toggle (dark / light) with the animated sun rays ───────────────────

const THEME_KEY = "atyaTheme";

function buildToggleRays(svgEl) {
    if (!svgEl) return;
    svgEl.innerHTML = "";
    const count = 8, cx = 33, cy = 33, innerR = 22, outerR = 30;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", cx + Math.cos(angle) * innerR);
        line.setAttribute("y1", cy + Math.sin(angle) * innerR);
        line.setAttribute("x2", cx + Math.cos(angle) * outerR);
        line.setAttribute("y2", cy + Math.sin(angle) * outerR);
        line.setAttribute("stroke", "#f5a623");
        line.setAttribute("stroke-width", "2.5");
        line.setAttribute("stroke-linecap", "round");
        svgEl.appendChild(line);
    }
}

let _rayAnimFrame;
function startRayAnimation() {
    const svgEl = document.getElementById("themeRaysSvg");
    buildToggleRays(svgEl);
    let angle = 0;
    function step() {
        if (svgEl) svgEl.style.transform = `rotate(${angle}deg)`;
        angle += 0.4;
        _rayAnimFrame = requestAnimationFrame(step);
    }
    if (_rayAnimFrame) cancelAnimationFrame(_rayAnimFrame);
    step();
}

export function initTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem(THEME_KEY);
    } catch {
        // Storage blocked - fall back to the default dark theme.
    }
    if (savedTheme === "light") document.documentElement.classList.add("light");
    startRayAnimation();

    document.querySelector("#themeToggle")?.addEventListener("click", () => {
        const isLight = document.documentElement.classList.toggle("light");
        try {
            localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
        } catch {
            // Theme still switches for this page view.
        }
    });
}
