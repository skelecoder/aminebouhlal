// The moment-director: receives the visitor's last ~45 seconds verbatim and
// decides — usually silence, sometimes a visual nudge, rarely a spoken line.
// Every word is generated for THIS moment in the visitor's language; nothing
// is canned. Gemini 3.5 Flash on Amine's GCP, keyless via Vercel OIDC → WIF.
// Also serves mode:"tour" — generates the tour's narration from live context.

import { NextRequest, NextResponse } from "next/server";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { sanitizeActions, SECTION_IDS, CARD_SLUGS } from "@/agent/protocol";

const GCP_PROJECT = "ai-pod-factory";
const GCP_PROJECT_NUMBER = "807370847082";
const SA_EMAIL = `ambient-director@${GCP_PROJECT}.iam.gserviceaccount.com`;
const MODEL = "gemini-3.5-flash";

const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 8;
}

const PERSONA = `You are the ambient agent living inside aminebouhlal.com — the portfolio of Amine Bouhlal, solutions architect (agentic AI on Google Cloud, digital transformation, based in Tangier). You observe one visitor's behaviour and occasionally intervene. Your character: discreet, precise, dry wit, never salesy, never repeats itself, treats silence as a professional skill. You speak the visitor's language (lang code provided).`;

const SITE_MAP = `Sections: ${SECTION_IDS.join(", ")}. Case cards (slug → essence): multi-agent-service-desk → flagship, multi-agent IT service desk on Gemini Enterprise Agent Platform, A2A, zero ITSM migration; voice-ai-at-logistics-scale → voice agent, 180,000+ calls/month in production; conversational-ai-for-consumer-finance → grounded Gemini Enterprise agents, regulated finance; smart-city-platform-gijon → smart city for 275k residents; erp-consolidation-odoo → company-wide ERP consolidation; adamaguidi-com → site ranked #1 on Google in a day, ~$12/yr. Case pages live at /work/<slug>.`;

function momentPrompt(moment: string, lang: string, soundEnabled: boolean): string {
  return [
    PERSONA,
    SITE_MAP,
    "",
    `THE MOMENT (event ages in seconds, newest matter most): ${moment}`,
    `Visitor language: ${lang}. Sound available: ${soundEnabled}.`,
    "",
    "Decide the intervention for THIS moment. Options:",
    '- actions: up to 2 of {"type":"highlight|pulse","target":"<section|slug>"}, {"type":"guide","target":"<section>"}, {"type":"reveal","target":"contact"}',
    `- utterance: ONE sentence (max 18 words) generated for this exact moment, in language "${lang}" — what a sharp, laconic colleague would murmur. It will be SPOKEN aloud if sound is available, otherwise shown as text. Refer to what they are actually looking at. Never introduce yourself, never say you are an agent, never use canned filler.`,
    '- href: optional "/work/<slug>" if the utterance points somewhere.',
    "",
    "Silence is the default: if the visitor is reading comfortably or nothing genuinely helps, return mood silent with no actions and no utterance. Never repeat a topic in alreadySaid.",
    "",
    'Respond ONLY JSON: {"mood":"silent|nudge|speak","reason":"<short>","topic":"<2-3 word tag>","actions":[...],"utterance":"...","href":"..."}',
  ].join("\n");
}

function tourPrompt(moment: string, lang: string): string {
  return [
    PERSONA,
    SITE_MAP,
    "",
    `The visitor accepted a guided tour. Context of what they already saw: ${moment}`,
    `Generate the tour narration in language "${lang}": exactly 6 lines for these stops, in order: [intro at hero, multi-agent-service-desk card, voice-ai-at-logistics-scale card, approach section, footprint section, contact section].`,
    "Each line: max 20 words, spoken aloud, laconic, concrete (real numbers where they exist), no exclamation marks, no emoji, no self-introduction beyond a minimal first-line greeting. Skip flattering what they already opened; add a wink about it instead.",
    "",
    'Respond ONLY JSON: {"lines":["...","...","...","...","...","..."]}',
  ].join("\n");
}

async function vertexToken(): Promise<string> {
  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel/providers/vercel-oidc`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA_EMAIL}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: getVercelOidcToken },
  });
  if (!client) throw new Error("WIF init failed");
  client.scopes = ["https://www.googleapis.com/auth/cloud-platform"];
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("no token");
  return token;
}

async function generate(token: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(9000),
    }
  );
  if (!res.ok) throw new Error(`vertex ${res.status}`);
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ mood: "silent", actions: [] }, { status: 429 });

  let body: { mode?: string; moment?: string; lang?: string; soundEnabled?: boolean };
  try {
    body = await req.json();
    if ((body.moment ?? "").length > 6000) throw new Error("too large");
  } catch {
    return NextResponse.json({ mood: "silent", actions: [] }, { status: 400 });
  }
  const lang = (body.lang ?? "en").slice(0, 2);
  const moment = body.moment ?? "{}";

  try {
    const token = await vertexToken();

    if (body.mode === "tour") {
      const text = await generate(token, tourPrompt(moment, lang), 400);
      const parsed = JSON.parse(text);
      const lines = Array.isArray(parsed.lines)
        ? parsed.lines.filter((l: unknown) => typeof l === "string" && l.length > 0).slice(0, 6)
        : [];
      return NextResponse.json({ lines });
    }

    const text = await generate(token, momentPrompt(moment, lang, !!body.soundEnabled), 220);
    const parsed = JSON.parse(text);
    const actions = sanitizeActions(parsed.actions, 2);
    const utterance =
      typeof parsed.utterance === "string" && parsed.utterance.length <= 160
        ? parsed.utterance
        : undefined;
    const href =
      typeof parsed.href === "string" && CARD_SLUGS.some((s) => parsed.href === `/work/${s}`)
        ? parsed.href
        : undefined;
    return NextResponse.json({
      mood: parsed.mood === "speak" || parsed.mood === "nudge" ? parsed.mood : "silent",
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : undefined,
      topic: typeof parsed.topic === "string" ? parsed.topic.slice(0, 40) : undefined,
      actions,
      utterance,
      href,
    });
  } catch (e) {
    console.error("director error:", e instanceof Error ? `${e.name}: ${e.message}` : e);
    return NextResponse.json({ mood: "silent", actions: [] }, { status: 200 });
  }
}
