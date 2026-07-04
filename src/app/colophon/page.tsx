import type { Metadata } from "next";
import { site } from "@/data/site";
import { Nav, Footer } from "@/components/chrome";

export const metadata: Metadata = {
  title: "Colophon — how this site is built",
  description:
    "The architecture of aminebouhlal.com: fully static Next.js, animated SVG diagrams as imagery, a search-and-AI-visibility layer, and a running cost of about a domain name.",
  alternates: { canonical: `${site.url}/colophon` },
};

const decisions = [
  {
    title: "Fully static, no moving parts",
    text: "Every page is generated at build time. No server, no database, no cookies, no cross-site tracking — the only measurement is anonymous, cookieless page counts (Vercel Web Analytics). There is nothing to patch at 3 a.m. and nothing to leak.",
  },
  {
    title: "Diagrams are the imagery",
    text: "A solutions architect's work product is the system diagram, so the site's visuals are hand-coded, animated SVG architecture diagrams — each case study rendered in the same visual language, a few kilobytes each, no stock photography.",
  },
  {
    title: "One content model",
    text: "All content lives in a single typed TypeScript file. Pages, structured data and the AI-crawler summary derive from it — change a fact once and every representation updates.",
  },
  {
    title: "Built to be read by machines too",
    text: "Person, FAQ, Article and ItemList structured data (JSON-LD), per-page canonicals, a sitemap, and an llms.txt summary for AI crawlers. Search and AI visibility treated as an architecture concern, not an afterthought — the same approach that put a client's site at №1 on Google in a day.",
  },
  {
    title: "Pinned, verified versions",
    text: "Next.js 16.2.10 · React 19.2.7 · Tailwind CSS 4.3.2 · TypeScript 5.9.3 — exact versions, checked against the registry at build day, no ranges.",
  },
  {
    title: "Costs about a domain name",
    text: "Static output on Vercel's free tier plus the domain: roughly $12 a year, total. Architecture is also knowing when the right amount of infrastructure is almost none.",
  },
];

export default function Colophon() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          {"//"} Colophon
        </p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-5xl">
          This site is exhibit A.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          A portfolio should demonstrate the work, not just describe it. This page documents
          the architecture decisions behind the site itself — the same reasoning I bring to
          systems that are considerably larger.
        </p>
        <div className="mt-14 space-y-10">
          {decisions.map((d, i) => (
            <section key={d.title} className="border-l border-line pl-6">
              <h2 className="font-display text-lg font-medium text-ink">
                <span className="mr-3 font-mono text-sm text-accent/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {d.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d.text}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
