// ── Site header: shadow on scroll + "Find Cars" button ───────────────────────

export function initHeader() {
    const header = document.querySelector(".site-header");
    document.addEventListener("scroll", () => {
        header?.classList.toggle("scrolled", window.scrollY > 16);
    }, { passive: true });

    // [data-scroll-target] buttons (e.g. "Find Cars" in the nav) scroll to a
    // section on this page, or go to it on the homepage when it isn't here.
    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-scroll-target]");
        if (!button) return;
        const id = button.dataset.scrollTarget;
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        } else {
            window.location.href = `/#${id}`;
        }
    });
}
