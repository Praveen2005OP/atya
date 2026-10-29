// ═══════════════════════════════════════════════════════════════════════
// Atya - JavaScript entry point
// Loaded on every page from base.html as <script type="module">.
// Each init function checks for its own section and does nothing when
// that section isn't on the current page.
//
//   core/        shared state, DOM refs, formatting, car data helpers
//   compare/     variant comparison table (homepage + car page)
//   home/        homepage: brands, finder, compare, garage
//   car/         car page: variant compare, 360°, colours, reviews
//   ui/          theme, header, hero image (all pages)
//   animations/  GSAP homepage animations
// ═══════════════════════════════════════════════════════════════════════

import { initTheme } from "./ui/theme.js";
import { initHeader } from "./ui/header.js";
import { initHeroImage } from "./ui/hero-image.js";
import { initHome } from "./home/index.js";
import { initCarPage } from "./car/index.js";

// One section failing shouldn't take the rest of the page down with it.
function safely(name, init) {
    try {
        init();
    } catch (error) {
        console.error(`[atya] ${name} failed:`, error);
    }
}

safely("theme", initTheme);
safely("header", initHeader);
safely("hero image", initHeroImage);
safely("home", initHome);
safely("car page", initCarPage);
