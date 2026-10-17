/* Painel da Tela Flip: lê o resumo em JSON da planilha a cada 10 segundos */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("spec").innerHTML = ESTACOES.map(e=>`<span style="background:${e.hex}"></span>`).join("");
$("museu").textContent = MUSEU;
$("frase").textContent = "“" + FRASE_FINAL + "”";
$("bars").innerHTML = ESTACOES.map(e=>`
  <div class="b"><div class="name"><strong>${e.n}. ${esc(e.titulo)}</strong><small>${e.cor} · ${e.decada}</small></div>
  <div class="track"><i id="bar-${e.n}" style="width:0;background:${e.hex}"></i></div>
  <div class="v" id="val-${e.n}">0</div></div>`).join("");

async function atualizar(){
  if(!API_URL || !API_URL.startsWith("http")){ $("status").textContent="Configure a API_URL no config.js"; $("status").className="status err"; return; }
  try{
    const r = await fetch(API_URL + "?t=" + Date.now());
    const d = await r.json();
    const vals = ESTACOES.map(e=>d.porEstacao?.[e.n]||0);
    const max = Math.max(1, d.visitantes||0, ...vals);
    ESTACOES.forEach((e,i)=>{ $("bar-"+e.n).style.width = (vals[i]/max*100)+"%"; $("val-"+e.n).textContent = vals[i]; });
    $("k-vis").textContent = d.visitantes||0;
    $("k-carimbos").textContent = vals.reduce((a,b)=>a+b,0);
    $("k-conc").textContent = d.concluiram||0;
    const ult = d.ultimos||[];
    $("feed").innerHTML = ult.length ? ult.map(u=>{
      const e = ESTACOES.find(x=>x.n==u.estacao) || {hex:"#999",texto:"#fff",n:"?"};
      const h = new Date(u.data_hora).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
      return `<li><span class="dot" style="background:${e.hex};color:${e.texto}">${e.n}</span><span class="who">${esc(u.nome||"Visitante")}</span><time>${h}</time></li>`;
    }).join("") : `<li class="empty">Nenhum carimbo ainda.</li>`;
    $("status").textContent = "Atualizado às " + new Date().toLocaleTimeString("pt-BR");
    $("status").className = "status";
  }catch(err){
    $("status").textContent = "Sem conexão com a planilha. Tentando de novo…";
    $("status").className = "status err";
  }
}
atualizar();
setInterval(atualizar, 10000);
