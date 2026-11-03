import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** App icon — avoids missing /favicon.ico route crashes on some hosts */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0284c7 0%, #0ea5e9 100%)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          borderRadius: 8,
        }}
      >
        FS
      </div>
    ),
    { ...size },
  );
}
