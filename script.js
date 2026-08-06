// 1. O BANCO DE DADOS (ARRAY) - Atualizado para usar 'formula'
let cartas = [
  {
    nome: "ANA",
    numero: 1,
    formula: "+",
    cor: "#ff7aa2",
    fonte: "'Arial', sans-serif",
    moldura: "flores",
    frente: null,
    verso: null
  },
  {
    nome: "BRUNO",
    numero: 2,
    formula: "-",
    cor: "#3a86ff",
    fonte: "'Comic Sans MS', cursive, sans-serif",
    moldura: "estrelas",
    frente: null,
    verso: null
  }
];

let cartaAtual = 0;

// Inicia o sistema
function inicializar() {
  renderizarListaCartas();
  selecionarCarta(0);
}

// 2. GERENCIAMENTO DA LISTA (BARALHO)
function renderizarListaCartas() {
  const lista = document.getElementById('listaCartas');
  lista.innerHTML = ''; 

  cartas.forEach((carta, index) => {
    const div = document.createElement('div');
    div.className = 'miniatura-carta' + (index === cartaAtual ? ' ativa' : '');
    div.innerHTML = `<strong>${carta.numero}</strong> • ${carta.nome || 'Sem Nome'}`;
    div.onclick = () => selecionarCarta(index);
    lista.appendChild(div);
  });
}

function adicionarCarta() {
  const nova = {
    nome: "NOVA", numero: cartas.length + 1, formula: "?", cor: "#06d6a0",
    fonte: "'Arial', sans-serif", moldura: "geometria", frente: null, verso: null
  };
  cartas.push(nova);
  selecionarCarta(cartas.length - 1);
}

function duplicarCarta() {
  const copia = JSON.parse(JSON.stringify(cartas[cartaAtual]));
  copia.nome = copia.nome + " (Cópia)";
  cartas.push(copia);
  selecionarCarta(cartas.length - 1);
}

function excluirCarta() {
  if (cartas.length <= 1) {
    alert("O baralho precisa ter pelo menos uma carta!");
    return;
  }
  const confirmacao = confirm(`Tem certeza que deseja excluir a carta "${cartas[cartaAtual].nome}"?`);
  if (!confirmacao) return;

  cartas.splice(cartaAtual, 1);
  if (cartaAtual >= cartas.length) {
    cartaAtual = cartas.length - 1;
  }
  selecionarCarta(cartaAtual);
}

// 3. SELEÇÃO E EDIÇÃO NO PAINEL
function selecionarCarta(index) {
  cartaAtual = index;
  const carta = cartas[cartaAtual];

  // Preenche os Inputs
  document.getElementById('inputNome').value = carta.nome;
  document.getElementById('inputNumero').value = carta.numero;
  document.getElementById('inputFormula').value = carta.formula;
  document.getElementById('inputCor').value = carta.cor;
  document.getElementById('inputFonte').value = carta.fonte;
  document.getElementById('inputMoldura').value = carta.moldura;
  
  // Limpa os campos de arquivo
  document.getElementById('uploadFrente').value = "";
  document.getElementById('uploadVerso').value = "";

  renderizarListaCartas(); 
  aplicarCartaNoDOM(carta); 
}

function salvarAlteracoes() {
  const carta = cartas[cartaAtual];
  
  carta.nome = document.getElementById('inputNome').value;
  carta.numero = document.getElementById('inputNumero').value;
  carta.formula = document.getElementById('inputFormula').value;
  carta.cor = document.getElementById('inputCor').value;
  carta.fonte = document.getElementById('inputFonte').value;
  carta.moldura = document.getElementById('inputMoldura').value;

  renderizarListaCartas(); 
  aplicarCartaNoDOM(carta); 
}

function carregarImagemBase64(input, face) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    cartas[cartaAtual][face] = e.target.result; 
    aplicarCartaNoDOM(cartas[cartaAtual]);
  };
  reader.readAsDataURL(file);
}

// 4. ATUALIZAÇÃO VISUAL (RENDER)
function aplicarCartaNoDOM(carta) {
  document.getElementById('name').innerText = carta.nome;
  document.getElementById('number').innerText = carta.numero;

  // Lógica de Renderização do KaTeX
  const formula = carta.formula || "+";
  try {
      // Símbolo pequeno da frente (inline)
      katex.render(formula,
          document.getElementById("formulaPreview"),
          {
              throwOnError: false,
              displayMode: false
          });
      
      // Símbolo grande do verso (display mode)
      katex.render(formula,
          document.getElementById("backSymbol"),
          {
              throwOnError: false,
              displayMode: true
          });

  } catch (e) {
      document.getElementById("formulaPreview").textContent = formula;
      document.getElementById("backSymbol").textContent = formula;
  }

  // Atualiza Estilos
  document.documentElement.style.setProperty('--cor-principal', carta.cor);
  document.documentElement.style.setProperty('--cor-texto', carta.cor);
  document.documentElement.style.setProperty('--fonte-carta', carta.fonte);

  document.getElementById('borderPattern').className = 'border-pattern ' + carta.moldura;

  const frontArt = document.getElementById('frontArt');
  frontArt.style.backgroundImage = carta.frente ? `url('${carta.frente}')` : 'none';
  
  const backArt = document.getElementById('backArt');
  backArt.style.backgroundImage = carta.verso ? `url('${carta.verso}')` : 'none';
}

function virarCarta() {
  const cartaElement = document.getElementById('cartaContainer');
  cartaElement.classList.toggle('virada');
  
  const botaoVirar = document.querySelector('.controles button:first-child');
  if (cartaElement.classList.contains('virada')) {
    botaoVirar.innerText = "Mostrar Frente";
  } else {
    botaoVirar.innerText = "Mostrar Verso";
  }
}

// 5. EXPORTAÇÃO INDIVIDUAL (1 Carta)
function exportarPNG() {
  const cartaContainer = document.getElementById('cartaContainer');
  const estaVirada = cartaContainer.classList.contains('virada');
  const elemento = document.getElementById(estaVirada ? 'back' : 'front');

  const transformOriginal = elemento.style.transform;
  elemento.style.transform = 'none';

  htmlToImage.toPng(elemento, { pixelRatio: 4, cacheBust: true, backgroundColor: null })
    .then((dataUrl) => {
      elemento.style.transform = transformOriginal;
      const link = document.createElement('a');
      link.download = `Carta_${cartas[cartaAtual].numero}_${cartas[cartaAtual].nome}.png`;
      link.href = dataUrl;
      link.click();
    }).catch(e => {
      elemento.style.transform = transformOriginal;
      alert('Erro ao exportar a carta.');
    });
}

// 6. O LOOP MÁGICO DE EXPORTAÇÃO A4
async function exportarBaralhoA4() {
  const btn = document.getElementById('btnExportarA4');
  btn.innerText = "Gerando Baralho... Aguarde";
  btn.disabled = true;

  const indiceBackup = cartaAtual;
  
  const cartaContainer = document.getElementById('cartaContainer');
  const estaVirada = cartaContainer.classList.contains('virada');
  const elemento = document.getElementById(estaVirada ? 'back' : 'front');
  const transformOriginal = elemento.style.transform;
  elemento.style.transform = 'none';

  const imagensGeradas = [];

  try {
    for (let i = 0; i < cartas.length; i++) {
      btn.innerText = `Processando ${i + 1}/${cartas.length}...`;
      aplicarCartaNoDOM(cartas[i]);
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await htmlToImage.toPng(elemento, { pixelRatio: 4, cacheBust: true, backgroundColor: null });
      imagensGeradas.push(dataUrl);
    }

    const totalPaginas = Math.ceil(imagensGeradas.length / 9);

    for (let p = 0; p < totalPaginas; p++) {
      btn.innerText = `Montando Página ${p + 1}/${totalPaginas}...`;
      
      const canvas = document.createElement('canvas');
      canvas.width = 2480;
      canvas.height = 3508;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cardW = 744, cardH = 1039, escala = 0.95;
      const w = cardW * escala, h = cardH * escala;
      const margemX = 120, margemY = 140, espX = 40, espY = 40;

      for (let i = 0; i < 9; i++) {
        const indexGlobal = (p * 9) + i;
        if (indexGlobal >= imagensGeradas.length) break; 

        const linha = Math.floor(i / 3);
        const coluna = i % 3;
        const x = margemX + coluna * (w + espX);
        const y = margemY + linha * (h + espY);

        const imgObj = new Image();
        imgObj.src = imagensGeradas[indexGlobal];
        
        await new Promise((resolve) => {
          imgObj.onload = () => {
            ctx.drawImage(imgObj, x, y, w, h);
            desenharMarcas(ctx, x, y, w, h);
            resolve();
          };
        });
      }

      const link = document.createElement('a');
      link.download = `Folha_${p + 1}_${estaVirada ? 'Verso' : 'Frente'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      await new Promise(r => setTimeout(r, 600)); 
    }
  } catch (err) {
    console.error(err);
    alert('Erro durante a geração do baralho.');
  } finally {
    elemento.style.transform = transformOriginal;
    selecionarCarta(indiceBackup); 
    btn.innerText = "Exportar Baralho (Folhas A4)";
    btn.disabled = false;
  }
}

function desenharMarcas(ctx, x, y, w, h) {
  const t = 18;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - t, y); ctx.lineTo(x, y); ctx.lineTo(x, y - t); 
  ctx.moveTo(x + w + t, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y - t); 
  ctx.moveTo(x - t, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h + t); 
  ctx.moveTo(x + w + t, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h + t); 
  ctx.stroke();
}
