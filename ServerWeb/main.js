console.log("Script vinculado!")

function configurarBotao(idBotao, nome, idEstadoTexto) {
  let ligado = false;
  const btn = document.getElementById(idBotao);
  const estadoElemento = document.getElementById(idEstadoTexto);

  btn.addEventListener("click", () => {
    ligado = !ligado;

    if (ligado) {
      btn.textContent = `Desligar ${nome}`;
      btn.classList.remove("off");
      btn.classList.add("on");

      estadoElemento.textContent = nome === "Regadores" ? "Ligados" : "Ligado";
      estadoElemento.classList.remove("off");
      estadoElemento.classList.add("on");

      // fetch(`/ligar_${idBotao}`);
    } else {
      btn.textContent = `Ligar ${nome}`;
      btn.classList.remove("on");
      btn.classList.add("off");

      estadoElemento.textContent =
        nome === "Regadores" ? "Desligados" : "Desligado";
      estadoElemento.classList.remove("on");
      estadoElemento.classList.add("off");

      // fetch(`/desligar_${idBotao}`);
    }
  });
}

// Aplicando aos 4 botões
configurarBotao("btn-estufa", "Estufa", "state-estufa");
configurarBotao("btn-luz", "Iluminação", "state-luz");
configurarBotao("btn-fans", "Ventilação", "state-fans");
configurarBotao("btn-regar", "Regadores", "state-regar");
