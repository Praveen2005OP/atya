/* ==========================================================================
   Car Reviews widget
   Self-contained: only touches elements inside templates/car/car_reviews.html,
   so it can't collide with home.js / script.js on the homepage.
   ========================================================================== */

/* ---------------- Star icon helper ---------------- */
function starIcon(filled) {
    return filled
        ? '<svg viewBox="0 0 20 20" class="star-fill"><path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z"/></svg>'
        : '<svg viewBox="0 0 20 20" class="star-empty"><path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z"/></svg>';
}
function starsHTML(rating) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += starIcon(i <= Math.round(rating));
    return s;
}

/* ---------------- Load reviews rendered by Django ----------------
   Reads the json_script data island produced by car_detail() in
   views.py (car.reviews = [review.to_dict() for review in ...]).
   Guards against anything other than a real array (missing key, null,
   or an empty string all fall back to []) so a data hiccup can't crash
   this whole script and silently break every button below it. */
const reviewsDataEl = document.getElementById('reviews-data');
let rawReviews = [];
if (reviewsDataEl) {
    try {
        const parsed = JSON.parse(reviewsDataEl.textContent);
        if (Array.isArray(parsed)) rawReviews = parsed;
    } catch (err) {
        console.error('Reviews data could not be parsed:', err);
    }
}

// Normalize fields so partial review dicts still render fine.
let reviews = rawReviews.map((r) => ({
    title: r.title || '',
    author: r.author || 'Anonymous',
    email: r.email || '',
    date: r.date || new Date().toISOString().slice(0, 10),
    content: r.content || '',
    rating: r.rating || 5,
    photos: r.photos || [],
    helpful: r.helpful || 0,
    liked: false,
    verified: !!r.verified
}));

/* ---------------- Stats + summary ---------------- */
function computeReviewStats() {
    const total = reviews.length;
    const avg = total ? reviews.reduce((a, r) => a + r.rating, 0) / total : 0;
    const dist = [0, 0, 0, 0, 0]; // index0 -> 5 star ... index4 -> 1 star
    reviews.forEach((r) => dist[5 - r.rating]++);
    return { total, avg, dist };
}

function renderReviewSummary() {
    const { total, avg, dist } = computeReviewStats();
    document.getElementById('avgScore').textContent = total ? avg.toFixed(1) : '0.0';
    document.getElementById('avgStars').innerHTML = starsHTML(avg);
    document.getElementById('reviewCount').textContent = `(${total} review${total === 1 ? '' : 's'})`;

    document.getElementById('barsContainer').innerHTML = dist
        .map((count, idx) => {
            const stars = 5 - idx;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return `<div class="bar-row">
      <span class="label">${stars} star</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
      <span class="count">${count}</span>
    </div>`;
        })
        .join('');
}

/* ---------------- Review list ---------------- */
function renderReviewList(sortMode) {
    const list = [...reviews];

    if (!list.length) {
        document.getElementById('reviewList').innerHTML =
            '<div class="empty-state"><p>No reviews yet. Be the first to share your experience.</p></div>';
        return;
    }

    if (sortMode === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (sortMode === 'lowest') list.sort((a, b) => a.rating - b.rating);
    else if (sortMode === 'helpful') list.sort((a, b) => b.helpful - a.helpful);
    else list.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('reviewList');
    container.innerHTML = list
        .map((r) => {
            const realIndex = reviews.indexOf(r);
            const photosHTML = r.photos.length
                ? `<div class="photo-strip">${r.photos
                      .map((src) => `<img class="photo-thumb" src="${src}" data-review="${realIndex}">`)
                      .join('')}</div>`
                : '';
            const dateStr = new Date(r.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            return `<article class="review-panel">
      <h4>${r.title}</h4>
      <p class="review-author">By ${r.author} on ${dateStr}
        ${r.verified ? '<span class="verified-badge">✓ Verified Owner</span>' : ''}
      </p>
      <div class="review-rating stars">${starsHTML(r.rating)}</div>
      <p class="review-content">${r.content}</p>
      ${photosHTML}
      <div class="review-footer">
        <button class="helpful-btn ${r.liked ? 'liked' : ''}" data-review="${realIndex}">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9v9H3V9h3zm0 0l4-7c.6 0 1.6.4 1.6 2l-.6 3.5H15c1 0 1.8.9 1.6 1.9l-1.2 6c-.2 1-1 1.6-2 1.6H6"/></svg>
          Helpful (${r.helpful})
        </button>
      </div>
    </article>`;
        })
        .join('');

    container.querySelectorAll('.photo-thumb').forEach((img) => {
        img.addEventListener('click', () => openReviewLightbox(img.src));
    });
    container.querySelectorAll('.helpful-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            // "Helpful" stays client-side only for now (not persisted to the DB).
            const idx = +btn.dataset.review;
            reviews[idx].liked = !reviews[idx].liked;
            reviews[idx].helpful += reviews[idx].liked ? 1 : -1;
            renderReviewList(document.getElementById('sortSelect').value);
        });
    });
}

function renderReviewsSection() {
    renderReviewSummary();
    renderReviewList(document.getElementById('sortSelect').value);
}

document.getElementById('sortSelect').addEventListener('change', (e) => renderReviewList(e.target.value));

/* ---------------- Lightbox ---------------- */
function openReviewLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('open');
}
document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('open');
});
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') e.currentTarget.classList.remove('open');
});

/* ---------------- Write a review modal ---------------- */
const reviewForm = document.getElementById('reviewForm');
const reviewModalOverlay = document.getElementById('modalOverlay');
document.getElementById('openModalBtn').addEventListener('click', () => reviewModalOverlay.classList.add('open'));
document.getElementById('cancelModalBtn').addEventListener('click', closeReviewModal);
reviewModalOverlay.addEventListener('click', (e) => {
    if (e.target === reviewModalOverlay) closeReviewModal();
});
function closeReviewModal() {
    reviewModalOverlay.classList.remove('open');
    reviewForm.reset();
    pendingReviewPhotoFiles = [];
    syncFileInputFromPending();
    currentRating = 0;
    renderRatingSelector();
    document.getElementById('uploadPreview').innerHTML = '';
}

/* Star picker in modal */
let currentRating = 0;
function renderRatingSelector() {
    const el = document.getElementById('rateSelect');
    el.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const span = document.createElement('span');
        span.innerHTML = starIcon(i <= currentRating);
        span.addEventListener('click', () => {
            currentRating = i;
            document.getElementById('ratingInput').value = currentRating;
            renderRatingSelector();
        });
        el.appendChild(span);
    }
}
renderRatingSelector();

/* Photo upload - drag & drop + click.
   Real File objects are kept in pendingReviewPhotoFiles and synced into
   the hidden #fPhotos input via DataTransfer, so FormData(reviewForm)
   picks them up automatically on submit - no separate upload step. */
let pendingReviewPhotoFiles = [];
const uploadZone = document.getElementById('photos');
const fPhotos = document.getElementById('fPhotos');
const uploadPreview = document.getElementById('uploadPreview');

uploadZone.addEventListener('click', () => fPhotos.click());
fPhotos.addEventListener('change', (e) => handleReviewPhotoFiles(e.target.files));

['dragenter', 'dragover'].forEach((evt) => {
    uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag');
    });
});
['dragleave', 'drop'].forEach((evt) => {
    uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag');
    });
});
uploadZone.addEventListener('drop', (e) => handleReviewPhotoFiles(e.dataTransfer.files));

function handleReviewPhotoFiles(fileList) {
    [...fileList].forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        pendingReviewPhotoFiles.push(file);
    });
    syncFileInputFromPending();
    renderReviewUploadPreview();
}

// Rebuilds #fPhotos.files from pendingReviewPhotoFiles, since neither
// drag-drop nor removing a thumbnail updates a file input on its own.
function syncFileInputFromPending() {
    const dt = new DataTransfer();
    pendingReviewPhotoFiles.forEach((file) => dt.items.add(file));
    fPhotos.files = dt.files;
}

function renderReviewUploadPreview() {
    uploadPreview.innerHTML = pendingReviewPhotoFiles
        .map(
            (file, i) => `
    <div class="thumb-wrap">
      <img src="${URL.createObjectURL(file)}">
      <div class="remove" data-idx="${i}">&times;</div>
    </div>`
        )
        .join('');
    uploadPreview.querySelectorAll('.remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            pendingReviewPhotoFiles.splice(+btn.dataset.idx, 1);
            syncFileInputFromPending();
            renderReviewUploadPreview();
        });
    });
}

/* Simple email format check */
function isValidReviewEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Submit new review - POSTs to submit_review() in views.py, which saves
   the Review (+ photos) to the DB and emails a confirmation to the
   reviewer. On success, the server's saved review is added to the list
   so the page updates without a full reload. */
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (currentRating === 0) {
        alert('Please select a star rating.');
        return;
    }
    const email = document.getElementById('email').value.trim();
    if (!isValidReviewEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    document.getElementById('ratingInput').value = currentRating;

    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
        const response = await fetch(reviewForm.dataset.action, {
            method: 'POST',
            body: new FormData(reviewForm)
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            alert(data.error || 'Something went wrong. Please try again.');
            return;
        }

        reviews.unshift({ ...data.review, liked: false });
        document.getElementById('sortSelect').value = 'newest';
        renderReviewsSection();
        closeReviewModal();
    } catch (err) {
        console.error('Review submission failed:', err);
        alert('Could not submit your review right now. Please check your connection and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
    }
});

renderReviewsSection();