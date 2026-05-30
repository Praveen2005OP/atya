from django.urls import path
from . import views


urlpatterns = [

    path(
        '',
        views.home,
        name='home'
    ),
    path(
        "car/<slug:slug>/",
        views.car_detail,
        name="car_detail"
    ),
]