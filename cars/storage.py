"""
Cloudinary-backed storage for user uploads (review photos).

Render's disk is wiped on every redeploy, so files saved to MEDIA_ROOT
disappear. When CLOUDINARY_URL is set (see settings.py), Django's default
storage becomes CloudinaryMediaStorage and ImageField uploads go to
Cloudinary instead. The value stored in the DB is the Cloudinary public_id
plus its extension, e.g. "review_photos/2026/10/front_ab12cd.jpg".

CLOUDINARY_URL looks like cloudinary://<api_key>:<api_secret>@<cloud_name>
and is read by the cloudinary SDK straight from the environment.
"""
import posixpath
import secrets

import cloudinary
import cloudinary.api
import cloudinary.exceptions
import cloudinary.uploader
import cloudinary.utils
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class CloudinaryMediaStorage(Storage):
    def _split(self, name):
        public_id, ext = posixpath.splitext(name)
        return public_id, ext.lstrip(".")

    def get_available_name(self, name, max_length=None):
        # Random suffix instead of an exists() round-trip per upload.
        public_id, ext = self._split(name.replace("\\", "/"))
        name = f"{public_id}_{secrets.token_hex(4)}"
        return f"{name}.{ext}" if ext else name

    def _save(self, name, content):
        public_id, _ = self._split(name)
        content.seek(0)
        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
        )
        return f"{result['public_id']}.{result['format']}"

    def url(self, name):
        public_id, ext = self._split(name)
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            format=ext or None,
            resource_type="image",
            secure=True,
        )
        return url

    def delete(self, name):
        public_id, _ = self._split(name)
        cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)

    def exists(self, name):
        public_id, _ = self._split(name)
        try:
            cloudinary.api.resource(public_id, resource_type="image")
            return True
        except cloudinary.exceptions.NotFound:
            return False

    def size(self, name):
        public_id, _ = self._split(name)
        return cloudinary.api.resource(public_id, resource_type="image")["bytes"]
