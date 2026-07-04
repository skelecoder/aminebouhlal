import Link from "next/link";
import { Nav, Footer } from "@/components/chrome";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex max-w-6xl flex-col items-start px-5 py-32 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{"//"} 404</p>
        <h1 className="mt-4 font-display text-4xl font-medium text-ink">Dead endpoint.</h1>
        <p className="mt-4 text-muted">This route doesn&apos;t resolve. The system map is on the home page.</p>
        <Link href="/" className="mt-8 border border-line px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase transition-colors hover:border-accent hover:text-accent">
          ← Back to /
        </Link>
      </main>
      <Footer />
    </>
  );
}
