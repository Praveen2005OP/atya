// ── Cached DOM references ────────────────────────────────────────────────────
// Modules run after the HTML is parsed, so these lookups are safe here.
// Anything missing on the current page is simply null.

export const els = {
    header: document.querySelector(".site-header"),
    search: document.querySelector("#globalSearch"),
    heroSearch: document.querySelector("#heroSearch"),
    brandGrid: document.querySelector("#brandGrid"),
    carGrid: document.querySelector("#carGrid"),
    resultCount: document.querySelector("#resultCount"),
    budget: document.querySelector("#budgetFilter"),
    body: document.querySelector("#bodyFilter"),
    fuel: document.querySelector("#fuelFilter"),
    transmission: document.querySelector("#transmissionFilter"),
    safety: document.querySelector("#safetyFilter"),
    reset: document.querySelector("#resetFilters"),
    comparePicker: document.querySelector("#comparePicker"),
    compareOutput: document.querySelector("#compareOutput"),
    savedGrid: document.querySelector("#savedGrid"),
    themeToggle: document.querySelector("#themeToggle"),
};

export function scrollToExplore() {
    document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" });
}

// Reads a {{ value|json_script:"id" }} island; null if it isn't on the page.
export function readJsonScript(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        console.error(`Could not parse #${id}:`, error);
        return null;
    }
}
