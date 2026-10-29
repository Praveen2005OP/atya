// ── Homepage: load cars, render every section, wire up events ───────────────

import { store, state } from "../core/state.js";
import { els, readJsonScript, scrollToExplore } from "../core/dom.js";
import { normalizeCar, openCarPage } from "../core/cars.js";
import { toggleCards } from "./pagination.js";
import { brandSummary, renderBrands } from "./brands.js";
import { getFilteredCars, renderCars, setQuery, readFilterSelects, resetFilters } from "./car-grid.js";
import {
    renderComparePicker, renderCompareOutput,
    toggleCompare, removeCompareSlot, setSlotCar, setSlotVariant,
} from "./compare.js";
import { renderSaved, toggleSave } from "./garage.js";
import { initHomeAnimations } from "../animations/home.js";

// Re-renders everything that depends on saved / compared cars.
function renderAll() {
    renderCars();
    renderComparePicker();
    renderCompareOutput();
    renderSaved();
}

// Re-render first, then scroll on the next frame - scrolling first and
// changing the grid mid-scroll left the page stuck where it was.
function showResults() {
    renderCars();
    requestAnimationFrame(scrollToExplore);
}

function renderDataError(error) {
    console.error("Car data error:", error);
    if (els.carGrid) {
        els.carGrid.innerHTML = `<div class="empty-state"><h3>Could not load cars</h3><p>Check JSON files</p></div>`;
    }
}

function bindEvents() {
    document.getElementById("brands_cardToggle")?.addEventListener("click", () => {
        toggleCards("brands_card", brandSummary().length, renderBrands);
    });

    document.getElementById("car_cardToggle")?.addEventListener("click", () => {
        toggleCards("car_card", getFilteredCars().length, renderCars);
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        const detail = target.closest("[data-details]");
        const save = target.closest("[data-save]");
        const compare = target.closest("[data-compare]");
        const removeSlot = target.closest("[data-remove-compare-slot]");
        const card = target.closest("[data-card-details]");
        const brand = target.closest("[data-brand]");
        const chip = target.closest("[data-chip]");
        const purpose = target.closest("[data-purpose]");

        if (detail) return openCarPage(detail.dataset.details);
        if (save) {
            toggleSave(save.dataset.save);
            return renderAll();
        }
        if (compare) {
            toggleCompare(compare.dataset.compare);
            return renderAll();
        }
        if (removeSlot) {
            removeCompareSlot(Number(removeSlot.dataset.removeCompareSlot));
            return renderAll();
        }
        // Clicking anywhere else on a car card opens it.
        if (card && !target.closest("button")) return openCarPage(card.dataset.cardDetails);
        if (brand) {
            state.selectedBrand = state.selectedBrand === brand.dataset.brand ? "all" : brand.dataset.brand;
            return showResults();
        }
        if (chip) {
            setQuery(chip.dataset.chip);
            return showResults();
        }
        if (purpose) {
            state.purpose = state.purpose === purpose.dataset.purpose ? "all" : purpose.dataset.purpose;
            return showResults();
        }
    });

    // Enter / Space on a focused car card opens it.
    document.addEventListener("keydown", (event) => {
        const card = event.target.closest?.("[data-card-details]");
        if (!card || event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        openCarPage(card.dataset.cardDetails);
    });

    els.heroSearch?.addEventListener("submit", (event) => {
        event.preventDefault();
        state.query = els.search?.value || "";
        showResults();
    });

    els.search?.addEventListener("input", () => {
        state.query = els.search.value;
        renderCars();
    });

    [els.budget, els.body, els.fuel, els.transmission, els.safety].filter(Boolean).forEach((select) => {
        select.addEventListener("change", () => {
            readFilterSelects();
            renderCars();
        });
    });

    els.reset?.addEventListener("click", resetFilters);

    els.comparePicker?.addEventListener("change", (event) => {
        const carSelect = event.target.closest("[data-compare-slot-car]");
        const variantSelect = event.target.closest("[data-compare-slot-variant]");
        if (carSelect) {
            setSlotCar(Number(carSelect.dataset.compareSlotCar), carSelect.value);
            renderAll();
        }
        if (variantSelect && setSlotVariant(Number(variantSelect.dataset.compareSlotVariant), variantSelect.value)) {
            renderAll();
        }
    });

    document.getElementById("differenceToggle")?.addEventListener("change", (event) => {
        state.compareSettings.differencesOnly = event.target.checked;
        renderCompareOutput();
    });
}

export function initHome() {
    const rawCars = readJsonScript("cars-data");
    if (!rawCars) return;

    try {
        store.cars = rawCars.map(normalizeCar);

        // Render every dynamic grid first, so the DOM elements GSAP
        // needs already exist by the time animations are wired up.
        renderBrands();
        renderAll();
    } catch (error) {
        renderDataError(error);
        return;
    }

    bindEvents();
    initHomeAnimations();
}
