// ── Site header: shadow on scroll + "Find Cars" button ───────────────────────

// Exposes the header's live height as --header-height, so sticky things
// (e.g. the finder heading) pin right under it at every breakpoint.
function trackHeaderHeight(header) {
    const update = () => {
        document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    };
    update();
    if ("ResizeObserver" in window) {
        new ResizeObserver(update).observe(header);
    } else {
        window.addEventListener("resize", update);
    }
}

export function initHeader() {
    const header = document.querySelector(".site-header");
    if (header) trackHeaderHeight(header);
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
