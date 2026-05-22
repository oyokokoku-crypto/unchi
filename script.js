const ASSETS = {
  baby: "assets/baby.png",
  childGood: "assets/child_good.png",
  childBad: "assets/child_bad.png",
  adultHealthy: "assets/adult_healthy.png",
  adultHard: "assets/adult_hard.png",
  adultLoose: "assets/adult_loose.png",
  adultWarning: "assets/adult_warning.png",
};

const characterClasses = [
  "baby",
  "child",
  "adult",
  "child-good",
  "child-bad",
  "adult-healthy",
  "adult-hard",
  "adult-loose",
  "adult-warning",
];

const initialScores = {
  water: 0,
  fiber: 0,
  ferment: 0,
  exercise: 0,
  sleep: 0,
  junk: 0,
  latenight: 0,
};

const actions = {
  water: {
    label: "水を飲む",
    score: { water: 2 },
    comment: "水分補給ばっちり！",
  },
  fiber: {
    label: "野菜を食べる",
    score: { fiber: 2 },
    comment: "食物繊維をゲット！",
  },
  ferment: {
    label: "発酵食品を食べる",
    score: { ferment: 2 },
    comment: "発酵パワー！",
  },
  snack: {
    label: "お菓子を食べる",
    score: { junk: 2 },
    comment: "あまいもの。食べすぎ注意！",
  },
  fried: {
    label: "唐揚げを食べる",
    score: { junk: 2 },
    comment: "こってり。続くと重いかも？",
  },
  walk: {
    label: "散歩する",
    score: { exercise: 2 },
    comment: "歩いておなかスッキリ！",
  },
  sleep: {
    label: "しっかり寝る",
    score: { sleep: 2 },
    comment: "よく寝て回復！",
  },
  latenight: {
    label: "夜更かしする",
    score: { latenight: 2 },
    comment: "夜更かしで少し眠そう…",
  },
};

const categories = [
  { label: "食べる・飲む", actionIds: ["water", "fiber", "ferment", "snack", "fried"] },
  { label: "動く", actionIds: ["walk"] },
  { label: "休む", actionIds: ["sleep", "latenight"] },
];

const el = {
  shell: document.getElementById("gameShell"),
  day: document.getElementById("dayLabel"),
  title: document.getElementById("mainTitle"),
  image: document.getElementById("characterImage"),
  name: document.getElementById("characterName"),
  message: document.getElementById("messageText"),
  choices: document.getElementById("choices"),
  note: document.getElementById("noteText"),
  sparkles: document.getElementById("sparkles"),
  daySplash: document.getElementById("daySplash"),
  sound: document.getElementById("soundToggle"),
};

let state = createInitialState();
let dayIntroTimer = null;

const bgm = {
  context: null,
  master: null,
  timer: null,
  step: 0,
  enabled: true,
};

const melody = [
  "C5", "E5", "G5", "E5",
  "A5", "G5", "E5", "C5",
  "D5", "F5", "A5", "F5",
  "G5", null, "E5", null,
];

const bass = ["C3", null, "G3", null, "A3", null, "E3", null, "F3", null, "C3", null, "G3", null, "C3", null];

const noteFreq = {
  C3: 130.81,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
};

function createInitialState() {
  return {
    screen: "start",
    day: 1,
    scores: { ...initialScores },
    history: [],
    childVariant: "good",
  };
}

function goodScore() {
  const { water, fiber, ferment, exercise, sleep } = state.scores;
  return water + fiber + ferment + exercise + sleep;
}

function unstableScore() {
  const { junk, latenight } = state.scores;
  return junk + latenight;
}

function getCurrentCharacter() {
  if (state.day <= 2) {
    return {
      src: ASSETS.baby,
      name: "ベビーうんちっち",
      alt: "ベビーうんちっち",
      stage: "baby",
      id: "baby",
    };
  }

  const isGood = state.childVariant === "good";
  return {
    src: isGood ? ASSETS.childGood : ASSETS.childBad,
    name: isGood ? "すくすくうんちっち" : "しょんぼりうんちっち",
    alt: isGood ? "すくすくうんちっち" : "しょんぼりうんちっち",
    stage: "child",
    id: isGood ? "child-good" : "child-bad",
  };
}

function updateChildVariant() {
  state.childVariant = goodScore() >= unstableScore() ? "good" : "bad";
}

function setCharacter(character, isResult = false) {
  el.image.src = character.src;
  el.image.alt = character.alt || character.name;
  el.name.textContent = character.name;
  el.image.classList.remove(...characterClasses);
  el.image.classList.add(isResult ? "adult" : character.stage || "baby");
  if (character.id) el.image.classList.add(character.id);
}

function setButtons(buttons, isGrid = false) {
  el.choices.innerHTML = "";
  el.choices.classList.toggle("grid", isGrid);

  buttons.forEach((button) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `choice-btn${button.primary ? " primary" : ""}`;
    node.textContent = button.label;
    node.addEventListener("click", () => {
      playButtonSound(button.sound || getButtonSound(button.label));
      button.onClick();
    });
    el.choices.appendChild(node);
  });
}

function renderStart() {
  state.screen = "start";
  hideDayIntro();
  el.message.parentElement.classList.remove("result-mode");
  el.day.textContent = "START";
  el.title.textContent = "うんちっち育成ゲーム";
  setCharacter({ src: ASSETS.baby, name: "ベビーうんちっち", alt: "ベビーうんちっち", stage: "baby", id: "baby" });
  el.message.textContent = "7日間で進化するよ！";
  el.note.textContent = "医療診断ではありません。観察のきっかけとして楽しんでね。";
  setButtons([{ label: "ゲームスタート", primary: true, onClick: startGame }]);
}

function startGame() {
  state = createInitialState();
  startBgm();
  renderDay({ showIntro: true });
}

function renderDay(options = {}) {
  const { showIntro = false } = options;
  state.screen = "day";
  el.message.parentElement.classList.remove("result-mode");
  if (state.day >= 3) updateChildVariant();
  pulseFade();
  const character = getCurrentCharacter();

  el.day.textContent = `${state.day}日目 / 7日目`;
  el.title.textContent = "今日はどう過ごす？";
  setCharacter(character);
  el.message.textContent = "";
  el.note.textContent = "";
  setButtons(
    categories.map((category) => ({
      label: category.label,
      primary: category.label === "食べる・飲む",
      onClick: () => renderActionChoices(category),
    }))
  );
  if (showIntro) {
    showDayIntro();
  } else {
    hideDayIntro();
  }
}

function renderActionChoices(category) {
  hideDayIntro();
  el.message.textContent = "";
  el.note.textContent = "";
  setButtons([
    ...category.actionIds.map((id) => ({
      label: actions[id].label,
      onClick: () => chooseAction(id),
    })),
    { label: "もどる", onClick: () => renderDay({ showIntro: false }) },
  ], category.actionIds.length >= 4);
}

function chooseAction(actionId) {
  const action = actions[actionId];
  Object.entries(action.score).forEach(([key, value]) => {
    state.scores[key] += value;
  });
  state.history.push({ day: state.day, actionId });

  el.image.classList.remove("bounce");
  void el.image.offsetWidth;
  el.image.classList.add("bounce");
  window.setTimeout(() => el.image.classList.remove("bounce"), 560);
  el.message.textContent = action.comment;
  el.note.textContent = "";

  setButtons([
    {
      label: state.day === 7 ? "最終進化へ" : "次の日へ",
      primary: true,
      onClick: advanceDay,
    },
  ]);
}

function advanceDay() {
  if (state.day === 7) {
    renderResult();
    return;
  }

  state.day += 1;

  if (state.day === 3) {
    updateChildVariant();
    renderEvolution();
    return;
  }

  renderDay({ showIntro: true });
}

function renderEvolution() {
  el.message.parentElement.classList.remove("result-mode");
  pulseFade();
  const character = getCurrentCharacter();
  el.day.textContent = `${state.day}日目 / 7日目`;
  el.title.textContent = "うんちっちが進化した！";
  setCharacter(character);
  el.message.textContent = "うんちっちが進化した！";
  el.note.textContent = "";
  setButtons([{ label: "育成をつづける", primary: true, onClick: () => renderDay({ showIntro: false }) }]);
  showDayIntro(() => showSparkles());
}

function getFinalResult() {
  const scores = state.scores;
  const good = goodScore();
  const junkAndLate = scores.junk + scores.latenight;
  const hardPattern = scores.water === 0 || scores.fiber === 0 || (scores.water <= 2 && scores.fiber <= 2 && good < 8);

  if (scores.latenight >= 5 || junkAndLate >= 8) {
    return {
      src: ASSETS.adultWarning,
      name: "くろもやうんちっち",
      type: "黒っぽい・要チェック",
      description: "続く色は大事なサインかも。",
      advice: "専門家へ相談を。",
      stage: "adult",
      id: "adult-warning",
    };
  }

  if (scores.junk >= 5 || good <= 5) {
    return {
      src: ASSETS.adultLoose,
      name: "どろりんうんちっち",
      type: "黄色っぽい・ゆるめ",
      description: "食べすぎやリズムに注意。",
      advice: "休む時間も大切に。",
      stage: "adult",
      id: "adult-loose",
    };
  }

  if (hardPattern) {
    return {
      src: ASSETS.adultHard,
      name: "カチコロうんちっち",
      type: "こげ茶・カチカチタイプ",
      description: "水分や野菜が少なめかも。",
      advice: "水・野菜・散歩を。",
      stage: "adult",
      id: "adult-hard",
    };
  }

  return {
    src: ASSETS.adultHealthy,
    name: "つるりんバナナうんちっち",
    type: "茶色・健康タイプ",
    description: "バランスがいい感じ！",
    advice: "色と形を見てみよう。",
    stage: "adult",
    id: "adult-healthy",
  };
}

function renderResult() {
  state.screen = "result";
  hideDayIntro();
  el.message.parentElement.classList.add("result-mode");
  pulseFade();
  showSparkles();
  const result = getFinalResult();

  el.day.textContent = "最終進化！";
  el.title.textContent = "最終進化！";
  setCharacter({ ...result, alt: result.name }, true);
  el.message.innerHTML = `<strong>${result.type}</strong><br>${result.description}<br>${result.advice}`;
  el.note.textContent = "";
  setButtons([{ label: "もう一度育てる", primary: true, onClick: renderStart }]);
}

function showDayIntro(onDone) {
  window.clearTimeout(dayIntroTimer);
  el.daySplash.textContent = `${state.day}日目`;
  el.shell.classList.add("show-day-intro");
  dayIntroTimer = window.setTimeout(() => {
    el.shell.classList.remove("show-day-intro");
    if (onDone) onDone();
  }, 950);
}

function hideDayIntro() {
  window.clearTimeout(dayIntroTimer);
  dayIntroTimer = null;
  el.shell.classList.remove("show-day-intro");
}

function showSparkles() {
  el.sparkles.classList.remove("show");
  void el.sparkles.offsetWidth;
  el.sparkles.classList.add("show");
}

function pulseFade() {
  el.shell.classList.remove("fade");
  void el.shell.offsetWidth;
  el.shell.classList.add("fade");
}

renderStart();

el.sound.addEventListener("click", toggleBgm);

function setupBgm() {
  if (bgm.context) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    bgm.enabled = false;
    updateSoundButton();
    return;
  }

  bgm.context = new AudioContext();
  bgm.master = bgm.context.createGain();
  bgm.master.gain.value = 0.055;
  bgm.master.connect(bgm.context.destination);
}

function startBgm() {
  if (!bgm.enabled) return;
  setupBgm();
  if (!bgm.context) return;

  bgm.context.resume();
  if (bgm.timer) return;

  playBgmStep();
  bgm.timer = window.setInterval(playBgmStep, 245);
  updateSoundButton();
}

function stopBgm() {
  window.clearInterval(bgm.timer);
  bgm.timer = null;
  updateSoundButton();
}

function toggleBgm() {
  const shouldEnable = !bgm.enabled;
  if (shouldEnable) {
    bgm.enabled = true;
    startBgm();
    playButtonSound("toggle-on");
  } else {
    playButtonSound("toggle-off");
    bgm.enabled = false;
    stopBgm();
  }
}

function updateSoundButton() {
  el.sound.classList.toggle("is-off", !bgm.enabled);
  el.sound.setAttribute("aria-pressed", String(bgm.enabled));
  el.sound.setAttribute("aria-label", bgm.enabled ? "BGMをオフにする" : "BGMをオンにする");
}

function playBgmStep() {
  if (!bgm.context || !bgm.master || !bgm.enabled) return;
  const time = bgm.context.currentTime;
  const melodyNote = melody[bgm.step % melody.length];
  const bassNote = bass[bgm.step % bass.length];

  if (melodyNote) playTone(noteFreq[melodyNote], time, 0.16, "triangle", 0.55);
  if (bassNote) playTone(noteFreq[bassNote], time, 0.2, "sine", 0.22);
  if (bgm.step % 8 === 6) playTone(noteFreq.C5, time + 0.07, 0.08, "square", 0.12);

  bgm.step += 1;
}

function getButtonSound(label) {
  if (label === "ゲームスタート" || label === "もう一度育てる") return "start";
  if (label === "次の日へ" || label === "最終進化へ" || label === "育成をつづける") return "next";
  if (label === "もどる") return "back";
  return "select";
}

function playButtonSound(type = "select") {
  if (!bgm.enabled) return;
  setupBgm();
  if (!bgm.context || !bgm.master) return;
  bgm.context.resume();

  const time = bgm.context.currentTime;
  const patterns = {
    start: [
      [noteFreq.C5, 0, 0.07, "square", 0.48],
      [noteFreq.G5, 0.065, 0.09, "triangle", 0.5],
    ],
    select: [
      [noteFreq.E5, 0, 0.045, "square", 0.34],
      [noteFreq.G5, 0.04, 0.055, "triangle", 0.32],
    ],
    next: [
      [noteFreq.C5, 0, 0.055, "square", 0.36],
      [noteFreq.E5, 0.05, 0.06, "square", 0.36],
      [noteFreq.A5, 0.1, 0.075, "triangle", 0.4],
    ],
    back: [
      [noteFreq.G5, 0, 0.055, "triangle", 0.32],
      [noteFreq.D5, 0.05, 0.07, "square", 0.28],
    ],
    "toggle-on": [
      [noteFreq.C5, 0, 0.06, "sine", 0.35],
      [noteFreq.E5, 0.05, 0.08, "triangle", 0.36],
    ],
    "toggle-off": [
      [noteFreq.E5, 0, 0.055, "triangle", 0.3],
      [noteFreq.C5, 0.05, 0.075, "sine", 0.28],
    ],
  };

  (patterns[type] || patterns.select).forEach(([frequency, offset, duration, wave, volume]) => {
    playTone(frequency, time + offset, duration, wave, volume);
  });
}

function playTone(frequency, time, duration, type, volume) {
  const oscillator = bgm.context.createOscillator();
  const gain = bgm.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain);
  gain.connect(bgm.master);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.03);
}
