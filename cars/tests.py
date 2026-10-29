import io
import os
import shutil
import tempfile
from unittest import mock

from cryptography.fernet import Fernet
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from .models import Feedback, Review, ReviewPhoto
from .storage import CloudinaryMediaStorage

TEST_MEDIA_ROOT = tempfile.mkdtemp()


def make_image(name="photo.png"):
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@override_settings(
    FIELD_ENCRYPTION_KEY=Fernet.generate_key().decode(),
    MEDIA_ROOT=TEST_MEDIA_ROOT,
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)
class CarsTestCase(TestCase):
    slug = "creta"

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def make_review(self, **kwargs):
        data = {
            "car_slug": self.slug,
            "author": "Priya",
            "email": "priya@example.com",
            "title": "Great SUV",
            "content": "Comfortable ride.",
            "rating": 5,
        }
        data.update(kwargs)
        return Review.objects.create(**data)


class EmailEncryptionTests(CarsTestCase):
    def test_review_email_is_encrypted_at_rest(self):
        review = self.make_review()
        with connection.cursor() as cursor:
            cursor.execute("SELECT email FROM cars_review WHERE id = %s", [review.id])
            raw = cursor.fetchone()[0]
        self.assertNotIn("priya@example.com", raw)
        self.assertEqual(Review.objects.get(id=review.id).email, "priya@example.com")


class CarDetailTests(CarsTestCase):
    def test_known_car_renders(self):
        response = self.client.get(reverse("car_detail", args=[self.slug]))
        self.assertEqual(response.status_code, 200)

    def test_unknown_car_is_404(self):
        response = self.client.get(reverse("car_detail", args=["not-a-car"]))
        self.assertEqual(response.status_code, 404)

    def test_reviews_do_not_leak_into_cached_car_list(self):
        self.make_review()
        self.client.get(reverse("car_detail", args=[self.slug]))
        response = self.client.get(reverse("home"))
        creta = next(car for car in response.context["cars"] if car["slug"] == self.slug)
        self.assertNotIn("reviews", creta)


class SubmitReviewTests(CarsTestCase):
    def post_review(self, **extra):
        data = {
            "author": "Priya",
            "email": "priya@example.com",
            "title": "Great SUV",
            "content": "Comfortable ride.",
            "rating": "4",
            "car_name": "Hyundai Creta",
        }
        data.update(extra)
        return self.client.post(reverse("submit_review", args=[self.slug]), data)

    def test_valid_review_is_saved_with_photo(self):
        response = self.post_review(photos=[make_image()])
        self.assertRedirects(response, reverse("car_detail", args=[self.slug]))
        review = Review.objects.get()
        self.assertEqual(review.rating, 4)
        self.assertEqual(review.photos.count(), 1)

    def test_missing_rating_is_rejected(self):
        self.post_review(rating="0")
        self.assertFalse(Review.objects.exists())

    def test_non_image_upload_is_rejected(self):
        fake = SimpleUploadedFile("evil.png", b"not an image", content_type="image/png")
        self.post_review(photos=[fake])
        self.assertFalse(Review.objects.exists())

    def test_too_many_photos_is_rejected(self):
        self.post_review(photos=[make_image(f"{i}.png") for i in range(6)])
        self.assertFalse(Review.objects.exists())


class DeleteReviewTests(CarsTestCase):
    def test_wrong_email_cannot_delete(self):
        review = self.make_review()
        url = reverse("delete_review", args=[self.slug, review.id])
        response = self.client.post(url, {"email": "someone@else.com"})
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Review.objects.filter(id=review.id).exists())

    def test_matching_email_deletes(self):
        review = self.make_review()
        url = reverse("delete_review", args=[self.slug, review.id])
        response = self.client.post(url, {"email": "PRIYA@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Review.objects.filter(id=review.id).exists())


class HelpfulTests(CarsTestCase):
    def test_toggle_is_persisted_and_once_per_session(self):
        review = self.make_review()
        url = reverse("toggle_helpful", args=[self.slug, review.id])

        response = self.client.post(url)
        self.assertEqual(response.json(), {"helpful": 1, "liked": True})

        response = self.client.post(url)
        self.assertEqual(response.json(), {"helpful": 0, "liked": False})
        review.refresh_from_db()
        self.assertEqual(review.helpful_count, 0)

    def test_unknown_review_is_404(self):
        response = self.client.post(reverse("toggle_helpful", args=[self.slug, 999]))
        self.assertEqual(response.status_code, 404)


class FeedbackTests(CarsTestCase):
    def test_missing_rating_does_not_crash(self):
        response = self.client.post(reverse("feedback"), {
            "name": "Priya", "email": "priya@example.com",
            "category": "general", "message": "Hi",
        })
        self.assertRedirects(response, reverse("feedback"))
        self.assertFalse(Feedback.objects.exists())

    def test_feedback_email_escapes_user_input(self):
        self.client.post(reverse("feedback"), {
            "name": "<b>Priya</b>", "email": "priya@example.com",
            "rating": "love", "category": "bug",
            "message": "<script>alert(1)</script>",
        })
        self.assertEqual(Feedback.objects.count(), 1)
        html = mail.outbox[0].alternatives[0][0]
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)
        self.assertNotIn("<b>Priya</b>", html)


class ReviewPhotoCleanupTests(CarsTestCase):
    def test_deleting_review_removes_photo_file(self):
        review = self.make_review()
        photo = ReviewPhoto.objects.create(review=review, image=make_image())
        path = photo.image.path
        self.assertTrue(os.path.exists(path))
        review.delete()
        self.assertFalse(os.path.exists(path))


class CloudinaryStorageTests(TestCase):
    def setUp(self):
        self.storage = CloudinaryMediaStorage()

    @mock.patch("cars.storage.cloudinary.uploader.upload")
    def test_save_uploads_and_returns_public_id_with_format(self, upload):
        upload.return_value = {"public_id": "review_photos/2026/10/front_ab12cd34", "format": "png"}
        with mock.patch("cars.storage.secrets.token_hex", return_value="ab12cd34"):
            name = self.storage.save("review_photos/2026/10/front.png", make_image())
        self.assertEqual(name, "review_photos/2026/10/front_ab12cd34.png")
        self.assertEqual(upload.call_args.kwargs["public_id"], "review_photos/2026/10/front_ab12cd34")

    def test_url_points_at_cloudinary_cdn(self):
        with mock.patch.dict(os.environ, {"CLOUDINARY_URL": "cloudinary://key:secret@demo"}):
            import cloudinary
            cloudinary.reset_config()
            url = self.storage.url("review_photos/2026/10/front_ab12cd34.png")
        self.assertTrue(url.startswith("https://res.cloudinary.com/demo/image/upload/"))
        self.assertTrue(url.endswith("review_photos/2026/10/front_ab12cd34.png"))

    @mock.patch("cars.storage.cloudinary.uploader.destroy")
    def test_delete_destroys_by_public_id(self, destroy):
        self.storage.delete("review_photos/2026/10/front_ab12cd34.png")
        self.assertEqual(destroy.call_args.args[0], "review_photos/2026/10/front_ab12cd34")
