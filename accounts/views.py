from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme

from cars.models import Review
from . import ratelimit
from .forms import AccountForm, LoginForm, SignupForm

LOCKED_MESSAGE = "Too many failed attempts. Please wait 15 minutes and try again, or reset your password."


def _safe_next(request, fallback="home"):
    next_url = request.POST.get("next") or request.GET.get("next")
    if next_url and url_has_allowed_host_and_scheme(
        next_url, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        return next_url
    return fallback


class LoginView(auth_views.LoginView):
    """Django's LoginView plus a lock after repeated wrong passwords."""

    authentication_form = LoginForm
    redirect_authenticated_user = True

    def post(self, request, *args, **kwargs):
        account = request.POST.get("username", "")
        ip = ratelimit.client_ip(request)
        if (ratelimit.is_limited("login-account", account, ratelimit.LOGIN_MAX_PER_ACCOUNT)
                or ratelimit.is_limited("login-ip", ip, ratelimit.LOGIN_MAX_PER_IP)):
            form = self.get_form()
            form.add_error(None, LOCKED_MESSAGE)
            return self.render_to_response(self.get_context_data(form=form), status=429)
        return super().post(request, *args, **kwargs)

    def form_invalid(self, form):
        ratelimit.hit("login-account", self.request.POST.get("username", ""), ratelimit.LOGIN_WINDOW)
        ratelimit.hit("login-ip", ratelimit.client_ip(self.request), ratelimit.LOGIN_WINDOW)
        return super().form_invalid(form)

    def form_valid(self, form):
        ratelimit.reset("login-account", self.request.POST.get("username", ""))
        return super().form_valid(form)


class PasswordResetView(auth_views.PasswordResetView):
    """Stops one visitor from flooding inboxes with reset emails."""

    email_template_name = "registration/password_reset_email.txt"
    subject_template_name = "registration/password_reset_subject.txt"

    def post(self, request, *args, **kwargs):
        ip = ratelimit.client_ip(request)
        if ratelimit.is_limited("password-reset", ip, ratelimit.PASSWORD_RESET_MAX_PER_IP):
            form = self.get_form()
            form.add_error(None, "Too many reset requests. Please try again in an hour.")
            return self.render_to_response(self.get_context_data(form=form), status=429)
        ratelimit.hit("password-reset", ip, ratelimit.HOURLY_WINDOW)
        return super().post(request, *args, **kwargs)


def signup(request):
    if request.user.is_authenticated:
        return redirect("account")

    if request.method == "POST":
        form = SignupForm(request.POST)
        ip = ratelimit.client_ip(request)
        if ratelimit.is_limited("signup", ip, ratelimit.SIGNUP_MAX_PER_IP):
            form.add_error(None, "Too many accounts created from your network. Please try again later.")
            return render(request, "accounts/signup.html", {"form": form, "next": _safe_next(request, "")}, status=429)
        if form.is_valid():
            ratelimit.hit("signup", ip, ratelimit.HOURLY_WINDOW)
            user = form.save()
            login(request, user, backend="accounts.backends.EmailOrUsernameBackend")
            messages.success(request, f"Welcome to Atya, {user.first_name}!")
            return redirect(_safe_next(request))
    else:
        form = SignupForm()

    return render(request, "accounts/signup.html", {"form": form, "next": _safe_next(request, "")})


@login_required
def account(request):
    if request.method == "POST":
        form = AccountForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Your details have been updated.")
            return redirect("account")
    else:
        form = AccountForm(instance=request.user)

    reviews = Review.objects.filter(user=request.user).defer("email")
    return render(request, "accounts/account.html", {"form": form, "reviews": reviews})
