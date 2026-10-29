// ── Garage (saved cars, kept in localStorage) ────────────────────────────────

import { state, persistSavedCars } from "../core/state.js";
import { els } from "../core/dom.js";
import { formatPrice, formatSafety } from "../core/format.js";
import { findCar } from "../core/cars.js";

export function renderSaved() {
    if (!els.savedGrid) return;
    const savedCars = state.saved.map(findCar).filter(Boolean);
    els.savedGrid.innerHTML = savedCars.map((car) => `
        <article class="saved-card">
            <figure>
                <img src="${car.images.hero}" alt="${car.name}" loading="lazy" />
            </figure>
            <div class="saved-body">
                <div>
                    <span class="badge">${car.brand}</span>
                    <h3>${car.name}</h3>
                    <p>${formatPrice(car.priceMin, car.priceMax)} · ${formatSafety(car.safety)}</p>
                    <div class="card-actions">
                        <button class="secondary-button" type="button" data-details="${car.id}">Open</button>
                        <button class="secondary-button" type="button" data-save="${car.id}">Remove</button>
                    </div>
                </div>
            </div>
        </article>
    `).join("");
}

export function toggleSave(id) {
    state.saved = state.saved.includes(id)
        ? state.saved.filter((savedId) => savedId !== id)
        : [...state.saved, id];
    persistSavedCars();
}
