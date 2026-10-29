// ═══════════════════════════════════════════════════════════════════════
// Home Page Animations (GSAP + ScrollTrigger)
// ═══════════════════════════════════════════════════════════════════════
// gsap / ScrollTrigger come from the CDN <script> tags in base.html. If the
// CDN fails to load, animations are skipped instead of breaking the page.

const { gsap, ScrollTrigger } = window;
const hasGsap = Boolean(gsap && ScrollTrigger);
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

export function initHomeAnimations() {
    if (!hasGsap || !document.querySelector("#homePage")) return;

    initHeroAnimation();
    initBrandsAnimation();
    initFinderAnimation();
    initCompareAnimation();
    initPurposeAnimation();
    initGarageAnimation();

    window.addEventListener("load", () => ScrollTrigger.refresh());
}

// ── Hero Section Animation ───────────────────────────────────────
function initHeroAnimation() {
    if (!document.querySelector(".hero")) return;

    if (prefersReducedMotion) {
        gsap.set(
            ".eyebrow, .hero h1, .hero-lede, .hero-search, .quick-picks button, .hero-copy, .hero-visual",
            { clearProps: "all" }
        );
        return;
    }

    const heroTL = gsap.timeline({
        defaults: { duration: 0.9, ease: "power3.out" }
    });

    heroTL
        .from(".hero .eyebrow", { y: 10, opacity: 0 })
        .from(".hero h1", { y: 50, opacity: 0 }, "-=0.55")
        .from(".hero-lede", { y: 25, opacity: 0 }, "-=0.45")
        .from(".hero-search", { y: 5, opacity: 0, scale: 0.96 }, "-=0.45")
        .from(".quick-picks button", {
            y: 20, scale: 0.7, opacity: 0, stagger: 0.08, ease: "back.out(2)"
        }, "-=0.35")
        .set(".quick-picks button", { clearProps: "transform" });

    gsap.to(".hero-copy", {
        y: -100, opacity: 0, ease: "none",
        scrollTrigger: {
            trigger: ".hero", start: "top top", end: "bottom top",
            scrub: true, invalidateOnRefresh: true
        }
    });

    gsap.to(".hero-visual", {
        y: -60, opacity: 0, ease: "none",
        scrollTrigger: {
            trigger: ".hero", start: "top top", end: "bottom top",
            scrub: true, invalidateOnRefresh: true
        }
    });
}

// ── Brands Section - heading only, cards stay static ────────────────
function initBrandsAnimation() {
    if (!document.querySelector("#brands")) return;

    if (prefersReducedMotion) {
        gsap.set("#brands .section-heading", { clearProps: "all" });
        return;
    }

    gsap.from("#brands .section-heading > *", {
        y: 10, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: "#brands", start: "top 70%", toggleActions: "play none none reverse" }
    });

    gsap.to("#brands .section-heading", {
        y: -20, opacity: 0, ease: "none",
        scrollTrigger: {
            trigger: "#brands", start: "top top", end: "bottom top",
            scrub: true, invalidateOnRefresh: true
        }
    });
}

// ── Finder Section - panel reveal, cards handled by animateCarCards ─
function initFinderAnimation() {
    if (!document.querySelector("#explore")) return;

    if (prefersReducedMotion) {
        gsap.set("#explore .finder-heading > *, #explore .finder-panel > *", { clearProps: "all" });
        return;
    }

    gsap.from("#explore .finder-heading > *, #explore .finder-panel > *", {
        y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: "#explore", start: "top 70%", toggleActions: "play none none reverse" }
    });
}

// ScrollTrigger.refresh() cancels a smooth scroll that's still running
// (e.g. after a purpose / brand click), so wait until scrolling stops.
let refreshTimer;
function refreshWhenScrollIdle() {
    clearTimeout(refreshTimer);
    const refresh = () => {
        window.removeEventListener("scroll", onScroll);
        ScrollTrigger.refresh();
    };
    const onScroll = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    refreshTimer = setTimeout(refresh, 200);
}

// Tracks how many car cards have already been revealed, so a
// re-render (Show More / filtering) only animates newly added cards.
let animatedCarCount = 0;

// Called by renderCars() (home/car-grid.js) every time #carGrid is rebuilt.
export function animateCarCards() {
    if (!hasGsap || prefersReducedMotion) return;

    const cards = gsap.utils.toArray("#carGrid .car-card");
    const newCards = cards.slice(animatedCarCount);
    animatedCarCount = cards.length;
    if (!newCards.length) return;

    gsap.fromTo(newCards,
        { y: 20, opacity: 0, scale: 0.96 },
        {
            y: 0, opacity: 1, scale: 1,
            duration: 0.45, stagger: 0.05, ease: "power2.out",
            overwrite: "auto",
            onComplete: refreshWhenScrollIdle
        }
    );
}

// ── Compare Section ──────────────────────────────────────────────────
function initCompareAnimation() {
    if (!document.querySelector("#compare")) return;

    if (prefersReducedMotion) {
        gsap.set("#compare .section-heading, #compare .comparison-layout", { clearProps: "all" });
        return;
    }

    gsap.from("#compare .section-heading, #compare .comparison-layout", {
        y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: "#compare", start: "top 70%", toggleActions: "play none none reverse" }
    });
}

// ── Purpose Section ──────────────────────────────────────────────────
function initPurposeAnimation() {
    const section = document.querySelector(".purpose-section");
    if (!section) return;

    if (prefersReducedMotion) {
        gsap.set(
            [section.querySelector(".section-heading"), ...section.querySelectorAll(".purpose-grid button")],
            { clearProps: "all" }
        );
        return;
    }

    const purposeReveal = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 70%", toggleActions: "play none none reverse" }
    });

    purposeReveal
        .from(section.querySelector(".section-heading"), { y: 40, opacity: 0, duration: 0.7, ease: "power3.out" })
        .from(section.querySelectorAll(".purpose-grid button"), {
            y: 20, opacity: 0, scale: 0.95, stagger: 0.06, duration: 0.5, ease: "power2.out"
        }, "-=0.3");
}

// ── Garage Section - heading only ────────────────────────────────────
function initGarageAnimation() {
    if (!document.querySelector("#saved")) return;

    if (prefersReducedMotion) {
        gsap.set("#saved .section-heading", { clearProps: "all" });
        return;
    }

    gsap.from("#saved .section-heading", {
        y: 40, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: "#saved", start: "top 70%", toggleActions: "play none none reverse" }
    });
}