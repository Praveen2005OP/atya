/* ==========================================================================
    Car Colors widget
    Self-contained: only touches elements inside templates/car/color.html,
    so it can't collide with home.js / script.js on the homepage.
   ========================================================================== */

// Read car data
const car = JSON.parse(
    document.getElementById("current-car-data").textContent
);

const colorImage = document.getElementById("colorImage");
const colorName = document.getElementById("colorName");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const swatchContainer = document.getElementById("swatchContainer");

let currentColor = 0;

function showColor(index) {
    const color = car.colors[index];
    const fileName = color.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .replace(/^-|-$/g, "");
    const imagePath =
        `/static/images/car-images/${car.slug}/color/${fileName}.png`;
    colorImage.src = imagePath;
    colorName.textContent = color.name;
    currentColor = index;
}

nextBtn.addEventListener("click", () => {
    currentColor = (currentColor + 1) % car.colors.length;
    showColor(currentColor);
});

prevBtn.addEventListener("click", () => {
    currentColor =
        (currentColor - 1 + car.colors.length) % car.colors.length;
    showColor(currentColor);
});

// Loop through colors and generate buttons
car.colors.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.style.backgroundColor = color.hex;
    // Set the first item as active by default
    if (index === 0) swatch.classList.add("active");
    swatch.addEventListener("click", (e) => {
        // Remove 'active' class from all other swatches
        document.querySelectorAll("#swatchContainer button").forEach(btn => {
            btn.classList.remove("active");
        });
        // Add 'active' class to the clicked swatch
        e.target.classList.add("active");
        // Call your existing function to update the car visual
        showColor(index);
    });
    swatchContainer.appendChild(swatch);
});

// Show first color on page load
showColor(0);