# Dashboard de Infrações de Trânsito - Recife

Dashboard interativa para visualização e análise de dados de infrações de trânsito na cidade do Recife, no período de Janeiro a Maio de 2025.

## Visão Geral

Este projeto processa e visualiza mais de 171 mil registros de infrações de trânsito, permitindo análises por:

- **Horário do dia** (0h às 23h)
- **Mês** (Janeiro a Maio)
- **Dia da semana** (Domingo a Sábado)
- **Tipo de fiscalização** (Lombada Eletrônica, Foto Sensor, Talão Eletrônico, Faixa Azul)

## Funcionalidades

### Filtros Cruzados
Combine filtros de mês, dia da semana e tipo de equipamento para análises específicas. Os filtros são persistidos na URL, permitindo compartilhar links com configurações específicas.

### 5 Abas de Visualização

1. **Visão Geral** - KPIs principais, gráfico de linha com distribuição por hora e mapa de calor interativo
2. **Por Mês** - Comparativo mensal com variação percentual
3. **Por Dia da Semana** - Análise semanal com heatmap Hora × Dia
4. **Por Equipamento** - Proporção por tipo de fiscalização (gráfico de pizza e barras)
5. **Locais Críticos** - Top 20 locais com mais infrações

### Responsividade
Layout totalmente responsivo, adaptado para desktop, tablet e mobile.

## Tecnologias

- **Next.js 16** - Framework React
- **React 19** - Biblioteca de UI
- **Recharts** - Gráficos interativos
- **CSS-in-JS** - Estilização inline

## Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Processar dados do CSV (se necessário)
node scripts/processar-csv.js

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
├── app/
│   ├── layout.js       # Layout principal
│   └── page.js         # Dashboard principal
├── public/
│   └── dados.json      # Dados processados
├── scripts/
│   └── processar-csv.js # Script de processamento do CSV
├── infracoestransparencia-janeiro-a-maio-2025.csv  # Dados brutos
└── package.json
```

## Fonte dos Dados

Portal de Transparência de Recife - Infrações de Trânsito (Janeiro a Maio de 2025)

## Autor

**Gabriel Mesquita**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/gabrielgdmg)

## Licença

Este projeto é de uso livre para fins educacionais e de análise de dados públicos.
