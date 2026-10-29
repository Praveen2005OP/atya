import re

from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from cars.models import Review

User = get_user_model()

TEST_SETTINGS = dict(
    FIELD_ENCRYPTION_KEY=Fernet.generate_key().decode(),
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)


@override_settings(**TEST_SETTINGS)
class AccountsTestCase(TestCase):
    password = "Sup3r-secret-pass!"

    def setUp(self):
        cache.clear()  # rate-limit counters live in the cache

    def make_user(self, username="priya", email="priya@example.com"):
        return User.objects.create_user(username=username, email=email, password=self.password, first_name="Priya")


class SignupTests(AccountsTestCase):
    def signup(self, **extra):
        data = {
            "first_name": "Priya",
            "username": "priya",
            "email": "Priya@Example.com",
            "password1": self.password,
            "password2": self.password,
        }
        data.update(extra)
        return self.client.post(reverse("signup"), data)

    def test_signup_creates_user_and_logs_in(self):
        response = self.signup()
        self.assertRedirects(response, reverse("home"))
        user = User.objects.get(username="priya")
        self.assertEqual(user.email, "priya@example.com")
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

    def test_duplicate_email_is_rejected(self):
        self.make_user(username="someone", email="priya@example.com")
        response = self.signup()
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "already exists")
        self.assertFalse(User.objects.filter(username="priya").exists())

    def test_signup_redirects_to_safe_next_only(self):
        response = self.signup(next="/car/creta/")
        self.assertRedirects(response, "/car/creta/", fetch_redirect_response=False)

        self.client.logout()
        response = self.signup(username="priya2", email="p2@example.com", next="https://evil.example.com/")
        self.assertRedirects(response, reverse("home"))


class LoginTests(AccountsTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.make_user()

    def test_login_with_email(self):
        response = self.client.post(reverse("login"), {"username": "PRIYA@example.com", "password": self.password})
        self.assertRedirects(response, reverse("home"))

    def test_login_with_username(self):
        response = self.client.post(reverse("login"), {"username": "priya", "password": self.password})
        self.assertRedirects(response, reverse("home"))

    def test_wrong_password_shows_error(self):
        response = self.client.post(reverse("login"), {"username": "priya", "password": "nope"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "don&#x27;t match")

    def test_logout_requires_post(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse("logout")).status_code, 405)
        self.client.post(reverse("logout"))
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_header_shows_login_or_account(self):
        self.assertContains(self.client.get(reverse("about")), "Log in")
        self.client.force_login(self.user)
        response = self.client.get(reverse("about"))
        self.assertContains(response, reverse("account"))
        self.assertContains(response, "Log out")


class AccountPageTests(AccountsTestCase):
    def test_requires_login(self):
        response = self.client.get(reverse("account"))
        self.assertRedirects(response, f"{reverse('login')}?next={reverse('account')}")

    def test_update_details(self):
        user = self.make_user()
        self.client.force_login(user)
        self.client.post(reverse("account"), {"first_name": "Priya S", "email": "new@example.com"})
        user.refresh_from_db()
        self.assertEqual((user.first_name, user.email), ("Priya S", "new@example.com"))


class PasswordResetTests(AccountsTestCase):
    def test_reset_email_link_sets_new_password(self):
        self.make_user()
        self.client.post(reverse("password_reset"), {"email": "priya@example.com"})
        self.assertEqual(len(mail.outbox), 1)
        link = re.search(r"https?://\S+/accounts/reset/\S+/", mail.outbox[0].body).group(0)

        # Django redirects the token URL to a session-backed "set-password" URL.
        response = self.client.get(link, follow=True)
        form_url = response.redirect_chain[-1][0]
        response = self.client.post(form_url, {"new_password1": "Brand-new-pass-9", "new_password2": "Brand-new-pass-9"})
        self.assertRedirects(response, reverse("password_reset_complete"))
        self.assertTrue(self.client.login(username="priya", password="Brand-new-pass-9"))

    def test_unknown_email_sends_nothing_but_looks_the_same(self):
        response = self.client.post(reverse("password_reset"), {"email": "nobody@example.com"})
        self.assertRedirects(response, reverse("password_reset_done"))
        self.assertEqual(len(mail.outbox), 0)


class ReviewOwnershipTests(AccountsTestCase):
    slug = "creta"

    def test_logged_in_review_uses_account(self):
        user = self.make_user()
        self.client.force_login(user)
        self.client.post(reverse("submit_review", args=[self.slug]), {
            "author": "", "title": "Nice", "content": "Good car", "rating": "5", "car_name": "Hyundai Creta",
        })
        review = Review.objects.get()
        self.assertEqual(review.user, user)
        self.assertEqual(review.email, "priya@example.com")
        self.assertEqual(review.author, "Priya")

    def test_owner_deletes_without_email_but_others_cannot(self):
        owner = self.make_user()
        other = self.make_user(username="ravi", email="ravi@example.com")
        review = Review.objects.create(
            car_slug=self.slug, user=owner, author="Priya", email=owner.email,
            title="t", content="c", rating=4,
        )
        url = reverse("delete_review", args=[self.slug, review.id])

        self.client.force_login(other)
        self.assertEqual(self.client.post(url).status_code, 400)
        self.assertTrue(Review.objects.filter(id=review.id).exists())

        self.client.force_login(owner)
        self.assertEqual(self.client.post(url).status_code, 200)
        self.assertFalse(Review.objects.filter(id=review.id).exists())


class RateLimitTests(AccountsTestCase):
    def test_account_locks_after_five_wrong_passwords(self):
        self.make_user()
        for _ in range(5):
            self.client.post(reverse("login"), {"username": "priya", "password": "wrong"})
        # Even the right password is refused while locked...
        response = self.client.post(reverse("login"), {"username": "priya", "password": self.password})
        self.assertEqual(response.status_code, 429)
        self.assertContains(response, "Too many failed attempts", status_code=429)
        self.assertNotIn("_auth_user_id", self.client.session)
        # ...and it's the account that's locked, whatever case/email form is typed.
        response = self.client.post(reverse("login"), {"username": "PRIYA", "password": self.password})
        self.assertEqual(response.status_code, 429)

    def test_ip_locks_after_twenty_failures_across_accounts(self):
        for i in range(20):
            self.client.post(reverse("login"), {"username": f"user{i}", "password": "wrong"},
                             REMOTE_ADDR="10.0.0.1")
        response = self.client.post(reverse("login"), {"username": "fresh", "password": "x"}, REMOTE_ADDR="10.0.0.1")
        self.assertEqual(response.status_code, 429)
        response = self.client.post(reverse("login"), {"username": "fresh", "password": "x"}, REMOTE_ADDR="10.0.0.2")
        self.assertEqual(response.status_code, 200)

    def test_successful_login_clears_account_counter(self):
        self.make_user()
        for _ in range(4):
            self.client.post(reverse("login"), {"username": "priya", "password": "wrong"})
        self.client.post(reverse("login"), {"username": "priya", "password": self.password})
        self.client.logout()
        for _ in range(4):
            self.client.post(reverse("login"), {"username": "priya", "password": "wrong"})
        response = self.client.post(reverse("login"), {"username": "priya", "password": self.password})
        self.assertEqual(response.status_code, 302)

    def test_password_reset_limited_per_ip(self):
        self.make_user()
        for _ in range(5):
            self.client.post(reverse("password_reset"), {"email": "priya@example.com"})
        response = self.client.post(reverse("password_reset"), {"email": "priya@example.com"})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(len(mail.outbox), 5)

    def test_forwarded_ip_uses_last_hop(self):
        from .ratelimit import client_ip
        from django.test import RequestFactory
        request = RequestFactory().get("/", HTTP_X_FORWARDED_FOR="1.2.3.4, 203.0.113.9")
        self.assertEqual(client_ip(request), "203.0.113.9")


class GoogleLoginTests(AccountsTestCase):
    def test_button_hidden_without_credentials(self):
        response = self.client.get(reverse("login"))
        self.assertNotContains(response, "Continue with Google")

    def test_allauth_login_page_redirects_to_atya_login(self):
        response = self.client.get("/auth/login/?next=/car/creta/")
        self.assertRedirects(response, reverse("login") + "?next=/car/creta/", fetch_redirect_response=False)


GOOGLE_SETTINGS = dict(
    GOOGLE_LOGIN_ENABLED=True,
    SOCIALACCOUNT_PROVIDERS={
        "google": {
            "APPS": [{"client_id": "test-client-id", "secret": "test-secret", "key": ""}],
            "SCOPE": ["profile", "email"],
            "AUTH_PARAMS": {"prompt": "select_account"},
            "EMAIL_AUTHENTICATION": True,
        }
    },
)


@override_settings(**GOOGLE_SETTINGS)
class GoogleLoginEnabledTests(AccountsTestCase):
    def test_button_shown_on_login_and_signup(self):
        self.assertContains(self.client.get(reverse("login")), "Continue with Google")
        self.assertContains(self.client.get(reverse("signup")), "Continue with Google")

    def test_button_sends_user_to_google(self):
        response = self.client.post("/auth/google/login/?next=/car/creta/")
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response["Location"].startswith("https://accounts.google.com/"), response["Location"])
        self.assertIn("client_id=test-client-id", response["Location"])

