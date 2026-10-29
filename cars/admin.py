from django.contrib import admin
from .models import Feedback, Review, ReviewPhoto

# Register your models here.
@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "rating", "category", "created_at")
    list_filter = ("rating", "category")
    # email is encrypted in the DB, so it can't be searched with SQL LIKE.
    search_fields = ("name", "message")


class ReviewPhotoInline(admin.TabularInline):
    model = ReviewPhoto
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "car_name", "car_slug", "rating", "verified", "created_at")
    list_filter = ("rating", "verified", "car_slug")
    search_fields = ("title", "author", "car_name", "car_slug")
    inlines = [ReviewPhotoInline]