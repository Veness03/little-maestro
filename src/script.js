/**
 * Little Maestro - Music for Kids
 * Vanilla JavaScript Logic
 */

// --- STATE MANAGEMENT & PROGRESS ---
let currentLanguage = 'en';
let currentLessonState = null; // { type, level }

const ProgressService = {
    data: {
        theory: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        vision: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    load() {
        try {
            const saved = localStorage.getItem('littleMaestroProgress');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch(e) {}
    },
    save() {
        localStorage.setItem('littleMaestroProgress', JSON.stringify(this.data));
    },
    updateStars(type, level, stars) {
        if (!this.data[type][level] || stars > this.data[type][level]) {
            this.data[type][level] = stars;
            this.save();
        }
    },
    getStars(type, level) {
        return this.data[type][level] || 0;
    }
};
ProgressService.load();

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

    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'lesson-page' && currentLessonState) {
        openLesson(currentLessonState.type, currentLessonState.level, false, true);
    }
}

// --- TIMEOUT REGISTRY for Safe Navigation ---
const __origSetTimeout = window.setTimeout;
const __origClearTimeout = window.clearTimeout;
window._appTimeouts = new Set();
window.setTimeout = function(fn, ms) {
    const id = __origSetTimeout(() => {
        window._appTimeouts.delete(id);
        fn();
    }, ms);
    window._appTimeouts.add(id);
    return id;
};
window.clearTimeout = function(id) {
    window._appTimeouts.delete(id);
    __origClearTimeout(id);
};

// --- SPEECH SERVICE ---
// Preload voices to ensure they are available immediately
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
    // Trigger initial fetch
    window.speechSynthesis.getVoices();
}

const SpeechService = {
    synth: window.speechSynthesis,
    _currentCallback: null,
    speak(text, lang = currentLanguage, callback = null) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        if (!text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.3; // Higher, friendlier
        
        // Try to find a better voice
        const voices = this.synth.getVoices();
        const targetLang = lang === 'zh' ? 'zh-' : 'en-';
        let voicePrefs = lang === 'zh' ? ['Xiaoxiao', 'TingTing', 'Google 普通话', 'Huihui', 'Mei-Jia'] : ['Google US English', 'Samantha', 'Victoria', 'Karen', 'Moira'];
        let selectedVoice = null;
        for (const pref of voicePrefs) {
            selectedVoice = voices.find(v => v.name.includes(pref) && v.lang.includes(targetLang));
            if (selectedVoice) break;
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes(targetLang) && (v.name.includes('Female') || v.name.includes('Girl')));
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes(targetLang));
        }
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        this._currentCallback = callback;
        
        utterance.onend = () => {
            if (this._currentCallback) {
                this._currentCallback();
            }
        };
        
        this.synth.speak(utterance);
    },
    stop() {
        this._currentCallback = null;
        this.synth.cancel();
    }
};

// --- NEW CODE: Visual Effects & Sound ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const SoundService = {
    playSuccess() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    },
    playWrong() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
};

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
        
        __origSetTimeout(() => note.remove(), 25000);
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
        __origSetTimeout(() => sparkle.remove(), 800);
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
    // Sync body attribute for CSS responsive targeting
    document.body.dataset.activePage = pageId;
    
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

    // Clean up all running timeouts to prevent tutorial audio bleeding
    if (window._appTimeouts) {
        window._appTimeouts.forEach(id => __origClearTimeout(id));
        window._appTimeouts.clear();
    }
    SpeechService.stop();

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

function playClap(timeOffset = 0) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const time = audioCtx.currentTime + timeOffset;
    
    const bufferSize = audioCtx.sampleRate * 0.1; // 100ms duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start(time);
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
    const playSongBtn = document.getElementById('play-song-btn');
    if (playSongBtn) playSongBtn.onclick = playCurrentSong;
    
    const startPracBtn = document.getElementById('start-practice-btn');
    if (startPracBtn) startPracBtn.onclick = startPractice;
    
    const songSelect = document.getElementById('song-select');
    if (songSelect) {
        songSelect.onchange = (e) => {
            stopPractice();
            currentSong = songs[e.target.value] || null;
        };
    }
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
    
    const toggleBtn = document.getElementById('metronome-toggle');
    if (toggleBtn) toggleBtn.onclick = toggleMetronome;
};

// --- NEW CODE: Level & Lesson Management ---
const lessonData = {
    theory: {
        1: { 
            en: { title: "Level 1: Introduction to Staff", content: "The staff is made of five lines. Click the lines to find their names!" },
            zh: { title: "第一关: 认识五线谱", content: "五线谱是由五条横线组成的。点击线条来找找它们的名字吧！" }
        },
        2: { 
            en: { title: "Level 2: Note Anatomy", content: "Notes have two main parts: a head and a stem!" },
            zh: { title: "第二关: 音符的结构", content: "音符有两个主要部分：符头和符杆！" }
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
                <div id="top-tutorial-text" class="bubble">${data.content}</div>
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
                const tStaff = currentLanguage === 'zh' ? '五线谱就像人的手' : 'The Staff is like a Hand';
                return `
                    <div id="level1-container" style="position:relative; width:100%;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l1-tutorial" class="l1-section active" style="flex-direction: column;">
                            
                            <div id="l1-staff-area" class="staff-display">
                                <div class="s-line" id="sl-5"></div>
                                <div class="s-space" id="sp-4"></div>
                                <div class="s-line" id="sl-4"></div>
                                <div class="s-space" id="sp-3"></div>
                                <div class="s-line" id="sl-3"></div>
                                <div class="s-space" id="sp-2"></div>
                                <div class="s-line" id="sl-2"></div>
                                <div class="s-space" id="sp-1"></div>
                                <div class="s-line" id="sl-1"></div>
                            </div>
                            
                            <div id="l1-hand-area" style="display:none; position:relative; font-size: clamp(120px, 20vw, 200px); text-align: center; margin: 20px auto; width: max-content;">
                                🖐🏼
                                <div class="hand-label" style="top: 60%; left: 0%;">5</div>
                                <div class="hand-label" style="top: 35%; left: 20%;">4</div>
                                <div class="hand-label" style="top: 25%; left: 40%;">3</div>
                                <div class="hand-label" style="top: 30%; left: 65%;">2</div>
                                <div class="hand-label" style="top: 50%; left: 88%;">1</div>
                            </div>
                            
                            <div class="l-action-area" style="text-align: right; margin-top: 20px; width: min(90%, 720px); margin-left: auto; margin-right: auto;">
                                <p style="font-size: 1.2rem; margin-bottom: 20px;">${currentLanguage==='zh'?'点击开始，听听每条线和每个间的名字！':'Click start to hear the names of the lines and spaces!'}</p>
                                <button id="l1-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l1-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l1-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去练习':'Practice'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l1-practice" class="l1-section" style="display:none;">
                            <div class="l-left">
                                <div class="hand-practice-board" style="position:relative; font-size:220px; display:inline-block;">
                                    🖐🏼
                                    <div class="prac-target p-f-5" data-ans="line5"></div>
                                    <div class="prac-target p-f-4" data-ans="line4"></div>
                                    <div class="prac-target p-f-3" data-ans="line3"></div>
                                    <div class="prac-target p-f-2" data-ans="line2"></div>
                                    <div class="prac-target p-f-1" data-ans="line1"></div>
                                    
                                    <div class="prac-target p-s-4" data-ans="space4"></div>
                                    <div class="prac-target p-s-3" data-ans="space3"></div>
                                    <div class="prac-target p-s-2" data-ans="space2"></div>
                                    <div class="prac-target p-s-1" data-ans="space1"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 id="l1-prac-prompt" style="color:var(--accent-blue); font-size: 2rem;">Which line is this?</h3>
                                <div id="l1-prac-feedback" style="height:40px; font-weight:bold; font-size:1.5rem; color:var(--accent-red);"></div>
                                <button id="l1-btn-minigame" class="action-btn" style="display:none; background:var(--accent-purple);">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l1-minigame" class="l1-section" style="display:none;">
                            <div class="l-left">
                                <div class="hand-drop-board" style="position:relative; font-size:220px;">
                                    🖐🏼
                                    <div class="drop-zone d-f-5" data-accept="line5" style="border-width:6px; background:rgba(255,255,255,0.9);"></div>
                                    <div class="drop-zone d-f-4" data-accept="line4" style="border-width:6px; background:rgba(255,255,255,0.9);"></div>
                                    <div class="drop-zone d-f-3" data-accept="line3" style="border-width:6px; background:rgba(255,255,255,0.9);"></div>
                                    <div class="drop-zone d-f-2" data-accept="line2" style="border-width:6px; background:rgba(255,255,255,0.9);"></div>
                                    <div class="drop-zone d-f-1" data-accept="line1" style="border-width:6px; background:rgba(255,255,255,0.9);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">🧩 Staff Scramble</h3>
                                <p style="font-size: 1.1rem; margin-bottom: 20px;">${currentLanguage==='zh'?'把左边的卡片拖到正确的手指上！':'Drag the cards to the correct spot!'}</p>
                                <div id="l1-drag-pool" style="display:flex; flex-direction:column; gap:15px; width:100%;">
                                    <div class="drag-item" draggable="true" data-type="line1">${currentLanguage==='zh'?'第一线':'1st Line'}</div>
                                    <div class="drag-item" draggable="true" data-type="line2">${currentLanguage==='zh'?'第二线':'2nd Line'}</div>
                                    <div class="drag-item" draggable="true" data-type="line3">${currentLanguage==='zh'?'第三线':'3rd Line'}</div>
                                    <div class="drag-item" draggable="true" data-type="line4">${currentLanguage==='zh'?'第四线':'4th Line'}</div>
                                    <div class="drag-item" draggable="true" data-type="line5">${currentLanguage==='zh'?'第五线':'5th Line'}</div>
                                </div>
                                <div id="l1-mg-feedback" style="height:40px; font-weight:bold; font-size:1.5rem; margin-top: 20px;"></div>
                            </div>
                        </div>

                    </div>
                `;
            case 2:
                const ttNote = currentLanguage === 'zh' ? '音符的结构' : 'Note Anatomy';
                return `
                    <div id="level2-container" style="position:relative; width:100%; min-height:400px;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l2-tutorial" class="l2-section active">
                            <div class="l-left">
                                <div id="l2-tut-stage" style="display:none; text-align:center; padding: 20px; width:100%;">
                                    <div style="background:var(--white); border-radius:30px; padding:30px; max-width:250px; margin:0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 3px solid var(--color-bg-alt);">
                                        <svg width="150" height="220" viewBox="0 0 100 150" style="overflow:visible;">
                                            <rect id="tut-note-stem" x="65" y="20" width="8" height="90" fill="var(--color-bg-alt)" rx="4" style="transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);" />
                                            <ellipse id="tut-note-head" cx="45" cy="105" rx="28" ry="18" fill="var(--color-bg-alt)" transform="rotate(-25 45 105)" style="transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);" />
                                        </svg>
                                    </div>
                                    <div id="l2-tut-text" style="font-weight:900; font-size:2.5rem; color:var(--text-main); min-height:80px; margin-top:30px; display:flex; align-items:center; justify-content:center;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttNote}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;" id="l2-tutorialText">${currentLanguage==='zh'?'音符宝宝有两个主要部分！':'Notes have two main parts!'}</p>
                                <button id="l2-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l2-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l2-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l2-practice" class="l2-section" style="display:none;">
                            <div class="l-left" style="align-items:center; justify-content:center;">
                                <div style="position:relative; width:200px; height:250px; background:#fff; border-radius:20px; box-shadow:0 8px 20px rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center;">
                                    <svg width="150" height="200" viewBox="0 0 100 150" style="overflow:visible;">
                                        <rect id="prac-note-stem" class="prac-target-note" data-ans="stem" x="65" y="20" width="8" height="90" fill="var(--text-main)" rx="4" style="cursor:pointer; transition:all 0.2s;" />
                                        <ellipse id="prac-note-head" class="prac-target-note" data-ans="head" cx="45" cy="105" rx="28" ry="18" fill="var(--text-main)" transform="rotate(-25 45 105)" style="cursor:pointer; transition:all 0.2s;" />
                                    </svg>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 id="l2-prac-prompt" style="color:var(--accent-blue); font-size: 2rem;">Which is the Head?</h3>
                                <p style="font-size: 1.1rem; margin-bottom: 20px;">${currentLanguage==='zh'?'点击正确的部位！':'Tap the correct part!'}</p>
                                <div id="l2-prac-feedback" style="height:40px; font-weight:bold; font-size:1.5rem; color:var(--accent-red);"></div>
                                <button id="l2-btn-minigame" class="action-btn" style="display:none; background:var(--accent-purple);">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l2-minigame" class="l2-section" style="display:none;">
                            <div class="l-left">
                                <div style="display:flex; flex-direction:column; align-items:center; width:100%; gap: 20px;">
                                    <div style="display:flex; gap: 30px; margin-top:20px; align-items:flex-end; justify-content:center; width:100%; height:120px;">
                                        <div class="drag-item" draggable="true" data-type="stem" style="width: 20px; height: 120px; background: var(--accent-blue); border-radius: 10px; cursor:grab;"></div>
                                        <div class="drag-item" draggable="true" data-type="head" style="width: 85px; height: 60px; background: var(--accent-red); border-radius: 50%; transform: rotate(-25deg); cursor:grab;"></div>
                                    </div>
                                    
                                    <div style="margin-top: 30px; position: relative; width: 180px; height: 230px; border: 4px dashed #ccc; border-radius: 20px; background:#fafafa; margin-left:auto; margin-right:auto;">
                                        <div class="drop-zone l2-dz-stem" data-accept="stem" style="position:absolute; top: 15px; left: 106px; width:26px; height:130px; border:3px dashed var(--accent-blue); border-radius:13px;"></div>
                                        <div class="drop-zone l2-dz-head" data-accept="head" style="position:absolute; top: 125px; left: 25px; width:100px; height:70px; border:3px dashed var(--accent-red); border-radius:50%; transform: rotate(-25deg);"></div>
                                        
                                        <div id="mg-built-stem" style="display:none; position:absolute; top:20px; left: 112px; width: 14px; height: 120px; background: var(--accent-blue); border-radius: 7px; z-index:1;"></div>
                                        <div id="mg-built-head" style="display:none; position:absolute; top: 130px; left: 30px; width: 90px; height: 60px; background: var(--accent-red); border-radius: 50%; transform: rotate(-25deg); z-index:2;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 id="note-game-title" style="font-size:2rem; color:var(--accent-green);">🎯 ${currentLanguage === 'zh' ? '拼装音符' : 'Build a Note!'}</h3>
                                <p style="font-weight:800; font-size:1.2rem; margin-bottom:10px;">${currentLanguage==='zh'?'拖动符头和符杆，拼成一个完整的音符！':'Drag the Head and Stem into the box to build a note!'}</p>
                                <div id="l2-mg-feedback" style="height:40px; font-weight:800; font-size: 1.5rem; color:var(--accent-green);"></div>
                            </div>
                        </div>

                    </div>
                `;
            case 3:
                const ttDur = currentLanguage === 'zh' ? '音符多长？' : 'How Long?';
                const notesArr = [
                    { id: 'whole', beats: 4, name: currentLanguage === 'zh' ? '全音符' : 'Whole Note' },
                    { id: 'half', beats: 2, name: currentLanguage === 'zh' ? '二分音符' : 'Half Note' },
                    { id: 'quarter', beats: 1, name: currentLanguage === 'zh' ? '四分音符' : 'Quarter Note' },
                    { id: 'eighth', beats: 0.5, name: currentLanguage === 'zh' ? '八分音符' : 'Eighth Note' }
                ];
                return `
                    <div id="level3-container" style="position:relative; width:100%; min-height:400px;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l3-tutorial" class="l3-section active">
                            <div class="l-left">
                                <div id="l3-tut-stage" style="display:none; text-align:center; padding: 20px; width: 100%;">
                                    <div id="l3-tut-img" style="font-size:100px; height: 120px; transition: transform 0.3s; margin-bottom: 20px;"></div>
                                    <div id="l3-tut-bar-bg" class="note-progress-bg" style="width: 80%; margin: 0 auto; height: 20px;"><div id="l3-tut-bar-fill" class="note-progress-fill" style="background:var(--accent-blue);"></div></div>
                                    <div id="l3-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue); height: 60px; margin-top:20px;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttDur}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'长长的？还是短短的？':'Long or short?'}</p>
                                <button id="l3-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l3-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l3-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l3-practice" class="l3-section" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div class="duration-gallery" style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap; width:100%;">
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
                                            <div style="font-weight:800; color:var(--accent-blue); width:50px; font-size: 1.2rem;">${n.beats}s</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">${currentLanguage==='zh'?'听听长短':'Listen to the lengths'}</h3>
                                <button id="l3-btn-minigame" class="action-btn" style="background:var(--accent-purple); margin-top:20px;">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l3-minigame" class="l3-section" style="display:none;">
                            <div class="l-left">
                                <div id="dur-quiz-options" style="display:flex; justify-content:center; gap:40px; width: 100%;"></div>
                            </div>
                            <div class="l-right">
                                <h3 style="font-size:2rem;">🎯 ${currentLanguage === 'zh' ? '谁更长？' : 'Which is Longer?'}</h3>
                                <p id="dur-quiz-prompt" style="font-weight:800; font-size: 1.5rem; margin-bottom:10px;"></p>
                                <div id="dur-quiz-feedback" style="height:40px; margin-top:10px; font-weight:800; font-size:1.5rem;"></div>
                            </div>
                        </div>

                    </div>
                `;
            case 4:
                const ttSym = currentLanguage === 'zh' ? '神秘符号' : 'Secret Signs';
                return `
                    <div id="level4-container" style="position:relative; width:100%; min-height:400px;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l4-tutorial" class="l4-section active">
                            <div class="l-left">
                                <div id="l4-tut-stage" style="display:none; text-align:center; padding: 20px; width: 100%;">
                                    <div id="l4-tut-img" style="font-size:120px; transition: transform 0.3s; margin-bottom: 20px;"></div>
                                    <div id="l4-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue); height: 60px;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttSym}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'这是音乐的魔法符号！':'These are musical magic symbols!'}</p>
                                <button id="l4-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l4-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l4-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l4-practice" class="l4-section" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div class="symbols-gallery" style="display:flex; justify-content:center; gap:30px; flex-wrap:wrap;">
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
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">${currentLanguage==='zh'?'点击符号看魔法':'Click to see magic'}</h3>
                                <div id="sym-info-txt" style="height:40px; font-weight:800; color:var(--accent-orange); margin:15px 0; font-size: 1.2rem;"></div>
                                <button id="l4-btn-minigame" class="action-btn" style="background:var(--accent-purple);">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l4-minigame" class="l4-section" style="display:none;">
                            <div class="l-left">
                                <div class="note-options" style="display:flex; justify-content:center; gap:40px;">
                                    <div class="opt-btn" data-ans="sharp">${getNoteSVG('sharp')}</div>
                                    <div class="opt-btn" data-ans="flat">${getNoteSVG('flat')}</div>
                                    <div class="opt-btn" data-ans="rest">🤫</div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="font-size:2rem;">🎯 ${currentLanguage === 'zh' ? '音乐魔法' : 'Musical Magic'}</h3>
                                <p id="sym-quiz-prompt" style="font-weight:800; font-size:1.2rem;"></p>
                                <div id="sym-quiz-feedback" style="height:40px; margin-top:10px; font-weight:800; font-size:1.5rem;"></div>
                            </div>
                        </div>
                        
                        <div id="lesson-pause-overlay" class="pause-overlay">
                            <div class="pause-icon">🤫</div>
                        </div>

                    </div>
                `;
            case 5:
                const ttMeas = currentLanguage === 'zh' ? '划分小节' : 'Bar Lines';

                return `
                    <div id="level5-container" style="position:relative; width:100%; min-height:400px; overflow:hidden;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l5-tutorial" class="l5-section active">
                            <div class="l-left">
                                <div id="l5-tut-stage" style="display:none; position:relative; width: 100%; height: 250px; background:var(--bg-main); border: 4px solid var(--accent-purple); border-radius: 20px; overflow:hidden;">
                                    <div id="l5-music-house" style="position:absolute; width:100%; height:100%; display:flex; box-sizing:border-box; align-items:flex-end; padding-bottom:20px; justify-content:center; gap: 0px;">
                                        <!-- Rooms will appear here -->
                                    </div>
                                    <div id="l5-tut-mole" style="font-size: 60px; position:absolute; left: -100px; bottom: 10px; transition: all 1s;">🐹</div>
                                </div>
                                <div id="l5-tut-text" style="font-weight:900; font-size:1.8rem; color:var(--text-main); margin-top:20px; text-align:center; min-height: 80px;"></div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttMeas}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'音乐也有房间！一起来看看吧！':"Music has rooms! Let's take a look!"}</p>
                                <button id="l5-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l5-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l5-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l5-practice" class="l5-section" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                    <div style="font-size: 3rem; margin-left: 20px;">🐹</div>
                                    <div class="drag-item" draggable="true" id="prac-bar-line-drag" data-type="barline" style="width: 20px; height: 100px; background: repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border-radius: 5px; cursor:grab; border: 2px solid #5C3A21; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"></div>
                                </div>
                                <div class="music-house-practice" style="position:relative; width: 100%; height: 180px; background: linear-gradient(to bottom, #FFF3E0, #FFE0B2); border: 4px solid #8D6E63; border-radius: 10px; display:flex; align-items:center; padding:0 10px; box-sizing:border-box; box-shadow: 0 10px 15px rgba(0,0,0,0.1); margin-top: 10px;">
                                    
                                    <!-- Roof overlay -->
                                    <div style="position:absolute; top: -25px; left: -10px; width: calc(100% + 20px); height: 40px; background: #E53935; border-radius: 10px; border: 4px solid #B71C1C; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"></div>
                                    <div style="position:absolute; top: -45px; left: 10%; width: 20px; height: 30px; background: #616161; border: 2px solid #424242; border-radius: 2px; z-index: -1;"></div> <!-- Chimney -->
                                    <div style="position:absolute; top: -60px; left: 12%; font-size: 14px; opacity: 0.6; animation: cloudFloat 3s infinite;">💨</div>

                                    <div class="practice-note-group" style="display:flex; align-items:center; justify-content:space-around; width: 50%; height: 100px; background: rgba(255,255,255,0.6); border-radius: 10px; margin-top: 20px;">
                                        <div style="font-size: 40px; margin-right:-10px;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; margin-right:-10px;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; margin-right:-10px;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; margin-right:-10px;">${getNoteSVG('quarter')}</div>
                                    </div>
                                    
                                    <!-- Drop zone for the barline -->
                                    <div class="drop-zone l5-prac-dz" data-accept="barline" style="width:25px; height:120px; border: 3px dashed #795548; border-radius:8px; margin: 20px 10px 0; flex-shrink:0; background:rgba(255,255,255,0.4);"></div>

                                    <div class="practice-note-group" style="display:flex; align-items:center; justify-content:space-around; width: 40%; height: 100px; background: rgba(255,255,255,0.6); border-radius: 10px; margin-top: 20px;">
                                        <div style="font-size: 40px;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px;">${getNoteSVG('quarter')}</div>
                                    </div>
                                    
                                    <div id="prac-built-barline" style="display:none; position:absolute; left: calc(50% + 15px); top: 30px; width:20px; height:130px; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; z-index:2;"></div>
                                    <div id="prac-room-overlay" style="position:absolute; left:10px; top:25px; height:calc(100% - 30px); width:calc(50% + 20px); background:rgba(100, 150, 255, 0.4); border-radius: 10px; display:none; pointer-events:none; z-index:1;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">${currentLanguage==='zh'?'装配房间':'Build a Room'}</h3>
                                <p style="font-size: 1.2rem; margin-bottom: 20px;">${currentLanguage==='zh'?'拖动小节线，把4拍分到一个房间里！':'Drag the bar line to close the room after 4 beats!'}</p>
                                <div id="l5-prac-feedback" style="height:40px; font-weight:bold; font-size:1.5rem; color:var(--accent-red);"></div>
                                <button id="l5-btn-minigame" class="action-btn" style="display:none; background:var(--accent-purple);">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l5-minigame" class="l5-section" style="display:none;">
                            <style>
                                @keyframes cloudFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                                @keyframes treeSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2deg); } }
                                .mg-scenery-cloud { animation: cloudFloat 4s ease-in-out infinite; }
                                .mg-scenery-tree { animation: treeSway 6s ease-in-out infinite; transform-origin: bottom center; }
                            </style>
                            <div class="l-left">
                                <div id="mg-train-scene" style="position:relative; width:100%; height:250px; background: linear-gradient(to bottom, #8BE1FF 0%, #D4F4FF 55%, #7BC576 55%, #59A554 100%); border: 4px solid #4a2f1d; border-radius:20px; overflow:hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);">
                                    
                                    <!-- Scenery -->
                                    <div class="mg-scenery-cloud" style="position:absolute; top:10px; left:30px; font-size:40px; opacity:0.8; animation-duration: 5s;">☁️</div>
                                    <div class="mg-scenery-cloud" style="position:absolute; top:30px; right:50px; font-size:50px; opacity:0.9; animation-duration: 7s;">☁️</div>
                                    <div class="mg-scenery-cloud" style="position:absolute; top:15px; left:50%; font-size:30px; opacity:0.7; animation-duration: 6s; animation-delay: 1s;">☁️</div>
                                    
                                    <div class="mg-scenery-tree" style="position:absolute; bottom:80px; left:10px; font-size:50px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2)); animation-delay: 0.5s;">🌲</div>
                                    <div class="mg-scenery-tree" style="position:absolute; bottom:95px; left:50px; font-size:35px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2)); animation-delay: 1.5s;">🌳</div>
                                    <div class="mg-scenery-tree" style="position:absolute; bottom:85px; right:20px; font-size:60px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2));">🌲</div>
                                    <div style="position:absolute; bottom:80px; right:80px; font-size:40px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2));">🏠</div>

                                    <!-- Tracks (Railway Design) -->
                                    <div style="position:absolute; bottom: 30px; width:100%; height:35px;">
                                        <!-- Sleepers -->
                                        <div style="position:absolute; bottom:0; width:100%; height:35px; background: repeating-linear-gradient(90deg, transparent, transparent 25px, #5C3A21 25px, #5C3A21 40px);"></div>
                                        <!-- Steel Rails -->
                                        <div style="position:absolute; bottom: 8px; width:100%; height:6px; background: #E0E0E0; box-shadow: 0 16px 0 #E0E0E0, 0 -2px 0 rgba(0,0,0,0.2);"></div>
                                    </div>
                                    
                                    <!-- Notes sequence -->
                                    <div id="mg-track-sequence" style="position:absolute; bottom: 75px; left: 10px; display:flex; align-items:flex-end; height: 60px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
                                        <!-- Group 1: 3 notes -->
                                        <div style="display:flex; gap: 5px; background: rgba(255,255,255,0.8); border-radius: 10px; padding: 5px; border: 2px solid white;">
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                        </div>
                                        
                                        <!-- DZ 1 (wrong, after 3 beats) -->
                                        <div class="drop-zone l5-mg-dz" data-idx="1" data-accept="barline" style="width:25px; height:80px; border: 3px dashed #fff; border-radius:5px; margin: 0 5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: -5px; left: -2px; width: 25px; height: 10px; background: #FFD700; border-radius:5px; border: 1px solid #B8860B;"></div></div>
                                        </div>
                                        
                                        <!-- Note 4 -->
                                        <div style="background: rgba(255,255,255,0.8); border-radius: 10px; padding: 5px; border: 2px solid white;">
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                        </div>
                                        
                                        <!-- DZ 2 (correct, after 4 beats) -->
                                        <div class="drop-zone l5-mg-dz correct-dz" data-idx="2" data-accept="barline" style="width:25px; height:80px; border: 3px dashed #fff; border-radius:5px; margin: 0 5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: -5px; left: -2px; width: 25px; height: 10px; background: #FFD700; border-radius:5px; border: 1px solid #B8860B;"></div></div>
                                        </div>

                                        <!-- Note 5 -->
                                        <div style="background: rgba(255,255,255,0.8); border-radius: 10px; padding: 5px; border: 2px solid white;">
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                        </div>

                                        <!-- DZ 3 (wrong, after 5 beats) -->
                                        <div class="drop-zone l5-mg-dz" data-idx="3" data-accept="barline" style="width:25px; height:80px; border: 3px dashed #fff; border-radius:5px; margin: 0 5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: -5px; left: -2px; width: 25px; height: 10px; background: #FFD700; border-radius:5px; border: 1px solid #B8860B;"></div></div>
                                        </div>
                                        
                                        <!-- Group 2: remaining 3 notes -->
                                        <div style="display:flex; gap: 5px; background: rgba(255,255,255,0.8); border-radius: 10px; padding: 5px; border: 2px solid white;">
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                            <div style="width:30px; height:40px;">${getNoteSVG('quarter')}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Moving Train -->
                                    <div id="mg-train-container" style="position:absolute; left: -100px; bottom: 50px; transition: left 1s linear; z-index:5;">
                                        <div style="font-size: 80px; transform: scaleX(-1); line-height: 80px; filter: drop-shadow(4px 4px 2px rgba(0,0,0,0.3));">🚂</div>
                                        <div id="mg-train-smoke" style="position:absolute; top:-10px; right:15px; font-size:30px; opacity:0; transition: opacity 0.2s;">💨</div>
                                    </div>
                                    
                                    <div id="mg-train-overlay" style="position:absolute; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; align-items:center; justify-content:center; flex-direction:column; z-index:10;">
                                        <div style="font-size: 80px;">🐹</div>
                                        <div style="color:white; font-size:2rem; font-weight:bold; background:var(--accent-red); padding:10px 20px; border-radius:20px; border: 3px solid white; text-align:center;">
                                            ${currentLanguage==='zh'?'哎呀！房间大小不对！':"Oops! The room sizes are wrong!"}
                                        </div>
                                        <button id="mg-train-retry" class="action-btn" style="background:var(--accent-blue); margin-top:20px;">↺ Retry</button>
                                    </div>
                                </div>
                                <div style="display:flex; justify-content:center; margin-top:20px;">
                                     <div class="drag-item" draggable="true" id="mg-bar-line-drag" data-type="barline" style="width: 25px; height: 100px; background: repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border-radius: 5px; cursor:grab; border: 2px solid #5C3A21; position:relative; box-shadow: 0 5px 10px rgba(0,0,0,0.2);">
                                        <div style="position:absolute; top: -5px; left: -2px; width: 25px; height: 10px; background: #FFD700; border-radius:5px; border: 1px solid #B8860B;"></div>
                                     </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 id="note-game-title" style="font-size:2rem; color:var(--accent-orange);">🚂 ${currentLanguage === 'zh' ? '小火车找轨道' : 'Train Track Builder'}</h3>
                                <p style="font-weight:800; font-size:1.2rem; margin-bottom:10px;">${currentLanguage==='zh'?'把小节线放在正确的位置上（每4拍一个房间），让小火车通过！':'Place the bar line in the correct spot (4 beats per room) so the train can pass!'}</p>
                                <button id="mg-train-start" class="action-btn" style="background:var(--accent-green);">▶️ ${currentLanguage==='zh'?'开动火车':'Start Train'}</button>
                                <div id="l5-mg-feedback" style="height:40px; font-weight:800; font-size: 1.5rem; color:var(--accent-green); margin-top:10px;"></div>
                            </div>
                        </div>

                    </div>
                `;
        }
    } else {
        // Vision Singing
        switch(parseInt(level)) {
            case 1:
                return `
                    <div id="vision1-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v1-tutorial" class="vision-section active l-split">
                            <div class="l-left">
                                <div id="v1-tut-stage" style="display:none; text-align:center; padding: 20px;">
                                    <div id="v1-tut-img" style="font-size:120px; transition: transform 0.3s; margin-bottom: 20px;"></div>
                                    <div id="v1-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${currentLanguage==='zh'?'发出声音':'Make a Sound'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'你能唱出相同的声音吗？':'Can you match the pitch?'}</p>
                                <button id="v1-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v1-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v1-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE/GAME SECTION -->
                        <div id="v1-practice" class="vision-section l-split" style="display:none;">
                            <div class="l-left" style="gap:20px; align-items:center;">
                                <div class="pitch-cards">
                                    <div class="pitch-card color-1" data-note="C">Do</div>
                                    <div class="pitch-card color-2" data-note="D">Re</div>
                                    <div class="pitch-card color-3" data-note="E">Mi</div>
                                    <div class="pitch-card color-4" data-note="F">Fa</div>
                                    <div class="pitch-card color-5" data-note="G">So</div>
                                </div>
                            </div>
                            <div class="l-right">
                                <div id="vision-feedback" class="feedback-msg" style="height: 40px; font-size:1.5rem;"></div>
                                <div id="vision-target-note" style="font-size: 2rem; font-weight: 800; color: var(--accent-purple); margin-bottom: 20px;"></div>
                                <button id="vision-start-game" class="action-btn">🎮 ${currentLanguage === 'zh' ? '听音辩位' : 'Match Pitch'}</button>
                            </div>
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <div id="vision2-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v2-tutorial" class="vision-section active l-split">
                            <div class="l-left">
                                <div id="v2-tut-stage" style="display:none; text-align:center; padding: 20px;">
                                    <div id="v2-tut-img" style="font-size:100px; display:flex; justify-content:center; gap:10px; margin-bottom: 20px;"></div>
                                    <div id="v2-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${currentLanguage==='zh'?'音乐记忆':'Melody Memory'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'像音乐鹦鹉一样模仿！':'Repeat like a musical parrot!'}</p>
                                <button id="v2-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v2-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v2-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE/GAME SECTION -->
                        <div id="v2-practice" class="vision-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div class="sequence-display" id="sequence-bars" style="height: 60px;"></div>
                                <div class="pitch-cards mini" style="justify-content:center;">
                                    <div class="pitch-card mini color-1" data-note="C">Do</div>
                                    <div class="pitch-card mini color-2" data-note="D">Re</div>
                                    <div class="pitch-card mini color-3" data-note="E">Mi</div>
                                    <div class="pitch-card mini color-4" data-note="F">Fa</div>
                                    <div class="pitch-card mini color-5" data-note="G">So</div>
                                </div>
                            </div>
                            <div class="l-right">
                                <div id="melody-feedback" class="feedback-msg" style="height: 40px; font-size:1.5rem;"></div>
                                <button id="melody-play-btn" class="action-btn">🎵 ${currentLanguage === 'zh' ? '播放旋律' : 'Play Melody'}</button>
                            </div>
                        </div>
                    </div>
                `;
            case 3:
                return `
                    <div id="vision3-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v3-tutorial" class="vision-section active l-split">
                            <div class="l-left">
                                <div id="v3-tut-stage" style="display:none; text-align:center; padding: 20px;">
                                    <div id="v3-tut-img" style="font-size:120px; transition: transform 0.1s; margin-bottom: 20px;"></div>
                                    <div id="v3-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-red);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-red); font-size:2rem;">❤️ ${currentLanguage === 'zh' ? '稳定的心跳' : 'Steady Heartbeat'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage === 'zh' ? '音乐和心跳一样，有稳定的节奏哦！' : 'Music has a steady beat, just like your heart!'}</p>
                                <button id="v3-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v3-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v3-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE/GAME SECTION -->
                        <div id="v3-practice" class="vision-section l-split" style="display:none;">
                            <div class="l-left">
                                <div id="beat-ripple-pad" class="ripple-container" style="margin: 0 auto;">
                                    <span id="heart-beat" class="heart-icon">❤️</span>
                                </div>
                            </div>
                            <div class="l-right">
                                <div id="timing-feedback" class="timing-feedback" style="height:40px; font-size:1.5rem; font-weight:bold;"></div>
                                <p style="margin-top:10px; font-weight:800; font-size:1.5rem; color:var(--accent-blue);">${currentLanguage === 'zh' ? '跟着心跳点点看！' : 'Tap along with the beat!'}</p>
                                <button id="beat-start-btn" class="action-btn" style="background:var(--accent-red); margin-top:20px;">🥁 ${currentLanguage === 'zh' ? '开始同步' : 'Start Sync'}</button>
                            </div>
                        </div>
                    </div>
                `;
            case 4:
                return `
                    <div id="vision4-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v4-tutorial" class="vision-section active l-split">
                            <div class="l-left">
                                <div id="v4-tut-stage" style="display:none; text-align:center; padding: 20px;">
                                    <div id="v4-tut-img" style="font-size:120px; transition: transform 0.1s; margin-bottom: 20px;"></div>
                                    <div id="v4-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-blue); font-size:2rem;">🎶 ${currentLanguage === 'zh' ? '多变的节奏' : 'Varied Rhythm'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage === 'zh' ? '有时候快，有时候慢！' : 'Sometimes fast, sometimes slow!'}</p>
                                <button id="v4-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v4-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v4-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE/GAME SECTION -->
                        <div id="v4-practice" class="vision-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div class="rhythm-tray">
                                    <div class="pattern-display" id="rhythm-pattern" style="justify-content: center; gap: 15px;">
                                        <!-- Markers added by JS -->
                                    </div>
                                </div>
                                <div class="drum-input-area" style="margin:20px 0; display:flex; justify-content:center;">
                                    <div id="rhythm-tap-pad" class="drum-pad-large" style="background:var(--accent-blue); width: 100px; height: 100px; font-size: 50px;">🥁</div>
                                </div>
                            </div>
                            <div class="l-right">
                                <div id="rhythm-feedback" class="feedback-msg" style="height: 40px; font-size: 1.5rem;"></div>
                                <div class="game-control-panel">
                                    <button id="rhythm-lesson-play" class="action-btn" style="background:var(--accent-orange); margin-bottom:10px;">👂 ${currentLanguage === 'zh' ? '先听听看' : 'Listen First'}</button>
                                    <button id="rhythm-start-btn" class="action-btn" style="background:var(--accent-green); margin-bottom:10px;">🚀 ${currentLanguage === 'zh' ? '我来挑战' : 'My Turn'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 5:
                return `
                    <div id="vision5-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v5-tutorial" class="vision-section active l-split">
                            <div class="l-left">
                                <div id="v5-tut-stage" style="display:none; text-align:center; padding: 20px;">
                                    <div id="v5-tut-img" style="font-size:120px; transition: transform 0.1s; margin-bottom: 20px;"></div>
                                    <div id="v5-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue);"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">⭐ ${currentLanguage === 'zh' ? '星光节拍' : 'Star catching beat'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage === 'zh' ? '在星星落在底线时按下鼓！' : 'Tap the drum when the star hits the line!'}</p>
                                <button id="v5-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v5-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v5-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE/GAME SECTION -->
                        <div id="v5-practice" class="vision-section l-split" style="display:none;">
                            <div class="l-left" style="align-items:center; flex-direction:column; gap:10px;">
                                <div class="rhythm-game-frame" style="width:100%; max-width:400px; height: 300px; border-radius:12px; margin-top:20px;">
                                    <div class="game-lane" id="game-lane">
                                        <div class="target-line"></div>
                                    </div>
                                    <div class="game-ui-overlay">
                                        <div id="game-score">0</div>
                                        <div id="game-feedback" class="game-popup-fb"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <div class="drum-input-area" style="display:flex; justify-content:center; margin-bottom:20px;">
                                    <div id="star-tap-pad" class="drum-pad-large" style="width:100px; height:100px; font-size:50px;">🥁</div>
                                </div>
                                <button id="star-game-start" class="action-btn" style="background:var(--accent-green);">🚀 ${currentLanguage === 'zh' ? '开始冲刺' : 'Start Game'}</button>
                            </div>
                        </div>
                    </div>
                `;
        }
    }
    return "";
}

function attachLessonListeners(type, level) {
    if (type === 'theory' && level == 1) {
        
        // Navigation Setup
        const btnStartTut = document.getElementById('l1-btn-start-tut');
        const btnPractice = document.getElementById('l1-btn-practice');
        const btnMinigame = document.getElementById('l1-btn-minigame');
        const tutArea = document.getElementById('l1-tutorial');
        const pracArea = document.getElementById('l1-practice');
        const mgArea = document.getElementById('l1-minigame');
        const staffArea = document.getElementById('l1-staff-area');
        const handArea = document.getElementById('l1-hand-area');

        // Tutorial Flow
        if (btnStartTut) {
            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                if(staffArea) staffArea.style.display = 'flex';
                
                // Turn on lines 1..5
                let i = 1;
                const speakNext = () => {
                    if (i <= 5) {
                        const el = document.getElementById('sl-' + i);
                        if (el) el.style.backgroundColor = 'var(--accent-red)';
                        const numWordsEn = ['One', 'Two', 'Three', 'Four', 'Five'];
                        const numWordsZh = ['第一线', '第二线', '第三线', '第四线', '第五线'];
                        const word = currentLanguage === 'zh' ? numWordsZh[i-1] : 'Line ' + numWordsEn[i-1];
                        
                        if (document.getElementById('top-tutorial-text')) document.getElementById('top-tutorial-text').innerText = word;
                        SpeechService.speak(word, currentLanguage, () => {
                            i++;
                            setTimeout(speakNext, 300);
                        });
                    } else {
                        // Transition to Spaces
                        setTimeout(() => {
                            let j = 1;
                            const speakNextSpace = () => {
                                if (j <= 4) {
                                    const el = document.getElementById('sp-' + j);
                                    if (el) el.style.backgroundColor = 'rgba(102, 187, 106, 0.5)';
                                    const sWordsEn = ['One', 'Two', 'Three', 'Four'];
                                    const sWordsZh = ['第一间', '第二间', '第三间', '第四间'];
                                    const word = currentLanguage === 'zh' ? sWordsZh[j-1] : 'Space ' + sWordsEn[j-1];
                                    
                                    if (document.getElementById('top-tutorial-text')) document.getElementById('top-tutorial-text').innerText = word;
                                    SpeechService.speak(word, currentLanguage, () => {
                                        j++;
                                        setTimeout(speakNextSpace, 300);
                                    });
                                } else {
                                    // Transition to hand
                                    setTimeout(() => {
                                        if(handArea) handArea.style.display = 'block';
                                        
                                        const hText = currentLanguage === 'zh' ? '五根手指就像五条线！大拇指是第一线！' : 'Five fingers make the staff. The thumb is Line 1!';
                                        if(document.getElementById('top-tutorial-text')) document.getElementById('top-tutorial-text').innerText = hText;
                                        SpeechService.speak(hText, currentLanguage, () => {
                                            if (btnPractice) btnPractice.style.display = 'inline-block';
                                        });
                                    }, 1000);
                                }
                            };
                            const sIntro = currentLanguage === 'zh' ? '手指之间就是间' : 'Spaces are between the lines';
                            SpeechService.speak(sIntro, currentLanguage, () => {
                                setTimeout(speakNextSpace, 300);
                            });
                        }, 500);
                    }
                };
                speakNext();
            };
        }

        // Practice Flow
        let currentPracTarget = 'line3';
        let pracStars = 0;
        const labels = {
            line1: currentLanguage==='zh'?'第一线':'1st Line',
            line2: currentLanguage==='zh'?'第二线':'2nd Line',
            line3: currentLanguage==='zh'?'第三线':'3rd Line',
            line4: currentLanguage==='zh'?'第四线':'4th Line',
            line5: currentLanguage==='zh'?'第五线':'5th Line',
            space1: currentLanguage==='zh'?'第一间':'1st Space',
            space2: currentLanguage==='zh'?'第二间':'2nd Space',
            space3: currentLanguage==='zh'?'第三间':'3rd Space',
            space4: currentLanguage==='zh'?'第四间':'4th Space'
        };

        const updatePrac = () => {
            const keys = Object.keys(labels);
            currentPracTarget = keys[Math.floor(Math.random() * keys.length)];
            const promptStr = currentLanguage === 'zh' ? '请点击: ' : 'Click the: ';
            document.getElementById('l1-prac-prompt').innerText = promptStr + labels[currentPracTarget];
        };

        if (btnPractice) {
            btnPractice.onclick = () => {
                if(tutArea) tutArea.style.display = 'none';
                if(pracArea) pracArea.style.display = 'block';
                updatePrac();
                // Start practicing instruction
                SpeechService.speak(document.getElementById('l1-prac-prompt').innerText);
            };
        }

        document.querySelectorAll('.prac-target').forEach(el => {
            el.onclick = () => {
                const ans = el.dataset.ans;
                const fb = document.getElementById('l1-prac-feedback');
                if (ans === currentPracTarget) {
                    SoundService.playSuccess();
                    fb.innerText = "⭐ " + (currentLanguage === 'zh' ? "对了！" : "Correct!");
                    fb.style.color = "var(--accent-green)";
                    pracStars++;
                    if (pracStars >= 3) {
                        btnMinigame.style.display = 'inline-block';
                    }
                    setTimeout(() => {
                        fb.innerText = "";
                        updatePrac();
                        SpeechService.speak(document.getElementById('l1-prac-prompt').innerText);
                    }, 1500);
                } else {
                    SoundService.playWrong();
                    fb.innerText = "❌ " + (currentLanguage === 'zh' ? "再试试！" : "Try again!");
                    fb.style.color = "var(--accent-red)";
                }
            };
        });

        // Minigame Flow (Staff Scramble)
        if (btnMinigame) {
            btnMinigame.onclick = () => {
                if(pracArea) pracArea.style.display = 'none';
                if(mgArea) mgArea.style.display = 'block';
                initMinigame();
            };
        }

        function initMinigame() {
            // Drag and Drop Logic
            const drags = document.querySelectorAll('.drag-item');
            const drops = document.querySelectorAll('.drop-zone');
            
            drags.forEach(d => {
                d.ondragstart = (e) => {
                    e.dataTransfer.setData('type', d.dataset.type);
                    d.style.opacity = '0.5';
                };
                d.ondragend = (e) => {
                    d.style.opacity = '1';
                };
            });
            
            let matchedFound = 0;
            drops.forEach(d => {
                d.ondragover = (e) => e.preventDefault();
                d.ondrop = (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type');
                    const fb = document.getElementById('l1-mg-feedback');
                    if (d.dataset.accept === type) {
                        SoundService.playSuccess();
                        d.innerText = "⭐";
                        fb.innerText = currentLanguage==='zh'?'棒极了！':'Awesome!';
                        fb.style.color="var(--accent-green)";
                        
                        // hide drag item
                        document.querySelector(`.drag-item[data-type="${type}"]`).style.visibility = 'hidden';
                        
                        matchedFound++;
                        if (matchedFound >= 5) {
                            ProgressService.updateStars('theory', 1, 3);
                            fb.innerText = currentLanguage==='zh'?'任务完成！获得3颗星！':'Quest Complete! 3 Stars!';
                        }
                    } else {
                        SoundService.playWrong();
                        fb.innerText = currentLanguage==='zh'?'位置不对哦':'Oops, wrong spot!';
                        fb.style.color="var(--accent-red)";
                    }
                };
            });
        }
    }
    if (type === 'theory' && level == 2) {
        const btnStartTut = document.getElementById('l2-btn-start-tut');
        const btnPracticeBtn = document.getElementById('l2-btn-practice');
        const btnMinigame = document.getElementById('l2-btn-minigame');
        const tutArea = document.getElementById('l2-tutorial');
        const pracArea = document.getElementById('l2-practice');
        const mgArea = document.getElementById('l2-minigame');
        
        const tutStage = document.getElementById('l2-tut-stage');
        const tutStem = document.getElementById('tut-note-stem');
        const tutHead = document.getElementById('tut-note-head');
        const tutText = document.getElementById('l2-tut-text');

        // Tutorial Flow
        if (btnStartTut) {
            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                const speechText1 = currentLanguage === 'zh' ? '这是符头，圆圆的像个小脑袋' : 'This is the note head, round and plump!';
                const speechText2 = currentLanguage === 'zh' ? '这是符杆，直直的像根小拐杖' : 'This is the note stem, straight and tall!';
                
                // Animate Head
                tutHead.style.fill = 'var(--accent-red)';
                tutHead.style.transform = 'rotate(-20deg) scale(1.2) translate(-5px, -5px)';
                tutText.innerHTML = `<span style="color:var(--accent-red); background:var(--bg-main); padding: 5px 20px; border-radius: 20px; border: 3px solid var(--accent-red);">${currentLanguage === 'zh' ? '符头 (Note Head)' : 'Note Head'}</span>`;
                
                SoundService.playSuccess();
                SpeechService.speak(speechText1, currentLanguage, () => {
                    tutHead.style.fill = 'var(--text-main)';
                    tutHead.style.transform = 'rotate(-20deg) scale(1)';
                    tutText.innerHTML = '';
                    
                    // Animate Stem
                    setTimeout(() => {
                        tutStem.style.fill = 'var(--accent-blue)';
                        tutStem.style.transform = 'translate(-4px, -10px) scale(1.1)';
                        tutText.innerHTML = `<span style="color:var(--accent-blue); background:var(--bg-main); padding: 5px 20px; border-radius: 20px; border: 3px solid var(--accent-blue);">${currentLanguage === 'zh' ? '符杆 (Note Stem)' : 'Note Stem'}</span>`;
                        
                        SoundService.playSuccess();
                        SpeechService.speak(speechText2, currentLanguage, () => {
                            tutStem.style.fill = 'var(--text-main)';
                            tutStem.style.transform = 'scale(1)';
                            
                            setTimeout(() => {
                                btnPracticeBtn.style.display = 'inline-block';
                                tutText.innerText = currentLanguage === 'zh' ? '一起来组装好朋友吧！' : 'Let us practice together!';
                                SpeechService.speak(tutText.innerText);
                            }, 500);
                        });
                    }, 800);
                });
            };
        }

        // Practice Flow
        if (btnPracticeBtn) {
            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'block';
                startPractice();
            };
        }

        let pracTarget = 'head';
        const startPractice = () => {
            pracTarget = Math.random() > 0.5 ? 'head' : 'stem';
            const promptEl = document.getElementById('l2-prac-prompt');
            promptEl.innerText = (currentLanguage === 'zh') 
                ? (pracTarget==='head' ? '哪个是符头？' : '哪个是符杆？') 
                : (pracTarget==='head' ? 'Which is the Head?' : 'Which is the Stem?');
            SpeechService.speak(promptEl.innerText);
        };

        document.querySelectorAll('.prac-target-note').forEach(el => {
            el.onclick = () => {
                const ans = el.dataset.ans;
                const fb = document.getElementById('l2-prac-feedback');
                if (ans === pracTarget) {
                    SoundService.playSuccess();
                    el.style.fill = ans === 'head' ? 'var(--accent-red)' : 'var(--accent-blue)';
                    fb.innerText = "🌟 " + (currentLanguage === 'zh' ? '太棒了！正确！' : 'Excellent! Correct!');
                    fb.style.color = "var(--accent-green)";
                    createConfetti();
                    setTimeout(() => {
                        el.style.fill = 'var(--text-main)';
                        fb.innerText = '';
                        btnMinigame.style.display = 'inline-block';
                        startPractice();
                    }, 2000);
                } else {
                    SoundService.playWrong();
                    fb.innerText = "❌ " + (currentLanguage === 'zh' ? '不对哦，再试一次' : 'Not quite, try again');
                    fb.style.color = "var(--accent-red)";
                }
            };
        });

        // Minigame Flow
        if (btnMinigame) {
            btnMinigame.onclick = () => {
                pracArea.style.display = 'none';
                mgArea.style.display = 'block';
                initMiniGame();
            };
        }

        const initMiniGame = () => {
            SpeechService.speak(currentLanguage==='zh'?'拖动符头和符杆，拼成一个完整的音符吧！':'Drag the Head and Stem into the box to build a note!');
            const drags = mgArea.querySelectorAll('.drag-item');
            const drops = mgArea.querySelectorAll('.drop-zone');
            
            drags.forEach(d => {
                d.ondragstart = (e) => {
                    e.dataTransfer.setData('type', d.dataset.type);
                    d.style.opacity = '0.5';
                };
                d.ondragend = (e) => {
                    d.style.opacity = '1';
                };
            });
            
            let matched = 0;
            drops.forEach(d => {
                d.ondragover = (e) => e.preventDefault();
                d.ondrop = (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type');
                    const fb = document.getElementById('l2-mg-feedback');
                    if (d.dataset.accept === type) {
                        SoundService.playSuccess();
                        d.style.display = 'none';
                        document.getElementById('mg-built-' + type).style.display = 'block';
                        
                        // Hide the draggable original
                        drags.forEach(drag => { if(drag.dataset.type === type) drag.style.visibility = 'hidden'; });
                        
                        fb.innerText = "✨ " + (currentLanguage === 'zh' ? '放好啦！' : 'Nice placed!');
                        fb.style.color="var(--accent-green)";
                        
                        matched++;
                        if (matched >= 2) {
                            ProgressService.updateStars('theory', 2, 3);
                            fb.innerText = currentLanguage==='zh'?'太棒了！组装完成！获得3颗星！':'Awesome! Note built! 3 Stars!';
                            createConfetti();
                            playNote(392, 1); // Play a pleasant sound for the completed note
                        }
                    } else {
                        SoundService.playWrong();
                        fb.innerText = currentLanguage==='zh'?'位置不对哦':'Oops, wrong spot!';
                        fb.style.color="var(--accent-red)";
                    }
                };
            });
        };
    }
    if (type === 'theory' && level == 3) {
        
        const btnStartTut = document.getElementById('l3-btn-start-tut');
        const btnPracticeBtn = document.getElementById('l3-btn-practice');
        const btnMinigame = document.getElementById('l3-btn-minigame');
        const tutArea = document.getElementById('l3-tutorial');
        const pracArea = document.getElementById('l3-practice');
        const mgArea = document.getElementById('l3-minigame');
        const tutStage = document.getElementById('l3-tut-stage');
        const tutImg = document.getElementById('l3-tut-img');
        const tutBarFill = document.getElementById('l3-tut-bar-fill');
        const tutText = document.getElementById('l3-tut-text');

        const tutSteps = [
            { id: 'whole', beats: 4, name: currentLanguage === 'zh' ? '全音符 — 保持 (Hold it)' : 'Whole note — hold it' },
            { id: 'half', beats: 2, name: currentLanguage === 'zh' ? '二分音符 — 保持 (Hold)' : 'Half — hold' },
            { id: 'quarter', beats: 1, name: currentLanguage === 'zh' ? '四分音符 — 点击 (Tap)' : 'Quarter — tap' },
            { id: 'eighth', beats: 0.5, name: currentLanguage === 'zh' ? '八分音符 — 快按 (Quick tap)' : 'Eighth — quick tap' }
        ];

        btnStartTut.onclick = () => {
            btnStartTut.style.display = 'none';
            tutStage.style.display = 'block';

            let step = 0;
            const runStep = () => {
                if (step < tutSteps.length) {
                    const ts = tutSteps[step];
                    tutImg.innerHTML = getNoteSVG(ts.id);
                    tutText.innerText = ts.name;
                    
                    tutBarFill.style.transition = 'none';
                    tutBarFill.style.width = '0%';
                    let widthPercent = (ts.beats / 4) * 100;
                    
                    // Play Claps rather than synth note sweeping
                    let numClaps = ts.beats >= 1 ? ts.beats : 1;
                    for(let i=0; i < numClaps; i++) {
                        // For quarter/eighth, it's just 1 clap at time 0
                        // For half, claps at 0, 1
                        // For whole, claps at 0, 1, 2, 3
                        playClap(i); 
                    }

                    setTimeout(() => {
                        tutBarFill.style.transition = `width ${ts.beats}s linear`;
                        tutBarFill.style.width = widthPercent + '%';
                    }, 50);

                    SpeechService.speak(ts.name, currentLanguage, () => {
                        step++;
                        setTimeout(runStep, 1000 + ts.beats*1000);
                    });
                } else {
                    btnPracticeBtn.style.display = 'inline-block';
                    SpeechService.speak(currentLanguage==='zh'?'试试看听听长短！':'Now you try it!');
                }
            };
            runStep();
        };

        btnPracticeBtn.onclick = () => {
            tutArea.style.display = 'none';
            pracArea.style.display = 'block';
        };

        const noteFreqs = { whole: 261, half: 329, quarter: 392, eighth: 523 };
        let practiceTaps = {};
        
        document.querySelectorAll('.duration-card').forEach(card => {
            const note = card.dataset.note;
            const totalBeats = parseFloat(card.dataset.beats);
            const tapsRequired = totalBeats >= 1 ? totalBeats : 1; 
            practiceTaps[note] = 0;

            card.onclick = () => {
                document.querySelectorAll('.duration-card').forEach(c => {
                    if (c !== card) {
                        c.classList.remove('playing');
                        const otherNote = c.dataset.note;
                        practiceTaps[otherNote] = 0;
                        const otherFill = document.getElementById(`fill-${otherNote}`);
                        if(otherFill) {
                           otherFill.style.transition = 'none';
                           otherFill.style.width = '0%';
                        }
                        c.querySelectorAll('.beat-dot').forEach(d => d.classList.remove('active'));
                    }
                });
                
                card.classList.add('playing');
                
                if (practiceTaps[note] < tapsRequired) {
                    practiceTaps[note]++;
                    playClap(0); // sound on every manual tap
                    
                    const fill = document.getElementById(`fill-${note}`);
                    const dots = card.querySelectorAll('.beat-dot');
                    
                    if (fill) {
                       fill.style.transition = 'width 0.1s ease-out';
                       fill.style.width = ((practiceTaps[note] / tapsRequired) * 100) + '%';
                    }
                    
                    if (practiceTaps[note] <= dots.length) {
                       dots[practiceTaps[note] - 1].classList.add('active');
                    }
                    
                    if (practiceTaps[note] === tapsRequired) {
                        setTimeout(() => {
                            playNote(noteFreqs[note], totalBeats);
                            
                            // Visual success
                            card.style.transform = 'scale(1.05)';
                            setTimeout(() => card.style.transform = 'scale(1)', 200);

                            setTimeout(() => {
                                card.classList.remove('playing');
                                practiceTaps[note] = 0;
                                if(fill) {
                                    fill.style.transition = 'none'; 
                                    fill.style.width = '0%';
                                }
                                dots.forEach(d => d.classList.remove('active'));
                            }, totalBeats * 1000 + 500);
                        }, 200);
                    }
                }
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
                        SoundService.playSuccess();
                        if (feedback) {
                            feedback.innerText = "🎉 " + (currentLanguage === 'zh' ? '真聪明！' : 'So Smart!');
                            feedback.style.color = "var(--accent-green)";
                        }
                        btn.style.background = 'var(--accent-green)';
                        createConfetti();
                        ProgressService.updateStars('theory', 3, 3);
                        setTimeout(() => {
                            btn.style.background = 'var(--white)';
                            updateDurQuiz();
                        }, 2000);
                    } else {
                        SoundService.playWrong();
                        optionsBox.classList.add('shake-error');
                        btn.style.background = '#FFCDD2';
                        setTimeout(() => {
                            optionsBox.classList.remove('shake-error');
                            btn.style.background = 'var(--white)';
                        }, 400);
                        if (feedback) {
                            feedback.innerText = currentLanguage === 'zh' ? '再试试看？' : 'Try again?';
                            feedback.style.color = "var(--accent-red)";
                        }
                    }
                };
            });
        };
        updateDurQuiz();

        btnMinigame.onclick = () => {
            pracArea.style.display = 'none';
            mgArea.style.display = 'block';
            SpeechService.speak(document.getElementById('dur-quiz-prompt').innerText);
        };
    }
    
    if (type === 'theory' && level == 4) {
        
        const btnStartTut = document.getElementById('l4-btn-start-tut');
        const btnPracticeBtn = document.getElementById('l4-btn-practice');
        const btnMinigame = document.getElementById('l4-btn-minigame');
        const tutArea = document.getElementById('l4-tutorial');
        const pracArea = document.getElementById('l4-practice');
        const mgArea = document.getElementById('l4-minigame');
        const tutStage = document.getElementById('l4-tut-stage');
        const tutImg = document.getElementById('l4-tut-img');
        const tutText = document.getElementById('l4-tut-text');

        const tutSteps = [
            { id: 'sharp', sound: 'high', name: currentLanguage === 'zh' ? '升号：变高！' : 'Sharp: Higher!' },
            { id: 'flat', sound: 'low', name: currentLanguage === 'zh' ? '降号：变低！' : 'Flat: Lower!' },
            { id: 'rest', sound: 'shh', name: currentLanguage === 'zh' ? '休止符：嘘...' : 'Rest: Shh...' }
        ];

        btnStartTut.onclick = () => {
            btnStartTut.style.display = 'none';
            tutStage.style.display = 'block';

            let step = 0;
            const runStep = () => {
                if (step < tutSteps.length) {
                    const ts = tutSteps[step];
                    tutImg.innerHTML = ts.id === 'rest' ? '🤫' : getNoteSVG(ts.id);
                    tutText.innerText = ts.name;
                    
                    if (ts.sound === 'high') {
                        playNote(261, 0.3); setTimeout(() => playNote(277, 0.5), 300);
                        tutImg.style.transform = 'translateY(-20px)';
                    } else if (ts.sound === 'low') {
                        playNote(261, 0.3); setTimeout(() => playNote(246, 0.5), 300);
                        tutImg.style.transform = 'translateY(20px)';
                    } else {
                        tutImg.style.transform = 'scale(1.2)';
                    }

                    setTimeout(() => { tutImg.style.transform = 'none'; }, 800);

                    SpeechService.speak(ts.name, currentLanguage, () => {
                        step++;
                        setTimeout(runStep, 800);
                    });
                } else {
                    btnPracticeBtn.style.display = 'inline-block';
                    SpeechService.speak(currentLanguage==='zh'?'点击魔法探索！':'Tap the magic!');
                }
            };
            runStep();
        };

        btnPracticeBtn.onclick = () => {
            tutArea.style.display = 'none';
            pracArea.style.display = 'block';
        };

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
                SpeechService.speak(info.innerText);
                
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
                        SoundService.playSuccess();
                        if (feedback) {
                            feedback.innerText = "🎊 " + (currentLanguage === 'zh' ? '没错！太聪明了' : 'Bingo! So smart');
                            feedback.style.color = "var(--accent-green)";
                        }
                        btn.style.background = 'var(--accent-green)';
                        createConfetti();
                        ProgressService.updateStars('theory', 4, 3);
                        setTimeout(() => {
                            btn.style.background = 'var(--white)';
                            updateSymQuiz();
                        }, 2000);
                    } else {
                        SoundService.playWrong();
                        btn.classList.add('shake-error');
                        btn.style.background = '#FFCDD2';
                        setTimeout(() => {
                            btn.classList.remove('shake-error');
                            btn.style.background = 'var(--white)';
                        }, 400);
                        if (feedback) {
                            feedback.innerText = (currentLanguage === 'zh' ? '不对哦，再试一次' : 'Not quite, try again');
                            feedback.style.color = "var(--accent-red)";
                        }
                    }
                };
            });
        };
        updateSymQuiz();

        btnMinigame.onclick = () => {
            pracArea.style.display = 'none';
            mgArea.style.display = 'block';
            SpeechService.speak(document.getElementById('sym-quiz-prompt').innerText);
        };
    }
    if (type === 'theory' && level == 5) {
        
        const btnStartTut = document.getElementById('l5-btn-start-tut');
        const btnPracticeBtn = document.getElementById('l5-btn-practice');
        const btnMinigame = document.getElementById('l5-btn-minigame');
        const tutArea = document.getElementById('l5-tutorial');
        const pracArea = document.getElementById('l5-practice');
        const mgArea = document.getElementById('l5-minigame');
        const tutStage = document.getElementById('l5-tut-stage');
        const tutMole = document.getElementById('l5-tut-mole');
        const tutHouse = document.getElementById('l5-music-house');
        const tutText = document.getElementById('l5-tut-text');

        // Tutorial Logic
        const tutSteps = [
            { act: 'enter', text: currentLanguage === 'zh' ? '音乐是被组织在小房间里的。' : 'Music is organized into little rooms.' },
            { act: 'rooms', text: currentLanguage === 'zh' ? '这些房间被叫做“小节”。' : 'These rooms are called bars.' },
            { act: 'lines', text: currentLanguage === 'zh' ? '这些垂直的线叫做小节线。' : 'These vertical lines are called bar lines.' },
            { act: 'divide', text: currentLanguage === 'zh' ? '它们把音乐分成一个一个的房间。' : 'They divide music into rooms.' },
            { act: 'notes', text: currentLanguage === 'zh' ? '当一个房间满了... 我们就建一个新房间！' : 'When a room is full... we make a new room!' }
        ];

        btnStartTut.onclick = () => {
            btnStartTut.style.display = 'none';
            tutStage.style.display = 'block';

            let step = 0;
            const runStep = () => {
                if (step < tutSteps.length) {
                    const ts = tutSteps[step];
                    tutText.innerText = ts.text;
                    
                    if (ts.act === 'enter') {
                        tutMole.style.left = '40%';
                    } else if (ts.act === 'rooms') {
                        tutHouse.innerHTML = `
                            <div style="width: 130px; height: 100px; border: 4px dashed #ccc; border-radius: 10px; position:relative; box-sizing:border-box;" id="tut-room-1"></div>
                            <div style="width: 130px; height: 100px; border: 4px dashed #ccc; border-radius: 10px; position:relative; display:none; box-sizing:border-box;" id="tut-room-2"></div>
                        `;
                    } else if (ts.act === 'lines') {
                        const rr = document.getElementById('tut-room-1');
                        if (rr) {
                            rr.style.borderRight = '6px solid var(--accent-blue)';
                            rr.style.borderStyle = 'dashed dashed dashed solid';
                            rr.style.borderRadius = '10px 0 0 10px';
                        }
                    } else if (ts.act === 'divide') {
                        const rr2 = document.getElementById('tut-room-2');
                        if (rr2) {
                            rr2.style.display = 'block';
                            rr2.style.borderRight = '6px solid var(--accent-blue)';
                            rr2.style.borderStyle = 'dashed dashed dashed solid';
                            rr2.style.borderRadius = '10px 0 0 10px';
                        }
                        tutMole.style.left = '10px';
                        tutMole.style.transform = 'scale(0.8)';
                    } else if (ts.act === 'notes') {
                        const rr = document.getElementById('tut-room-1');
                        if(rr) {
                            rr.innerHTML = `<div style="display:flex; justify-content:space-around; align-items:center; width:100%; height:100%; font-size:30px; margin-right: -5px;">
                                <div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div>
                            </div>`;
                            SoundService.playSuccess();
                        }
                    }

                    SpeechService.speak(ts.text, currentLanguage, () => {
                        step++;
                        setTimeout(runStep, 1000);
                    });
                } else {
                    btnPracticeBtn.style.display = 'inline-block';
                    SpeechService.speak(currentLanguage === 'zh' ? '来试试放置小节线吧！' : 'Try placing a bar line!');
                }
            };
            runStep();
        };

        btnPracticeBtn.onclick = () => {
            tutArea.style.display = 'none';
            pracArea.style.display = 'block';
            SpeechService.speak(currentLanguage === 'zh' ? '拖动小节线，把4拍分到一个房间里！' : 'Drag the bar line to close the room after 4 beats!');
        };

        // Practice Drag and Drop
        const pDrag = document.getElementById('prac-bar-line-drag');
        const pDrop = document.querySelector('.l5-prac-dz');
        const pFeedback = document.getElementById('l5-prac-feedback');

        pDrag.ondragstart = (e) => {
            e.dataTransfer.setData('type', pDrag.dataset.type);
            pDrag.style.opacity = '0.5';
        };
        pDrag.ondragend = () => {
            pDrag.style.opacity = '1';
        };

        pDrop.ondragover = (e) => e.preventDefault();
        pDrop.ondrop = (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            if (type === 'barline') {
                SoundService.playSuccess();
                pDrag.style.visibility = 'hidden';
                pDrop.style.display = 'none';
                document.getElementById('prac-built-barline').style.display = 'block';
                const overlay = document.getElementById('prac-room-overlay');
                overlay.style.display = 'block';
                
                // Sparkle animation
                overlay.animate([ {opacity: 0.2}, {opacity: 0.6}, {opacity: 0.2} ], { duration: 600, iterations: 2 });
                playNote(261.63, 0.4); setTimeout(() => playNote(329.63, 0.4), 200); setTimeout(() => playNote(392.00, 0.6), 400);

                pFeedback.innerText = currentLanguage === 'zh' ? '✨ 完美！房间建好了！' : '✨ Perfect! Room closed!';
                pFeedback.style.color = "var(--accent-green)";
                btnMinigame.style.display = 'inline-block';
            }
        };

        btnMinigame.onclick = () => {
            pracArea.style.display = 'none';
            mgArea.style.display = 'block';
            SpeechService.speak(currentLanguage === 'zh' ? '把小节线放在轨道上，让小火车通过！' : 'Place the bar line so the train can pass!');
        };

        // MiniGame Drag and Drop
        const mDrag = document.getElementById('mg-bar-line-drag');
        const mDrops = document.querySelectorAll('.l5-mg-dz');
        const mFeedback = document.getElementById('l5-mg-feedback');
        let mgTrackStatus = 'none';

        mDrag.ondragstart = (e) => {
            e.dataTransfer.setData('type', mDrag.dataset.type);
            mDrag.style.opacity = '0.5';
        };
        mDrag.ondragend = () => {
            mDrag.style.opacity = '1';
        };

        const setupDrops = () => {
            mDrops.forEach(drop => {
                drop.ondragover = (e) => e.preventDefault();
                drop.ondrop = (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type');
                    if (type === 'barline') {
                        SoundService.playSuccess();
                        mDrag.style.visibility = 'hidden';
                        
                        mDrops.forEach(d => {
                            d.style.background = 'rgba(255,255,255,0.5)';
                            const line = d.querySelector('.mg-built-barline');
                            if(line) line.style.display = 'none';
                        });

                        drop.style.background = 'transparent';
                        const line = drop.querySelector('.mg-built-barline');
                        if(line) line.style.display = 'block';
                        
                        if (drop.classList.contains('correct-dz')) {
                            mgTrackStatus = 'correct';
                        } else {
                            mgTrackStatus = drop.dataset.idx;
                        }
                        mFeedback.innerText = currentLanguage === 'zh' ? '👍 轨道拼接好了，开动火车试试！' : '👍 Track fixed, start the train!';
                    }
                };
            });
        };
        setupDrops();

        const trainContainer = document.getElementById('mg-train-container');
        const trainStartBtn = document.getElementById('mg-train-start');
        const trainOverlay = document.getElementById('mg-train-overlay');
        const trainRetryBtn = document.getElementById('mg-train-retry');
        const trainSmoke = document.getElementById('mg-train-smoke');

        trainStartBtn.onclick = () => {
            if (mgTrackStatus === 'none') {
                mFeedback.innerText = currentLanguage === 'zh' ? '请先拖动小节线！' : 'Please drag a bar line first!';
                return;
            }

            trainStartBtn.disabled = true;
            mDrops.forEach(d => { d.ondragover = null; d.ondrop = null; });

            // Play chugging sound and smoke
            let chugInterval = setInterval(() => {
                playClap(0);
                if (trainSmoke) {
                    trainSmoke.style.opacity = '1';
                    trainSmoke.style.transform = 'translate(20px, -20px) scale(1.5)';
                    setTimeout(() => {
                        trainSmoke.style.opacity = '0';
                        trainSmoke.style.transform = 'translate(0, 0) scale(0.5)';
                    }, 150);
                }
            }, 300);

            trainContainer.style.transition = 'left 1.5s linear';

            if (mgTrackStatus === 'correct') {
                trainContainer.style.left = '40%';
                setTimeout(() => {
                    clearInterval(chugInterval);
                    trainContainer.style.transition = 'left 1.5s linear';
                    trainContainer.style.left = '100%';
                    
                    let completeInterval = setInterval(() => { playClap(0); }, 300);
                    setTimeout(() => clearInterval(completeInterval), 1500);

                    SoundService.playSuccess();
                    mFeedback.innerText = currentLanguage === 'zh' ? '🌟 耶！火车安全通过！赢得3颗星！' : '🌟 Yay! Train passed! 3 Stars!';
                    ProgressService.updateStars('theory', 5, 3);
                    createConfetti();
                }, 1500);
            } else {
                const stopPos = mgTrackStatus === '1' ? '120px' : '200px';
                trainContainer.style.left = stopPos;
                
                setTimeout(() => {
                    clearInterval(chugInterval);
                    SoundService.playWrong();
                    trainOverlay.style.display = 'flex';
                    SpeechService.speak(currentLanguage === 'zh' ? '哎呀！让我们修理一下节奏！房间里必须有4拍！' : "Let's fix the rhythm! Rooms need 4 beats!");
                }, 1500);
            }
        };

        trainRetryBtn.onclick = () => {
            trainOverlay.style.display = 'none';
            trainContainer.style.transition = 'none';
            trainContainer.style.left = '-100px';
            trainStartBtn.disabled = false;
            mgTrackStatus = 'none';
            mFeedback.innerText = '';
            
            mDrag.style.visibility = 'visible';
            mDrops.forEach(d => {
                d.style.background = 'rgba(255,255,255,0.5)';
                const line = d.querySelector('.mg-built-barline');
                if(line) line.style.display = 'none';
            });
            setupDrops();
        };

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

            const btnStartTut = document.getElementById('v1-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v1-btn-practice');
            const tutArea = document.getElementById('v1-tutorial');
            const pracArea = document.getElementById('v1-practice');
            const tutStage = document.getElementById('v1-tut-stage');
            const tutImg = document.getElementById('v1-tut-img');
            const tutText = document.getElementById('v1-tut-text');

            const tutSteps = [
                { emoji: '🎼', freq: null, name: currentLanguage === 'zh' ? '每个音符都有名字和固定的声音。' : 'Every note has a name and a specific pitch.' },
                { emoji: 'Do', freq: frequencies['C'], name: currentLanguage === 'zh' ? '这是 Do (C)。' : 'This is Do (C).' },
                { emoji: 'Re', freq: frequencies['D'], name: currentLanguage === 'zh' ? '这是 Re (D)。' : 'This is Re (D).' },
                { emoji: 'Mi', freq: frequencies['E'], name: currentLanguage === 'zh' ? '这是 Mi (E)。' : 'This is Mi (E).' },
                { emoji: 'Fa', freq: frequencies['F'], name: currentLanguage === 'zh' ? '这是 Fa (F)。' : 'This is Fa (F).' },
                { emoji: 'So', freq: frequencies['G'], name: currentLanguage === 'zh' ? '这是 So (G)。' : 'This is So (G).' },
                { emoji: '🧑‍🎤', freq: null, name: currentLanguage === 'zh' ? '你能唱出一样的声音吗？' : 'Can you sing the same pitch?' },
                { emoji: '🗣️🎵', freq: null, name: currentLanguage === 'zh' ? '听声音，模仿它！' : 'Listen, then repeat!' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutImg.innerHTML = ts.emoji;
                        tutText.innerText = ts.name;
                        
                        if (ts.freq) {
                            playNote(ts.freq, 0.4);
                        } else {
                            SoundService.playSuccess();
                        }
                        tutImg.style.transform = 'scale(1.1)';
                        setTimeout(() => { if(tutImg) tutImg.style.transform = 'none'; }, 400);

                        SpeechService.speak(ts.name, currentLanguage, () => {
                            step++;
                            setTimeout(runStep, 800);
                        });
                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        SpeechService.speak(currentLanguage==='zh'?'准备好了吗？试试看！':'Ready? Try it out!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

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
            
            const btnStartTut = document.getElementById('v2-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v2-btn-practice');
            const tutArea = document.getElementById('v2-tutorial');
            const pracArea = document.getElementById('v2-practice');
            const tutStage = document.getElementById('v2-tut-stage');
            const tutImg = document.getElementById('v2-tut-img');
            const tutText = document.getElementById('v2-tut-text');

            const tutSteps = [
                { notes: [], text: currentLanguage === 'zh' ? '当音符组合在一起时，就变成了旋律。' : 'When notes are put together, they create a melody.' },
                { notes: ['C'], text: currentLanguage === 'zh' ? '仔细听小鸟唱歌...' : 'Listen to the bird sing...' },
                { notes: ['C', 'D', 'E'], text: currentLanguage === 'zh' ? '这三个音符组成的旋律是往上走的。' : 'This melody goes up.' },
                { notes: ['E', 'D', 'C'], text: currentLanguage === 'zh' ? '这三个音符组成的旋律是往下走的。' : 'This melody goes down.' },
                { notes: [], text: currentLanguage === 'zh' ? '你能记住它们的顺序吗？' : 'Can you remember their order?' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutImg.innerHTML = ts.notes && ts.notes.length > 0 ? ts.notes.map(n => `<div style="color:var(--accent-green);">🎵</div>`).join('') : '🎼';
                        tutText.innerText = ts.text;
                        
                        let idx = 0;
                        const playN = () => {
                            if(ts.notes && idx < ts.notes.length) {
                                playNote(frequencies[ts.notes[idx]], 0.4);
                                if (tutImg.children[idx]) {
                                    tutImg.children[idx].style.transform = 'translateY(-20px)';
                                    setTimeout(() => {
                                        if(tutImg.children[idx]) tutImg.children[idx].style.transform = 'none';
                                    }, 300);
                                }
                                idx++;
                                setTimeout(playN, 600);
                            } else {
                                if (!ts.notes || ts.notes.length === 0) SoundService.playSuccess();
                                SpeechService.speak(ts.text, currentLanguage, () => {
                                    step++;
                                    setTimeout(runStep, 1000);
                                });
                            }
                        };
                        playN();

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        SpeechService.speak(currentLanguage==='zh'?'现在轮到你了！':'Now it is your turn!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

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
            
            const btnStartTut = document.getElementById('v3-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v3-btn-practice');
            const tutArea = document.getElementById('v3-tutorial');
            const pracArea = document.getElementById('v3-practice');
            const tutStage = document.getElementById('v3-tut-stage');
            const tutImg = document.getElementById('v3-tut-img');
            const tutText = document.getElementById('v3-tut-text');

            const tutSteps = [
                { emoji: '❤️', text: currentLanguage === 'zh' ? '音乐和我们一样，有稳定的心跳！' : 'Music has a steady heartbeat, just like us!' },
                { emoji: '🎵 ❤️🎵', action: 'simulate', text: currentLanguage === 'zh' ? '这就是拍子，它很稳定，不快也不慢！' : 'This is the beat. It is steady, not fast, not slow!' },
                { emoji: '🥁', text: currentLanguage === 'zh' ? '我们要跟着拍子一起均匀地敲击！' : 'We need to tap along with the beat evenly!' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutImg.innerHTML = ts.emoji;
                        tutText.innerText = ts.text;
                        
                        if (ts.action === 'simulate') {
                            playNote(150, 0.1);
                            tutImg.style.transform = 'scale(1.2)';
                            setTimeout(() => { if(tutImg) tutImg.style.transform = 'none'; }, 200);

                            setTimeout(() => {
                                playNote(150, 0.1);
                                tutImg.style.transform = 'scale(1.2)';
                                setTimeout(() => { if(tutImg) tutImg.style.transform = 'none'; }, 200);
                            }, 500);
                        } else {
                            SoundService.playSuccess();
                        }
                        
                        SpeechService.speak(ts.text, currentLanguage, () => {
                            step++;
                            setTimeout(runStep, 800);
                        });

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        SpeechService.speak(currentLanguage==='zh'?'准备好了吗？试试看！':'Ready? Try it out!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

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
            
            const btnStartTut = document.getElementById('v4-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v4-btn-practice');
            const tutArea = document.getElementById('v4-tutorial');
            const pracArea = document.getElementById('v4-practice');
            const tutStage = document.getElementById('v4-tut-stage');
            const tutImg = document.getElementById('v4-tut-img');
            const tutText = document.getElementById('v4-tut-text');

            const tutSteps = [
                { emoji: '🎶', action: 'none', text: currentLanguage === 'zh' ? '音符有时候长，有时候短。长短组合就变成了多变的节奏！' : 'Notes can be long or short. Mixing them makes a varied rhythm!' },
                { emoji: '➖ ➖', action: 'long', text: currentLanguage === 'zh' ? '长的线条表示声音长，你要慢慢地敲。' : 'Long lines mean a long sound, you tap slowly.' },
                { emoji: '⬝ ⬝', action: 'short', text: currentLanguage === 'zh' ? '小圆点表示声音短，你要快快地敲。' : 'Small dots mean a short sound, you tap quickly.' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutImg.innerHTML = ts.emoji;
                        tutText.innerText = ts.text;
                        
                        if (ts.action === 'long') {
                            playNote(350, 0.6);
                            setTimeout(() => playNote(350, 0.6), 1000);
                        } else if (ts.action === 'short') {
                            playNote(350, 0.2);
                            setTimeout(() => playNote(350, 0.2), 400);
                        } else {
                            SoundService.playSuccess();
                        }

                        SpeechService.speak(ts.text, currentLanguage, () => {
                            step++;
                            setTimeout(runStep, 800);
                        });

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        SpeechService.speak(currentLanguage==='zh'?'准备好了吗？试试看！':'Ready? Try it out!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

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

            const btnStartTut = document.getElementById('v5-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v5-btn-practice');
            const tutArea = document.getElementById('v5-tutorial');
            const pracArea = document.getElementById('v5-practice');
            const tutStage = document.getElementById('v5-tut-stage');
            const tutImg = document.getElementById('v5-tut-img');
            const tutText = document.getElementById('v5-tut-text');

            const tutSteps = [
                { emoji: '📦', text: currentLanguage === 'zh' ? '在音乐里，长长短短的节奏被装进了一个个小节里。' : 'In music, rhythms are put together into measures.' },
                { emoji: '⭐', text: currentLanguage === 'zh' ? '我们要练习综合的节奏。把星星想象成节奏，它会落向底线。' : 'Let us practice combined rhythms. Stars are like rhythms falling to the line.' },
                { emoji: '🥁', text: currentLanguage === 'zh' ? '当星星刚好落到底部时，精准地按下小鼓吧！' : 'Tap the drum exactly when the star reaches the bottom line!' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutImg.innerHTML = ts.emoji;
                        tutText.innerText = ts.text;
                        
                        SoundService.playSuccess();
                        
                        SpeechService.speak(ts.text, currentLanguage, () => {
                            tutImg.style.transform = 'translateY(30px)';
                            setTimeout(() => { if(tutImg) tutImg.style.transform = 'none'; }, 300);
                            step++;
                            setTimeout(runStep, 800);
                        });

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        SpeechService.speak(currentLanguage==='zh'?'准备好了吗？开始打节拍！':'Ready? Start tapping!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = () => {
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

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

    const prefix = (type === 'theory' ? 'l' : 'v') + level;
    const btnStartTutDyn = document.getElementById(prefix + '-btn-start-tut');
    const btnSkipDyn = document.getElementById(prefix + '-btn-skip');
    const btnPracticeDyn = document.getElementById(prefix + '-btn-practice');
    
    if (btnStartTutDyn && btnSkipDyn && btnPracticeDyn) {
        btnStartTutDyn.addEventListener('click', () => {
            btnSkipDyn.style.display = 'inline-block';
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    if (btnPracticeDyn.style.display !== 'none') {
                        btnSkipDyn.style.display = 'none';
                    }
                }
            });
        });
        observer.observe(btnPracticeDyn, { attributes: true });

        btnSkipDyn.onclick = () => {
            btnSkipDyn.style.display = 'none';
            if (window._appTimeouts) {
                window._appTimeouts.forEach(id => __origClearTimeout(id));
                window._appTimeouts.clear();
            }
            SpeechService.stop();
            btnPracticeDyn.style.display = 'inline-block';
        };
    }
}

// Global cleanup for Vision Singing state
window._visionInterval = null;
window._visionTimeouts = [];

function createConfetti() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#FFD700', '#FF5252', '#4FC3F7', '#66BB6A', '#BA68C8'][Math.floor(Math.random() * 5)];
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// ==========================================
// GLOBALS EXPORT
// ==========================================
window.setLanguage = setLanguage;
window.openLesson = openLesson;
window.navigateTo = navigateTo;
window.startMiniGame = startMiniGame;
window.resetScores = resetScores;
window.closeMiniGame = closeMiniGame;
window.stopStarGame = stopStarGame;

window.playCardSound = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // A premium chime for cards
    playNote(523.25, 0.1); 
    setTimeout(() => playNote(659.25, 0.2), 80); 
};
