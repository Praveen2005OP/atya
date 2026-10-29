// ── Shared app state ─────────────────────────────────────────────────────────
// Every module imports these same objects, so a change made in one module
// (e.g. a filter) is seen by all the others.

const SAVED_CARS_KEY = "atyaSavedCars";

function readSavedCars() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_CARS_KEY) || "[]");
    } catch {
        return [];
    }
}

// Car data loaded from the page's json_script islands.
export const store = {
    cars: [],          // homepage: every car (normalized)
    currentCar: null,  // car detail page: the car being viewed (normalized)
};

// User choices: filters, compare slots, garage.
export const state = {
    query: "",
    budget: "all",
    body: "all",
    fuel: "all",
    transmission: "all",
    safety: "all",
    selectedBrand: "all",
    purpose: "all",
    compare: [],
    variantCompare: {},
    compareSettings: {
        differencesOnly: false,
    },
    saved: readSavedCars(),
};

// How many brand / car cards are currently shown (Show More / Show Less).
export const displayState = {
    brands_card: 0,
    car_card: 0,
};

export function persistSavedCars() {
    try {
        localStorage.setItem(SAVED_CARS_KEY, JSON.stringify(state.saved));
    } catch {
        // Private mode / blocked storage - the garage just won't persist.
    }
}
