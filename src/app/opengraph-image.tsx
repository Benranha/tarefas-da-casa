import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Tarefinha — app de tarefas domésticas para crianças com pontos e recompensas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/logo/tarefinha-horizontal-escuro.svg'))
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#c0430e',
          color: '#fff8ef',
        }}
      >
        <img src={logoSrc} width={473} height={70} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1 }}>
            Arrumou a cama? Ganhou ponto.
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, maxWidth: 960 }}>
            Tarefas de casa viram jogo: as crianças marcam, os pais aprovam e os pontos viram recompensas.
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              background: '#ffc93c',
              color: '#3a2a22',
              fontSize: 30,
              fontWeight: 700,
              padding: '14px 30px',
              borderRadius: 999,
            }}
          >
            30 dias grátis · tarefinha.app.br
          </div>
        </div>
      </div>
    ),
    size,
  )
}
