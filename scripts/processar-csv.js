const fs = require('fs');
const path = require('path');

// Configurações
const CSV_PATH = path.join(__dirname, '..', 'infracoestransparencia-janeiro-a-maio-2025.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'dados.json');

// Mapeamento de equipamentos
const EQUIPAMENTOS = {
  'Código 3 - LOMBADA ELETRÔNICA': { id: 3, nome: 'Lombada Eletrônica' },
  'Código 5 - FOTO SENSOR': { id: 5, nome: 'Foto Sensor' },
  'Código 8 - AUTOS NO TALÃO ELETRÔNICO': { id: 8, nome: 'Talão Eletrônico' },
  'Código 9 - FAIXA AZUL': { id: 9, nome: 'Faixa Azul' }
};

// Nomes dos meses e dias
const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Função para parsear CSV manualmente (evita dependência externa)
// O CSV usa ponto-e-vírgula como separador
function parseCSV(content) {
  // Normalizar quebras de linha dentro de campos com aspas
  // Substituir quebras de linha que estão dentro de aspas por espaço
  let normalizado = '';
  let dentroAspas = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      dentroAspas = !dentroAspas;
      normalizado += char;
    } else if ((char === '\n' || char === '\r') && dentroAspas) {
      normalizado += ' '; // Substituir quebra de linha por espaço
    } else {
      normalizado += char;
    }
  }
  
  const lines = normalizado.split('\n');
  const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
  const records = [];

  console.log('   Headers encontrados:', headers);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Verificar se a linha começa com uma data válida (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}/.test(line)) continue;

    // Parse com ponto-e-vírgula como separador
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ''));

    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      records.push(record);
    }
  }

  return records;
}

// Função para criar chave de agregação
function criarChave(mes, diaSemana, equipamento) {
  return `${mes}_${diaSemana}_${equipamento}`;
}

// Função principal de processamento
function processarDados() {
  console.log('📂 Lendo arquivo CSV...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  
  console.log('🔄 Parseando registros...');
  const registros = parseCSV(csvContent);
  console.log(`   Total de registros: ${registros.length.toLocaleString('pt-BR')}`);

  // Estrutura para agregações
  const agregacoes = {};
  const totaisPorMes = {};
  const totaisPorDia = {};
  const totaisPorEquipamento = {};
  const totaisPorHora = {};
  const tiposInfracao = {};
  const locaisInfracao = {};

  // Inicializar estruturas
  for (let mes = 0; mes <= 5; mes++) { // 0 = todos
    for (let dia = 0; dia <= 7; dia++) { // 0 = todos, 1-7 = dom-sab
      for (let equip = 0; equip <= 9; equip++) { // 0 = todos
        if (equip !== 0 && ![3, 5, 8, 9].includes(equip)) continue;
        const chave = criarChave(mes, dia, equip);
        agregacoes[chave] = {
          total: 0,
          porHora: Array(24).fill(0),
          tipos: {},
          locais: {}
        };
      }
    }
  }

  console.log('📊 Processando registros...');
  let processados = 0;

  registros.forEach(registro => {
    try {
      // Extrair dados do registro
      const dataStr = registro.datainfracao;
      const horaStr = registro.horainfracao;
      const equipamentoStr = registro.agenteequipamento;
      const descricao = registro.descricaoinfracao || '';
      const amparo = registro.amparolegal || '';
      const local = registro.localcometimento || '';

      if (!dataStr || !horaStr) return;

      // Parse da data
      const data = new Date(dataStr);
      const mes = data.getMonth() + 1; // 1-5 (Jan-Mai)
      const diaSemana = data.getDay() + 1; // 1-7 (Dom-Sab, ajustado)

      // Parse da hora
      const hora = parseInt(horaStr.split(':')[0], 10);

      // Identificar equipamento
      const equipInfo = EQUIPAMENTOS[equipamentoStr];
      const equipId = equipInfo ? equipInfo.id : 0;

      // Atualizar todas as combinações relevantes
      const combinacoes = [
        criarChave(0, 0, 0),           // Todos
        criarChave(mes, 0, 0),         // Só mês
        criarChave(0, diaSemana, 0),   // Só dia
        criarChave(0, 0, equipId),     // Só equipamento
        criarChave(mes, diaSemana, 0), // Mês + dia
        criarChave(mes, 0, equipId),   // Mês + equipamento
        criarChave(0, diaSemana, equipId), // Dia + equipamento
        criarChave(mes, diaSemana, equipId) // Todos os filtros
      ];

      combinacoes.forEach(chave => {
        if (agregacoes[chave]) {
          agregacoes[chave].total++;
          agregacoes[chave].porHora[hora]++;
          
          // Agregar tipos de infração
          if (descricao) {
            const tipoKey = `${descricao}|||${amparo}`;
            if (!agregacoes[chave].tipos[tipoKey]) {
              agregacoes[chave].tipos[tipoKey] = { descricao, amparo, quantidade: 0 };
            }
            agregacoes[chave].tipos[tipoKey].quantidade++;
          }

          // Agregar locais
          if (local) {
            if (!agregacoes[chave].locais[local]) {
              agregacoes[chave].locais[local] = 0;
            }
            agregacoes[chave].locais[local]++;
          }
        }
      });

      // Totais gerais
      totaisPorMes[mes] = (totaisPorMes[mes] || 0) + 1;
      totaisPorDia[diaSemana] = (totaisPorDia[diaSemana] || 0) + 1;
      if (equipId) totaisPorEquipamento[equipId] = (totaisPorEquipamento[equipId] || 0) + 1;
      totaisPorHora[hora] = (totaisPorHora[hora] || 0) + 1;

      processados++;
      if (processados % 50000 === 0) {
        console.log(`   Processados: ${processados.toLocaleString('pt-BR')}`);
      }
    } catch (e) {
      // Ignorar registros com erro
    }
  });

  console.log(`✅ Total processados: ${processados.toLocaleString('pt-BR')}`);

  // Transformar agregações para formato final
  console.log('🔧 Formatando dados...');
  
  Object.keys(agregacoes).forEach(chave => {
    const agg = agregacoes[chave];
    
    // Converter tipos para array ordenado (top 50)
    agg.topTipos = Object.values(agg.tipos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 50);
    delete agg.tipos;

    // Converter locais para array ordenado (top 30)
    agg.topLocais = Object.entries(agg.locais)
      .map(([local, quantidade]) => ({ local, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 30);
    delete agg.locais;
  });

  // Calcular estatísticas gerais
  const totalGeral = agregacoes['0_0_0'].total;
  const diasNoPeriodo = 151; // Jan-Mai 2025
  const mediaDiaria = Math.round(totalGeral / diasNoPeriodo);
  
  // Hora com mais infrações
  const horasSorted = Object.entries(totaisPorHora)
    .sort((a, b) => b[1] - a[1]);
  const horaPico = horasSorted.length > 0 ? horasSorted[0] : ['0', 0];

  // Montar estrutura final
  const dadosFinais = {
    meta: {
      periodo: 'Janeiro a Maio 2025',
      totalGeral,
      mediaDiaria,
      diasNoPeriodo,
      horaPico: { hora: parseInt(horaPico[0]), total: horaPico[1] },
      geradoEm: new Date().toISOString()
    },
    referencias: {
      meses: MESES,
      diasSemana: ['', ...DIAS_SEMANA], // Index 1-7
      equipamentos: Object.values(EQUIPAMENTOS)
    },
    resumos: {
      porMes: Object.entries(totaisPorMes)
        .map(([mes, total]) => ({ mes: parseInt(mes), nome: MESES[parseInt(mes)], total }))
        .sort((a, b) => a.mes - b.mes),
      porDiaSemana: Object.entries(totaisPorDia)
        .map(([dia, total]) => ({ dia: parseInt(dia), nome: DIAS_SEMANA[parseInt(dia) - 1], total }))
        .sort((a, b) => a.dia - b.dia),
      porEquipamento: Object.entries(totaisPorEquipamento)
        .map(([id, total]) => {
          const equip = Object.values(EQUIPAMENTOS).find(e => e.id === parseInt(id));
          return { id: parseInt(id), nome: equip?.nome || 'Outro', total };
        })
        .sort((a, b) => b.total - a.total),
      porHora: Object.entries(totaisPorHora)
        .map(([hora, total]) => ({ hora: parseInt(hora), total }))
        .sort((a, b) => a.hora - b.hora)
    },
    agregacoes
  };

  // Salvar arquivo
  console.log('💾 Salvando dados.json...');
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dadosFinais, null, 2), 'utf-8');
  
  const fileSize = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Arquivo salvo: ${OUTPUT_PATH}`);
  console.log(`📦 Tamanho: ${fileSize} MB`);
  console.log('🎉 Processamento concluído!');
}

// Executar
processarDados();
