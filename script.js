/* ===== Passaporte Digital — Museu Vivo da Saúde Mental =====
   Os dados ficam no celular do visitante (localStorage).
   Configurações (estações, senhas, textos) ficam em config.js. */

const CHAVE = "passaporte-museu-vivo-v1";
const CHAVE_FILA = "passaporte-museu-vivo-fila";
const app = document.getElementById("app");

let estado = carregar();
let aba = "passaporte";
let acabouDeCarimbar = null;
let confirmandoReset = false;

/* ---------- armazenamento ---------- */
function vazio() {
  return { nome: "", numero: "", emitido: "", carimbos: {}, resposta: "" };
}

function carregar() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE));
    if (s && typeof s === "object") return Object.assign(vazio(), s);
  } catch (e) { /* armazenamento indisponível */ }
  return vazio();
}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { }
}

/* ---------- envio opcional para a planilha (fila para internet instável) ---------- */
function apiAtiva() {
  return typeof API_URL === "string" && API_URL.startsWith("http");
}

function lerFila() {
  try { return JSON.parse(localStorage.getItem(CHAVE_FILA)) || []; } catch (e) { return []; }
}

function gravarFila(f) {
  try { localStorage.setItem(CHAVE_FILA, JSON.stringify(f)); } catch (e) { }
}

function registrar(estacao, tipo) {
  if (!apiAtiva()) return;
  const f = lerFila();
  f.push({ passaporte: estado.numero, nome: estado.nome, estacao: estacao, tipo: tipo, data_hora: new Date().toISOString() });
  gravarFila(f);
  enviar();
}

let enviando = false;
async function enviar() {
  if (enviando || !apiAtiva()) return;
  const f = lerFila();
  if (!f.length) return;
  enviando = true;
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ registros: f })
    });
    gravarFila(lerFila().slice(f.length));
  } catch (e) { /* sem internet: tenta de novo depois */ }
  enviando = false;
  atualizarAvisoEnvio();
}

function atualizarAvisoEnvio() {
  const el = document.getElementById("sync");
  if (!el) return;
  const n = lerFila().length;
  el.textContent = n ? n + (n > 1 ? " registros aguardando" : " registro aguardando") + " internet para enviar" : "";
}

window.addEventListener("online", enviar);
setInterval(enviar, 20000);

/* ---------- utilidades ---------- */
function normalizar(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toUpperCase();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function totalCarimbos() {
  return ESTACOES.filter(function (e) { return estado.carimbos[e.n]; }).length;
}

function completo() {
  return totalCarimbos() === ESTACOES.length;
}

function hora(iso) {
  try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
}

function data(iso) {
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch (e) { return ""; }
}

function faixaCores() {
  return '<div class="spectrum" aria-hidden="true">' +
    ESTACOES.map(function (e) { return '<span style="background:' + e.hex + '"></span>'; }).join("") +
    "</div>";
}

/* ---------- telas ---------- */
function render() {
  if (!estado.nome) { telaBoasVindas(); return; }

  app.innerHTML =
    faixaCores() +
    '<div class="top"><div class="eyebrow">' + esc(MUSEU) + '</div><h1>Passaporte</h1></div>' +
    '<div class="tabs" role="tablist">' +
    '<button class="tab" role="tab" aria-selected="' + (aba === "passaporte") + '" data-aba="passaporte">Passaporte</button>' +
    '<button class="tab" role="tab" aria-selected="' + (aba === "certificado") + '" data-aba="certificado">' +
    (completo() ? "" : '<span aria-hidden="true">🔒</span>') + 'Certificado</button>' +
    '</div>' +
    '<div class="panel" role="tabpanel">' + (aba === "passaporte" ? htmlPassaporte() : htmlCertificado()) + '</div>';

  ligarEventos();
  acabouDeCarimbar = null;
  atualizarAvisoEnvio();
}

function ligarEventos() {
  app.querySelectorAll("[data-aba]").forEach(function (b) {
    b.onclick = function () { aba = b.dataset.aba; confirmandoReset = false; render(); window.scrollTo(0, 0); };
  });
  app.querySelectorAll("[data-estacao]").forEach(function (b) {
    b.onclick = function () { abrirEstacao(+b.dataset.estacao); };
  });

  const reset = document.getElementById("reset");
  if (reset) reset.onclick = function () { confirmandoReset = true; render(); };
  const resetNao = document.getElementById("reset-nao");
  if (resetNao) resetNao.onclick = function () { confirmandoReset = false; render(); };
  const resetSim = document.getElementById("reset-sim");
  if (resetSim) resetSim.onclick = function () {
    try { localStorage.removeItem(CHAVE); } catch (e) { }
    estado = vazio(); aba = "passaporte"; confirmandoReset = false; render();
  };

  const resposta = document.getElementById("resposta");
  if (resposta) {
    let t;
    resposta.oninput = function () {
      estado.resposta = resposta.value; salvar();
      const aviso = document.getElementById("salvo");
      aviso.textContent = "Guardado no seu passaporte.";
      clearTimeout(t);
      t = setTimeout(function () { aviso.textContent = ""; }, 1800);
    };
  }

  const pdf = document.getElementById("pdf");
  if (pdf) pdf.onclick = gerarPDF;
}

function telaBoasVindas() {
  app.innerHTML =
    faixaCores() +
    '<form class="welcome" id="form-nome">' +
    '<div class="eyebrow">' + esc(MUSEU) + '</div>' +
    '<h1>Seu passaporte para seis décadas de cuidado</h1>' +
    '<p>Passe pelas ' + ESTACOES.length + ' estações. Em cada uma, o grupo vai dizer uma senha. Digite a senha aqui para carimbar seu passaporte.</p>' +
    '<div class="field"><label for="nome">Seu nome</label>' +
    '<input type="text" id="nome" autocomplete="name" maxlength="40" placeholder="Como quer aparecer no certificado"></div>' +
    '<button class="btn" type="submit" id="abrir" disabled>Abrir passaporte</button>' +
    '</form>';

  const campo = document.getElementById("nome");
  const botao = document.getElementById("abrir");
  campo.oninput = function () { botao.disabled = !campo.value.trim(); };
  document.getElementById("form-nome").onsubmit = function (ev) {
    ev.preventDefault();
    const nome = campo.value.trim();
    if (!nome) return;
    estado.nome = nome;
    estado.emitido = new Date().toISOString();
    estado.numero = "MV" + String(Math.floor(Math.random() * 900000) + 100000);
    salvar();
    registrar("", "entrada");
    render();
  };
}

function htmlPassaporte() {
  const t = totalCarimbos();
  const pct = Math.round(t / ESTACOES.length * 100);
  const nomeMrz = normalizar(estado.nome).replace(/[^A-Z]/g, "").slice(0, 22);
  const linha1 = ("P<MUSEUVIVO<<" + nomeMrz + "<".repeat(44)).slice(0, 44);
  const linha2 = (estado.numero + "<<SAUDEMENTAL" + "<".repeat(44)).slice(0, 44);

  return '' +
    '<section class="idpage" aria-label="Identificação">' +
    '<div class="idgrid">' +
    '<div><div class="k">Visitante</div><div class="v">' + esc(estado.nome) + '</div></div>' +
    '<div><div class="k">Nº do passaporte</div><div class="v mono">' + esc(estado.numero) + '</div></div>' +
    '<div><div class="k">Emitido em</div><div class="v">' + data(estado.emitido) + '</div></div>' +
    '<div><div class="k">Destino</div><div class="v">Saúde mental, 1900 → hoje</div></div>' +
    '</div>' +
    '<div class="progress">' +
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + ESTACOES.length + '" aria-valuenow="' + t + '"><i style="width:' + pct + '%"></i></div>' +
    '<small>' + t + ' de ' + ESTACOES.length + ' carimbos' + (completo() ? " · passaporte completo" : "") + '</small>' +
    '</div>' +
    '<div class="mrz" aria-hidden="true">' + esc(linha1) + '<br>' + esc(linha2) + '</div>' +
    '</section>' +
    '<section class="grid" aria-label="Estações">' + ESTACOES.map(htmlEstacao).join("") + '</section>' +
    (completo() ? '<button class="btn" data-aba="certificado">Ver meu certificado</button>' : "") +
    '<div class="sync" id="sync" aria-live="polite"></div>' +
    '<div class="reset">' +
    (confirmandoReset
      ? '<span>Apagar todos os carimbos deste celular?</span><div class="confirm">' +
        '<button class="btn small danger" id="reset-sim">Apagar</button>' +
        '<button class="btn small ghost" id="reset-nao">Cancelar</button></div>'
      : '<button class="linkbtn" id="reset">Recomeçar passaporte</button>') +
    '</div>';
}

function htmlEstacao(e) {
  const c = estado.carimbos[e.n];
  return '<button class="slot' + (c ? " done" : "") + (acabouDeCarimbar === e.n ? " just" : "") + '" data-estacao="' + e.n + '"' +
    ' aria-label="Estação ' + e.n + ', ' + esc(e.titulo) + (c ? ", carimbada" : ", bloqueada") + '">' +
    '<div class="band" style="background:' + e.hex + ';color:' + e.texto + '"><span>Estação ' + e.n + '</span><span>' + e.cor + '</span></div>' +
    '<div class="body"><h3>' + esc(e.titulo) + '</h3><div class="dec">' + e.decada + '</div>' +
    '<div class="state">' + (c ? "Carimbado às " + hora(c) : "🔒 Toque para carimbar") + '</div></div>' +
    (c ? '<div class="stamp" style="color:' + e.hex + '" aria-hidden="true"><div><b>' + e.n + '</b>VISTO<br>' + data(c).slice(0, 5) + '</div></div>' : "") +
    '</button>';
}

function htmlCertificado() {
  if (!completo()) {
    const falta = ESTACOES.length - totalCarimbos();
    return '<div class="locked"><strong>Certificado bloqueado</strong>' +
      '<span>Falta' + (falta > 1 ? "m " : " ") + falta + ' carimbo' + (falta > 1 ? "s" : "") + ' para liberar seu certificado.</span></div>';
  }
  return '<section class="cert">' +
    '<div class="eyebrow">' + esc(MUSEU) + '</div>' +
    '<h2>Parabéns! Você concluiu a visita.</h2>' +
    '<div class="name">' + esc(estado.nome) + '</div>' +
    '<p>percorreu as ' + ESTACOES.length + ' estações do museu, dos manicômios do início do século XX até a era hiperconectada.</p>' +
    '<div class="minis" aria-hidden="true">' +
    ESTACOES.map(function (e) { return '<span style="background:' + e.hex + ';color:' + e.texto + '">' + e.n + '</span>'; }).join("") +
    '</div>' +
    '<button class="btn" id="pdf">Baixar certificado em PDF</button>' +
    '<p class="phrase">“' + esc(FRASE_FINAL) + '”</p>' +
    '<div class="reflect"><label for="resposta">Como você cuida da sua saúde mental hoje?</label>' +
    '<textarea id="resposta" maxlength="300" placeholder="Escreva aqui, só para você.">' + esc(estado.resposta) + '</textarea>' +
    '<div class="saved" id="salvo" aria-live="polite"></div></div>' +
    '<small class="num">Nº ' + esc(estado.numero) + '</small>' +
    '</section>';
}

/* ---------- janela de cada estação ---------- */
function abrirEstacao(n) {
  const e = ESTACOES.find(function (x) { return x.n === n; });
  const fundo = document.createElement("div");
  fundo.className = "overlay";
  fundo.innerHTML =
    '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="titulo-estacao">' +
    '<div class="head" style="background:' + e.hex + ';color:' + e.texto + '"><span>Estação ' + n + ' · ' + e.cor + '</span>' +
    '<button class="x" aria-label="Fechar">✕</button></div>' +
    '<div class="content" id="conteudo"></div></div>';
  document.body.appendChild(fundo);

  const conteudo = fundo.querySelector("#conteudo");
  function fechar() {
    document.removeEventListener("keydown", aoTeclar);
    fundo.remove();
    render();
  }
  function aoTeclar(ev) { if (ev.key === "Escape") fechar(); }
  document.addEventListener("keydown", aoTeclar);
  fundo.querySelector(".x").onclick = fechar;
  fundo.addEventListener("click", function (ev) { if (ev.target === fundo) fechar(); });

  const cabecalho = '<div class="dec">' + e.decada + '</div><h2 id="titulo-estacao">' + esc(e.titulo) + '</h2><p class="about">' + esc(e.sobre) + '</p>';

  function mostrarCarimbada() {
    conteudo.innerHTML = cabecalho +
      '<p class="quote" style="border-color:' + e.hex + '">' + esc(e.reflexao) + '</p>' +
      '<p class="okmsg">✓ Carimbado às ' + hora(estado.carimbos[n]) + '</p>' +
      '<button class="btn" id="voltar">Voltar ao passaporte</button>';
    conteudo.querySelector("#voltar").onclick = fechar;
  }

  if (estado.carimbos[n]) { mostrarCarimbada(); return; }

  conteudo.innerHTML = cabecalho +
    '<form id="form-senha" class="field"><label for="senha">Senha da estação</label>' +
    '<div class="row"><input type="text" id="senha" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Digite a senha">' +
    '<button class="btn" type="submit" style="background:' + e.hex + ';color:' + e.texto + '">Carimbar</button></div>' +
    '<p class="err" id="erro" aria-live="polite"></p></form>';

  const campo = conteudo.querySelector("#senha");
  setTimeout(function () { campo.focus(); }, 50);

  conteudo.querySelector("#form-senha").onsubmit = function (ev) {
    ev.preventDefault();
    if (normalizar(campo.value) === normalizar(e.senha)) {
      estado.carimbos[n] = new Date().toISOString();
      salvar();
      acabouDeCarimbar = n;
      registrar(n, "carimbo");
      if (completo()) {
        registrar("", "concluiu");
        document.removeEventListener("keydown", aoTeclar);
        fundo.remove();
        aba = "certificado";
        render();
        window.scrollTo(0, 0);
        return;
      }
      mostrarCarimbada();
    } else {
      conteudo.querySelector("#erro").textContent = "Senha incorreta. Confira com o grupo da estação.";
      campo.classList.remove("shake");
      void campo.offsetWidth;
      campo.classList.add("shake");
      campo.select();
    }
  };
}

/* ---------- certificado em PDF (biblioteca jsPDF) ---------- */
function textoPdf(s) {
  return String(s).replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/→/g, "->");
}

function rgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
}

function gerarPDF() {
  if (!window.jspdf) {
    document.getElementById("salvo").textContent = "Não foi possível gerar o PDF. Verifique a internet e tente de novo.";
    return;
  }
  const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210, cx = W / 2;

  // faixas coloridas no topo e na base
  const fw = W / ESTACOES.length;
  ESTACOES.forEach(function (e, i) {
    doc.setFillColor.apply(doc, rgb(e.hex));
    doc.rect(i * fw, 0, fw + 0.2, 7, "F");
    doc.rect(i * fw, H - 7, fw + 0.2, 7, "F");
  });

  doc.setTextColor(95, 101, 119); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(textoPdf(MUSEU).toUpperCase(), cx, 26, { align: "center", charSpace: 1 });

  doc.setTextColor(28, 32, 48); doc.setFontSize(28);
  doc.text("CERTIFICADO DE PARTICIPAÇÃO", cx, 42, { align: "center" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(95, 101, 119);
  doc.text("Certificamos que", cx, 58, { align: "center" });

  doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.setTextColor(28, 32, 48);
  doc.text(textoPdf(estado.nome), cx, 74, { align: "center" });
  doc.setDrawColor(28, 32, 48); doc.setLineWidth(0.5); doc.line(cx - 80, 78, cx + 80, 78);

  doc.setFont("helvetica", "normal"); doc.setFontSize(13);
  const corpo = doc.splitTextToSize("percorreu as " + ESTACOES.length + " estações do " + textoPdf(MUSEU) +
    ", conhecendo a história do cuidado em saúde mental desde os manicômios do início do século XX até a era hiperconectada.", 200);
  doc.text(corpo, cx, 90, { align: "center" });

  // as estações
  const gap = 44, x0 = cx - gap * (ESTACOES.length - 1) / 2, cy = 122;
  ESTACOES.forEach(function (e, i) {
    const x = x0 + i * gap;
    doc.setFillColor.apply(doc, rgb(e.hex)); doc.circle(x, cy, 8, "F");
    doc.setTextColor.apply(doc, rgb(e.texto)); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(String(e.n), x, cy + 1.6, { align: "center" });
    doc.setTextColor(28, 32, 48); doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(textoPdf(e.titulo), 40), x, cy + 14, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(95, 101, 119); doc.setFontSize(8);
    doc.text(textoPdf(e.decada), x, cy + 24, { align: "center" });
  });

  doc.setFont("helvetica", "italic"); doc.setFontSize(12); doc.setTextColor(28, 32, 48);
  doc.text(doc.splitTextToSize('"' + textoPdf(FRASE_FINAL) + '"', 210), cx, 166, { align: "center" });

  const ultimo = ESTACOES.map(function (e) { return estado.carimbos[e.n]; }).sort().pop();
  doc.setFont("courier", "normal"); doc.setFontSize(9); doc.setTextColor(95, 101, 119);
  doc.text("Passaporte nº " + estado.numero + "   -   Concluído em " + data(ultimo), cx, 192, { align: "center" });

  const arquivo = "certificado-museu-vivo-" + normalizar(estado.nome).replace(/[^A-Z0-9]/g, "").toLowerCase().slice(0, 30) + ".pdf";
  doc.save(arquivo);
}

/* ---------- início ---------- */
render();
enviar();
