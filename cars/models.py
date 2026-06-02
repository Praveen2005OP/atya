from xml.parsers.expat import model
from django.db import models

# Create your models here.
class Feedback(models.Model):
    RATING_CHOICES = [ ("love", "😍 Love Atya"), ("helpful", "🙂 Helpful"), ("average", "😐 Average"), ("missing", "😕 Missing Features"), ("bug", "🐞 Found a Bug"), ]
    CATEGORY_CHOICES = [ ("general", "General Feedback"), ("bug", "Bug Report"), ("feature", "Feature Request"), ("data", "Data Correction"), ("ui", "UI / Design Feedback"), ]
    name = models.CharField(max_length=100)
    email = models.EmailField()
    rating = models.CharField(max_length=20, choices=RATING_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.name} - {self.category}"