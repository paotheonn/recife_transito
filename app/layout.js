export const metadata = {
  title: 'Mapa de Calor - Infrações de Trânsito Recife',
  description: 'Análise de infrações de trânsito por hora em Recife (Jan-Mai 2025)',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
