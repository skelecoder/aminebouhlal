import Link from "next/link";
import { site } from "@/data/site";

export function Nav() {
  const links = [
    { href: "/#work", label: "Work" },
    { href: "/#approach", label: "Approach" },
    { href: "/#experience", label: "Experience" },
    { href: "/#contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center border border-line font-mono text-xs text-accent transition-colors group-hover:border-accent">
            AB
          </span>
          <span className="font-mono text-xs tracking-[0.18em] text-ink uppercase max-sm:hidden">
            Amine Bouhlal
          </span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Section({
  id,
  index,
  title,
  children,
  className = "",
}: {
  id?: string;
  index: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-line-soft py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="mb-3 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          {"//"} {index} — {title}
        </p>
        {children}
      </div>
    </section>
  );
}

export function CTA({
  href,
  children,
  primary,
  external,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const cls = primary
    ? "border-accent bg-accent-soft text-accent hover:bg-accent hover:text-bg"
    : "border-line text-muted hover:border-accent hover:text-accent";
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-block border px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${cls}`}
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 font-mono text-[11px] tracking-[0.14em] text-faint uppercase sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© 2026 {site.name} · Tangier, Morocco</p>
        <div className="flex gap-6">
          <Link href="/colophon" className="transition-colors hover:text-accent">
            How this site is built
          </Link>
          <a href="/llms.txt" className="transition-colors hover:text-accent">
            llms.txt
          </a>
        </div>
      </div>
    </footer>
  );
}
