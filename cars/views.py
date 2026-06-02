import json
from pathlib import Path
from django.shortcuts import render
from .models import Feedback
from django.core.mail import send_mail

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
        name = request.POST.get("name")
        email = request.POST.get("email")
        rating = request.POST.get("rating")
        category = request.POST.get("category")
        message = request.POST.get("message")

        # Save feedback to the database
        Feedback.objects.create(
            name=name,
            email=email,
            rating=rating,
            category=category,
            message=message
        )

        # Send email notification (optional)
        send_mail(
            subject=(f"Atya Feedback: " f"{feedback.category}"),
            message=f"""
                Name:
                {feedback.name}
                Email:
                {feedback.email}
                Rating:
                {feedback.rating}
                Category:
                {feedback.category}
                Message:
                {feedback.message}
                """,
            from_email=("your_email@gmail.com"),
            recipient_list=["your_email@gmail.com"],
            fail_silently=False,
        )
        return render(request, "feedback_success.html")
    return render(request, "feedback.html")
