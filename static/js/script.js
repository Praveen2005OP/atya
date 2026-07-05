let cars = [];

let currentCar = null;

function normalizeCar(car) {
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
    const torque = { min: Math.min(...allTorque) || 0, max: Math.max(...allTorque) || 0 }
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
        purpose: [],
        images: { hero: car?.hero?.image || "" },
        hero: car?.hero || {},
        overview: car?.overview || {},
        pricing: car?.pricing || {},
        variants: car?.variants || [],
        original: car,
    };
};

// ── Initialize the detail page with the current car data ────────────────────────────────────────────────────────────
function initializeDetailPage() {
    const currentCarScript = document.getElementById("current-car-data");
    if (!currentCarScript) return;
    const rawCar = JSON.parse(currentCarScript.textContent);
    currentCar = normalizeCar(rawCar);
}

const state = {
    query: "",
    budget: "all",
    body: "all",
    fuel: "all",
    transmission: "all",
    safety: "all",
    selectedBrand: "all",
    compare: [],
    variantCompare: {},
    compareSettings: {
        differencesOnly: false,
    },
    saved: JSON.parse(localStorage.getItem("atyaSavedCars") || "[]"),
};

const els = {
    header: document.querySelector(".site-header"),
    search: document.querySelector("#globalSearch"),
    heroSearch: document.querySelector("#heroSearch"),
    brandGrid: document.querySelector("#brandGrid"),
    carGrid: document.querySelector("#carGrid"),
    resultCount: document.querySelector("#resultCount"),
    budget: document.querySelector("#budgetFilter"),
    body: document.querySelector("#bodyFilter"),
    fuel: document.querySelector("#fuelFilter"),
    transmission: document.querySelector("#transmissionFilter"),
    safety: document.querySelector("#safetyFilter"),
    reset: document.querySelector("#resetFilters"),
    comparePicker: document.querySelector("#comparePicker"),
    compareOutput: document.querySelector("#compareOutput"),
    savedGrid: document.querySelector("#savedGrid"),
    themeToggle: document.querySelector("#themeToggle"),
};

const formatPrice = (min, max) => `INR ${min.toFixed(2)}L - ${max.toFixed(2)}L`;
const formatSinglePrice = (price) => `INR ${Number(price).toFixed(2)}L`;

async function loadCars() {
    try {
        const carsDataEl = document.getElementById("cars-data");
        if (!carsDataEl) return;
        const djangoCars = JSON.parse(carsDataEl.textContent);

        cars = djangoCars.map(normalizeCar);

        renderBrands();
        renderCars();
        renderSaved();
    } catch (error) {
        console.error("Car data error:", error);
        renderDataError(error);
    }
}

function renderDataError(error) {
    console.error("Car data error:", error);
    if (els.carGrid) {
        els.carGrid.innerHTML = `<div class="empty-state"><h3>Could not load cars</h3><p>Check JSON files</p></div>`;
    }
}

// ── Variant helpers ────────────────────────────────────────────────────────────

function getVariants(car) {
    return car.variants || [];
}

function getVariantPrice(variant) {
    return Number(variant?.price?.exShowroom) || 0;
}

function getVariantFuel(variant) {
    return variant?.configuration?.fuel || "";
}

function getVariantTransmission(variant) {
    return variant?.configuration?.transmission || "";
}

function getVariantPower(variant) {
    return variant?.performance?.power || "—";
}

function getVariantTorque(variant) {
    return variant?.performance?.torque || "—";
}

function getVariantMileage(variant) {
    return variant?.performance?.mileageARAI || "—";
}

function getVariantFamily(variant) {
    return variant?.family || "—";
}

function metricNumber(value) {
    if (value == null) return 0;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
}

// ── Comparison groups ──────────────────────────────────────────────────────────

function yesNo(value) {
    return value ? "Yes" : "No";
}

function getVariantPrice(variant) {
    return Number(variant?.price?.exShowroom) || 0;
}

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

// ── for detail page ───────────────────────────────────────────────────────────

function updateVariantComparison(carId) {
    const container = document.getElementById("variantComparisonContent");
    const car =
        currentCar && currentCar.id === carId
            ? currentCar
            : cars.find(c => c.id === carId);
    const variants = getVariants(car);
    const selectedIds = state.variantCompare[carId] || [];
    const selectedItems = selectedIds
        .map(id => {
            const variant = variants.find(v => v.id === id);
            return variant ? { car, variant } : null;
        })
        .filter(Boolean);

    if (!selectedItems.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Select variants from the list to compare them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = renderGroupedComparisonTable(selectedItems);
}

// ── Comparison table ───────────────────────────────────────────────────────────

function renderGroupedComparisonTable(selected) {
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



// ── Compare picker / output ────────────────────────────────────────────────────

function renderComparePicker() {
    const slots = [0, 1, 2];
    els.comparePicker.innerHTML = slots.map((slot) => {
        const item = state.compare[slot];
        const car = item ? cars.find((c) => c.id === item.carId) : null;
        const variants = car ? getVariants(car) : [];
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
                        ${cars.map((c) => `<option value="${c.id}" ${car?.id === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
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

function renderCompareOutput() {
    const selected = state.compare.map((item) => {
        const car = cars.find((c) => c.id === item.carId);
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

// ── Saved ──────────────────────────────────────────────────────────────────────

function renderSaved() {
    if (!els.savedGrid) return;
    const savedCars = state.saved.map((id) => cars.find((c) => c.id === id)).filter(Boolean);
    els.savedGrid.innerHTML = savedCars.map((car) => `
        <article class="saved-card">
            <img src="${car.images.hero}" alt="${car.name}" loading="lazy" />
            <span class="badge">${car.brand}</span>
            <h3>${car.name}</h3>
            <p>${formatPrice(car.priceMin, car.priceMax)} · ${car.safety === "Not tested yet" ? car.safety : `${car.safety} ★ Safety`}</p>
            <div class="card-actions">
                <button class="secondary-button" type="button" data-details="${car.id}">Open</button>
                <button class="secondary-button" type="button" data-save="${car.id}">Remove</button>
            </div>
        </article>
    `).join("");
}

// ── Filters / search ───────────────────────────────────────────────────────────

function matchesBudget(car) {
    if (state.budget === "all") return true;
    if (state.budget === "under10") return car.priceMin < 10;
    if (state.budget === "10to20") return car.priceMin <= 20 && car.priceMax >= 10;
    if (state.budget === "20to40") return car.priceMin <= 40 && car.priceMax >= 20;
    if (state.budget === "luxury") return car.priceMax >= 40;
    return true;
}

function getFilteredCars() {
    const query = state.query.trim().toLowerCase();
    return cars.filter((car) => {
        const searchable = [car.name, car.brand, car.body, ...(car.fuel || []), ...(car.transmission || []), car.summary]
            .join(" ").toLowerCase();
        return (
            (!query || searchable.includes(query)) &&
            (state.selectedBrand === "all" || car.brand === state.selectedBrand) &&
            matchesBudget(car) &&
            (state.body === "all" || car.body === state.body) &&
            (state.fuel === "all" || car.fuel?.includes(state.fuel)) &&
            (state.transmission === "all" || car.transmission?.includes(state.transmission)) &&
            (state.safety === "all" || car.safety >= Number(state.safety))
        );
    });
}

// ── Brands ─────────────────────────────────────────────────────────────────────

function brandSummary() {
    const map = new Map();
    cars.forEach((car) => {
        const current = map.get(car.brand) || { count: 0, min: car.priceMin, max: car.priceMax, sample: car.name };
        current.count += 1;
        current.min = Math.min(current.min, car.priceMin);
        current.max = Math.max(current.max, car.priceMax);
        map.set(car.brand, current);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function renderBrands() {
    if (!els.brandGrid) return;
    els.brandGrid.innerHTML = brandSummary().map(([brand, info]) => `
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
}

// ── Car grid ───────────────────────────────────────────────────────────────────

function renderCars() {
    const filtered = getFilteredCars();
    if (els.resultCount) els.resultCount.textContent = `${filtered.length} car${filtered.length === 1 ? "" : "s"} found`;
    els.carGrid.innerHTML = filtered.map((car) => {
        const saved = state.saved.includes(car.id);
        const comparing = state.compare.some((item) => item.carId === car.id);
        return `
            <article class="car-card" onclick="window.location.href='/car/${car.slug}/'" tabindex="0" role="button" aria-label="Open ${car.name} review and specifications">
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
                        <div class="spec-tile"><span>Power</span><strong>${car.power.min === car.power.max ? `${car.power.max} hp` : `${car.power.min}–${car.power.max} hp`}</strong></div>
                        <div class="spec-tile"><span>Torque</span><strong>${car.torque.min === car.torque.max ? `${car.torque.max} Nm` : `${car.torque.min}–${car.torque.max} Nm`}</strong></div>
                        <div class="spec-tile"><span>Safety</span><strong>${car.safety === "Not tested yet" ? car.safety : `${car.safety} ★ Safety`}</strong></div>
                    </div>
                    <div class="card-actions">
                        <button class="secondary-button" type="button" data-details="${car.id}">Read review</button>
                        <button class="secondary-button" type="button" data-save="${car.id}">${saved ? "Saved" : "Save"}</button>
                        <button class="primary-button" type="button" data-compare="${car.id}">${comparing ? "Selected" : "Compare"}</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

document.addEventListener("change", (e) => {
    if (e.target.id !== "differenceToggle") return;

    state.compareSettings.differencesOnly = e.target.checked;
    // Detail page
    if (currentCar) {
        updateVariantComparison(currentCar.id);
    }
    // Homepage / Compare page
    if (els.compareOutput) {
        renderCompareOutput();
    }
});

// ── State mutations ────────────────────────────────────────────────────────────

function selectCompare(id) {
    const car = cars.find((c) => c.id === id);
    if (!car) return;
    const variants = getVariants(car);
    const defaultVariantId = variants[0]?.id || "";
    const existingIndex = state.compare.findIndex((item) => item.carId === id);
    if (existingIndex >= 0) {
        state.compare = state.compare.filter((_, i) => i !== existingIndex);
    } else if (state.compare.length < 3) {
        state.compare.push({ carId: id, variantId: defaultVariantId });
    } else {
        state.compare = [...state.compare.slice(1), { carId: id, variantId: defaultVariantId }];
    }
    renderAll();
}

function toggleSave(id) {
    state.saved = state.saved.includes(id) ? state.saved.filter((cid) => cid !== id) : [...state.saved, id];
    localStorage.setItem("atyaSavedCars", JSON.stringify(state.saved));
    renderAll();
}

function renderAll() {
    if (els.carGrid) renderCars();
    if (els.comparePicker) renderComparePicker();
    if (els.compareOutput) renderCompareOutput();
    if (els.savedGrid) renderSaved();
}

function renderCarPage(id, options = {}) {
    const car = cars.find((item) => item.id === id);
    if (!car) return;
    document.title = `${car.name} Review, Specs and Price | Atya`;
    if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
}

function applyPurpose(purpose) {
    state.query = purpose;
    els.search.value = purpose;
    document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
    renderCars();
}

function resetFilters() {
    Object.assign(state, { query: "", budget: "all", body: "all", fuel: "all", transmission: "all", safety: "all", selectedBrand: "all" });
    els.search.value = "";
    els.budget.value = "all";
    els.body.value = "all";
    els.fuel.value = "all";
    els.transmission.value = "all";
    els.safety.value = "all";
    renderCars();
}

// ── Theme ──────────────────────────────────────────────────────────────────────

function buildToggleRays(svgEl) {
    if (!svgEl) return;
    svgEl.innerHTML = "";
    const count = 8, cx = 33, cy = 33, innerR = 22, outerR = 30;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", cx + Math.cos(angle) * innerR);
        line.setAttribute("y1", cy + Math.sin(angle) * innerR);
        line.setAttribute("x2", cx + Math.cos(angle) * outerR);
        line.setAttribute("y2", cy + Math.sin(angle) * outerR);
        line.setAttribute("stroke", "#f5a623");
        line.setAttribute("stroke-width", "2.5");
        line.setAttribute("stroke-linecap", "round");
        svgEl.appendChild(line);
    }
}

let _rayAnimFrame;
function startRayAnimation() {
    const svgEl = document.getElementById("themeRaysSvg");
    buildToggleRays(svgEl);
    let angle = 0;
    function step() {
        if (svgEl) svgEl.style.transform = `rotate(${angle}deg)`;
        angle += 0.4;
        _rayAnimFrame = requestAnimationFrame(step);
    }
    if (_rayAnimFrame) cancelAnimationFrame(_rayAnimFrame);
    step();
}

function initTheme() {
    const savedTheme = localStorage.getItem("atyaTheme");
    if (savedTheme === "light") document.documentElement.classList.add("light");
    startRayAnimation();
}

// ── Events ─────────────────────────────────────────────────────────────────────

document.addEventListener("scroll", () => {
    els.header?.classList.toggle("scrolled", window.scrollY > 16);
});

document.addEventListener("click", (event) => {
    const detail = event.target.closest("[data-details]");
    const save = event.target.closest("[data-save]");
    const compare = event.target.closest("[data-compare]");
    const removeCompareSlot = event.target.closest("[data-remove-compare-slot]");
    const card = event.target.closest("[data-card-details]");
    const brand = event.target.closest("[data-brand]");
    const chip = event.target.closest("[data-chip]");
    const purpose = event.target.closest("[data-purpose]");
    const scrollTarget = event.target.closest("[data-scroll-target]");

    if (detail) openCarPage(detail.dataset.details);
    if (save) toggleSave(save.dataset.save);
    if (compare) selectCompare(compare.dataset.compare);
    if (removeCompareSlot) {
        state.compare.splice(Number(removeCompareSlot.dataset.removeCompareSlot), 1);
        renderAll();
    }
    if (card && !event.target.closest("button")) openCarPage(card.dataset.cardDetails);
    if (brand) {
        state.selectedBrand = state.selectedBrand === brand.dataset.brand ? "all" : brand.dataset.brand;
        document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
        renderCars();
    }
    if (chip) {
        state.query = chip.dataset.chip;
        els.search.value = chip.dataset.chip;
        document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
        renderCars();
    }
    if (purpose) applyPurpose(purpose.dataset.purpose);
    if (scrollTarget) document.querySelector(`#${scrollTarget.dataset.scrollTarget}`).scrollIntoView({ behavior: "smooth" });
});

document.addEventListener("keydown", (event) => {
    const card = event.target.closest?.("[data-card-details]");
    if (!card || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openCarPage(card.dataset.cardDetails);
});

els.heroSearch?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = els.search.value;
    document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" });
    renderCars();
});

els.search?.addEventListener("input", () => {
    state.query = els.search.value;
    renderCars();
});

[els.budget, els.body, els.fuel, els.transmission, els.safety].filter(Boolean).forEach((select) => {
    select.addEventListener("change", () => {
        state.budget = els.budget?.value;
        state.body = els.body?.value;
        state.fuel = els.fuel?.value;
        state.transmission = els.transmission?.value;
        state.safety = els.safety?.value;
        renderCars();
    });
});

els.reset?.addEventListener("click", resetFilters);

els.comparePicker?.addEventListener("change", (event) => {
    const carSelect = event.target.closest("[data-compare-slot-car]");
    const variantSelect = event.target.closest("[data-compare-slot-variant]");

    if (carSelect) {
        const slot = Number(carSelect.dataset.compareSlotCar);
        const car = cars.find((c) => c.id === carSelect.value);
        if (!car) {
            state.compare.splice(slot, 1);
        } else {
            const variants = getVariants(car);
            state.compare[slot] = { carId: car.id, variantId: variants[0]?.id || "" };
            state.compare = state.compare.filter(Boolean).slice(0, 3);
        }
        renderAll();
    }

    if (variantSelect) {
        const slot = Number(variantSelect.dataset.compareSlotVariant);
        if (state.compare[slot]) {
            state.compare[slot] = { ...state.compare[slot], variantId: variantSelect.value };
            renderAll();
        }
    }
});

document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-variant-compare]");
    if (!checkbox) return;
    const carId = checkbox.dataset.carId;
    const variantId = checkbox.dataset.variantCompare;
    const current = state.variantCompare[carId] || [];
    if (checkbox.checked) {
        state.variantCompare[carId] = current.includes(variantId)
            ? current
            : [...current.slice(Math.max(0, current.length - 2)), variantId];
    } else {
        state.variantCompare[carId] = current.filter((id) => id !== variantId);
    }
    updateVariantComparison(carId);
});

els.themeToggle?.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const isLight = document.documentElement.classList.contains("light");
    localStorage.setItem("atyaTheme", isLight ? "light" : "dark");
});

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------
    // Homepage
    // -----------------------------
    if (document.getElementById("cars-data")) {
        loadCars()
            .then(() => {
                renderBrands();
                renderAll();
            })
            .catch(console.error);
    }
    // -----------------------------
    // Car Detail Page
    // -----------------------------
    if (document.getElementById("current-car-data")) {
        initializeDetailPage();
        updateVariantComparison(currentCar.id);
    }
});

// ── 360 viewer (unchanged) ─────────────────────────────────────────────────────

const frameViewer = document.querySelector(".frame-viewer");
if (frameViewer) {
    const slug = frameViewer.dataset.slug;
    const image = document.getElementById("car360");
    const interiorViewer = document.getElementById("interior360");
    const tabs = document.querySelectorAll(".viewer-tab");
    let interiorLoaded = false;
    let totalFrames = Number(frameViewer.dataset.frames);
    let currentFrame = 0;
    let currentFolder = "360";
    let dragging = false;
    let startX = 0;
    let autoRotate;

    function preloadFrames(folder, count) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `/static/images/car-images/${slug}/${folder}/img_0_0_${i.toString().padStart(3, "0")}.webp`;
        }
    }
    preloadFrames("360", Number(frameViewer.dataset.frames));
    if (frameViewer.dataset.openFrames) preloadFrames("360-open", Number(frameViewer.dataset.openFrames));

    function updateFrame() {
        const frame = Math.floor(currentFrame).toString().padStart(3, "0");
        if (image) image.src = `/static/images/car-images/${slug}/${currentFolder}/img_0_0_${frame}.webp`;
    }

    function startAutoRotate() {
        clearInterval(autoRotate);
        if (currentFolder === "interior") return;
        autoRotate = setInterval(() => { currentFrame = (currentFrame + 1) % totalFrames; updateFrame(); }, 90);
    }

    tabs.forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelector(".viewer-tab.active")?.classList.remove("active");
            button.classList.add("active");
            if (button.dataset.view === "exterior") {
                currentFolder = "360"; totalFrames = Number(frameViewer.dataset.frames);
                interiorViewer.style.display = "none"; frameViewer.style.display = "block";
                currentFrame = 0; updateFrame(); startAutoRotate();
            } else if (button.dataset.view === "open") {
                currentFolder = "360-open"; totalFrames = Number(frameViewer.dataset.openFrames);
                interiorViewer.style.display = "none"; frameViewer.style.display = "block";
                currentFrame = 0; updateFrame(); startAutoRotate();
            } else if (button.dataset.view === "interior") {
                clearInterval(autoRotate); currentFolder = "interior";
                frameViewer.style.display = "none"; interiorViewer.style.display = "block";
                if (!interiorLoaded) {
                    pannellum.viewer("interior360", {
                        type: "cubemap",
                        cubeMap: [1,2,3,4,5,6].map((n) => `/static/images/car-images/${slug}/interior/${n}.webp`),
                        autoLoad: true, autoRotate: -2, mouseZoom: true,
                        showZoomCtrl: false, showFullscreenCtrl: false,
                    });
                    interiorLoaded = true;
                }
            }
        });
    });

    frameViewer.addEventListener("mousedown", (e) => { clearInterval(autoRotate); dragging = true; startX = e.clientX; });
    window.addEventListener("mouseup", () => { dragging = false; if (currentFolder !== "interior") startAutoRotate(); });
    window.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const delta = e.clientX - startX;
        if (Math.abs(delta) > 8) {
            currentFrame = (currentFrame + (delta > 0 ? 1 : -1) + totalFrames) % totalFrames;
            updateFrame(); startX = e.clientX;
        }
    });
    frameViewer.addEventListener("touchstart", (e) => { clearInterval(autoRotate); dragging = true; startX = e.touches[0].clientX; });
    frameViewer.addEventListener("touchmove", (e) => {
        if (!dragging) return;
        const delta = e.touches[0].clientX - startX;
        if (Math.abs(delta) > 8) {
            currentFrame = (currentFrame + (delta > 0 ? 1 : -1) + totalFrames) % totalFrames;
            updateFrame(); startX = e.touches[0].clientX;
        }
    });
    frameViewer.addEventListener("touchend", () => { dragging = false; startAutoRotate(); });

    currentFolder = "360"; currentFrame = 0;
    frameViewer.style.display = "block"; interiorViewer.style.display = "none";
    updateFrame(); startAutoRotate();
}