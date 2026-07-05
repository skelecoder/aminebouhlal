// Tier-2 director: Gemini 3.5 Flash on Amine's own GCP project decides
// which UI actions (from the bounded catalog) to fire, given an anonymous
// behaviour summary. Auth is Vercel OIDC → GCP Workload Identity Federation:
// no API keys, no service-account files, nothing to leak.

import { NextRequest, NextResponse } from "next/server";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { sanitizeActions, SECTION_IDS, CARD_SLUGS } from "@/agent/protocol";

// GCP wiring — resource identifiers only, none of these are secrets.
const GCP_PROJECT = "ai-pod-factory";
const GCP_PROJECT_NUMBER = "807370847082";
const WIF_POOL = "vercel";
const WIF_PROVIDER = "vercel-oidc";
const SA_EMAIL = `ambient-director@${GCP_PROJECT}.iam.gserviceaccount.com`;
const MODEL = "gemini-3.5-flash";

// Best-effort per-instance rate limiting (Hobby: budget alerts + per-session
// caps on the client are the real controls; this stops naive hammering).
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 4;
}

function buildPrompt(summary: unknown): string {
  return [
    "You are the ambient UI director of aminebouhlal.com, the portfolio of Amine Bouhlal, a solutions architect (agentic AI, GCP, digital transformation).",
    "You receive an anonymous behaviour summary of the current visitor. Decide whether to fire UI stimuli, and which. Silence is a valid and often correct decision.",
    "",
    `Page sections (ids): ${SECTION_IDS.join(", ")}.`,
    `Case-study cards (slugs): ${CARD_SLUGS.join(", ")} — pages live at /work/<slug>.`,
    "",
    "Allowed actions (max 2, prefer 1 or 0):",
    '- {"type":"highlight","target":"<section id or card slug>"} — subtle glow',
    '- {"type":"pulse","target":"<section id or card slug>"} — brief attention pulse',
    '- {"type":"guide","target":"<section id>"} — animated cue pointing toward a section',
    '- {"type":"reveal","target":"contact"} — show a floating email affordance',
    '- {"type":"whisper","text":"<max 90 chars>","href":"/<path>"} — ONE short line of text, only if a visual cue is insufficient. Write it in the visitor\'s language (see lang). Tone: calm, precise, no exclamation marks, no emoji.',
    '- {"type":"speak","text":"<max 140 chars>"} — the agent says this aloud. Only if soundEnabled is true. Same tone; a touch of dry wit is welcome. English by default, or the visitor\'s language.',
    "",
    "Principles: visual before verbal; at most ONE verbal action (whisper OR speak) per response; never repeat an action type already in actionsAlreadyFired; if the visitor seems to be reading comfortably, do nothing.",
    "",
    `Behaviour summary: ${JSON.stringify(summary)}`,
    "",
    'Respond with ONLY a JSON object: {"reason":"<one short sentence>","actions":[...]}',
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ actions: [] }, { status: 429 });
  }

  let summary: unknown;
  try {
    summary = await req.json();
    if (JSON.stringify(summary).length > 4000) throw new Error("too large");
  } catch {
    return NextResponse.json({ actions: [] }, { status: 400 });
  }

  try {
    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL}/providers/${WIF_PROVIDER}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA_EMAIL}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    });
    if (!client) throw new Error("WIF client init failed");
    client.scopes = ["https://www.googleapis.com/auth/cloud-platform"];
    const { token } = await client.getAccessToken();

    const res = await fetch(
      `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(summary) }] }],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`vertex ${res.status}`);
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text);
    let actions = sanitizeActions(parsed.actions, 2);
    // Enforce: at most one verbal action per decision.
    let verbal = 0;
    actions = actions.filter((a) =>
      a.type === "whisper" || a.type === "speak" ? verbal++ === 0 : true
    );
    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : undefined;
    return NextResponse.json({ actions, reason });
  } catch (e) {
    // The agent degrades to silence, never to an error the visitor can see.
    console.error("director error:", e instanceof Error ? `${e.name}: ${e.message}` : e);
    return NextResponse.json({ actions: [] }, { status: 200 });
  }
}
