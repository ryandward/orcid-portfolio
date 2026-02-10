# ORCID Portfolio

A beautiful, live academic portfolio that pulls directly from the [ORCID Public API](https://pub.orcid.org). No database, no CMS — just update your ORCID profile and your site updates automatically.

Built with **Vite + React**.

## Features

- 🔬 Live data from ORCID Public API (v3.0) — no API key needed
- 📄 Publications with DOI links
- 🏛️ Employment & Education history
- 🏷️ Research keywords
- 🔗 Researcher URLs
- 📱 Fully responsive
- ⚡ Fast static build, perfect for GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

## Customize

Edit the ORCID ID in `src/App.jsx`:

```js
const ORCID_ID = '0000-0001-9537-2461'  // ← your ORCID here
```

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. The included `.github/workflows/deploy.yml` will auto-deploy on every push to `main`

Your site will be live at `https://<username>.github.io/<repo-name>/`

## How It Works

The site fetches these ORCID public API endpoints at runtime (no auth required):

| Endpoint | Data |
|---|---|
| `/v3.0/{id}/person` | Name, bio, keywords, URLs, country |
| `/v3.0/{id}/works` | Publications |
| `/v3.0/{id}/employments` | Work experience |
| `/v3.0/{id}/educations` | Education history |

Since data is fetched client-side, the site always shows your latest ORCID profile — no rebuild needed.

## License

MIT
