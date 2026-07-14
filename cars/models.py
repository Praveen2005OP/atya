from xml.parsers.expat import model
from django.db import models

from .fields import EncryptedEmailField

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


class Review(models.Model):
    """
    A single car review submitted through the 'Write a Review' form
    on the car detail page (templates/car/car_reviews.html).

    Cars themselves aren't stored in the database (they're loaded from
    data/cars/*.json), so a review is linked back to its car via
    `car_slug` - the same slug used in car_detail(request, slug) and
    in each car JSON file's "slug" field, not a ForeignKey.
    """

    RATING_CHOICES = [(i, f"{i} star{'s' if i != 1 else ''}") for i in range(1, 6)]

    car_slug = models.SlugField(
        max_length=140,
        db_index=True,
        help_text="Must match the car's 'slug' field in its JSON file.",
    )
    car_name = models.CharField(
        max_length=140,
        blank=True,
        help_text="Snapshot of the car's name at review time, for admin/display convenience.",
    )

    author = models.CharField(max_length=100)
    email = EncryptedEmailField(help_text="Stored encrypted (see cars/fields.py) - never shown in the admin list, only on individual review pages.")
    title = models.CharField(max_length=150)
    content = models.TextField()
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=5)

    verified = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.car_slug} ({self.rating}\u2605)"

    def to_dict(self):
        """
        Shape this to match what car-reviews.js already expects from
        car.reviews (title, author, date, content, rating, photos,
        helpful, verified), so a view can do:
            car["reviews"] = [r.to_dict() for r in Review.objects.filter(car_slug=slug)]
        before rendering car-detail.html - no JS changes required.
        """
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "date": self.created_at.date().isoformat(),
            "content": self.content,
            "rating": self.rating,
            "photos": [photo.image.url for photo in self.photos.all()],
            "helpful": self.helpful_count,
            "verified": self.verified,
        }


class ReviewPhoto(models.Model):
    """One uploaded photo attached to a Review (the drag-and-drop upload in the modal)."""

    review = models.ForeignKey(Review, related_name="photos", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="review_photos/%Y/%m/")

    def __str__(self):
        return f"Photo for review #{self.review_id}"