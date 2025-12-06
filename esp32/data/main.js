console.log("Script vinculado! (Versão 2.0 - Corrigido)");

// =================================================================
// === 1. CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ===
// Define o IP do ESP32 e inicializa as variáveis de estado e setpoints.
// =================================================================
let parametrosAutomatico = JSON.parse(
    localStorage.getItem("parametrosAutomatico")
) || {
    tempMax: 28,
    umidSoloMin: 40,
    lumMin: 300,
};

const ESP32_IP = "192.168.4.1";

let modoAutomaticoAtivo = false;

const switchAuto = document.getElementById("auto-switch");
const btnMaster = document.getElementById("btn-estufa-master");
const popup = document.getElementById("popup-parametros");

const ATUADORES = {
    luz: { id: "luz", nome: "Iluminação" },
    fans: { id: "fans", nome: "Ventilação" },
    regar: { id: "regar", nome: "Regadores" },
};

// =================================================================
// === 2. FUNÇÕES DE COMUNICAÇÃO (FETCH) ===
// Funções assíncronas para enviar comandos de atuadores e modos de operação
// (Manual/Automático) para o ESP32 via HTTP.
// =================================================================
function mostrarToast(mensagem, tipo = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return; 

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

async function enviarComando(atuador, estado) {
    if (!atuador || typeof estado === 'undefined') return;

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

    if (modo === 'auto' && params) {
        url += `&temp=${params.tempMax}&solo=${params.umidSoloMin}&lux=${params.lumMin}`;
    }

    try {
        const resposta = await fetch(url);
        const texto = await resposta.text();
        if (resposta.ok) {
            mostrarToast(texto, "success");
            if (modo === 'auto') aplicarModoAutomatico(true);
        } else {
            mostrarToast(`Erro ao mudar modo: ${texto}`, "alert");
        }
    } catch (error) {
        mostrarToast(`Falha na comunicação com ESP32.`, "alert");
        console.error("Erro no fetch do modo:", error);
    }
}

// =================================================================
// === 3. CONTROLE DE INTERFACE (UI/UX) E LISTENERS ===
// Gerencia a interface do usuário (botões manuais, switch automático e pop-up)
// e configura os manipuladores de eventos de clique/mudança.
// =================================================================
if (switchAuto && btnMaster && popup) {
    const manualButtons = [
        document.getElementById("btn-luz"),
        document.getElementById("btn-fans"),
        document.getElementById("btn-regar"),
    ];
    
    function aplicarModoAutomatico(ativo) {
        btnMaster.style.display = ativo ? "none" : "block"; 
        
        manualButtons.forEach((btn) => {
            btn.disabled = ativo;
            btn.classList.toggle("disabled", ativo);
        });
    }

    switchAuto.checked = false;
    aplicarModoAutomatico(false);

    // --- Switch de Modo Automático ---
    switchAuto.addEventListener("change", () => {
        if (switchAuto.checked) {
            document.getElementById("temp-limite").value = parametrosAutomatico.tempMax;
            document.getElementById("umid-solo-limite").value = parametrosAutomatico.umidSoloMin;
            document.getElementById("lum-limite").value = parametrosAutomatico.lumMin;
            popup.style.display = "flex";
        } else {
            enviarModo('manual');
            aplicarModoAutomatico(false);
            mostrarToast("Modo Automático desativado", "alert");
        }
    });

    // --- Listeners do Pop-up ---
    document.getElementById("cancel-popup").onclick = () => {
        popup.style.display = "none";
        switchAuto.checked = modoAutomaticoAtivo;
    };

    document.getElementById("save-popup").onclick = () => {
        parametrosAutomatico = {
            tempMax: parseFloat(document.getElementById("temp-limite").value),
            umidSoloMin: parseFloat(document.getElementById("umid-solo-limite").value),
            lumMin: parseFloat(document.getElementById("lum-limite").value),
        };

        localStorage.setItem("parametrosAutomatico", JSON.stringify(parametrosAutomatico));
        enviarModo('auto', parametrosAutomatico);
        
        popup.style.display = "none";
        mostrarToast("Modo Automático ativado 🌿", "success");
    };

    // --- Configuração dos Botões Manuais ---
    function configurarBotao(idBotao, atuadorId, nome) {
        const btn = document.getElementById(idBotao);
        
        btn.addEventListener("click", () => {
            if (modoAutomaticoAtivo) {
                mostrarToast(`Desative o Modo Automático para controle manual de ${nome}.`, "alert");
                return;
            }

            const ligado = btn.classList.contains("on");
            const novoEstado = !ligado;

            enviarComando(atuadorId, novoEstado);
            atualizarAtuadorUI(atuadorId, novoEstado ? 1 : 0);
        });
    }

    configurarBotao("btn-luz", ATUADORES.luz.id, ATUADORES.luz.nome);
    configurarBotao("btn-fans", ATUADORES.fans.id, ATUADORES.luz.nome);
    configurarBotao("btn-regar", ATUADORES.regar.id, ATUADORES.regar.nome);
    
    // --- Botão Mestre ---
    btnMaster.addEventListener("click", () => {
        if (modoAutomaticoAtivo) {
            mostrarToast("Desative o Modo Automático para controle manual mestre.", "alert");
            return;
        }

        const estufaLigada = btnMaster.classList.contains("on");
        const novoEstado = !estufaLigada;
        
        Object.keys(ATUADORES).forEach(atuador => {
            enviarComando(atuador, novoEstado);
            atualizarAtuadorUI(atuador, novoEstado ? 1 : 0); 
        });
        
        btnMaster.classList.toggle("on", novoEstado);
        btnMaster.classList.toggle("off", !novoEstado);
        btnMaster.textContent = novoEstado ? "Desligar Estufa" : "Ligar Estufa";

        mostrarToast(novoEstado ? "Estufa ligada ✅" : "Estufa desligada ❌");
    });
}

// =================================================================
// === 4. FUNÇÕES DE SINCRONIZAÇÃO E ATUALIZAÇÃO DE DADOS ===
// Funções para buscar dados do ESP32 e renderizar o status e gráficos na UI.
// =================================================================

function atualizarAtuadorUI(atuador, estado) {
    const btn = document.getElementById(`btn-${atuador}`);
    const estadoElemento = document.getElementById(`state-${atuador}`);

    if (btn) {
        const ligado = estado === 1;
        const nome = ATUADORES[atuador].nome;
        
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

function updateUI(data) {
    // Atualiza Status dos Sensores
    const temp = document.getElementById("temp-value");
    const umAr = document.getElementById("umid-ar-value");
    const umSolo = document.getElementById("umid-solo-value");
    const lum = document.getElementById("lum-value");

    if (temp) temp.textContent = `${data.temp} °C`;
    if (umAr) umAr.textContent = `${data.um_ar} %`;
    if (umSolo) umSolo.textContent = `${data.um_solo} %`;
    if (lum) lum.textContent = `${data.lux} lx`; 

    // Atualiza Status dos Atuadores
    atualizarAtuadorUI('luz', data.lampada);
    atualizarAtuadorUI('fans', data.coolers);
    atualizarAtuadorUI('regar', data.bomba);
    
    // Sincroniza o Modo Automático
    const modoAuto = data.modo_auto === 'true';
    modoAutomaticoAtivo = modoAuto; 

    if (switchAuto && switchAuto.checked !== modoAuto) {
        switchAuto.checked = modoAuto;
    }
    aplicarModoAutomatico(modoAuto);
    
    const estufaLigadaGeral = (data.lampada == 1 || data.coolers == 1 || data.bomba == 1);
    if (btnMaster) {
        btnMaster.classList.toggle("on", estufaLigadaGeral);
        btnMaster.classList.toggle("off", !estufaLigadaGeral);
        btnMaster.textContent = estufaLigadaGeral ? "Desligar Estufa" : "Ligar Estufa";
    }

    // Atualiza Setpoints
    parametrosAutomatico.tempMax = data.temp_sp;
    parametrosAutomatico.umidSoloMin = data.um_solo_sp;
    parametrosAutomatico.lumMin = data.lum_sp;
}

async function obterDados() {
    try {
        const resposta = await fetch(`http://${ESP32_IP}/status`); 
        if (!resposta.ok) throw new Error("Resposta de rede não foi OK");
        
        const dados = await resposta.json();
        updateUI(dados);
        
    } catch (error) {
        console.error("Não foi possível obter dados do ESP32:", error);
    }
}

if (document.getElementById("temp-value") || document.getElementById("btn-luz")) {
    setInterval(obterDados, 1500);
    obterDados(); 
}

// =================================================================
// === 5. DADOS DE HISTÓRICO E RENDERIZAÇÃO DE GRÁFICOS ===
// Define dados de histórico (simulados) e a função de renderização Chart.js.
// =================================================================
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
    const ctx = document.getElementById("chartGeral");
    if (!ctx) return;
    const ctx2d = ctx.getContext("2d");

    if (chartGeral) chartGeral.destroy();

    chartGeral = new Chart(ctx2d, {
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
                    type: "line"
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

if (document.getElementById("chartGeral")) {
    renderizarGrafico(historico24h);

    document.getElementById("period-select").addEventListener("change", (e) => {
        if (e.target.value === "Últimas 24h") renderizarGrafico(historico24h);
        if (e.target.value === "Último mês") renderizarGrafico(historico30d);
    });
}