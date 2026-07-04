import { site, faq, services, caseStudies } from "@/data/site";
import { Nav, Footer } from "@/components/chrome";
import {
  Hero,
  Stats,
  Work,
  Services,
  Approach,
  Experience,
  Skills,
  Footprint,
  Faq,
  Contact,
} from "@/components/sections";

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      jobTitle: "Solutions Architect",
      description:
        "Solutions architect specialising in agentic AI, cloud platforms and digital transformation. 8+ years delivering production systems across Europe, Africa and North America.",
      url: site.url,
      image: `${site.url}/amine-bouhlal.jpg`,
      email: `mailto:${site.email}`,
      sameAs: [site.linkedin],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tangier",
        addressCountry: "MA",
      },
      knowsLanguage: ["es", "ar", "en", "fr"],
      knowsAbout: [
        "Solution architecture",
        "Agentic AI",
        "Conversational AI",
        "Voice AI agents",
        "Google Cloud Platform",
        "Vertex AI",
        "Gemini Enterprise",
        "Digital transformation",
        "Enterprise integration",
      ],
      worksFor: { "@type": "Organization", name: "NTT DATA, Inc." },
      makesOffer: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.text },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Selected work — Amine Bouhlal",
      itemListElement: caseStudies.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${site.url}/work/${c.slug}`,
        name: c.title,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Work />
        <Services />
        <Approach />
        <Experience />
        <Skills />
        <Footprint />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
