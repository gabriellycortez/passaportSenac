/**
 * Museu Vivo da Saúde Mental — registro do Passaporte Digital
 * Cole este código em: Planilha Google > Extensões > Apps Script
 * Depois: Implantar > Nova implantação > App da Web
 *   Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 */

const ABA = "Registros";
const TOTAL_ESTACOES = 6;

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(["data_hora", "passaporte", "nome", "estacao", "tipo"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Recebe o JSON enviado pelo passaporte: {passaporte, nome, estacao, tipo} */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    const registros = Array.isArray(d.registros) ? d.registros : [d];
    const sh = aba_();
    registros.forEach(r => {
      if (!r.passaporte) return;
      sh.appendRow([
        r.data_hora ? new Date(r.data_hora) : new Date(),
        String(r.passaporte).slice(0, 20),
        String(r.nome || "").slice(0, 40),
        Number(r.estacao) || "",
        String(r.tipo || "carimbo").slice(0, 20)
      ]);
    });
    return json_({ ok: true, recebidos: registros.length });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Devolve o resumo em JSON para o painel da Tela Flip */
function doGet() {
  const linhas = aba_().getDataRange().getValues().slice(1);
  const porEstacao = {};
  for (let i = 1; i <= TOTAL_ESTACOES; i++) porEstacao[i] = new Set();
  const visitantes = new Set();
  const concluiram = new Set();
  const ultimos = [];

  linhas.forEach(([dataHora, passaporte, nome, estacao, tipo]) => {
    if (!passaporte) return;
    visitantes.add(passaporte);
    if (tipo === "concluiu") concluiram.add(passaporte);
    if (tipo === "carimbo" && porEstacao[estacao]) {
      porEstacao[estacao].add(passaporte);
      ultimos.push({ data_hora: dataHora, nome: nome, estacao: estacao });
    }
  });

  const resumo = { atualizado_em: new Date(), visitantes: visitantes.size, concluiram: concluiram.size, porEstacao: {}, ultimos: ultimos.slice(-8).reverse() };
  Object.keys(porEstacao).forEach(k => resumo.porEstacao[k] = porEstacao[k].size);
  return json_(resumo);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
