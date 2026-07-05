// Hover whisperer: ultra-fast streamed one-liners while the cursor rests on
// something. Gemini 3.5 Flash streaming on Amine's GCP, keyless via WIF.
// The client caches per target, so each element costs tokens once per session.

import { NextRequest } from "next/server";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { SECTION_IDS, CARD_SLUGS } from "@/agent/protocol";

const GCP_PROJECT = "ai-pod-factory";
const GCP_PROJECT_NUMBER = "807370847082";
const SA_EMAIL = `ambient-director@${GCP_PROJECT}.iam.gserviceaccount.com`;
const MODEL = "gemini-3.5-flash"; // swap for a Claude Haiku publisher model anytime

const CONTEXT: Record<string, string> = {
  "multi-agent-service-desk": "flagship case: multi-agent IT service desk on Gemini Enterprise Agent Platform, A2A, zero ITSM migrations",
  "voice-ai-at-logistics-scale": "case: ElevenLabs voice agent, 180,000+ calls/month in production for a logistics leader",
  "conversational-ai-for-consumer-finance": "case: Gemini Enterprise agents for consumer finance, grounded, regulated",
  "smart-city-platform-gijon": "case: smart-city platform for 275k residents, IoT + Elasticsearch, T-Systems",
  "erp-consolidation-odoo": "case: company-wide Odoo ERP consolidation, 4 departments, staged migration",
  "adamaguidi-com": "case: portfolio site ranked #1 on Google in one day, ~$12/yr",
  work: "selected work section", services: "services offered", approach: "how Amine works",
  experience: "career timeline", skills: "tech stack", footprint: "global footprint map",
  faq: "frequently asked questions", contact: "contact section",
};

const VALID = new Set<string>([...SECTION_IDS, ...CARD_SLUGS]);
const hits = new Map<string, { n: number; t: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60_000 && h.n > 20) return new Response(null, { status: 429 });
  hits.set(ip, h && now - h.t < 60_000 ? { n: h.n + 1, t: h.t } : { n: 1, t: now });

  let target = "", lang = "en";
  try {
    const body = await req.json();
    target = String(body.target ?? "");
    lang = String(body.lang ?? "en").slice(0, 2);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!VALID.has(target)) return new Response(null, { status: 400 });

  try {
    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel/providers/vercel-oidc`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA_EMAIL}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    });
    if (!client) throw new Error("wif");
    client.scopes = ["https://www.googleapis.com/auth/cloud-platform"];
    const { token } = await client.getAccessToken();

    const prompt = `You are the ambient agent of aminebouhlal.com (Amine Bouhlal, solutions architect, agentic AI). The visitor's cursor is resting on: ${CONTEXT[target] ?? target}. Write ONE nudge of at most 12 words, language "${lang}". Dry wit welcome. No emoji, no exclamation marks, no quotes. Output only the sentence.`;

    const upstream = await fetch(
      `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/global/publishers/google/models/${MODEL}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 40, temperature: 0.9 },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!upstream.ok || !upstream.body) throw new Error(`vertex ${upstream.status}`);

    // Re-emit only the text deltas as a plain text stream.
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buf = "";
    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const j = JSON.parse(line.slice(5));
            const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
            if (t) controller.enqueue(encoder.encode(t));
          } catch {
            /* partial chunk */
          }
        }
      },
      cancel() {
        void reader.cancel();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("hover error:", e instanceof Error ? e.message : e);
    return new Response(null, { status: 503 });
  }
}
