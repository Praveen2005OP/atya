// ── Explore by brand ─────────────────────────────────────────────────────────

import { store } from "../core/state.js";
import { els } from "../core/dom.js";
import { visibleCount, updateToggleButton } from "./pagination.js";

// [[brand, { count, min, max, sample }], ...] sorted by brand name.
export function brandSummary() {
    const map = new Map();
    store.cars.forEach((car) => {
        const current = map.get(car.brand) || { count: 0, min: car.priceMin, max: car.priceMax, sample: car.name };
        current.count += 1;
        current.min = Math.min(current.min, car.priceMin);
        current.max = Math.max(current.max, car.priceMax);
        map.set(car.brand, current);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function renderBrands() {
    if (!els.brandGrid) return;
    const brands = brandSummary();
    els.brandGrid.innerHTML = brands
        .slice(0, visibleCount("brands_card"))
        .map(([brand, info]) => `
            <button class="brand-card" type="button" data-brand="${brand}" data-initial="${brand.slice(0, 1)}">
                <div class="brand-logo">
                    <img src="/static/images/logos/${brand.toLowerCase().replace(/\s+/g, "")}.png" alt="${brand}">
                </div>
                <h3>${brand}</h3>
                <p>${info.sample} and ${Math.max(info.count - 1, 0)} more</p>
                <div class="meta-row">
                    <span class="badge">${info.count} cars</span>
                    <span class="badge">from INR ${info.min.toFixed(1)}L</span>
                </div>
            </button>
        `).join("");
    updateToggleButton("brands_card", brands.length);
}
