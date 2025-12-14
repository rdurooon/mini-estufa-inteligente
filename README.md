# SIA - Sistema Inteligente de Agricultura
### Automação para Horticultura Compacta

O **SIA** é um sistema de automatização voltado para horticultura compacta, desenvolvido para permitir o cultivo doméstico em pequenos espaços através do monitoramento e controle automático de temperatura, umidade e luminosidade. O projeto utiliza a plataforma **ESP32** para criar um microclima ideal, reduzindo a intervenção manual e o desperdício de recursos hídricos

---

## 🛠️ Hardware e Componentes

Com base no levantamento de materiais e na implementação do firmware, o sistema utiliza :

* **Microcontrolador:** ESP32 (com conectividade Wi-Fi nativa).
* **Sensores:**
    * **DHT11:** Temperatura e umidade do ar.
    * **Higrômetro:** Sensor capacitivo de umidade do solo
    * **LDR:** Sensor de luminosidade para controle de iluminação/ventilação
* **Atuadores (via Módulo Relé):**
    * Bomba d'água de 5v/12v para irrigação
    * Coolers de 80mm para exaustão e controle térmico
    * Lâmpadas/LEDs para suplementação luminosa

---

## 💻 Funcionalidades do Software

### 1. Modos de Operação
O sistema opera em dois estados principais, gerenciados via interface Web:
* **Modo Automático:** O ESP32 processa os dados dos sensores e aciona os relés conforme *setpoints* configuráveis (ex: liga a bomba se a umidade do solo for < 40%).
* **Modo Manual:** O usuário tem controle total sobre cada atuador individualmente através do painel de controle.

### 2. Interface Web (WebServer)
Desenvolvida em HTML5/CSS3 e JavaScript, a interface permite:
* Visualização em tempo real de temperatura, umidade (ar e solo) e lux.
* Configuração de limites térmicos e hídricos.
* Geração de relatórios de monitoramento.

### 3. Conectividade
O ESP32 atua como um **Access Point (AP)**, gerando sua própria rede Wi-Fi para acesso local:
* **SSID:** `SIA - Sistema intel. de agricultura`
* **Senha:** `sia12345`
* **IP Padrão:** `192.168.4.1`

---

## 📂 Estrutura de Arquivos

* `esp32.ino`: Código-fonte principal (Firmware) que gerencia os sensores, lógica de controle e as rotas HTTP do servidor.
* `index.html`: Interface do usuário armazenada na memória flash do ESP32 via **LittleFS**.
* `style.css` / `main.js`: Estilização e lógica de comunicação assíncrona (AJAX/Fetch) para atualização de dados sem recarregar a página.

---

## 🚀 Instalação e Uso

1.  **Configuração do Hardware:** Conecte os sensores e relés conforme os pinos definidos no arquivo `.ino` (DHT: 14, Solo: 34, LDR: 35, Relés: 13, 26, 12).
2.  **Upload do Firmware:** Utilize a Arduino IDE com suporte para ESP32.
3.  **Upload de Arquivos (LittleFS):** Certifique-se de carregar a pasta `data` (contendo o `index.html` e demais ativos) para a memória flash do ESP32 utilizando a ferramenta *ESP32 Sketch Data Upload*.
4.  **Acesso:** Conecte seu dispositivo ao Wi-Fi do projeto e acesse `http://192.168.4.1` no navegador.

---

## 👥 Equipe Acadêmica (Engenharia de Computação - Meta/AP)

* Fabio José Leite Martel
* Leandro Duarte Marques
* Lucas dos Santos Mendes
* Pedro Henrique Smith Moita
* Ruan Durão Monte Verde
* **Orientador:** Prof. Jean Lucas Tourinho Fonseca

---
**Nota:** Este projeto foi validado com um custo aproximado de **R$ 320,00**, demonstrando estabilidade nas medições e eficiência na redução de desperdício de água.