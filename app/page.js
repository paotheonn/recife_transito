'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// Cores do tema corporativo
const CORES = {
  primaria: '#3b82f6',
  secundaria: '#6366f1',
  sucesso: '#10b981',
  alerta: '#f59e0b',
  perigo: '#ef4444',
  texto: '#1e293b',
  textoClaro: '#64748b',
  fundo: '#f8fafc',
  card: '#ffffff',
  borda: '#e2e8f0'
}

const CORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Componente wrapper para usar searchParams
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Estado dos filtros e tab (da URL)
  const tabAtual = searchParams.get('tab') || 'visao'
  const mesFiltro = searchParams.get('mes') || '0'
  const diaFiltro = searchParams.get('dia') || '0'
  const equipFiltro = searchParams.get('equip') || '0'
  
  // Estado para detalhes do mapa de calor
  const [horaSelecionada, setHoraSelecionada] = useState(null)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  useEffect(() => {
    fetch('/dados.json')
      .then(res => res.json())
      .then(data => {
        setDados(data)
        setLoading(false)
      })
  }, [])

  // Função para atualizar URL
  const atualizarURL = (params) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      newParams.set(key, value)
    })
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  // Dados filtrados baseados nos filtros ativos
  const dadosFiltrados = useMemo(() => {
    if (!dados) return null
    const chave = `${mesFiltro}_${diaFiltro}_${equipFiltro}`
    return dados.agregacoes[chave] || dados.agregacoes['0_0_0']
  }, [dados, mesFiltro, diaFiltro, equipFiltro])

  // Dados para gráficos
  const dadosHora = useMemo(() => {
    if (!dadosFiltrados) return []
    return dadosFiltrados.porHora.map((total, hora) => ({
      hora: `${hora.toString().padStart(2, '0')}h`,
      total,
      horaNum: hora
    }))
  }, [dadosFiltrados])

  if (loading || !dados) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: CORES.fundo,
        color: CORES.texto
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `4px solid ${CORES.borda}`,
            borderTopColor: CORES.primaria,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Carregando dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'visao', label: 'Visão Geral' },
    { id: 'mes', label: 'Por Mês' },
    { id: 'dia', label: 'Por Dia da Semana' },
    { id: 'equipamento', label: 'Por Equipamento' },
    { id: 'locais', label: 'Locais Críticos' }
  ]

  // Calcular min/max para mapa de calor
  const maxHora = Math.max(...dadosFiltrados.porHora)
  const minHora = Math.min(...dadosFiltrados.porHora.filter(v => v > 0))

  const getCorCalor = (valor) => {
    if (valor === 0) return '#f1f5f9'
    const normalizado = (valor - minHora) / (maxHora - minHora || 1)
    if (normalizado < 0.33) {
      return `rgb(${Math.round(134 + 121 * normalizado * 3)}, ${Math.round(239 - 39 * normalizado * 3)}, ${Math.round(172 - 72 * normalizado * 3)})`
    } else if (normalizado < 0.66) {
      const n = (normalizado - 0.33) * 3
      return `rgb(${Math.round(255)}, ${Math.round(200 - 100 * n)}, ${Math.round(100 - 50 * n)})`
    } else {
      const n = (normalizado - 0.66) * 3
      return `rgb(${Math.round(255 - 16 * n)}, ${Math.round(100 - 32 * n)}, ${Math.round(50 + 22 * n)})`
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: CORES.fundo,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: CORES.card,
        borderBottom: `1px solid ${CORES.borda}`,
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div>
              <h1 style={{ 
                color: CORES.texto, 
                margin: 0, 
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                fontWeight: 700
              }}>
                Dashboard de Infrações de Trânsito
              </h1>
              <p style={{ 
                color: CORES.textoClaro, 
                margin: '5px 0 0 0',
                fontSize: 'clamp(0.8rem, 2vw, 1rem)'
              }}>
                Recife • {dados.meta.periodo}
              </p>
            </div>
            
            {/* Botão mobile para filtros */}
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              style={{
                display: 'none',
                padding: '10px 15px',
                background: CORES.primaria,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              className="btn-mobile-filtros"
            >
              Filtros
            </button>
          </div>

          {/* Barra de Filtros */}
          <div style={{
            display: 'flex',
            gap: '15px',
            marginTop: '20px',
            flexWrap: 'wrap'
          }} className={`filtros-container ${menuMobileAberto ? 'aberto' : ''}`}>
            {/* Filtro Mês */}
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                color: CORES.textoClaro, 
                fontSize: '0.75rem',
                marginBottom: '5px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Mês
              </label>
              <select
                value={mesFiltro}
                onChange={(e) => atualizarURL({ mes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${CORES.borda}`,
                  borderRadius: '8px',
                  background: CORES.card,
                  color: CORES.texto,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="0">Todos os meses</option>
                {dados.resumos.porMes.map(m => (
                  <option key={m.mes} value={m.mes}>{m.nome}</option>
                ))}
              </select>
            </div>

            {/* Filtro Dia da Semana */}
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                color: CORES.textoClaro, 
                fontSize: '0.75rem',
                marginBottom: '5px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Dia da Semana
              </label>
              <select
                value={diaFiltro}
                onChange={(e) => atualizarURL({ dia: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${CORES.borda}`,
                  borderRadius: '8px',
                  background: CORES.card,
                  color: CORES.texto,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="0">Todos os dias</option>
                {dados.resumos.porDiaSemana.map(d => (
                  <option key={d.dia} value={d.dia}>{d.nome}</option>
                ))}
              </select>
            </div>

            {/* Filtro Equipamento */}
            <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
              <label style={{ 
                display: 'block', 
                color: CORES.textoClaro, 
                fontSize: '0.75rem',
                marginBottom: '5px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Tipo de Fiscalização
              </label>
              <select
                value={equipFiltro}
                onChange={(e) => atualizarURL({ equip: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${CORES.borda}`,
                  borderRadius: '8px',
                  background: CORES.card,
                  color: CORES.texto,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="0">Todos os tipos</option>
                {dados.referencias.equipamentos.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Indicador de filtros ativos */}
            {(mesFiltro !== '0' || diaFiltro !== '0' || equipFiltro !== '0') && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end',
                paddingBottom: '5px'
              }}>
                <button
                  onClick={() => atualizarURL({ mes: '0', dia: '0', equip: '0' })}
                  style={{
                    padding: '10px 15px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  ✕ Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegação de Tabs */}
      <nav style={{
        background: CORES.card,
        borderBottom: `1px solid ${CORES.borda}`,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '0',
          minWidth: 'max-content'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => atualizarURL({ tab: tab.id })}
              style={{
                padding: '15px 20px',
                border: 'none',
                background: 'transparent',
                color: tabAtual === tab.id ? CORES.primaria : CORES.textoClaro,
                fontWeight: tabAtual === tab.id ? 600 : 400,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: tabAtual === tab.id ? `3px solid ${CORES.primaria}` : '3px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        
        {/* Tab: Visão Geral */}
        {tabAtual === 'visao' && (
          <div>
            {/* KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <KPICard
                titulo="Total de Infrações"
                valor={dadosFiltrados.total.toLocaleString('pt-BR')}
                cor={CORES.primaria}
              />
              <KPICard
                titulo="Média Diária"
                valor={Math.round(dadosFiltrados.total / 151).toLocaleString('pt-BR')}
                cor={CORES.sucesso}
              />
              <KPICard
                titulo="Hora de Pico"
                valor={`${dadosHora.reduce((max, h) => h.total > max.total ? h : max, dadosHora[0])?.hora || '--'}`}
                subtitulo={`${dadosHora.reduce((max, h) => h.total > max.total ? h : max, dadosHora[0])?.total.toLocaleString('pt-BR') || 0} infrações`}
                cor={CORES.alerta}
              />
              <KPICard
                titulo="Top Infração"
                valor={dadosFiltrados.topTipos[0]?.quantidade.toLocaleString('pt-BR') || '0'}
                subtitulo={dadosFiltrados.topTipos[0]?.descricao.substring(0, 40) + '...' || ''}
                cor={CORES.perigo}
              />
            </div>

            {/* Gráfico de Linha - Distribuição por Hora */}
            <div style={{
              background: CORES.card,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                Distribuição de Infrações por Hora do Dia
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosHora}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis dataKey="hora" stroke={CORES.textoClaro} fontSize={12} />
                  <YAxis stroke={CORES.textoClaro} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: CORES.card,
                      border: `1px solid ${CORES.borda}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={CORES.primaria}
                    strokeWidth={3}
                    dot={{ fill: CORES.primaria, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: CORES.primaria }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Mapa de Calor por Hora */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: CORES.card,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                  Mapa de Calor - 24 Horas
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '4px'
                }}>
                  {dadosHora.map((h, i) => {
                    const normalizado = (h.total - minHora) / (maxHora - minHora || 1)
                    const textoClaro = normalizado > 0.3
                    return (
                      <div
                        key={i}
                        onClick={() => setHoraSelecionada(horaSelecionada === i ? null : i)}
                        style={{
                          aspectRatio: '1',
                          background: getCorCalor(h.total),
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: horaSelecionada === i ? `3px solid ${CORES.primaria}` : '1px solid rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s',
                          transform: horaSelecionada === i ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: textoClaro ? '#fff' : CORES.texto, fontSize: 'clamp(0.7rem, 2vw, 1rem)', textShadow: textoClaro ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>
                          {h.hora}
                        </span>
                        <span style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', color: textoClaro ? 'rgba(255,255,255,0.9)' : CORES.textoClaro, textShadow: textoClaro ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>
                          {h.total.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {/* Legenda */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '15px'
                }}>
                  <span style={{ color: CORES.textoClaro, fontSize: '0.8rem' }}>Menos</span>
                  <div style={{
                    width: '120px',
                    height: '12px',
                    background: 'linear-gradient(to right, #86efac, #fcd34d, #ef4444)',
                    borderRadius: '4px'
                  }} />
                  <span style={{ color: CORES.textoClaro, fontSize: '0.8rem' }}>Mais</span>
                </div>
              </div>

              {/* Painel de Detalhes */}
              <div style={{
                background: CORES.card,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {horaSelecionada !== null ? (
                  <>
                    <h3 style={{ color: CORES.texto, margin: '0 0 10px 0' }}>
                      {dadosHora[horaSelecionada]?.hora} - {`${(horaSelecionada + 1).toString().padStart(2, '0')}h`}
                    </h3>
                    <p style={{ color: CORES.primaria, fontWeight: 600, margin: '0 0 20px 0' }}>
                      {dadosHora[horaSelecionada]?.total.toLocaleString('pt-BR')} infrações
                    </p>
                    <h4 style={{ color: CORES.textoClaro, fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                      Top Infrações neste horário:
                    </h4>
                    {dadosFiltrados.topTipos.slice(0, 8).map((tipo, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: CORES.fundo,
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '10px',
                          borderLeft: `4px solid ${CORES_GRAFICO[idx % CORES_GRAFICO.length]}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ color: CORES.texto, fontSize: '0.85rem', flex: 1 }}>
                            {tipo.descricao.length > 80 ? tipo.descricao.substring(0, 80) + '...' : tipo.descricao}
                          </span>
                          <span style={{
                            background: CORES.primaria,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            marginLeft: '10px'
                          }}>
                            {tipo.quantidade.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <span style={{ color: CORES.textoClaro, fontSize: '0.7rem' }}>{tipo.amparo}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: CORES.textoClaro,
                    textAlign: 'center',
                    padding: '40px'
                  }}>
                    <p style={{ margin: 0 }}>Clique em uma hora no mapa de calor para ver detalhes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Por Mês */}
        {tabAtual === 'mes' && (
          <div>
            <div style={{
              background: CORES.card,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                Infrações por Mês
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dados.resumos.porMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis dataKey="nome" stroke={CORES.textoClaro} />
                  <YAxis stroke={CORES.textoClaro} />
                  <Tooltip
                    contentStyle={{
                      background: CORES.card,
                      border: `1px solid ${CORES.borda}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                  />
                  <Bar dataKey="total" fill={CORES.primaria} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cards comparativos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {dados.resumos.porMes.map((mes, idx) => {
                const anterior = dados.resumos.porMes[idx - 1]?.total || mes.total
                const variacao = ((mes.total - anterior) / anterior * 100).toFixed(1)
                return (
                  <div
                    key={mes.mes}
                    style={{
                      background: CORES.card,
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      border: mesFiltro === String(mes.mes) ? `2px solid ${CORES.primaria}` : `1px solid ${CORES.borda}`
                    }}
                    onClick={() => atualizarURL({ mes: String(mes.mes) })}
                  >
                    <h4 style={{ color: CORES.textoClaro, margin: '0 0 10px 0', fontSize: '0.85rem' }}>
                      {mes.nome}
                    </h4>
                    <p style={{ color: CORES.texto, margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                      {mes.total.toLocaleString('pt-BR')}
                    </p>
                    {idx > 0 && (
                      <span style={{
                        color: variacao >= 0 ? CORES.perigo : CORES.sucesso,
                        fontSize: '0.8rem'
                      }}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao)}% vs mês anterior
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab: Por Dia da Semana */}
        {tabAtual === 'dia' && (
          <div>
            <div style={{
              background: CORES.card,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                Infrações por Dia da Semana
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dados.resumos.porDiaSemana} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis type="number" stroke={CORES.textoClaro} />
                  <YAxis dataKey="nome" type="category" stroke={CORES.textoClaro} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: CORES.card,
                      border: `1px solid ${CORES.borda}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                  />
                  <Bar dataKey="total" fill={CORES.secundaria} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap Hora x Dia */}
            <div style={{
              background: CORES.card,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto'
            }}>
              <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                Mapa de Calor: Hora × Dia da Semana
              </h3>
              <HeatmapHoraDia dados={dados} getCorCalor={getCorCalor} />
            </div>
          </div>
        )}

        {/* Tab: Por Equipamento */}
        {tabAtual === 'equipamento' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Gráfico de Pizza */}
              <div style={{
                background: CORES.card,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                  Proporção por Tipo de Fiscalização
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dados.resumos.porEquipamento}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({ nome, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {dados.resumos.porEquipamento.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={CORES_GRAFICO[idx % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Barras horizontais */}
              <div style={{
                background: CORES.card,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                  Total por Equipamento
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dados.resumos.porEquipamento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis type="number" stroke={CORES.textoClaro} />
                    <YAxis dataKey="nome" type="category" stroke={CORES.textoClaro} width={120} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: CORES.card,
                        border: `1px solid ${CORES.borda}`,
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                    />
                    <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                      {dados.resumos.porEquipamento.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={CORES_GRAFICO[idx % CORES_GRAFICO.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards de equipamentos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '15px'
            }}>
              {dados.resumos.porEquipamento.map((equip, idx) => (
                <div
                  key={equip.id}
                  style={{
                    background: CORES.card,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${CORES_GRAFICO[idx % CORES_GRAFICO.length]}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => atualizarURL({ equip: String(equip.id) })}
                >
                  <h4 style={{ color: CORES.texto, margin: '0 0 10px 0', fontSize: '1rem' }}>
                    {equip.nome}
                  </h4>
                  <p style={{ color: CORES.primaria, margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
                    {equip.total.toLocaleString('pt-BR')}
                  </p>
                  <span style={{ color: CORES.textoClaro, fontSize: '0.8rem' }}>
                    {((equip.total / dados.meta.totalGeral) * 100).toFixed(1)}% do total
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Locais Críticos */}
        {tabAtual === 'locais' && (
          <div>
            <div style={{
              background: CORES.card,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: CORES.texto, margin: '0 0 20px 0' }}>
                Top 20 Locais com Mais Infrações
              </h3>
              
              {/* Gráfico de barras horizontal */}
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={dadosFiltrados.topLocais.slice(0, 20)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis type="number" stroke={CORES.textoClaro} />
                  <YAxis
                    dataKey="local"
                    type="category"
                    stroke={CORES.textoClaro}
                    width={250}
                    fontSize={10}
                    tickFormatter={(value) => value.length > 40 ? value.substring(0, 40) + '...' : value}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CORES.card,
                      border: `1px solid ${CORES.borda}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value.toLocaleString('pt-BR'), 'Infrações']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="quantidade" fill={CORES.perigo} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Tabela detalhada */}
              <div style={{ marginTop: '30px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${CORES.borda}` }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: CORES.textoClaro, fontWeight: 600, fontSize: '0.85rem' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: CORES.textoClaro, fontWeight: 600, fontSize: '0.85rem' }}>Local</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: CORES.textoClaro, fontWeight: 600, fontSize: '0.85rem' }}>Infrações</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: CORES.textoClaro, fontWeight: 600, fontSize: '0.85rem' }}>% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltrados.topLocais.slice(0, 20).map((local, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${CORES.borda}` }}>
                        <td style={{ padding: '12px', color: CORES.texto, fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '12px', color: CORES.texto, fontSize: '0.9rem' }}>{local.local}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span style={{
                            background: CORES.perigo,
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {local.quantidade.toLocaleString('pt-BR')}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: CORES.textoClaro }}>
                          {((local.quantidade / dadosFiltrados.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: CORES.card,
        borderTop: `1px solid ${CORES.borda}`,
        padding: '20px',
        marginTop: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: CORES.textoClaro, margin: '0 0 8px 0', fontSize: '0.85rem' }}>
          Dados: Portal de Transparência de Recife • Infrações de Trânsito Jan-Mai 2025
        </p>
        <p style={{ color: CORES.textoClaro, margin: 0, fontSize: '0.85rem' }}>
          Desenvolvido por{' '}
          <a
            href="https://linkedin.com/in/gabrielgdmg"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: CORES.primaria, textDecoration: 'none', fontWeight: 500 }}
          >
            Gabriel Mesquita
          </a>
        </p>
      </footer>

      {/* Estilos responsivos */}
      <style>{`
        @media (max-width: 768px) {
          .btn-mobile-filtros {
            display: block !important;
          }
          .filtros-container {
            display: none !important;
          }
          .filtros-container.aberto {
            display: flex !important;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

// Componente KPI Card
function KPICard({ titulo, valor, subtitulo, cor }) {
  return (
    <div style={{
      background: CORES.card,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${cor}`
    }}>
      <div>
        <p style={{ color: CORES.textoClaro, margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 500 }}>
          {titulo}
        </p>
        <p style={{ color: CORES.texto, margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
          {valor}
        </p>
        {subtitulo && (
          <p style={{ color: CORES.textoClaro, margin: '5px 0 0 0', fontSize: '0.75rem' }}>
            {subtitulo}
          </p>
        )}
      </div>
    </div>
  )
}

// Componente Heatmap Hora x Dia
function HeatmapHoraDia({ dados, getCorCalor }) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  
  // Criar matriz de dados
  const matriz = diasSemana.map((dia, diaIdx) => {
    const chave = `0_${diaIdx + 1}_0`
    const dadosDia = dados.agregacoes[chave]
    return {
      dia,
      horas: dadosDia ? dadosDia.porHora : Array(24).fill(0)
    }
  })

  // Encontrar max para normalização
  const todosValores = matriz.flatMap(d => d.horas)
  const maxVal = Math.max(...todosValores)
  const minVal = Math.min(...todosValores.filter(v => v > 0))

  const getCorHeatmap = (valor) => {
    if (valor === 0) return '#f1f5f9'
    const normalizado = (valor - minVal) / (maxVal - minVal || 1)
    if (normalizado < 0.33) {
      return `rgb(${Math.round(134 + 121 * normalizado * 3)}, ${Math.round(239 - 39 * normalizado * 3)}, ${Math.round(172 - 72 * normalizado * 3)})`
    } else if (normalizado < 0.66) {
      const n = (normalizado - 0.33) * 3
      return `rgb(${Math.round(255)}, ${Math.round(200 - 100 * n)}, ${Math.round(100 - 50 * n)})`
    } else {
      const n = (normalizado - 0.66) * 3
      return `rgb(${Math.round(255 - 16 * n)}, ${Math.round(100 - 32 * n)}, ${Math.round(50 + 22 * n)})`
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '700px' }}>
        {/* Header com horas */}
        <div style={{ display: 'flex', marginLeft: '50px', marginBottom: '5px' }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.65rem',
                color: CORES.textoClaro
              }}
            >
              {i.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
        
        {/* Grid de células */}
        {matriz.map((linha, idxDia) => (
          <div key={idxDia} style={{ display: 'flex', marginBottom: '3px' }}>
            <div style={{
              width: '50px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: CORES.texto,
              fontWeight: 500
            }}>
              {linha.dia}
            </div>
            {linha.horas.map((valor, idxHora) => (
              <div
                key={idxHora}
                style={{
                  flex: 1,
                  aspectRatio: '1.5',
                  background: getCorHeatmap(valor),
                  borderRadius: '3px',
                  margin: '0 1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.55rem',
                  color: valor > (maxVal * 0.5) ? '#fff' : CORES.texto,
                  cursor: 'pointer'
                }}
                title={`${linha.dia} ${idxHora}h: ${valor.toLocaleString('pt-BR')} infrações`}
              >
                {valor > 1000 ? `${(valor / 1000).toFixed(0)}k` : ''}
              </div>
            ))}
          </div>
        ))}

        {/* Legenda */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '15px'
        }}>
          <span style={{ color: CORES.textoClaro, fontSize: '0.8rem' }}>Menos infrações</span>
          <div style={{
            width: '150px',
            height: '12px',
            background: 'linear-gradient(to right, #86efac, #fcd34d, #ef4444)',
            borderRadius: '4px'
          }} />
          <span style={{ color: CORES.textoClaro, fontSize: '0.8rem' }}>Mais infrações</span>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <p>Carregando...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
