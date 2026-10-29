// ── Car page: compare this car's variants (checkboxes in variants.html) ──────

import { store, state } from "../core/state.js";
import { getVariants } from "../core/cars.js";
import { renderGroupedComparisonTable } from "../compare/table.js";

const MAX_VARIANTS = 3;

function renderVariantComparison() {
    const container = document.getElementById("variantComparisonContent");
    const car = store.currentCar;
    if (!container || !car) return;

    const variants = getVariants(car);
    const selected = (state.variantCompare[car.id] || [])
        .map((id) => variants.find((v) => v.id === id))
        .filter(Boolean)
        .map((variant) => ({ car, variant }));

    if (!selected.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Select variants from the list to compare them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = renderGroupedComparisonTable(selected);
}

export function initVariantCompare() {
    if (!store.currentCar) return;

    document.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-variant-compare]");
        if (!checkbox) return;
        const carId = checkbox.dataset.carId;
        const variantId = checkbox.dataset.variantCompare;
        const current = state.variantCompare[carId] || [];
        if (checkbox.checked) {
            // Keep at most three: adding a fourth drops the oldest.
            state.variantCompare[carId] = current.includes(variantId)
                ? current
                : [...current.slice(Math.max(0, current.length - (MAX_VARIANTS - 1))), variantId];
        } else {
            state.variantCompare[carId] = current.filter((id) => id !== variantId);
        }
        renderVariantComparison();
    });

    document.getElementById("differenceToggle")?.addEventListener("change", (event) => {
        state.compareSettings.differencesOnly = event.target.checked;
        renderVariantComparison();
    });

    renderVariantComparison();
}
