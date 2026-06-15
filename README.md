# Laurentia — Parent-Tech

Marketing site for **Laurentia**, a sovereign-technology holding company, and its four ventures:
**Boreal** (public-sector AI), **Taiga** (sovereign compute & cloud), **Ironwood**
(critical-infrastructure security), and **Aurora** (grid & energy intelligence).

## Structure
- `index.html`, `thesis.html`, `ventures.html`, `platform.html`, `contact.html` — the five pages
- `assets/laurentia.css` — shared stylesheet
- `assets/app.js` — shared JS (nav, reveals, counters, contact form, hero aurora canvas)
- `assets/img/` — generated artwork (web-optimized JPEGs + full-res plate)
- `brand/` — the canvas-design generator (`art.py`) and the founding plate
- `brand-art-philosophy.md` — the visual philosophy behind the artwork

## Local preview
Any static server works, e.g.:
```
python3 -m http.server 8000
```
then open http://localhost:8000

## Notes
Built as static HTML/CSS/JS — no build step. Pages reference shared assets by relative path,
so serve the folder as a whole (don't open a single file in isolation).
