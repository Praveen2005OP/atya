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
    // Database ID (used for delete)
    id: r.id,
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
        }).join('');
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
                    <button class="delete-review-btn" data-review-id="${r.id}" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 100 100">
                        <path fill="#f37e98" d="M25,30l3.645,47.383C28.845,79.988,31.017,82,33.63,82h32.74c2.613,0,4.785-2.012,4.985-4.617L75,30"></path><path fill="#f15b6c" d="M65 38v35c0 1.65-1.35 3-3 3s-3-1.35-3-3V38c0-1.65 1.35-3 3-3S65 36.35 65 38zM53 38v35c0 1.65-1.35 3-3 3s-3-1.35-3-3V38c0-1.65 1.35-3 3-3S53 36.35 53 38zM41 38v35c0 1.65-1.35 3-3 3s-3-1.35-3-3V38c0-1.65 1.35-3 3-3S41 36.35 41 38zM77 24h-4l-1.835-3.058C70.442 19.737 69.14 19 67.735 19h-35.47c-1.405 0-2.707.737-3.43 1.942L27 24h-4c-1.657 0-3 1.343-3 3s1.343 3 3 3h54c1.657 0 3-1.343 3-3S78.657 24 77 24z"></path><path fill="#1f212b" d="M66.37 83H33.63c-3.116 0-5.744-2.434-5.982-5.54l-3.645-47.383 1.994-.154 3.645 47.384C29.801 79.378 31.553 81 33.63 81H66.37c2.077 0 3.829-1.622 3.988-3.692l3.645-47.385 1.994.154-3.645 47.384C72.113 80.566 69.485 83 66.37 83zM56 20c-.552 0-1-.447-1-1v-3c0-.552-.449-1-1-1h-8c-.551 0-1 .448-1 1v3c0 .553-.448 1-1 1s-1-.447-1-1v-3c0-1.654 1.346-3 3-3h8c1.654 0 3 1.346 3 3v3C57 19.553 56.552 20 56 20z"></path><path fill="#1f212b" d="M77,31H23c-2.206,0-4-1.794-4-4s1.794-4,4-4h3.434l1.543-2.572C28.875,18.931,30.518,18,32.265,18h35.471c1.747,0,3.389,0.931,4.287,2.428L73.566,23H77c2.206,0,4,1.794,4,4S79.206,31,77,31z M23,25c-1.103,0-2,0.897-2,2s0.897,2,2,2h54c1.103,0,2-0.897,2-2s-0.897-2-2-2h-4c-0.351,0-0.677-0.185-0.857-0.485l-1.835-3.058C69.769,20.559,68.783,20,67.735,20H32.265c-1.048,0-2.033,0.559-2.572,1.457l-1.835,3.058C27.677,24.815,27.351,25,27,25H23z"></path><path fill="#1f212b" d="M61.5 25h-36c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h36c.276 0 .5.224.5.5S61.776 25 61.5 25zM73.5 25h-5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h5c.276 0 .5.224.5.5S73.776 25 73.5 25zM66.5 25h-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h2c.276 0 .5.224.5.5S66.776 25 66.5 25zM50 76c-1.654 0-3-1.346-3-3V38c0-1.654 1.346-3 3-3s3 1.346 3 3v25.5c0 .276-.224.5-.5.5S52 63.776 52 63.5V38c0-1.103-.897-2-2-2s-2 .897-2 2v35c0 1.103.897 2 2 2s2-.897 2-2v-3.5c0-.276.224-.5.5-.5s.5.224.5.5V73C53 74.654 51.654 76 50 76zM62 76c-1.654 0-3-1.346-3-3V47.5c0-.276.224-.5.5-.5s.5.224.5.5V73c0 1.103.897 2 2 2s2-.897 2-2V38c0-1.103-.897-2-2-2s-2 .897-2 2v1.5c0 .276-.224.5-.5.5S59 39.776 59 39.5V38c0-1.654 1.346-3 3-3s3 1.346 3 3v35C65 74.654 63.654 76 62 76z"></path><path fill="#1f212b" d="M59.5 45c-.276 0-.5-.224-.5-.5v-2c0-.276.224-.5.5-.5s.5.224.5.5v2C60 44.776 59.776 45 59.5 45zM38 76c-1.654 0-3-1.346-3-3V38c0-1.654 1.346-3 3-3s3 1.346 3 3v35C41 74.654 39.654 76 38 76zM38 36c-1.103 0-2 .897-2 2v35c0 1.103.897 2 2 2s2-.897 2-2V38C40 36.897 39.103 36 38 36z"></path>
                        </svg>
                        Delete
                    </button>
                    <button class="helpful-btn ${r.liked ? 'liked' : ''}" data-review="${realIndex}">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9v9H3V9h3zm0 0l4-7c.6 0 1.6.4 1.6 2l-.6 3.5H15c1 0 1.8.9 1.6 1.9l-1.2 6c-.2 1-1 1.6-2 1.6H6"/></svg>
                        Helpful (${r.helpful})
                    </button>
                </div>
            </article>`;
        }).join('');

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
    container.querySelectorAll('.delete-review-btn').forEach((btn) => {
        btn.addEventListener('click', () => openDeleteModal(+btn.dataset.reviewId));
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
        .map((file, i) => `
            <div class="thumb-wrap">
                <img src="${URL.createObjectURL(file)}">
                <div class="remove" data-idx="${i}">&times;</div>
            </div>`
        ).join('');
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

/* ---------------- Delete review (email-confirmed) ---------------- */
const carSlug = document.querySelector('.review-section')?.dataset.carSlug || '';
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const deleteReviewForm = document.getElementById('deleteReviewForm');
let pendingDeleteReviewId = null;

function openDeleteModal(reviewId) {
    pendingDeleteReviewId = reviewId;
    document.getElementById('deleteEmail').value = '';
    deleteModalOverlay.classList.add('open');
}
function closeDeleteModal() {
    deleteModalOverlay.classList.remove('open');
    pendingDeleteReviewId = null;
}
document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
});

deleteReviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pendingDeleteReviewId) return;

    const email = document.getElementById('deleteEmail').value.trim();
    if (!isValidReviewEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    const submitBtn = deleteReviewForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append(
            'csrfmiddlewaretoken',
            reviewForm.querySelector('[name=csrfmiddlewaretoken]').value
        );

        const response = await fetch(`/car/${carSlug}/review/${pendingDeleteReviewId}/delete/`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            alert(data.error || 'Could not delete this review.');
            return;
        }

        reviews = reviews.filter((r) => r.id !== pendingDeleteReviewId);
        renderReviewsSection();
        closeDeleteModal();
    } catch (err) {
        console.error('Review deletion failed:', err);
        alert('Something went wrong. Please try again.');
    } finally {
        submitBtn.disabled = false;
    }
});

renderReviewsSection();