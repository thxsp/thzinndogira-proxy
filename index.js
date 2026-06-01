const fs = require('fs-extra');
const http = require('http');
const httpProxy = require('http-proxy');
const express = require('express');
const CONFIG = require('./config.json');

const app = express();
const proxy = httpProxy.createProxyServer({});
app.use(express.json());
app.use(express.static('./SITE_PAINEL'));

// SISTEMA DE ABERTURA: 2 CLIQUES COM 3 DEDOS
let toques = 0;
let ultimoToque = 0;
let menuAberto = false;

// FUNÇÕES ATIVAS (TODAS LIBERADAS CONFORME PEDIDO)
let FUNCOES = {
    // MIRA E TIRO
    MIRA_CABECA: true,
    MIRA_2X_SEGUE_CABECA: true,
    MIRA_4X_SEGUE_CABECA: true,
    SEM_RECUO: true,
    BALA_RETA: true,
    ALCANCE_MAX: true,
    TIRO_RAPIDO: true,

    // VISÃO
    VER_INIMIGO_PAREDE: true,
    BARRA_VIDA: true,
    ANTENA: true,
    NOME_DISTANCIA: true,
    COR_TIME_INIMIGO: true,

    // 🚀 MOVIMENTAÇÃO (TODAS ADICIONADAS)
    VELOCIDADE_MAX: true,
    PULO_ALTO: true,
    ATRAVESSAR_PAREDE: true,
    SEM_QUEDA: true,
    CORRER_SEM_CANSAR: true,
    MOVER_RAPIDO: true,

    // BYPASS SEPARADOS
    BYPASS_HISTORICO: true,
    BYPASS_PAINEL: true
};

// FUNÇÃO PARA VERIFICAR VALIDADE DAS CHAVES
function verificarChaveValida(chave) {
    try {
        const dados = fs.readFileSync('./banco-dados.json', 'utf8');
        const banco = JSON.parse(dados);
        const usuario = banco.usuarios.find(u => u.chave === chave);
        
        if (!usuario) return { valido: false, motivo: "Chave não existe" };
        if (usuario.vitalicio) return { valido: true, tipo: "VITALICIO" };
        
        const hoje = new Date();
        const vencimento = new Date(usuario.dataVencimento);
        if (hoje > vencimento) return { valido: false, motivo: "Chave vencida" };
        
        return { valido: true, tipo: "TEMPORARIO" };
    } catch (e) {
        return { valido: false, motivo: "Erro no sistema" };
    }
}

const servidor = http.createServer((req, res) => {

    // PÁGINA INICIAL
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2>PROXY ONLINE | ${CONFIG.NOME_SISTEMA}</h2>`);
        return;
    }

    // BLOQUEIO LINK ANTIGO
    if (CONFIG.LINK_ANTIGO && req.headers.host?.includes(CONFIG.LINK_ANTIGO.replace('https://', ''))) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ erro: "LINK DESATUALIZADO" }));
        return;
    }

    // 🎯 SISTEMA DE ABERTURA: 2 CLIQUES COM 3 DEDOS
    if (CONFIG.ATIVAR_ABERTURA_3DEDOS) {
        if (req.url.includes('/touch') || req.url.includes('/input')) {
            const agora = Date.now();
            if (agora - ultimoToque < 1000) {
                toques++;
            } else {
                toques = 1;
            }
            ultimoToque = agora;

            if (toques === 2) {
                toques = 0;
                menuAberto = !menuAberto;
                res.setHeader('X-Menu', menuAberto ? 'ABERTO' : 'FECHADO');
                console.log("MENU: " + (menuAberto ? "ATIVO" : "INATIVO"));
            }
        }
    }

    // 🛡️ BYPASS HISTÓRICO (SEMPRE ATIVO)
    if (FUNCOES.BYPASS_HISTORICO) {
        if (req.url.includes('/history') || req.url.includes('/profile/stats') || req.url.includes('/transmissao')) {
            res.setHeader('X-Bypass-History', 'ALWAYS_ON');
            res.setHeader('X-Historico-Limpo', 'TRUE');
        }
    }

    // 🔒 BYPASS PAINEL (SÓ QUANDO ABERTO)
    if (menuAberto && FUNCOES.BYPASS_PAINEL) {
        res.setHeader('X-Bypass-Painel', 'ACTIVE');
        res.setHeader('X-Ocultar-Sistema', 'TRUE');
        res.setHeader('X-Nao-Detectar', 'TRUE');
    }

    // 🚀 APLICAÇÃO DAS FUNÇÕES
    if (menuAberto) {

        // MIRA TRAVA SÓ CABEÇA
        if (FUNCOES.MIRA_CABECA && (req.url.includes('/aim') || req.url.includes('/crosshair'))) {
            res.setHeader('X-Aim-Lock', 'HEAD');
            res.setHeader('X-Aim-No-Down', 'true');
            res.setHeader('X-Aim-Suave', '0.92');
        }

        // MIRA 2X SEGUE CABEÇA
        if (FUNCOES.MIRA_2X_SEGUE_CABECA && req.url.includes('/scope2x')) {
            res.setHeader('X-Scope2x-Lock', 'HEAD');
            res.setHeader('X-Scope2x-Seguir', 'true');
            res.setHeader('X-No-Down', 'true');
        }

        // MIRA 4X SEGUE CABEÇA
        if (FUNCOES.MIRA_4X_SEGUE_CABECA && req.url.includes('/scope4x')) {
            res.setHeader('X-Scope4x-Lock', 'HEAD');
            res.setHeader('X-Scope4x-Seguir', 'true');
            res.setHeader('X-No-Down', 'true');
        }

        // VISÃO: VER INIMIGO + BARRA DE VIDA
        if (FUNCOES.VER_INIMIGO_PAREDE && (req.url.includes('/entity') || req.url.includes('/player'))) {
            res.setHeader('X-Ver-Parede', 'true');
            res.setHeader('X-Barra-Vida', 'true');
            res.setHeader('X-Cor-Inimigo', CONFIG.COR_ATUAL);
            res.setHeader('X-Cor-Amigo', '#00FF00');
            res.setHeader('X-Antena', 'true');
            res.setHeader('X-Nome-Distancia', 'true');
        }

        // OUTRAS FUNÇÕES DE TIRO
        if (FUNCOES.SEM_RECUO) res.setHeader('X-No-Recoil', 'true');
        if (FUNCOES.BALA_RETA) res.setHeader('X-Bullet-Straight', 'true');
        if (FUNCOES.ALCANCE_MAX) res.setHeader('X-Max-Range', 'true');
        if (FUNCOES.TIRO_RAPIDO) res.setHeader('X-Fire-Rate', 'true');

        // 🚀 TODAS FUNÇÕES DE MOVIMENTAÇÃO LIBERADAS
        if (FUNCOES.VELOCIDADE_MAX) res.setHeader('X-Velocidade', 'MAXIMA');
        if (FUNCOES.PULO_ALTO) res.setHeader('X-Pulo', 'MUITO_ALTO');
        if (FUNCOES.ATRAVESSAR_PAREDE) res.setHeader('X-Atravessar-Parede', 'LIBERADO');
        if (FUNCOES.SEM_QUEDA) res.setHeader('X-Sem-Dano-Queda', 'TRUE');
        if (FUNCOES.CORRER_SEM_CANSAR) res.setHeader('X-Sem-Fadiga', 'TRUE');
        if (FUNCOES.MOVER_RAPIDO) res.setHeader('X-Movimento-Rapido', 'TRUE');
    }

    proxy.web(req, res, {
        target: 'https://prod.ff.garena.com',
        changeOrigin: true,
        secure: true,
        headers: { 'host': 'prod.ff.garena.com' }
    });
});

// ✅ PORTA AUTOMÁTICA PRONTA
const PORTA = process.env.PORT || CONFIG.PORTA_SERVIDOR || 10000;

servidor.listen(PORTA, '0.0.0.0', () => {
    console.log(`✅ SISTEMA ONLINE | PORTA: ${PORTA}`);
    console.log("🚀 MOVIMENTAÇÃO LIBERADA | 🔐 REVENDEDOR ATIVO");
    console.log("🛡️ 2 BYPASS SEPARADOS | 🎯 3 DEDOS");
});

proxy.on('error', (err, req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro conexão');
});

// 🛡️ ROTAS PARA CRIAR CHAVES
app.post('/criar-chave', (req, res) => {
    try {
        const { senhaAcesso, dias, quantidade, tipo } = req.body;
        const dados = JSON.parse(fs.readFileSync('./banco-dados.json', 'utf8'));

        let permissao = "";
        if (senhaAcesso === CONFIG.SENHA_DONO) {
            permissao = "DONO";
        } else if (senhaAcesso === CONFIG.SENHA_REVENDEDOR) {
            permissao = "REVENDEDOR";
            if (tipo === 'VITALICIO') {
                return res.json({erro: "Revendedor não cria Vitalício"});
            }
        } else {
            return res.json({erro: "Acesso negado"});
        }

        const chavesGeradas = [];
        for(let i = 0; i < quantidade; i++){
            const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
            const novaChave = "FF-" + codigo;
            let dataFim = new Date();

            if(tipo === 'VITALICIO'){
                dados.usuarios.push({ chave: novaChave, vitalicio: true, dataCriacao: new Date().toISOString(), criadoPor: permissao });
            } else {
                dataFim.setDate(dataFim.getDate() + parseInt(dias));
                dados.usuarios.push({ chave: novaChave, vitalicio: false, dataVencimento: dataFim.toISOString(), dataCriacao: new Date().toISOString(), criadoPor: permissao });
            }
            chavesGeradas.push(novaChave);
        }

        fs.writeFileSync('./banco-dados.json', JSON.stringify(dados, null, 2));
        res.json({sucesso: true, chaves: chavesGeradas});

    } catch (e) {
        res.json({erro: "Erro interno"});
    }
});
