/* ============================================================
   CONFIGURAÇÃO DO PASSAPORTE — edite só este arquivo
   ============================================================ */

/* Opcional: URL do Google Apps Script (termina em /exec) para contar visitantes.
   Se deixar como está, o passaporte funciona normalmente, só não conta as visitas. */
const API_URL = "COLE_AQUI_A_URL_DO_APPS_SCRIPT";

const MUSEU = "Museu Vivo da Saúde Mental";
const FRASE_FINAL = "Se o passado nos ensina como adoecemos, o presente nos desafia a aprender como cuidar.";

/* Senhas: maiúsculas, minúsculas e acentos não fazem diferença */
const ESTACOES = [
  { n: 1, cor: "Amarelo",  hex: "#E9B512", texto: "#3D2E00", titulo: "Os Manicômios",          decada: "1900–1940", senha: "HOSPICIO",
    sobre: "O modelo asilar: isolar a pessoa e esconder a “loucura” da sociedade.",
    reflexao: "Hoje isso seria aceitável?" },
  { n: 2, cor: "Azul",     hex: "#2F6FDB", texto: "#FFFFFF", titulo: "Choques e Silêncios",    decada: "1950–1960", senha: "SILENCIO",
    sobre: "Eletrochoque, lobotomia e os primeiros tranquilizantes, muito receitados a mulheres.",
    reflexao: "Tecnologia sem ética pode realmente curar?" },
  { n: 3, cor: "Vermelho", hex: "#D94040", texto: "#FFFFFF", titulo: "O Grito por Liberdade",  decada: "1970–1980", senha: "LIBERDADE",
    sobre: "O Movimento Antimanicomial e o lema “Por uma sociedade sem manicômios”.",
    reflexao: "O cuidado começa quando enxergamos a pessoa." },
  { n: 4, cor: "Laranja",  hex: "#EE8326", texto: "#2A1D12", titulo: "A Reforma",              decada: "1990–2001", senha: "REFORMA",
    sobre: "A Lei nº 10.216/2001 redireciona o cuidado para o tratamento em liberdade.",
    reflexao: "Hospital → CAPS · Isolamento → Comunidade · Paciente → Cidadão" },
  { n: 5, cor: "Roxo",     hex: "#8A4FD1", texto: "#FFFFFF", titulo: "Os CAPS",                decada: "2000–2010", senha: "OFICINA",
    sobre: "Cuidado no território: arte, esporte e convivência como parte do tratamento.",
    reflexao: "Que atividade faz bem para a sua mente?" },
  { n: 6, cor: "Verde",    hex: "#2EA56B", texto: "#FFFFFF", titulo: "A Era Hiperconectada",   decada: "2020s",     senha: "CONEXAO",
    sobre: "Redes sociais, ansiedade, burnout e saúde mental no trabalho depois da pandemia.",
    reflexao: FRASE_FINAL }
];
