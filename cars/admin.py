from django.contrib import admin
from .models import Feedback

# Register your models here.
@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "rating", "category", "created_at")
    list_filter = ("rating", "category")
    search_fields = ("name", "email", "message")