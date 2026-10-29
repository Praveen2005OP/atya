// ── Homepage hero: random car image on each visit ────────────────────────────
// Images: /static/images/car-images/heroImages/1.png ... 11.png

const HERO_IMAGE_COUNT = 11;

export function initHeroImage() {
    const heroImage = document.getElementById("hero-image");
    if (!heroImage) return;
    const randomNum = Math.floor(Math.random() * HERO_IMAGE_COUNT) + 1;
    heroImage.src = `/static/images/car-images/heroImages/${randomNum}.png`;
}
