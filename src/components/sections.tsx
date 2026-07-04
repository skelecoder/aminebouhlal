import Link from "next/link";
import {
  site,
  stats,
  caseStudies,
  approach,
  experience,
  education,
  awards,
  skills,
  services,
  footprint,
  faq,
} from "@/data/site";
import { HeroDiagram, FootprintMap } from "@/components/diagrams";
import { Section, CTA } from "@/components/chrome";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28">
      <p className="mb-5 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
        {site.name} · Solutions Architect · Agentic AI · {site.location}
      </p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight font-medium tracking-tight text-ink sm:text-6xl">
        <span className="sr-only">{site.name} — </span>I turn business problems into{" "}
        <span className="text-accent">systems that ship.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        {site.positioning}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <CTA href="#work" primary>
          Selected work ↓
        </CTA>
        <CTA href={`mailto:${site.email}`}>Email me</CTA>
        <CTA href={site.linkedin} external>
          LinkedIn ↗
        </CTA>
      </div>
      <div className="mt-16 border border-line-soft bg-surface/40 p-4 sm:p-8">
        <HeroDiagram />
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section className="border-t border-line-soft">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-8 sm:px-6">
            <p className="font-mono text-2xl text-accent sm:text-3xl">{s.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-faint">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Work() {
  return (
    <Section id="work" index="01" title="Selected work">
      <h2 className="mb-12 max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Systems in production, not slideware.
      </h2>
      <div className="grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2">
        {caseStudies.map((c, i) => (
          <Link
            key={c.slug}
            href={`/work/${c.slug}`}
            className={`group bg-bg p-7 transition-colors hover:bg-surface sm:p-9 ${
              i === 0 ? "sm:col-span-2" : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                {String(i + 1).padStart(2, "0")} · {c.period}
              </p>
              <span className="font-mono text-[11px] text-faint transition-colors group-hover:text-accent">
                →
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-medium text-ink transition-colors group-hover:text-accent sm:text-2xl">
              {c.title}
            </h3>
            <p className="mt-1 font-mono text-xs text-accent/80">{c.client}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{c.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {c.stack.map((t) => (
                <span
                  key={t}
                  className="border border-line px-2 py-1 font-mono text-[10px] tracking-wide text-faint"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function Services() {
  return (
    <Section id="services" index="02" title="What I do">
      <div className="grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div key={s.title} className="bg-bg p-7">
            <h3 className="font-display text-lg font-medium text-ink">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Approach() {
  return (
    <Section id="approach" index="03" title="How I work">
      <h2 className="mb-12 max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Discovery to production, one owner.
      </h2>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {approach.map((a) => (
          <div key={a.step} className="relative">
            <p className="font-mono text-3xl text-accent/40">{a.step}</p>
            <h3 className="mt-3 font-display text-lg font-medium text-ink">{a.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{a.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Experience() {
  return (
    <Section id="experience" index="04" title="Experience">
      <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr]">
        <ol className="relative space-y-10 border-l border-line pl-8">
          {experience.map((e) => (
            <li key={`${e.org}-${e.period}`} className="relative">
              <span className="absolute top-1.5 -left-[37px] h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
              <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
                {e.period}
              </p>
              <h3 className="mt-1 font-display text-lg font-medium text-ink">
                {e.role} · {e.org}
              </h3>
              <p className="font-mono text-xs text-faint">{e.where}</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{e.text}</p>
            </li>
          ))}
        </ol>
        <div className="space-y-12">
          <div>
            <h3 className="mb-5 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
              Education
            </h3>
            <ul className="space-y-5">
              {education.map((ed) => (
                <li key={ed.school}>
                  <p className="text-sm font-medium text-ink">{ed.school}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {ed.program} · {ed.period}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
              Awards
            </h3>
            <ul className="space-y-5">
              {awards.map((a) => (
                <li key={a.title}>
                  <p className="text-sm font-medium text-ink">
                    {a.title} <span className="font-mono text-xs text-faint">({a.year})</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{a.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
              Languages
            </h3>
            <ul className="space-y-2">
              {site.languages.map((l) => (
                <li key={l.name} className="flex justify-between border-b border-line-soft pb-2 text-sm">
                  <span className="text-ink">{l.name}</span>
                  <span className="font-mono text-xs text-faint">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Skills() {
  return (
    <Section id="skills" index="05" title="Stack">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {skills.map((g) => (
          <div key={g.group}>
            <h3 className="mb-4 font-display text-base font-medium text-ink">{g.group}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <li
                  key={s}
                  className="border border-line px-2.5 py-1.5 font-mono text-[11px] text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Footprint() {
  return (
    <Section id="footprint" index="06" title="Footprint">
      <h2 className="mb-10 max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Based in Tangier. Delivering everywhere.
      </h2>
      <div className="border border-line-soft bg-surface/40 p-4 sm:p-10">
        <FootprintMap base={footprint.base} nodes={footprint.nodes} />
      </div>
      <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-faint uppercase">
        {site.availability} · Spanish · Arabic · English · French
      </p>
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" index="07" title="FAQ">
      <div className="max-w-3xl divide-y divide-line-soft border-y border-line-soft">
        {faq.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-medium text-ink transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="font-mono text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function Contact() {
  return (
    <Section id="contact" index="08" title="Contact">
      <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-5xl">
        Have a workflow that shouldn&apos;t be manual anymore?
      </h2>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
        Tell me what the work looks like today. I&apos;ll tell you what a system could look
        like — and whether it&apos;s worth building.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <CTA href={`mailto:${site.email}`} primary>
          {site.email}
        </CTA>
        <CTA href={site.linkedin} external>
          LinkedIn ↗
        </CTA>
        <CTA href={site.whatsapp} external>
          WhatsApp ↗
        </CTA>
      </div>
    </Section>
  );
}
