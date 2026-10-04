# SkillGap AI website (www.skillgapai.in)

Static site (GitHub Pages, custom domain via `CNAME`). Upload all files in this folder to the repo root.

## Added: Second Inning (government -> corporate transition)
- `second-inning.html` – landing page
- `second-inning-login.html` – create profile / open dashboard (demo, no password stored)
- `second-inning-dashboard.html` – match score, skill gaps, 6-week plan, checklist
- `second-inning.js` – logic (self-contained, does not touch `script.js`)
- `admin.html` – now also lists Second Inning profiles + CSV export
- `supabase-setup.sql` – run again in Supabase SQL Editor to create `second_inning_profiles`
- Nav/footer links, `sitemap.xml` and `login.html` updated

## Supabase note
`supabase-config.js` `url` must be the project API URL (https://<project-ref>.supabase.co), not the dashboard link.
