import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0b0d10",
          color: "#f5f6f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 40,
            color: "#c9863f",
          }}
        >
          Ballast
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 56, fontWeight: 600 }}>
          Deployments that stay boring
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "#94a0ac" }}>
          A real build runner. Deploy history. Metrics and alerting.
        </div>
      </div>
    ),
    { ...size }
  );
}
