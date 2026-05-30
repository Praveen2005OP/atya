let cars = [];

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
const formatSinglePrice = (price) => `INR ${price.toFixed(2)}L`;

async function loadCars() {
    try {
        const djangoCars = JSON.parse(
            document.getElementById("cars-data").textContent
        );

        cars = djangoCars.map((car) => {
            // Safe pricing extraction
            const minPrice = Number(car?.pricing?.exShowroom?.min) || 0;
            const maxPrice = Number(car?.pricing?.exShowroom?.max) || 0;
            const engineDb =car?.engineDatabase || {};
            const allPower = [];
            const allTorque = [];
            Object.values(engineDb)
                .forEach(engine => {
                    Object.values(engine)
                        .forEach(config => {
                            if (typeof config === "object" &&config.power) {
                                const power = parseFloat(config.power);
                                const torque =parseFloat(config.torque);
                                if (!isNaN(power)) {
                                    allPower.push(power);
                                }
                                if (!isNaN(torque)) {
                                    allTorque.push(torque);
                                }
                            }
                        }
                    );
                }
            );
            const power = {
                min : Math.min(...allPower) || 0,
                max : Math.max(...allPower) || 0
            };
            const torque = {
                min : Math.min(...allTorque) || 0,
                max : Math.max(...allTorque) || 0
            };
            return {
                id: car?.slug || "",
                slug: car?.slug || "",
                name: car.fullName || car.name || "",
                brand: car?.brand || "",
                minides:car?.overview?.minides || "",
                summary:car?.overview?.description || "",
                priceMin: minPrice / 100000,
                priceMax: maxPrice / 100000,
                body:car?.overview?.segment || "",
                bodyType:car?.overview?.body || "",
                fuel:car?.overview?.fuelTypes || [],
                transmission:car?.overview?.transmissions || [],
                safety:car?.overview?.safetyRating?? "Not tested yet",
                power,
                torque,
                mileage: 0,
                seats:car?.overview?.seatingOptions?.[0] || 5,
                purpose:[],
                images:{hero:car?.hero?.image || ""},
                hero:car?.hero || {},
                overview:car?.overview || {},
                pricing:car?.pricing || {},
                variants:car?.variants || [],
                original:car
            };
        });

        renderBrands();
        renderCars();
        renderSaved();

    } catch (error) {
        console.error("Car data error:", error);
        renderDataError(error);
    }
}

function renderDataError(error) {
    console.error(
        "Car data error:",
        error
    );
    if (els.carGrid) {
        els.carGrid.innerHTML = `
            <div class="empty-state">
                <h3>
                    Could not load cars
                </h3>
                <p>
                    Check JSON files
                </p>
            </div>
        `;
    }
}

function buildVariants(car) {
    const fuelOrder = car.fuel.includes("Electric") ? ["Electric"] : car.fuel;
    const trimNames =
        car.priceMax > 45
            ? ["Core", "Luxury", "AMG Line"]
            : car.priceMax > 25
                ? ["Smart", "Pure", "Adventure", "Accomplished"]
                : ["Base", "Smart", "Sharp", "Top"];
    const spread = Math.max(car.priceMax - car.priceMin, 1);
    const variants = [];

    trimNames.forEach((trim, trimIndex) => {
        fuelOrder.forEach((fuel, fuelIndex) => {
            const gearboxes = car.transmission.includes("Automatic") && trimIndex > 0 ? ["Automatic"] : [car.transmission[0]];
            if (trimIndex === trimNames.length - 1 && car.transmission.includes("Automatic") && car.transmission.includes("Manual")) {
                gearboxes.unshift("Manual");
            }

            gearboxes.forEach((gearbox, gearboxIndex) => {
                const step = (trimIndex + fuelIndex * 0.35 + gearboxIndex * 0.22) / Math.max(trimNames.length - 1, 1);
                const price = Math.min(car.priceMax, car.priceMin + spread * step);
                const powerOffset = fuel === "Diesel" ? -8 : fuel === "Hybrid" ? 4 : fuel === "Electric" ? 0 : 0;
                const torqueOffset = fuel === "Diesel" ? 35 : fuel === "Hybrid" ? -12 : 0;
                const suffix = fuel === "Electric" ? gearbox : `${fuel} ${gearbox}`;

                const variant = {
                    id: `${car.id}-${trim.toLowerCase().replace(/\s+/g, "-")}-${fuel.toLowerCase()}-${gearbox.toLowerCase()}`,
                    name: `${trim} ${suffix}`,
                    trim,
                    fuel,
                    gearbox,
                    price,
                    power: Math.max(70, car.engine.power + powerOffset),
                    torque: Math.max(110, car.engine.torque + torqueOffset),
                    mileage: fuel === "Diesel" ? car.performance.mileage + 1.2 : fuel === "Hybrid" ? car.performance.mileage + 4.5 : car.performance.mileage,
                    safety: car.safety,
                    features: variantFeatures(car, trimIndex, trimNames.length),
                };
                variant.equipment = variantEquipment(car, variant, trimIndex, trimNames.length);
                variants.push(variant);
            });
        });
    });

    return variants.slice(0, 10);
}

function variantFeatures(car, trimIndex, totalTrims) {
    const base = [
        `${car.seats}-seat layout`,
        `${car.safety ==="Not tested yet"? car.safety : `${car.safety} ★ Safety`}`,
        "Dual airbags and ABS",
        "Touchscreen infotainment",
    ];
    const mid = [
        "Connected car tech",
        "Rear camera",
        "Cruise control",
        "Alloy wheels",
    ];
    const top = [
        "Panoramic sunroof",
        "Premium audio",
        "Ventilated front seats",
        "Advanced driver assistance features",
    ];
    const ev = car.fuel.includes("Electric") ? ["Fast charging support", "Regenerative braking"] : [];
    if (trimIndex >= totalTrims - 1) return [...base, ...mid, ...top, ...ev];
    if (trimIndex >= 1) return [...base, ...mid, ...ev];
    return [...base, ...ev];
}

function yesNo(value) {
    return value ? "Yes" : "No";
}

function variantEquipment(car, variant, trimIndex, totalTrims) {
    const level = totalTrims <= 1 ? 1 : trimIndex / (totalTrims - 1);
    const isMid = level >= 0.34;
    const isTop = level >= 0.67;
    const isLuxury = car.priceMax >= 40 || car.purpose.includes("Luxury");
    const isEv = variant.fuel === "Electric";
    const isSuv = car.body === "SUV" || car.body === "EV";

    return {
        engine: {
            type: isEv ? "Permanent magnet synchronous motor" : variant.fuel === "Diesel" ? "Turbo diesel" : variant.fuel === "Hybrid" ? "Petrol hybrid" : "Turbo petrol",
            displacement: isEv ? "Not applicable" : variant.fuel === "Diesel" ? "2.0L" : variant.fuel === "Hybrid" ? "1.5L hybrid" : car.engine.power > 170 ? "2.0L" : "1.5L",
            cylinders: isEv ? "Not applicable" : car.engine.power > 170 ? "4 cylinders" : "3/4 cylinders",
            battery: isEv ? "High-voltage lithium-ion battery" : variant.fuel === "Hybrid" ? "Hybrid battery pack" : "Not applicable",
            drive: isSuv && isTop && car.pricing.exShowroom.max > 20 ? "AWD / 4x4 available" : "FWD / RWD depending on model",
            emission: isEv ? "Zero tailpipe emission" : "BS6 Phase 2",
        },
        dimensions: {
            bodyType: car.bodyType,
            seats: `${car.seats}`,
            length: `${Math.round(3800 + car.pricing.exShowroom.max * 24)} mm`,
            width: `${Math.round(1700 + car.pricing.exShowroom.max * 5)} mm`,
            height: `${Math.round((isSuv ? 1600 : 1450) + car.pricing.exShowroom.max * 2)} mm`,
            wheelbase: `${Math.round(2450 + car.pricing.exShowroom.max * 10)} mm`,
            clearance: `${car.dimensions.groundClearance} mm`,
            boot: `${Math.round(300 + car.seats * 20 + (car.body === "Sedan" ? 80 : 0))} litres`,
            fuelTank: isEv ? "Not applicable" : `${Math.round(38 + car.pricing.exShowroom.max / 2)} litres`,
        },
        chassis: {
            frontSuspension: "Independent front suspension",
            rearSuspension: isSuv ? "Torsion beam / multi-link depending on variant" : "Torsion beam / multi-link",
            frontBrakes: "Disc",
            rearBrakes: isMid ? "Disc" : "Drum / disc depending on variant",
            tyreSize: isTop ? "R18 / R19 alloy wheels" : isMid ? "R16 / R17 alloy wheels" : "R15 / R16 steel wheels",
            spareWheel: isTop ? "Space saver spare" : "Full-size spare",
        },
        safety: {
            airbags: isTop ? "6 or 7 airbags" : isMid ? "6 airbags" : "2 airbags",
            abs: true,
            esc: isMid || car.safety >= 5,
            hillHold: isSuv && isMid,
            tpms: isMid,
            isofix: car.seats >= 5,
            camera: isTop ? "360-degree camera" : isMid ? "Rear camera" : "Rear sensors",
            adas: isTop && (car.priceMax > 18 || isLuxury),
            parkingSensors: isMid ? "Front and rear" : "Rear",
        },
        comfort: {
            climate: isTop ? "Dual-zone automatic climate control" : isMid ? "Automatic climate control" : "Manual AC",
            seatMaterial: isTop || isLuxury ? "Leatherette upholstery" : "Fabric upholstery",
            poweredDriverSeat: isTop,
            ventilatedSeats: isTop && car.priceMax > 15,
            sunroof: isTop && car.priceMax > 10 ? "Panoramic / electric sunroof" : isMid ? "Single-pane sunroof available" : "No",
            cruiseControl: isMid,
            keylessEntry: isMid,
            rearAcVents: car.seats >= 5,
        },
        infotainment: {
            screen: isTop ? "10-inch+ touchscreen" : isMid ? "8-inch touchscreen" : "7-inch touchscreen / audio unit",
            cluster: isTop ? "Digital instrument cluster" : isMid ? "Semi-digital cluster" : "Analogue cluster",
            speakers: isTop ? "8+ speaker premium audio" : isMid ? "6 speakers" : "4 speakers",
            connectedCar: isMid,
            wirelessPhone: isTop,
            androidAutoAppleCarPlay: true,
        },
        exterior: {
            headlamps: isTop ? "LED projector / matrix LED" : isMid ? "LED headlamps" : "Halogen / LED depending on variant",
            drls: isMid,
            wheels: isTop ? "Diamond-cut alloys" : isMid ? "Alloy wheels" : "Steel wheels",
            roofRails: isSuv,
            wipers: isTop ? "Rain-sensing wipers" : "Manual wipers",
            mirrors: isMid ? "Electric folding ORVMs" : "Electric ORVMs",
        },
    };
}

function comparisonGroups() {
    return [
        {
            title: "Price and Variant",
            rows: [
                ["Variant", ({ variant }) => variant.name],
                ["Ex-showroom price", ({ variant }) => formatSinglePrice(variant.price), ({ variant }) => variant.price],
                ["Trim", ({ variant }) => variant.trim],
                ["Body type", ({ car }) => car.bodyType],
                ["Seats", ({ car }) => `${car.seats}`],
            ],
        },
        {
            title: "Engine and Performance",
            rows: [
                ["Engine / motor", ({ variant }) => variant.equipment.engine.type],
                ["Displacement", ({ variant }) => variant.equipment.engine.displacement],
                ["Cylinders", ({ variant }) => variant.equipment.engine.cylinders],
                ["Battery", ({ variant }) => variant.equipment.engine.battery],
                ["Fuel", ({ variant }) => variant.fuel],
                ["Transmission", ({ variant }) => variant.gearbox],
                ["Drive type", ({ variant }) => variant.equipment.engine.drive],
                ["Power", ({ variant }) => `${variant.power} hp`, ({ variant }) => variant.power],
                ["Torque", ({ variant }) => `${variant.torque} Nm`, ({ variant }) => variant.torque],
                ["Mileage / range", ({ variant }) => `${variant.mileage.toFixed(1)} ${variant.fuel === "Electric" ? "km range" : "km/l"}`, ({ variant }) => variant.mileage],
                ["Emission standard", ({ variant }) => variant.equipment.engine.emission],
            ],
        },
        {
            title: "Dimensions and Capacity",
            rows: [
                ["Length", ({ variant }) => variant.equipment.dimensions.length],
                ["Width", ({ variant }) => variant.equipment.dimensions.width],
                ["Height", ({ variant }) => variant.equipment.dimensions.height],
                ["Wheelbase", ({ variant }) => variant.equipment.dimensions.wheelbase],
                ["Ground clearance", ({ car }) => `${car.dimensions.groundClearance} mm`, ({ car }) => car.dimensions.groundClearance],
                ["Boot space", ({ variant }) => variant.equipment.dimensions.boot],
                ["Fuel tank", ({ variant }) => variant.equipment.dimensions.fuelTank],
            ],
        },
        {
            title: "Suspension, Brakes and Tyres",
            rows: [
                ["Front suspension", ({ variant }) => variant.equipment.chassis.frontSuspension],
                ["Rear suspension", ({ variant }) => variant.equipment.chassis.rearSuspension],
                ["Front brakes", ({ variant }) => variant.equipment.chassis.frontBrakes],
                ["Rear brakes", ({ variant }) => variant.equipment.chassis.rearBrakes],
                ["Tyre / wheel size", ({ variant }) => variant.equipment.chassis.tyreSize],
                ["Spare wheel", ({ variant }) => variant.equipment.chassis.spareWheel],
            ],
        },
        {
            title: "Safety and Driver Assistance",
            rows: [
                ["Safety rating", ({ variant }) => `${variant.safety} ★ Safety`, ({ variant }) => variant.safety],
                ["Airbags", ({ variant }) => variant.equipment.safety.airbags],
                ["ABS with EBD", ({ variant }) => yesNo(variant.equipment.safety.abs)],
                ["ESC", ({ variant }) => yesNo(variant.equipment.safety.esc)],
                ["Hill hold", ({ variant }) => yesNo(variant.equipment.safety.hillHold)],
                ["TPMS", ({ variant }) => yesNo(variant.equipment.safety.tpms)],
                ["ISOFIX", ({ variant }) => yesNo(variant.equipment.safety.isofix)],
                ["Camera", ({ variant }) => variant.equipment.safety.camera],
                ["ADAS", ({ variant }) => yesNo(variant.equipment.safety.adas)],
                ["Parking sensors", ({ variant }) => variant.equipment.safety.parkingSensors],
            ],
        },
        {
            title: "Comfort and Convenience",
            rows: [
                ["Climate control", ({ variant }) => variant.equipment.comfort.climate],
                ["Seat material", ({ variant }) => variant.equipment.comfort.seatMaterial],
                ["Powered driver seat", ({ variant }) => yesNo(variant.equipment.comfort.poweredDriverSeat)],
                ["Ventilated seats", ({ variant }) => yesNo(variant.equipment.comfort.ventilatedSeats)],
                ["Sunroof", ({ variant }) => variant.equipment.comfort.sunroof],
                ["Cruise control", ({ variant }) => yesNo(variant.equipment.comfort.cruiseControl)],
                ["Keyless entry", ({ variant }) => yesNo(variant.equipment.comfort.keylessEntry)],
                ["Rear AC vents", ({ variant }) => yesNo(variant.equipment.comfort.rearAcVents)],
            ],
        },
        {
            title: "Infotainment and Interior Tech",
            rows: [
                ["Touchscreen", ({ variant }) => variant.equipment.infotainment.screen],
                ["Instrument cluster", ({ variant }) => variant.equipment.infotainment.cluster],
                ["Speakers", ({ variant }) => variant.equipment.infotainment.speakers],
                ["Connected car tech", ({ variant }) => yesNo(variant.equipment.infotainment.connectedCar)],
                ["Wireless charger", ({ variant }) => yesNo(variant.equipment.infotainment.wirelessPhone)],
                ["Android Auto / Apple CarPlay", ({ variant }) => yesNo(variant.equipment.infotainment.androidAutoAppleCarPlay)],
            ],
        },
        {
            title: "Exterior Equipment",
            rows: [
                ["Headlamps", ({ variant }) => variant.equipment.exterior.headlamps],
                ["DRLs", ({ variant }) => yesNo(variant.equipment.exterior.drls)],
                ["Wheels", ({ variant }) => variant.equipment.exterior.wheels],
                ["Roof rails", ({ variant }) => yesNo(variant.equipment.exterior.roofRails)],
                ["Wipers", ({ variant }) => variant.equipment.exterior.wipers],
                ["ORVMs", ({ variant }) => variant.equipment.exterior.mirrors],
            ],
        },
        {
            title: "Variant Features",
            rows: [["Included features", ({ variant }) => variant.features.join(", ")]],
        },
    ];
}

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
                ${groups
                    .map((group) => `
                        <tr class="compare-category-row">
                            <th colspan="${selected.length + 1}">${group.title}</th>
                        </tr>
                        ${group.rows
                            .map(([label, value, metric]) => {
                                const max = metric ? Math.max(...selected.map((item) => metric(item))) : 0;
                                    return `
                                        <tr>
                                            <th>${label}</th>
                                            ${selected
                                                .map((item) => {
                                                    const numericValue = metric ? metric(item) : 0;
                                                    const width = metric ? Math.max(8, (numericValue / max) * 100) : 0;
                                                    return `<td><strong>${value(item)}</strong>${metric ? `<span class="bar"><i style="width:${width}%"></i></span>` : ""}</td>`;
                                                })
                                                .join("")
                                            }
                                        </tr>
                                    `;
                                })
                            .join("")}
                        `,)
                    .join("")
                }
            </tbody>
        </table>
    `;
}

function renderVariantDetailGroups(car, variant) {
    const item = { car, variant };
    return `
        <div class="variant-detail-groups">
            ${comparisonGroups()
                .filter((group) => group.title !== "Price and Variant")
                .map(
                    (group) => `
                <details class="variant-detail-group">
                    <summary>${group.title}</summary>
                    <dl>
                        ${group.rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value(item)}</dd></div>`).join("")}
                    </dl>
                </details>
                `,
                )
                .join("")
            }
        </div>
    `;
}

function renderVariantConfigurations(car, variant, variants) {
    const sameTrim = variants.filter((candidate) => candidate.trim === variant.trim);
    const powertrainOptions = sameTrim.map((option) => {
        const engineText =
            option.fuel === "Electric"
                ? option.equipment.engine.type
                : `${option.equipment.engine.displacement} ${option.equipment.engine.type}`;
        return `
            <li>
                <strong>${option.fuel} ${option.gearbox}</strong>
                <span>${engineText} · ${option.power} hp · ${option.torque} Nm · ${formatSinglePrice(option.price)}</span>
            </li>
        `;
    });

    const packs = [
        {
            label: "Seating",
            value: car.seats >= 7 && car.priceMax > 18 ? `${car.seats}-seat layout; captain-seat option on higher trims` : `${car.seats}-seat layout`,
        },
        {
            label: "Drive",
            value: variant.equipment.engine.drive,
        },
        {
            label: "Wheels",
            value: variant.equipment.chassis.tyreSize,
        },
        {
            label: "Safety pack",
            value: `${variant.equipment.safety.airbags}, ${variant.equipment.safety.camera}, ADAS: ${yesNo(variant.equipment.safety.adas)}`,
        },
        {
            label: "Comfort pack",
            value: `${variant.equipment.comfort.climate}, ${variant.equipment.comfort.seatMaterial}, sunroof: ${variant.equipment.comfort.sunroof}`,
        },
    ];

    return `
        <section class="variant-configurations">
            <h4>Available configurations in this variant</h4>
            <div class="configuration-grid">
                <div>
                    <span>Powertrain options</span>
                    <ul>${powertrainOptions.join("")}</ul>
                </div>
                <div>
                    <span>Equipment choices</span>
                    <dl>
                        ${packs.map((pack) => `<div><dt>${pack.label}</dt><dd>${pack.value}</dd></div>`).join("")}
                    </dl>
                </div>
            </div>
        </section>
    `;
}

function matchesBudget(car) {
    if (state.budget === "all") return true;
    if (state.budget === "under10") return car.priceMin < 10;
    if (state.budget === "10to20") return car.priceMin <= 20 && car.priceMax >= 10;
    if (state.budget === "20to40") return car.priceMin <= 40 && car.priceMax >= 20;
    if (state.budget === "luxury") return car.priceMax >= 40 || car.purpose.includes("Luxury");
    return true;
}

function getFilteredCars() {
    const query = state.query.trim().toLowerCase();
    return cars.filter((car) => {
        const searchable = [
            car.name,
            car.brand,
            car.body,
            ...(car.fuel || []),
            ...(car.transmission || []),
            ...(car.purpose || []),
            car.summary,
            car.safety >= 5 ? "5 ★ Safety" : "",
            car.priceMax <= 20 ? "under inr 20l" : "",
        ]
            .join(" ")
            .toLowerCase();

        return (
            (!query || searchable.includes(query)) &&
            (state.selectedBrand === "all" || car.brand === state.selectedBrand) &&
            matchesBudget(car) &&
            (state.body === "all" || car.body === state.body) &&
            (state.fuel === "all" || car?.fuel?.includes(state.fuel)) &&
            (state.transmission === "all" || car?.transmission?.includes(state.transmission)) &&
            (state.safety === "all" || car.safety >= Number(state.safety))
        );
    });
}

function brandSummary() {
    const map = new Map();
    cars.forEach((car) => {
        const current = map.get(car.brand) || { count: 0, min: car.priceMin, max: car.priceMax, sample: car.name, logo: car.logo || null };
        current.count += 1;
        current.min = Math.min(current.min, car.priceMin);
        current.max = Math.max(current.max, car.priceMax);
        map.set(car.brand, current);
    });
    return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b));
}

function renderBrands() {
    els.brandGrid.innerHTML = brandSummary()
        .map(
            ([brand, info]) => `
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
            `,
        )
        .join("");
}

function renderCars() {
    const filtered = getFilteredCars();
    if (els.resultCount) {
        els.resultCount.textContent = `${filtered.length} car${filtered.length === 1 ? "" : "s"} found`;
    }
    els.carGrid.innerHTML = filtered
        .map((car) => {
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
                            <div class="spec-tile"><span>Power</span><strong>${car.power.min === car.power.max ? `${car.power.max} hp` : `${car.power.min} hp - ${car.power.max} hp` }</strong></div>
                            <div class="spec-tile"><span>Torque</span><strong>${car.torque.min === car.torque.max ? `${car.torque.max} Nm` : `${car.torque.min}Nm - ${car.torque.max} Nm` }</strong></div>
                            <div class="spec-tile"><span>Safety</span><strong>${car.safety ==="Not tested yet"? car.safety : `${car.safety} ★ Safety`}</strong></div>
                        </div>
                        <div class="card-actions">
                            <button class="secondary-button" type="button" data-details="${car.id}">Read review</button>
                            <button class="secondary-button" type="button" data-save="${car.id}">${saved ? "Saved" : "Save"}</button>
                            <button class="primary-button" type="button" data-compare="${car.id}">${comparing ? "Selected" : "Compare"}</button>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");
}

function renderComparePicker() {
    const slots = [0, 1, 2];
    els.comparePicker.innerHTML = slots
        .map((slot) => {
            const item = state.compare[slot];
            const car = item ? cars.find((candidate) => candidate.id === item.carId) : null;
            const variants = car ? buildVariants(car) : [];
            const selectedVariant = car ? item.variantId || variants[0]?.id : "";

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
                            ${cars.map((option) => `<option value="${option.id}" ${car?.id === option.id ? "selected" : ""}>${option.name}</option>`).join("")}
                        </select>
                    </label>
                    <label>
                        Select variant
                        <select data-compare-slot-variant="${slot}" ${car ? "" : "disabled"}>
                            ${car ? variants.map((variant) =>`<option value="${variant.id}" ${selectedVariant === variant.id ? "selected" : ""}>${variant.name} · ${formatSinglePrice(variant.price)}</option>`,).join("") : `<option value="">Choose car first</option>`}
                        </select>
                    </label>
                </div>
            `;
        })
        .join("");
}

function renderCompareOutput() {
    const selected = state.compare
        .map((item) => {
            const car = cars.find((candidate) => candidate.id === item.carId);
            if (!car) return null;
            const variants = buildVariants(car);
            const variant = variants.find((candidate) => candidate.id === item.variantId) || variants[0];
            return { car, variant };
        })
        .filter(Boolean);

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

function renderSaved() {
    const savedCars = state.saved.map((id) => cars.find((car) => car.id === id)).filter(Boolean);
    els.savedGrid.innerHTML = savedCars
        .map(
            (car) => `
                <article class="saved-card">
                    <img src="${car.images.hero}" alt="${car.name}" loading="lazy" />
                    <span class="badge">${car.brand}</span>
                    <h3>${car.name}</h3>
                    <p>${formatPrice(car.priceMin, car.priceMax)} · ${car.power} hp · ${car.safety ==="Not tested yet"? car.safety : `${car.safety} ★ Safety`}</p>
                    <div class="card-actions">
                        <button class="secondary-button" type="button" data-details="${car.id}">Open</button>
                        <button class="secondary-button" type="button" data-save="${car.id}">Remove</button>
                    </div>
                </article>
            `,
        )
        .join("");
}

function renderAll() {
    renderCars();
    renderComparePicker();
    renderCompareOutput();
    renderSaved();
}

function selectCompare(id) {
    const car = cars.find((candidate) => candidate.id === id);
    if (!car) return;
    const existingIndex = state.compare.findIndex((item) => item.carId === id);
    if (existingIndex >= 0) {
        state.compare = state.compare.filter((_, index) => index !== existingIndex);
    } else if (state.compare.length < 3) {
        state.compare.push({ carId: id, variantId: buildVariants(car)[0].id });
    } else {
        state.compare = [...state.compare.slice(1), { carId: id, variantId: buildVariants(car)[0].id }];
    }
    renderAll();
}

function toggleSave(id) {
    state.saved = state.saved.includes(id) ? state.saved.filter((carId) => carId !== id) : [...state.saved, id];
    localStorage.setItem("atyaSavedCars", JSON.stringify(state.saved));
    renderAll();
}

// function carPersonality(car) {
//     if (car.fuel.includes("Electric")) return "quiet torque, lower running costs, and a more future-facing ownership experience";
//     if (car.purpose.includes("Off-road")) return "rugged confidence, road presence, and the ability to handle rougher routes";
//     if (car.purpose.includes("Performance")) return "strong acceleration, confident highway manners, and a more enthusiastic drive";
//     if (car.purpose.includes("Luxury")) return "comfort, image, refinement, and a cabin that feels special every day";
//     if (car.purpose.includes("First")) return "easy ownership, sensible pricing, and a compact footprint for Indian cities";
//     return "everyday comfort, useful features, and a balanced ownership package";
// }

// function renderCarBlog(car) {
//     const fuelText = car.fuel.join(" / ");
//     const gearboxText = car.transmission.join(" / ");
//     const priceBand =
//         car.priceMax < 12
//             ? "budget-conscious"
//             : car.priceMin < 20
//                 ? "mainstream premium"
//                 : car.priceMin < 40
//                     ? "upper mainstream"
//                     : "luxury";
//     const mileageLabel = car.fuel.includes("Electric") ? `${car.performance.mileage} km claimed range` : `${car.performance.mileage} km/l claimed efficiency`;
//     const strengths = [
//         `${car.engine.power} hp and ${car.engine.torque} Nm give it a strong headline spec for its class.`,
//         `${car.safety ==="Not tested yet"? car.safety : `${car.safety} ★ Safety`} safety makes it easier to recommend for serious family use.`,
//         `${car.dimensions.groundClearance} mm ground clearance suits Indian roads better than many low-slung alternatives.`,
//     ];
//     const compromises = [
//         car.pricing.exShowroom.max > 30
//             ? "The higher variants can feel expensive once you start comparing them with larger or more premium alternatives."
//             : "The best features are likely concentrated in the higher variants, so the value depends heavily on trim choice.",
//         car.fuel.includes("Diesel")
//             ? "Diesel buyers should consider city restrictions, long-term usage patterns, and local registration rules."
//             : "Real-world efficiency will depend strongly on traffic, tyre size, driving style, and variant weight.",
//         typeof car.safety === "number" && car.safety < 5
//             ? "Safety-conscious buyers should compare crash-test performance and active safety features before finalizing."
//             : "Even with a strong safety rating, variant-wise safety equipment should be checked carefully.",
//     ];

//     return `
//         <article class="car-blog">
//             <div class="blog-kicker">Atya road note</div>
//             <h3>${car.name} review: who should actually buy it?</h3>
//             <p>
//                 The ${car.name} sits in the ${priceBand} space of the Indian market, priced between
//                 ${formatPrice(car.priceMin, car.priceMax)}. On paper, it brings ${fuelText.toLowerCase()}
//                 powertrain choices, ${gearboxText.toLowerCase()} transmission options, and a clear focus on
//                 ${carPersonality(car)}.
//             </p>
//             <p>
//                 What makes this car interesting is not just one number. It is the combination of ${car.engine.power} hp,
//                 ${car.engine.torque} Nm, ${car.seats} seats, ${mileageLabel}, and a ${car.safety ==="Not tested yet"? car.safety : `${car.safety} ★ Safety`}
//                 That blend tells you where the ${car.name} fits: it is built for buyers who want a car that feels
//                 capable in daily life without losing sight of long-term practicality.
//             </p>
//             <p>
//                 In typical Indian use, the important questions are simple: will it handle rough roads, does it feel
//                 relaxed on highways, is the cabin practical, and does the variant you want justify the price? The
//                 ${car.name} answers those questions best for shoppers looking at ${car.purpose.join(", ").toLowerCase()}
//                 use cases.
//             </p>

//             <div class="blog-panels">
//                 <section>
//                     <h4>Why it stands out</h4>
//                     <ul>
//                         ${strengths.map((item) => `<li>${item}</li>`).join("")}
//                     </ul>
//                 </section>
//                 <section>
//                     <h4>What to check before buying</h4>
//                     <ul>
//                         ${compromises.map((item) => `<li>${item}</li>`).join("")}
//                     </ul>
//                 </section>
//             </div>

//             <section class="verdict-box">
//                 <h4>Atya verdict</h4>
//                 <p>
//                     Choose the ${car.name} if you want ${carPersonality(car)} in a ${car.body.toLowerCase()} body style.
//                     Shortlist it against close rivals on price, safety equipment, after-sales comfort, and the exact variant
//                     you plan to buy.
//                 </p>
//             </section>
//         </article>
//     `;
// }

function renderVariantSection(car) {
    const variants = buildVariants(car);
    if (!state.variantCompare[car.id]) {
        state.variantCompare[car.id] = variants.slice(0, 3).map((variant) => variant.id);
    }
    const selectedIds = state.variantCompare[car.id].filter((id) => variants.some((variant) => variant.id === id));
    const selectedVariants = selectedIds.map((id) => variants.find((variant) => variant.id === id));
    const selectedItems = selectedVariants.map((variant) => ({ car, variant }));

    return `
        <section class="variant-section" id="variants">
            <div class="section-heading tight">
                <p class="eyebrow">Variants and equipment</p>
                <h2>${car.name} variants.</h2>
                <p>Variant data here is structured starter content for the product experience. Replace it with verified brand data before publishing.</p>
            </div>

            <div class="variant-layout">
                <div class="variant-list">
                    ${variants
                        .map(
                            (variant) => `
                                <article class="variant-card">
                                    <div>
                                        <span class="badge">${variant.trim}</span>
                                        <h3>${variant.name}</h3>
                                        <p>${variant.fuel} · ${variant.gearbox} · ${formatSinglePrice(variant.price)}</p>
                                    </div>
                                    <div class="variant-spec-row">
                                        <span>${variant.power} hp</span>
                                        <span>${variant.torque} Nm</span>
                                        <span>${variant.mileage.toFixed(1)} ${variant.fuel === "Electric" ? "km" : "km/l"}</span>
                                    </div>
                                    <ul>
                                        ${variant.features.map((feature) => `<li>${feature}</li>`).join("")}
                                    </ul>
                                    ${renderVariantConfigurations(car, variant, variants)}
                                    ${renderVariantDetailGroups(car, variant)}
                                    <label class="compare-check">
                                        <input type="checkbox" data-variant-compare="${variant.id}" data-car-id="${car.id}" ${selectedIds.includes(variant.id) ? "checked" : ""} />
                                        Compare variant
                                    </label>
                                </article>
                            `,
                        )
                        .join("")}
                </div>
                <aside class="variant-compare-panel">
                    <div class="panel-heading">
                        <p class="eyebrow">Same car comparison</p>
                        <h3>Compare variants</h3>
                        <p>Select up to three variants of the ${car.name}.</p>
                    </div>
                    ${selectedVariants.length? `${renderGroupedComparisonTable(selectedItems)}` : `<div class="empty-state"><p>Select variants from the list to compare them here.</p></div>`}
                </aside>
            </div>
        </section>
    `;
}

function renderCarPage(id, options = {}) {
    const car = cars.find((item) => item.id === id);
    if (!car) {
        return;
    }

    document.title = `${car.name} Review, Specs and Price | Atya`;
    if (!options.preserveScroll) {
        window.scrollTo({ top: 0, behavior: "instant" });
    }
}

function applyPurpose(purpose) {
    state.query = purpose;
    els.search.value = purpose;
    document.querySelector("/#explore").scrollIntoView({ behavior: "smooth" });
    renderCars();
}

function resetFilters() {
    Object.assign(state, {
        query: "",
        budget: "all",
        body: "all",
        fuel: "all",
        transmission: "all",
        safety: "all",
        selectedBrand: "all",
    });
    els.search.value = "";
    els.budget.value = "all";
    els.body.value = "all";
    els.fuel.value = "all";
    els.transmission.value = "all";
    els.safety.value = "all";
    renderCars();
}

/* ── Sun ray animation for the toggle knob ── */
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

function updateThemeToggle() {
    const toggle = document.querySelector(".theme-toggle");
    toggle.classList.toggle("light", document.documentElement.classList.contains("light"));
}

document.addEventListener("scroll", () => {
    els.header.classList.toggle("scrolled", window.scrollY > 16);
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
    if (save) {
        toggleSave(save.dataset.save);
    }
    if (compare) {
        selectCompare(compare.dataset.compare);
    }
    if (removeCompareSlot) {
        state.compare.splice(Number(removeCompareSlot.dataset.removeCompareSlot), 1);
        renderAll();
    }
    if (card && !event.target.closest("button")) openCarPage(card.dataset.cardDetails);
    if (brand) {
        state.selectedBrand = state.selectedBrand === brand.dataset.brand ? "all" : brand.dataset.brand;
        document.querySelector("/#explore").scrollIntoView({ behavior: "smooth" });
        renderCars();
    }
    if (chip) {
        state.query = chip.dataset.chip;
        els.search.value = chip.dataset.chip;
        document.querySelector("/#explore").scrollIntoView({ behavior: "smooth" });
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

els.heroSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = els.search.value;
    document.querySelector("/#explore").scrollIntoView({ behavior: "smooth" });
    renderCars();
});

els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderCars();
});

[els.budget, els.body, els.fuel, els.transmission, els.safety].forEach((select) => {
    select.addEventListener("change", () => {
        state.budget = els.budget.value;
        state.body = els.body.value;
        state.fuel = els.fuel.value;
        state.transmission = els.transmission.value;
        state.safety = els.safety.value;
        renderCars();
    });
});

els.reset.addEventListener("click", resetFilters);

els.comparePicker.addEventListener("change", (event) => {
    const carSelect = event.target.closest("[data-compare-slot-car]");
    const variantSelect = event.target.closest("[data-compare-slot-variant]");

    if (carSelect) {
        const slot = Number(carSelect.dataset.compareSlotCar);
        const car = cars.find((candidate) => candidate.id === carSelect.value);
        if (!car) {
            state.compare.splice(slot, 1);
        } else {
            state.compare[slot] = { carId: car.id, variantId: buildVariants(car)[0].id };
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
});

els.themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const isLight = document.documentElement.classList.contains("light");
    localStorage.setItem("atyaTheme", isLight ? "light" : "dark");
});

initTheme();
loadCars()
    .then(() => {
        renderBrands();
        renderAll();
    })
    .catch((error) => {
        console.error(error);
    });

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadCars();
    }
);