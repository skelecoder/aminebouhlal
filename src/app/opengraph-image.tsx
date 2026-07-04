import { ImageResponse } from "next/og";

export const alt = "Amine Bouhlal — Solutions Architect · Agentic AI & Digital Transformation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0e14",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,155,176,0.18) 1px, transparent 0)",
          backgroundSize: "36px 36px",
          padding: "72px 80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              border: "2px solid #22d3ee",
              color: "#22d3ee",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            AB
          </div>
          <div style={{ color: "#8b9bb0", fontSize: 22, letterSpacing: 4 }}>
            AMINEBOUHLAL.COM
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#dce5f0", fontSize: 74, fontWeight: 700, lineHeight: 1.1 }}>
            Amine Bouhlal
          </div>
          <div style={{ display: "flex", color: "#22d3ee", fontSize: 34, marginTop: 18 }}>
            I turn business problems into systems that ship.
          </div>
        </div>
        <div style={{ display: "flex", color: "#8b9bb0", fontSize: 22, letterSpacing: 2 }}>
          SOLUTIONS ARCHITECT · AGENTIC AI · CLOUD · 180K+ CALLS/MO IN PRODUCTION
        </div>
      </div>
    ),
    { ...size }
  );
}
