import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          background: "linear-gradient(135deg, #8B5CF6, #6E56CF)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 2L18 20H14.5L13 16H9L7.5 20H4L11 2Z"
            fill="white"
          />
          <rect x="9.5" y="12" width="3" height="1.5" rx="0.3" fill="#8B5CF6" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
