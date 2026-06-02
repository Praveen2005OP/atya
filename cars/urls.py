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
    path('about/', views.about, name='about'),
    path('terms/', views.terms, name='terms'),
    path('privacypolicy/', views.privacypolicy, name='privacypolicy'),
    path('faq/', views.faq, name='faq'),
    path('feedback/', views.feedback_view, name='feedback'),
]