import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site, caseStudies } from "@/data/site";
import { Nav, Footer, CTA } from "@/components/chrome";
import { CaseDiagram } from "@/components/diagrams";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return {};
  return {
    title: cs.title,
    description: cs.summary,
    alternates: { canonical: `${site.url}/work/${cs.slug}` },
    openGraph: {
      title: `${cs.title} — ${site.name}`,
      description: cs.summary,
      url: `${site.url}/work/${cs.slug}`,
      type: "article",
    },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = caseStudies.findIndex((c) => c.slug === slug);
  if (idx === -1) notFound();
  const cs = caseStudies[idx];
  const next = caseStudies[(idx + 1) % caseStudies.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: cs.title,
    description: cs.summary,
    url: `${site.url}/work/${cs.slug}`,
    author: { "@id": `${site.url}/#person` },
    about: cs.stack,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          {"//"} Case study · {cs.period}
        </p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-5xl">
          {cs.title}
        </h1>
        <p className="mt-3 font-mono text-sm text-accent/80">{cs.client}</p>
        <p className="mt-1 font-mono text-xs text-faint">{cs.context}</p>

        <div className="mt-10 grid grid-cols-3 gap-px border border-line-soft bg-line-soft">
          {cs.metrics.map((m) => (
            <div key={m.label} className="bg-bg px-4 py-6 text-center sm:px-6">
              <p className="font-mono text-xl text-accent sm:text-2xl">{m.value}</p>
              <p className="mt-2 text-[11px] leading-snug text-faint">{m.label}</p>
            </div>
          ))}
        </div>

        <figure className="mt-10 border border-line-soft bg-surface/40 p-4 sm:p-8">
          <CaseDiagram kind={cs.diagram} />
          <figcaption className="mt-4 border-t border-line-soft pt-4 font-mono text-[11px] leading-relaxed text-faint">
            {cs.diagramCaption}
          </figcaption>
        </figure>

        <div className="mt-14 space-y-12">
          {(
            [
              ["The problem", cs.challenge],
              ["The system", cs.approach],
              ["The outcome", cs.outcome],
            ] as const
          ).map(([h, body]) => (
            <section key={h}>
              <h2 className="mb-3 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
                {h}
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {cs.stack.map((t) => (
            <span key={t} className="border border-line px-2.5 py-1.5 font-mono text-[11px] text-muted">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
          <Link
            href={`/work/${next.slug}`}
            className="group font-mono text-[11px] tracking-[0.18em] text-muted uppercase transition-colors hover:text-accent"
          >
            Next case → <span className="text-ink group-hover:text-accent">{next.title}</span>
          </Link>
          <CTA href={`mailto:${site.email}`} primary>
            Discuss a similar system
          </CTA>
        </div>
      </main>
      <Footer />
    </>
  );
}
