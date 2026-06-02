import json

from pathlib import Path
from django.shortcuts import render

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
    return render(request, "feedback.html")