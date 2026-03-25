import { ImageResponse } from "next/og";

interface OgImageData {
  title: string;
  description: string | null;
  userName: string;
  theme: {
    primaryColor: string | null;
    backgroundColor: string | null;
    textColor: string | null;
  } | null;
}

export async function generateOgImageBuffer(data: OgImageData): Promise<ArrayBuffer> {
  const { title, description, userName, theme } = data;
  const bgColor = theme?.backgroundColor ?? "#0f172a";
  const textColor = theme?.textColor ?? "#f8fafc";
  const primaryColor = theme?.primaryColor ?? "#14b8a6";

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
          padding: "60px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              border: `1px solid ${primaryColor}40`,
              backgroundColor: `${primaryColor}10`,
              fontSize: 14,
              color: primaryColor,
              fontWeight: 600,
            }}
          >
            Foliocraft
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.1,
              maxWidth: 800,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 22,
                color: `${textColor}99`,
                maxWidth: 600,
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
              fontSize: 18,
              color: `${textColor}70`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {userName}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60, ${primaryColor})`,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );

  return response.arrayBuffer();
}
