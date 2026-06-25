import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Khit — Minimal Shirts, Made in Myanmar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background:
          'linear-gradient(135deg, oklch(0.508 0.118 165.612) 0%, oklch(0.696 0.17 162.48) 100%)',
        padding: '80px',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, marginBottom: 24 }}>Khit</div>
      <div style={{ fontSize: 36, fontWeight: 500, opacity: 0.95, maxWidth: 900 }}>
        Minimal Shirts, Made in Myanmar
      </div>
      <div style={{ fontSize: 24, opacity: 0.85, marginTop: 48 }}>
        Free in-store pickup · Cash on delivery · Nationwide shipping
      </div>
    </div>,
    { ...size }
  );
}
