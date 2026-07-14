import json
from pathlib import Path
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from atya import settings
from .models import Feedback, Review, ReviewPhoto
from django.core.mail import EmailMultiAlternatives

BASE_DIR = Path(__file__).resolve().parent.parent

def load_cars():
    cars_path = BASE_DIR / "data" / "cars"
    cars = []
    for file in cars_path.glob("*.json"):
        with open(file, encoding="utf-8") as f:
            car = json.load(f)
            cars.append(car)
    return cars

def car_detail(request,slug):
    cars = load_cars()
    normalized_slug = slug.lower()
    car = next(
        (
            car for car in cars
            if (
                car.get("slug", "")
                .lower()
                .replace("_", "-")
                ==
                normalized_slug
            )
        ),
        None
    )

    if car is not None:
        # Reviews live in the DB (Review model), not the car JSON files -
        # car.reviews is what car_reviews.html / car-reviews.js render.
        car["reviews"] = [
            review.to_dict()
            for review in Review.objects.filter(car_slug=normalized_slug)
        ]

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
        # Save feedback
        feedback_obj = Feedback.objects.create(
            name=request.POST.get("name"),
            email=request.POST.get("email"),
            rating=request.POST.get("rating"),
            category=request.POST.get("category"),
            message=request.POST.get("message"),
        )
        # Send email notification (optional)
        subject = f"🚗 Atya Feedback • {feedback_obj.category}"
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
                        <td>{feedback_obj.name}</td>
                    </tr>
                    <tr>
                        <td><strong>Email</strong></td>
                        <td>{feedback_obj.email}</td>
                    </tr>
                    <tr>
                        <td><strong>Category</strong></td>
                        <td>{feedback_obj.category}</td>
                    </tr>
                    <tr>
                        <td><strong>Rating</strong></td>
                        <td>{feedback_obj.rating}</td>
                    </tr>
                </table>
                <hr style="margin:20px 0;">
                <h3>Feedback Message</h3>
                <div style="background:#f8fafc; padding:16px; border-left:4px solid #2563eb; border-radius:10px;">
                    {feedback_obj.message}
                </div>
            </div>
            <div style="background:#f8fafc; padding:16px 24px; color:#64748b; font-size:14px;">
                Submitted from the Atya Feedback Portal
            </div>
        </div>
        """
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
        messages.success(
            request,
            "Thank you! Your feedback has been submitted successfully."
        )
        return redirect("feedback")
    return render(request, "feedback.html")

def contact(request):
    return render(request, "contact.html")

def partner_dealer(request):
    return render(request, "partner-dealer.html")


@require_POST
def submit_review(request, slug):
    """
    Handles the 'Write a Review' modal on the car detail page
    (fetch() POST from static/js/car-reviews.js). Saves the review
    (+ any uploaded photos) to the DB and emails a confirmation to the
    reviewer, the same way feedback() saves + emails above - except
    here the email goes to the reviewer's own address, not the admin.
    Returns JSON so the widget can update itself without a full reload.
    """
    author = request.POST.get("author", "").strip()
    email_addr = request.POST.get("email", "").strip()
    title = request.POST.get("title", "").strip()
    content = request.POST.get("content", "").strip()
    rating = request.POST.get("rating", "").strip()
    car_name = request.POST.get("car_name", "").strip()

    if not all([author, email_addr, title, content, rating]):
        return JsonResponse({"error": "Please fill in every field before submitting."}, status=400)

    try:
        rating = int(rating)
    except ValueError:
        return JsonResponse({"error": "Please select a star rating."}, status=400)

    if not 1 <= rating <= 5:
        return JsonResponse({"error": "Please select a star rating."}, status=400)

    review = Review.objects.create(
        car_slug=slug.lower(),
        car_name=car_name,
        author=author,
        email=email_addr,
        title=title,
        content=content,
        rating=rating,
    )

    for photo in request.FILES.getlist("photos"):
        ReviewPhoto.objects.create(review=review, image=photo)

    # Email confirmation to the reviewer (not the site admin)
    subject = f"🚗 Thanks for reviewing the {car_name or review.car_slug}!"
    html_content = f"""
    <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden; font-family:Segoe UI,Arial,sans-serif;">
        <div style="background:#111827; color:white; padding:24px;">
            <h2 style="margin:0;">
                🚗 Your Atya Review Is Live
            </h2>
        </div>
        <div style="padding:24px;">
            <p>Hi {review.author},</p>
            <p>Thanks for sharing your experience with the <strong>{car_name or review.car_slug}</strong>. Your review is now visible to other Atya buyers.</p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td><strong>Rating</strong></td>
                    <td>{'⭐' * review.rating}</td>
                </tr>
                <tr>
                    <td><strong>Title</strong></td>
                    <td>{review.title}</td>
                </tr>
            </table>
            <hr style="margin:20px 0;">
            <h3>Your Review</h3>
            <div style="background:#f8fafc; padding:16px; border-left:4px solid #2563eb; border-radius:10px;">
                {review.content}
            </div>
        </div>
        <div style="background:#f8fafc; padding:16px 24px; color:#64748b; font-size:14px;">
            Thanks for helping other buyers make better decisions - Team Atya
        </div>
    </div>
    """
    email = EmailMultiAlternatives(
        subject=subject,
        body=f"Thanks for reviewing the {car_name or review.car_slug}, {review.author}!",
        from_email=settings.EMAIL_HOST_USER,
        to=[review.email],
    )
    email.attach_alternative(html_content, "text/html")
    try:
        email.send()
    except Exception as exc:
        # The review is already saved - a failed email shouldn't undo that
        # or block the response, just note it for debugging.
        print(f"Review confirmation email failed: {exc}")

    return JsonResponse({"success": True, "review": review.to_dict()})


@require_POST
def delete_review(request, slug, review_id):
    """
    Deletes a review only if the submitted email matches the one it was
    posted with. review.email decrypts automatically on read (see
    EncryptedEmailField in cars/fields.py), so this compares plain text.
    """
    submitted_email = request.POST.get("email", "").strip()
    if not submitted_email:
        return JsonResponse({"error": "Please enter the email you reviewed with."}, status=400)

    try:
        review = Review.objects.get(id=review_id, car_slug=slug.lower())
    except Review.DoesNotExist:
        return JsonResponse({"error": "Review not found."}, status=404)

    if review.email.strip().lower() != submitted_email.lower():
        return JsonResponse({"error": "That email doesn't match this review."}, status=403)

    review.delete()  # ReviewPhoto rows cascade-delete with it
    return JsonResponse({"success": True})