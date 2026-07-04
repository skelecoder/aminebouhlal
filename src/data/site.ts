// Single source of truth for all site content.
// Edit here — every page, JSON-LD block and llms.txt derives from this file.

export const site = {
  name: "Amine Bouhlal",
  title: "Solutions Architect",
  tagline: "I turn business problems into systems that ship.",
  positioning:
    "Solutions architect for agentic AI, cloud platforms and enterprise integration — eight-plus years across Europe, Africa and North America, hands-on from discovery to production.",
  url: "https://aminebouhlal.com",
  email: "abouhlal@gmail.com",
  linkedin: "https://www.linkedin.com/in/amine-bouhlal",
  whatsapp: "https://wa.me/212666591918",
  location: "Tangier, Morocco",
  availability: "Remote worldwide · CET (GMT+1)",
  languages: [
    { name: "Spanish", level: "Native" },
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Professional" },
    { name: "French", level: "Professional" },
  ],
};

export const stats = [
  { value: "180K+", label: "voice-agent calls handled per month, in production" },
  { value: "8+", label: "years designing and delivering systems" },
  { value: "3", label: "continents of client engagements" },
  { value: "275K", label: "residents served by a smart-city platform I helped build" },
  { value: "4", label: "working languages" },
  { value: "2", label: "hackathon podiums, incl. a Deutsche Telekom global win" },
];

export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  context: string; // where this was delivered
  period: string;
  summary: string; // one-liner for cards
  challenge: string;
  approach: string;
  outcome: string;
  metrics: { value: string; label: string }[];
  stack: string[];
  diagram: "desk" | "voice" | "finance" | "city" | "erp" | "web";
  diagramCaption: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "multi-agent-service-desk",
    title: "A multi-agent service desk on Google's agent platform",
    client: "NTT DATA — internal IT, enterprise scale",
    context: "Solutions Architect — architecture owner",
    period: "2026 — in delivery",
    summary:
      "An AI-first IT service desk on the Gemini Enterprise Agent Platform: a triage orchestrator delegating to specialised agents over A2A, layered above existing ITSM systems — which stay untouched as systems of record.",
    challenge:
      "An enterprise service desk absorbing high volumes of well-understood requests — password resets, access, software — on top of ITSM platforms that encode years of process and compliance investment. Replacing them would be a multi-year migration with zero strategic upside; leaving the experience as-is keeps burning L1 capacity on routine work.",
    approach:
      "Architected an orchestration layer above the ticketing backends, not a replacement: a triage orchestrator built with Google's Agent Development Kit (ADK), deployed to Agent Runtime on the Gemini Enterprise Agent Platform (the platform formerly known as Vertex AI, rebranded at Cloud Next '26). It classifies intent and delegates over the A2A protocol to specialised peer agents — identity & access (Entra ID), RAG-grounded knowledge with citations on every claim — with managed Sessions and Memory Bank for state, multi-model routing across Claude and Gemini via LiteLLM, and human-in-the-loop gates on sensitive actions. A ticketing-port abstraction keeps the agentic core decoupled from any specific ITSM backend, with an adapter per system.",
    outcome:
      "In delivery: eleven accepted architecture decision records, a multi-backend core that treats existing ITSM platforms as immutable systems of record, agent-eval gates in CI, and a design built to productise across business units — the reference architecture for agentic service operations.",
    metrics: [
      { value: "0", label: "ITSM migrations — orchestrate above, never replace" },
      { value: "A2A", label: "peer agents: triage, identity, knowledge, and growing" },
      { value: "4", label: "models routed by task — Claude + Gemini via LiteLLM" },
    ],
    stack: ["Gemini Enterprise Agent Platform", "Google ADK", "A2A", "Claude", "Python", "Next.js", "Terraform"],
    diagram: "desk",
    diagramCaption:
      "Web and Teams channels feed a triage orchestrator (ADK, on Agent Runtime), which delegates over A2A to specialised agents; a ticketing-port abstraction adapts to each ITSM backend, preserved as the system of record.",
  },
  {
    slug: "voice-ai-at-logistics-scale",
    title: "Voice AI at logistics scale",
    client: "A European parcel-logistics leader",
    context: "Delivered as Solutions Architect at NTT DATA",
    period: "2024 — present",
    summary:
      "A production voice-AI agent answering 180,000+ customer calls per month — parcel tracking, delivery changes and claims, end to end.",
    challenge:
      "A contact centre absorbing six-figure monthly call volumes for repetitive, fully structured requests — parcel status, redelivery, address changes — with cost, wait times and agent churn scaling linearly with volume.",
    approach:
      "Designed an end-to-end voice agent on ElevenLabs conversational AI: telephony ingress, real-time speech understanding, LLM-driven dialogue grounded in the carrier's tracking and order APIs, and a clean escalation path that hands complex or sensitive cases to human agents with full context attached. Owned the architecture from discovery through production deployment.",
    outcome:
      "Live in production handling 180,000+ calls per month, resolving routine requests without human involvement and shrinking the queue that reaches the human team to the cases that actually need judgment.",
    metrics: [
      { value: "180K+", label: "calls / month in production" },
      { value: "24/7", label: "availability, no queue scaling" },
      { value: "E2E", label: "owned from discovery to deployment" },
    ],
    stack: ["ElevenLabs", "Python", "GCP", "Vertex AI", "Firebase"],
    diagram: "voice",
    diagramCaption:
      "Call flow: telephony ingress → speech understanding → LLM dialogue grounded in carrier APIs → resolution or context-rich human handoff.",
  },
  {
    slug: "conversational-ai-for-consumer-finance",
    title: "Conversational AI for consumer finance",
    client: "The consumer-finance arm of a major European retail group",
    context: "Delivered as Solutions Architect at NTT DATA",
    period: "2024 — present",
    summary:
      "Customer-experience agents on Google's Gemini Enterprise — contact-centre automation and cognitive assistance for a card-and-credit business.",
    challenge:
      "A card-and-credit operation where customers ask high-stakes questions — balances, payments, disputes — and every answer must be grounded in policy and account systems, not model guesswork.",
    approach:
      "Architected conversational agents on Gemini Enterprise: retrieval grounded in the institution's knowledge base, secure integration with core customer systems, and an agent-assist mode that drafts grounded answers for human advisors instead of replacing them where regulation demands a person.",
    outcome:
      "Conversational customer experience and cognitive assistance in a regulated financial environment — automation where it's safe, augmentation where it isn't.",
    metrics: [
      { value: "2", label: "modes: self-service + agent assist" },
      { value: "100%", label: "answers grounded in enterprise knowledge" },
      { value: "Regulated", label: "financial-services environment" },
    ],
    stack: ["Gemini Enterprise", "GCP", "Vertex AI", "Python"],
    diagram: "finance",
    diagramCaption:
      "Two modes, one architecture: customer self-service and advisor assist, both grounded in the same enterprise knowledge and core systems.",
  },
  {
    slug: "smart-city-platform-gijon",
    title: "A smart-city platform for 275,000 residents",
    client: "Gijón City Council — Gijón-IN",
    context: "Delivered at T-Systems Iberia (Deutsche Telekom), Barcelona",
    period: "2020 — 2021",
    summary:
      "Public-sector smart-city platform integrating municipal data and IoT feeds for the city of Gijón, Spain — search, geospatial visualisation, container deployment.",
    challenge:
      "A city's data lives in dozens of disconnected municipal systems and sensor networks. Gijón wanted one platform where services, open data and live IoT feeds are searchable and visible on a map — for staff and citizens alike.",
    approach:
      "Worked across the stack: ingestion of municipal and IoT data sources, Elasticsearch for search and indexing, Leaflet-based geospatial visualisation, and OpenShift container deployment. Joined as an intern, promoted twice on the engineering ladder during delivery.",
    outcome:
      "A live platform for a city of ~275,000 residents — and the team's sibling project, Syrah Sostenibilidad for the Generalitat de Catalunya, won the Deutsche Telekom Global Hackathon in 2021.",
    metrics: [
      { value: "275K", label: "residents in served municipality" },
      { value: "2×", label: "promotions during the engagement" },
      { value: "1st", label: "Deutsche Telekom Global Hackathon" },
    ],
    stack: ["Next.js", "Elasticsearch", "OpenShift", "Leaflet", "IoT"],
    diagram: "city",
    diagramCaption:
      "Municipal systems and IoT sensor feeds flow through ingestion into a searchable index, surfaced as geospatial views for staff and citizens.",
  },
  {
    slug: "erp-consolidation-odoo",
    title: "One company, one platform",
    client: "AUTICS Group, Tangier",
    context: "Independent consultant — led IT operations",
    period: "2023 — 2024",
    summary:
      "Company-wide Odoo ERP rollout across IT, Operations, Sales and HR — architecture, custom modules, API integrations and migration off legacy tools.",
    challenge:
      "A growing group running each department on its own disconnected tooling — spreadsheets, legacy apps, manual handoffs — with no single view of the business.",
    approach:
      "Led the consolidation onto a single Odoo platform: system architecture, custom-module development for department-specific workflows, API integrations with the systems that stayed, and staged migration from legacy tools while the business kept running.",
    outcome:
      "IT, Operations, Sales and HR operating on one unified platform, one data model — replacing a patchwork of tools with a system the company still runs on.",
    metrics: [
      { value: "4", label: "departments consolidated" },
      { value: "1", label: "unified platform and data model" },
      { value: "0", label: "big-bang cutovers — staged migration" },
    ],
    stack: ["Odoo", "Python", "REST APIs", "PostgreSQL"],
    diagram: "erp",
    diagramCaption:
      "Staged consolidation: legacy tools per department migrated onto one Odoo core, with API integrations for the systems that remained.",
  },
  {
    slug: "adamaguidi-com",
    title: "Zero to №1 on Google in a day",
    client: "Adam Aguidi — film art director, Morocco",
    context: "Personal project — design, build, deploy, SEO/GEO",
    period: "2026",
    summary:
      "A portfolio site for a film art director: built from scratch and ranked first on Google for his name within a day of launch — via architecture, not ads.",
    challenge:
      "A film-industry professional with zero web presence, competing for his own name against IMDb and aggregator sites — on a budget of roughly one domain name.",
    approach:
      "Fully static Next.js site with an aggressive search-and-AI-visibility layer: per-page metadata and canonicals, JSON-LD (Person, FAQ, ItemList, Service), sitemap discipline, an llms.txt summary for AI crawlers, and verified Search Console + Bing submission at launch.",
    outcome:
      "Indexed and ranked №1 on Google for his name within a day. Live at adamaguidi.com — a verifiable, public reference for how I treat search and AI visibility as an architecture concern.",
    metrics: [
      { value: "№1", label: "on Google for his name, day one" },
      { value: "~$12/yr", label: "total running cost" },
      { value: "100%", label: "static — no server, no database" },
    ],
    stack: ["Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    diagram: "web",
    diagramCaption:
      "One content model feeding the static build; HTML for humans, JSON-LD and llms.txt for search engines and AI crawlers.",
  },
];

export const approach = [
  {
    step: "01",
    title: "Discover",
    text: "Sit with the business problem until it's specific: who does the work today, what it costs, where it breaks. Opportunity identification before any architecture.",
  },
  {
    step: "02",
    title: "Design",
    text: "Turn the problem into a system: components, data flows, integration points, failure modes. The diagram everyone argues about before anyone writes code.",
  },
  {
    step: "03",
    title: "Build",
    text: "Stay hands-on through delivery — I write code, wire integrations and unblock teams. Architecture that ships beats architecture that impresses.",
  },
  {
    step: "04",
    title: "Run",
    text: "Production is the point. Deployment, observability, iteration — a system counts when it's handling real volume, like 180,000 calls a month.",
  },
];

export const experience = [
  {
    period: "2024 — present",
    role: "Solutions Architect",
    org: "NTT DATA, Inc.",
    where: "Remote",
    text: "Agentic-AI and digital-transformation solutions for European enterprises in telecom, logistics and retail finance. Full lifecycle: discovery, solution design, architecture, deployment.",
  },
  {
    period: "2023 — 2024",
    role: "Solutions Architect",
    org: "AUTICS Group",
    where: "Tangier",
    text: "Led IT operations and a company-wide Odoo ERP rollout — architecture, custom modules, integrations, legacy migration.",
  },
  {
    period: "2022 — 2023",
    role: "DevOps / Platform Engineer",
    org: "coupolino AG",
    where: "Switzerland · remote",
    text: "CI/CD, infrastructure automation and release management for Scount, a Swiss augmented-reality startup. Weekly release cadence.",
  },
  {
    period: "2021 — 2022",
    role: "Full-Stack Engineer",
    org: "GovRight",
    where: "US clients · remote",
    text: "Web applications for US legal-tech and civic-technology organisations — development plus DevOps in small, fast teams.",
  },
  {
    period: "2020 — 2021",
    role: "Software Engineer",
    org: "T-Systems Iberia",
    where: "Barcelona",
    text: "Two public-sector platforms — Gijón-IN smart city and Syrah Sostenibilidad for the Generalitat de Catalunya. Intern to engineer, promoted twice. Deutsche Telekom Global Hackathon winner, 2021.",
  },
  {
    period: "2019",
    role: "Technical Consultant",
    org: "Consulate General of Spain in Tangier",
    where: "On-site",
    text: "Modernised IT and accounting operations — mapped manual workflows, replaced them with internal tooling and automation.",
  },
];

export const education = [
  {
    school: "Universitat Politècnica de Catalunya (UPC)",
    program: "Software Quality Assurance",
    period: "2020 — 2021",
  },
  {
    school: "Universitat Oberta de Catalunya (UOC)",
    program: "Industry 4.0 — Cyber-Physical Systems, Smart Product Development",
    period: "2018 — 2020",
  },
  {
    school: "CESIM, Tangier",
    program: "Computer Engineering — final-year project: facial-recognition system (OpenCV)",
    period: "2016 — 2018",
  },
];

export const awards = [
  {
    title: "Winner — Deutsche Telekom Global Hackathon",
    year: "2021",
    detail: "With the Syrah Sostenibilidad team at T-Systems Iberia.",
  },
  {
    title: "2nd Prize — OIF Sustainable Solutions Hackathon",
    year: "2018",
    detail: "Project Kusele — mobile and web app for sustainability (Organisation Internationale de la Francophonie).",
  },
];

export const skills = [
  {
    group: "Architecture & Design",
    items: [
      "End-to-end solution architecture",
      "Agentic-AI systems",
      "System integration",
      "API design",
      "Event & data flows",
      "Cloud-native patterns",
    ],
  },
  {
    group: "AI & ML",
    items: [
      "LLM orchestration",
      "Conversational & voice agents",
      "Gemini Enterprise Agent Platform (form. Vertex AI)",
      "Google ADK · A2A",
      "Gemini Enterprise",
      "Claude",
      "ElevenLabs",
      "Prompt engineering",
    ],
  },
  {
    group: "Cloud & Infrastructure",
    items: [
      "Google Cloud Platform",
      "BigQuery",
      "Cloud Composer (Airflow)",
      "Firebase",
      "OpenShift",
      "Docker",
      "GitLab CI/CD",
    ],
  },
  {
    group: "Development",
    items: [
      "Python",
      "Next.js",
      "Node.js",
      "TypeScript",
      "REST APIs",
      "Elasticsearch",
      "Odoo ERP",
    ],
  },
];

export const services = [
  {
    title: "Agentic-AI systems",
    text: "Voice and conversational agents that run in production — grounded in your systems, with human handoff designed in from day one.",
  },
  {
    title: "Solution architecture",
    text: "From business problem to system design: components, integrations, data flows and the trade-offs made explicit.",
  },
  {
    title: "Digital transformation",
    text: "Replacing manual workflows with systems — process automation, ERP consolidation, the unglamorous work that compounds.",
  },
  {
    title: "Cloud & platform engineering",
    text: "GCP-native architecture, CI/CD, deployment pipelines — built to be run by the team that inherits them.",
  },
];

// Nodes for the global-footprint map. x/y are % positions on the SVG canvas,
// hand-placed on an Atlantic-centred layout.
export const footprint = {
  base: { label: "Tangier", sub: "Base of operations", x: 44, y: 72 },
  nodes: [
    { label: "US clients", sub: "GovRight — civic tech", x: 12, y: 40 },
    { label: "Gijón", sub: "Smart-city platform", x: 32, y: 34 },
    { label: "Barcelona", sub: "T-Systems Iberia", x: 53, y: 50 },
    { label: "Zurich", sub: "coupolino AG", x: 62, y: 26 },
    { label: "European enterprises", sub: "NTT DATA — telecom · logistics · finance", x: 82, y: 44 },
  ],
};

export const faq = [
  {
    q: "Who is Amine Bouhlal?",
    a: "Amine Bouhlal is a solutions architect based in Tangier, Morocco, specialising in agentic AI, cloud platforms and digital transformation. He has 8+ years of experience delivering systems for enterprises across Europe, Africa and North America, and currently works as a Solutions Architect at NTT DATA.",
  },
  {
    q: "What does Amine Bouhlal do?",
    a: "He turns business problems into production systems: voice and conversational AI agents, cloud-native architectures, enterprise integrations and ERP consolidations — owning delivery from discovery and solution design through deployment.",
  },
  {
    q: "What is agentic AI, and why does it matter for enterprises?",
    a: "Agentic AI means systems where AI agents carry out multi-step business processes autonomously — answering customer calls, resolving requests, orchestrating workflows — rather than just generating text. Done well, it replaces entire manual workflows: one system Amine architected handles more than 180,000 customer calls per month in production.",
  },
  {
    q: "Is Amine Bouhlal available for consulting?",
    a: "Amine works remotely from Tangier, Morocco (CET/GMT+1) and has delivered for clients across Europe and North America. The fastest way to reach him is email at abouhlal@gmail.com or LinkedIn.",
  },
  {
    q: "What languages does Amine Bouhlal speak?",
    a: "Spanish and Arabic natively, plus professional English and French. He was educated in Spain and works comfortably across European and North African business cultures.",
  },
];
