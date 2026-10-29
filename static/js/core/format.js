// ── Formatting helpers ───────────────────────────────────────────────────────

// Prices are stored in lakh (see normalizeCar).
export const formatPrice = (min, max) => `INR ${min.toFixed(2)}L - ${max.toFixed(2)}L`;
export const formatSinglePrice = (price) => `INR ${Number(price).toFixed(2)}L`;

export function formatSafety(safety) {
    return safety === "Not tested yet" ? safety : `${safety} ★ Safety`;
}

export function formatRange(range, unit) {
    return range.min === range.max
        ? `${range.max} ${unit}`
        : `${range.min}–${range.max} ${unit}`;
}

// First number inside a spec string: "148 bhp @ 6000rpm" -> 148
export function metricNumber(value) {
    if (value == null) return 0;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
}
