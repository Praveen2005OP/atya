// ── Finder heading: rounded "card" look while pinned ─────────────────────────
// .finder-heading is position: sticky (styles.css). When it's pinned under
// the header the filters have scrolled away, so it gets .is-stuck to close
// its bottom corners.

export function initFinderHeading() {
    const heading = document.getElementById("finderHeading");
    if (!heading) return;

    let ticking = false;
    const update = () => {
        ticking = false;
        const style = getComputedStyle(heading);
        if (style.position !== "sticky") {
            heading.classList.remove("is-stuck");
            return;
        }
        const stickyTop = parseFloat(style.top) || 0;
        const panel = heading.nextElementSibling;
        const pinned = heading.getBoundingClientRect().top <= stickyTop + 1;
        // Only once the filters have actually slid under the heading.
        const filtersGone = !panel || panel.getBoundingClientRect().top < heading.getBoundingClientRect().bottom - 1;
        heading.classList.toggle("is-stuck", pinned && filtersGone);
    };
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
}
