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
const btnMaster = document.getElementById("btn-estufa-master");
const popup = document.getElementById("popup-parametros");

// ======= FUNÇÕES COMUNS =======
function mostrarToast(mensagem, tipo = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return; // se não existir na página, evita erro

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

// ======= CONTROLE DA ESTUFA =======
if (switchAuto && btnMaster && popup) {
  const manualButtons = [
    document.getElementById("btn-luz"),
    document.getElementById("btn-fans"),
    document.getElementById("btn-regar"),
  ];

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

  if (modoAutomatico) {
    switchAuto.checked = true;
    aplicarModoAutomatico();
  }

  switchAuto.addEventListener("change", () => {
    if (switchAuto.checked) {
      popup.style.display = "flex";
    } else {
      modoAutomatico = false;
      localStorage.setItem("modoAutomatico", false);
      aplicarModoManual();
      mostrarToast("Modo Automático desativado", "alert");
    }
  });

  document.getElementById("cancel-popup").onclick = () => {
    popup.style.display = "none";
    switchAuto.checked = false;
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

    modoAutomatico = true;
    localStorage.setItem("modoAutomatico", true);
    aplicarModoAutomatico();
    popup.style.display = "none";
    mostrarToast("Modo Automático ativado 🌿", "success");
  };

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

  let estufaLigada = false;

  btnMaster.addEventListener("click", () => {
    estufaLigada = !estufaLigada;

    btnMaster.textContent = estufaLigada ? "Desligar Estufa" : "Ligar Estufa";
    btnMaster.classList.toggle("on", estufaLigada);
    btnMaster.classList.toggle("off", !estufaLigada);

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
}

function ligarEquipamento(id, nome) {
  const btn = document.getElementById(`btn-${id}`);
  const estado = document.getElementById(`state-${id}`);

  if (!btn || btn.classList.contains("on")) return;

  btn.classList.add("on");
  btn.classList.remove("off");
  btn.textContent = `Desligar ${nome}`;

  estado.textContent = "Ligada";
  estado.classList.add("on");
  estado.classList.remove("off");
}

function desligarEquipamento(id, nome) {
  const btn = document.getElementById(`btn-${id}`);
  const estado = document.getElementById(`state-${id}`);

  if (!btn || btn.classList.contains("off")) return;

  btn.classList.add("off");
  btn.classList.remove("on");
  btn.textContent = `Ligar ${nome}`;

  estado.textContent = "Desligada";
  estado.classList.remove("on");
  estado.classList.add("off");
}

// ======= STATUS (página status.html) =======
function updateUI(data) {
  const temp = document.getElementById("temp-value");
  const umAr = document.getElementById("umid-ar-value");
  const umSolo = document.getElementById("umid-solo-value");
  const lum = document.getElementById("lum-value");

  if (temp) temp.textContent = `${data.temperatura} °C`;
  if (umAr) umAr.textContent = `${data.umidadeAr} %`;
  if (umSolo) umSolo.textContent = `${data.umidadeSolo} %`;
  if (lum) lum.textContent = `${data.luminosidade} lx`;

  // decisão automática
  verificarModoAutomatico(data);
}

function verificarModoAutomatico(data) {
  if (!modoAutomatico) return;

  const { tempMax, umidSoloMin, lumMin } = parametrosAutomatico;

  // ===== Temperatura > aciona ventilação =====
  if (data.temperatura > tempMax + 1) {
    ligarEquipamento("fans", "Ventilação");
  } else if (data.temperatura < tempMax - 1) {
    desligarEquipamento("fans", "Ventilação");
  }

  // ===== Umidade do solo baixa = regar =====
  if (data.umidadeSolo < umidSoloMin - 2) {
    ligarEquipamento("regar", "Regadores");
  } else if (data.umidadeSolo > umidSoloMin + 2) {
    desligarEquipamento("regar", "Regadores");
  }

  // ===== Pouca luz = acende luz =====
  if (data.luminosidade < lumMin - 20) {
    ligarEquipamento("luz", "Iluminação");
  } else if (data.luminosidade > lumMin + 20) {
    desligarEquipamento("luz", "Iluminação");
  }
}

// ======= ATUALIZAÇÃO DINÂMICA =======
async function obterDados() {
  try {
    const resposta = await fetch("http://IP_DO_ESP32/status"); // <<< ALTERAR QUANDO SOUBER O IP
    if (!resposta.ok) throw new Error();
    const dados = await resposta.json();

    // Dados reais do ESP32:
    updateUI({
      temperatura: dados.temp,
      umidadeAr: dados.um_ar,
      umidadeSolo: dados.um_solo,
      luminosidade: dados.lux,
    });
  } catch {
    // Se o ESP32 não responder, usa simulação
    const fakeData = {
      temperatura: (20 + Math.random() * 6).toFixed(1),
      umidadeAr: (50 + Math.random() * 10).toFixed(0),
      umidadeSolo: (35 + Math.random() * 20).toFixed(0),
      luminosidade: (250 + Math.random() * 200).toFixed(0),
    };
    updateUI(fakeData);
  }
}

// Atualiza a cada 1.5s
if (document.getElementById("temp-value")) {
  setInterval(obterDados, 1500);
}

// ====== GRÁFICO GERAL (ÚNICO) ======
// ====== HISTÓRICO ======
const historico24h = Array.from({ length: 24 }, (_, i) => ({
  hora: `${i}:00`,
  temperatura: (20 + Math.random() * 6).toFixed(1),
  umSolo: (35 + Math.random() * 30).toFixed(0),
  lum: (200 + Math.random() * 400).toFixed(0),
}));

const historico30d = Array.from({ length: 30 }, (_, i) => ({
  hora: `Dia ${i + 1}`,
  temperatura: (20 + Math.random() * 6).toFixed(1),
  umSolo: (35 + Math.random() * 30).toFixed(0),
  lum: (200 + Math.random() * 400).toFixed(0),
}));

let chartGeral;

function renderizarGrafico(dados) {
  const ctx = document.getElementById("chartGeral").getContext("2d");
  if (chartGeral) chartGeral.destroy();

  chartGeral = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dados.map((d) => d.hora),
      datasets: [
        {
          label: "Temperatura (°C)",
          data: dados.map((d) => d.temperatura),
          borderWidth: 2,
          backgroundColor: "rgba(231, 76, 60, 0.35)",
          borderColor: "rgba(192, 57, 43, 1)",
          type: "line" // Mantém temperatura em linha (melhor leitura)
        },
        {
          label: "Umidade do Solo (%)",
          data: dados.map((d) => d.umSolo),
          backgroundColor: "rgba(46, 204, 113, 0.7)",
          borderColor: "rgba(39, 174, 96, 1)",
          borderWidth: 1,
        },
        {
          label: "Luminosidade (lx)",
          data: dados.map((d) => d.lum),
          backgroundColor: "rgba(52, 152, 219, 0.7)",
          borderColor: "rgba(41, 128, 185, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
    },
  });
}

// Renderiza o padrão (24h)
renderizarGrafico(historico24h);

// Seletor de período
document.getElementById("period-select").addEventListener("change", (e) => {
  if (e.target.value === "24h") renderizarGrafico(historico24h);
  if (e.target.value === "30d") renderizarGrafico(historico30d);
});


// Criação dos gráficos de barras
const chartTemp = new Chart(ctxTemp, {
  type: "bar",
  data: { labels: [], datasets: [{ label: "°C", data: [], borderWidth: 1 }] },
  options: { responsive: true },
});
const chartSolo = new Chart(ctxSolo, {
  type: "bar",
  data: {
    labels: [],
    datasets: [{ label: "% Solo", data: [], borderWidth: 1 }],
  },
  options: { responsive: true },
});
const chartLum = new Chart(ctxLum, {
  type: "bar",
  data: { labels: [], datasets: [{ label: "Lux", data: [], borderWidth: 1 }] },
  options: { responsive: true },
});

atualizarGraficos();

// Controle do seletor de período
document.getElementById("period-select").addEventListener("change", (e) => {
  if (e.target.value === "Últimas 24h") qtd = 24;
  if (e.target.value === "Último mês") qtd = 30;

  atualizarGraficos();
});
