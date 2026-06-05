import json
from pathlib import Path
from django.contrib import messages
from django.shortcuts import redirect, render

from atya import settings
from .models import Feedback
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
    car = next(
        (
            car for car in cars
            if (
                car.get("slug", "")
                .lower()
                .replace("_", "-")
                ==
                slug.lower()
            )
        ),
        None
    )
    
    return render(
        request,
        "home/car-detail.html",
        {
            "car": car
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