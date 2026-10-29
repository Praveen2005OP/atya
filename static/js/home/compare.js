// ── Homepage Compare section (up to three car + variant slots) ───────────────

import { store, state } from "../core/state.js";
import { els } from "../core/dom.js";
import { formatSinglePrice } from "../core/format.js";
import { findCar, getVariants, getVariantPrice } from "../core/cars.js";
import { renderGroupedComparisonTable } from "../compare/table.js";

const MAX_COMPARE = 3;

export function renderComparePicker() {
    if (!els.comparePicker) return;
    const slots = [0, 1, 2];
    els.comparePicker.innerHTML = slots.map((slot) => {
        const item = state.compare[slot];
        const car = item ? findCar(item.carId) : null;
        const variants = getVariants(car);
        const selectedVariantId = item?.variantId || variants[0]?.id || "";

        return `
            <div class="compare-slot">
                <div class="compare-slot-head">
                    <span class="badge">Car ${slot + 1}</span>
                    ${item ? `<button class="mini-button" type="button" data-remove-compare-slot="${slot}">Remove</button>` : ""}
                </div>
                <label>
                    Select car
                    <select data-compare-slot-car="${slot}">
                        <option value="">Choose a car</option>
                        ${store.cars.map((c) => `<option value="${c.id}" ${car?.id === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
                    </select>
                </label>
                <label>
                    Select variant
                    <select data-compare-slot-variant="${slot}" ${car ? "" : "disabled"}>
                        ${car
                            ? variants.map((v) => {
                                const price = getVariantPrice(v) / 100000;
                                return `<option value="${v.id}" ${selectedVariantId === v.id ? "selected" : ""}>${v.name} · ${formatSinglePrice(price)}</option>`;
                            }).join("")
                            : `<option value="">Choose car first</option>`}
                    </select>
                </label>
            </div>
        `;
    }).join("");
}

export function renderCompareOutput() {
    if (!els.compareOutput) return;
    const selected = state.compare.map((item) => {
        const car = findCar(item.carId);
        if (!car) return null;
        const variants = getVariants(car);
        const variant = variants.find((v) => v.id === item.variantId) || variants[0];
        if (!variant) return null;
        return { car, variant };
    }).filter(Boolean);

    if (!selected.length) {
        els.compareOutput.innerHTML = `
            <div class="empty-state">
                <div>
                    <h3>No variants selected yet.</h3>
                    <p>Choose a car and variant in the comparison slots.</p>
                </div>
            </div>
        `;
        return;
    }

    els.compareOutput.innerHTML = renderGroupedComparisonTable(selected);
}

// Compare button on a car card: add it, remove it if already there,
// or drop the oldest one when all three slots are full.
export function toggleCompare(id) {
    const car = findCar(id);
    if (!car) return;
    const defaultVariantId = getVariants(car)[0]?.id || "";
    const existingIndex = state.compare.findIndex((item) => item.carId === id);
    if (existingIndex >= 0) {
        state.compare = state.compare.filter((_, i) => i !== existingIndex);
    } else if (state.compare.length < MAX_COMPARE) {
        state.compare.push({ carId: id, variantId: defaultVariantId });
    } else {
        state.compare = [...state.compare.slice(1), { carId: id, variantId: defaultVariantId }];
    }
}

export function removeCompareSlot(slot) {
    state.compare.splice(slot, 1);
}

export function setSlotCar(slot, carId) {
    const car = findCar(carId);
    if (!car) {
        state.compare.splice(slot, 1);
        return;
    }
    state.compare[slot] = { carId: car.id, variantId: getVariants(car)[0]?.id || "" };
    state.compare = state.compare.filter(Boolean).slice(0, MAX_COMPARE);
}

export function setSlotVariant(slot, variantId) {
    if (!state.compare[slot]) return false;
    state.compare[slot] = { ...state.compare[slot], variantId };
    return true;
}
