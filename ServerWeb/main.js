console.log("Script vinculado!");

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

function configurarBotao(idBotao, nome, idEstadoTexto) {
  let ligado = false;
  const btn = document.getElementById(idBotao);
  const estadoElemento = document.getElementById(idEstadoTexto);

  btn.addEventListener("click", () => {
    ligado = !ligado;

    if (ligado) {
      btn.textContent = `Desligar ${nome}`;
      btn.classList.replace("off", "on");

      estadoElemento.textContent = "Ligado";
      estadoElemento.classList.replace("off", "on");

      mostrarToast(`${nome} ligado ✅`, "success");
    } else {
      btn.textContent = `Ligar ${nome}`;
      btn.classList.replace("on", "off");

      estadoElemento.textContent = "Desligado";
      estadoElemento.classList.replace("on", "off");

      mostrarToast(`${nome} desligado ❌`, "alert");
    }
  });
}

// Aplicando aos 4 botões
configurarBotao("btn-estufa", "Estufa", "state-estufa");
configurarBotao("btn-luz", "Iluminação", "state-luz");
configurarBotao("btn-fans", "Ventilação", "state-fans");
configurarBotao("btn-regar", "Regadores", "state-regar");
