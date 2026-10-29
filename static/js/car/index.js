// ── Car detail page ──────────────────────────────────────────────────────────

import { store, state, persistSavedCars } from "../core/state.js";
import { readJsonScript } from "../core/dom.js";
import { normalizeCar } from "../core/cars.js";
import { initVariantCompare } from "./variant-compare.js";
import { initViewer360 } from "./viewer360.js";
import { initColors } from "./colors.js";
import { initReviews } from "./reviews.js";

// "Save to garage" in the car hero - shares the garage with the homepage.
function initSaveButton() {
    const button = document.querySelector(".detail-actions [data-save]");
    if (!button) return;
    const id = button.dataset.save;
    const label = () => {
        button.textContent = state.saved.includes(id) ? "Saved to garage ✓" : "Save to garage";
    };
    button.addEventListener("click", () => {
        state.saved = state.saved.includes(id)
            ? state.saved.filter((savedId) => savedId !== id)
            : [...state.saved, id];
        persistSavedCars();
        label();
    });
    label();
}

export function initCarPage() {
    const rawCar = readJsonScript("current-car-data");
    if (!rawCar) return;
    store.currentCar = normalizeCar(rawCar);

    initSaveButton();
    initVariantCompare();
    initViewer360();
    initColors();
    initReviews();
}
