// ── Variant comparison table ─────────────────────────────────────────────────
// Shared by the homepage Compare section and the car page variant compare.

import { state } from "../core/state.js";
import { formatSinglePrice, metricNumber } from "../core/format.js";
import { getVariantPrice } from "../core/cars.js";

// Each row: [label, value(item), metric(item)?, "max" | "min" | "none"]
// A metric marks the best value in the row with a BEST badge.
function comparisonGroups() {
    const bool = (v) => v === true ? "Yes" : v === false ? "No" : v ?? "—";
    const val = (v) => (v === null || v === undefined || v === false) ? "—" : String(v);

    return [
        {
            title: "Price and Variant",
            rows: [
                ["Variant", ({ variant }) => variant.name],
                [
                    "Ex-showroom price",
                    ({ variant }) => formatSinglePrice(getVariantPrice(variant) / 100000),
                    ({ variant }) => getVariantPrice(variant),
                    "min"
                ],
                [
                    "Fuel",
                    ({ variant }) => variant.configuration?.fuel || "—",
                    null,
                    "none"
                ],
                [
                    "Transmission",
                    ({ variant }) => variant.configuration?.transmission || "—",
                    null,
                    "none"
                ],
                [
                    "Drivetrain",
                    ({ variant }) => variant.configuration?.drivetrain || "—",
                    null,
                    "none"
                ],
                [
                    "Seating",
                    ({ variant }) => `${variant.configuration?.seating || "—"} seats`,
                    ({ variant }) => Number(variant.configuration?.seating || 0),
                    "max"
                ],
                [
                    "Tyre size",
                    ({ variant }) => variant.configuration?.tyreSizeLabel || "—",
                    null,
                    "none"
                ],
            ],
        },
        {
            title: "Performance",
            rows: [
                [
                    "Power",
                    ({ variant }) => variant.performance?.power || "—",
                    ({ variant }) => metricNumber(variant.performance?.power),
                    "max"
                ],
                                [
                    "Torque",
                    ({ variant }) => variant.performance?.torque || "—",
                    ({ variant }) => metricNumber(variant.performance?.torque),
                    "max"
                ],
                                [
                    "Mileage / range",
                    ({ variant }) => variant.performance?.mileageARAI || "—",
                    ({ variant }) => metricNumber(variant.performance?.mileageARAI),
                    "max"
                ],
            ],
        },
        {
            title: "Wheels",
            rows: [
                [
                    "Wheel size",
                    ({ variant }) => variant.wheels?.size || "—",
                    ({ variant }) => metricNumber(variant.wheels?.size),
                    "max"
                ],
                                [
                    "Wheel type",
                    ({ variant }) => variant.wheels?.type || "—",
                    ({ variant }) => metricNumber(variant.wheels?.type),
                    "max"
                ],
                                [
                    "Tyre size",
                    ({ variant }) => variant.wheels?.tyreSizeLabel || "—",
                    ({ variant }) => metricNumber(variant.wheels?.tyreSizeLabel),
                    "max"
                ],
            ],
        },
        {
            title: "Safety",
            rows: [
                [
                    "Airbags",
                    ({ variant }) => val(variant.safety?.airbags),
                    ({ variant }) => Number(variant.safety?.airbags || 0),
                    "max"
                ],
                ["ABS + EBD", ({ variant }) => bool(variant.safety?.abs && variant.safety?.ebd)],
                ["ESC", ({ variant }) => bool(variant.safety?.esc)],
                ["Rear camera", ({ variant }) => variant.safety?.rearCameraType || bool(variant.safety?.rearCamera)],
                ["Hill assist", ({ variant }) => bool(variant.safety?.hillAssist)],
                ["Hill descent", ({ variant }) => bool(variant.safety?.hillDescentControl)],
                ["TPMS", ({ variant }) => bool(variant.safety?.tpms)],
                ["ISOFIX", ({ variant }) => bool(variant.safety?.isofix)],
                ["Pretensioner seatbelts", ({ variant }) => bool(variant.safety?.pretensionerSeatbelts)],
                ["Anti-pinch windows", ({ variant }) => bool(variant.safety?.antiPinchPowerWindows)],
            ],
        },
        {
            title: "ADAS",
            rows: [
                ["ADAS available", ({ variant }) => bool(variant.adas?.available)],
                ["Level", ({ variant }) => val(variant.adas?.level)],
                ["Forward collision warning", ({ variant }) => bool(variant.adas?.forwardCollisionWarning)],
                ["Auto emergency braking", ({ variant }) => bool(variant.adas?.automaticEmergencyBraking)],
                ["Lane departure warning", ({ variant }) => bool(variant.adas?.laneDepartureWarning)],
                ["Lane keep assist", ({ variant }) => bool(variant.adas?.laneKeepAssist)],
                ["Adaptive cruise control", ({ variant }) => bool(variant.adas?.adaptiveCruiseControl)],
                ["Driver attention warning", ({ variant }) => bool(variant.adas?.driverAttentionWarning)],
                ["Traffic sign recognition", ({ variant }) => bool(variant.adas?.trafficSignRecognition)],
            ],
        },
        {
            title: "Comfort and Convenience",
            rows: [
                ["Climate control", ({ variant }) => variant.comfort?.automaticClimateControl ? "Automatic" : "Manual AC"],
                ["Sunroof", ({ variant }) => variant.comfort?.sunroof?.available ? (variant.comfort.sunroof.type || "Yes") : "No"],
                ["Keyless entry", ({ variant }) => bool(variant.comfort?.keylessEntry)],
                ["Push-button start", ({ variant }) => bool(variant.comfort?.pushButtonStart)],
                ["Cruise control", ({ variant }) => bool(variant.comfort?.cruiseControl)],
                ["Ventilated front seats", ({ variant }) => bool(variant.comfort?.ventilatedFrontSeats)],
                ["Powered front seats", ({ variant }) => bool(variant.comfort?.poweredFrontSeats)],
                ["Wireless charging", ({ variant }) => bool(variant.comfort?.wirelessCharging)],
                ["Rear AC vents", ({ variant }) => bool(variant.comfort?.rearAcVents)],
                ["Parking sensors", ({ variant }) => val(variant.comfort?.parkingSensors)],
            ],
        },
        {
            title: "Interior",
            rows: [
                ["Upholstery", ({ variant }) => variant.interior?.upholstery || "—"],
                [
                    "Digital cluster",
                    ({ variant }) =>
                        variant.interior?.digitalCluster
                            ? (variant.interior.digitalClusterSize || "Yes")
                            : "Analogue",
                    ({ variant }) => metricNumber(variant.interior?.digitalClusterSize),
                    "max"
                ],
                ["Ambient lighting", ({ variant }) => bool(variant.interior?.ambientLighting)],
                ["Leather-wrapped steering", ({ variant }) => bool(variant.interior?.leatherWrappedSteering)],
            ],
        },
        {
            title: "Exterior",
            rows: [
                ["LED headlamps", ({ variant }) => bool(variant.exterior?.ledHeadlamps)],
                ["LED DRLs", ({ variant }) => bool(variant.exterior?.ledDRL)],
                ["LED tail lamps", ({ variant }) => bool(variant.exterior?.ledTailLamps)],
                ["LED fog lamps", ({ variant }) => bool(variant.exterior?.ledFogLamps)],
                ["Alloy wheels", ({ variant }) => bool(variant.exterior?.alloyWheels)],
                ["Roof rails", ({ variant }) => bool(variant.exterior?.roofRails)],
                ["ORVMs", ({ variant }) => variant.exterior?.orvm || "—"],
                ["Rear wiper / washer", ({ variant }) => bool(variant.exterior?.rearWindowWiper)],
            ],
        },
        {
            title: "Infotainment",
            rows: [
                ["Touchscreen size", ({ variant }) => variant.infotainment?.screenSize || "—"],
                ["Android Auto / CarPlay", ({ variant }) => variant.infotainment?.androidAuto ? (variant.infotainment.wirelessAndroidAuto ? "Wireless" : "Wired") : "No"],
                ["Speakers", ({ variant }) => val(variant.infotainment?.speakerCount)],
                ["Premium audio", ({ variant }) => variant.infotainment?.premiumAudio || bool(false)],
                ["Bluetooth", ({ variant }) => bool(variant.infotainment?.bluetooth)],
            ],
        },
        {
            title: "Connected Tech",
            rows: [
                ["Connected tech", ({ variant }) => bool(variant.connectedTech?.available)],
                ["AdrenoX", ({ variant }) => bool(variant.connectedTech?.adrenox)],
                ["Alexa", ({ variant }) => bool(variant.connectedTech?.alexa)],
                ["Live location", ({ variant }) => bool(variant.connectedTech?.liveLocation)],
                ["SOS button", ({ variant }) => bool(variant.connectedTech?.sosButton)],
                ["eCall / iCall", ({ variant }) => bool(variant.connectedTech?.eCallICall)],
                ["Smartwatch app", ({ variant }) => bool(variant.connectedTech?.smartwatchApp)],
                ["Valet mode", ({ variant }) => bool(variant.connectedTech?.valetMode)],
            ],
        },
    ];
}

export function renderGroupedComparisonTable(selected) {
    const groups = comparisonGroups();
    return `
        <table class="compare-table full-compare-table">
            <thead>
                <tr>
                    <th>Spec</th>
                    ${selected.map(({ car, variant }) => `<th>${car.name}<span>${variant.name}</span></th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${groups.map((group) => `
                    <tr class="compare-category-row">
                        <th colspan="${selected.length + 1}">${group.title}</th>
                    </tr>
                    ${group.rows.map(([label, value, metric, compareType]) => {
                        const rowValues = selected.map(item => value(item));
                        const allSame = rowValues.every(v => v === rowValues[0]);

                        if (state.compareSettings.differencesOnly && allSame) {
                            return "";
                        }
                        const values = selected.map((item) => metric ? metric(item) : 0);
                        const highest = metric ? Math.max(...values) : 0;
                        const best = !metric
                            ? null
                            : compareType === "min"
                                ? Math.min(...values)
                                : Math.max(...values);
                        const uniqueValues = [...new Set(values)];
                        const hasWinner =
                            metric &&
                            compareType !== "none" &&
                            uniqueValues.length > 1;
                        
                        return `
                            <tr>
                                <th>${label}</th>
                                ${selected.map((item) => {
                                    const numericValue = metric ? metric(item) : 0;
                                    const isWinner =
                                        hasWinner &&
                                        numericValue === best;
                                    return `
                                        <td>
                                            <strong>
                                                ${value(item)}
                                                ${isWinner
                                                    ? '<span class="winner-badge">BEST</span>'
                                                    : ''}
                                            </strong>          
                                        </td>
                                    `;     
                                }).join("")}
                            </tr>
                        `;
                    }).join("")}
                `).join("")}
            </tbody>
        </table>
    `;
}
