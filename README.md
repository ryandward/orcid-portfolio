# ORCID Portfolio

### [**View Live Site →**](https://ryandward.github.io/orcid-portfolio/)

A live academic portfolio that pulls directly from the [ORCID Public API](https://pub.orcid.org), merged with LinkedIn career data. No database, no CMS — update your ORCID profile and publications refresh automatically on every page visit.

Built with **Vite + React**. Deployed on **GitHub Pages**.

---

## Features

- Live publication data from ORCID Public API (v3.0, no key required)
- Full career timeline from LinkedIn export
- DOI links for all publications
- Education history from ORCID
- Research keywords and skills from both sources
- Responsive design
- Auto-deploys via GitHub Actions

## Quick Start

```bash
npm install
npm run dev
```

## Customize

**ORCID ID** — edit the constant at the top of `src/App.jsx`:

```js
const ORCID_ID = '0000-0001-9537-2461'
```

**LinkedIn data** — edit the `LINKEDIN` object in the same file. This is static data from a LinkedIn export (Settings → Data Privacy → Get a copy of your data).

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. The included workflow at `.github/workflows/deploy.yml` handles the rest

## How It Works

Publications, education, keywords, and researcher URLs are fetched client-side from the ORCID public API on every page load — no rebuild needed when you update your ORCID profile. Career history comes from a LinkedIn data export stored as a JS object in the source.

| Endpoint | Data |
|---|---|
| `/v3.0/{id}/person` | Name, bio, keywords, URLs |
| `/v3.0/{id}/works` | Publications |
| `/v3.0/{id}/educations` | Education history |

## License

MIT
