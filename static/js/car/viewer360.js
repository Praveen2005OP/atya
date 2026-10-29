// ── Car page: 360° exterior frames + Pannellum interior panorama ─────────────
// Frames live in /static/images/car-images/<slug>/{360,360-open}/img_0_0_NNN.webp
// and the interior cubemap in /static/images/car-images/<slug>/interior/1-6.webp.

export function initViewer360() {
    const frameViewer = document.querySelector(".frame-viewer");
    if (!frameViewer) return;

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
                    window.pannellum?.viewer("interior360", {
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

    // Match whatever the server actually rendered as the initial image -
    // some cars only have the "doors open" set, not a plain exterior 360.
    if (Number(frameViewer.dataset.frames) > 0) {
        currentFolder = "360";
        totalFrames = Number(frameViewer.dataset.frames);
    } else if (Number(frameViewer.dataset.openFrames) > 0) {
        currentFolder = "360-open";
        totalFrames = Number(frameViewer.dataset.openFrames);
    }
    currentFrame = 0;
    frameViewer.style.display = "block"; interiorViewer.style.display = "none";
    updateFrame(); startAutoRotate();
}
