// Animated architecture diagrams — the site's imagery.
// All diagrams share one visual language defined in globals.css:
// .d-track/.d-flow (lines with a running current), .d-node, .d-port, .d-title/.d-label.

type NodeProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  accent?: boolean;
  dashed?: boolean;
};

function Node({ x, y, w, h, title, sub, accent, dashed }: NodeProps) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={5}
        className={`d-node${accent ? " d-node-accent" : ""}`}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      <text x={cx} y={sub ? cy - 3 : cy + 4} textAnchor="middle" className="d-title">
        {title}
      </text>
      {sub && (
        <text x={cx} y={cy + 12} textAnchor="middle" className="d-label">
          {sub}
        </text>
      )}
    </g>
  );
}

function Flow({ d }: { d: string }) {
  return (
    <g>
      <path d={d} className="d-track" />
      <path d={d} className="d-flow" />
    </g>
  );
}

function Port({ cx, cy, label, below = true }: { cx: number; cy: number; label?: string; below?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={4.5} className="d-port d-pulse" />
      {label && (
        <text x={cx} y={below ? cy + 22 : cy - 14} textAnchor="middle" className="d-label">
          {label}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */

export function HeroDiagram() {
  return (
    <svg viewBox="0 0 800 250" className="w-full" role="img" aria-label="System diagram: business problems flow through discovery, design across agentic AI, cloud platforms and integrations, and shipping — into production.">
      <Port cx={42} cy={130} label="BUSINESS PROBLEM" />
      <Flow d="M46 130 H100" />
      <Node x={100} y={105} w={110} h={50} title="DISCOVER" sub="the real workflow" />
      <Flow d="M210 130 C 245 130 245 58 280 58" />
      <Flow d="M210 130 H280" />
      <Flow d="M210 130 C 245 130 245 202 280 202" />
      <Node x={280} y={36} w={160} h={44} title="AGENTIC AI" sub="voice · conversational" accent />
      <Node x={280} y={108} w={160} h={44} title="CLOUD PLATFORMS" sub="GCP · cloud-native" />
      <Node x={280} y={180} w={160} h={44} title="INTEGRATIONS" sub="APIs · data flows" />
      <Flow d="M440 58 C 475 58 475 130 510 130" />
      <Flow d="M440 130 H510" />
      <Flow d="M440 202 C 475 202 475 130 510 130" />
      <Node x={510} y={105} w={110} h={50} title="SHIP" sub="hands-on delivery" />
      <Flow d="M620 130 H690" />
      <Port cx={694} cy={130} label="IN PRODUCTION" />
      <text x={694} y={102} textAnchor="middle" className="d-tag">
        180K+ CALLS / MO
      </text>
    </svg>
  );
}

export function DeskDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="Multi-agent service desk: web and Teams channels feed an ADK triage orchestrator, which delegates over A2A to identity, knowledge and ticketing agents; a port abstraction adapts to ITSM backends kept as systems of record.">
      <Node x={36} y={38} w={100} h={40} title="WEB APP" sub="Next.js" />
      <Node x={36} y={162} w={100} h={40} title="TEAMS BOT" sub="Entra SSO" />
      <Flow d="M136 58 C 162 58 162 120 188 120" />
      <Flow d="M136 182 C 162 182 162 120 188 120" />
      <Node x={188} y={90} w={144} h={60} title="ORCHESTRATOR" sub="ADK · Agent Runtime" accent />
      <text x={260} y={168} textAnchor="middle" className="d-tag">
        SESSIONS · MEMORY
      </text>
      <Flow d="M332 108 C 354 108 354 49 376 49" />
      <Flow d="M332 120 H376" />
      <Flow d="M332 132 C 354 132 354 191 376 191" />
      <text x={354} y={30} textAnchor="middle" className="d-tag">
        A2A
      </text>
      <Node x={376} y={28} w={128} h={42} title="IAM AGENT" sub="Entra ID · HITL" />
      <Node x={376} y={99} w={128} h={42} title="KNOWLEDGE" sub="RAG · citations" />
      <Node x={376} y={170} w={128} h={42} title="TICKETING PORT" sub="adapter / backend" />
      <Flow d="M504 191 H540" />
      <Node x={540} y={163} w={124} h={56} title="ITSM BACKENDS" sub="systems of record" dashed />
      <text x={602} y={148} textAnchor="middle" className="d-tag">
        PRESERVED
      </text>
    </svg>
  );
}

export function VoiceDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="Voice agent architecture: caller through telephony into an ElevenLabs voice agent, grounded in carrier APIs, with human handoff.">
      <Port cx={32} cy={120} label="CALLER" />
      <Flow d="M36 120 H80" />
      <Node x={80} y={95} w={104} h={50} title="TELEPHONY" sub="SIP ingress" />
      <Flow d="M184 120 H240" />
      <Node x={240} y={80} w={150} h={80} title="VOICE AGENT" sub="STT · LLM · TTS" accent />
      <text x={315} y={148} textAnchor="middle" className="d-tag">
        ELEVENLABS
      </text>
      <Flow d="M390 105 C 425 105 425 63 460 63" />
      <Node x={460} y={40} w={140} h={46} title="CARRIER APIs" sub="tracking · orders" />
      <Flow d="M390 135 C 425 135 425 177 460 177" />
      <Node x={460} y={154} w={140} h={46} title="HUMAN AGENT" sub="context attached" />
      <Flow d="M600 63 H644" />
      <Port cx={648} cy={63} label="RESOLVED" />
    </svg>
  );
}

export function FinanceDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="Conversational finance architecture: customer self-service and advisor assist, both grounded through Gemini Enterprise in the knowledge base and core systems.">
      <Port cx={32} cy={80} label="CUSTOMER" />
      <Flow d="M36 80 H92" />
      <Node x={92} y={55} w={130} h={50} title="SELF-SERVICE" sub="conversational agent" />
      <Port cx={32} cy={160} label="ADVISOR" />
      <Flow d="M36 160 H92" />
      <Node x={92} y={135} w={130} h={50} title="AGENT ASSIST" sub="grounded drafts" />
      <Flow d="M222 80 C 256 80 256 120 290 120" />
      <Flow d="M222 160 C 256 160 256 120 290 120" />
      <Node x={290} y={85} w={160} h={70} title="GEMINI ENTERPRISE" sub="grounded retrieval" accent />
      <Flow d="M450 105 C 480 105 480 73 510 73" />
      <Node x={510} y={50} w={140} h={46} title="KNOWLEDGE BASE" sub="policy · products" />
      <Flow d="M450 135 C 480 135 480 167 510 167" />
      <Node x={510} y={144} w={140} h={46} title="CORE SYSTEMS" sub="accounts · cards" />
    </svg>
  );
}

export function CityDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="Smart-city architecture: IoT sensors, municipal systems and open data flow through ingestion into Elasticsearch, surfaced as a geospatial interface.">
      <Node x={50} y={28} w={130} h={42} title="IoT SENSORS" sub="live feeds" />
      <Node x={50} y={99} w={130} h={42} title="MUNICIPAL SYSTEMS" sub="city services" />
      <Node x={50} y={170} w={130} h={42} title="OPEN DATA" sub="public datasets" />
      <Flow d="M180 49 C 215 49 215 120 250 120" />
      <Flow d="M180 120 H250" />
      <Flow d="M180 191 C 215 191 215 120 250 120" />
      <Node x={250} y={92} w={110} h={56} title="INGESTION" sub="normalise · enrich" />
      <Flow d="M360 120 H400" />
      <Node x={400} y={92} w={130} h={56} title="ELASTICSEARCH" sub="search · indexing" accent />
      <Flow d="M530 120 H566" />
      <Node x={566} y={92} w={100} h={56} title="MAP UI" sub="Leaflet · geo" />
      <text x={616} y={80} textAnchor="middle" className="d-tag">
        275K RESIDENTS
      </text>
    </svg>
  );
}

export function ErpDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="ERP consolidation: legacy department tools staged-migrated onto one Odoo core, with API integrations and unified operations.">
      <Node x={50} y={20} w={110} h={36} title="IT TOOLS" dashed />
      <Node x={50} y={76} w={110} h={36} title="OPS TOOLS" dashed />
      <Node x={50} y={132} w={110} h={36} title="SALES TOOLS" dashed />
      <Node x={50} y={188} w={110} h={36} title="HR TOOLS" dashed />
      <Flow d="M160 38 C 210 38 210 120 260 120" />
      <Flow d="M160 94 C 210 94 210 120 260 120" />
      <Flow d="M160 150 C 210 150 210 120 260 120" />
      <Flow d="M160 206 C 210 206 210 120 260 120" />
      <text x={210} y={230} textAnchor="middle" className="d-tag">
        STAGED MIGRATION
      </text>
      <Node x={260} y={85} w={150} h={70} title="ODOO ERP" sub="one data model" accent />
      <Flow d="M410 105 C 445 105 445 73 480 73" />
      <Node x={480} y={50} w={150} h={46} title="API INTEGRATIONS" sub="systems that stayed" />
      <Flow d="M410 135 C 445 135 445 167 480 167" />
      <Node x={480} y={144} w={150} h={46} title="UNIFIED OPERATIONS" sub="IT · Ops · Sales · HR" />
    </svg>
  );
}

export function WebDiagram() {
  return (
    <svg viewBox="0 0 680 240" className="w-full" role="img" aria-label="Static site architecture: one content model through a static Next.js build to the edge, serving humans, search engines and AI crawlers.">
      <Node x={40} y={92} w={140} h={56} title="CONTENT MODEL" sub="one source of truth" />
      <Flow d="M180 120 H236" />
      <Node x={236} y={92} w={130} h={56} title="NEXT.JS" sub="static build" accent />
      <Flow d="M366 120 H420" />
      <Node x={420} y={92} w={100} h={56} title="EDGE CDN" sub="Vercel" />
      <Flow d="M520 120 C 545 120 545 49 570 49" />
      <Flow d="M520 120 H570" />
      <Flow d="M520 120 C 545 120 545 191 570 191" />
      <Node x={570} y={28} w={100} h={42} title="HUMANS" sub="HTML · a11y" />
      <Node x={570} y={99} w={100} h={42} title="SEARCH" sub="JSON-LD" />
      <Node x={570} y={170} w={100} h={42} title="AI CRAWLERS" sub="llms.txt" />
      <text x={110} y={80} textAnchor="middle" className="d-tag">
        №1 ON GOOGLE, DAY ONE
      </text>
    </svg>
  );
}

export function CaseDiagram({ kind }: { kind: "desk" | "voice" | "finance" | "city" | "erp" | "web" }) {
  switch (kind) {
    case "desk":
      return <DeskDiagram />;
    case "voice":
      return <VoiceDiagram />;
    case "finance":
      return <FinanceDiagram />;
    case "city":
      return <CityDiagram />;
    case "erp":
      return <ErpDiagram />;
    case "web":
      return <WebDiagram />;
  }
}

/* Global footprint — abstract Atlantic-centred network, no landmasses. */
export function FootprintMap({
  base,
  nodes,
}: {
  base: { label: string; sub: string; x: number; y: number };
  nodes: { label: string; sub: string; x: number; y: number }[];
}) {
  const W = 800;
  const H = 420;
  const bx = (base.x / 100) * W;
  const by = (base.y / 100) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Map of engagements: based in Tangier, with work delivered in Spain, Switzerland, across European enterprises and for US clients.">
      {/* connection arcs from base to each node */}
      {nodes.map((n) => {
        const nx = (n.x / 100) * W;
        const ny = (n.y / 100) * H;
        const mx = (bx + nx) / 2;
        const my = Math.min(by, ny) - Math.abs(nx - bx) * 0.18 - 24;
        const d = `M${bx} ${by} Q ${mx} ${my} ${nx} ${ny}`;
        return (
          <g key={n.label}>
            <path d={d} className="d-track" strokeDasharray="2 5" />
            <path d={d} className="d-flow" style={{ animationDuration: "3.2s" }} />
          </g>
        );
      })}
      {/* engagement nodes */}
      {nodes.map((n) => {
        const nx = (n.x / 100) * W;
        const ny = (n.y / 100) * H;
        return (
          <g key={n.label}>
            <circle cx={nx} cy={ny} r={4} className="d-port" />
            <text x={nx} y={ny - 16} textAnchor="middle" className="d-title">
              {n.label}
            </text>
            <text x={nx} y={ny + 22} textAnchor="middle" className="d-label">
              {n.sub}
            </text>
          </g>
        );
      })}
      {/* base */}
      <circle cx={bx} cy={by} r={12} fill="none" stroke="var(--color-accent)" strokeOpacity={0.35} className="d-pulse" />
      <circle cx={bx} cy={by} r={5.5} fill="var(--color-accent)" />
      <text x={bx} y={by + 32} textAnchor="middle" className="d-title">
        {base.label}
      </text>
      <text x={bx} y={by + 48} textAnchor="middle" className="d-label">
        {base.sub}
      </text>
    </svg>
  );
}
