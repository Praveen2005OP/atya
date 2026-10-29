// ── Show More / Show Less for card grids ─────────────────────────────────────

import { displayState } from "../core/state.js";

export function getCardsPerStep() {
    // Mobile
    if (window.innerWidth <= 768) return 2;
    // Tablet + Small Tablet
    if (window.innerWidth <= 1100) return 4;
    // Desktop
    return 8;
}

// Shows the first step of cards on the first render.
export function visibleCount(type) {
    if (!displayState[type]) displayState[type] = getCardsPerStep();
    return displayState[type];
}

// Adds one more step of cards, or collapses back once everything is shown.
export function toggleCards(type, totalCards, renderFunction) {
    const step = getCardsPerStep();
    if (displayState[type] >= totalCards) {
        displayState[type] = step;
    } else {
        displayState[type] = Math.min(displayState[type] + step, totalCards);
    }
    renderFunction();
}

export function updateToggleButton(type, totalCards) {
    const button = document.getElementById(`${type}Toggle`);
    if (!button) return;
    button.textContent = displayState[type] >= totalCards ? "Show Less" : "Show More";
}
