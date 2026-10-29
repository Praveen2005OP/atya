<div align="center">

<img src="static/images/app/redline-essentials-logo.png" alt="Atya logo" width="120">

# Atya

### Find every car sold in India.

Specs, variants, prices, safety ratings, 360° views and real owner reviews,
plus clean side-by-side comparisons without the clutter.

![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Render](https://img.shields.io/badge/Hosted%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

**77 cars · 32 brands · 29 interactive 360° views**

</div>

---

## ✨ Features

| | |
|---|---|
| 🔎 **Smart search & finder** | Search by name, fuel or safety rating, or filter by budget and body type. |
| 🎯 **Browse by purpose** | Family, daily commute, performance, off-road, luxury, first car. |
| 🏷️ **Explore by brand** | 32 brands, from Maruti Suzuki and Tata to Ferrari and Rolls Royce. |
| 📋 **Full spec sheets** | Variant-wise engine, power, torque, mileage, ADAS, comfort and safety features. |
| 🔄 **360° viewer** | Drag to spin the exterior, plus open-door and interior panoramas. |
| 🎨 **Colour explorer** | See every paint option on the actual car. |
| ⚖️ **Compare** | Pick up to three cars and compare them side by side. |
| 🚗 **Garage** | Save a shortlist of cars that stays in your browser. |
| ⭐ **Owner reviews** | Star ratings, photo uploads, "Helpful" votes and sorting. Delete your own review with the email you posted it with. |
| 💬 **Feedback portal** | Bug reports, feature requests and data corrections, emailed straight to the team. |

---

## 🛠️ Tech stack

- **Backend:** Django 6, Python 3.12+
- **Database:** PostgreSQL in production (Neon), SQLite locally
- **Media storage:** Cloudinary for review photos
- **Static files:** WhiteNoise
- **Frontend:** Django templates, vanilla JavaScript, CSS, GSAP and Pannellum (360° panoramas)
- **Hosting:** Render with gunicorn

---

## 🔐 Security & privacy

- **Encrypted emails:** reviewer and feedback emails are encrypted in the database (Fernet).
- **XSS protection:** all user-submitted text is escaped before it is rendered, in pages and in emails.
- **Safe uploads:** each photo must be a real image under 5 MB, with at most 5 per review.
- **Fair voting:** "Helpful" votes count once per visitor session.
- **No secrets in code:** all keys come from environment variables.

---

## 🚀 Getting started

```bash
# 1. Clone
git clone https://github.com/Praveen2005OP/atya.git
cd atya

# 2. Virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 3. Install
pip install -r requirements.txt

# 4. Create a .env file (see below), then:
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open **http://127.0.0.1:8000**.

### Environment variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
FIELD_ENCRYPTION_KEY=your-fernet-key

# Optional locally
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DATABASE_URL=postgresql://...        # leave out to use SQLite
CLOUDINARY_URL=cloudinary://...      # leave out to store photos in media/
ALLOWED_HOSTS=yourdomain.com         # defaults to localhost + *.onrender.com
```

Generate a `FIELD_ENCRYPTION_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

> ⚠️ Never change `FIELD_ENCRYPTION_KEY` once real data exists, or stored emails can no longer be decrypted.

### Run the tests

```bash
python manage.py test cars
```

---

## 📁 Project structure

```
atya/                Django project settings & URLs
cars/                Main app: views, models, encrypted field, Cloudinary storage, tests
  templatetags/      Price, power, mileage, ADAS and other display filters
data/cars/           One JSON file per car (specs, variants, colours, pricing)
templates/
  home/              Homepage sections: hero, finder, brands, purpose, compare, garage
  car/               Car page sections: specs, variants, colours, 360°, reviews
static/
  css/  js/          Styles and scripts
  images/            Car photos, 360° frames, colour swatches
```

### How car data works

Cars are **not** stored in the database. Each car is a JSON file in `data/cars/`, and its
`slug` becomes the page URL (`/car/<slug>/`). To add a car:

1. Copy an existing JSON file, e.g. `data/cars/creta.json`.
2. Change the `slug`, specs, variants and prices.
3. Put its images in `static/images/car-images/<folder>/`.

The site picks up new or edited files automatically, with no restart needed.

Reviews, feedback and photos live in the database and Cloudinary, linked to a car by its slug.

---

## ☁️ Deployment (Render)

**Build command**

```bash
pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
```

**Start command:** `gunicorn atya.wsgi`

Set these in **Render → your service → Environment**:
`SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `FIELD_ENCRYPTION_KEY`, `CLOUDINARY_URL`,
`EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`.

---

## 🗺️ Roadmap

- [ ] User accounts, so reviews are tied to a login instead of an email
- [ ] Verified-owner badges
- [ ] Rate limiting and captcha on review and feedback forms
- [ ] More cars and brands

---

<div align="center">

Made with ❤️ for Indian car buyers by **Praveen Kumar Sharma**

⭐ Star the repo if you find it useful!

</div>
