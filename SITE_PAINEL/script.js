// ALTERAR COR DO SISTEMA
function mudarCor(cor) {
    document.documentElement.style.setProperty('--cor-principal', cor);
    document.getElementById('cor-atual').innerText = cor;
    fetch('/config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({novaCor: cor})
    });
}

// ACESSOS
function acessarDono() {
    const senha = prompt("DIGITE A SENHA DO DONO:");
    if(senha === "dono12345") {
        window.location.href = "painel-admin.html";
    } else {
        alert("SENHA INCORRETA");
    }
}

function acessarRevendedor() {
    const senha = prompt("DIGITE A SENHA DO REVENDEDOR:");
    if(senha === "rev12345") {
        window.location.href = "painel-revendedor.html";
    } else {
        alert("SENHA INCORRETA");
    }
}

// GERAR CHAVES
async function gerarChave(tipoUsuario) {
    let senha, dias, qtd, tipo;
    const resultadoDiv = tipoUsuario === 'dono' ? document.getElementById('resultadoDono') : document.getElementById('resultadoRev');

    if(tipoUsuario === 'dono'){
        senha = "dono12345";
        dias = document.getElementById('validadeDono').value;
        qtd = parseInt(document.getElementById('qtdDono').value);
        tipo = dias === 'VITALICIO' ? 'VITALICIO' : 'TEMPORARIO';
    } else {
        senha = "rev12345";
        dias = document.getElementById('validadeRev').value;
        qtd = parseInt(document.getElementById('qtdRev').value);
        tipo = 'TEMPORARIO';
    }

    resultadoDiv.innerHTML = "Gerando...";

    try {
        const res = await fetch('/criar-chave', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({senhaAcesso: senha, dias: dias, quantidade: qtd, tipo: tipo})
        });

        const resposta = await res.json();
        
        if(resposta.erro) {
            resultadoDiv.innerHTML = `<span style="color:red">${resposta.erro}</span>`;
        } else if(resposta.sucesso) {
            let texto = "<strong>Chaves Criadas:</strong><br>";
            resposta.chaves.forEach(c => texto += `${c}<br>`);
            resultadoDiv.innerHTML = texto;
        }
    } catch (e) {
        resultadoDiv.innerHTML = `<span style="color:red">Erro de conexão</span>`;
    }
}
