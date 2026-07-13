// ═══════════════════════════════════════════════════════════════════════
// Home Page Animations (GSAP + ScrollTrigger)
//
// Architecture
// ------------
// - initHomeAnimations() only registers SECTION-level ScrollTriggers
//   (headings, panels, fade-outs). It never touches dynamically
//   rendered cards directly, and it only runs once script.js has
//   finished rendering every grid (see loadCars() in script.js).
// - Every section owns its own independent init function
//   (initHeroAnimation, initBrandsAnimation, initFinderAnimation,
//   initCompareAnimation, initPurposeAnimation, initGarageAnimation)
//   so this file can later be split into home.js / detail.js / common.js
//   without touching unrelated sections.
// - Brand cards are intentionally static (no entrance, no scroll
//   fade) - only the Brands section heading animates. Car cards
//   still animate: car cards are re-rendered on demand (Show More /
//   Show Less, filtering), and animateCarCards() is called by
//   script.js right after each re-render, only animating cards that
//   weren't already on screen so existing ones never replay.
// ═══════════════════════════════════════════════════════════════════════

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Reduced Motion Support
// Read once at load. Anyone with "Reduce Motion" enabled at the
// OS/browser level never gets the intro timeline, scroll-scrub
// fades, or stagger reveals below - content simply appears in
// its resting state instantly. Every init*Animation() function
// and both card-reveal functions check this flag first.
// (WCAG 2.3.3, Apple HIG Reduced Motion, Material Motion)
// ─────────────────────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

// Home Page - wires up every section, cards excluded (see above)
function initHomeAnimations() {
    if (!document.querySelector("#homePage")) return;

    initHeroAnimation();
    initBrandsAnimation();
    initFinderAnimation();
    initCompareAnimation();
    initPurposeAnimation();
    initGarageAnimation();

    // Images (brand logos, hero art, car photos) can still be loading
    // when the ScrollTriggers above are created, which shifts section
    // heights. One refresh once everything has loaded keeps every
    // trigger's start/end position accurate.
    window.addEventListener("load", () => ScrollTrigger.refresh());
}

// ─────────────────────────────────────────────────────────────
// Hero Section Animation
// Handles:
// 1. Intro animation when page loads
// 2. Hero fade-out while scrolling
// 3. Hero image fade-out while scrolling
// Left exactly as-is - this section's animation is already final.
// ─────────────────────────────────────────────────────────────
function initHeroAnimation() {

    // Stop execution if Hero section doesn't exist
    if (!document.querySelector(".hero")) return;

    if (prefersReducedMotion) {
        // Skip the intro timeline and the scroll-scrubbed fade-outs
        // entirely - everything just appears in its resting state.
        gsap.set(
            ".eyebrow, .hero h1, .hero-lede, .hero-search, .quick-picks button, .hero-copy, .hero-visual",
            { clearProps: "all" }
        );
        return;
    }

    // Check if current device is Desktop
    // (Useful later for mouse-parallax or desktop-only effects)
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // ==========================================================
    // HERO INTRO TIMELINE
    // Plays once when the page loads.
    // Elements appear one after another for a cinematic entrance.
    // ==========================================================
    const heroTL = gsap.timeline({
        defaults: {
            duration: 0.9,
            ease: "power3.out"
        }
    });

    heroTL
        // Reveal eyebrow text
        .from(".hero .eyebrow", {
            y: 10,
            opacity: 0
        })
        // Reveal main heading
        .from(".hero h1", {
            y: 50,
            opacity: 0
        }, "-=0.55")
        // Reveal description
        .from(".hero-lede", {
            y: 25,
            opacity: 0
        }, "-=0.45")
        // Reveal search bar
        .from(".hero-search", {
            y: 5,
            opacity: 0,
            scale: 0.96
        }, "-=0.45")
        // Reveal quick pick buttons with stagger
        .from(".quick-picks button", {
            y: 20,
            scale: 0.7,
            opacity: 0,
            stagger: 0.08,
            ease: "back.out(2)"
        }, "-=0.35")

        // Remove inline transform after intro animation
        // This allows CSS :hover effects to work normally.
        .set(".quick-picks button", {
            clearProps: "transform"
        });

    // ==========================================================
    // HERO CONTENT FADE OUT
    // Hero text moves upward and fades away
    // while scrolling to the next section.
    // ==========================================================
    gsap.to(".hero-copy", {
        y: -100,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
            // Without this, ScrollTrigger.refresh() (fired every time
            // Show More adds cards below and grows page height) can
            // leave this tween's cached start values stale, causing
            // it to get stuck faded-out instead of fading back in.
            invalidateOnRefresh: true
        }
    });

    // ==========================================================
    // HERO IMAGE SCROLL EFFECT
    // Image follows the hero content and fades away
    // to create a smooth section transition.
    // ==========================================================
    gsap.to(".hero-visual", {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true
        }
    });

}

// ─────────────────────────────────────────────────────────────
// Brands Section Animation
// Only the heading block (eyebrow + title + description) animates
// - entrance reveal and scroll-out fade. The Show More button and
// the brand cards themselves are intentionally left static (no
// entrance, no scroll fade) per design decision.
// ─────────────────────────────────────────────────────────────
function initBrandsAnimation() {

    // Exit if Brands section doesn't exist
    if (!document.querySelector("#brands")) return;

    if (prefersReducedMotion) {
        gsap.set("#brands .section-heading", { clearProps: "all" });
        return;
    }

    // ==========================================================
    // HEADING REVEAL
    // Eyebrow, title, and description reveal one after another
    // instead of moving as a single flat block - reads more
    // intentional. Runs once when the section enters the viewport.
    // ==========================================================
    gsap.from("#brands .section-heading > *", {
        y: 10,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#brands",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

    // ==========================================================
    // HEADING FADE OUT
    // Tied to the heading's OWN position, not the whole (much
    // taller) Brands section - so it fades exactly as it scrolls
    // past the top of the viewport, regardless of how many rows
    // of cards are below it.
    // ==========================================================
    gsap.to("#brands .section-heading", {
        y: -20,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: "#brands",
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true
        }
    });

}

// ─────────────────────────────────────────────────────────────
// Finder Section Animation
// Reveals the search/filter panel when it enters the viewport.
// Car card entrance is handled separately by animateCarCards().
// ─────────────────────────────────────────────────────────────
function initFinderAnimation() {

    if (!document.querySelector("#explore")) return;

    if (prefersReducedMotion) {
        gsap.set("#explore .finder-panel > *", { clearProps: "all" });
        return;
    }

    gsap.from("#explore .finder-panel > *", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#explore",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

}

// ─────────────────────────────────────────────────────────────
// Compare Section Animation
// ─────────────────────────────────────────────────────────────
function initCompareAnimation() {

    if (!document.querySelector("#compare")) return;

    if (prefersReducedMotion) {
        gsap.set("#compare .section-heading, #compare .comparison-layout", {
            clearProps: "all"
        });
        return;
    }

    gsap.from("#compare .section-heading, #compare .comparison-layout", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#compare",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

}

// ─────────────────────────────────────────────────────────────
// Purpose Section Animation
// ─────────────────────────────────────────────────────────────
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
        scrollTrigger: {
            trigger: section,
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

    purposeReveal
        .from(section.querySelector(".section-heading"), {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out"
        })
        .from(section.querySelectorAll(".purpose-grid button"), {
            y: 20,
            opacity: 0,
            scale: 0.95,
            stagger: 0.06,
            duration: 0.5,
            ease: "power2.out"
        }, "-=0.3");

}

// ─────────────────────────────────────────────────────────────
// Garage Section Animation
// Saved cards themselves change through user actions (Save /
// Remove) rather than pagination, so only the heading is
// animated here to keep the section feeling consistent.
// ─────────────────────────────────────────────────────────────
function initGarageAnimation() {

    if (!document.querySelector("#saved")) return;

    if (prefersReducedMotion) {
        gsap.set("#saved .section-heading", { clearProps: "all" });
        return;
    }

    gsap.from("#saved .section-heading", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#saved",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

}