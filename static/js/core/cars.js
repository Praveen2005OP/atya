// ── Car data helpers ─────────────────────────────────────────────────────────

import { store } from "./state.js";

// Turns a raw car JSON file into the flat shape the UI renders.
export function normalizeCar(car) {
    const minPrice = Number(car?.pricing?.exShowroom?.min) || 0;
    const maxPrice = Number(car?.pricing?.exShowroom?.max) || 0;
    const engineDb = car?.engineDatabase || {};
    const allPower = [];
    const allTorque = [];
    Object.values(engineDb).forEach((engine) => {
        Object.values(engine).forEach((config) => {
            if (typeof config === "object" && config.power) {
                const power = parseFloat(config.power);
                const torque = parseFloat(config.torque);
                if (!isNaN(power)) allPower.push(power);
                if (!isNaN(torque)) allTorque.push(torque);
            }
        });
    });
    const power = { min: Math.min(...allPower) || 0, max: Math.max(...allPower) || 0 };
    const torque = { min: Math.min(...allTorque) || 0, max: Math.max(...allTorque) || 0 };
    return {
        id: car?.slug || "",
        slug: car?.slug || "",
        name: car.fullName || car.name || "",
        brand: car?.brand || "",
        minides: car?.overview?.minides || "",
        summary: car?.overview?.description || "",
        priceMin: minPrice / 100000,
        priceMax: maxPrice / 100000,
        body: car?.overview?.segment || "",
        bodyType: car?.overview?.body || "",
        fuel: car?.overview?.fuelTypes || [],
        transmission: car?.overview?.transmissions || [],
        safety: car?.overview?.safetyRating ?? "Not tested yet",
        power,
        torque,
        seats: car?.overview?.seatingOptions?.[0] || 5,
        purpose: (car?.overview?.useCases || []).map((useCase) => useCase.toLowerCase()),
        images: { hero: car?.hero?.image || "" },
        hero: car?.hero || {},
        overview: car?.overview || {},
        pricing: car?.pricing || {},
        variants: car?.variants || [],
        original: car,
    };
}

export function findCar(id) {
    if (store.currentCar?.id === id) return store.currentCar;
    return store.cars.find((car) => car.id === id) || null;
}

export function getVariants(car) {
    return car?.variants || [];
}

export function getVariantPrice(variant) {
    return Number(variant?.price?.exShowroom) || 0;
}

export function openCarPage(id) {
    if (id) window.location.href = `/car/${id}/`;
}
