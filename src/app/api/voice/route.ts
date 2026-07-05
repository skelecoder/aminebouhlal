// The agent's voice: Gemini native TTS on Amine's GCP project, keyless via
// Vercel OIDC → Workload Identity Federation. Returns WAV; responses are
// CDN-cached by URL, so a repeated phrase costs tokens exactly once.

import { NextRequest, NextResponse } from "next/server";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";

const GCP_PROJECT = "ai-pod-factory";
const GCP_PROJECT_NUMBER = "807370847082";
const SA_EMAIL = `ambient-director@${GCP_PROJECT}.iam.gserviceaccount.com`;
const TTS_MODEL = "gemini-2.5-flash-tts";
const VOICE = "Charon";

const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 6;
}

// 16-bit PCM mono 24kHz → WAV container.
function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) return new NextResponse(null, { status: 429 });

  let text: string;
  try {
    text = Buffer.from(req.nextUrl.searchParams.get("t") ?? "", "base64url").toString("utf8");
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!text || text.length > 160) return new NextResponse(null, { status: 400 });

  try {
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

    const res = await fetch(
      `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/global/publishers/google/models/${TTS_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const data = await res.json();
    const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) throw new Error("no audio");
    const wav = pcmToWav(Buffer.from(b64, "base64"));
    return new NextResponse(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, s-maxage=31536000, max-age=86400, immutable",
      },
    });
  } catch (e) {
    console.error("voice error:", e instanceof Error ? e.message : e);
    return new NextResponse(null, { status: 503 });
  }
}
