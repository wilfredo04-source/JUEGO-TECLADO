
"use strict";

// ======================================
// DOMINIO DEL TECLADO - JUEGO PRINCIPAL
// ======================================

const $ = (id) => document.getElementById(id);

const defaultSave = {
  coins: 0,
  xp: 0,
  score: 0,
  bestScore: 0,
  wins: 0,
  correct: 0,
  errors: 0,
  bestStreak: 0,
  unlockedPets: [0],
  activePet: 0,
  unlockedSkins: [0],
  activeSkin: 0,
  medals: [],
  leaderboard: [],
  sound: true,
  music: false,
  lightMode: false
};

let save = loadSave();

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem("dominioTecladoSave"));
    return data ? { ...defaultSave, ...data } : { ...defaultSave };
  } catch {
    return { ...defaultSave };
  }
}

function saveGame() {
  localStorage.setItem("dominioTecladoSave", JSON.stringify(save));
  updateInterface();
}

const levels = {
  basic: {
    name: "Básico",
    lives: 2,
    words: [
      "casa", "mesa", "gato", "perro", "luna", "sol",
      "libro", "flor", "agua", "mano", "dedo", "pato",
      "nube", "pato", "silla", "pelota", "amigo", "escuela",
      "lapiz", "papel", "arbol", "camino", "estrella", "barco"
    ]
  },
  intermediate: {
    name: "Intermedio",
    lives: 3,
    words: [
      "teclado", "planeta", "aventura", "mariposa", "computadora",
      "naturaleza", "amistad", "universo", "biblioteca",
      "aprendizaje", "creatividad", "velocidad", "galaxia",
      "astronauta", "tecnologia", "conocimiento", "exploracion",
      "electricidad", "imaginacion", "experiencia"
    ]
  },
  advanced: {
    name: "Avanzado",
    lives: 1,
    words: [
      "extraordinario", "responsabilidad", "programacion",
      "desarrollador", "constelacion", "reconocimiento",
      "transformacion", "perseverancia", "comunicacion",
      "electromagnetismo", "independientemente",
      "incomprensible", "computacional", "extraordinariamente",
      "interconectividad", "experimentacion"
    ]
  }
};

const pets = [
  ["🐱", "Gatito"], ["🐶", "Perrito"], ["🐰", "Conejo"],
  ["🦊", "Zorro"], ["🐼", "Panda"], ["🐨", "Koala"],
  ["🦁", "León"], ["🐯", "Tigre"], ["🐸", "Rana"],
  ["🐵", "Mono"], ["🐻", "Oso"], ["🐷", "Cerdito"],
  ["🐮", "Vaca"], ["🐔", "Gallina"], ["🐧", "Pingüino"],
  ["🦄", "Unicornio"], ["🐲", "Dragón"], ["🐉", "Dragón oriental"],
  ["🦖", "Dinosaurio"], ["🦕", "Dinosaurio verde"],
  ["🐢", "Tortuga"], ["🐬", "Delfín"], ["🐳", "Ballena"],
  ["🦋", "Mariposa"], ["🐝", "Abeja"], ["🦉", "Búho"],
  ["🦅", "Águila"], ["🦜", "Loro"], ["🦚", "Pavo real"],
  ["🦩", "Flamenco"], ["🐙", "Pulpo"], ["🦀", "Cangrejo"],
  ["🦈", "Tiburón"], ["🐠", "Pez tropical"], ["🦓", "Cebra"],
  ["🦒", "Jirafa"], ["🐘", "Elefante"], ["🦛", "Hipopótamo"],
  ["🐺", "Lobo"], ["🦝", "Mapache"], ["🦔", "Erizo"],
  ["🐿️", "Ardilla"], ["🦦", "Nutria"], ["🦥", "Perezoso"],
  ["🦘", "Canguro"], ["🦙", "Llama"], ["🦌", "Venado"],
  ["🐪", "Camello"], ["🦢", "Cisne"], ["🐾", "Mascota misteriosa"]
];

const skins = [
  { name: "Azul espacial", color: "#244d9e", price: 0 },
  { name: "Morado galáctico", color: "#7136a8", price: 30 },
  { name: "Verde alienígena", color: "#237b55", price: 45 },
  { name: "Rojo fuego", color: "#a93636", price: 60 },
  { name: "Dorado legendario", color: "#ad8124", price: 100 },
  { name: "Rosa cósmico", color: "#a83d83", price: 80 }
];

const medalsList = [
  { id: "first", icon: "🥉", name: "Primera partida", check: () => save.wins >= 1 },
  { id: "five", icon: "⭐", name: "Cinco victorias", check: () => save.wins >= 5 },
  { id: "ten", icon: "🏆", name: "Diez victorias", check: () => save.wins >= 10 },
  { id: "words", icon: "⌨️", name: "100 palabras", check: () => save.correct >= 100 },
  { id: "coins", icon: "🪙", name: "Gran ahorrador", check: () => save.coins >= 100 },
  { id: "pets", icon: "🐾", name: "Coleccionista", check: () => save.unlockedPets.length >= 10 },
  { id: "perfect", icon: "💎", name: "Precisión total", check: () => save.correct >= 20 && save.errors === 0 },
  { id: "expert", icon: "🚀", name: "Experto", check: () => save.xp >= 500 }
];

let currentLevel = "basic";
let currentWord = "";
let availableWords = [];
let score = 0;
let lives = 2;
let timeLeft = 60;
let streak = 0;
let wordCount = 0;
let running = false;
let paused = false;
let timerInterval = null;
let audioContext = null;
let musicOscillator = null;
let musicGain = null;

// ======================================
// AUDIO Y MÚSICA ORIGINAL
// ======================================

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }
  if (audioContext?.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency = 500, duration = 0.12, type = "sine") {
  if (!save.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function toggleMusic() {
  getAudioContext();

  if (!save.music) {
    const ctx = getAudioContext();
    if (!ctx) return;

    musicOscillator = ctx.createOscillator();
    musicGain = ctx.createGain();

    musicOscillator.type = "sine";
    musicOscillator.frequency.value = 110;
    musicGain.gain.value = 0.018;

    musicOscillator.connect(musicGain);
    musicGain.connect(ctx.destination);
    musicOscillator.start();

    save.music = true;
  } else {
    if (musicOscillator) {
      musicOscillator.stop();
      musicOscillator = null;
    }
    save.music = false;
  }

  $("musicBtn").textContent = save.music ? "🔇 Apagar música" : "🎵 Música";
  saveGame();
}

// ======================================
// LECTURA EN VOZ ALTA
// ======================================

function speakWord() {
  if (!currentWord || !("speechSynthesis" in window)) {
    $("feedback").textContent = "La lectura de voz no está disponible en este navegador.";
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(currentWord);
  speech.lang = "es-ES";
  speech.rate = Number($("readingSpeed").value);
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

$("readBtn").addEventListener("click", speakWord);
$("readAgainBtn").addEventListener("click", speakWord);

// ======================================
// JUEGO DE ESCRITURA
// ======================================

function startGame() {
  clearInterval(timerInterval);
  window.speechSynthesis?.cancel();

  currentLevel = $("levelSelect").value;
  lives = levels[currentLevel].lives;
  timeLeft = 60;
  score = 0;
  streak = 0;
  wordCount = 0;
  running = true;
  paused = false;

  availableWords = [...levels[currentLevel].words];
  $("typingInput").disabled = false;
  $("typingInput").value = "";
  $("typingInput").focus();
  $("startBtn").textContent = "↻ Reiniciar partida";
  $("pauseBtn").disabled = false;
  $("readBtn").disabled = false;
  $("readAgainBtn").disabled = false;
  $("pauseBtn").textContent = "⏸ Pausar";
  $("gameStatus").textContent = "¡Partida en curso!";
  $("feedback").textContent = "¡Escribe la palabra correctamente!";
  $("levelName").textContent = levels[currentLevel].name;

  nextWord();
  updateGameDisplay();

  timerInterval = setInterval(() => {
    if (!running || paused) return;
    timeLeft--;
    updateGameDisplay();

    if (timeLeft <= 0) finishGame(true);
  }, 1000);
}

function nextWord() {
  if (availableWords.length === 0) {
    availableWords = [...levels[currentLevel].words];
  }

  const index = Math.floor(Math.random() * availableWords.length);
  currentWord = availableWords.splice(index, 1)[0];

  $("wordToType").textContent = currentWord;
  $("typingInput").value = "";
  $("feedback").textContent = "¡Tú puedes!";
  $("feedback").className = "";
  $("typingInput").focus();
}

function updateGameDisplay() {
  $("score").textContent = score;
  $("lives").textContent = lives;
  $("timer").textContent = timeLeft;
  $("streak").textContent = streak;
  $("wordCount").textContent = wordCount;
  $("progressBar").style.width = `${((60 - timeLeft) / 60) * 100}%`;
}

function checkTyping() {
  if (!running || paused) return;

  const typed = $("typingInput").value;

  if (typed === currentWord) {
    score += 10;
    save.coins += 3;
    save.xp += 5;
    save.correct++;
    streak++;
    wordCount++;

    if (streak > save.bestStreak) save.bestStreak = streak;

    $("feedback").textContent = "¡CORRECTO! +10 puntos y +3 monedas";
    $("feedback").className = "correct";
    $("wordToType").classList.add("correct");

    playTone(750, 0.13);
    setTimeout(() => $("wordToType").classList.remove("correct"), 250);

    updateGameDisplay();
    saveGame();
    checkMedals();

    setTimeout(() => {
      if (running && !paused) nextWord();
    }, 350);

  } else if (typed.length >= currentWord.length) {
    lives--;
    save.errors++;
    streak = 0;

    $("feedback").textContent = "¡Incorrecto! Inténtalo con la siguiente palabra.";
    $("feedback").className = "incorrect";
    playTone(180, 0.25, "square");

    updateGameDisplay();
    saveGame();

    if (lives <= 0) {
      finishGame(false);
    } else {
      setTimeout(() => {
        if (running && !paused) nextWord();
      }, 650);
    }
  }
}

function pauseGame() {
  if (!running) return;

  paused = !paused;
  $("pauseBtn").textContent = paused ? "▶ Continuar" : "⏸ Pausar";
  $("typingInput").disabled = paused;
  $("gameStatus").textContent = paused ? "Partida pausada" : "¡Partida en curso!";

  if (paused) {
    window.speechSynthesis?.cancel();
  } else {
    $("typingInput").focus();
  }
}

function finishGame(won) {
  if (!running) return;

  running = false;
  paused = false;
  clearInterval(timerInterval);
  window.speechSynthesis?.cancel();

  $("typingInput").disabled = true;
  $("pauseBtn").disabled = true;
  $("readBtn").disabled = true;
  $("readAgainBtn").disabled = true;

  if (won) {
    save.wins++;
    save.coins += 10;
    save.xp += 20;
    $("gameStatus").textContent = "¡Victoria espacial!";
    $("feedback").textContent = `¡Excelente! Ganaste ${score} puntos y 10 monedas extra.`;
    $("feedback").className = "correct";
    playTone(900, 0.4);
  } else {
    $("gameStatus").textContent = "Partida terminada";
    $("feedback").textContent = `¡Se acabaron las vidas! Conseguíste ${score} puntos.`;
    $("feedback").className = "incorrect";
  }

  if (score > save.bestScore) save.bestScore = score;

  if (score > 0) {
    save.leaderboard.push({
      score,
      level: levels[currentLevel].name,
      date: new Date().toLocaleDateString()
    });

    save.leaderboard.sort((a, b) => b.score - a.score);
    save.leaderboard = save.leaderboard.slice(0, 10);
  }

  checkMedals();
  saveGame();
  updateInterface();
}

$("typingInput").addEventListener("input", checkTyping);
$("startBtn").addEventListener("click", startGame);
$("pauseBtn").addEventListener("click", pauseGame);

// ======================================
// MASCOTAS Y TIENDA
// ======================================

function renderPets() {
  const shop = $("petShop");
  shop.innerHTML = "";

  pets.forEach((pet, index) => {
    const unlocked = save.unlockedPets.includes(index);
    const active = save.activePet === index;
    const price = index === 0 ? 0 : 10 + index * 5;

    const card = document.createElement("article");
    card.className = "pet-card";

    const emoji = document.createElement("div");
    emoji.className = "pet-emoji";
    emoji.textContent = pet[0];

    const name = document.createElement("h4");
    name.textContent = pet[1];

    const priceText = document.createElement("p");
    priceText.textContent = unlocked ? (active ? "Mascota activa" : "Desbloqueada") : `🪙 ${price}`;

    const button = document.createElement("button");

    if (active) {
      button.textContent = "Seleccionada";
      button.disabled = true;
    } else if (unlocked) {
      button.textContent = "Usar mascota";
      button.addEventListener("click", () => {
        save.activePet = index;
        saveGame();
        renderPets();
      });
    } else {
      button.textContent = "Comprar";
      button.disabled = save.coins < price;
      button.addEventListener("click", () => {
        if (save.coins < price) return;
        save.coins -= price;
        save.unlockedPets.push(index);
        save.activePet = index;
        playTone(700, 0.2);
        saveGame();
        renderPets();
        checkMedals();
      });
    }

    card.append(emoji, name, priceText, button);
    shop.appendChild(card);
  });
}

// ======================================
// TIENDA DE SKINS
// ======================================

function renderSkins() {
  const shop = $("skinShop");
  shop.innerHTML = "";

  skins.forEach((skin, index) => {
    const unlocked = save.unlockedSkins.includes(index);
    const active = save.activeSkin === index;

    const card = document.createElement("div");
    card.className = "skin-card";

    const swatch = document.createElement("div");
    swatch.className = "skin-swatch";
    swatch.style.background = skin.color;

    const name = document.createElement("strong");
    name.textContent = skin.name;

    const button = document.createElement("button");

    if (active) {
      button.textContent = "Seleccionada";
      button.disabled = true;
    } else if (unlocked) {
      button.textContent = "Usar skin";
      button.addEventListener("click", () => {
        save.activeSkin = index;
        saveGame();
        renderSkins();
      });
    } else {
      button.textContent = `🪙 ${skin.price}`;
      button.disabled = save.coins < skin.price;
      button.addEventListener("click", () => {
        if (save.coins < skin.price) return;
        save.coins -= skin.price;
        save.unlockedSkins.push(index);
        save.activeSkin = index;
        saveGame();
        renderSkins();
      });
    }

    card.append(swatch, name, button);
    shop.appendChild(card);
  });

  document.querySelector(".profile-panel .pet-preview").style.background =
    skins[save.activeSkin]?.color || skins[0].color;
}

// ======================================
// RULETA DE PREMIOS
// ======================================

const prizes = [
  { icon: "🪙", text: "10 monedas", coins: 10, xp: 0 },
  { icon: "⭐", text: "20 XP", coins: 0, xp: 20 },
  { icon: "🎁", text: "25 monedas", coins: 25, xp: 0 },
  { icon: "🚀", text: "15 monedas y 10 XP", coins: 15, xp: 10 },
  { icon: "💎", text: "40 monedas", coins: 40, xp: 0 },
  { icon: "🌟", text: "30 XP", coins: 0, xp: 30 }
];

function spinRoulette() {
  if (save.coins < 20) {
    $("rouletteResult").textContent = "🪙";
    $("feedback").textContent = "Necesitas 20 monedas para girar la ruleta.";
    return;
  }

  save.coins -= 20;
  $("spinBtn").disabled = true;
  $("rouletteResult").textContent = "🎡";

  let spins = 0;
  const animation = setInterval(() => {
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    $("rouletteResult").textContent = randomPrize.icon;
    spins++;

    if (spins >= 12) {
      clearInterval(animation);

      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      $("rouletteResult").textContent = prize.icon;
      save.coins += prize.coins;
      save.xp += prize.xp;

      $("feedback").textContent = `¡Ganaste ${prize.text}!`;
      $("spinBtn").disabled = false;

      playTone(850, 0.3);
      saveGame();
    }
  }, 130);
}

$("spinBtn").addEventListener("click", spinRoulette);

// ======================================
// MAPA DE AVENTURAS
// ======================================

function renderMap() {
  const map = $("adventureMap");
  map.innerHTML = "";

  const places = [
    ["🌍", "Tierra de letras", 0],
    ["🌙", "Luna de palabras", 1],
    ["🪐", "Planeta veloz", 3],
    ["☄️", "Campo de meteoritos", 5],
    ["🌌", "Galaxia experta", 8],
    ["👑", "Reino de maestros", 12]
  ];

  places.forEach((place, index) => {
    const unlocked = save.wins >= place[2];
    const current = unlocked && (index === places.length - 1 || save.wins < places[index + 1][2]);

    const node = document.createElement("div");
    node.className = "map-node" + (unlocked ? "" : " locked") + (current ? " current" : "");
    node.innerHTML = `<div style="font-size:2rem">${place[0]}</div>`;

    const title = document.createElement("strong");
    title.textContent = place[1];

    const detail = document.createElement("small");
    detail.textContent = unlocked ? "Desbloqueado" : `Necesitas ${place[2]} victorias`;

    node.append(title, detail);
    map.appendChild(node);
  });
}

// ======================================
// MEDALLAS
// ======================================

function checkMedals() {
  medalsList.forEach(medal => {
    if (medal.check() && !save.medals.includes(medal.id)) {
      save.medals.push(medal.id);
      $("feedback").textContent = `🏅 ¡Nueva medalla: ${medal.name}!`;
      playTone(1000, 0.25);
    }
  });

  renderMedals();
}

function renderMedals() {
  const area = $("medals");
  area.innerHTML = "";

  medalsList.forEach(medal => {
    const unlocked = save.medals.includes(medal.id);
    const item = document.createElement("div");
    item.className = "medal" + (unlocked ? "" : " locked");

    const icon = document.createElement("span");
    icon.textContent = medal.icon;

    const name = document.createElement("strong");
    name.textContent = medal.name;

    const status = document.createElement("small");
    status.textContent = unlocked ? "Conseguida" : "Bloqueada";

    item.append(icon, name, document.createElement("br"), status);
    area.appendChild(item);
  });
}

// ======================================
// PERFIL, RANGOS Y ESTADÍSTICAS
// ======================================

function getRank(xp) {
  if (xp >= 2000) return ["Leyenda", 2000, 2500];
  if (xp >= 1000) return ["Maestro", 1000, 2000];
  if (xp >= 500) return ["Experto", 500, 1000];
  if (xp >= 200) return ["Aprendiz", 200, 500];
  return ["Principiante", 0, 200];
}

function renderLeaderboard() {
  const list = $("leaderboard");
  list.innerHTML = "";

  if (save.leaderboard.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Todavía no tienes récords. ¡Juega tu primera partida!";
    list.appendChild(item);
    return;
  }

  save.leaderboard.forEach((record, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${record.score} puntos · ${record.level} · ${record.date}`;
    list.appendChild(item);
  });
}

function updateInterface() {
  $("coinDisplay").textContent = `🪙 ${save.coins}`;
  $("bestScore").textContent = save.bestScore;
  $("xpDisplay").textContent = save.xp;
  $("winsDisplay").textContent = save.wins;
  $("correctTotal").textContent = save.correct;
  $("errorsTotal").textContent = save.errors;
  $("bestStreak").textContent = save.bestStreak;

  const attempts = save.correct + save.errors;
  const precision = attempts ? Math.round((save.correct / attempts) * 100) : 0;
  $("accuracy").textContent = `${precision}%`;

  const rank = getRank(save.xp);
  $("playerRank").textContent = rank[0];
  $("xpBar").style.width = `${Math.min(100, ((save.xp - rank[1]) / (rank[2] - rank[1])) * 100)}%`;

  $("activePet").textContent = pets[save.activePet]?.[0] || "🐱";
  $("petName").textContent = pets[save.activePet]?.[1] || "Gatito";

  $("soundBtn").textContent = save.sound ? "🔔 Sonidos: sí" : "🔕 Sonidos: no";
  $("musicBtn").textContent = save.music ? "🔇 Apagar música" : "🎵 Música";

  document.body.classList.toggle("light-mode", save.lightMode);

  renderLeaderboard();
  renderPets();
  renderSkins();
  renderMap();
  renderMedals();
}

// ======================================
// BOTONES GENERALES
// ======================================

$("themeBtn").addEventListener("click", () => {
  save.lightMode = !save.lightMode;
  saveGame();
});

$("soundBtn").addEventListener("click", () => {
  save.sound = !save.sound;
  saveGame();
  if (save.sound) playTone(600, 0.15);
});

$("musicBtn").addEventListener("click", toggleMusic);

$("resetBtn").addEventListener("click", () => {
  const confirmReset = confirm("¿Seguro que quieres borrar todo tu progreso?");
  if (!confirmReset) return;

  clearInterval(timerInterval);
  window.speechSynthesis?.cancel();

  if (musicOscillator) {
    musicOscillator.stop();
    musicOscillator = null;
  }

  localStorage.removeItem("dominioTecladoSave");
  save = { ...defaultSave };
  running = false;
  paused = false;
  score = 0;
  timeLeft = 60;

  $("typingInput").disabled = true;
  $("pauseBtn").disabled = true;
  $("readBtn").disabled = true;
  $("readAgainBtn").disabled = true;
  $("wordToType").textContent = "¡Prepárate!";
  $("feedback").textContent = "Progreso reiniciado.";
  $("gameStatus").textContent = "Listo para jugar";

  updateGameDisplay();
  saveGame();
});

// ======================================
// BLOQUEO DE COPIAR Y PEGAR
// ======================================

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (["c", "v", "x"].includes(key)) {
      event.preventDefault();
    }
  }
});

document.addEventListener("contextmenu", event => {
  event.preventDefault();
});

// ======================================
// INICIALIZACIÓN
// ======================================

updateInterface();
updateGameDisplay();

$("levelName").textContent = "Básico";
$("gameStatus").textContent = "Listo para jugar";

"use strict";

/* DOMINIO DEL TECLADO - KEYMASTER ACADEMY */

const $ = id => document.getElementById(id);
const STORAGE_KEY = "keymasterAcademy_v3";

const defaultData = {
  coins: 0,
  xp: 0,
  games: 0,
  record: 0,
  bestPPM: 0,
  totalHits: 0,
  totalAccuracy: 0,
  accuracyCount: 0,
  selectedPet: 0,
  ownedPets: [0],
  achievements: [],
  daily: {
    date: new Date().toLocaleDateString("en-CA"),
    games: 0,
    hits: 0,
    accuracy: 0,
    phrases: 0,
    claimed: []
  },
  history: []
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultData);

    return {
      ...structuredClone(defaultData),
      ...saved,
      daily: { ...defaultData.daily, ...(saved.daily || {}) },
      ownedPets: Array.isArray(saved.ownedPets) ? saved.ownedPets : [0],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      history: Array.isArray(saved.history) ? saved.history : []
    };
  } catch {
    return structuredClone(defaultData);
  }
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function checkNewDay() {
  const today = new Date().toLocaleDateString("en-CA");
  if (data.daily.date !== today) {
    data.daily = {
      date: today,
      games: 0,
      hits: 0,
      accuracy: 0,
      phrases: 0,
      claimed: []
    };
    saveData();
  }
}

checkNewDay();

/* MASCOTAS: 50 COMPAÑEROS */

const pets = [
  ["León","🦁",0],["Gato","🐱",30],["Perro","🐶",40],["Zorro","🦊",50],
  ["Panda","🐼",60],["Tigre","🐯",70],["Conejo","🐰",80],["Oso","🐻",90],
  ["Koala","🐨",100],["Mono","🐵",110],["Lobo","🐺",120],["Rana","🐸",130],
  ["Pingüino","🐧",140],["Águila","🦅",150],["Búho","🦉",160],["Delfín","🐬",170],
  ["Tortuga","🐢",180],["Dragón","🐉",190],["Unicornio","🦄",200],["Caballo","🐴",210],
  ["Elefante","🐘",220],["Jirafa","🦒",230],["Cocodrilo","🐊",240],["Serpiente","🐍",250],
  ["Pulpo","🐙",260],["Ballena","🐳",270],["Tiburón","🦈",280],["Mariposa","🦋",290],
  ["Abeja","🐝",300],["Caracol","🐌",310],["Murciélago","🦇",320],["Ciervo","🦌",330],
  ["Camello","🐫",340],["Gorila","🦍",350],["Flamenco","🦩",360],["Pavo real","🦚",370],
  ["Loro","🦜",380],["Cisne","🦢",390],["Ratón","🐭",400],["Hámster","🐹",410],
  ["Pato","🦆",420],["Gallina","🐔",430],["Carnero","🐏",440],["Búfalo","🐃",450],
  ["Estegosaurio","🦕",460],["Tiranosaurio","🦖",470],["Alienígena","👽",480],
  ["Robot","🤖",490],["Fantasma","👻",500],["Gato espacial","😺",550]
];

/* EJERCICIOS */

const exercises = {
  basico: {
    palabras: ["casa","mesa","luna","gato","perro","libro","flor","mano","sol","nube","árbol","niño","juego","tecla","silla","ratón","puerta","papel","lápiz","escuela"],
    frases: ["El sol brilla.","Me gusta leer.","La luna sale de noche.","Hoy es un gran día.","Mi casa es bonita.","Aprendo con alegría."],
    numeros: ["12345","98765","2026","24680","13579","112233","556677"]
  },
  intermedio: {
    palabras: ["teclado","velocidad","precisión","aventura","computadora","aprendizaje","escritura","biblioteca","mariposa","naturaleza","conocimiento","estudiante"],
    frases: ["Practico todos los días para mejorar.","La precisión es importante al escribir.","Aprender jugando es divertido.","Mi objetivo es dominar el teclado.","Cada desafío me ayuda a mejorar."],
    numeros: ["123456789","20262026","987654321","135792468","1122334455"]
  },
  avanzado: {
    palabras: ["extraordinario","responsabilidad","desarrollador","concentración","extraordinariamente","perseverancia","programación","transformación"],
    frases: ["La práctica constante fortalece nuestras habilidades digitales.","Es importante escribir correctamente y mantener la concentración.","La tecnología nos permite aprender cosas extraordinarias.","La velocidad sin precisión no garantiza un buen resultado."],
    numeros: ["123456789012","987654321098","202611171234","314159265358","112233445566"]
  }
};

const lifeSettings = { basico: 2, intermedio: 3, avanzado: 1 };

let game = {
  active: false,
  lives: 2,
  time: 60,
  score: 0,
  hits: 0,
  mistakes: 0,
  typed: 0,
  startedAt: 0,
  timer: null,
  pool: [],
  target: "",
  spun: false,
  roundPhrases: 0,
  roundHits: 0
};

let audioContext = null;
let musicTimer = null;
let musicOn = false;
let noteIndex = 0;

/* SONIDOS */

function playTone(frequency = 440, duration = 0.12, type = "sine") {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("El audio no está disponible en este navegador.", error);
  }
}

function soundCorrect() {
  playTone(660, 0.1);
  setTimeout(() => playTone(880, 0.12), 90);
}

function soundWrong() {
  playTone(180, 0.2, "triangle");
}

function toggleMusic() {
  musicOn = !musicOn;

  if (musicOn) {
    $("musicBtn").textContent = "🔇 Detener música";
    playTone(440, 0.2);

    const melody = [392, 440, 523, 440, 349, 392, 494, 392];
    musicTimer = setInterval(() => {
      if (musicOn) {
        playTone(melody[noteIndex % melody.length], 0.18, "sine");
        noteIndex++;
      }
    }, 450);
  } else {
    clearInterval(musicTimer);
    $("musicBtn").textContent = "🔊 Activar música";
  }
}

/* NAVEGACIÓN */

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    inicio: "¡Bienvenido, estudiante!",
    entrenamiento: "Zona de entrenamiento",
    mapa: "Mapa de aventuras",
    misiones: "Misiones diarias",
    mascotas: "Colección de mascotas",
    ranking: "Ranking de jugadores",
    logros: "Trofeos y recompensas",
    estadisticas: "Tus estadísticas"
  };

  $("pageTitle").textContent = titles[page] || "Keymaster Academy";
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

/* PANEL PRINCIPAL */

function getRank() {
  if (data.xp >= 2000) return "Maestro legendario";
  if (data.xp >= 1000) return "Experto";
  if (data.xp >= 500) return "Avanzado";
  if (data.xp >= 200) return "Intermedio";
  return "Principiante";
}

function renderDashboard() {
  $("coins").textContent = data.coins;
  $("xp").textContent = data.xp + " XP";
  $("record").textContent = data.record;
  $("games").textContent = data.games;
  $("levelName").textContent = getRank();

  const progress = data.xp % 100;
  $("homeProgress").style.width = progress + "%";
  $("progressText").textContent = progress + " / 100 XP para el siguiente rango";

  const pet = pets[data.selectedPet] || pets[0];
  $("homePet").textContent = pet[1];

  $("bestPPM").textContent = data.bestPPM;
  $("averageAccuracy").textContent = data.accuracyCount
    ? Math.round(data.totalAccuracy / data.accuracyCount) + "%"
    : "0%";
  $("totalHits").textContent = data.totalHits;
  $("totalGames").textContent = data.games;

  renderMap();
  renderMissions();
  renderPets();
  renderRanking();
  renderAchievements();
}

function renderMap() {
  const completed = data.games;
  [1, 5, 10, 20].forEach((required, index) => {
    $("world" + (index + 1)).classList.toggle("unlocked", completed >= required);
  });
}

/* PARTIDAS */

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makePool() {
  const difficulty = $("difficulty").value;
  const type = $("exerciseType").value;
  const source = exercises[difficulty];

  let result = [];

  if (type === "mixto") {
    result = [...source.palabras, ...source.frases, ...source.numeros];
  } else {
    result = [...source[type]];
  }

  return shuffle(result);
}

function nextTarget() {
  if (!game.active) return;

  if (game.pool.length === 0) {
    game.pool = makePool();
  }

  game.target = game.pool.pop();
  $("target").textContent = game.target;
  $("typingInput").value = "";
  $("typingInput").focus();
  $("feedback").textContent = "¡Escribe el texto que aparece arriba!";
  $("feedback").className = "";
}

function updateGameDisplay() {
  $("lives").textContent = game.lives;
  $("time").textContent = game.time;
  $("score").textContent = game.score;
  $("hits").textContent = game.hits;
  $("ppm").textContent = getCurrentPPM();
  $("accuracy").textContent = getAccuracy() + "%";
}

function startGame() {
  clearInterval(game.timer);

  game = {
    active: true,
    lives: lifeSettings[$("difficulty").value],
    time: 60,
    score: 0,
    hits: 0,
    mistakes: 0,
    typed: 0,
    startedAt: Date.now(),
    timer: null,
    pool: makePool(),
    target: "",
    spun: false,
    roundPhrases: 0,
    roundHits: 0
  };

  $("spinBtn").disabled = true;
  $("spinResult").textContent = "¡Consigue premios!";
  $("typingInput").disabled = false;
  $("startBtn").disabled = true;
  $("typingInput").focus();

  nextTarget();
  updateGameDisplay();

  game.timer = setInterval(() => {
    if (!game.active) return;
    game.time--;
    updateGameDisplay();

    if (game.time <= 0) finishGame("¡Se terminó el tiempo!");
  }, 1000);
}

function restartGame() {
  clearInterval(game.timer);
  game.active = false;
  game.lives = lifeSettings[$("difficulty").value];
  game.time = 60;
  game.score = 0;
  game.hits = 0;
  game.mistakes = 0;
  game.typed = 0;

  $("typingInput").value = "";
  $("typingInput").disabled = true;
  $("target").textContent = "Presiona comenzar";
  $("feedback").textContent = "¡Prepárate para tu próxima partida!";
  $("feedback").className = "";
  $("startBtn").disabled = false;

  updateGameDisplay();
}

function getCurrentPPM() {
  const elapsed = Math.max(1, (Date.now() - game.startedAt) / 60000);
  return game.startedAt ? Math.round(game.hits / elapsed) : 0;
}

function getAccuracy() {
  const total = game.hits + game.mistakes;
  return total ? Math.round((game.hits / total) * 100) : 100;
}

function handleTyping() {
  if (!game.active) return;

  const value = $("typingInput").value;
  const target = game.target;

  game.typed = Math.max(game.typed, value.length);

  if (target.startsWith(value)) {
    $("feedback").textContent = "¡Vas muy bien! Sigue escribiendo.";
    $("feedback").className = "correct";
  } else {
    $("feedback").textContent = "Revisa las letras e inténtalo de nuevo.";
    $("feedback").className = "incorrect";
  }

  if (value === target) {
    game.hits++;
    game.roundHits++;
    game.score += target.length * 10;
    game.time = Math.min(60, game.time + 1);

    if (target.includes(" ")) game.roundPhrases++;

    soundCorrect();
    updateGameDisplay();
    nextTarget();
  }
}

function handleWrongKey() {
  if (!game.active) return;

  game.mistakes++;
  game.lives--;

  soundWrong();
  $("feedback").textContent = "¡Esa tecla no corresponde! Inténtalo otra vez.";
  $("feedback").className = "incorrect";

  updateGameDisplay();

  if (game.lives <= 0) {
    finishGame("¡Te has quedado sin vidas!");
  }
}

function finishGame(message) {
  if (!game.active) return;

  game.active = false;
  clearInterval(game.timer);

  $("typingInput").disabled = true;
  $("startBtn").disabled = false;

  const accuracy = getAccuracy();
  const ppm = getCurrentPPM();
  const earnedCoins = Math.max(1, Math.floor(game.score / 100));
  const earnedXP = Math.max(5, Math.floor(game.score / 20));

  data.games++;
  data.coins += earnedCoins;
  data.xp += earnedXP;
  data.record = Math.max(data.record, game.score);
  data.bestPPM = Math.max(data.bestPPM, ppm);
  data.totalHits += game.hits;
  data.totalAccuracy += accuracy;
  data.accuracyCount++;
  data.daily.games++;
  data.daily.hits += game.hits;
  data.daily.accuracy = Math.max(data.daily.accuracy, accuracy);
  data.daily.phrases += game.roundPhrases;

  data.history.push({
    score: game.score,
    ppm,
    accuracy,
    date: new Date().toLocaleDateString("es-PE")
  });

  data.history = data.history.slice(-10);

  updateMissions();
  checkAchievements();
  saveData();
  renderDashboard();

  $("resultIcon").textContent = game.score > 0 ? "🏆" : "💪";
  $("resultTitle").textContent = "¡Partida terminada!";
  $("resultText").textContent =
    message + " Puntos: " + game.score +
    " · PPM: " + ppm +
    " · Precisión: " + accuracy + "%" +
    " · Monedas ganadas: " + earnedCoins;

  $("resultModal").classList.add("show");
  $("spinBtn").disabled = false;
}

$("typingInput").addEventListener("input", handleTyping);

$("typingInput").addEventListener("keydown", event => {
  if (!game.active) return;

  if (event.key === "Backspace") {
    // Permite corregir lo escrito sin perder una vida.
    return;
  }

  if (event.key.length === 1) {
    const expected = game.target[$("typingInput").value.length];

    if (event.key !== expected) {
      event.preventDefault();
      handleWrongKey();
    }
  }
});

$("typingInput").addEventListener("paste", event => event.preventDefault());
$("typingInput").addEventListener("copy", event => event.preventDefault());
$("typingInput").addEventListener("cut", event => event.preventDefault());
$("typingInput").addEventListener("drop", event => event.preventDefault());

$("typingInput").addEventListener("contextmenu", event => event.preventDefault());

document.addEventListener("keydown", event => {
  const typing = event.target === $("typingInput");

  if (typing && (event.ctrlKey || event.metaKey) &&
      ["c", "v", "x"].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }
});

$("startBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", restartGame);

$("closeModal").addEventListener("click", () => {
  $("resultModal").classList.remove("show");
});

$("resultModal").addEventListener("click", event => {
  if (event.target === $("resultModal")) {
    $("resultModal").classList.remove("show");
  }
});

/* LECTURA EN VOZ ALTA */

$("speakBtn").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    $("feedback").textContent = "Tu navegador no admite lectura en voz alta.";
    return;
  }

  const text = game.active ? game.target : $("target").textContent;
  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = "es-ES";
  speech.rate = Number($("voiceSpeed").value);
  speech.pitch = 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(speech);
});

/* MODO CLARO Y OSCURO */

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");

  $("themeBtn").textContent = dark ? "☀️ Modo claro" : "🌙 Modo oscuro";
  localStorage.setItem("keymasterTheme", dark ? "dark" : "light");
});

if (localStorage.getItem("keymasterTheme") === "dark") {
  document.body.classList.add("dark");
  $("themeBtn").textContent = "☀️ Modo claro";
}

$("musicBtn").addEventListener("click", toggleMusic);

/* MISIONES DIARIAS */

const missions = [
  { id: "games", title: "Completa 2 partidas", goal: 2, reward: 20 },
  { id: "hits", title: "Consigue 20 aciertos", goal: 20, reward: 25 },
  { id: "accuracy", title: "Alcanza 85% de precisión", goal: 85, reward: 30 },
  { id: "phrases", title: "Escribe 3 frases", goal: 3, reward: 25 }
];

function updateMissions() {
  missions.forEach(mission => {
    const value = data.daily[mission.id] || 0;

    if (value >= mission.goal && !data.daily.claimed.includes(mission.id)) {
      data.daily.claimed.push(mission.id);
      data.coins += mission.reward;
    }
  });
}

function renderMissions() {
  const container = $("missionList");
  container.innerHTML = "";

  missions.forEach(mission => {
    const value = Math.min(data.daily[mission.id] || 0, mission.goal);
    const complete = data.daily.claimed.includes(mission.id);
    const percent = Math.round((value / mission.goal) * 100);

    const item = document.createElement("div");
    item.className = "mission";

    const heading = document.createElement("div");
    heading.className = "mission-head";

    const title = document.createElement("strong");
    title.textContent = mission.title;

    const reward = document.createElement("span");
    reward.textContent = complete ? "✅ Completada" : "🪙 " + mission.reward;

    heading.append(title, reward);

    const progress = document.createElement("div");
    progress.className = "progress";

    const bar = document.createElement("div");
    bar.style.width = percent + "%";

    progress.appendChild(bar);

    const description = document.createElement("small");
    description.textContent = value + " / " + mission.goal;

    item.append(heading, progress, description);
    container.appendChild(item);
  });
}

/* MASCOTAS */

function getPetEvolution() {
  if (data.xp >= 1000) return 3;
  if (data.xp >= 300) return 2;
  return 1;
}

function renderPets() {
  const pet = pets[data.selectedPet] || pets[0];

  $("activePet").textContent = pet[1];
  $("activePetName").textContent = pet[0];
  $("petEvolution").textContent = "Nivel de evolución: " + getPetEvolution();

  const grid = $("petGrid");
  grid.innerHTML = "";

  pets.forEach((item, index) => {
    const owned = data.ownedPets.includes(index);
    const selected = data.selectedPet === index;

    const button = document.createElement("button");
    button.className = "pet-card" + (selected ? " selected" : "");
    button.disabled = selected;

    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = item[1];

    const name = document.createElement("strong");
    name.textContent = item[0];

    const price = document.createElement("small");
    price.textContent = selected ? "Activa" :
      owned ? "Desbloqueada" : "🪙 " + item[2];

    button.append(emoji, name, price);

    button.addEventListener("click", () => {
      if (owned) {
        data.selectedPet = index;
      } else if (data.coins >= item[2]) {
        data.coins -= item[2];
        data.ownedPets.push(index);
        data.selectedPet = index;
      } else {
        alert("Todavía no tienes suficientes monedas.");
        return;
      }

      saveData();
      renderDashboard();
    });

    grid.appendChild(button);
  });
}

/* RANKING LOCAL */

function renderRanking() {
  const list = $("rankingList");
  list.innerHTML = "";

  const ranking = [
    { name: "Tú", score: data.record },
    ...data.history.map((item, index) => ({
      name: "Partida " + (index + 1),
      score: item.score
    }))
  ].sort((a, b) => b.score - a.score);

  ranking.slice(0, 10).forEach((player, index) => {
    const li = document.createElement("li");
    li.textContent =
      ["🥇", "🥈", "🥉"][index] || (index + 1) + ".";

    li.textContent += " " + player.name + " — " + player.score + " puntos";
    list.appendChild(li);
  });
}

/* LOGROS Y TROFEOS */

const achievements = [
  { id: "first", name: "Primera partida", icon: "🎮", test: () => data.games >= 1 },
  { id: "five", name: "Cinco partidas", icon: "⭐", test: () => data.games >= 5 },
  { id: "ten", name: "Diez partidas", icon: "🏅", test: () => data.games >= 10 },
  { id: "hundred", name: "Cien aciertos", icon: "🎯", test: () => data.totalHits >= 100 },
  { id: "fast", name: "Velocidad experta", icon: "⚡", test: () => data.bestPPM >= 40 },
  { id: "pet", name: "Coleccionista", icon: "🐾", test: () => data.ownedPets.length >= 10 },
  { id: "xp", name: "Gran experiencia", icon: "💎", test: () => data.xp >= 500 },
  { id: "coins", name: "Ahorrista", icon: "🪙", test: () => data.coins >= 100 },
  { id: "accuracy", name: "Precisión perfecta", icon: "🎯", test: () => data.history.some(item => item.accuracy === 100) }
];

function checkAchievements() {
  achievements.forEach(item => {
    if (item.test() && !data.achievements.includes(item.id)) {
      data.achievements.push(item.id);
      data.coins += 15;
    }
  });
}

function renderAchievements() {
  const grid = $("achievementList");
  grid.innerHTML = "";

  achievements.forEach(item => {
    const unlocked = data.achievements.includes(item.id);

    const card = document.createElement("div");
    card.className = "achievement" + (unlocked ? " unlocked" : "");

    const icon = document.createElement("span");
    icon.textContent = item.icon;

    const name = document.createElement("strong");
    name.textContent = item.name;

    const status = document.createElement("p");
    status.textContent = unlocked ? "Desbloqueado" : "Bloqueado";

    card.append(icon, name, status);
    grid.appendChild(card);
  });
}

/* RULETA DE PREMIOS */

$("spinBtn").addEventListener("click", () => {
  if (game.spun) {
    $("spinResult").textContent = "Ya utilizaste la ruleta en esta partida.";
    return;
  }

  const prizes = [5, 10, 15, 20, 25, 30, 40, 50];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  game.spun = true;
  data.coins += prize;

  $("spinResult").textContent = "🎉 ¡Ganaste " + prize + " monedas!";
  $("spinBtn").disabled = true;

  saveData();
  renderDashboard();
});

/* INICIO */

renderDashboard();
updateGameDisplay();
