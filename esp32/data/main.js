// main.js — Versão combinada e pronta para uso
console.log("Script vinculado! (Versão Combinada)");


/* ============================================================
   1. VARIÁVEIS GLOBAIS E CONFIGURAÇÃO
   ------------------------------------------------------------
   Integração das configurações e constantes do Código 1 e 2.
============================================================ */

let modoAutomatico = localStorage.getItem("modoAutomatico") === "true";

let parametrosAutomatico = JSON.parse(
  localStorage.getItem("parametrosAutomatico")
) || {
  tempMax: 28,
  umidSoloMin: 40,
  lumMin: 300,
};

// Endereço IP do ESP32 (ajuste conforme sua rede / modo AP)
const ESP32_IP = "192.168.4.1";

// Limite usado pela interface para exibir "Sem luz" / "Com luz"
const limitLuxUI = 250;

let estadosBotoes = {
  luz: false,
  fans: false,
  regar: false,
  master: false,
};

const ATUADORES = {
  luz: { id: "luz", nome: "Iluminação" },
  fans: { id: "fans", nome: "Ventilação" },
  regar: { id: "regar", nome: "Regadores" },
};


/* ============================================================
   2. TOAST / FEEDBACK
============================================================ */

function mostrarToast(msg, tipo = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", tipo);
  toast.textContent = msg;
  container.appendChild(toast);

  const duracao = window.innerWidth <= 600 ? 3000 : 2500;

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}


/* ============================================================
   3. LOADING OVERLAY
============================================================ */

function mostrarCarregamento() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  document.body.style.pointerEvents = "none";
}

function esconderCarregamento() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.style.display = "none";
  document.body.style.pointerEvents = "auto";
}


/* ============================================================
   4. MODO AUTOMÁTICO (popup, salvar parâmetros, aplicar/retirar)
============================================================ */

function aplicarAutomaticoDOM() {
  const btnMaster = document.getElementById("btn-estufa-master");
  const manualButtons = [
    document.getElementById("btn-luz"),
    document.getElementById("btn-fans"),
    document.getElementById("btn-regar"),
  ];
  if (btnMaster) btnMaster.style.display = "none";
  manualButtons.forEach((b) => {
    if (b) {
      b.disabled = true;
      b.classList.add("disabled");
    }
  });
}

function aplicarManualDOM() {
  const btnMaster = document.getElementById("btn-estufa-master");
  const manualButtons = [
    document.getElementById("btn-luz"),
    document.getElementById("btn-fans"),
    document.getElementById("btn-regar"),
  ];
  if (btnMaster) btnMaster.style.display = "block";
  manualButtons.forEach((b) => {
    if (b) {
      b.disabled = false;
      b.classList.remove("disabled");
    }
  });
}

function desativarModoAutomaticoSeguro() {
  // Desativa modo automático por segurança quando houver falha de comunicação
  modoAutomatico = false;
  localStorage.setItem("modoAutomatico", "false");

  const switchAuto = document.getElementById("auto-switch");
  const popup = document.getElementById("popup-parametros");
  if (switchAuto) switchAuto.checked = false;
  if (popup) popup.style.display = "none";

  aplicarManualDOM();

  mostrarToast(
    "Falha ao obter dados do ESP32 — modo automático desativado por segurança.",
    "alert"
  );
}

function inicializarModoAutomatico() {
  const switchAuto = document.getElementById("auto-switch");
  const popup = document.getElementById("popup-parametros");
  const btnMaster = document.getElementById("btn-estufa-master");

  if (!switchAuto || !popup || !btnMaster) return;

  // Se o modo estava salvo como automático, aplica visualmente
  if (modoAutomatico) {
    switchAuto.checked = true;
    aplicarAutomaticoDOM();
  }

  // Ao alternar o switch
  switchAuto.addEventListener("change", () => {
    if (switchAuto.checked) {
      // Preenche os inputs com os setpoints atuais
      const tempInput = document.getElementById("temp-limite");
      const soloInput = document.getElementById("umid-solo-limite");
      const lumInput = document.getElementById("lum-limite");
      if (tempInput) tempInput.value = parametrosAutomatico.tempMax;
      if (soloInput) soloInput.value = parametrosAutomatico.umidSoloMin;
      if (lumInput) lumInput.value = parametrosAutomatico.lumMin;

      popup.style.display = "flex";
    } else {
      // usuário desativou o switch: envia modo manual ao ESP e aplica DOM
      enviarModo("manual");
      modoAutomatico = false;
      localStorage.setItem("modoAutomatico", "false");
      aplicarManualDOM();
      mostrarToast("Modo Automático desativado", "alert");
    }
  });

  // Fechar popup ao clicar fora
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
      switchAuto.checked = false;
    }
  });

  const cancelBtn = document.getElementById("cancel-popup");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      popup.style.display = "none";
      switchAuto.checked = false;
    };
  }

  const saveBtn = document.getElementById("save-popup");
  if (saveBtn) {
    saveBtn.onclick = () => {
      // Lê valores (com fallback)
      const tempVal = parseFloat(
        document.getElementById("temp-limite")?.value ?? parametrosAutomatico.tempMax
      );
      const soloVal = parseFloat(
        document.getElementById("umid-solo-limite")?.value ?? parametrosAutomatico.umidSoloMin
      );
      const lumVal = parseFloat(
        document.getElementById("lum-limite")?.value ?? parametrosAutomatico.lumMin
      );

      // Atualiza setpoints locais e persiste
      parametrosAutomatico = {
        tempMax: Number.isFinite(tempVal) ? tempVal : parametrosAutomatico.tempMax,
        umidSoloMin: Number.isFinite(soloVal) ? soloVal : parametrosAutomatico.umidSoloMin,
        lumMin: Number.isFinite(lumVal) ? lumVal : parametrosAutomatico.lumMin,
      };

      localStorage.setItem("parametrosAutomatico", JSON.stringify(parametrosAutomatico));
      modoAutomatico = true;
      localStorage.setItem("modoAutomatico", "true");

      // Envia modo auto com parâmetros ao ESP32
      enviarModo("auto", parametrosAutomatico);

      aplicarAutomaticoDOM();
      popup.style.display = "none";

      mostrarToast("Modo Automático ativado 🌿", "success");
    };
  }
}


/* ============================================================
   5. BOTÕES (index.html) — controle manual e master
============================================================ */

function configurarBotao(id, nome, idEstado, txtOn, txtOff) {
  const chave = id.split("-")[1];
  const btn = document.getElementById(id);
  const estado = document.getElementById(idEstado);

  if (!btn || !estado) return;

  btn.addEventListener("click", () => {
    if (modoAutomatico) {
      mostrarToast(`Desative o Modo Automático para controle manual de ${nome}.`, "alert");
      return;
    }

    mostrarCarregamento();
    setTimeout(() => {
      estadosBotoes[chave] = !estadosBotoes[chave];
      const ligado = estadosBotoes[chave];

      // Envia comando real para o ESP e atualiza UI
      enviarComando(chave, ligado);
      atualizarAtuadorUI(chave, ligado ? 1 : 0);

      if (!estadosBotoes.luz && !estadosBotoes.fans && !estadosBotoes.regar) {
        estadosBotoes.master = false;

        const btnMaster = document.getElementById("btn-estufa-master");
        if (btnMaster) {
          btnMaster.textContent = "Ligar Estufa";
          btnMaster.classList.remove("on");
          btnMaster.classList.add("off");
        }
      }

      mostrarToast(`${nome} ${ligado ? "ligada" : "desligada"}.`);
      esconderCarregamento();
    }, 1200);
  });
}

function inicializarBotoesIndividuais() {
  if (!document.getElementById("btn-luz")) return;

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
}

function inicializarBotaoMaster() {
  const btnMaster = document.getElementById("btn-estufa-master");
  if (!btnMaster) return;

  btnMaster.addEventListener("click", () => {
    if (modoAutomatico) {
      mostrarToast("Desative o Modo Automático para controle manual mestre.", "alert");
      return;
    }

    mostrarCarregamento();
    setTimeout(() => {
      estadosBotoes.master = !estadosBotoes.master;
      const ligado = estadosBotoes.master;

      ["luz", "fans", "regar"].forEach((chave) => {
        estadosBotoes[chave] = ligado;
        enviarComando(chave, ligado);
        atualizarAtuadorUI(chave, ligado ? 1 : 0);
      });

      btnMaster.textContent = ligado ? "Desligar Estufa" : "Ligar Estufa";
      btnMaster.classList.toggle("on", ligado);
      btnMaster.classList.toggle("off", !ligado);

      mostrarToast(ligado ? "Estufa ligada 🌿" : "Estufa desligada ❌");
      esconderCarregamento();
    }, 1200);
  });
}


/* ============================================================
   6. MODAL DE AJUDA
============================================================ */

function inicializarModalAjuda() {
  const helpBtn = document.getElementById("btn-help");
  const helpModal = document.getElementById("help-modal");
  const helpContent = document.querySelector(".help-modal-content");
  const closeHelp = document.getElementById("close-help");

  if (!helpBtn || !helpModal || !helpContent || !closeHelp) return;

  helpBtn.addEventListener("click", () => {
    helpModal.style.display = "flex";
  });

  closeHelp.addEventListener("click", () => {
    helpModal.style.display = "none";
  });

  helpModal.addEventListener("click", (e) => {
    if (!helpContent.contains(e.target)) {
      helpModal.style.display = "none";
    }
  });
}


/* ============================================================
   7. ATUALIZAÇÃO DE SENSORES, VERIFICAÇÃO AUTOMÁTICA E COMUNICAÇÃO
============================================================ */

function atualizarUIComDados(data) {
  const tempEl = document.getElementById("temp-value");
  const umArEl = document.getElementById("umid-ar-value");
  const umSoloEl = document.getElementById("umid-solo-value");
  const lumEl = document.getElementById("lum-value");

  if (tempEl) tempEl.textContent = `${data.temperatura} °C`;
  if (umArEl) umArEl.textContent = `${data.umidadeAr} %`;
  if (umSoloEl) umSoloEl.textContent = `${data.umidadeSolo} %`;
  if (lumEl)
    lumEl.textContent = data.luminosidade < limitLuxUI ? "Sem luz" : "Com luz";
}

function limparUIFalhaESP() {
  const tempEl = document.getElementById("temp-value");
  const umArEl = document.getElementById("umid-ar-value");
  const umSoloEl = document.getElementById("umid-solo-value");
  const lumEl = document.getElementById("lum-value");

  if (tempEl) tempEl.textContent = "--";
  if (umArEl) umArEl.textContent = "--";
  if (umSoloEl) umSoloEl.textContent = "--";
  if (lumEl) lumEl.textContent = "--";
}

function verificarModoAutomatico(data) {
  if (!modoAutomatico) return;

  const { tempMax, umidSoloMin, lumMin } = parametrosAutomatico;

  // Temperatura -> fans
  if (data.temperatura > tempMax + 1) {
    ligarEquipamento("fans", "Ventilação");
    mostrarToast(
      `Ventilação ativada — temperatura acima do limite (${tempMax}°C).`,
      "success"
    );
  } else if (data.temperatura < tempMax - 1) {
    desligarEquipamento("fans", "Ventilação");
    mostrarToast(
      `Ventilação desativada — temperatura dentro do intervalo.`,
      "success"
    );
  }

  // Umidade do solo -> regar
  if (data.umidadeSolo < umidSoloMin - 2) {
    ligarEquipamento("regar", "Regadores");
    mostrarToast(
      `Irrigação ativada — umidade do solo abaixo do mínimo (${umidSoloMin}%).`,
      "success"
    );
  } else if (data.umidadeSolo > umidSoloMin + 2) {
    desligarEquipamento("regar", "Regadores");
    mostrarToast(`Irrigação desativada — umidade do solo adequada.`, "success");
  }

  // Luminosidade -> luz
  if (data.luminosidade < lumMin - 20) {
    ligarEquipamento("luz", "Iluminação");
    mostrarToast(
      `Iluminação acionada — luminosidade abaixo do limite configurado (${lumMin} lx).`,
      "success"
    );
  } else if (data.luminosidade > lumMin + 20) {
    desligarEquipamento("luz", "Iluminação");
    mostrarToast(`Iluminação desligada — luminosidade suficiente.`, "success");
  }
}

function ligarEquipamento(id, nome) {
  // Atualiza lógica local e envia comando real
  estadosBotoes[id] = true;
  enviarComando(id, true);
  atualizarAtuadorUI(id, 1);
}

function desligarEquipamento(id, nome) {
  estadosBotoes[id] = false;
  enviarComando(id, false);
  atualizarAtuadorUI(id, 0);
}

/* ----------  Comunicação com o ESP32  ---------- */

async function enviarComando(atuador, estado) {
  if (!atuador || typeof estado !== "boolean") return;

  const url = `http://${ESP32_IP}/command?atuador=${atuador}&estado=${estado ? 1 : 0}`;
  try {
    const resposta = await fetch(url);
    const texto = await resposta.text();
    if (resposta.ok) {
      mostrarToast(`Comando ${atuador} enviado: ${texto}`, "success");
    } else {
      mostrarToast(`Erro ao enviar comando: ${texto}`, "alert");
    }
  } catch (error) {
    mostrarToast(`Falha na comunicação com ESP32.`, "alert");
    console.error("Erro no fetch do comando:", error);
  }
}

async function enviarModo(modo, params = null) {
  let url = `http://${ESP32_IP}/command?modo=${modo}`;

  if (modo === "auto" && params) {
    url += `&temp=${params.tempMax}&solo=${params.umidSoloMin}&lux=${params.lumMin}`;
  }

  try {
    const resposta = await fetch(url);
    const texto = await resposta.text();
    if (resposta.ok) {
      mostrarToast(texto, "success");
      if (modo === "auto") {
        aplicarAutomaticoDOM();
        modoAutomatico = true;
        localStorage.setItem("modoAutomatico", "true");
      } else {
        modoAutomatico = false;
        localStorage.setItem("modoAutomatico", "false");
      }
    } else {
      mostrarToast(`Erro ao mudar modo: ${texto}`, "alert");
    }
  } catch (error) {
    mostrarToast(`Falha na comunicação com ESP32.`, "alert");
    console.error("Erro no fetch do modo:", error);
  }
}

function atualizarAtuadorUI(atuador, estado) {
  const btn = document.getElementById(`btn-${atuador}`);
  const estadoElemento = document.getElementById(`state-${atuador}`);

  // Se não existir no mapa, tenta ajustar visual com nome direto
  const nome = ATUADORES[atuador] ? ATUADORES[atuador].nome : atuador;

  if (btn) {
    const ligado = estado === 1;
    btn.textContent = ligado ? `Desligar ${nome}` : `Ligar ${nome}`;
    btn.classList.toggle("on", ligado);
    btn.classList.toggle("off", !ligado);
  }

  if (estadoElemento) {
    const ligado = estado === 1;
    estadoElemento.textContent = ligado ? "Ligada" : "Desligada";
    estadoElemento.classList.toggle("on", ligado);
    estadoElemento.classList.toggle("off", !ligado);
  }
}

async function obterDados() {
  // Só executa se existe o elemento de status (status.html)
  if (!document.getElementById("temp-value")) return;

  try {
    const resposta = await fetch(`http://${ESP32_IP}/status`, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Resposta não OK");
    const dados = await resposta.json();

    const payload = {
      temperatura: Number(dados.temp),
      umidadeAr: Number(dados.um_ar),
      umidadeSolo: Number(dados.um_solo),
      luminosidade: Number(dados.lux),
    };

    atualizarUIComDados(payload);
    // Atualiza setpoints locais se o ESP32 reportar
    if (dados.temp_sp !== undefined) parametrosAutomatico.tempMax = Number(dados.temp_sp);
    if (dados.um_solo_sp !== undefined) parametrosAutomatico.umidSoloMin = Number(dados.um_solo_sp);
    if (dados.lum_sp !== undefined) parametrosAutomatico.lumMin = Number(dados.lum_sp);

    if (window.adicionarDadoHistorico) {
    window.adicionarDadoHistorico(payload);
}
    // Verifica e age conforme modo automático
    verificarModoAutomatico(payload);

    // Sincronização dos atuadores (dados vindos do ESP)
    // espera-se que ESP retorne campos lampada, coolers, bomba como 0/1
    if (dados.lampada !== undefined) atualizarAtuadorUI("luz", Number(dados.lampada));
    if (dados.coolers !== undefined) atualizarAtuadorUI("fans", Number(dados.coolers));
    if (dados.bomba !== undefined) atualizarAtuadorUI("regar", Number(dados.bomba));

    // Atualiza switch de modo automático conforme ESP (se informado)
    if (dados.modo_auto !== undefined) {
      const reported = String(dados.modo_auto) === "true" || String(dados.modo_auto) === "1";
      modoAutomatico = reported;
      localStorage.setItem("modoAutomatico", modoAutomatico ? "true" : "false");
      const switchAuto = document.getElementById("auto-switch");
      if (switchAuto && switchAuto.checked !== modoAutomatico) {
        switchAuto.checked = modoAutomatico;
      }
      // aplica DOM correspondente
      if (modoAutomatico) aplicarAutomaticoDOM();
      else aplicarManualDOM();
    }

    // Atualiza botão master visualmente (se qualquer atuador estiver ligado)
    const btnMaster = document.getElementById("btn-estufa-master");
    const estufaLigadaGeral = (Number(dados.lampada) === 1 || Number(dados.coolers) === 1 || Number(dados.bomba) === 1);
    if (btnMaster) {
      btnMaster.classList.toggle("on", estufaLigadaGeral);
      btnMaster.classList.toggle("off", !estufaLigadaGeral);
      btnMaster.textContent = estufaLigadaGeral ? "Desligar Estufa" : "Ligar Estufa";
      estadosBotoes.master = estufaLigadaGeral;
    }
  } catch (err) {
    console.error("Erro ao obter dados do ESP32:", err);
    limparUIFalhaESP();
    desativarModoAutomaticoSeguro();
  }
}


/* ============================================================
   8. GRÁFICOS (status.html) — Chart.js
============================================================ */

let historico = []; // será preenchido com dados reais

function inicializarGrafico() {
  const canvas =
    document.getElementById("sensor-chart") ||
    document.getElementById("chartGeral");

  if (!canvas) return;
  if (typeof Chart === "undefined") {
    console.warn("Chart.js não encontrado — gráfico desativado.");
    return;
  }

  let chart = null;

  function render() {
    if (chart) chart.destroy();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: historico.map((p) => p.hora),
        datasets: [
          {
            label: "Temperatura (°C)",
            data: historico.map((p) => p.temperatura),
            borderWidth: 2,
            yAxisID: "y",
          },
          {
            label: "Umidade do Solo (%)",
            data: historico.map((p) => p.umidadeSolo),
            borderWidth: 2,
            yAxisID: "y1",
          },
          {
            label: "Luminosidade (lx)",
            data: historico.map((p) => p.luminosidade),
            borderWidth: 2,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { type: "linear", position: "left", beginAtZero: true },
          y1: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // expõe função global para ser usada quando novos dados forem recebidos
  window.adicionarDadoHistorico = function (medida) {
    historico.push({
      hora: new Date().toLocaleTimeString("pt-BR").slice(0, 5),
      temperatura: medida.temperatura,
      umidadeSolo: medida.umidadeSolo,
      luminosidade: medida.luminosidade,
    });

    // Mantém só as últimas 50 medições (opcional)
    if (historico.length > 50) historico.shift();

    render();
  };

  return chart;
}


/* ============================================================
   9. TEMA LIGHT / DARK
============================================================ */

function inicializarTema() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // Carregar preferencia salva
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark-theme");
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }

  // Alternância
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark-theme");

    if (isDark) {
      localStorage.setItem("theme", "dark");
      themeToggle.textContent = "☀️"; // ícone de luz
    } else {
      localStorage.setItem("theme", "light");
      themeToggle.textContent = "🌙"; // ícone de lua
    }
  });
}


/* ============================================================
   10. INICIALIZAÇÃO GERAL
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Módulos UI
  inicializarModalAjuda();
  inicializarModoAutomatico();
  inicializarBotoesIndividuais();
  inicializarBotaoMaster();
  inicializarTema();

  // Gráfico (status.html)
  inicializarGrafico();

  // Atualização de sensores (status.html)
  if (document.getElementById("temp-value")) {
    // Chama imediatamente e depois em intervalo
    obterDados();
    // Intervalo curto para demo; ajuste conforme necessidade (ex: 1500ms)
    setInterval(obterDados, 1500);
  }
});
