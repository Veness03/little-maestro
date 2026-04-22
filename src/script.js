/**
 * Little Maestro - Music for Kids
 * Vanilla JavaScript Logic
 */

// --- STATE MANAGEMENT ---
let currentLanguage = 'en';
let currentLessonState = null; // { type, level }

function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(el => {
        const enText = el.getAttribute('data-en');
        const cnText = el.getAttribute('data-cn');
        if (currentLanguage === 'zh') {
            el.innerHTML = cnText || enText;
        } else {
            el.innerHTML = enText;
        }
    });

    // Also update any dynamic titles/content if currently in a lesson
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'lesson-page' && currentLessonState) {
        // Re-run openLesson to refresh dynamic interactive content
        // We pass true for skipNav to avoid infinite recursion
        openLesson(currentLessonState.type, currentLessonState.level, false, true);
    }
}

// --- NEW CODE: Visual Effects & Sound ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function initVisualEffects() {
    const bg = document.getElementById('ambient-background');
    const notes = ['♩', '♪', '♫', '♬', '♭', '♮', '♯'];
    
    setInterval(() => {
        const note = document.createElement('div');
        note.className = 'floating-note';
        note.innerText = notes[Math.floor(Math.random() * notes.length)];
        note.style.left = Math.random() * 100 + 'vw';
        note.style.fontSize = (Math.random() * 2 + 0.8) + 'rem';
        note.style.transform = `rotate(${Math.random() * 360}deg)`;
        bg.appendChild(note);
        
        setTimeout(() => note.remove(), 25000);
    }, 1500);

    // Global Click Listener for Sounds & Sparkles
    document.addEventListener('click', (e) => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Sound
        if (e.target.closest('button') || e.target.closest('.theory-card') || e.target.closest('.key')) {
            playClickSound();
            createSparkle(e.clientX, e.clientY);
        }
    });
}

function createSparkle(x, y) {
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.setProperty('--dx', (Math.random() - 0.5) * 100 + 'px');
        sparkle.style.setProperty('--dy', (Math.random() - 0.5) * 100 + 'px');
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 800);
    }
}

const translations = {
    en: {
        "app-title": "Little Maestro",
        "landing-subtitle": "Pick your musical path!",
        "music-theory": "Music Theory",
        "vision-singing": "Vision Singing",
        "go-arcade": "Go to Arcade 🎮",
        "back": "Back",
        "score": "Score",
        "combo": "Combo",
        "start-game": "Start Game!",
        "tap-btn": "⭐<br>TAP",
        "clap-btn": "👏<br>TAP",
        "hold-btn": "🔥<br>HOLD",
        "shake-btn": "✨<br>SHAKE",
        "star-instructions": "Buttons or Keys: Space, C, H, S",
        "piano-practice": "Piano Practice",
        "choose-song": "Choose a song:",
        "song-none": "Free Play",
        "song-twinkle": "Twinkle Twinkle",
        "song-mary": "Mary Had a Little Lamb",
        "song-jingle": "Jingle Bells",
        "listen-btn": "Listen 🔊",
        "practice-btn": "Practice 🎹",
        "piano-play-instr": "Click the keys to play!",
        "music-adventure": "Music Adventure",
        "story-time": "Story Time",
        "story-desc": "Meet the Note Family!",
        "lets-go": "Let's Go!",
        "note-ladders": "Note Ladders",
        "note-ladders-desc": "Climb up and down!",
        "play": "Play!",
        "secret-signs": "Secret Signs",
        "secret-signs-desc": "Musical magic codes!",
        "explore": "Explore!",
        "star-quest": "Star Quest",
        "star-quest-desc": "Can you find the notes?",
        "start": "Start!",
        "sight-singing": "Sight Singing",
        "start-metronome": "Start Metronome",
        "stop-metronome": "Stop Metronome",
        "melody-practice": "Melody Practice",
        "melody-practice-desc": "Follow the notes!",
        "interval-training": "Interval Training",
        "interval-training-desc": "High or Low?",
        "pitch-game": "Pitch Game",
        "pitch-start-msg": "Press Play to Start!",
        "play-note-btn": "Play Note 🔊",
        "rhythm-practice": "Rhythm Practice",
        "rhythm-start-msg": "Listen and Repeat!",
        "listen-emoji-btn": "Listen 👂",
        "tap-me-btn": "TAP ME! 🥁",
        "trophy-room": "Trophy Room",
        "score-1st": "1st Place",
        "score-2nd": "2nd Place",
        "score-3rd": "3rd Place",
        "reset-trophies": "Reset Trophies",
        "theory-lv1": "Level 1: Introduction to Staff",
        "theory-lv2": "Level 2: Meet the Notes",
        "theory-lv3": "Level 3: Names and Values",
        "theory-lv4": "Level 4: Musical Symbols",
        "theory-lv5": "Level 5: Bars and Bar Lines",
        "vision-lv1": "Level 1: Sound of Music (Do Re Mi)",
        "vision-lv2": "Level 2: Simple Melody",
        "vision-lv3": "Level 3: Beat",
        "vision-lv4": "Level 4: Sing the Rhythm",
        "vision-lv5": "Level 5: Rhythm Practice",
        "arcade-subtitle": "Let's make some music!",
        "arcade-title": "Music Arcade",
        "done": "Done!",
        "ready-next": "Ready for the next step?",
        "piano-follow-instr": "Follow the yellow keys!",
        "piano-free-instr": "Click the keys to play!",
        "piano-finish-msg": "🎉 You finished the song! Great job!",
        "pitch-question": "Which note was that?",
        "pitch-correct": "🌟 Correct! You're a star!",
        "pitch-wrong": "❌ Try again! Listen closely.",
        "rhythm-listen": "Listening...",
        "rhythm-turn": "Your turn! Tap the drum!",
        "rhythm-great": "🥁 Great rhythm! Boom-tap!",
        "rhythm-slow": "🐢 A bit slow! Try again!",
        "mascot-cheer": "You can do it! Go go go!",
        "mascot-msg1": "Ready to discover the magic of music?",
        "mascot-msg2": "Which adventure should we start today?",
        "mascot-msg3": "I love learning new notes with you!",
        "mascot-msg4": "You're becoming a real Little Maestro!",
        "story-match-title": "Match the Note!",
        "story-feedback-correct": "🌟 Perfect Match!",
        "story-feedback-wrong": "❌ Try another one!",
        "ladder-climb-title": "Climb the Ladder!",
        "ladder-feedback-top": "🪜 You reached the top!",
        "ladder-feedback-wrong": "Oops! Start from the bottom.",
        "signs-find-title": "Find the",
        "signs-feedback-found": "✨ You found the magic sign!",
        "signs-feedback-wrong": "Not that one! Look again.",
        "quest-tap-title": "Tap the Star 5 times!",
        "quest-feedback-win": "🏆 Quest Complete!",
        "star-miss": "MISS"
    },
    zh: {
        "app-title": "小小大宗师",
        "landing-subtitle": "开启你的音乐之旅！",
        "music-theory": "音乐理论",
        "vision-singing": "视唱练习",
        "go-arcade": "去游乐场 🎮",
        "back": "返回",
        "score": "得分",
        "combo": "连击",
        "start-game": "开始游戏！",
        "tap-btn": "⭐<br>点击",
        "clap-btn": "👏<br>点击",
        "hold-btn": "🔥<br>按住",
        "shake-btn": "✨<br>摇动",
        "star-instructions": "按键或按钮: 空格, C, H, S",
        "piano-practice": "钢琴练习",
        "choose-song": "选择歌曲:",
        "song-none": "自由演奏",
        "song-twinkle": "小星星",
        "song-mary": "玛丽有只小绵羊",
        "song-jingle": "铃儿响叮当",
        "listen-btn": "聆听 🔊",
        "practice-btn": "练习 🎹",
        "piano-play-instr": "点击琴键开始演奏！",
        "music-adventure": "音乐大冒险",
        "story-time": "故事时间",
        "story-desc": "认识音符家族！",
        "lets-go": "出发！",
        "note-ladders": "音符音阶",
        "note-ladders-desc": "向上爬，向下爬！",
        "play": "开始！",
        "secret-signs": "神秘符号",
        "secret-signs-desc": "音乐魔法代码！",
        "explore": "探索！",
        "star-quest": "星际任务",
        "star-quest-desc": "你能找到这些音符吗？",
        "start": "开始！",
        "sight-singing": "视唱",
        "start-metronome": "开启节拍器",
        "stop-metronome": "停止节拍器",
        "melody-practice": "旋律练习",
        "melody-practice-desc": "跟着音符唱！",
        "interval-training": "音程训练",
        "interval-training-desc": "高还是低？",
        "pitch-game": "听音游戏",
        "pitch-start-msg": "点击播放开始！",
        "play-note-btn": "播放音符 🔊",
        "rhythm-practice": "节奏练习",
        "rhythm-start-msg": "听并重复！",
        "listen-emoji-btn": "聆听 👂",
        "tap-me-btn": "点我！ 🥁",
        "trophy-room": "奖杯室",
        "score-1st": "第一名",
        "score-2nd": "第二名",
        "score-3rd": "第三名",
        "reset-trophies": "重置奖杯",
        "theory-lv1": "第一关: 认识五线谱",
        "theory-lv2": "第二关: 认识音符",
        "theory-lv3": "第三关: 音符的名称与时值",
        "theory-lv4": "第四关: 音乐中的符号",
        "theory-lv5": "第五关: 小节与小节线",
        "vision-lv1": "第一关: 音乐之声 (Do Re Mi)",
        "vision-lv2": "第二关: 简单旋律",
        "vision-lv3": "第三关: 拍子",
        "vision-lv4": "第四关: 唱节奏",
        "vision-lv5": "第五关: 节奏综合练习",
        "arcade-subtitle": "一起来玩音乐吧！",
        "arcade-title": "音乐游乐场",
        "done": "完成！",
        "ready-next": "准备好进行下一步了吗？",
        "piano-follow-instr": "跟着黄色琴键弹奏！",
        "piano-free-instr": "点击琴键开始演奏！",
        "piano-finish-msg": "🎉 你完成了这首歌！太棒了！",
        "pitch-question": "刚才那是哪个音？",
        "pitch-correct": "🌟 答对了！你真棒！",
        "pitch-wrong": "❌ 再试一次！仔细听。",
        "rhythm-listen": "聆听中...",
        "rhythm-turn": "轮到你了！点击鼓面！",
        "rhythm-great": "🥁 节奏感太棒了！",
        "rhythm-slow": "🐢 有一点慢哦！再试一次！",
        "mascot-cheer": "你能做到的！加油加油！",
        "mascot-msg1": "准备好探索音乐的奥秘了吗？",
        "mascot-msg2": "今天我们从哪个大冒险开始呢？",
        "mascot-msg3": "我最喜欢和你一起学习新音符了！",
        "mascot-msg4": "你正在成为一名真正的音乐大宗师！",
        "story-match-title": "匹配音符！",
        "story-feedback-correct": "🌟 完美匹配！",
        "story-feedback-wrong": "❌ 选错啦，再选一个！",
        "ladder-climb-title": "爬音阶！",
        "ladder-feedback-top": "🪜 你到达顶端啦！",
        "ladder-feedback-wrong": "噢！要从最下面开始哦。",
        "signs-find-title": "找到",
        "signs-feedback-found": "✨ 你找到了魔法符号！",
        "signs-feedback-wrong": "不是这个！再找找。",
        "quest-tap-title": "点击星星5次！",
        "quest-feedback-win": "🏆 任务完成！",
        "star-miss": "没打中"
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

function setLanguage(lang) {
    currentLanguage = lang;
    
    // Call the new attribute-based update
    updateLanguage();

    // Keep compatibility with existing translations object for data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Update active state on language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`lang-${lang === 'en' ? 'en' : 'zh'}`);
    if (btn) btn.classList.add('active');

    // Refresh current page if needed
    updateDynamicLocalization();
}

function updateDynamicLocalization() {
    // Refresh mascot bubble if on Theory Page
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'theory-page') {
        const bubble = document.querySelector('.bubble');
        if (bubble) {
            const mascotKeys = ["mascot-msg1", "mascot-msg2", "mascot-msg3", "mascot-msg4"];
            bubble.innerText = t(mascotKeys[Math.floor(Math.random() * mascotKeys.length)]);
        }
    }
}

let currentScore = {
    pitch: 0,
    rhythm: 0
};

let metronomeInterval = null;
let isMetronomePlaying = false;

// --- NAVIGATION ---
function navigateTo(pageId) {
    // Close any open mini-games
    closeMiniGame();

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // ALWAYS ensure language is up to date on navigation
    updateLanguage();

    // Clean up Vision Singing intervals
    if (window._visionInterval) clearInterval(window._visionInterval);
    if (window._visionTimeouts) window._visionTimeouts.forEach(clearTimeout);
    window._visionTimeouts = [];

    // Mascot logic for Theory Page
    if (pageId === 'theory-page') {
        const mascotKeys = ["mascot-msg1", "mascot-msg2", "mascot-msg3", "mascot-msg4"];
        const bubble = document.querySelector('.bubble');
        if (bubble) {
            bubble.innerText = t(mascotKeys[Math.floor(Math.random() * mascotKeys.length)]);
        }
    }

    // Stop metronome if navigating away from sight singing
    if (pageId !== 'sight-singing') {
        stopMetronome();
    }
}

// --- AUDIO ENGINE (Web Audio API) ---
const noteSVGs = {
    whole: '<svg viewBox="0 0 100 60" style="width:100%;height:100%"><ellipse cx="50" cy="30" rx="35" ry="22" stroke="currentColor" stroke-width="10" fill="none"/></svg>',
    half: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><ellipse cx="40" cy="90" rx="25" ry="18" stroke="currentColor" stroke-width="10" fill="none"/><line x1="62" y1="90" x2="62" y2="20" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>',
    quarter: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><ellipse cx="40" cy="90" rx="25" ry="18" fill="currentColor"/><line x1="62" y1="90" x2="62" y2="20" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>',
    eighth: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><ellipse cx="40" cy="90" rx="25" ry="18" fill="currentColor"/><line x1="62" y1="90" x2="62" y2="20" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><path d="M62,20 Q85,30 85,60" stroke="currentColor" stroke-width="10" fill="none" stroke-linecap="round"/></svg>',
    sharp: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><line x1="35" y1="10" x2="35" y2="110" stroke="currentColor" stroke-width="8"/><line x1="65" y1="10" x2="65" y2="110" stroke="currentColor" stroke-width="8"/><line x1="10" y1="45" x2="90" y2="35" stroke="currentColor" stroke-width="12"/><line x1="10" y1="85" x2="90" y2="75" stroke="currentColor" stroke-width="12"/></svg>',
    flat: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><line x1="30" y1="10" x2="30" y2="110" stroke="currentColor" stroke-width="8"/><path d="M30,110 Q80,110 80,80 Q80,50 30,70" stroke="currentColor" stroke-width="10" fill="none"/></svg>',
    natural: '<svg viewBox="0 0 100 120" style="width:100%;height:100%"><line x1="35" y1="10" x2="35" y2="90" stroke="currentColor" stroke-width="8"/><line x1="65" y1="30" x2="65" y2="110" stroke="currentColor" stroke-width="8"/><line x1="35" y1="40" x2="65" y2="30" stroke="currentColor" stroke-width="8"/><line x1="35" y1="90" x2="65" y2="80" stroke="currentColor" stroke-width="8"/></svg>'
};

function getNoteSVG(type) {
    return `<div class="note-svg-container">${noteSVGs[type] || ''}</div>`;
}

// Simple Autocorrelation algorithm for pitch detection
function getPitchSample(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Silent

    let correlations = new Float32Array(SIZE);
    for (let offset = 0; offset < SIZE / 2; offset++) {
        let correlation = 0;
        for (let i = 0; i < SIZE / 2; i++) {
            correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        correlations[offset] = correlation;
    }

    let d = 0;
    while (correlations[d] < correlations[d + 1]) d++;
    let minValue = 1e10, minPos = -1;
    for (let i = d; i < SIZE / 2; i++) {
        if (correlations[i] < minValue) {
            minValue = correlations[i];
            minPos = i;
        }
    }
    return sampleRate / minPos;
}

const frequencies = {
    'C': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88,
    'C2': 523.25
};

function playNote(freq, duration = 0.5) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; // Soft sound for kids
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- PIANO GENERATION & PRACTICE ---
const songs = {
    twinkle: ['C', 'C', 'G', 'G', 'A', 'A', 'G', 'F', 'F', 'E', 'E', 'D', 'D', 'C'],
    mary: ['E', 'D', 'C', 'D', 'E', 'E', 'E', 'D', 'D', 'D', 'E', 'G', 'G'],
    jingle: ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'G', 'C', 'D', 'E']
};

let currentSong = null;
let songStep = 0;
let isPracticeMode = false;

function setupPiano() {
    const piano = document.getElementById('piano-keyboard');
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
    const blackNotes = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

    notes.forEach((note, index) => {
        const key = document.createElement('div');
        key.className = 'key white';
        key.dataset.note = note;
        key.onpointerdown = (e) => {
            e.preventDefault();
            playNote(frequencies[note]);
            highlightKey(key);
            if (isPracticeMode) checkPracticeNote(note);
        };
        piano.appendChild(key);

        // Add black keys
        if (blackNotes[note] && index < notes.length - 1) {
            const bKey = document.createElement('div');
            bKey.className = 'key black';
            bKey.dataset.note = blackNotes[note];
            const offset = (index + 1) * (100 / notes.length) - 3;
            bKey.style.left = `${offset}%`;
            bKey.onpointerdown = (e) => {
                e.stopPropagation();
                e.preventDefault();
                playNote(frequencies[blackNotes[note]]);
                highlightKey(bKey);
                if (isPracticeMode) checkPracticeNote(blackNotes[note]);
            };
            piano.appendChild(bKey);
        }
    });

    // Song Controls
    document.getElementById('play-song-btn').onclick = playCurrentSong;
    document.getElementById('start-practice-btn').onclick = startPractice;
    document.getElementById('song-select').onchange = (e) => {
        stopPractice();
        currentSong = songs[e.target.value] || null;
    };
}

function playCurrentSong() {
    const songKey = document.getElementById('song-select').value;
    const song = songs[songKey];
    if (!song) return;

    stopPractice();
    let delay = 0;
    song.forEach((note) => {
        setTimeout(() => {
            playNote(frequencies[note]);
            const key = document.querySelector(`.key[data-note="${note}"]`);
            if (key) highlightKey(key);
        }, delay);
        delay += 500;
    });
}

function startPractice() {
    const songKey = document.getElementById('song-select').value;
    const song = songs[songKey];
    if (!song) {
        alert(t("choose-song"));
        return;
    }

    isPracticeMode = true;
    songStep = 0;
    currentSong = song;
    document.getElementById('piano-instructions').innerText = t("piano-follow-instr");
    showNextGuide();
}

function stopPractice() {
    isPracticeMode = false;
    document.querySelectorAll('.key').forEach(k => k.classList.remove('guide'));
    document.getElementById('piano-instructions').innerText = t("piano-free-instr");
}

function showNextGuide() {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('guide'));
    if (songStep < currentSong.length) {
        const nextNote = currentSong[songStep];
        const key = document.querySelector(`.key[data-note="${nextNote}"]`);
        if (key) key.classList.add('guide');
    } else {
        document.getElementById('piano-instructions').innerText = t("piano-finish-msg");
        isPracticeMode = false;
    }
}

function checkPracticeNote(note) {
    if (note === currentSong[songStep]) {
        songStep++;
        showNextGuide();
    }
}

function highlightKey(key) {
    key.classList.add('active');
    setTimeout(() => key.classList.remove('active'), 200);
}

// --- PITCH GAME ---
let targetPitch = null;
const pitchNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function setupPitchGame() {
    const optionsContainer = document.getElementById('pitch-options');
    pitchNotes.forEach(note => {
        const btn = document.createElement('button');
        btn.className = 'pitch-btn';
        btn.innerText = note;
        btn.onpointerdown = (e) => {
            e.preventDefault();
            checkPitch(note);
        };
        optionsContainer.appendChild(btn);
    });

    document.getElementById('play-pitch-btn').onclick = () => {
        targetPitch = pitchNotes[Math.floor(Math.random() * pitchNotes.length)];
        playNote(frequencies[targetPitch], 1);
        document.getElementById('pitch-feedback').innerText = t("pitch-question");
    };
}

function checkPitch(note) {
    if (!targetPitch) return;
    
    const feedback = document.getElementById('pitch-feedback');
    if (note === targetPitch) {
        feedback.innerText = t("pitch-correct");
        feedback.style.color = "var(--accent-green)";
        currentScore.pitch += 10;
        updateScores();
        targetPitch = null;
    } else {
        feedback.innerText = t("pitch-wrong");
        feedback.style.color = "var(--accent-red)";
        playNote(frequencies[note], 0.3);
    }
}

// --- RHYTHM PRACTICE ---
let rhythmPattern = [];
let userPattern = [];
let isListening = false;

function setupRhythmGame() {
    const playBtn = document.getElementById('play-rhythm-btn');
    const pad = document.getElementById('rhythm-pad');

    playBtn.onclick = () => {
        if (isListening) return;
        generateRhythm();
        playRhythm();
    };

    pad.onpointerdown = (e) => {
        e.preventDefault();
        if (!isListening) return;
        playNote(200, 0.1); // Drum sound
        userPattern.push(Date.now());
        
        if (userPattern.length === rhythmPattern.length) {
            checkRhythm();
        }
    };
}

function generateRhythm() {
    rhythmPattern = [0, 500, 1000, 1500]; // Simple 4 beats
    userPattern = [];
    document.getElementById('rhythm-feedback').innerText = t("rhythm-listen");
}

function playRhythm() {
    isListening = false;
    rhythmPattern.forEach((delay, i) => {
        setTimeout(() => {
            playNote(400, 0.1);
            if (i === rhythmPattern.length - 1) {
                isListening = true;
                document.getElementById('rhythm-feedback').innerText = t("rhythm-turn");
            }
        }, delay);
    });
}

function checkRhythm() {
    isListening = false;
    const feedback = document.getElementById('rhythm-feedback');
    
    // Basic timing check
    let startTime = userPattern[0];
    let relativeUserPattern = userPattern.map(t => t - startTime);
    
    let totalError = 0;
    for (let i = 0; i < rhythmPattern.length; i++) {
        totalError += Math.abs(rhythmPattern[i] - relativeUserPattern[i]);
    }

    if (totalError < 600) { // Very forgiving for kids
        feedback.innerText = t("rhythm-great");
        feedback.style.color = "var(--accent-green)";
        currentScore.rhythm += 10;
        updateScores();
    } else {
        feedback.innerText = t("rhythm-slow");
        feedback.style.color = "var(--accent-orange)";
    }
}

// --- METRONOME ---
function toggleMetronome() {
    const btn = document.getElementById('metronome-toggle');
    if (isMetronomePlaying) {
        stopMetronome();
        btn.innerText = t("start-metronome");
    } else {
        startMetronome();
        btn.innerText = t("stop-metronome");
    }
}

function startMetronome() {
    isMetronomePlaying = true;
    const visual = document.getElementById('metronome-visual');
    metronomeInterval = setInterval(() => {
        playNote(800, 0.05);
        visual.classList.remove('pulse');
        void visual.offsetWidth; // Trigger reflow
        visual.classList.add('pulse');
    }, 1000); // 60 BPM
}

function stopMetronome() {
    isMetronomePlaying = false;
    clearInterval(metronomeInterval);
    document.getElementById('metronome-visual').classList.remove('pulse');
}

// --- TROPHY ROOM & LOCAL STORAGE ---
function updateScores() {
    document.getElementById('pitch-score').innerText = currentScore.pitch;
    document.getElementById('rhythm-score').innerText = currentScore.rhythm;
    
    const total = currentScore.pitch + currentScore.rhythm;
    saveScore(total);
}

function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('maestro-scores') || '[]');
    scores.push({ score, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 3); // Keep top 3
    localStorage.setItem('maestro-scores', JSON.stringify(scores));
    displayTrophies();
}

function displayTrophies() {
    const scores = JSON.parse(localStorage.getItem('maestro-scores') || '[]');
    const pointsLabel = currentLanguage === 'zh' ? ' 分' : ' points';
    document.getElementById('score-1').innerText = (scores[0]?.score || 0) + pointsLabel;
    document.getElementById('score-2').innerText = (scores[1]?.score || 0) + pointsLabel;
    document.getElementById('score-3').innerText = (scores[2]?.score || 0) + pointsLabel;
}

function resetScores() {
    localStorage.removeItem('maestro-scores');
    currentScore = { pitch: 0, rhythm: 0 };
    updateScores();
    displayTrophies();
}

// --- MINI-GAMES LOGIC ---
let gameStars = {
    story: 0,
    ladder: 0,
    signs: 0,
    quest: 0
};

function startMiniGame(type) {
    const overlay = document.getElementById('mini-game-overlay');
    const stage = document.getElementById('game-stage');
    const feedback = document.getElementById('game-feedback');
    
    overlay.classList.add('active');
    feedback.innerText = "";
    stage.innerHTML = "";

    // Mascot cheers
    const mascotBubble = document.querySelector('.bubble');
    if (mascotBubble) {
        mascotBubble.innerText = t("mascot-cheer");
    }

    if (type === 'story') {
        setupStoryGame(stage, feedback);
    } else if (type === 'ladder') {
        setupLadderGame(stage, feedback);
    } else if (type === 'signs') {
        setupSignsGame(stage, feedback);
    } else if (type === 'quest') {
        setupQuestGame(stage, feedback);
    }
}

function closeMiniGame() {
    document.getElementById('mini-game-overlay').classList.remove('active');
    
    // Restore mascot message
    const mascotKeys = ["mascot-msg1", "mascot-msg2", "mascot-msg3", "mascot-msg4"];
    const bubble = document.querySelector('.bubble');
    if (bubble) {
        bubble.innerText = t(mascotKeys[Math.floor(Math.random() * mascotKeys.length)]);
    }
}

function updateStars(type) {
    gameStars[type] = Math.min(3, gameStars[type] + 1);
    const starEl = document.getElementById(`stars-${type}`);
    if (starEl) {
        starEl.innerText = "⭐".repeat(gameStars[type]) + "☆".repeat(3 - gameStars[type]);
    }
}

// 1. Story Time: Note Match
function setupStoryGame(stage, feedback) {
    const notes = ['C', 'E', 'G'];
    const target = notes[Math.floor(Math.random() * notes.length)];
    
    stage.innerHTML = `
        <h3>${t("story-match-title")}</h3>
        <div class="game-note-display">🎵 ${target}</div>
        <div class="game-options">
            ${notes.map(n => `<button class="game-btn" onpointerdown="event.preventDefault(); checkStoryAnswer('${n}', '${target}')">${n}</button>`).join('')}
        </div>
    `;
}

window.checkStoryAnswer = (choice, target) => {
    const feedback = document.getElementById('game-feedback');
    if (choice === target) {
        playNote(frequencies[target], 0.5);
        feedback.innerText = t("story-feedback-correct");
        updateStars('story');
        setTimeout(closeMiniGame, 1500);
    } else {
        feedback.innerText = t("story-feedback-wrong");
        playNote(100, 0.2);
    }
};

// 2. Note Ladders: Scale Up
function setupLadderGame(stage, feedback) {
    const steps = ['C', 'D', 'E'];
    let currentStep = 0;
    
    stage.innerHTML = `
        <h3>${t("ladder-climb-title")}</h3>
        <div class="ladder-container">
            ${steps.map((s, i) => `<div id="step-${i}" class="ladder-step">${s}</div>`).join('')}
        </div>
    `;

    const ladderSteps = stage.querySelectorAll('.ladder-step');
    ladderSteps.forEach((step, i) => {
        step.onpointerdown = (e) => {
            e.preventDefault();
            if (i === currentStep) {
                playNote(frequencies[steps[i]], 0.3);
                step.classList.add('active');
                currentStep++;
                if (currentStep === steps.length) {
                    feedback.innerText = t("ladder-feedback-top");
                    updateStars('ladder');
                    setTimeout(closeMiniGame, 1500);
                }
            } else {
                feedback.innerText = t("ladder-feedback-wrong");
            }
        };
    });
}

// 3. Secret Signs: Symbol Hunt
function setupSignsGame(stage, feedback) {
    const symbols = [
        { icon: '𝄞', name: 'G-Clef', zh: '高音谱号' },
        { icon: '𝄢', name: 'F-Clef', zh: '低音谱号' },
        { icon: '🎵', name: 'Notes', zh: '音符' }
    ];
    const target = symbols[0];
    const targetName = currentLanguage === 'zh' ? target.zh : target.name;
    
    stage.innerHTML = `
        <h3>${t("signs-find-title")} ${targetName}!</h3>
        <div class="game-options">
            ${symbols.sort(() => Math.random() - 0.5).map(s => `
                <button class="game-btn" onpointerdown="event.preventDefault(); checkSignAnswer('${s.name}', '${target.name}')">${s.icon}</button>
            `).join('')}
        </div>
    `;
}

window.checkSignAnswer = (choice, target) => {
    const feedback = document.getElementById('game-feedback');
    if (choice === target) {
        playNote(880, 0.2);
        feedback.innerText = t("signs-feedback-found");
        updateStars('signs');
        setTimeout(closeMiniGame, 1500);
    } else {
        feedback.innerText = t("signs-feedback-wrong");
    }
};

// 4. Star Quest: Speed Tap
function setupQuestGame(stage, feedback) {
    let taps = 0;
    const goal = 5;
    
    stage.innerHTML = `
        <h3>${t("quest-tap-title")}</h3>
        <button id="quest-star" class="drum-pad" style="width:120px; height:120px; font-size:3rem;">⭐</button>
        <p>${currentLanguage === 'zh' ? '点击次数' : 'Taps'}: <span id="quest-count">0</span></p>
    `;

    const star = document.getElementById('quest-star');
    star.onpointerdown = (e) => {
        e.preventDefault();
        taps++;
        playNote(1000 + (taps * 100), 0.1);
        document.getElementById('quest-count').innerText = taps;
        star.style.transform = `scale(${1 + taps * 0.1})`;
        
        if (taps === goal) {
            feedback.innerText = t("quest-feedback-win");
            updateStars('quest');
            setTimeout(closeMiniGame, 1500);
        }
    };
}

// --- RHYTHMIC STAR CATCH GAME LOGIC ---
let starGameActive = false;
let starGameState = {
    score: 0,
    combo: 0,
    stars: [],
    speed: 2,
    lastSpawn: 0,
    spawnRate: 2000,
    gameTime: 0,
    maxDuration: 60000, // 60 seconds
    keysPressed: {},
    shakeCount: 0,
    isShaking: false
};

const STAR_TYPES = [
    { type: 'tap', icon: '⭐', color: 'tap-star', key: ' ', label: 'TAP' },
    { type: 'clap', icon: '👏', color: 'clap-star', key: 'c', label: 'TAP' },
    { type: 'hold', icon: '🔥', color: 'hold-star', key: 'h', label: 'HOLD' },
    { type: 'shake', icon: '✨', color: 'shake-star', key: 's', label: 'SHAKE' }
];

function initStarGame() {
    document.getElementById('start-star-game-btn').onclick = startStarGame;
    
    // Keyboard listeners
    window.addEventListener('keydown', (e) => {
        if (!starGameActive) return;
        const key = e.key.toLowerCase();
        if ([' ', 'c', 'h', 's'].includes(key)) {
            starGameState.keysPressed[key] = true;
            handleStarInput(key, 'down');
            updateControlButtonVisual(key, true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (!starGameActive) return;
        const key = e.key.toLowerCase();
        if ([' ', 'c', 'h', 's'].includes(key)) {
            starGameState.keysPressed[key] = false;
            handleStarInput(key, 'up');
            updateControlButtonVisual(key, false);
        }
    });

    // On-screen button listeners
    document.querySelectorAll('.game-control-btn').forEach(btn => {
        const key = btn.dataset.key;
        
        btn.onpointerdown = (e) => {
            if (!starGameActive) return;
            e.preventDefault();
            starGameState.keysPressed[key] = true;
            handleStarInput(key, 'down');
            btn.classList.add('active');
        };

        btn.onpointerup = btn.onpointerleave = (e) => {
            if (!starGameActive) return;
            e.preventDefault();
            starGameState.keysPressed[key] = false;
            handleStarInput(key, 'up');
            btn.classList.remove('active');
        };
    });

    // Touch/Click support for the hit zone directly (for Tap)
    document.getElementById('star-lane').onpointerdown = (e) => {
        if (!starGameActive) return;
        e.preventDefault();
        handleStarInput(' ', 'down');
        updateControlButtonVisual(' ', true);
        setTimeout(() => updateControlButtonVisual(' ', false), 100);
    };
}

function updateControlButtonVisual(key, isActive) {
    const btn = document.querySelector(`.game-control-btn[data-key="${key}"]`);
    if (btn) {
        if (isActive) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

function startStarGame() {
    if (starGameActive) return;
    
    starGameActive = true;
    starGameState = {
        score: 0,
        combo: 0,
        stars: [],
        speed: 3,
        lastSpawn: 0,
        spawnRate: 1500,
        gameTime: Date.now(),
        startTime: Date.now(),
        maxDuration: 60000,
        keysPressed: {},
        shakeCount: 0
    };

    document.getElementById('star-score').innerText = '0';
    document.getElementById('star-combo').innerText = '0';
    document.getElementById('star-progress-bar').style.width = '0%';
    document.getElementById('star-lane').innerHTML = '';
    document.getElementById('start-star-game-btn').style.display = 'none';
    document.querySelector('.star-game-container').classList.add('active');
    
    requestAnimationFrame(starGameLoop);
}

function stopStarGame() {
    starGameActive = false;
    document.getElementById('start-star-game-btn').style.display = 'block';
    document.getElementById('star-lane').innerHTML = '';
    document.querySelector('.star-game-container').classList.remove('active');
}

function starGameLoop() {
    if (!starGameActive) return;

    const now = Date.now();
    const elapsed = now - starGameState.startTime;
    const progress = (elapsed / starGameState.maxDuration) * 100;

    document.getElementById('star-progress-bar').style.width = `${Math.min(100, progress)}%`;

    if (progress >= 100) {
        endStarGame();
        return;
    }

    // Spawn stars
    if (now - starGameState.lastSpawn > starGameState.spawnRate) {
        spawnStar();
        starGameState.lastSpawn = now;
        // Increase difficulty
        starGameState.speed += 0.05;
        starGameState.spawnRate = Math.max(600, starGameState.spawnRate - 20);
    }

    // Move stars
    const lane = document.getElementById('star-lane');
    const laneWidth = lane.offsetWidth;
    const hitZoneCenter = laneWidth * 0.2 + 40;
    
    starGameState.stars.forEach((star, index) => {
        star.x -= starGameState.speed;
        star.el.style.left = `${star.x}px`;

        // Continuous Hold Logic
        if (star.type === 'hold' && !star.hit) {
            const dist = Math.abs((star.x + 25) - hitZoneCenter);
            if (dist < 40 && starGameState.keysPressed['h']) {
                processHit(star, dist);
            }
        }

        // Check for miss
        if (star.x < -50) {
            if (!star.hit) {
                showStarFeedback('MISS', 'miss');
                starGameState.combo = 0;
                document.getElementById('star-combo').innerText = '0';
            }
            star.el.remove();
            starGameState.stars.splice(index, 1);
        }
    });

    requestAnimationFrame(starGameLoop);
}

function spawnStar() {
    const lane = document.getElementById('star-lane');
    const type = STAR_TYPES[Math.floor(Math.random() * STAR_TYPES.length)];
    const starEl = document.createElement('div');
    starEl.className = `game-star ${type.color}`;
    starEl.innerHTML = `${type.icon}<span>${type.label}</span>`;
    
    const x = lane.offsetWidth;
    const y = 125; // Middle of lane

    starEl.style.left = `${x}px`;
    starEl.style.top = `${y}px`;
    lane.appendChild(starEl);

    starGameState.stars.push({
        el: starEl,
        x: x,
        y: y,
        type: type.type,
        key: type.key,
        hit: false
    });
}

function handleStarInput(key, direction) {
    const lane = document.getElementById('star-lane');
    const laneWidth = lane.offsetWidth;
    const hitZoneCenter = laneWidth * 0.2 + 40; // Center of hit zone (20% + 40px half-width)
    
    // Find closest star of this key type
    let closestStar = null;
    let minDistance = 1000;

    starGameState.stars.forEach(star => {
        if (star.hit) return;
        if (star.key === key || (key === ' ' && star.type === 'tap')) {
            const dist = Math.abs((star.x + 25) - hitZoneCenter);
            if (dist < minDistance) {
                minDistance = dist;
                closestStar = star;
            }
        }
    });

    if (direction === 'down') {
        // Special case for Shake: Need to press repeatedly
        if (closestStar && closestStar.type === 'shake') {
            starGameState.shakeCount++;
            if (starGameState.shakeCount >= 5) {
                processHit(closestStar, minDistance);
                starGameState.shakeCount = 0;
            }
            return;
        }

        if (closestStar && (closestStar.type === 'tap' || closestStar.type === 'clap')) {
            processHit(closestStar, minDistance);
        }
    }
}

function processHit(star, distance) {
    star.hit = true;
    let accuracy = 'GOOD';
    let points = 50;

    if (distance < 20) {
        accuracy = 'PERFECT';
        points = 100;
    }

    starGameState.score += points;
    starGameState.combo++;
    
    star.el.style.transform = 'scale(2)';
    star.el.style.opacity = '0';
    
    document.getElementById('star-score').innerText = starGameState.score;
    document.getElementById('star-combo').innerText = starGameState.combo;
    
    showStarFeedback(accuracy, accuracy.toLowerCase());
    triggerHitEffect();
    playNote(400 + (starGameState.combo * 10), 0.1);
}

function showStarFeedback(text, className) {
    const fb = document.getElementById('star-hit-feedback');
    fb.innerText = text;
    fb.className = `hit-feedback ${className}`;
    setTimeout(() => { if(fb.innerText === text) fb.innerText = ''; }, 500);
}

function triggerHitEffect() {
    const zone = document.getElementById('hit-zone');
    zone.classList.remove('pulse');
    void zone.offsetWidth;
    zone.classList.add('pulse');
}

function endStarGame() {
    starGameActive = false;
    const retryText = currentLanguage === 'zh' ? '再玩一次！' : 'Play Again!';
    document.getElementById('start-star-game-btn').style.display = 'block';
    document.getElementById('start-star-game-btn').innerText = retryText;
    
    const finalScore = starGameState.score;
    const msg = currentLanguage === 'zh' ? `游戏结束！最终得分：${finalScore}` : `Game Over! Final Score: ${finalScore}`;
    alert(msg);
    saveScore(finalScore);
}

// --- INITIALIZATION ---
window.onload = () => {
    // Initial language setup
    setLanguage('en');

    initVisualEffects(); // NEW
    setupPiano();
    setupPitchGame();
    setupRhythmGame();
    initStarGame();
    displayTrophies();
    
    document.getElementById('metronome-toggle').onclick = toggleMetronome;
};

// --- NEW CODE: Level & Lesson Management ---
const lessonData = {
    theory: {
        1: { 
            en: { title: "Level 1: Introduction to Staff", content: "The staff is made of five lines. Click the lines to find their names!" },
            zh: { title: "第一关: 认识五线谱", content: "五线谱是由五条横线组成的。点击线条来找找它们的名字吧！" }
        },
        2: { 
            en: { title: "Level 2: Meet the Notes", content: "Notes are like dancing spirits. Click them to hear their voices!" },
            zh: { title: "第二关: 认识音符", content: "音符就像是跳舞的小精灵。点击它们来听听它们的声音吧！" }
        },
        3: { 
            en: { title: "Level 3: Names and Values", content: "How long is a note? Click each note to see its rhythm in action!" },
            zh: { title: "第三关: 音符的名称与时值", content: "一个音符有多长？点击每个音符来看看它的节奏吧！" }
        },
        4: { 
            en: { title: "Level 4: Musical Symbols", content: "Discover the magic symbols of music. Click to reveal their secrets!" },
            zh: { title: "第四关: 音乐中的符号", content: "发现音乐中的魔法符号。点击来揭开它们的秘密！" }
        },
        5: { 
            en: { title: "Level 5: Bars and Bar Lines", content: "Notes live in teams called measures. Can you fill up the train cars?" },
            zh: { title: "第五关: 小节与小节线", content: "音符住在叫‘小节’的队伍里。你能填满这些火车车厢吗？" }
        }
    },
    vision: {
        1: { 
            en: { title: "Level 1: Do Re Mi Fa So", content: "Meet the Note Family! Tap each card to hear them sing." },
            zh: { title: "第一关: Do Re Mi Fa So", content: "认识音符一家人！点击每张卡片听听它们怎么唱。" }
        },
        2: { 
            en: { title: "Level 2: Simple Melody", content: "Let's play a little tune! Press the button to hear the sequence." },
            zh: { title: "第二关: 简单旋律", content: "让我们来弹一首小乐曲！按一下按钮来听听旋律。" }
        },
        3: { 
            en: { title: "Level 3: The Heartbeat", content: "Music has a heartbeat! Tap the drum to feel the steady pulse." },
            zh: { title: "第三关: 音乐的心跳", content: "音乐也有心跳！点击鼓面来感受稳定的节拍。" }
        },
        4: { 
            en: { title: "Level 4: Sing the Rhythm", content: "Look at the stars and tap along. Can you follow the moving star?" },
            zh: { title: "第四关: 唱节奏", content: "看着星星跟着点击。你能跟着移动的星星吗？" }
        },
        5: { 
            en: { title: "Level 5: Rhythm Challenge", content: "Ready for the big test? Tap the rhythm as accurately as you can!" },
            zh: { title: "第五关: 节奏挑战", content: "准备好迎接大考了吗？尽可能准确地点击节奏吧！" }
        }
    }
};

function openLesson(type, level, withConfetti = true, skipNav = false) {
    currentLessonState = { type, level };
    const data = lessonData[type][level][currentLanguage];
    if (!data) return;

    if (withConfetti) createConfetti(); 

    document.getElementById('lesson-title').innerText = data.title;
    
    let interactiveHtml = renderInteractiveLesson(type, level);

    document.getElementById('lesson-content').innerHTML = `
        <div class="lesson-card">
            <div class="mascot-bubble" style="justify-content: center;">
                <div class="mascot">🐱</div>
                <div class="bubble">${data.content}</div>
            </div>
            ${interactiveHtml}
            <div style="margin-top:30px;">
                <button class="action-btn" onclick="currentLessonState=null; navigateTo('${type}-hub')">${t("done")}</button>
            </div>
        </div>
    `;

    // Set back button destination
    document.getElementById('lesson-back-btn').onclick = () => {
        currentLessonState = null;
        navigateTo(`${type}-hub`);
    };

    if (!skipNav) {
        navigateTo('lesson-page');
    }
    
    // Attach event listeners for the specific lesson
    attachLessonListeners(type, level);
}

function renderInteractiveLesson(type, level) {
    if (type === 'theory') {
        switch(parseInt(level)) {
            case 1:
                return `
                    <div class="interactive-staff" id="staff-lesson-board">
                        <div class="staff-lines-container">
                            <div class="staff-line-row"><div class="staff-line" data-type="line" data-index="5" style="animation-delay: 0.1s"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 5 线' : 'Line 5'}</span></div>
                            <div class="staff-space-row"><div class="staff-space" data-type="space" data-index="4"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 4 间' : 'Space 4'}</span></div>
                            <div class="staff-line-row"><div class="staff-line" data-type="line" data-index="4" style="animation-delay: 0.2s"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 4 线' : 'Line 4'}</span></div>
                            <div class="staff-space-row"><div class="staff-space" data-type="space" data-index="3"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 3 间' : 'Space 3'}</span></div>
                            <div class="staff-line-row"><div class="staff-line" data-type="line" data-index="3" style="animation-delay: 0.3s"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 3 线' : 'Line 3'}</span></div>
                            <div class="staff-space-row"><div class="staff-space" data-type="space" data-index="2"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 2 间' : 'Space 2'}</span></div>
                            <div class="staff-line-row"><div class="staff-line" data-type="line" data-index="2" style="animation-delay: 0.4s"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 2 线' : 'Line 2'}</span></div>
                            <div class="staff-space-row"><div class="staff-space" data-type="space" data-index="1"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 1 间' : 'Space 1'}</span></div>
                            <div class="staff-line-row"><div class="staff-line" data-type="line" data-index="1" style="animation-delay: 0.5s"></div><span class="staff-label">${currentLanguage === 'zh' ? '第 1 线' : 'Line 1'}</span></div>
                        </div>
                    </div>
                    
                    <div id="lesson-extra-info" style="min-height: 40px; font-weight: 700; color: var(--accent-purple); margin: 15px 0;"></div>

                    <div class="hand-lesson">
                        <h3>${currentLanguage === 'zh' ? '🖐️ 五个手指头' : '🖐️ Finger Method'}</h3>
                        <p>${currentLanguage === 'zh' ? '手指是线，缝缝是间！' : 'Fingers are lines, gaps are spaces!'}</p>
                        <div class="hand-visual">
                            <div class="finger" data-index="5" style="height: 120px"></div>
                            <div class="hand-space" data-index="4"></div>
                            <div class="finger" data-index="4" style="height: 150px"></div>
                            <div class="hand-space" data-index="3"></div>
                            <div class="finger" data-index="3" style="height: 160px"></div>
                            <div class="hand-space" data-index="2"></div>
                            <div class="finger" data-index="2" style="height: 150px"></div>
                            <div class="hand-space" data-index="1"></div>
                            <div class="finger" data-index="1" style="height: 100px"></div>
                        </div>
                    </div>

                    <div class="quiz-box">
                        <h3>🎯 ${currentLanguage === 'zh' ? '小练习' : 'Mini Quiz'}</h3>
                        <p id="quiz-question">${currentLanguage === 'zh' ? '请点击：第 3 线' : 'Click the: 3rd Line'}</p>
                        <div id="quiz-feedback" class="quiz-feedback"></div>
                    </div>
                `;
            case 2:
                return `
                    <div class="notes-showcase">
                        <div class="note-card" data-note="whole" data-freq="261" style="animation-delay: 0.1s">
                            <div class="note-symbol n-whole">${getNoteSVG('whole')}</div>
                            <span class="note-name">${currentLanguage === 'zh' ? '全音符' : 'Whole Note'}</span>
                            <span class="note-desc">Long sound...</span>
                        </div>
                        <div class="note-card" data-note="half" data-freq="329" style="animation-delay: 0.2s">
                            <div class="note-symbol n-half">${getNoteSVG('half')}</div>
                            <span class="note-name">${currentLanguage === 'zh' ? '二分音符' : 'Half Note'}</span>
                            <span class="note-desc">Medium sound</span>
                        </div>
                        <div class="note-card" data-note="quarter" data-freq="392" style="animation-delay: 0.3s">
                            <div class="note-symbol n-quarter">${getNoteSVG('quarter')}</div>
                            <span class="note-name">${currentLanguage === 'zh' ? '四分音符' : 'Quarter Note'}</span>
                            <span class="note-desc">Short sound</span>
                        </div>
                        <div class="note-card" data-note="eighth" data-freq="523" style="animation-delay: 0.4s">
                            <div class="note-symbol n-eighth">${getNoteSVG('eighth')}</div>
                            <span class="note-name">${currentLanguage === 'zh' ? '八分音符' : 'Eighth Note'}</span>
                            <span class="note-desc">Very short!</span>
                        </div>
                    </div>

                    <div id="note-info-text" style="height: 30px; font-weight: 800; color: var(--accent-purple); margin: 10px 0;"></div>

                    <div class="note-game-box">
                        <h3>🎯 ${currentLanguage === 'zh' ? '找音符游戏' : 'Find the Note Game'}</h3>
                        <p id="note-quiz-prompt">${currentLanguage === 'zh' ? '请点击：四分音符' : 'Click the: Quarter Note'}</p>
                        <div class="note-options">
                            <div class="opt-btn" data-type="whole">${getNoteSVG('whole')}</div>
                            <div class="opt-btn" data-type="half">${getNoteSVG('half')}</div>
                            <div class="opt-btn" data-type="quarter">${getNoteSVG('quarter')}</div>
                            <div class="opt-btn" data-type="eighth">${getNoteSVG('eighth')}</div>
                         </div>
                         <div id="note-quiz-feedback" style="height: 30px; margin-top: 10px; font-weight: 800;"></div>
                    </div>
                `;
            case 3:
                const notesArr = [
                    { id: 'whole', beats: 4, name: currentLanguage === 'zh' ? '全音符' : 'Whole Note' },
                    { id: 'half', beats: 2, name: currentLanguage === 'zh' ? '二分音符' : 'Half Note' },
                    { id: 'quarter', beats: 1, name: currentLanguage === 'zh' ? '四分音符' : 'Quarter Note' },
                    { id: 'eighth', beats: 0.5, name: currentLanguage === 'zh' ? '八分音符' : 'Eighth Note' }
                ];
                return `
                    <div class="duration-gallery">
                        ${notesArr.map(n => `
                            <div class="duration-card" data-note="${n.id}" data-beats="${n.beats}">
                                <div style="width:50px; height:50px;">${getNoteSVG(n.id)}</div>
                                <div class="duration-viz">
                                    <div class="symbol-title">${n.name}</div>
                                    <div class="beat-markers">
                                        ${Array.from({ length: Math.ceil(n.beats) }).map(() => `<div class="beat-dot"></div>`).join('')}
                                    </div>
                                    <div class="duration-bar-bg">
                                        <div class="duration-bar-fill" id="fill-${n.id}"></div>
                                    </div>
                                </div>
                                <div style="font-weight:800; color:var(--accent-blue); width:50px;">${n.beats}s</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="note-game-box">
                        <h3>🎯 ${currentLanguage === 'zh' ? '谁更长？' : 'Which is Longer?'}</h3>
                        <p id="dur-quiz-prompt" style="font-weight:800; margin-bottom:10px;"></p>
                        <div id="dur-quiz-options" style="display:flex; justify-content:center; gap:20px;"></div>
                        <div id="dur-quiz-feedback" style="height:30px; margin-top:10px; font-weight:800;"></div>
                    </div>
                `;
            case 4:
                return `
                    <div class="symbols-gallery">
                        <div class="symbol-card" data-sym="sharp">
                            <div class="symbol-icon-large">${getNoteSVG('sharp')}</div>
                            <span class="symbol-title">${currentLanguage === 'zh' ? '升号' : 'Sharp'}</span>
                        </div>
                        <div class="symbol-card" data-sym="flat">
                            <div class="symbol-icon-large">${getNoteSVG('flat')}</div>
                            <span class="symbol-title">${currentLanguage === 'zh' ? '降号' : 'Flat'}</span>
                        </div>
                        <div class="symbol-card" data-sym="rest">
                             <div class="symbol-icon-large">🤫</div>
                            <span class="symbol-title">${currentLanguage === 'zh' ? '休止' : 'Rest'}</span>
                        </div>
                    </div>

                    <div id="sym-info-txt" style="height:40px; font-weight:800; color:var(--accent-orange); margin:15px 0;"></div>

                    <div class="note-game-box">
                        <h3>🎯 ${currentLanguage === 'zh' ? '音乐魔法' : 'Musical Magic'}</h3>
                        <p id="sym-quiz-prompt">${currentLanguage === 'zh' ? '哪个符号会让声音变高？' : 'Which symbol makes the sound higher?'}</p>
                        <div class="note-options">
                            <div class="opt-btn" data-ans="sharp">${getNoteSVG('sharp')}</div>
                            <div class="opt-btn" data-ans="flat">${getNoteSVG('flat')}</div>
                            <div class="opt-btn" data-ans="rest">🤫</div>
                        </div>
                        <div id="sym-quiz-feedback" style="height:30px; margin-top:10px; font-weight:800;"></div>
                    </div>

                    <div id="lesson-pause-overlay" class="pause-overlay">
                        <div class="pause-icon">🤫</div>
                    </div>
                `;
            case 5:
                const carsCount = 3;
                let carsHtml = '';
                for(let i=1; i<=carsCount; i++) {
                    carsHtml += `
                        <div class="train-car ${i === 1 ? 'is-engine' : ''}" data-m="${i}">
                             <div class="measure-notes-zone">
                                ${i % 2 === 0 ? getNoteSVG('quarter') : getNoteSVG('quarter') + getNoteSVG('quarter')}
                             </div>
                             <div class="train-wheel wheel-left"></div>
                             <div class="train-wheel wheel-right"></div>
                             <div class="measure-label">${currentLanguage === 'zh' ? '第 '+i+' 小节' : 'Measure '+i}</div>
                        </div>
                    `;
                    if (i < carsCount) {
                        carsHtml += `<div class="bar-line-divider" data-type="barline"></div>`;
                    }
                }

                return `
                    <div id="lesson-tip-bubble" class="tip-bubble"></div>

                    <div class="measure-train" id="train-board">
                        ${carsHtml}
                    </div>

                    <div class="measure-quiz-box">
                        <h3>🥁 ${currentLanguage === 'zh' ? '听听看，有几个小节？' : 'Listen! How many measures?'}</h3>
                        <p>${currentLanguage === 'zh' ? '点击“播放”，数数小车厢！' : 'Click Play and count the cars!'}</p>
                        <button class="action-btn" id="play-train-btn" style="margin-bottom: 15px;">
                            ${currentLanguage === 'zh' ? '🚂 启动列车' : '🚂 Start Train'}
                        </button>
                        <div class="measure-options">
                            <div class="num-btn" data-val="1">1</div>
                            <div class="num-btn" data-val="2">2</div>
                            <div class="num-btn" data-val="3">3</div>
                            <div class="num-btn" data-val="4">4</div>
                        </div>
                    </div>
                `;
        }
    } else {
        // Vision Singing
        switch(parseInt(level)) {
            case 1:
                return `
                    <div class="pitch-container">
                        <div class="pitch-cards">
                            <div class="pitch-card color-1" data-note="C">Do</div>
                            <div class="pitch-card color-2" data-note="D">Re</div>
                            <div class="pitch-card color-3" data-note="E">Mi</div>
                            <div class="pitch-card color-4" data-note="F">Fa</div>
                            <div class="pitch-card color-5" data-note="G">So</div>
                        </div>
                        <div class="game-control-panel">
                            <div id="vision-feedback" class="feedback-msg"></div>
                            <div id="vision-target-note" style="font-size: 1.5rem; font-weight: 800; color: var(--accent-purple); margin-bottom: 20px;"></div>
                            
                            <div class="voice-game-area" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                                <button id="vision-start-game" class="action-btn">🎮 ${currentLanguage === 'zh' ? '听音辩位' : 'Repeat the Sound'}</button>
                                
                                <div class="recording-controls" style="display: flex; gap: 15px;">
                                    <button id="vision-record-start" class="action-btn" style="background: var(--accent-red); box-shadow: 0 6px 0 #D32F2F;">🎤 ${currentLanguage === 'zh' ? '开始录音' : 'Record'}</button>
                                    <button id="vision-record-stop" class="action-btn" style="display: none; background: #555; box-shadow: 0 6px 0 #333;">⏹️ ${currentLanguage === 'zh' ? '停止' : 'Stop'}</button>
                                </div>
                                <div id="record-status" style="font-weight: 700; color: #777;"></div>
                                <div id="mic-visualizer" style="width: 100px; height: 10px; background: #eee; border-radius: 5px; overflow: hidden; display: none;">
                                    <div id="mic-bar" style="width: 0%; height: 100%; background: var(--accent-red); transition: width 0.1s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <div class="melody-lesson-box">
                        <div class="sequence-display" id="sequence-bars">
                            <!-- Bars added by JS -->
                        </div>
                        <div class="pitch-cards mini">
                            <div class="pitch-card mini color-1" data-note="C">Do</div>
                            <div class="pitch-card mini color-2" data-note="D">Re</div>
                            <div class="pitch-card mini color-3" data-note="E">Mi</div>
                            <div class="pitch-card mini color-4" data-note="F">Fa</div>
                            <div class="pitch-card mini color-5" data-note="G">So</div>
                        </div>
                        <div class="game-control-panel">
                            <div id="melody-feedback" class="feedback-msg"></div>
                            <button id="melody-play-btn" class="action-btn">🎵 ${currentLanguage === 'zh' ? '播放旋律' : 'Play Melody'}</button>
                        </div>
                    </div>
                `;
            case 3:
                return `
                    <div class="beat-box">
                        <h3 style="color:var(--accent-red); margin-bottom:10px;">❤️ ${currentLanguage === 'zh' ? '稳定的心跳' : 'Steady Heartbeat'}</h3>
                        <p style="font-size:0.9rem; color:#666;">${currentLanguage === 'zh' ? '音乐和心跳一样，都有稳定的节奏哦！' : 'Music has a steady beat, just like your heart!'}</p>
                        
                        <div id="beat-ripple-pad" class="ripple-container">
                            <span id="heart-beat" class="heart-icon">❤️</span>
                        </div>

                        <div id="timing-feedback" class="timing-feedback"></div>
                        
                        <div class="game-control-panel" style="margin-top:20px;">
                            <button id="beat-start-btn" class="action-btn" style="background:var(--accent-red);">🥁 ${currentLanguage === 'zh' ? '开始同步' : 'Start Sync'}</button>
                            <p style="margin-top:10px; font-weight:700; color:#888;">${currentLanguage === 'zh' ? '跟着心跳点点看！' : 'Tap along with the beat!'}</p>
                        </div>
                    </div>
                `;
            case 4:
                return `
                    <div class="rhythm-pattern-box">
                        <h3 style="color:var(--accent-blue);">🎶 ${currentLanguage === 'zh' ? '多变的节奏' : 'Varied Rhythm'}</h3>
                        <p style="font-size:0.9rem; color:#666; margin-bottom:15px;">${currentLanguage === 'zh' ? '这次节奏会变快变慢哦，仔细听！' : 'This time the rhythm changes. Listen carefully!'}</p>

                        <div class="rhythm-tray">
                            <div class="pattern-display" id="rhythm-pattern" style="justify-content: center; gap: 15px;">
                                <!-- Markers added by JS -->
                            </div>
                        </div>

                        <div id="rhythm-feedback" class="feedback-msg"></div>
                        
                        <div class="drum-input-area" style="margin:20px 0;">
                            <div id="rhythm-tap-pad" class="drum-pad-large" style="background:var(--accent-blue);">🥁</div>
                        </div>

                        <div class="game-control-panel">
                            <button id="rhythm-lesson-play" class="action-btn" style="background:var(--accent-orange);">👂 ${currentLanguage === 'zh' ? '先听听看' : 'Listen First'}</button>
                            <button id="rhythm-start-btn" class="action-btn" style="background:var(--accent-green); margin-top:10px;">🚀 ${currentLanguage === 'zh' ? '我来挑战' : 'My Turn'}</button>
                        </div>
                    </div>
                `;
            case 5:
                return `
                    <div class="rhythm-game-frame">
                        <div class="game-lane" id="game-lane">
                            <div class="target-line"></div>
                        </div>
                        <div class="game-ui-overlay">
                            <div id="game-score">0</div>
                            <div id="game-feedback" class="game-popup-fb"></div>
                        </div>
                        <div class="drum-input-area">
                            <div id="star-tap-pad" class="drum-pad-large">🥁</div>
                        </div>
                        <div class="game-control-panel">
                            <button id="star-game-start" class="action-btn">🚀 ${currentLanguage === 'zh' ? '开始冲刺' : 'Start Game'}</button>
                        </div>
                    </div>
                `;
        }
    }
    return "";
}

function attachLessonListeners(type, level) {
    if (type === 'theory' && level == 1) {
        let quizTarget = { type: 'line', index: 3 };
        const updateQuiz = () => {
            const types = ['line', 'space'];
            const t = types[Math.floor(Math.random() * 2)];
            const idx = Math.floor(Math.random() * (t === 'line' ? 5 : 4)) + 1;
            quizTarget = { type: t, index: idx };
            const qText = currentLanguage === 'zh' ? 
                `请点击：第 ${idx} ${t === 'line' ? '线' : '间'}` : 
                `Click the: ${idx}${idx === 1 ? 'st' : idx === 2 ? 'nd' : idx === 3 ? 'rd' : 'th'} ${t.charAt(0).toUpperCase() + t.slice(1)}`;
            document.getElementById('quiz-question').innerText = qText;
        };

        const handleInteraction = (el, etype, eindex) => {
            const info = document.getElementById('lesson-extra-info');
            const feedback = document.getElementById('quiz-feedback');
            const board = document.getElementById('staff-lesson-board');
            
            // Clear previous highlighting
            document.querySelectorAll('.staff-line, .staff-space, .finger, .hand-space').forEach(item => item.classList.remove('active'));
            
            // Highlight matching elements
            document.querySelectorAll(`[data-type="${etype}"][data-index="${eindex}"], [class*="${etype}"][data-index="${eindex}"]`).forEach(item => item.classList.add('active'));
            
            const label = currentLanguage === 'zh' ? 
                `这是第 ${eindex} ${etype === 'line' ? '线' : '间'}` : 
                `This is ${etype.charAt(0).toUpperCase() + etype.slice(1)} ${eindex}`;
            info.innerText = label;
            
            playNote(300 + eindex * 50 + (etype === 'space' ? 25 : 0), 0.2);

            // Quiz Logic
            if (etype === quizTarget.type && eindex == quizTarget.index) {
                feedback.innerText = "🎉 " + (currentLanguage === 'zh' ? '太棒了！' : 'Excellent!');
                feedback.style.color = "var(--accent-green)";
                board.classList.add('correct-flash');
                createConfetti();
                setTimeout(() => {
                    board.classList.remove('correct-flash');
                    updateQuiz();
                    feedback.innerText = "";
                }, 1500);
            } else {
                feedback.innerText = "❌ " + (currentLanguage === 'zh' ? '再试一次' : 'Try Again');
                feedback.style.color = "var(--accent-red)";
                board.classList.add('shake-error');
                setTimeout(() => board.classList.remove('shake-error'), 400);
            }
        };

        document.querySelectorAll('.staff-line, .staff-space').forEach(el => {
            el.onclick = () => handleInteraction(el, el.dataset.type, el.dataset.index);
        });

        document.querySelectorAll('.finger, .hand-space').forEach(el => {
            const etype = el.classList.contains('finger') ? 'line' : 'space';
            el.onmouseover = () => handleInteraction(el, etype, el.dataset.index);
            el.onclick = () => handleInteraction(el, etype, el.dataset.index);
        });
    }
    if (type === 'theory' && level == 2) {
        let noteQuizTarget = 'quarter';
        const noteNames = {
            whole: currentLanguage === 'zh' ? '全音符' : 'Whole Note',
            half: currentLanguage === 'zh' ? '二分音符' : 'Half Note',
            quarter: currentLanguage === 'zh' ? '四分音符' : 'Quarter Note',
            eighth: currentLanguage === 'zh' ? '八分音符' : 'Eighth Note'
        };

        const updateNoteQuiz = () => {
            const types = ['whole', 'half', 'quarter', 'eighth'];
            noteQuizTarget = types[Math.floor(Math.random() * 4)];
            document.getElementById('note-quiz-prompt').innerText = (currentLanguage === 'zh' ? '请点击：' : 'Click the: ') + noteNames[noteQuizTarget];
        };

        document.querySelectorAll('.note-card').forEach(card => {
            card.onclick = () => {
                const note = card.dataset.note;
                const freq = card.dataset.freq;
                const infoText = document.getElementById('note-info-text');
                
                document.querySelectorAll('.note-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                infoText.innerText = (currentLanguage === 'zh' ? '这是 ' : 'This is a ') + noteNames[note];
                playNote(parseFloat(freq), 0.5);
                createConfetti(); // Sparkle on click
            };
        });

        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                const feedback = document.getElementById('note-quiz-feedback');
                
                if (type === noteQuizTarget) {
                    feedback.innerText = "🌟 " + (currentLanguage === 'zh' ? '你真棒！' : 'Excellent!');
                    feedback.style.color = "var(--accent-green)";
                    btn.classList.add('correct');
                    createConfetti();
                    setTimeout(() => {
                        btn.classList.remove('correct');
                        updateNoteQuiz();
                        feedback.innerText = "";
                    }, 1500);
                } else {
                    feedback.innerText = "❌ " + (currentLanguage === 'zh' ? '再试一次' : 'Try Again');
                    feedback.style.color = "var(--accent-red)";
                    btn.classList.add('wrong');
                    setTimeout(() => btn.classList.remove('wrong'), 400);
                }
            };
        });
    }
    if (type === 'theory' && level == 3) {
        const noteFreqs = { whole: 261, half: 329, quarter: 392, eighth: 523 };
        
        const animateFill = (noteId, beats) => {
            const fill = document.getElementById(`fill-${noteId}`);
            if (!fill) return;
            
            fill.style.transition = 'none';
            fill.style.width = '0%';
            
            const card = document.querySelector(`.duration-card[data-note="${noteId}"]`);
            if (card) {
                const dots = card.querySelectorAll('.beat-dot');
                dots.forEach(d => d.classList.remove('active'));

                setTimeout(() => {
                    fill.style.transition = `width ${beats}s linear`;
                    fill.style.width = '100%';
                    dots.forEach((dot, i) => {
                        setTimeout(() => dot.classList.add('active'), (i * (beats / Math.max(1, dots.length))) * 1000);
                    });
                }, 50);
            }
        };

        document.querySelectorAll('.duration-card').forEach(card => {
            card.onclick = () => {
                const note = card.dataset.note;
                const beats = parseFloat(card.dataset.beats);
                
                document.querySelectorAll('.duration-card').forEach(c => c.classList.remove('playing'));
                card.classList.add('playing');
                
                playNote(noteFreqs[note], beats);
                animateFill(note, beats);
                
                setTimeout(() => card.classList.remove('playing'), beats * 1000);
            };
        });

        const updateDurQuiz = () => {
            const prompt = document.getElementById('dur-quiz-prompt');
            const optionsBox = document.getElementById('dur-quiz-options');
            const feedback = document.getElementById('dur-quiz-feedback');
            
            if (!prompt || !optionsBox) return;

            const nts = ['whole', 'half', 'quarter', 'eighth'];
            const o1 = nts[Math.floor(Math.random() * nts.length)];
            let o2 = nts[Math.floor(Math.random() * nts.length)];
            while(o1 === o2) o2 = nts[Math.floor(Math.random() * nts.length)];
            
            const beatsMap = { whole: 4, half: 2, quarter: 1, eighth: 0.5 };
            const correct = beatsMap[o1] > beatsMap[o2] ? o1 : o2;

            prompt.innerText = currentLanguage === 'zh' ? '哪个音符的时间更长？' : 'Which note is longer?';
            optionsBox.innerHTML = `
                <div class="opt-btn" data-type="${o1}">${getNoteSVG(o1)}</div>
                <div class="opt-btn" data-type="${o2}">${getNoteSVG(o2)}</div>
            `;

            optionsBox.querySelectorAll('.opt-btn').forEach(btn => {
                btn.onclick = () => {
                    if (btn.dataset.type === correct) {
                        if (feedback) {
                            feedback.innerText = "🎉 " + (currentLanguage === 'zh' ? '真聪明！' : 'So Smart!');
                            feedback.style.color = "var(--accent-green)";
                        }
                        createConfetti();
                        setTimeout(updateDurQuiz, 2000);
                    } else {
                        optionsBox.classList.add('shake-error');
                        setTimeout(() => optionsBox.classList.remove('shake-error'), 400);
                        if (feedback) {
                            feedback.innerText = currentLanguage === 'zh' ? '再试试看？' : 'Try again?';
                            feedback.style.color = "var(--accent-red)";
                        }
                    }
                };
            });
        };
        updateDurQuiz();
    }
    
    if (type === 'theory' && level == 4) {
        const info = document.getElementById('sym-info-txt');
        const msgs = {
            sharp: currentLanguage === 'zh' ? '⚡ 升号让声音变高！' : '⚡ Sharp makes it higher!',
            flat: currentLanguage === 'zh' ? '💧 降号让声音变低！' : '💧 Flat makes it lower!',
            rest: currentLanguage === 'zh' ? '🤫 休止符意味着安静。' : '🤫 Rest means silence.'
        };

        document.querySelectorAll('.symbol-card').forEach(card => {
            card.onclick = async () => {
                const sym = card.dataset.sym;
                if(info) info.innerText = msgs[sym];
                
                document.querySelectorAll('.symbol-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                const icon = card.querySelector('.symbol-icon-large');
                if (sym === 'sharp') {
                    if(icon) icon.classList.add('spark-anim');
                    playNote(261, 0.3); 
                    await new Promise(r => setTimeout(r, 500));
                    playNote(277, 0.5); 
                    setTimeout(() => icon && icon.classList.remove('spark-anim'), 1000);
                } else if (sym === 'flat') {
                    if(icon) icon.classList.add('drop-anim');
                    playNote(261, 0.3); 
                    await new Promise(r => setTimeout(r, 500));
                    playNote(246, 0.5); 
                    setTimeout(() => icon && icon.classList.remove('drop-anim'), 1000);
                } else {
                    const overlay = document.getElementById('lesson-pause-overlay');
                    if(overlay) overlay.classList.add('show');
                    setTimeout(() => overlay && overlay.classList.remove('show'), 1500);
                }
            };
        });

        const updateSymQuiz = () => {
            const prompt = document.getElementById('sym-quiz-prompt');
            const feedback = document.getElementById('sym-quiz-feedback');
            const options = ['sharp', 'flat', 'rest'];
            const target = options[Math.floor(Math.random() * options.length)];
            
            const prompts = {
                sharp: currentLanguage === 'zh' ? '哪个符号会让声音变高？(⚡)' : 'Which symbol makes sound higher? (⚡)',
                flat: currentLanguage === 'zh' ? '哪个符号会让声音变低？(💧)' : 'Which symbol makes sound lower? (💧)',
                rest: currentLanguage === 'zh' ? '哪个符号代表安静地休息？(🤫)' : 'Which symbol means to rest? (🤫)'
            };
            
            if (prompt) prompt.innerText = prompts[target];
            
            document.querySelectorAll('.opt-btn[data-ans]').forEach(btn => {
                btn.onclick = () => {
                    const ans = btn.dataset.ans;
                    if (ans === target) {
                        if (feedback) {
                            feedback.innerText = "🎊 " + (currentLanguage === 'zh' ? '没错！太聪明了' : 'Bingo! So smart');
                            feedback.style.color = "var(--accent-green)";
                        }
                        createConfetti();
                        setTimeout(updateSymQuiz, 2000);
                    } else {
                        btn.classList.add('shake-error');
                        setTimeout(() => btn.classList.remove('shake-error'), 400);
                        if (feedback) {
                            feedback.innerText = (currentLanguage === 'zh' ? '不对哦，再选选看' : 'Not quite, try again');
                            feedback.style.color = "var(--accent-red)";
                        }
                    }
                };
            });
        };
        updateSymQuiz();
    }
    if (type === 'theory' && level == 5) {
        const tip = document.getElementById('lesson-tip-bubble');
        const showTip = (text, color = 'var(--accent-orange)') => {
            tip.innerText = text;
            tip.style.backgroundColor = color;
            tip.classList.add('show');
            setTimeout(() => tip.classList.remove('show'), 3000);
        };

        // Train Car Interaction
        document.querySelectorAll('.train-car').forEach(car => {
            car.onclick = () => {
                const m = car.dataset.m;
                car.classList.add('playing');
                playNote(261.63 + (m * 50), 0.3);
                showTip(currentLanguage === 'zh' ? `这是第 ${m} 小节` : `This is Measure ${m}`, 'var(--accent-blue)');
                setTimeout(() => car.classList.remove('playing'), 500);
            };
        });

        // Bar Line Interaction
        document.querySelectorAll('.bar-line-divider').forEach(line => {
            line.onclick = () => {
                playNote(800, 0.05);
                showTip(currentLanguage === 'zh' ? "这是一条小节线！它把音乐分开。" : "This is a Bar Line! It keeps music orderly.");
            };
        });

        // Play Rhythm Game
        const playBtn = document.getElementById('play-train-btn');
        if (playBtn) {
            playBtn.onclick = async () => {
                playBtn.disabled = true;
                const cars = document.querySelectorAll('.train-car');
                for(let i=0; i<cars.length; i++) {
                    const car = cars[i];
                    car.classList.add('playing');
                    if (i % 2 === 0) {
                        playNote(300, 0.2); await new Promise(r => setTimeout(r, 400));
                        playNote(300, 0.2); await new Promise(r => setTimeout(r, 400));
                    } else {
                        playNote(400, 0.5); await new Promise(r => setTimeout(r, 800));
                    }
                    car.classList.remove('playing');
                }
                playBtn.disabled = false;
            };
        }

        // Quiz Logic
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if (val == "3") {
                    showTip("🎉 " + (currentLanguage === 'zh' ? "太棒了！一共3个小节" : "Awesome! 3 measures in total"), 'var(--accent-green)');
                    createConfetti();
                } else {
                    document.getElementById('train-board').classList.add('shake-error');
                    setTimeout(() => document.getElementById('train-board').classList.remove('shake-error'), 400);
                    showTip(currentLanguage === 'zh' ? "再数数看？" : "Try counting again?", 'var(--accent-red)');
                }
            };
        });
    }
    if (type === 'vision') {
        const resetAll = () => {
             // Stop any intervals or timeouts from previous games
             if (window._visionInterval) clearInterval(window._visionInterval);
             if (window._visionTimeouts) window._visionTimeouts.forEach(clearTimeout);
             window._visionTimeouts = [];
        };
        resetAll();

        const showFeedback = (id, msg, color) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = msg;
                el.style.color = color;
                setTimeout(() => el.innerText = "", 2000);
            }
        };

        if (level == 1) {
            let sequence = []; // Deprecated but kept for compatibility if needed
            let userStep = 0;
            let isPlaying = false;
            let currentTargetFreq = 0;
            let targetNote = "";
            let isRecording = false;
            let audioStream = null;

            const cards = document.querySelectorAll('.pitch-card');
            const startBtn = document.getElementById('vision-record-start');
            const stopBtn = document.getElementById('vision-record-stop');
            const status = document.getElementById('record-status');
            const targetDisplay = document.getElementById('vision-target-note');
            const micVisualizer = document.getElementById('mic-visualizer');
            const micBar = document.getElementById('mic-bar');

            cards.forEach(card => {
                card.onclick = () => {
                    if (isPlaying || isRecording) return;
                    const note = card.dataset.note;
                    playNote(frequencies[note], 0.4);
                    card.classList.add('playing');
                    setTimeout(() => card.classList.remove('playing'), 500);
                };
            });

            const pickNewNote = () => {
                const notes = ['C', 'D', 'E', 'F', 'G'];
                targetNote = notes[Math.floor(Math.random()*5)];
                currentTargetFreq = frequencies[targetNote];
                targetDisplay.innerText = (currentLanguage === 'zh' ? '目标音符' : 'Target Note') + `: ${targetNote}`;
                playNote(currentTargetFreq, 0.8);
                const card = document.querySelector(`.pitch-card[data-note="${targetNote}"]`);
                if (card) {
                    card.classList.add('playing');
                    setTimeout(() => card.classList.remove('playing'), 800);
                }
            };

            document.getElementById('vision-start-game').onclick = () => {
                isPlaying = true;
                pickNewNote();
                setTimeout(() => isPlaying = false, 1000);
            };

            startBtn.onclick = async () => {
                if (!currentTargetFreq) {
                    showFeedback('vision-feedback', currentLanguage === 'zh' ? '先点开始游戏哦！' : 'Start the game first!', 'var(--accent-orange)');
                    return;
                }
                try {
                    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = audioCtx.createMediaStreamSource(audioStream);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 2048;
                    source.connect(analyser);
                    
                    isRecording = true;
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';
                    micVisualizer.style.display = 'block';
                    status.innerText = currentLanguage === 'zh' ? '🎤 正在倾听...' : '🎤 Listening...';
                    status.classList.add('recording-active');
                    
                    let detectedFreqs = [];
                    const checkPitch = () => {
                        if (!isRecording) return;
                        const buffer = new Float32Array(analyser.fftSize);
                        analyser.getFloatTimeDomainData(buffer);
                        
                        // Volume visualizer
                        let sum = 0;
                        for(let i=0; i<buffer.length; i++) sum += buffer[i]*buffer[i];
                        const volume = Math.sqrt(sum/buffer.length);
                        micBar.style.width = Math.min(100, volume * 500) + '%';

                        const pitch = getPitchSample(buffer, audioCtx.sampleRate);
                        if (pitch > 50 && pitch < 1000) {
                            detectedFreqs.push(pitch);
                        }
                        requestAnimationFrame(checkPitch);
                    };
                    checkPitch();

                    window._visionTimeouts.push(setTimeout(() => { 
                        if(isRecording && stopBtn.onclick) stopBtn.onclick(); 
                    }, 4000));

                    stopBtn.onclick = () => {
                        if(!isRecording) return;
                        isRecording = false;
                        startBtn.style.display = 'block';
                        stopBtn.style.display = 'none';
                        micVisualizer.style.display = 'none';
                        status.classList.remove('recording-active');
                        status.innerText = currentLanguage === 'zh' ? '⌛ 正在处理...' : '⌛ Processing...';
                        
                        if (audioStream) {
                            audioStream.getTracks().forEach(t => t.stop());
                        }
                        
                        setTimeout(() => {
                            if (detectedFreqs.length < 5) {
                                showFeedback('vision-feedback', currentLanguage === 'zh' ? '没听清楚，唱响一点？' : "Didn't hear clearly, sing louder?", 'var(--accent-red)');
                                status.innerText = "";
                                return;
                            }

                            detectedFreqs.sort((a,b) => a-b);
                            const medianPitch = detectedFreqs[Math.floor(detectedFreqs.length/2)];
                            
                            const diff = Math.abs(medianPitch - currentTargetFreq);
                            if (diff < 45) { // 45Hz tolerance is generous for kids
                                showFeedback('vision-feedback', currentLanguage === 'zh' ? '⭐ 太棒了！唱得很准' : '⭐ Great job! Perfect pitch', 'var(--accent-green)');
                                createConfetti();
                                setTimeout(pickNewNote, 2000);
                            } else {
                                showFeedback('vision-feedback', currentLanguage === 'zh' ? '有点可惜，再试一次？' : 'Not quite, try again!', 'var(--accent-red)');
                            }
                            status.innerText = "";
                        }, 500);
                    };

                } catch (err) {
                    console.error(err);
                    showFeedback('vision-feedback', currentLanguage === 'zh' ? '需要麦克风权限哦' : 'Microphone access denied', 'var(--accent-red)');
                }
            };
        }

        if (level == 2) {
            const generateMelody = () => {
                const notes = ['C', 'D', 'E', 'F', 'G'];
                const seq = [];
                for(let i=0; i<4; i++) {
                    seq.push(notes[Math.floor(Math.random() * notes.length)]);
                }
                return seq;
            };

            let sequenceData = generateMelody();
            
            const renderMelody = () => {
                const display = document.getElementById('sequence-bars');
                if (display) display.innerHTML = sequenceData.map((n, i) => `<div class="seq-bar" data-index="${i}">${n}</div>`).join('');
            };
            renderMelody();
            
            let userStep = 0;
            let isPlaying = false;

            const playBtn = document.getElementById('melody-play-btn');
            playBtn.onclick = async () => {
                if (isPlaying) return;
                isPlaying = true;
                userStep = 0;
                const bars = document.querySelectorAll('.seq-bar');
                bars.forEach(b => b.classList.remove('active', 'correct'));

                for(let i=0; i<sequenceData.length; i++) {
                    const note = sequenceData[i];
                    const bar = bars[i];
                    if (bar) bar.classList.add('active');
                    playNote(frequencies[note], 0.4);
                    await new Promise(r => setTimeout(r, 600));
                    if (bar) bar.classList.remove('active');
                }
                isPlaying = false;
            };

            document.querySelectorAll('.pitch-card.mini').forEach(card => {
                card.onclick = () => {
                    if (isPlaying) return;
                    const note = card.dataset.note;
                    playNote(frequencies[note], 0.3);
                    card.classList.add('playing');
                    setTimeout(() => card.classList.remove('playing'), 300);

                    if (note === sequenceData[userStep]) {
                        const bar = document.querySelector(`.seq-bar[data-index="${userStep}"]`);
                        if (bar) bar.classList.add('correct');
                        userStep++;
                        if (userStep === sequenceData.length) {
                             showFeedback('melody-feedback', currentLanguage === 'zh' ? '🌈 你是小小作曲家！' : '🌈 You are a little composer!', 'var(--accent-purple)');
                             createConfetti();
                             setTimeout(() => {
                                 sequenceData = generateMelody();
                                 renderMelody();
                             }, 2000);
                        }
                    } else {
                        document.querySelectorAll('.seq-bar').forEach(b => b.classList.remove('correct'));
                        userStep = 0;
                        showFeedback('melody-feedback', currentLanguage === 'zh' ? '从头再来试试？' : 'Try from the start?', 'var(--accent-red)');
                    }
                };
            });
        }

        if (level == 3) {
            const heart = document.getElementById('heart-beat');
            const pad = document.getElementById('beat-ripple-pad');
            const feedback = document.getElementById('timing-feedback');
            let isTapping = false;
            let lastBeatTime = 0;
            const tempo = 1000; // 1 second beat

            document.getElementById('beat-start-btn').onclick = () => {
                if (isTapping) return;
                isTapping = true;
                lastBeatTime = Date.now();
                
                window._visionInterval = setInterval(() => {
                    lastBeatTime = Date.now();
                    heart.classList.add('pulse');
                    playNote(150, 0.1);
                    setTimeout(() => heart.classList.remove('pulse'), 600);
                }, tempo);
            };

            pad.onclick = (e) => {
                if (!isTapping) return;
                
                // Create ripple
                const ripple = document.createElement('div');
                ripple.className = 'ripple-circle';
                pad.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                // Timing calculation
                const now = Date.now();
                const diff = Math.abs(now - lastBeatTime);
                const halfTempo = tempo / 2;
                const distanceToClosestBeat = diff > halfTempo ? Math.abs(diff - tempo) : diff;

                if (distanceToClosestBeat < 100) {
                    feedback.innerText = "PERFECT! ⭐";
                    feedback.className = "timing-feedback timing-perfect";
                    playNote(400, 0.05);
                } else if (distanceToClosestBeat < 250) {
                    feedback.innerText = "GOOD! 👍";
                    feedback.className = "timing-feedback timing-good";
                } else {
                    feedback.innerText = "OFF BEAT ❌";
                    feedback.className = "timing-feedback timing-off";
                }
            };
        }

        if (level == 4) {
            const generateRhythm = () => {
                const patterns = [
                    [2, 1, 1], // long short short
                    [1, 1, 2], // short short long
                    [2, 2, 1, 1], // long long short short
                    [1, 2, 1] // short long short
                ];
                return patterns[Math.floor(Math.random() * patterns.length)];
            };

            let pattern = generateRhythm();
            let isRecordingPlayer = false;
            let playerTaps = [];
            let isPlaying = false;

            const renderRhythm = () => {
                const display = document.getElementById('rhythm-pattern');
                if (display) display.innerHTML = pattern.map((p, i) => `<div class="rhythm-marker ${p === 2 ? 'long' : 'short'}" data-index="${i}"></div>`).join('');
            };
            renderRhythm();
            
            const btnListen = document.getElementById('rhythm-lesson-play');
            const btnPlay = document.getElementById('rhythm-start-btn');
            const pad = document.getElementById('rhythm-tap-pad');
            
            btnListen.onclick = async () => {
                if (isPlaying) return;
                isPlaying = true;
                isRecordingPlayer = false;
                const markers = document.querySelectorAll('.rhythm-marker');
                markers.forEach(m => m.className = m.className.replace(' active', '').replace(' correct', '').replace(' wrong', ''));

                for(let i=0; i<pattern.length; i++) {
                    if (markers[i]) markers[i].classList.add('active');
                    const dur = pattern[i] === 2 ? 0.6 : 0.2;
                    playNote(350, dur);
                    await new Promise(r => setTimeout(r, pattern[i] * 500));
                    if (markers[i]) markers[i].classList.remove('active');
                }
                isPlaying = false;
            };

            btnPlay.onclick = () => {
                if (isPlaying) return;
                isRecordingPlayer = true;
                playerTaps = [];
                const markers = document.querySelectorAll('.rhythm-marker');
                markers.forEach(m => m.className = m.className.replace(' active', '').replace(' correct', '').replace(' wrong', ''));
                showFeedback('rhythm-feedback', currentLanguage === 'zh' ? '该你了！' : 'Your turn!', 'var(--accent-blue)');
            };

            pad.onclick = () => {
                playNote(150, 0.1);
                pad.classList.add('active');
                setTimeout(() => pad.classList.remove('active'), 100);

                if (!isRecordingPlayer) return;

                const tapIndex = playerTaps.length;
                if (tapIndex < pattern.length) {
                    const now = Date.now();
                    playerTaps.push(now);
                    const marker = document.querySelector(`.rhythm-marker[data-index="${tapIndex}"]`);
                    if (marker) marker.classList.add('active');

                    if (playerTaps.length === pattern.length) {
                        isRecordingPlayer = false;
                        // For simplicity in a kids app, we check if they tapped the right number of times
                        // and roughly compare the "feel" (long gaps vs short gaps)
                        let isCorrect = true;
                        if (pattern.length > 1) {
                            for(let i = 1; i < pattern.length; i++) {
                                const actualGap = playerTaps[i] - playerTaps[i-1];
                                const expectedRel = pattern[i-1]; // 1 or 2
                                // This is a loose check: if expected is long (2), gap should be > 600ms. If short (1), gap < 600ms.
                                if (expectedRel === 2 && actualGap < 550) isCorrect = false;
                                if (expectedRel === 1 && actualGap > 750) isCorrect = false;
                            }
                        }

                        setTimeout(() => {
                            const markers = document.querySelectorAll('.rhythm-marker');
                            if (isCorrect) {
                                markers.forEach(m => m.classList.add('correct'));
                                showFeedback('rhythm-feedback', currentLanguage === 'zh' ? '🌟 太棒了！节奏完全正确！' : '🌟 Awesome! Perfect rhythm!', 'var(--accent-green)');
                                createConfetti();
                                setTimeout(() => {
                                    pattern = generateRhythm();
                                    renderRhythm();
                                }, 2000);
                            } else {
                                markers.forEach(m => m.classList.add('wrong'));
                                showFeedback('rhythm-feedback', currentLanguage === 'zh' ? '❌ 节奏不对哦，再听一次？' : '❌ Wrong rhythm, listen again?', 'var(--accent-red)');
                            }
                        }, 300);
                    }
                }
            };
        }

        if (level == 5) {
            const lane = document.getElementById('game-lane');
            const pad = document.getElementById('star-tap-pad');
            let score = 0;
            let gameActive = false;

            const spawnNote = () => {
                if (!gameActive) return;
                const note = document.createElement('div');
                note.className = 'game-note-circle';
                note.style.left = '100%';
                lane.appendChild(note);

                let pos = 100;
                const move = setInterval(() => {
                    pos -= 1;
                    note.style.left = pos + '%';
                    if (pos < -10) {
                        clearInterval(move);
                        note.remove();
                    }
                }, 20);

                note.dataset.moveInterval = move;
                window._visionTimeouts.push(setTimeout(spawnNote, 2000 + Math.random() * 2000));
            };

            document.getElementById('star-game-start').onclick = () => {
                if (gameActive) return;
                gameActive = true;
                score = 0;
                document.getElementById('game-score').innerText = score;
                spawnNote();
            };

            pad.onclick = () => {
                playNote(100, 0.1);
                const notes = document.querySelectorAll('.game-note-circle');
                let hit = false;
                notes.forEach(n => {
                    const pos = parseFloat(n.style.left);
                    if (pos > 10 && pos < 30) {
                        hit = true;
                        score += 10;
                        document.getElementById('game-score').innerText = score;
                        n.classList.add('hit');
                        clearInterval(parseInt(n.dataset.moveInterval));
                        setTimeout(() => n.remove(), 200);
                        
                        const popup = document.getElementById('game-feedback');
                        popup.innerText = "PERFECT! ⭐";
                        popup.classList.add('show');
                        setTimeout(() => popup.classList.remove('show'), 500);
                    }
                });
            };
        }
    }
}

// Global cleanup for Vision Singing state
window._visionInterval = null;
window._visionTimeouts = [];

function createConfetti() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = ['#FFD700', '#FF5252', '#4FC3F7', '#66BB6A', '#BA68C8'][Math.floor(Math.random() * 5)];
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

window.setLanguage = setLanguage;
window.openLesson = openLesson;
window.navigateTo = navigateTo;
window.startMiniGame = startMiniGame;
window.resetScores = resetScores;
window.closeMiniGame = closeMiniGame;
window.stopStarGame = stopStarGame;
