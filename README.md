# aminebouhlal.com

Personal site of Amine Bouhlal — Solutions Architect. Fully static Next.js,
blueprint/schematic design, animated SVG architecture diagrams as imagery.

**Live:** https://aminebouhlal.com · design rationale at [/colophon](https://aminebouhlal.com/colophon)

## Editing content

Everything lives in **`src/data/site.ts`** — one typed file drives all pages,
JSON-LD structured data and page metadata:

- `site` — name, tagline, contact, languages
- `stats` — the numbers band on the home page
- `caseStudies` — the work section; each entry generates its own page at
  `/work/<slug>` (add an entry → page, sitemap and JSON-LD update automatically)
- `experience`, `education`, `awards`, `skills`, `services`, `faq`
- `footprint` — map nodes (x/y are % positions on the SVG canvas)

**Also update when work changes:** `public/llms.txt` (the AI-crawler summary —
manual, keep in sync with `site.ts`).

Diagrams are hand-coded SVG components in `src/components/diagrams.tsx`,
sharing primitives (Node / Flow / Port) and one animation language defined in
`globals.css`. New case study → add a diagram component + its key to the
`diagram` union in `site.ts`.

## Stack (pinned, exact versions)

Next.js 16.2.10 · React 19.2.7 · Tailwind CSS 4.3.2 · TypeScript 5.9.3
(TS 6 deliberately avoided — transitional release) ·
@vercel/analytics 2.0.1 · @vercel/speed-insights 2.0.0

## Pipeline & accounts (important)

- **GitHub:** `skelecoder/aminebouhlal` — push to `main` auto-deploys.
- **Vercel (production):** project `aminebouhlal` on the **personal** account
  (abouhlal@gmail.com, team `skelecoders-projects`, Hobby). Domain
  `aminebouhlal.com` bought and managed there; `www` 308-redirects to apex.
- ⚠️ There is a **second** Vercel account (`skelecoder-1746`, team
  `x3s-projects…`) that the local Vercel CLI is logged into. It does NOT own
  this project — don't `vercel deploy` from the CLI; just push to `main`.
- Analytics + Speed Insights: enabled in the Vercel dashboard (Hobby free
  tier; Speed Insights uses the account's single free project slot).

## Local dev

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # must pass before pushing
```

## SEO/GEO layer

Per-page metadata + canonicals, JSON-LD (Person, FAQPage, ItemList, Article),
`sitemap.ts`, `robots.ts`, `public/llms.txt`, code-generated OG image
(`opengraph-image.tsx`), SVG + PNG favicons. Google Search Console verified via
DNS TXT (domain property); Bing imported from GSC.
