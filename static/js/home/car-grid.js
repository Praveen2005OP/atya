// ── Car finder: filters, search and the car grid ─────────────────────────────

import { store, state } from "../core/state.js";
import { els } from "../core/dom.js";
import { formatPrice, formatRange, formatSafety } from "../core/format.js";
import { visibleCount, updateToggleButton } from "./pagination.js";
import { animateCarCards } from "../animations/home.js";

// "Choose by purpose" buttons -> keywords matched against each car's
// overview.useCases (e.g. "Family", "Daily Commute", "Off-Road").
export const PURPOSES = {
    family: { label: "Family cars", keywords: ["family"] },
    daily: { label: "Daily commute", keywords: ["daily", "commute", "city", "urban"] },
    performance: { label: "Performance", keywords: ["performance", "track", "sport", "enthusiast"] },
    offroad: { label: "Off-road SUVs", keywords: ["off-road", "adventure"] },
    luxury: { label: "Luxury cars", keywords: ["status symbol", "chauffeur", "luxury", "bespoke"] },
    first: { label: "First cars", keywords: ["first", "value", "fuel efficien"], maxPrice: 10 },
};

function matchesPurpose(car) {
    const purpose = PURPOSES[state.purpose];
    if (!purpose) return true;
    const byUseCase = car.purpose.some((useCase) =>
        purpose.keywords.some((keyword) => useCase.includes(keyword))
    );
    const byPrice = purpose.maxPrice !== undefined && car.priceMin < purpose.maxPrice;
    return byUseCase || byPrice;
}

function matchesBudget(car) {
    if (state.budget === "all") return true;
    if (state.budget === "under10") return car.priceMin < 10;
    if (state.budget === "10to20") return car.priceMin <= 20 && car.priceMax >= 10;
    if (state.budget === "20to40") return car.priceMin <= 40 && car.priceMax >= 20;
    if (state.budget === "luxury") return car.priceMax >= 40;
    return true;
}

export function getFilteredCars() {
    const query = state.query.trim().toLowerCase();
    return store.cars.filter((car) => {
        const searchable = [car.name, car.brand, car.body, ...(car.fuel || []), ...(car.transmission || []), car.summary]
            .join(" ").toLowerCase();
        return (
            (!query || searchable.includes(query)) &&
            (state.selectedBrand === "all" || car.brand === state.selectedBrand) &&
            matchesBudget(car) &&
            matchesPurpose(car) &&
            (state.body === "all" || car.body === state.body) &&
            (state.fuel === "all" || car.fuel?.includes(state.fuel)) &&
            (state.transmission === "all" || car.transmission?.includes(state.transmission)) &&
            (state.safety === "all" || car.safety >= Number(state.safety))
        );
    });
}

function carCardHTML(car) {
    const saved = state.saved.includes(car.id);
    const comparing = state.compare.some((item) => item.carId === car.id);
    // data-card-details (not an inline onclick) so the Save / Compare
    // buttons inside the card don't also navigate to the car page.
    return `
        <article class="car-card" data-card-details="${car.id}" tabindex="0" role="button" aria-label="Open ${car.name} review and specifications">
            <figure>
                <img src="${car.images.hero}" alt="${car.name}" loading="lazy" />
            </figure>
            <div class="card-body">
                <div>
                    <span class="badge">${car.brand}</span>
                    <h3>${car.name}</h3>
                    <p>${car.minides}</p>
                </div>
                <div class="spec-grid">
                    <div class="spec-tile"><span>Price</span><strong>${formatPrice(car.priceMin, car.priceMax)}</strong></div>
                    <div class="spec-tile"><span>Power</span><strong>${formatRange(car.power, "hp")}</strong></div>
                    <div class="spec-tile"><span>Torque</span><strong>${formatRange(car.torque, "Nm")}</strong></div>
                    <div class="spec-tile"><span>Safety</span><strong>${formatSafety(car.safety)}</strong></div>
                </div>
                <div class="card-actions">
                    <button class="secondary-button" type="button" data-details="${car.id}">Read review</button>
                    <button class="secondary-button" type="button" data-save="${car.id}">${saved ? "Saved" : "Save"}</button>
                    <button class="primary-button" type="button" data-compare="${car.id}">${comparing ? "Selected" : "Compare"}</button>
                </div>
            </div>
        </article>
    `;
}

export function renderCars() {
    if (!els.carGrid) return;
    const filtered = getFilteredCars();
    if (els.resultCount) {
        const purposeLabel = PURPOSES[state.purpose]?.label;
        els.resultCount.textContent =
            `${filtered.length} car${filtered.length === 1 ? "" : "s"} found` +
            (purposeLabel ? ` · ${purposeLabel}` : "");
    }
    els.carGrid.innerHTML = filtered
        .slice(0, visibleCount("car_card"))
        .map(carCardHTML)
        .join("");
    updateToggleButton("car_card", filtered.length);
    // Only newly added cards actually animate.
    animateCarCards();
}

export function setQuery(query) {
    state.query = query;
    if (els.search) els.search.value = query;
}

export function readFilterSelects() {
    state.budget = els.budget?.value ?? "all";
    state.body = els.body?.value ?? "all";
    state.fuel = els.fuel?.value ?? "all";
    state.transmission = els.transmission?.value ?? "all";
    state.safety = els.safety?.value ?? "all";
}

export function resetFilters() {
    Object.assign(state, { budget: "all", body: "all", fuel: "all", transmission: "all", safety: "all", selectedBrand: "all", purpose: "all" });
    setQuery("");
    [els.budget, els.body, els.fuel, els.transmission, els.safety]
        .filter(Boolean)
        .forEach((select) => { select.value = "all"; });
    renderCars();
}
