"""
URL configuration for atya project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    # allauth's own email/password pages -> Atya's (accounts/urls.py).
    path('auth/login/', RedirectView.as_view(pattern_name='login', query_string=True)),
    path('auth/signup/', RedirectView.as_view(pattern_name='signup', query_string=True)),
    path('auth/password/reset/', RedirectView.as_view(pattern_name='password_reset')),
    path('auth/', include('allauth.urls')),  # Google login callback etc.
    path('',include('cars.urls')),
]

if settings.USE_CLOUDINARY:
    pass  # Photo URLs point straight at Cloudinary's CDN.
elif settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # static() is a no-op when DEBUG is off, so serve local uploads directly.
    # Only a fallback - files on Render's disk are lost on redeploy, so set
    # CLOUDINARY_URL there.
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
    