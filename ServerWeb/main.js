console.log("Script vinculado!");

// ======= VARIÁVEIS GLOBAIS DO MODO AUTOMÁTICO =======
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

// ======= RESTAURAR ESTADO AO CARREGAR =======
if (modoAutomatico) {
  switchAuto.checked = true;

  btnMaster.style.display = "none"; // Apenas o botão mestre some

  manualButtons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
}

// ======= EVENTO SWITCH AUTOMÁTICO =======
switchAuto.addEventListener("change", () => {
  modoAutomatico = switchAuto.checked;

  // Salva estado do modo (persistência)
  localStorage.setItem("modoAutomatico", modoAutomatico);

  if (modoAutomatico) {
    btnMaster.style.display = "none";

    manualButtons.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add("disabled");
    });

    mostrarToast("Modo Automático ativado 🌿", "success");
    abrirPopupParametros(true); // <-- TRUE para indicar abertura manual
  } else {
    btnMaster.style.display = "block";

    manualButtons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove("disabled");
    });

    mostrarToast("Modo Automático desativado", "alert");
  }
});

// ======= TOASTS =======
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

// ======= BOTÕES INDIVIDUAIS =======
function configurarBotao(idBotao, nome, idEstadoTexto, textoOn, textoOff) {
  let ligado = false;
  const btn = document.getElementById(idBotao);
  const estadoElemento = document.getElementById(idEstadoTexto);

  btn.addEventListener("click", () => {
    ligado = !ligado;

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

// ======= BOTÃO MESTRE =======
btnMaster.addEventListener("click", () => {
  const ligarTudo = btnMaster.classList.contains("off");

  btnMaster.textContent = ligarTudo ? "Desligar Estufa" : "Ligar Estufa";
  btnMaster.classList.toggle("off", !ligarTudo);
  btnMaster.classList.toggle("on", ligarTudo);

  ["luz", "fans", "regar"].forEach((item) => {
    const btn = document.getElementById(`btn-${item}`);
    const estado = document.getElementById(`state-${item}`);

    btn.classList.toggle("on", ligarTudo);
    btn.classList.toggle("off", !ligarTudo);

    btn.textContent = ligarTudo
      ? btn.textContent.replace("Ligar", "Desligar")
      : btn.textContent.replace("Desligar", "Ligar");

    estado.textContent = ligarTudo ? "Ligada" : "Desligada";
    estado.classList.toggle("on", ligarTudo);
    estado.classList.toggle("off", !ligarTudo);
  });

  mostrarToast(ligarTudo ? "Estufa ligada ✅" : "Estufa desligada ❌");
});

// ======= POP-UP PARÂMETROS =======
function abrirPopupParametros(aberturaManual = false) {
  let popup = document.getElementById("popup-parametros");
  if (!popup) return;

  // Só mostra popup se o usuário ativou manualmente
  if (aberturaManual) popup.style.display = "flex";

  document.getElementById("cancel-popup").onclick = () => {
    popup.style.display = "none";
    switchAuto.checked = false;
    switchAuto.dispatchEvent(new Event("change"));
  };

  document.getElementById("save-popup").onclick = () => {
    parametrosAutomatico = {
      tempMax: parseFloat(document.getElementById("temp-limite").value),
      umidSoloMin: parseFloat(
        document.getElementById("umid-solo-limite").value
      ),
      lumMin: parseFloat(document.getElementById("lum-limite").value),
    };

    localStorage.setItem(
      "parametrosAutomatico",
      JSON.stringify(parametrosAutomatico)
    );
    popup.style.display = "none";
    mostrarToast("Parâmetros salvos ✅", "success");
  };
}

// ======= GRÁFICOS =======
const labels = ["00h", "04h", "08h", "12h", "16h", "20h", "24h"];
const tempData = [22, 24, 25, 28, 27, 23, 21];
const soloData = [40, 38, 42, 47, 50, 45, 41];
const lumData = [200, 600, 900, 1200, 1000, 400, 150];

function criarGrafico(id, label, data) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{ label, data, borderWidth: 2, tension: 0.4, pointRadius: 3 }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

if (document.getElementById("chartTemp")) {
  criarGrafico("chartTemp", "Temperatura (°C)", tempData);
  criarGrafico("chartSolo", "Umidade do Solo (%)", soloData);
  criarGrafico("chartLum", "Luminosidade (lx)", lumData);
}
