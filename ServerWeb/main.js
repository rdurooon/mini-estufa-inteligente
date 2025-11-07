console.log("Script vinculado!");

const switchAuto = document.getElementById("auto-switch");
const manualButtons = [
  document.getElementById("btn-luz"),
  document.getElementById("btn-fans"),
  document.getElementById("btn-regar")
];

switchAuto.addEventListener("change", () => {
  const automatico = switchAuto.checked;

  manualButtons.forEach(btn => {
    btn.disabled = automatico;
    btn.classList.toggle("disabled", automatico);
  });

  if (automatico) {
    mostrarToast("Modo Automático ativado 🌿", "success");
    abrirPopupParametros(); // iremos criar já já
  } else {
    mostrarToast("Modo Automático desativado", "alert");
  }
});

/* ========== SISTEMA DE TOASTS ========== */
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

/* ========== CONTROLE DOS BOTÕES ========== */
function configurarBotao(idBotao, nome, idEstadoTexto, textoOn, textoOff) {
  let ligado = false;
  const btn = document.getElementById(idBotao);
  const estadoElemento = document.getElementById(idEstadoTexto);

  btn.addEventListener("click", () => {
    ligado = !ligado;

    if (ligado) {
      btn.textContent = textoOn;
      btn.classList.replace("off", "on");

      estadoElemento.textContent = "Ligada";
      estadoElemento.classList.replace("off", "on");

      mostrarToast(`${nome} ligada ✅`, "success");
    } else {
      btn.textContent = textoOff;
      btn.classList.replace("on", "off");

      estadoElemento.textContent = "Desligada";
      estadoElemento.classList.replace("on", "off");

      mostrarToast(`${nome} desligada ❌`, "alert");
    }
  });
}

/* Aplicando ajustes individuais */
configurarBotao("btn-luz", "Iluminação", "state-luz", "Desligar Iluminação", "Ligar Iluminação");
configurarBotao("btn-fans", "Ventilação", "state-fans", "Desligar Ventilação", "Ligar Ventilação");
configurarBotao("btn-regar", "Regadores", "state-regar", "Desligar Regadores", "Ligar Regadores");


/* ========== GRÁFICOS (DADOS TEMPORÁRIOS) ========== */

// Labels simuladas de horas
const labels = ["00h","04h","08h","12h","16h","20h","24h"];

// Dados fictícios por enquanto
const tempData = [22,24,25,28,27,23,21];
const soloData = [40,38,42,47,50,45,41];
const lumData = [200,600,900,1200,1000,400,150];

// Função genérica para criar gráfico
function criarGrafico(id, label, data) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Criar gráficos se estiver na página de relatórios
if (document.getElementById("chartTemp")) {
  criarGrafico("chartTemp", "Temperatura (°C)", tempData);
  criarGrafico("chartSolo", "Umidade do Solo (%)", soloData);
  criarGrafico("chartLum", "Luminosidade (lx)", lumData);
}
