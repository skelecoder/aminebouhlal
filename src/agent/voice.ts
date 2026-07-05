// The agent's mouth. Short phrases via /api/voice (Gemini TTS, CDN-cached).
// Hard rules: never before a user gesture (browser autoplay policy and basic
// manners agree), never overlapping, max 3 phrases per session.

let playing = false;
let spoken = 0;
const MAX_PER_SESSION = 3;

export function canSpeak(): boolean {
  return spoken < MAX_PER_SESSION && !playing;
}

export async function speak(text: string, onDone?: () => void): Promise<boolean> {
  if (!canSpeak()) return false;
  playing = true;
  spoken += 1;
  try {
    const t = btoa(String.fromCharCode(...new TextEncoder().encode(text)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const audio = new Audio(`/api/voice?t=${t}`);
    audio.volume = 0.85;
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      window.setTimeout(resolve, 30_000); // belt and braces
    });
    return true;
  } catch {
    return false;
  } finally {
    playing = false;
    onDone?.();
  }
}
