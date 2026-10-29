import json
from pathlib import Path
from django.conf import settings
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.db.models import F
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils.html import escape, linebreaks
from django.views.decorators.http import require_POST
from PIL import Image
from .models import Feedback, Review, ReviewPhoto

BASE_DIR = Path(__file__).resolve().parent.parent
CARS_PATH = BASE_DIR / "data" / "cars"

MAX_REVIEW_PHOTOS = 5
MAX_REVIEW_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

# Parsed car JSON, reused until a file in data/cars is added/removed/edited.
_cars_cache = {"signature": None, "cars": []}

def load_cars():
    files = sorted(CARS_PATH.glob("*.json"))
    signature = tuple((file.name, file.stat().st_mtime_ns) for file in files)
    if signature != _cars_cache["signature"]:
        cars = []
        for file in files:
            with open(file, encoding="utf-8") as f:
                cars.append(json.load(f))
        _cars_cache["cars"] = cars
        _cars_cache["signature"] = signature
    return _cars_cache["cars"]

def normalize_slug(slug):
    return slug.lower().replace("_", "-")

def car_detail(request,slug):
    cars = load_cars()
    normalized_slug = normalize_slug(slug)
    car = next(
        (
            car for car in cars
            if normalize_slug(car.get("slug", "")) == normalized_slug
        ),
        None
    )

    if car is None:
        raise Http404("Car not found")

    # Shallow copy so adding "reviews" doesn't leak into the cached car.
    car = dict(car)
    # Reviews live in the DB (Review model), not the car JSON files -
    # car.reviews is what car_reviews.html / car-reviews.js render.
    liked_ids = set(request.session.get("liked_reviews", []))
    try:
        car["reviews"] = []
        for review in Review.objects.filter(car_slug=normalized_slug).defer("email").prefetch_related("photos"):
            review_dict = review.to_dict()
            review_dict["liked"] = review.id in liked_ids
            review_dict["mine"] = request.user.is_authenticated and review.user_id == request.user.id
            car["reviews"].append(review_dict)
    except Exception as exc:
        print(f"Review load failed: {exc}")
        car["reviews"] = []

    return render(
        request,
        "home/car-detail.html",
        {
            "car": car,
            "car_slug": normalized_slug,
        }
    )

def home(request):
    cars = load_cars()
    context = {
        "cars": cars
    }
    return render(
        request,
        "home/index.html",
        context
    )

def about(request):
    return render(
        request, 
        "about.html"
    )

def terms(request):
    return render(
        request, 
        "terms.html"
    )

def privacypolicy(request):
    return render(
        request, 
        "privacypolicy.html"
    )

def faq(request):
    return render(
        request, 
        "faq.html"
    )

def feedback(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        email_addr = request.POST.get("email", "").strip()
        rating = request.POST.get("rating", "")
        category = request.POST.get("category", "")
        message = request.POST.get("message", "").strip()

        if (
            not all([name, email_addr, message])
            or rating not in dict(Feedback.RATING_CHOICES)
            or category not in dict(Feedback.CATEGORY_CHOICES)
        ):
            messages.error(request, "Please fill in every field and pick a rating.")
            return redirect("feedback")

        # Save feedback
        feedback_obj = Feedback.objects.create(
            name=name,
            email=email_addr,
            rating=rating,
            category=category,
            message=message,
        )
        # Send email notification (optional). Every user-supplied value is
        # escaped so it can't inject HTML into the notification email.
        subject = f"🚗 Atya Feedback • {feedback_obj.get_category_display()}"
        html_content = f"""
        <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden; font-family:Segoe UI,Arial,sans-serif;">
            <div style="background:#111827; color:white; padding:24px;">
                <h2 style="margin:0;">
                    🚗 Atya Feedback Received
                </h2>
            </div>
            <div style="padding:24px;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td><strong>Name</strong></td>
                        <td>{escape(feedback_obj.name)}</td>
                    </tr>
                    <tr>
                        <td><strong>Email</strong></td>
                        <td>{escape(feedback_obj.email)}</td>
                    </tr>
                    <tr>
                        <td><strong>Category</strong></td>
                        <td>{escape(feedback_obj.get_category_display())}</td>
                    </tr>
                    <tr>
                        <td><strong>Rating</strong></td>
                        <td>{escape(feedback_obj.get_rating_display())}</td>
                    </tr>
                </table>
                <hr style="margin:20px 0;">
                <h3>Feedback Message</h3>
                <div style="background:#f8fafc; padding:16px; border-left:4px solid #2563eb; border-radius:10px;">
                    {linebreaks(feedback_obj.message, autoescape=True)}
                </div>
            </div>
            <div style="background:#f8fafc; padding:16px 24px; color:#64748b; font-size:14px;">
                Submitted from the Atya Feedback Portal
            </div>
        </div>
        """
        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=feedback_obj.message,
                from_email=settings.EMAIL_HOST_USER,
                to=[settings.EMAIL_HOST_USER],
            )
            email.attach_alternative(
                html_content,
                "text/html"
            )
            email.send()
        except Exception as exc:
            # Feedback is already saved - a mail outage shouldn't 500 the page.
            print(f"Feedback email failed: {exc}")
        messages.success(
            request,
            "Thank you! Your feedback has been submitted successfully."
        )
        return redirect("feedback")
    return render(
        request,
        "feedback.html",
        {
            "rating_choices": Feedback.RATING_CHOICES,
            "category_choices": Feedback.CATEGORY_CHOICES,
        }
    )

def contact(request):
    return render(request, "contact.html")

def partner_dealer(request):
    return render(request, "partner-dealer.html")

def validate_review_photos(photos):
    """Returns an error message if any upload isn't a real, reasonably sized image."""
    if len(photos) > MAX_REVIEW_PHOTOS:
        return f"You can attach up to {MAX_REVIEW_PHOTOS} photos."
    for photo in photos:
        if photo.size > MAX_REVIEW_PHOTO_SIZE:
            return f"{photo.name} is larger than 5 MB."
        try:
            Image.open(photo).verify()
        except Exception:
            return f"{photo.name} isn't a valid image."
        finally:
            photo.seek(0)
    return None

@require_POST
def submit_review(request, slug):
    author = request.POST.get("author", "").strip()
    email_addr = request.POST.get("email", "").strip()
    title = request.POST.get("title", "").strip()
    content = request.POST.get("content", "").strip()
    rating = request.POST.get("rating", "").strip()
    car_name = request.POST.get("car_name", "").strip()

    # Logged-in users review under their account: email comes from the
    # account (not the form), and the name defaults to their profile name.
    user = request.user if request.user.is_authenticated else None
    if user:
        author = author or user.get_full_name() or user.username
        email_addr = user.email or email_addr

    if not all([author, email_addr, title, content, rating]):
        messages.error(request, "Please fill in every field before submitting.")
        return redirect("car_detail", slug=slug)

    try:
        rating = int(rating)
    except ValueError:
        messages.error(request, "Please select a star rating.")
        return redirect("car_detail", slug=slug)

    if not 1 <= rating <= 5:
        messages.error(request, "Please select a star rating.")
        return redirect("car_detail", slug=slug)

    photos = request.FILES.getlist("photos")
    photo_error = validate_review_photos(photos)
    if photo_error:
        messages.error(request, photo_error)
        return redirect("car_detail", slug=slug)

    try:
        review = Review.objects.create(
            car_slug=normalize_slug(slug),
            car_name=car_name,
            user=user,
            author=author,
            email=email_addr,
            title=title,
            content=content,
            rating=rating,
        )
    except Exception as exc:
        print(f"Review save failed: {exc}")
        messages.error(request, "Review could not be saved right now.")
        return redirect("car_detail", slug=slug)

    try:
        for photo in photos:
            ReviewPhoto.objects.create(review=review, image=photo)
    except Exception as exc:
        print(f"Review photo upload failed: {exc}")

    try:
        subject = f"Thanks for reviewing the {car_name or review.car_slug}!"
        email = EmailMultiAlternatives(
            subject=subject,
            body=f"Thanks for reviewing the {car_name or review.car_slug}, {review.author}!",
            from_email=settings.EMAIL_HOST_USER,
            to=[review.email],
        )
        email.send(fail_silently=True)
    except Exception as exc:
        print(f"Review confirmation email failed: {exc}")

    messages.success(request, "Review submitted successfully.")
    return redirect("car_detail", slug=slug)

@require_POST
def delete_review(request, slug, review_id):
    """
    Deletes a review if it belongs to the logged-in user, or (for guest
    reviews) if the submitted email matches the one it was posted with.
    review.email decrypts automatically on read (see EncryptedEmailField
    in cars/fields.py), so this compares plain text.
    """
    try:
        review = Review.objects.get(id=review_id, car_slug=normalize_slug(slug))
    except Review.DoesNotExist:
        return JsonResponse({"error": "Review not found."}, status=404)

    if request.user.is_authenticated and review.user_id == request.user.id:
        review.delete()
        return JsonResponse({"success": True})

    submitted_email = request.POST.get("email", "").strip()
    if not submitted_email:
        return JsonResponse({"error": "Please enter the email you reviewed with."}, status=400)

    if review.email.strip().lower() != submitted_email.lower():
        return JsonResponse({"error": "That email doesn't match this review."}, status=403)

    review.delete()  # ReviewPhoto rows cascade-delete with it
    return JsonResponse({"success": True})

@require_POST
def toggle_helpful(request, slug, review_id):
    """
    Marks/unmarks a review as helpful. The visitor's session remembers
    which reviews they've liked, so refreshing or clicking twice can't
    inflate helpful_count.
    """
    if not Review.objects.filter(id=review_id, car_slug=normalize_slug(slug)).exists():
        return JsonResponse({"error": "Review not found."}, status=404)

    liked_ids = set(request.session.get("liked_reviews", []))
    if review_id in liked_ids:
        liked_ids.discard(review_id)
        Review.objects.filter(id=review_id, helpful_count__gt=0).update(helpful_count=F("helpful_count") - 1)
        liked = False
    else:
        liked_ids.add(review_id)
        Review.objects.filter(id=review_id).update(helpful_count=F("helpful_count") + 1)
        liked = True
    request.session["liked_reviews"] = sorted(liked_ids)

    helpful = Review.objects.values_list("helpful_count", flat=True).get(id=review_id)
    return JsonResponse({"helpful": helpful, "liked": liked})
