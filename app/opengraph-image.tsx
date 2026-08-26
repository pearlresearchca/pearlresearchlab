import { ImageResponse } from 'next/og'

export const alt = 'PEARL | Public Health Equity Advocacy Research Lab'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0d4f4d 0%, #146b68 100%)',
          color: '#f8faf9',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#d9b84d',
            }}
          />
          <div style={{ display: 'flex', fontSize: 32, letterSpacing: 4, textTransform: 'uppercase' }}>
            PEARL
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 60, lineHeight: 1.2, maxWidth: 920 }}>
          Public Health Equity Advocacy Research Lab
        </div>
        <div style={{ display: 'flex', fontSize: 28, marginTop: 32, color: '#cbdad6', maxWidth: 820 }}>
          Evidence that moves communities forward.
        </div>
      </div>
    ),
    { ...size }
  )
}
