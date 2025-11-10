console.log("Script vinculado!");

// ======= VARIÁVEIS GLOBAIS =======
let modoAutomatico = localStorage.getItem("modoAutomatico") === "true";
let parametrosAutomatico = JSON.parse(
  localStorage.getItem("parametrosAutomatico")
) || {
  tempMax: 28,
  umidSoloMin: 40,
  lumMin: 300,
};

// ======= ELEMENTOS =======
const switchAuto = document.getElementById("auto-switch");
const manualButtons = [
  document.getElementById("btn-luz"),
  document.getElementById("btn-fans"),
  document.getElementById("btn-regar"),
];
const btnMaster = document.getElementById("btn-estufa-master");
const popup = document.getElementById("popup-parametros");

// ======= RESTAURAR ESTADO =======
if (modoAutomatico) {
  switchAuto.checked = true;
  aplicarModoAutomatico();
}

// ======= FUNÇÕES =======
function aplicarModoAutomatico() {
  btnMaster.style.display = "none";
  manualButtons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
}

function aplicarModoManual() {
  btnMaster.style.display = "block";
  manualButtons.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("disabled");
  });
}

function mostrarToast(mensagem, tipo = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast", tipo);
  toast.textContent = mensagem;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ======= EVENTO MODO AUTOMÁTICO =======
switchAuto.addEventListener("change", () => {
  if (switchAuto.checked) {
    // Ainda NÃO ativa o modo — apenas abre o popup
    popup.style.display = "flex";
  } else {
    modoAutomatico = false;
    localStorage.setItem("modoAutomatico", false);
    aplicarModoManual();
    mostrarToast("Modo Automático desativado", "alert");
  }
});

// ======= POPUP =======
document.getElementById("cancel-popup").onclick = () => {
  popup.style.display = "none";
  switchAuto.checked = false;
};

document.getElementById("save-popup").onclick = () => {
  parametrosAutomatico = {
    tempMax: parseFloat(document.getElementById("temp-limite").value),
    umidSoloMin: parseFloat(document.getElementById("umid-solo-limite").value),
    lumMin: parseFloat(document.getElementById("lum-limite").value),
  };

  localStorage.setItem(
    "parametrosAutomatico",
    JSON.stringify(parametrosAutomatico)
  );

  // Agora sim ativamos o modo automático
  modoAutomatico = true;
  localStorage.setItem("modoAutomatico", true);
  aplicarModoAutomatico();
  popup.style.display = "none";
  mostrarToast("Modo Automático ativado 🌿", "success");
};

// ======= BOTÕES INDIVIDUAIS =======
function configurarBotao(idBotao, nome, idEstadoTexto, textoOn, textoOff) {
  let ligado = false;
  const btn = document.getElementById(idBotao);
  const estadoElemento = document.getElementById(idEstadoTexto);

  btn.addEventListener("click", () => {
    ligado = btn.classList.contains("on") ? false : true;

    btn.textContent = ligado ? textoOn : textoOff;
    btn.classList.toggle("on", ligado);
    btn.classList.toggle("off", !ligado);

    estadoElemento.textContent = ligado ? "Ligada" : "Desligada";
    estadoElemento.classList.toggle("on", ligado);
    estadoElemento.classList.toggle("off", !ligado);

    mostrarToast(
      `${nome} ${ligado ? "ligada ✅" : "desligada ❌"}`,
      ligado ? "success" : "alert"
    );
  });
}

configurarBotao(
  "btn-luz",
  "Iluminação",
  "state-luz",
  "Desligar Iluminação",
  "Ligar Iluminação"
);
configurarBotao(
  "btn-fans",
  "Ventilação",
  "state-fans",
  "Desligar Ventilação",
  "Ligar Ventilação"
);
configurarBotao(
  "btn-regar",
  "Regadores",
  "state-regar",
  "Desligar Regadores",
  "Ligar Regadores"
);

// ======= BOTÃO MESTRE (CORRIGIDO SEM REPLACE) =======
let estufaLigada = false; // Estado real da estufa

btnMaster.addEventListener("click", () => {
  estufaLigada = !estufaLigada; // alterna o estado

  // Atualiza o botão mestre
  btnMaster.textContent = estufaLigada ? "Desligar Estufa" : "Ligar Estufa";
  btnMaster.classList.toggle("on", estufaLigada);
  btnMaster.classList.toggle("off", !estufaLigada);

  // Atualiza luz, ventilação e regadores
  [
    { id: "luz", nome: "Iluminação" },
    { id: "fans", nome: "Ventilação" },
    { id: "regar", nome: "Regadores" },
  ].forEach(({ id, nome }) => {
    const btn = document.getElementById(`btn-${id}`);
    const estado = document.getElementById(`state-${id}`);

    btn.classList.toggle("on", estufaLigada);
    btn.classList.toggle("off", !estufaLigada);

    btn.textContent = estufaLigada ? `Desligar ${nome}` : `Ligar ${nome}`;

    estado.textContent = estufaLigada ? "Ligada" : "Desligada";
    estado.classList.toggle("on", estufaLigada);
    estado.classList.toggle("off", !estufaLigada);
  });

  mostrarToast(estufaLigada ? "Estufa ligada ✅" : "Estufa desligada ❌");
});

// ======= ATUALIZAÇÃO DE STATUS =======
function updateUI(data) {
  const temp = document.getElementById("temp-value");
  const umAr = document.getElementById("umid-ar-value");
  const umSolo = document.getElementById("umid-solo-value");
  const lum = document.getElementById("lum-value");

  if (temp) temp.textContent = `${data.temperatura} °C`;
  if (umAr) umAr.textContent = `${data.umidadeAr} %`;
  if (umSolo) umSolo.textContent = `${data.umidadeSolo} %`;
  if (lum) lum.textContent = `${data.luminosidade} lx`;
}

// ======= SIMULAÇÃO TEMPORÁRIA =======
if (document.getElementById("temp-value")) {
  setInterval(() => {
    const fakeData = {
      temperatura: (20 + Math.random() * 6).toFixed(1),
      umidadeAr: (50 + Math.random() * 10).toFixed(0),
      umidadeSolo: (35 + Math.random() * 20).toFixed(0),
      luminosidade: (250 + Math.random() * 200).toFixed(0)
    };
    updateUI(fakeData);
  }, 1500);
}
