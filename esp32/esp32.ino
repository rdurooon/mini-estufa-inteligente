#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include "FS.h"
#include "LittleFS.h"


// === DEFINIÇÕES DE PINOS ===
#define PIN_DHT 14
#define PIN_UMIDADE_SOLO 34
#define PIN_LDR 35

// Atuadores (Relés - Lógica Invertida: LOW = Liga, HIGH = Desliga)
#define PIN_RELE_COOLERS 13
#define PIN_RELE_LAMPADA 26
#define PIN_RELE_BOMBA 12
#define LIGA LOW
#define DESLIGA HIGH

// === CONFIGURAÇÕES GERAIS ===
const char *ssid = "SIA - Sistema inteligente de agricultura";
const char *password = "sia12345";
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// === INSTÂNCIAS ===
WebServer server(80);
DHT dht(PIN_DHT, DHT11);

// === VARIÁVEIS DE ESTADO E LEITURA ===
float temperatura = 0.0;
float umidadeAr = 0.0;
int umidadeSoloRaw = 0;
int umidadeSoloPorcentagem = 0;
int luminosidade = 0;
int luxSimulado = 0;

int estadoCoolers = 0;
int estadoLampada = 0;
int estadoBomba = 0;
bool modoAutomatico = false; // Começa em modo automático

// Setpoints
float tempMax_SP = 28.0; 
float umidadeMin_SP = 40.0;
int lumMin_SP = 300;

// Variáveis de temporização
unsigned long tempoUltimaLeitura = 0;
const long intervaloLeitura = 1000;
unsigned long tempoUltimoDebug = 0;
const long intervaloDebug = 2500;

// === FUNÇÕES DE SISTEMA (LittleFS) ===

bool loadFromLittleFS(String path) {
    String contentType = "text/plain";
    if (path.endsWith(".html")) contentType = "text/html";
    else if (path.endsWith(".css")) contentType = "text/css";
    else if (path.endsWith(".js")) contentType = "application/javascript";
    else if (path.endsWith(".png")) contentType = "image/png";
    else if (path.endsWith(".jpg")) contentType = "image/jpeg";
    else if (path.endsWith(".ico")) contentType = "image/x-icon";

    if (LittleFS.exists(path)) {
        File file = LittleFS.open(path, "r");
        server.streamFile(file, contentType);
        file.close();
        return true;
    }
    return false;
}

// === FUNÇÕES DE CONTROLE DE ATUADORES ===

void setCoolers(int estado) {
    estadoCoolers = estado;
    digitalWrite(PIN_RELE_COOLERS, estado == 1 ? LIGA : DESLIGA);
    Serial.printf("Coolers: %s\n", estado == 1 ? "LIGADO" : "DESLIGADO");
}
void setLampada(int estado) {
    estadoLampada = estado;
    digitalWrite(PIN_RELE_LAMPADA, estado == 1 ? LIGA : DESLIGA);
    Serial.printf("Lâmpada: %s\n", estado == 1 ? "LIGADA" : "DESLIGADA");
}
void setBomba(int estado) {
    estadoBomba = estado;
    digitalWrite(PIN_RELE_BOMBA, estado == 1 ? LIGA : DESLIGA);
    Serial.printf("Bomba: %s\n", estado == 1 ? "LIGADA" : "DESLIGADA");
}

// === FUNÇÕES DE LEITURA E LÓGICA ===

void lerSensores() {
    umidadeAr = dht.readHumidity();
    temperatura = dht.readTemperature();
    // if (isnan(umidadeAr) || isnan(temperatura)) { ... }

    umidadeSoloRaw = analogRead(PIN_UMIDADE_SOLO);
    int umidadeSoloMinADC = 3500;
    int umidadeSoloMaxADC = 2000;
    umidadeSoloPorcentagem = map(umidadeSoloRaw, umidadeSoloMinADC, umidadeSoloMaxADC, 0, 100);
    umidadeSoloPorcentagem = constrain(umidadeSoloPorcentagem, 0, 100); 

    luminosidade = digitalRead(PIN_LDR);
    luxSimulado = (luminosidade == 1) ? 500 : 50; 
    luxSimulado += random(-20, 20); 
    luxSimulado = constrain(luxSimulado, 0, 600);
}

void logicaControle() {
    if (!modoAutomatico) return;
    
    // 1. Controle de Temperatura (Coolers)
    if (temperatura > tempMax_SP + 1.0) {
        setCoolers(1); 
    } else if (temperatura < tempMax_SP - 1.0) {
        setCoolers(0); 
    }

    // 2. Controle de Umidade do Solo (Bomba)
    if (umidadeSoloPorcentagem < umidadeMin_SP - 5) {
        setBomba(1);
    } else if (umidadeSoloPorcentagem > umidadeMin_SP + 5) { 
        setBomba(0);
    }

    // 3. Controle de Luminosidade (Lâmpada)
    if (luxSimulado < lumMin_SP) { 
        setLampada(1);
    } else if (luxSimulado > lumMin_SP + 50) { 
        setLampada(0);
    }
}

void printDebugState() {
    Serial.print("🤖 Modo Automático: ");
    Serial.println(modoAutomatico ? "ATIVO" : "DESATIVADO");

    Serial.print("    Coolers: ");
    Serial.println(estadoCoolers == 1 ? "LIGADO" : "DESLIGADO");

    Serial.print("    Lâmpada: ");
    Serial.println(estadoLampada == 1 ? "LIGADA" : "DESLIGADA");

    Serial.print("    Bomba: ");
    Serial.println(estadoBomba == 1 ? "LIGADA" : "DESLIGADA");

    Serial.println("-------------------------");
}

// === HANDLERS DO WEB SERVER ===

void handleRoot() {
    // Tenta carregar index.html. Se falhar, assume que o arquivo não foi carregado no LittleFS.
    if (!loadFromLittleFS("/index.html")) {
        server.send(404, "text/plain", "ERRO FATAL: index.html nao encontrado no LittleFS!");
    }
}

void handleFileRequest() {
    String path = server.uri();
    // Tenta carregar o arquivo com base na URI (ex: /style.css, /main.js)
    if (!loadFromLittleFS(path)) { 
        server.send(404, "text/plain", "Arquivo nao encontrado: " + path);
    }
}

void handleStatus() {
    lerSensores();
    
    String json = "{";
    json += "\"temp\":" + String(temperatura, 1) + ",";
    json += "\"um_ar\":" + String(umidadeAr, 1) + ",";
    json += "\"um_solo\":" + String(umidadeSoloPorcentagem) + ",";
    json += "\"lux\":" + String(luxSimulado) + ","; 
    json += "\"coolers\":" + String(estadoCoolers) + ",";
    json += "\"lampada\":" + String(estadoLampada) + ",";
    json += "\"bomba\":" + String(estadoBomba) + ",";
    json += "\"modo_auto\":" + String(modoAutomatico ? "true" : "false") + ","; 
    json += "\"temp_sp\":" + String(tempMax_SP, 1) + ",";
    json += "\"um_solo_sp\":" + String(umidadeMin_SP, 1) + ",";
    json += "\"lum_sp\":" + String(lumMin_SP);
    json += "}";

    server.send(200, "application/json", json);
}

void handleCommand() {
    if (server.hasArg("modo")) {
        String modo = server.arg("modo");
        if (modo == "manual") {
            modoAutomatico = false;
            server.send(200, "text/plain", "Modo Manual Ativado.");
        } else if (modo == "auto") {
            tempMax_SP = server.arg("temp").toFloat();
            umidadeMin_SP = server.arg("solo").toFloat();
            lumMin_SP = server.arg("lux").toInt();
            modoAutomatico = true;
            server.send(200, "text/plain", "Modo Automatico Ativado e SPs Salvos.");
        }
        return;
    }
    
    if (!modoAutomatico && server.hasArg("atuador") && server.hasArg("estado")) {
        String atuador = server.arg("atuador");
        int estado = server.arg("estado").toInt();
        
        if (atuador == "fans") {
            setCoolers(estado);
        } else if (atuador == "luz") {
            setLampada(estado);
        } else if (atuador == "regar") {
            setBomba(estado);
        } else {
            server.send(400, "text/plain", "Comando de atuador invalido.");
            return;
        }
        server.send(200, "text/plain", "Comando recebido e executado.");
    } else if (modoAutomatico) {
        server.send(403, "text/plain", "Operacao Manual bloqueada. Desative o Modo Automatico.");
    } else {
        server.send(400, "text/plain", "Parametros de comando ausentes.");
    }
}

// === SETUP & LOOP ===

void setup() {
    Serial.begin(115200);

    // Inicializa o LittleFS
    if (!LittleFS.begin(true)) {
        Serial.println("Erro ao montar o LittleFS! Garanta que os arquivos foram carregados.");
        return;
    }
    Serial.println("LittleFS montado.");

    // Configuração de Pinos e Estado Inicial
    pinMode(PIN_RELE_COOLERS, OUTPUT);
    pinMode(PIN_RELE_LAMPADA, OUTPUT);
    pinMode(PIN_RELE_BOMBA, OUTPUT);
    pinMode(PIN_LDR, INPUT); 
    setCoolers(0); setLampada(0); setBomba(0);
    dht.begin();

    // Inicialização do Access Point (AP)
    WiFi.softAPConfig(local_IP, gateway, subnet);
    WiFi.softAP(ssid, password);
    Serial.print("AP Iniciado: "); Serial.println(ssid);
    Serial.print("IP: "); Serial.println(WiFi.softAPIP());

    // Configuração das Rotas do Servidor
    server.on("/", handleRoot); 
    server.on("/status", handleStatus);
    server.on("/command", handleCommand);
    server.onNotFound(handleFileRequest); 
    
    server.begin();
    Serial.println("Servidor HTTP iniciado.");
}

void loop() {
    server.handleClient();
    
    // Leitura de Sensores e Lógica de Controle
    if (millis() - tempoUltimaLeitura >= intervaloLeitura) {
        tempoUltimaLeitura = millis();
        lerSensores(); 
        logicaControle(); 
    }
    
    // Log de Debug
    if (millis() - tempoUltimoDebug >= intervaloDebug) {
        tempoUltimoDebug = millis();
        printDebugState();
    }
}