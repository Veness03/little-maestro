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
        sight: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    load() {
        try {
            const saved = localStorage.getItem('littleMaestroProgress');
            if (saved) {
                const parsed = JSON.parse(saved); if (parsed.vision && !parsed.sight) { parsed.sight = parsed.vision; delete parsed.vision; } this.data = { ...this.data, ...parsed };
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
        "sight-singing": "Sight Singing",
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
        "sight-lv1": "Level 1: The Rainbow Note Kingdom",
        "sight-lv2": "Level 2: Simple Melody",
        "sight-lv3": "Level 3: Beat",
        "sight-lv4": "Level 4: Sing the Rhythm",
        "sight-lv5": "Level 5: Rhythm Practice",
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
        "sight-singing": "视唱练习",
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
        "sight-lv1": "第一关: 彩虹音符王国",
        "sight-lv2": "第二关: 简单旋律",
        "sight-lv3": "第三关: 拍子",
        "sight-lv4": "第四关: 唱节奏",
        "sight-lv5": "第五关: 节奏综合练习",
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
    
    // Check for running intervals
    if (window.balloonInterval) clearInterval(window.balloonInterval);
    if (window._sightInterval) clearInterval(window._sightInterval);
    if (window._sightTimeouts) window._sightTimeouts.forEach(t => clearTimeout(t));
    if (window.stopLevel5Music) window.stopLevel5Music();
    if (window.stopLevel5Mic) window.stopLevel5Mic();
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        isMetronomePlaying = false;
    }
    
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

    // Clean up Sight Singing intervals
    if (window._sightInterval) clearInterval(window._sightInterval);
    if (window._sightTimeouts) window._sightTimeouts.forEach(clearTimeout);
    window._sightTimeouts = [];

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

const getTrainEngineSVG = (width=80, height=80) => `
<svg width="${width}" height="${height}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 5)">
    <path d="M 10 20 L 45 20 L 45 75 L 10 75 Z" fill="#E53935" stroke="#B71C1C" stroke-width="3"/>
    <path d="M 18 30 L 38 30 L 38 50 L 18 50 Z" fill="#E0F7FA" stroke="#0288D1" stroke-width="2"/>
    <path d="M 5 15 L 50 15 L 50 25 L 5 25 Z" fill="#424242"/>
    <path d="M 45 40 L 85 40 L 85 75 L 45 75 Z" fill="#1E88E5" stroke="#1565C0" stroke-width="3"/>
    <rect x="55" y="40" width="4" height="35" fill="#FFC107"/>
    <rect x="70" y="40" width="4" height="35" fill="#FFC107"/>
    <path d="M 65 20 L 75 20 L 75 40 L 65 40 Z" fill="#424242"/>
    <path d="M 60 10 L 80 10 L 75 20 L 65 20 Z" fill="#616161"/>
    <path d="M 100 75 L 85 55 L 85 75 Z" fill="#757575"/>
    <path d="M 95 75 L 88 62 L 88 75 Z" fill="#424242"/>
    <circle cx="28" cy="80" r="14" fill="#F44336" stroke="#424242" stroke-width="4"/>
    <circle cx="55" cy="82" r="10" fill="#F44336" stroke="#424242" stroke-width="4"/>
    <circle cx="80" cy="82" r="10" fill="#F44336" stroke="#424242" stroke-width="4"/>
    <path d="M 28 80 L 80 82" stroke="#E0E0E0" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
`;

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
    
    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.1;
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
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseSource.start(time);
    
    // Add a low thud for the hand impact
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    const oscGain = audioCtx.createGain();
    
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
    
    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.1);
}

function playBirdSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

    osc.frequency.setValueAtTime(2500, audioCtx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(3500, audioCtx.currentTime + 0.25);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
}

function playElephantSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc2.type = 'square';
    
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 1.0);
    
    osc2.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(270, audioCtx.currentTime + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 1.0);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
    
    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1.0);
    osc2.stop(audioCtx.currentTime + 1.0);
}

function playDogSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
    
    setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.15);
        gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 0.02);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.15);
    }, 200);
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
    sight: {
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
            en: { title: "Level 4: Little Footprints", content: "Learn about the different lengths of notes!" },
            zh: { title: "第四关: 小小足迹", content: "认识各种长短不同的音符！" }
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
            <div id="top-tutorial-text" class="bubble" style="text-align: center; margin-bottom: 20px;">${data.content}</div>
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
                                    <div style="background:var(--white); border-radius:30px; padding:30px; max-width:250px; margin:0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 3px solid #eee;">
                                        <svg width="150" height="220" viewBox="0 0 100 150" style="overflow:visible;">
                                            <rect id="tut-note-stem" x="54" y="20" width="6" height="80" fill="#ddd" rx="3" style="transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: 57px 100px;" />
                                            <ellipse id="tut-note-head" cx="38" cy="95" rx="20" ry="14" fill="#ddd" style="transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: 38px 95px; transform: rotate(-20deg);" />
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
                const ttSym = currentLanguage === 'zh' ? '符号峡谷' : 'The Symbol Valley';
                return `
                    <div id="level4-container" style="position:relative; width:100%; min-height:400px;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="l4-tutorial" class="l4-section active">
                            <div class="l-left">
                                <div id="l4-tut-stage" style="display:none; text-align:center; padding: 20px; width: 100%;">
                                    <div id="l4-tut-img" style="font-size:120px; transition: transform 0.3s; margin-bottom: 20px; height: 120px; line-height: 1;"></div>
                                    <div id="l4-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-blue); height: 60px;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttSym}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'认识音乐的神秘门卫！':'Recognize the magical music gates!'}</p>
                                <button id="l4-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l4-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l4-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l4-practice" class="l4-section" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div class="symbols-gallery" style="display:flex; justify-content:center; gap:30px; flex-wrap:wrap;">
                                    <div class="symbol-card" data-sym="treble">
                                        <div class="symbol-icon-large" style="font-size:80px; line-height:1;">𝄞</div>
                                        <span class="symbol-title">${currentLanguage === 'zh' ? '高音谱号' : 'Treble Clef'}</span>
                                    </div>
                                    <div class="symbol-card" data-sym="bass">
                                        <div class="symbol-icon-large" style="font-size:80px; line-height:1;">𝄢</div>
                                        <span class="symbol-title">${currentLanguage === 'zh' ? '低音谱号' : 'Bass Clef'}</span>
                                    </div>
                                    <div class="symbol-card" data-sym="alto">
                                        <div class="symbol-icon-large" style="font-size:80px; line-height:1;">𝄡</div>
                                        <span class="symbol-title">${currentLanguage === 'zh' ? '中音谱号' : 'Alto Clef'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">${currentLanguage==='zh'?'找到魔法门卫！':'Find the magic gates!'}</h3>
                                <div id="sym-info-txt" style="height:40px; font-weight:800; color:var(--accent-orange); margin:15px 0; font-size: 1.2rem;"></div>
                                <button id="l4-btn-minigame" class="action-btn" style="display:none; background:var(--accent-purple);">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="l4-minigame" class="l4-section" style="display:none; flex-direction:column; align-items:center; justify-content:center; width:100%;">
                            <h3 style="font-size:2rem; text-align:center; width: 100%;">🎈 ${currentLanguage === 'zh' ? '接住飞走的气球！' : 'Clef Catch!'}</h3>
                            <p id="sym-quiz-prompt" style="font-weight:800; font-size:1.5rem; color:var(--accent-blue); text-align:center; width: 100%;"></p>
                            <div id="balloon-container" style="position:relative; width:100%; max-width:600px; height:350px; background:linear-gradient(to top, #E0F6FF, #87CEEB); border-radius:20px; overflow:hidden; border:4px solid var(--accent-purple); box-shadow: inset 0 0 20px rgba(255,255,255,0.7); margin: 20px auto 0 auto;">
                                <!-- Balloons spawn here -->
                            </div>
                            <div id="sym-quiz-feedback" style="height:40px; margin-top:20px; font-weight:800; font-size:1.5rem; text-align:center; width: 100%;"></div>
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
                                <div id="l5-tut-stage" style="display:none; position:relative; width: 100%; height: 350px; background:linear-gradient(to bottom, #8BE1FF 0%, #D4F4FF 100%); border: 4px solid var(--accent-purple); border-radius: 20px; overflow:hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);">
                                    <!-- Tracks -->
                                    <div style="position:absolute; bottom: 30px; width:100%; height:35px;">
                                        <div style="position:absolute; bottom:0; width:100%; height:35px; background: repeating-linear-gradient(90deg, transparent, transparent 25px, #5C3A21 25px, #5C3A21 40px);"></div>
                                        <div style="position:absolute; bottom: 8px; width:100%; height:6px; background: #E0E0E0; box-shadow: 0 16px 0 #E0E0E0, 0 -2px 0 rgba(0,0,0,0.2);"></div>
                                    </div>
                                    <div id="l5-music-house" style="position:absolute; width:100%; height:100%; display:flex; box-sizing:border-box; align-items:flex-end; padding-bottom:60px; justify-content:center; gap: 5px;">
                                        <!-- Train cars will appear here -->
                                    </div>
                                    <div id="l5-tut-mole" style="display:none; font-size: 60px; position:absolute; left: -100px; bottom: 10px; transition: all 1s;"></div>
                                    <div id="l5-tut-engine" style="display:none; position:absolute; left: 100%; bottom: 50px; transition: all 1s; filter: drop-shadow(4px 4px 2px rgba(0,0,0,0.3)); z-index: 10;">
                                        ${getTrainEngineSVG(100, 100)}
                                    </div>
                                </div>
                                <div id="l5-tut-text" style="font-weight:900; font-size:1.8rem; color:var(--text-main); margin-top:20px; text-align:center; min-height: 80px;"></div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">${ttMeas}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage==='zh'?'音乐也有小火车！一起来看看吧！':"Music is like a train! Let's take a look!"}</p>
                                <button id="l5-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="l5-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="l5-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="l5-practice" class="l5-section" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                    <div style="font-size: 3rem; margin-left: 20px;"></div>
                                    <div class="drag-item" draggable="true" id="prac-bar-line-drag" data-type="barline" style="width: 20px; height: 100px; background: repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border-radius: 5px; cursor:grab; border: 2px solid #5C3A21; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                        <div style="position:absolute; top: 40px; left: -8px; font-size: 20px; transform: rotate(90deg);">🔗</div>
                                    </div>
                                </div>
                                <div class="music-house-practice" style="position:relative; width: 100%; height: 180px; background: linear-gradient(to bottom, #8BE1FF, #D4F4FF); border: 4px solid var(--accent-purple); border-radius: 10px; display:flex; justify-content:center; align-items:center; padding:0 10px; box-sizing:border-box; box-shadow: inset 0 0 20px rgba(0,0,0,0.1); margin-top: 10px; overflow:hidden;">
                                    
                                    <!-- Tracks -->
                                    <div style="position:absolute; bottom: 10px; width:100%; height:35px;">
                                        <div style="position:absolute; bottom:0; width:100%; height:35px; background: repeating-linear-gradient(90deg, transparent, transparent 25px, #5C3A21 25px, #5C3A21 40px);"></div>
                                        <div style="position:absolute; bottom: 8px; width:100%; height:6px; background: #E0E0E0; box-shadow: 0 16px 0 #E0E0E0, 0 -2px 0 rgba(0,0,0,0.2);"></div>
                                    </div>

                                    <div class="practice-note-group" style="display:flex; align-items:center; justify-content:space-evenly; width: 100%; max-width: 450px; height: 100px; background: var(--bg-card); border: 3px solid var(--accent-blue); border-radius: 10px; padding: 0; box-sizing: border-box; position:relative; box-shadow: 0 5px 10px rgba(0,0,0,0.2);">
                                        
                                        <!-- Wheels -->
                                        <div style="position:absolute; bottom:-12px; left:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                                        <div style="position:absolute; bottom:-12px; left:150px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                                        <div style="position:absolute; bottom:-12px; right:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                                        <div style="position:absolute; bottom:-12px; right:150px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>

                                        <!-- Engine Graphic -->
                                        <div style="position:absolute; left:-90px; top:-10px; filter: drop-shadow(4px 4px 2px rgba(0,0,0,0.3)); z-index: 10;">
                                            ${getTrainEngineSVG(80, 80)}
                                        </div>

                                        <!-- Overlay for successful completion -->
                                        <div id="prac-room-overlay" style="position:absolute; left:0; top:0; height:100%; width: 62%; background:rgba(255, 215, 0, 0.4); border-radius: 10px 0 0 10px; display:none; pointer-events:none; z-index:1;"></div>

                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                        
                                        <!-- WRONG Drop zone -->
                                        <div class="drop-zone l5-prac-dz wrong-dz" data-accept="barline" style="position:relative; width:22px; height:110px; border: 3px dashed #795548; border-radius:8px; flex-shrink:0; background:rgba(255,255,255,0.8); z-index:10; margin: 0 5px;"></div>

                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                        
                                        <!-- Correct Drop zone -->
                                        <div class="drop-zone l5-prac-dz correct-dz" data-accept="barline" style="position:relative; width:22px; height:110px; border: 3px dashed #795548; border-radius:8px; flex-shrink:0; background:rgba(255,255,255,0.8); z-index:10; margin: 0 5px;">
                                            <div id="prac-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing:content-box;">
                                                <div style="position:absolute; top: 40px; left: -2px; font-size: 20px; transform: rotate(90deg); filter: drop-shadow(0 0 5px yellow);">🔗</div>
                                            </div>
                                        </div>

                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                        <div style="font-size: 40px; z-index:2; width:30px; display:flex; justify-content:center;">${getNoteSVG('quarter')}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:2rem;">${currentLanguage==='zh'?'连接车厢':'Connect the Train Cars'}</h3>
                                <p style="font-size: 1.2rem; margin-bottom: 20px;">${currentLanguage==='zh'?'拖动小节线（连接器），把4拍分到一个车厢里！':'Drag the bar line (coupler) to connect the train car after 4 beats!'}</p>
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
                                .train-shake { animation: trainHalt 0.3s cubic-bezier(.36,.07,.19,.97) both; }
                                @keyframes trainHalt { 10%, 90% { transform: translate3d(-1px, 0, 0) scaleX(-1); } 20%, 80% { transform: translate3d(2px, 0, 0) scaleX(-1); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0) scaleX(-1); } 40%, 60% { transform: translate3d(4px, 0, 0) scaleX(-1); } }
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
                                    <div id="mg-track-sequence" style="position:absolute; bottom: 75px; left: 10px; right: 10px; display:flex; align-items:center; justify-content:space-evenly; height: 80px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); background: rgba(255,255,255,0.7); border-radius: 10px; padding: 5px 10px; border: 2px solid white;">
                                        
                                        <!-- Beat 1, 2 -->
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                        
                                        <!-- Beat 3, 4 -->
                                        <div style="width:30px; height:45px; color:#1976D2;" title="Half Note (2 beats)">${getNoteSVG('half')}</div>
                                        
                                        <!-- correct1: 4 beats -->
                                        <div class="drop-zone l5-mg-dz correct-dz" data-idx="correct1" data-accept="barline" style="width:25px; height:70px; border: 3px dashed #795548; border-radius:5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: 25px; left: -8px; font-size: 20px; transform: rotate(90deg); filter: drop-shadow(0 0 5px yellow);">🔗</div></div>
                                        </div>
                                        
                                        <!-- Beat 5, 6 -->
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                        
                                        <!-- wrong1: 6 beats -->
                                        <div class="drop-zone l5-mg-dz" data-idx="wrong1" data-accept="barline" style="width:25px; height:70px; border: 3px dashed #795548; border-radius:5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: 25px; left: -8px; font-size: 20px; transform: rotate(90deg); filter: drop-shadow(0 0 5px yellow);">🔗</div></div>
                                        </div>
                                        
                                        <!-- Beat 7, 8 -->
                                        <div style="width:30px; height:45px; color:#1976D2;" title="Half Note (2 beats)">${getNoteSVG('half')}</div>
                                        
                                        <!-- correct2: 8 beats -->
                                        <div class="drop-zone l5-mg-dz correct-dz" data-idx="correct2" data-accept="barline" style="width:25px; height:70px; border: 3px dashed #795548; border-radius:5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: 25px; left: -8px; font-size: 20px; transform: rotate(90deg); filter: drop-shadow(0 0 5px yellow);">🔗</div></div>
                                        </div>

                                        <!-- Beat 9 -->
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                        
                                        <!-- wrong2: 9 beats -->
                                        <div class="drop-zone l5-mg-dz" data-idx="wrong2" data-accept="barline" style="width:25px; height:70px; border: 3px dashed #795548; border-radius:5px; position:relative; z-index:2; background:rgba(255,255,255,0.4);">
                                             <div class="mg-built-barline" style="display:none; position:absolute; left:-2px; top:-2px; width:100%; height:100%; background:repeating-linear-gradient(#A0522D, #A0522D 10px, #8B4513 10px, #8B4513 20px); border: 2px solid #5C3A21; border-radius:5px; box-sizing: content-box;"><div style="position:absolute; top: 25px; left: -8px; font-size: 20px; transform: rotate(90deg); filter: drop-shadow(0 0 5px yellow);">🔗</div></div>
                                        </div>
                                        
                                        <!-- Beat 10, 11 -->
                                        <div style="width:30px; height:45px; color:#1976D2;" title="Half Note (2 beats)">${getNoteSVG('half')}</div>
                                        
                                        <!-- Beat 12 -->
                                        <div style="width:30px; height:45px;">${getNoteSVG('quarter')}</div>
                                    </div>
                                    
                                    <!-- Moving Train -->
                                    <div id="mg-train-container" style="position:absolute; left: -100px; bottom: 50px; transition: left 1s linear; z-index:5;">
                                        <div id="mg-train-emoji" style="filter: drop-shadow(4px 4px 2px rgba(0,0,0,0.3)); display:inline-block;">${getTrainEngineSVG(100, 100)}</div>
                                        <div id="mg-train-smoke" style="position:absolute; top:-20px; right:50px; font-size:30px; opacity:0; transition: opacity 0.2s;">💨</div>
                                    </div>
                                    
                                    <div id="mg-train-overlay" style="position:absolute; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; align-items:center; justify-content:center; flex-direction:column; z-index:10;">
                                        <div style="font-size: 80px; transform: scaleX(-1);">${getTrainEngineSVG(80, 80)}</div>
                                        <div style="color:white; font-size:2rem; font-weight:bold; background:var(--accent-red); padding:10px 20px; border-radius:20px; border: 3px solid white; text-align:center;">
                                            ${currentLanguage==='zh'?'哎呀！连接器尺寸不合适！':'Oops! That coupler does not fit!'}
                                        </div>
                                        <button id="mg-train-retry" class="action-btn" style="background:var(--accent-blue); margin-top:20px;">↺ ${currentLanguage==='zh'?'再试一次':'Retry'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        }
    } else {
        switch(parseInt(level)) {
            case 1:
                return `
                    <div id="sight1-container" class="level-split-container">
                        <!-- TUTORIAL SECTION -->
                        <div id="v1-tutorial" class="sight-section active l-split" style="flex-direction: column; background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%); position: relative; overflow: hidden; padding: 10px; border-radius: 20px;">
                            <!-- Clouds backdrop -->
                            <div style="position:absolute; top:5%; left:10%; font-size:40px; opacity:0.8; animation: floatCloud 20s infinite linear;">☁️</div>
                            <div style="position:absolute; top:15%; right:5%; font-size:50px; opacity:0.6; animation: floatCloud 25s infinite linear reverse;">☁️</div>
                            <div style="position:absolute; top:40%; left:2%; font-size:30px; opacity:0.7; animation: floatCloud 15s infinite linear;">☁️</div>
                            
                            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: wrap; z-index: 2; margin-bottom: 5px; gap: 10px;">
                                <div class="mascot" style="font-size: 40px; animation: bounce 2s infinite;">🐦</div>
                                <h1 style="font-size: clamp(1.2rem, 3vw, 1.8rem); margin: 0; color: #ffeb3b; text-shadow: 2px 2px 0px #ff9800, -2px -2px 0px #ff9800, 2px -2px 0px #ff9800, -2px 2px 0px #ff9800; font-family: 'Comic Sans MS', cursive, sans-serif;">🌈 ${currentLanguage==='zh'?'彩虹音符王国':'The Rainbow Note Kingdom'} ✨</h1>
                                <div class="bubble" style="font-size: clamp(1rem, 2vw, 1.2rem); padding: 5px 10px; border-width: 3px; border-color: #ff9800; background: white; color: #333; margin: 0;" id="v1-tut-bubble">
                                    ${currentLanguage==='zh'?'欢迎来到彩虹王国！':'Welcome to the Rainbow Note Kingdom!'}
                                </div>
                            </div>
                            
                            <div id="v1-tut-action-area" style="text-align:center; padding: 5px; width: 100%; z-index: 2; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                <div id="v1-tut-creature-stage" style="min-height: 60px; display:flex; justify-content:center; align-items:center; font-size: 60px; margin-bottom: 5px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translateY(20px) scale(0); opacity: 0; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));"></div>
                                
                                <div id="v1-tut-lyrics" style="font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 900; color: #E91E63; height: 30px; margin-bottom: 10px; text-shadow: 2px 2px 0px white, -2px -2px 0px white, 2px -2px 0px white, -2px 2px 0px white, 0 4px 10px rgba(0,0,0,0.2);"></div>

                                <!-- GIANT PIANO BRIDGE -->
                                <div class="piano-container" style="max-width: 800px; width: 100%; margin: 0 auto; padding: 10px; background: transparent; box-shadow: none;">
                                    <div class="piano-keyboard" id="v1-tut-piano" style="height: 20vh; min-height: 150px; max-height: 250px; border-radius: 20px 20px 0 0; border: 4px solid #FF9800; box-shadow: 0 10px 30px rgba(0,0,0,0.3); background: linear-gradient(180deg, #fff 0%, #f5f5f5 100%);">
                                        <div class="key white" data-note="C4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #F44336; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Do</span></div>
                                        <div class="key black" style="left: 11.28%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                        <div class="key white" data-note="D4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #FF9800; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Re</span></div>
                                        <div class="key black" style="left: 25.57%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                        <div class="key white" data-note="E4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #FFEB3B; -webkit-text-stroke: 1px #F57F17; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Mi</span></div>
                                        <div class="key white" data-note="F4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #4CAF50; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Fa</span></div>
                                        <div class="key black" style="left: 54.14%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                        <div class="key white" data-note="G4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #2196F3; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Sol</span></div>
                                        <div class="key black" style="left: 68.42%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                        <div class="key white" data-note="A4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #9C27B0; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">La</span></div>
                                        <div class="key black" style="left: 82.71%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                        <div class="key white" data-note="B4" style="border-radius: 0 0 15px 15px;"><span style="position:absolute; bottom:15px; width:100%; left:0; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #E91E63; text-shadow: 1px 1px 0px #fff; white-space: nowrap;">Ti</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="text-align:center; z-index: 2; margin-top: 10px;">
                                <button id="v1-btn-start-tut" class="action-btn large" style="background:#4CAF50; font-size: 1.4rem; padding: 10px 30px; box-shadow: 0 5px 0 #2E7D32, 0 10px 15px rgba(0,0,0,0.2);">▶️ ${currentLanguage==='zh'?'开始冒险':'Start Adventure'}</button>
                                <button id="v1-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:#9E9E9E; margin-right: 15px; font-size: 1rem; padding: 10px 15px;">⏭ ${currentLanguage==='zh'?'跳过':'Skip'}</button>
                                <button id="v1-btn-practice" class="action-btn large" style="display:none; margin-left: 10px; background:#FF9800; font-size: 1.4rem; box-shadow: 0 5px 0 #E65100, 0 10px 15px rgba(0,0,0,0.2); padding: 10px 30px;">🎯 ${currentLanguage==='zh'?'去练习':'Practice Time'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION (Singing) -->
                        <div id="v1-practice" class="sight-section" style="display:none; flex-direction: column; align-items: center; width:100%; background: linear-gradient(180deg, #B3E5FC 0%, #E1BEE7 100%); position: relative; overflow: hidden; padding: 10px 20px; border-radius: 20px;">
                            <div style="position:absolute; top:10%; right:10%; font-size:70px; opacity:0.8; animation: floatCloud 22s infinite linear alternate;">☁️</div>
                            <div style="position:absolute; top:30%; left:5%; font-size:60px; opacity:0.9; animation: floatCloud 18s infinite linear alternate-reverse;">☁️</div>

                            <h2 style="color:#6A1B9A; text-shadow: 2px 2px 0px #fff; margin-bottom:5px; font-size: clamp(1.5rem, 3vw, 2.5rem); font-family: 'Comic Sans MS', cursive, sans-serif; z-index: 2;">☁️ ${currentLanguage==='zh'?'寻找唱歌的音符！':'Find the Singing Note!'}</h2>
                            <p style="font-weight:900; margin-bottom:5px; font-size: clamp(1rem, 2vw, 1.3rem); color: #4A148C; text-shadow: 1px 1px 0px #fff; z-index: 2;">${currentLanguage==='zh'?'云朵后面藏着谁？唱出正确的音高！':'Who is hiding? Sing the correct pitch!'}</p>
                            
                            <div id="v1-prac-stars" style="font-size: 30px; margin-bottom: 5px; color: #FFD54F; letter-spacing: 5px; text-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 2;">☆☆☆</div>
                            <div id="v1-prac-unlock-hint" style="font-size: clamp(0.9rem, 1.5vw, 1.2rem); color: #fff; font-weight: bold; background: rgba(0,0,0,0.3); padding: 2px 10px; border-radius: 10px; margin-bottom: 10px; z-index: 2;">${currentLanguage==='zh'?'集齐3颗星星解锁小游戏！':'Get 3 stars to unlock Mini Game!'}</div>

                            <!-- Cloud hiding area -->
                            <div id="prac-cloud-area" style="position: relative; width: 100%; height: 120px; display: flex; justify-content: center; align-items: center; z-index: 2;">
                                <div id="prac-cloud" style="font-size: 80px; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.2)); cursor: pointer; transition: transform 0.3s; z-index: 3;">☁️</div>
                                <div id="prac-hidden-note" style="position: absolute; font-size: 70px; opacity: 0; transform: scale(0); transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 2;"></div>
                            </div>

                            <div class="piano-container" style="max-width: 900px; width: 100%; margin: 0 auto; z-index: 2; padding: 5px; background: transparent; box-shadow: none;">
                                <div class="piano-keyboard" id="v1-prac-piano" style="height: 15vh; min-height: 100px; max-height: 180px; width: 100%; border-radius: 20px; border: 6px solid #BA68C8; box-shadow: 0 15px 40px rgba(0,0,0,0.2);">
                                    <div class="key white" data-note="C4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #F44336; white-space: nowrap;">Do</span></div>
                                    <div class="key black" style="left: 11.28%; height: 65%; width: 6%;"></div>
                                    <div class="key white" data-note="D4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #FF9800; white-space: nowrap;">Re</span></div>
                                    <div class="key black" style="left: 25.57%; height: 65%; width: 6%;"></div>
                                    <div class="key white" data-note="E4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #FFC107; white-space: nowrap;">Mi</span></div>
                                    <div class="key white" data-note="F4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #4CAF50; white-space: nowrap;">Fa</span></div>
                                    <div class="key black" style="left: 54.14%; height: 65%; width: 6%;"></div>
                                    <div class="key white" data-note="G4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #2196F3; white-space: nowrap;">Sol</span></div>
                                    <div class="key black" style="left: 68.42%; height: 65%; width: 6%;"></div>
                                    <div class="key white" data-note="A4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #9C27B0; white-space: nowrap;">La</span></div>
                                    <div class="key black" style="left: 82.71%; height: 65%; width: 6%;"></div>
                                    <div class="key white" data-note="B4"><span style="position:absolute; bottom:15px; left:0; width:100%; text-align:center; font-weight:900; font-size: clamp(0.7rem, 2vw, 1.4rem); color: #E91E63; white-space: nowrap;">Ti</span></div>
                                </div>
                            </div>
                            
                            <div id="sight-feedback" class="feedback-msg" style="min-height: 40px; font-size: clamp(1.2rem, 3vw, 1.8rem); margin-bottom: 10px; font-weight: 900; text-shadow: 2px 2px 0px white, -2px -2px 0px white, 2px -2px 0px white, -2px 2px 0px white; z-index: 2;"></div>
                            
                            <button id="sight-start-game" class="action-btn large" style="margin-bottom: 10px; font-size: clamp(1rem, 2vw, 1.4rem); padding: 10px 30px; background: #E91E63; box-shadow: 0 5px 0 #AD1457; z-index: 2;">▶️ ${currentLanguage === 'zh' ? '播放躲藏的音符' : 'Play Hidden Note'}</button>
                            
                            <div class="mic-controls" style="width: 100%; max-width: 600px; text-align: center; z-index: 2;">
                                <button id="sight-record-start" class="action-btn" style="background:#4CAF50; width:100%; margin-bottom:5px; display:inline-block; font-size: clamp(1rem, 2vw, 1.4rem); padding: 10px; box-shadow: 0 5px 0 #2E7D32;">🎤 ${currentLanguage === 'zh' ? '开启麦克风' : 'Enable Mic'}</button>
                                <button id="sight-record-stop" class="action-btn" style="display:none; background:#FF9800; width:100%; margin-bottom:5px; font-size: clamp(1rem, 2vw, 1.4rem); padding: 10px; box-shadow: 0 5px 0 #E65100;">🛑 ${currentLanguage === 'zh' ? '停止麦克风' : 'Stop Mic'}</button>
                                <div id="record-status" style="margin-top:5px; font-size: clamp(1rem, 2vw, 1.4rem); min-height: 30px; font-weight: 900; color: #1565C0; text-shadow: 1px 1px 0px #fff;"></div>
                                <div id="mic-visualizer" style="display:none; width: 100%; height: 20px; background: rgba(255,255,255,0.8); border-radius: 10px; margin-top: 5px; position: relative; overflow: hidden; border: 3px solid #1E88E5;">
                                    <div id="mic-bar" style="position: absolute; bottom: 0; left: 0; width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #2196F3); transition: width 0.1s;"></div>
                                </div>
                            </div>
                            
                            <div style="text-align:center; z-index: 2; margin-top: 15px;">
                                <button id="v1-btn-game" class="action-btn large" style="display:none; background:#2196F3; font-size: clamp(1rem, 2vw, 1.4rem); box-shadow: 0 5px 0 #0D47A1; padding: 10px 30px;">🎮 ${currentLanguage==='zh'?'小游戏':'Mini Game'}</button>
                            </div>
                        </div>
                        
                        <!-- MINIGAME SECTION (Rescue the Lost Notes) -->
                        <div id="v1-minigame" class="sight-section" style="display:none; flex-direction: column; align-items: center; width: 100%; background: linear-gradient(180deg, #FFF9C4 0%, #FFCC80 100%); padding: 20px; border-radius: 20px; position: relative; overflow: hidden;">
                            <h2 style="color:#E65100; margin-bottom:10px; font-size: 3rem; font-family: 'Comic Sans MS', cursive, sans-serif; text-shadow: 2px 2px 0px #fff; z-index: 2;">🏠 ${currentLanguage==='zh'?'拯救迷路的音符':'Rescue the Lost Notes'}</h2>
                            <p style="font-weight:900; margin-bottom:20px; font-size: 1.8rem; color: #BF360C; text-shadow: 1px 1px 0px #fff; z-index: 2;">${currentLanguage==='zh'?'音符们找不到家了！把它们拖进正确颜色的房子里！':'The notes are lost! Drag them to their correct musical homes!'}</p>
                            
                            <div id="v1-game-birdie" class="mascot-bubble" style="margin-bottom: 20px; z-index: 2;">
                                <div class="mascot" style="font-size: 70px;">🐦</div>
                                <div class="bubble" style="font-size: 1.5rem; font-weight: bold; border-color: #FF5722;" id="v1-game-bubble">
                                    ${currentLanguage==='zh'?'你能帮它们找到家吗？':'Can you help them go home?'}
                                </div>
                            </div>
                            
                            <div id="mg-floating-area" style="position: relative; width: 100%; max-width: 900px; height: 200px; display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 30px; z-index: 2;">
                                <!-- Draggable notes -->
                            </div>

                            <div id="mg-houses-area" style="width: 100%; max-width: 1000px; display: flex; justify-content: space-around; align-items: flex-end; padding-bottom: 20px; z-index: 2;">
                                <!-- Dropzone houses -->
                            </div>
                            
                            <button id="v1-btn-finish" class="action-btn large" style="display:none; margin-top:30px; background:#4CAF50; font-size: 2rem; padding: 20px 60px; box-shadow: 0 8px 0 #2E7D32; z-index: 2;">🌟 ${currentLanguage==='zh'?'完成彩虹关卡':'Complete Rainbow Level'} 🌟</button>
                        </div>
                        
                        <!-- Hidden confetti particles container -->
                            <div id="v1-confetti" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999;"></div>
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <div id="v2-container" style="position:relative; width:100%; min-height:500px; display:flex; flex-direction:column; align-items:center; overflow:hidden;">
                        
                        <!-- TUTORIAL START SCREEN -->
                        <div id="v2-tutorial-start" class="sight-section active" style="display:flex; flex-direction:column; align-items:center; width:100%; padding:20px;">
                            <h2 style="font-size:3rem; color:var(--accent-purple); margin-bottom:10px;">🎹 ${currentLanguage==='zh'?'简单旋律':'Simple Melody'}</h2>
                            <div class="mascot-bubble" style="margin-bottom: 30px; z-index: 2;">
                                <div class="mascot" style="font-size: 80px;">🐦</div>
                                <div class="bubble" style="font-size: 1.5rem; font-weight: bold; border-color: #FF5722;" id="v2-intro-bubble">
                                    ${currentLanguage==='zh'?'请选择一首歌来唱！':'Choose a song to sing!'}
                                </div>
                            </div>
                            
                            <div style="display:flex; justify-content:center; gap:30px; flex-wrap:wrap; margin-top:20px; z-index:2;">
                                <div class="v2-song-card" data-song="twinkle" style="background:white; border-radius:20px; padding:30px 20px; font-size:1.5rem; font-weight:bold; color:var(--accent-blue); box-shadow:0 10px 20px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.2s; text-align:center; width:220px; border:4px solid var(--accent-blue);">
                                    <div style="font-size:4rem; margin-bottom:10px;">🌟</div>
                                    ${currentLanguage==='zh'?'小星星':'Twinkle Star'}
                                </div>
                                <div class="v2-song-card" data-song="boat" style="background:white; border-radius:20px; padding:30px 20px; font-size:1.5rem; font-weight:bold; color:#4CAF50; box-shadow:0 10px 20px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.2s; text-align:center; width:220px; border:4px solid #4CAF50;">
                                    <div style="font-size:4rem; margin-bottom:10px;">🚣</div>
                                    ${currentLanguage==='zh'?'划小船':'Row Your Boat'}
                                </div>
                                <div class="v2-song-card" data-song="jingle" style="background:white; border-radius:20px; padding:30px 20px; font-size:1.5rem; font-weight:bold; color:#E91E63; box-shadow:0 10px 20px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.2s; text-align:center; width:220px; border:4px solid #E91E63;">
                                    <div style="font-size:4rem; margin-bottom:10px;">🎄</div>
                                    ${currentLanguage==='zh'?'铃儿响叮当':'Jingle Bells'}
                                </div>
                            </div>
                        </div>

                        <!-- PIANO TUTORIAL -->
                        <div id="v2-piano-tutorial" class="sight-section" style="display:none; flex-direction:column; align-items:center; width:100%; padding:20px; background:linear-gradient(to bottom, #e0f7fa, #b2ebf2); border-radius:20px;">
                            <h2 id="v2-tut-song-title" style="font-size:2.5rem; color:#0277bd; margin-bottom:10px;"></h2>
                            <div class="mascot-bubble" style="margin-bottom: 20px;">
                                <div class="mascot" style="font-size: 60px;">🐦</div>
                                <div class="bubble" id="v2-tut-bubble" style="font-size:1.5rem; border-color:#0277bd;">${currentLanguage==='zh'?'跟着颜色一起看！':'Follow the colors and listen!'}</div>
                            </div>
                            <div id="v2-tut-lyrics" style="font-size: 2rem; font-weight: 900; color: #E91E63; height: 50px; margin-bottom: 20px; letter-spacing: 5px;"></div>
                            
                            <div id="v2-tut-piano" class="piano-container" style="max-width: 600px; width: 100%; margin-bottom: 20px; background: transparent; box-shadow: none;">
                                <div class="piano-keyboard" style="height: 15vh; min-height: 120px; border-radius: 15px; border: 4px solid #0277bd;">
                                    <div class="key white v2-k" data-n="C" style="background:#ffcdd2; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#c62828;">Do</span></div>
                                    <div class="key black" style="left: 11.28%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-k" data-n="D" style="background:#ffe0b2; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#ef6c00;">Re</span></div>
                                    <div class="key black" style="left: 25.57%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-k" data-n="E" style="background:#fff9c4; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#f9a825;">Mi</span></div>
                                    <div class="key white v2-k" data-n="F" style="background:#c8e6c9; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#2e7d32;">Fa</span></div>
                                    <div class="key black" style="left: 54.14%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-k" data-n="G" style="background:#bbdefb; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#1565c0;">Sol</span></div>
                                    <div class="key black" style="left: 68.43%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-k" data-n="A" style="background:#e1bee7; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#6a1b9a;">La</span></div>
                                    <div class="key black" style="left: 82.72%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-k" data-n="B" style="background:#f8bbd0; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#ad1457;">Ti</span></div>
                                </div>
                            </div>
                            
                            <div style="margin-top:20px;">
                                <button id="v2-tut-practice-btn" class="action-btn" style="display:none; background:#FF9800; font-size:1.5rem; padding:10px 30px;">🎯 ${currentLanguage==='zh'?'开始练习':'Practice Time'}</button>
                                <button id="v2-tut-skip-btn" class="action-btn skip-btn-dynamic" style="background:#9e9e9e; margin-left:10px;">⏭ ${currentLanguage==='zh'?'跳过':'Skip'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="v2-practice" class="sight-section" style="display:none; flex-direction:column; align-items:center; width:100%; padding:20px; background:linear-gradient(to bottom, #fff3e0, #ffe0b2); border-radius:20px;">
                            <h2 style="font-size:2.5rem; color:#e65100; margin-bottom:10px;">🎯 ${currentLanguage==='zh'?'开始练习':'Practice Time'}</h2>
                            <div id="v2-prac-stars" style="font-size: 30px; margin-bottom: 10px; color: #FFD54F;">☆☆☆</div>
                            
                            <div class="mascot-bubble" style="margin-bottom: 20px;">
                                <div class="mascot" style="font-size: 60px;">🐦</div>
                                <div class="bubble" id="v2-prac-bubble" style="font-size:1.5rem; border-color:#e65100;">${currentLanguage==='zh'?'准备好了吗？':'Are you ready?'}</div>
                            </div>
                            
                            <div id="v2-prac-lyrics" style="font-size: 2rem; font-weight: 900; color: #E91E63; height: 50px; margin-bottom: 20px; letter-spacing: 5px;"></div>

                            <div id="v2-prac-piano" class="piano-container" style="max-width: 600px; width: 100%; opacity:0.9; background: transparent; box-shadow: none;">
                                <div class="piano-keyboard" style="height: 15vh; min-height: 120px; border-radius: 15px; border: 4px solid #e65100;">
                                    <div class="key white v2-pk" data-n="C" style="background:#ffcdd2; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#c62828;">Do</span></div>
                                    <div class="key black" style="left: 11.28%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-pk" data-n="D" style="background:#ffe0b2; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#ef6c00;">Re</span></div>
                                    <div class="key black" style="left: 25.57%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-pk" data-n="E" style="background:#fff9c4; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#f9a825;">Mi</span></div>
                                    <div class="key white v2-pk" data-n="F" style="background:#c8e6c9; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#2e7d32;">Fa</span></div>
                                    <div class="key black" style="left: 54.14%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-pk" data-n="G" style="background:#bbdefb; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#1565c0;">Sol</span></div>
                                    <div class="key black" style="left: 68.43%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-pk" data-n="A" style="background:#e1bee7; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#6a1b9a;">La</span></div>
                                    <div class="key black" style="left: 82.72%; height: 60%; width: 6%; border-radius: 0 0 8px 8px;"></div>
                                    <div class="key white v2-pk" data-n="B" style="background:#f8bbd0; border-radius: 0 0 10px 10px;"><span style="position:absolute; bottom:10px; left:0; width:100%; text-align:center; font-weight:bold; font-size:1.5rem; color:#ad1457;">Ti</span></div>
                                </div>
                            </div>
                            
                            <div id="v2-prac-action-area" style="text-align:center; margin-top:20px; width:100%; max-width:500px;">
                                <button id="v2-btn-start-prac" class="action-btn" style="background:#4CAF50; width:100%; font-size:1.5rem; padding:15px;">▶️ ${currentLanguage==='zh'?'开始练习':'Start Practice'}</button>
                                <div id="v2-prac-status" style="margin-top:10px; font-weight:bold; font-size:1.2rem; color:#e65100; min-height:30px;"></div>
                            </div>
                            <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                                <button id="v2-btn-game" class="action-btn" style="display:none; background:#2196F3; font-size:1.5rem; padding: 10px 30px;">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                                <button id="v2-btn-skip-prac" class="action-btn" style="background:#9e9e9e; font-size:1.5rem; padding: 10px 30px;">⏭ ${currentLanguage==='zh'?'跳过练习':'Skip Practice'}</button>
                            </div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="v2-minigame" class="sight-section" style="display:none; flex-direction:column; align-items:center; width:100%; padding:20px; background:linear-gradient(180deg, #e1f5fe, #81d4fa); border-radius:20px;">
                            <h2 style="font-size:3rem; color:#01579b; margin-bottom:10px; text-shadow: 2px 2px 0px #fff;">🌸 ${currentLanguage==='zh'?'荷叶旋律':'Lily Pad Melody'}</h2>
                            <div class="mascot-bubble" style="margin-bottom: 20px;">
                                    <div class="mascot" style="font-size: 60px;">🐦</div>
                                    <div class="bubble" id="v2-mg-bubble" style="font-size:1.5rem; border-color:#01579b;">
                                        ${currentLanguage==='zh'?'点击荷叶填满空位，按顺序拼出旋律！':'Click the lily pads to fill the spots and build the melody!'}
                                    </div>
                            </div>
                            
                            <!-- MELODY SLOTS -->
                            <div id="v2-mg-slots" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:30px; min-height:100px; width:100%; max-width:800px; background:rgba(255,255,255,0.4); border: 2px dashed #0288d1; padding:20px; border-radius:20px;">
                                <!-- dynamically inject slots here -->
                            </div>
                            
                            <div style="display:flex; gap:20px;">
                                <button id="v2-mg-play" class="action-btn" style="background:#4CAF50; font-size: 1.2rem; padding: 10px 20px;">▶️ ${currentLanguage==='zh'?'播放验证':'Play & Check'}</button>
                                <button id="v2-mg-clear" class="action-btn" style="background:#FF9800; font-size: 1.2rem; padding: 10px 20px;">🗑️ ${currentLanguage==='zh'?'清空':'Clear'}</button>
                            </div>

                            <!-- POND WITH DRAGGABLE LILY PADS -->
                            <div style="margin-top:30px; width:100%; max-width:800px; background:#0288d1; border-radius:40px; padding:30px; position:relative; overflow:hidden; box-shadow: inset 0 10px 20px rgba(0,0,0,0.2);">
                                <div style="position:absolute; top:10px; right:20px; font-size:40px; opacity:0.6;">🐟</div>
                                <div style="position:absolute; bottom:10px; left:20px; font-size:40px; opacity:0.5;">🐸</div>
                                <div id="v2-mg-pool" style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap; z-index:2; position:relative;">
                                    <!-- draggable notes -->
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 3:
                return `
                    <div id="sight3-container" class="level-split-container" style="flex-direction:column; gap:20px;">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v3-tutorial" class="sight-section active" style="flex-direction:column; padding:20px; align-items:center;">
                            <h2 style="font-size:clamp(2rem, 5vw, 3rem); color:var(--accent-purple); margin-bottom:10px; text-shadow: 2px 2px 0px #fff; text-align:center;">🎹 ${currentLanguage==='zh'?'拍拍点点':'Clap with the Dot'}</h2>
                            <div class="mascot-bubble" style="margin-bottom: 20px;">
                                <div class="mascot" style="font-size: 60px;">🐦</div>
                                <div class="bubble" id="v3-tut-bubble" style="font-size:1.5rem; border-color:var(--accent-purple);">
                                    ${currentLanguage==='zh'?'音乐有个小秘密——它也有心跳哦！':'Music has a secret — it has a heartbeat!'}
                                </div>
                            </div>

                            <div id="v3-tut-stage" style="display:none; text-align:center; min-height: 250px; position:relative; width:100%; max-width:600px; background:rgba(255,255,255,0.6); border-radius:30px; box-shadow:0 10px 30px rgba(0,0,0,0.1); padding:20px; overflow:hidden;">
                                <div id="v3-tut-visuals" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); display:flex; justify-content:center; align-items:center; gap:20px; width:100%; padding:20px;">
                                    <!-- visual elements dynamically injected -->
                                </div>
                            </div>
                            
                            <div style="margin-top:20px;">
                                <button id="v3-btn-start-tut" class="action-btn" style="background:var(--accent-blue); font-size:1.5rem;">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v3-btn-skip" class="action-btn" style="display:none; background:#9e9e9e; font-size:1.5rem; margin-right:10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v3-btn-practice" class="action-btn" style="display:none; background:var(--accent-green); font-size:1.5rem;">🎯 ${currentLanguage==='zh'?'去尝试':'Try it!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="v3-practice" class="sight-section" style="display:none; flex-direction:column; align-items:center; width:100%; padding:20px;">
                            <h2 style="font-size:2.5rem; color:#f57c00; margin-bottom:10px; text-shadow: 2px 2px 0px #fff; text-align:center;">🥁 ${currentLanguage==='zh'?'跟着节奏点一点':'Tap to the Beat'}</h2>
                            
                            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; width:100%; max-width:600px; flex-wrap:wrap;">
                                <div style="background:rgba(255,255,255,0.8); padding:10px; border-radius:20px; box-shadow:0 5px 15px rgba(0,0,0,0.1); flex:1; min-width:150px; text-align:center;">
                                    <h4 style="color:#666; margin-bottom:5px; font-size:1rem;">${currentLanguage==='zh'?'拍号':'Time Signature'}</h4>
                                    <div style="display:flex; justify-content:center; gap:5px;">
                                        <button id="v3-ts-2" class="action-btn" style="background:#2196F3; padding:5px 15px; font-size:1.2rem;">2/4</button>
                                        <button id="v3-ts-4" class="action-btn" style="background:#e0e0e0; color:#333; padding:5px 15px; font-size:1.2rem;">4/4</button>
                                    </div>
                                </div>
                                <div style="background:rgba(255,255,255,0.8); padding:10px; border-radius:20px; box-shadow:0 5px 15px rgba(0,0,0,0.1); flex:1; min-width:200px; text-align:center;">
                                    <h4 style="color:#666; margin-bottom:5px; font-size:1rem;">${currentLanguage==='zh'?'速度':'Speed'}</h4>
                                    <div style="display:flex; justify-content:center; gap:5px;">
                                        <button id="v3-sp-slow" class="action-btn" style="background:#4CAF50; padding:5px 15px; font-size:1rem;">🐢 ${currentLanguage==='zh'?'慢':'Slow'}</button>
                                        <button id="v3-sp-fast" class="action-btn" style="background:#e0e0e0; color:#333; padding:5px 15px; font-size:1rem;">🐰 ${currentLanguage==='zh'?'快':'Fast'}</button>
                                    </div>
                                </div>
                            </div>

                            <div class="mascot-bubble" style="margin-bottom: 10px;">
                                <div class="mascot" style="font-size: 50px;">🐦</div>
                                <div class="bubble" id="v3-prac-bubble" style="font-size:1.2rem; border-color:#f57c00;">
                                    ${currentLanguage==='zh'?'准备好了吗？当圆点亮起时，点击它！':'Ready? When the dot lights up, tap it!'}
                                </div>
                            </div>

                            <div style="position:relative; width:100%; max-width:400px; height:250px; background:#fff3e0; border-radius:30px; border:4px dashed #ffb74d; display:flex; justify-content:center; align-items:center; overflow:hidden;">
                                <div id="v3-prac-dot" style="width:120px; height:120px; background:#ff9800; border-radius:50%; box-shadow:0 10px 20px rgba(255,152,0,0.4); cursor:pointer; display:flex; justify-content:center; align-items:center; font-size:4rem; transition:transform 0.1s, background 0.1s; user-select:none;">
                                    🖐️
                                </div>
                                <!-- Beat markers container -->
                                <div id="v3-prac-markers" style="position:absolute; bottom:15px; left:0; width:100%; display:flex; justify-content:center; gap:10px;">
                                </div>
                            </div>

                            <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                                <button id="v3-btn-start-prac" class="action-btn" style="background:#4CAF50; font-size:1.5rem;">▶️ ${currentLanguage==='zh'?'开始':'Start'}</button>
                                <button id="v3-btn-stop-prac" class="action-btn" style="display:none; background:#F44336; font-size:1.5rem;">⏹ ${currentLanguage==='zh'?'停止':'Stop'}</button>
                                <button id="v3-btn-game" class="action-btn" style="display:none; background:#9C27B0; font-size:1.5rem;">🎮 ${currentLanguage==='zh'?'小游戏':'Mini Game'}</button>
                            </div>
                            <div id="v3-prac-stars" style="font-size:2rem; margin-top:10px; color:#ffc107; letter-spacing:5px;">☆☆☆</div>
                        </div>

                        <!-- MINIGAME SECTION -->
                        <div id="v3-minigame" class="sight-section" style="display:none; flex-direction:column; align-items:center; width:100%; padding:20px;">
                            <h2 style="font-size:3rem; color:#9C27B0; margin-bottom:10px; text-shadow: 2px 2px 0px #fff; text-align:center;">🚂 ${currentLanguage==='zh'?'节奏小火车':'Beat Train'}</h2>
                            
                            <div class="mascot-bubble" style="margin-bottom: 20px;">
                                <div class="mascot" style="font-size: 50px;">🐦</div>
                                <div class="bubble" id="v3-mg-bubble" style="font-size:1.2rem; border-color:#9C27B0;">
                                    ${currentLanguage==='zh'?'看车厢上的拍号！小球闪烁时，准确按拍子点击！':'Look at the time signature! When the dot blinks, tap the beat!'}
                                </div>
                            </div>

                            <div style="width:100%; max-width:800px; height:350px; background:linear-gradient(180deg, #81d4fa 0%, #e1f5fe 50%, #aed581 50%, #8bc34a 100%); border-radius:30px; position:relative; overflow:hidden; border:6px solid #4caf50;">
                                
                                <!-- sun/clouds -->
                                <div style="position:absolute; top:20px; right:30px; font-size:4rem;">☀️</div>
                                <div style="position:absolute; top:40px; left:50px; font-size:3rem; opacity:0.8; animation:floatCloud 20s linear infinite;">☁️</div>
                                
                                <!-- Indicator dot -->
                                <div style="position:absolute; top:20px; width:100%; display:flex; justify-content:center;">
                                    <div id="v3-mg-dot" style="width:40px; height:40px; background:#fff; border-radius:50%; box-shadow:0 0 10px rgba(0,0,0,0.2); transition:background 0.1s, transform 0.1s; display:none;"></div>
                                </div>

                                <!-- Tracks -->
                                <div id="v3-mg-tracks" style="position:absolute; bottom:40px; width:200%; height:8px; background:#795548; display:flex; transition: transform 0.5s linear;">
                                    ${Array(30).fill('<div style="width:15px; height:15px; background:#5d4037; transform:translateY(-3px);"></div>').join('<div style="width:25px;"></div>')}
                                </div>
                                
                                <!-- Train -->
                                <div id="v3-mg-train" style="position:absolute; bottom:48px; left:5vw; display:flex; align-items:flex-end; gap:5px; transition: transform 0.5s ease-out;">
                                    
                                    <!-- Engine -->
                                    <div style="width:80px; height:100px; position:relative;">
                                        <div style="position:absolute; bottom:0; width:80px; height:50px; background:#F44336; border-radius:10px 20px 0 0;"></div>
                                        <div style="position:absolute; bottom:50px; left:10px; width:30px; height:40px; background:#333; border-radius:10px 10px 0 0;">
                                            <div id="v3-mg-smoke" style="position:absolute; top:-30px; left:-5px; font-size:24px; opacity:0; transition:opacity 0.2s, transform 0.5s;">💨</div>
                                        </div>
                                        <div style="position:absolute; bottom:50px; right:10px; width:25px; height:25px; background:#81d4fa; border:3px solid #F44336; border-radius:50%;"></div>
                                        <div style="position:absolute; bottom:-10px; left:5px; width:25px; height:25px; background:#333; border:3px solid #9e9e9e; border-radius:50%;"></div>
                                        <div style="position:absolute; bottom:-10px; right:5px; width:25px; height:25px; background:#333; border:3px solid #9e9e9e; border-radius:50%;"></div>
                                    </div>

                                    <!-- Current Car -->
                                    <div id="v3-mg-car" style="width:100px; height:70px; position:relative; background:#FFEB3B; border-radius:10px; border:4px solid #F57F17; display:flex; justify-content:center; align-items:center; flex-direction:column; box-shadow:0 3px 0 #F57F17; opacity:0; transform:translateX(50px); transition: all 0.5s;">
                                        <div id="v3-mg-ts" style="font-size:2rem; font-weight:900; color:#E65100; line-height:1;">2/4</div>
                                        <div style="position:absolute; bottom:-15px; left:10px; width:20px; height:20px; background:#333; border:2px solid #9e9e9e; border-radius:50%;"></div>
                                        <div style="position:absolute; bottom:-15px; right:10px; width:20px; height:20px; background:#333; border:2px solid #9e9e9e; border-radius:50%;"></div>
                                        
                                        <div id="v3-mg-car-beats" style="position:absolute; top:-30px; width:100%; display:flex; justify-content:center; gap:5px;">
                                        </div>
                                    </div>
                                </div>
                                
                            </div>

                            <div style="margin-top:20px; display:flex; justify-content:center; width:100%;">
                                <button id="v3-mg-btn-start" class="action-btn" style="background:#4CAF50; font-size:1.5rem; padding:15px 40px; margin:0;">🚂 ${currentLanguage==='zh'?'发车！':'Start!'}</button>
                                <div id="v3-mg-tap-area" style="display:none; width:100%; max-width:300px; height:70px; background:#E91E63; border-radius:35px; box-shadow:0 10px 20px rgba(233,30,99,0.3); font-size:2rem; font-weight:bold; color:white; justify-content:center; align-items:center; cursor:pointer; user-select:none; transition:transform 0.1s; margin:0;">
                                    👆 ${currentLanguage==='zh'?'跟着音乐点！':'TAP!'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 4:
                return `
                    <div id="sight4-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v4-tutorial" class="sight-section active l-split">
                            <div class="l-left">
                                <div id="v4-tut-stage" style="display:none; text-align:center; padding: 20px; position:relative; min-height: 250px;">
                                    <div id="v4-tut-birds" style="font-size:80px; position:absolute; top: -20px; left: 50%; transform: translateX(-50%);">🐦</div>
                                    <div id="v4-tut-img-container" style="display: flex; justify-content: center; align-items: center; min-height: 150px; margin-top: 60px;">
                                        <div id="v4-tut-img" style="font-size:100px; transition: transform 0.3s; margin: 0 10px;"></div>
                                    </div>
                                    <div id="v4-tut-pulses" style="display:flex; justify-content:center; gap:10px; margin-top: 20px; min-height: 30px;"></div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-blue); font-size:2rem;">👣 ${currentLanguage === 'zh' ? '小小足迹' : 'Little Footprints'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage === 'zh' ? '认识长短不一的音符！' : 'Learn notes of different lengths!'}</p>
                                <div id="v4-tut-text" style="font-weight:bold; font-size:1.5rem; color:var(--accent-purple); min-height:60px; margin-bottom: 20px;"></div>
                                <button id="v4-btn-start-tut" class="action-btn">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v4-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v4-btn-practice" class="action-btn" style="display:none; background:var(--accent-orange);">🎯 ${currentLanguage==='zh'?'去练习':'Practice Time!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="v4-practice" class="sight-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div id="v4-prac-feedback" style="height: 40px; font-weight: bold; font-size: 1.5rem; color: var(--accent-orange); text-align: center;"></div>
                                <div class="rhythm-tray" style="background:#fff; padding: 20px; border-radius: 20px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05); position:relative; overflow:hidden;">
                                    <div id="v4-prac-birdie" style="position:absolute; top: 10px; right: 10px; font-size:40px;">🐦</div>
                                    <div class="pattern-display" id="v4-rhythm-pattern" style="justify-content: center; gap: 15px; min-height:80px; align-items:center;">
                                        <!-- Markers added by JS -->
                                    </div>
                                    <div id="v4-prac-prints" style="display:flex; justify-content:center; gap:20px; margin-top:20px; height: 40px;">
                                        <!-- footprints -->
                                    </div>
                                </div>
                                <div class="drum-input-area" style="margin:20px 0; display:flex; justify-content:center;">
                                    <div id="v4-rhythm-tap-pad" class="drum-pad-large" style="background:var(--accent-blue); width: 120px; height: 120px; font-size: 60px; border-radius:50%; box-shadow: 0 10px 0 #1565C0; display:flex; align-items:center; justify-content:center; cursor:pointer;-webkit-tap-highlight-color: transparent;">🫱</div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-green); font-size:1.8rem; margin-bottom: 20px;">${currentLanguage === 'zh' ? '跟着音符敲击' : 'Tap the Notes'}</h3>
                                <div class="game-control-panel" style="display:flex; flex-direction:column; gap:15px; width: 100%;">
                                    <button id="v4-prac-btn-listen" class="action-btn" style="background:var(--accent-orange);">👂 ${currentLanguage === 'zh' ? '先听听看' : 'Listen First'}</button>
                                    <button id="v4-prac-btn-play" class="action-btn" style="background:var(--accent-green);">🚀 ${currentLanguage === 'zh' ? '我来挑战' : 'My Turn'}</button>
                                    <button id="v4-btn-game" class="action-btn" style="display:inline-block; background:var(--accent-purple); margin-top:20px;">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                                </div>
                            </div>
                        </div>

                        <!-- MINI GAME SECTION -->
                        <div id="v4-minigame" class="sight-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px; background:#e0f7fa; border-radius:20px; padding: 20px; position:relative; overflow:hidden;">
                                <div style="position:absolute; top:-10px; left:-10px; font-size:60px; opacity:0.3;">🐟</div>
                                <div style="position:absolute; bottom:10px; right:10px; font-size:40px; opacity:0.3;">🫧</div>
                                <h3 style="text-align:center; color:#006064;">🎣 ${currentLanguage === 'zh' ? '音符钓鱼' : 'Note Fishing'}</h3>
                                <div id="v4-mg-pond" style="width: 100%; background:rgba(255,255,255,0.7); border-radius:15px; flex:1; min-height:220px; position:relative; display:flex; justify-content:space-around; align-items:center; flex-wrap:wrap; padding: 10px;">
                                    <!-- Fish container -->
                                </div>
                            </div>
                            <div class="l-right" style="justify-content: flex-start; padding-top:20px;">
                                <div id="v4-mg-bubble" style="background:var(--bg-card); padding:15px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1); margin-bottom:20px; font-size:1.2rem; font-weight:bold; color:var(--text-main);">
                                    ${currentLanguage === 'zh' ? '帮鸟儿把鱼钩拖到对应拍数的鱼身上！' : 'Drag the hooks to the fish with the matching beats!'}
                                </div>
                                <div id="v4-mg-hooks" style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;">
                                    <!-- Hooks container -->
                                </div>
                                <button id="v4-mg-reset" class="action-btn" style="margin-top:auto; background:#ccc;">🔄 ${currentLanguage==='zh'?'重置':'Reset'}</button>
                            </div>
                        </div>

                    </div>
                `;
            case 5:
                return `
                    <div id="sight5-container" class="level-split-container">
                        
                        <!-- TUTORIAL SECTION -->
                        <div id="v5-tutorial" class="sight-section active l-split">
                            <div class="l-left">
                                <div id="v5-tut-stage" style="width: 100%; min-height: 350px; background: linear-gradient(to bottom, #111827, #374151); border-radius: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #FCD34D;">
                                    <div style="position:absolute; top: 10px; width:100%; display:flex; justify-content:space-around; opacity:0.6;">
                                        <div style="width:50px; height:50px; background:radial-gradient(circle, #FCD34D, transparent); border-radius:50%; filter:blur(10px);"></div>
                                        <div style="width:50px; height:50px; background:radial-gradient(circle, #60A5FA, transparent); border-radius:50%; filter:blur(10px);"></div>
                                        <div style="width:50px; height:50px; background:radial-gradient(circle, #F472B6, transparent); border-radius:50%; filter:blur(10px);"></div>
                                    </div>
                                    <div id="v5-tut-birdie" style="font-size: 60px; z-index: 10; margin-bottom: 20px;">🐦</div>
                                    <div id="v5-tut-text" style="color: #fff; font-size: 1.5rem; font-weight: bold; text-align: center; max-width: 80%; z-index: 10; min-height: 60px;"></div>
                                    
                                    <div id="v5-tut-cards" style="display:none; flex-wrap:wrap; justify-content:center; gap: 10px; z-index: 10;">
                                        <div class="v5-song-card" data-song="twinkle" style="background: rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); text-align: center; font-weight: bold; font-size: 1.1rem;">🌟 Twinkle Twinkle<br>Little Star</div>
                                        <div class="v5-song-card" data-song="boat" style="background: rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); text-align: center; font-weight: bold; font-size: 1.1rem;">🚣 Row Row Row<br>Your Boat</div>
                                        <div class="v5-song-card" data-song="happy" style="background: rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); text-align: center; font-weight: bold; font-size: 1.1rem;">😊 If You're Happy<br>And You Know It</div>
                                    </div>
                                    
                                    <div id="v5-tut-visuals" style="display:none; width:100%; height:150px; position:absolute; bottom:0; align-items:center; justify-content:center;">
                                        <div id="v5-tut-star" style="font-size:80px; opacity:0.3; transition: all 0.1s;">⭐</div>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-purple); font-size:2rem;">👏 ${currentLanguage === 'zh' ? '跟着歌曲拍手' : 'Song Clapper'}</h3>
                                <p style="font-size:1.2rem; margin-bottom:20px;">${currentLanguage === 'zh' ? '在歌曲中感受稳定的节拍！' : 'Feel the steady beat in real songs!'}</p>
                                <button id="v5-btn-start-tut" class="action-btn" style="background:var(--accent-green);">▶️ ${currentLanguage==='zh'?'开始讲解':'Start Tutorial'}</button>
                                <button id="v5-btn-skip" class="action-btn skip-btn-dynamic" style="display:none; background:var(--accent-orange); margin-right: 10px;">⏭ ${currentLanguage==='zh'?'跳过讲解':'Skip'}</button>
                                <button id="v5-btn-practice" class="action-btn" style="display:none; background:var(--accent-blue);">🎯 ${currentLanguage==='zh'?'去练习':'Practice Time!'}</button>
                            </div>
                        </div>

                        <!-- PRACTICE SECTION -->
                        <div id="v5-practice" class="sight-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px;">
                                <div id="v5-prac-stage" style="width: 100%; min-height: 250px; background: linear-gradient(to bottom, #1E1B4B, #312E81); border-radius: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #818CF8;">
                                    <div id="v5-prac-stars" style="position:absolute; width:100%; height:100%; background-image: radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px); background-size: 90px 90px; opacity:0.3;"></div>
                                    
                                    <div style="display:flex; justify-content:center; align-items:center; width:100%; margin-top:20px;">
                                        <div id="v5-prac-birdie" style="font-size: 50px; margin-right: 20px; transition: transform 0.2s;">🐦</div>
                                        <div id="v5-prac-lyric" style="color:#A5B4FC; font-size:1.8rem; font-weight:bold; min-height:40px; text-align:center; max-width:60%;">Select a song!</div>
                                    </div>
                                    
                                    <div id="v5-prac-rhythm-area" style="position:relative; width: 80%; height: 100px; margin-top:30px; display:flex; justify-content:space-around; align-items:center;">
                                        <!-- Animated beats go here -->
                                        <div id="v5-prac-ball" style="display:none; position:absolute; width:30px; height:30px; background:#FCD34D; border-radius:50%; box-shadow:0 0 15px #FCD34D; z-index:20;"></div>
                                    </div>
                                </div>
                                <div id="v5-prac-feedback" style="height: 30px; font-weight: bold; font-size: 1.4rem; color: var(--accent-orange); text-align: center;"></div>
                            </div>
                            <div class="l-right">
                                <h3 style="color:var(--accent-blue); font-size:1.8rem; margin-bottom: 20px;">${currentLanguage === 'zh' ? '选择一首儿歌' : 'Choose a Song'}</h3>
                                <div id="v5-prac-songs" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px; width:100%;">
                                    <button class="v5-prac-song-btn action-btn" data-song="twinkle" style="background:#4F46E5; width:100%;">🌟 Twinkle Twinkle</button>
                                    <button class="v5-prac-song-btn action-btn" data-song="boat" style="background:#0284C7; width:100%;">🚣 Row Your Boat</button>
                                    <button class="v5-prac-song-btn action-btn" data-song="happy" style="background:#16A34A; width:100%;">😊 If You're Happy</button>
                                </div>
                                <div class="drum-input-area" style="display:flex; justify-content:center;">
                                    <button id="v5-prac-tap-pad" class="drum-pad-large" style="background:var(--accent-purple); width: 120px; height: 120px; font-size: 50px; border-radius:50%; box-shadow: 0 10px 0 #6A1B9A; display:flex; align-items:center; justify-content:center; cursor:pointer;-webkit-tap-highlight-color: transparent;">👏</button>
                                </div>
                                <button id="v5-btn-game" class="action-btn" style="display:none; background:var(--accent-orange); margin-top:20px;">🎮 ${currentLanguage==='zh'?'玩小游戏':'Mini Game'}</button>
                            </div>
                        </div>

                        <!-- MINI GAME SECTION -->
                        <div id="v5-minigame" class="sight-section l-split" style="display:none;">
                            <div class="l-left" style="flex-direction:column; gap:20px; background:linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%); border-radius:20px; padding: 20px; position:relative; overflow:hidden; border: 4px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                                <h3 style="text-align:center; color:#006064; z-index:10;">🎼 ${currentLanguage === 'zh' ? '跟着指挥家' : 'Follow the Conductor'}</h3>
                                
                                <div id="v5-mg-stage" style="background:rgba(255,255,255,0.6); border-radius:15px; flex:1; min-height:250px; position:relative; display:flex; flex-direction:column; align-items:center; padding: 20px;">
                                    <div id="v5-mg-conductor" style="font-size: 80px; z-index: 10; margin-bottom: 20px; transition: transform 0.2s;">🦁</div>
                                    <div id="v5-mg-lyric" style="font-size: 24px; font-weight: bold; color: #333; min-height: 40px; text-align: center; margin-bottom: 20px;"></div>
                                    
                                    <div id="v5-mg-action-icons" style="display:flex; justify-content:center; gap: 20px; height: 60px;">
                                        <!-- Action icons will appear here -->
                                    </div>
                                    
                                    <div id="v5-mg-progress-container" style="width: 80%; height: 20px; background: #ddd; border-radius: 10px; overflow: hidden; margin-top: auto;">
                                        <div id="v5-mg-progress-bar" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="l-right" style="justify-content: flex-start; padding-top:20px;">
                                <div id="v5-mg-bubble" style="background:var(--bg-card); padding:15px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1); margin-bottom:20px; font-size:1.2rem; font-weight:bold; color:var(--text-main);">
                                    ${currentLanguage === 'zh' ? '选择歌曲，跟着动物指挥家点击屏幕或拍手吧！' : 'Choose a song and tap or clap with the animal conductor!'}
                                </div>
                                <div id="v5-mg-songs" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom: 20px;">
                                    <button class="v5-mg-song-btn action-btn sm" data-song="twinkle">🌟</button>
                                    <button class="v5-mg-song-btn action-btn sm" data-song="boat">🚣</button>
                                    <button class="v5-mg-song-btn action-btn sm" data-song="happy">😊</button>
                                </div>
                                <div class="drum-input-area" style="display:flex; justify-content:center; margin-top: auto;">
                                    <button id="v5-mg-tap-pad" class="drum-pad-large" style="background:#FF9800; width: 100px; height: 100px; font-size: 40px; border-radius:15px; box-shadow: 0 8px 0 #F57C00; display:flex; align-items:center; justify-content:center; cursor:pointer;-webkit-tap-highlight-color: transparent;">👏</button>
                                </div>
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
                            window._sightTimeouts.push(setTimeout(speakNext, 300));
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
                                        window._sightTimeouts.push(setTimeout(speakNextSpace, 300));
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
                d.ondragenter = (e) => e.preventDefault();
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
                tutHead.style.transform = 'rotate(-20deg) scale(1.2)';
                tutText.innerHTML = `<span style="color:var(--accent-red); background:var(--bg-main); padding: 5px 20px; border-radius: 20px; border: 3px solid var(--accent-red);">${currentLanguage === 'zh' ? '符头 (Note Head)' : 'Note Head'}</span>`;
                
                SoundService.playSuccess();
                SpeechService.speak(speechText1, currentLanguage, () => {
                    tutHead.style.fill = 'var(--text-main)';
                    tutHead.style.transform = 'rotate(-20deg) scale(1)';
                    tutText.innerHTML = '';
                    
                    // Animate Stem
                    setTimeout(() => {
                        tutStem.style.fill = 'var(--accent-blue)';
                        tutStem.style.transform = 'scale(1.1)';
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
                d.ondragenter = (e) => e.preventDefault();
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
                    
                    SpeechService.speak(ts.name, currentLanguage, () => {
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

                        setTimeout(() => {
                            step++;
                            runStep();
                        }, ts.beats * 1000 + 1000);
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
            { id: 'intro', text: currentLanguage === 'zh' ? '在音乐里，有些特殊的符号帮我们读懂音符。' : 'In music, special symbols help us read the notes.' },
            { id: 'intro2', text: currentLanguage === 'zh' ? '它们被称为"谱号"！' : 'They are called clefs.' },
            { id: 'treble', symbol: '𝄞', color: '#FFD700', soundType: 'high', name: currentLanguage === 'zh' ? '这是高音谱号。用于偏高的声音！听到小鸟唱歌了吗？' : 'This is the Treble Clef. Used for high sounds! Hear the bird?' },
            { id: 'bass', symbol: '𝄢', color: '#1565C0', soundType: 'low', name: currentLanguage === 'zh' ? '这是低音谱号。用于很低的声音！听到大象的声音了吗？' : 'This is the Bass Clef. Used for low sounds! Hear the elephant?' },
            { id: 'alto', symbol: '𝄡', color: '#4CAF50', soundType: 'mid', name: currentLanguage === 'zh' ? '这是中音谱号。它刚好在中间，就像小狗的叫声。' : 'This is the Alto Clef. It sits in the middle, like a dog bark.' },
            { id: 'summary', text: currentLanguage === 'zh' ? '高音谱号管高音，低音谱号管低音，中音谱号在中间！' : 'Treble is high, Bass is low, Alto is middle!' }
        ];

        btnStartTut.onclick = () => {
            btnStartTut.style.display = 'none';
            tutStage.style.display = 'block';

            let step = 0;
            const runStep = () => {
                if (step < tutSteps.length) {
                    const ts = tutSteps[step];
                    if (ts.id === 'intro' || ts.id === 'intro2' || ts.id === 'summary') {
                        tutImg.innerHTML = '⭐';
                        tutImg.style.color = 'var(--text-main)';
                        tutImg.style.textShadow = 'none';
                        tutText.innerText = ts.text;
                        SpeechService.speak(ts.text, currentLanguage, () => {
                            step++;
                            window._sightTimeouts.push(setTimeout(runStep, 800));
                        });
                    } else {
                        tutImg.innerHTML = ts.symbol;
                        tutImg.style.color = ts.color;
                        if(ts.id === 'treble') {
                            tutImg.style.textShadow = '0 0 30px #FFD700';
                        } else {
                            tutImg.style.textShadow = 'none';
                        }
                        
                        tutText.innerText = ts.name;
                        
                        if (ts.soundType === 'high') {
                            playBirdSound();
                            tutImg.style.transform = 'translateY(-20px)';
                        } else if (ts.soundType === 'low') {
                            playElephantSound();
                            tutImg.style.transform = 'translateY(20px)';
                        } else if (ts.soundType === 'mid') {
                            playDogSound();
                            tutImg.style.transform = 'scale(1.1)';
                        }

                        setTimeout(() => { tutImg.style.transform = 'none'; }, 800);

                        SpeechService.speak(ts.name, currentLanguage, () => {
                            step++;
                            window._sightTimeouts.push(setTimeout(runStep, 800));
                        });
                    }
                } else {
                    btnPracticeBtn.style.display = 'inline-block';
                    SpeechService.speak(currentLanguage==='zh'?'你能找到它们吗？':'Can you find them?');
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
            treble: currentLanguage === 'zh' ? '高音谱号！找找高音哦！' : 'Treble Clef! Find the high sounds!',
            bass: currentLanguage === 'zh' ? '低音谱号！准备听低音！' : 'Bass Clef! Get ready for low sounds!',
            alto: currentLanguage === 'zh' ? '中音谱号！正好在中间的位置。' : 'Alto Clef! Right in the middle.'
        };

        document.querySelectorAll('.symbol-card').forEach(card => {
            card.onclick = async () => {
                const sym = card.dataset.sym;
                if(info) info.innerText = msgs[sym];
                SpeechService.speak(info.innerText);
                
                document.querySelectorAll('.symbol-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                const icon = card.querySelector('.symbol-icon-large');
                icon.classList.add('spark-anim');
                if (sym === 'treble') {
                    playBirdSound();
                } else if (sym === 'bass') {
                    playElephantSound();
                } else {
                    playDogSound();
                }
                setTimeout(() => icon.classList.remove('spark-anim'), 1000);
                
                // Show minigame button once user taps at least one
                btnMinigame.style.display = 'inline-block';
            };
        });

        const updateSymQuiz = () => {
            const prompt = document.getElementById('sym-quiz-prompt');
            const feedback = document.getElementById('sym-quiz-feedback');
            const container = document.getElementById('balloon-container');
            if(!container) return; // fail safe
            if(window.balloonInterval) clearInterval(window.balloonInterval);
            container.innerHTML = '';
            
            const options = ['treble', 'bass', 'alto'];
            const target = options[Math.floor(Math.random() * options.length)];
            
            const prompts = {
                treble: currentLanguage === 'zh' ? '抓住 高音谱号！' : 'Catch the Treble Clef!',
                bass: currentLanguage === 'zh' ? '抓住 低音谱号！' : 'Catch the Bass Clef!',
                alto: currentLanguage === 'zh' ? '抓住 中音谱号！' : 'Catch the Alto Clef!'
            };
            
            const symbols = {
                 treble: '𝄞',
                 bass: '𝄢',
                 alto: '𝄡'
            };

            const colors = {
                 treble: '#FFD700',
                 bass: '#1565C0',
                 alto: '#4CAF50'
            };
            
            if (prompt) prompt.innerText = prompts[target];
            if (feedback) feedback.innerText = '';
            SpeechService.speak(prompts[target]);
            
            let gameActive = true;
            
            const spawnBalloon = () => {
                if (!gameActive) return;
                
                const b = document.createElement('div');
                const symType = options[Math.floor(Math.random() * options.length)];
                
                b.innerHTML = symbols[symType];
                b.className = 'balloon';
                
                // Styles
                b.style.position = 'absolute';
                b.style.left = Math.random() * 80 + 10 + '%';
                b.style.bottom = '-80px'; 
                b.style.color = colors[symType];
                b.style.fontSize = '80px';
                b.style.cursor = 'pointer';
                b.style.transition = 'transform 0.1s';
                b.style.webkitTextStroke = "2px white";
                b.style.filter = "drop-shadow(0 10px 10px rgba(0,0,0,0.2))";
                b.style.userSelect = "none";
                
                // Add a balloon graphic
                b.innerHTML = `<div class="balloon-wiggle" style="position:relative; width: 80px; text-align:center;">
                    <div style="font-size: 80px; position:absolute; top:-30px; left:0; width:100%; text-align:center; z-index:1; text-shadow:none; -webkit-text-stroke:0;">🎈</div>
                    <div style="position:relative; z-index:2; line-height:1; transform:translateY(-15px);">${symbols[symType]}</div>
                </div>`;
                
                container.appendChild(b);
                
                let pos = -80;
                let horizontalPos = 0;
                let speed = Math.random() * 2 + 1.5;
                let swaySpeed = Math.random() * 0.05 + 0.02;
                let time = Math.random() * 100;
                
                const move = setInterval(() => {
                    if (!gameActive) {
                         clearInterval(move);
                         return;
                    }
                    pos += speed;
                    time += swaySpeed;
                    horizontalPos = Math.sin(time) * 30; // Sway +/- 30px
                    
                    if(b) {
                        b.style.bottom = pos + 'px';
                        b.style.transform = `translateX(${horizontalPos}px)`;
                    }
                    
                    if (pos > container.offsetHeight + 100) {
                        clearInterval(move);
                        if (b && b.parentNode) b.parentNode.removeChild(b);
                    }
                }, 20);
                
                b.onpointerdown = (e) => {
                    e.preventDefault();
                    if (!gameActive) return;
                    
                    if (symType === target) {
                        gameActive = false;
                        clearInterval(window.balloonInterval);
                        SoundService.playSuccess();
                        
                        b.style.transform = 'scale(2)';
                        b.style.opacity = '0';
                        b.style.transition = 'all 0.3s';
                        
                        if (feedback) {
                            feedback.innerText = "🎊 " + (currentLanguage === 'zh' ? '没错！气球破啦！' : 'Pop! You got it!');
                            feedback.style.color = "var(--accent-green)";
                        }
                        createConfetti();
                        ProgressService.updateStars('theory', 4, 3);
                        setTimeout(() => updateSymQuiz(), 2500);
                    } else {
                        SoundService.playWrong();
                        b.style.transform = 'rotate(15deg) scale(0.9)';
                        b.style.filter = 'drop-shadow(0 0 10px red)';
                        setTimeout(() => {
                            if(b) {
                                b.style.transform = 'none';
                                b.style.filter = "drop-shadow(0 10px 10px rgba(0,0,0,0.2))";
                            }
                        }, 300);
                        if (feedback) {
                            feedback.innerText = currentLanguage === 'zh' ? '不是这个气球哦~' : 'Not quite!';
                            feedback.style.color = "var(--accent-red)";
                        }
                    }
                };
            };

            window.balloonInterval = setInterval(() => {
                 if(gameActive) spawnBalloon();
                 else clearInterval(window.balloonInterval);
            }, 800);
        };

        btnMinigame.onclick = () => {
            pracArea.style.display = 'none';
            mgArea.style.display = 'flex';
            updateSymQuiz();
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
            { act: 'enter', text: currentLanguage === 'zh' ? '音乐就像小火车一样！' : 'Music is organized like a train.' },
            { act: 'rooms', text: currentLanguage === 'zh' ? '每一节车厢就是一个“小节”。' : 'Each train car is called a bar.' },
            { act: 'lines', text: currentLanguage === 'zh' ? '这些垂直的线被称为小节线——它们是车厢之间的连接器！' : 'These lines are bar lines — they are the couplers between train cars.' },
            { act: 'divide', text: currentLanguage === 'zh' ? '车头是每一小节的开始。' : 'The engine is the start of each bar.' },
            { act: 'notes', text: currentLanguage === 'zh' ? '当一个车厢装满了音符（4拍）...我们就增加一节新车厢！' : 'When a train car is full of notes (4 beats)... we add a new car!' }
        ];

        btnStartTut.onclick = () => {
            btnStartTut.style.display = 'none';
            tutStage.style.display = 'block';

            let step = 0;
            const runStep = () => {
                if (step < tutSteps.length) {
                    const ts = tutSteps[step];
                    tutText.innerText = ts.text;
                    const tutEngine = document.getElementById('l5-tut-engine');
                    
                    if (ts.act === 'enter') {
                        tutMole.style.left = '10%';
                        if(tutEngine) { tutEngine.style.display = 'block'; tutEngine.style.left = '80%'; }
                    } else if (ts.act === 'rooms') {
                        tutHouse.innerHTML = `
                            <div style="width: 130px; height: 100px; border: 4px solid var(--accent-blue); background: var(--bg-card); display:flex; justify-content:center; align-items:center; border-radius: 10px; position:relative; box-sizing:border-box; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" id="tut-room-1">
                                <!-- Wheels -->
                                <div style="position:absolute; bottom:-12px; left:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                                <div style="position:absolute; bottom:-12px; right:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                            </div>
                            <div style="width: 130px; height: 100px; border: 4px solid var(--accent-blue); background: var(--bg-card); display:flex; justify-content:center; align-items:center; border-radius: 10px; position:relative; display:none; box-sizing:border-box; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" id="tut-room-2">
                                <div style="position:absolute; bottom:-12px; left:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                                <div style="position:absolute; bottom:-12px; right:15px; width:24px; height:24px; background:#424242; border-radius:50%; border:4px solid #9E9E9E; box-sizing:border-box;"></div>
                            </div>
                        `;
                    } else if (ts.act === 'lines') {
                        const rr = document.getElementById('tut-room-1');
                        if (rr) {
                            const coupler = document.createElement('div');
                            coupler.innerHTML = '🔗';
                            coupler.style.position = 'absolute';
                            coupler.style.right = '-20px';
                            coupler.style.top = '30px';
                            coupler.style.fontSize = '24px';
                            coupler.style.transform = 'rotate(90deg)';
                            rr.appendChild(coupler);
                        }
                    } else if (ts.act === 'divide') {
                        const rr2 = document.getElementById('tut-room-2');
                        if (rr2) {
                            rr2.style.display = 'flex';
                        }
                        tutMole.style.left = '-10px';
                        tutMole.style.transform = 'scale(0.8)';
                        if(tutEngine) {
                            tutEngine.style.left = '75%'; // move up engine a bit
                            tutEngine.style.bottom = '40px';
                        }
                        
                    } else if (ts.act === 'notes') {
                        const rr = document.getElementById('tut-room-1');
                        if(rr) {
                            rr.innerHTML += `<div style="display:flex; justify-content:space-around; align-items:center; width:100%; height:100%; font-size:30px; margin-right: -5px; z-index:2;">
                                <div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div><div>${getNoteSVG('quarter')}</div>
                            </div>`;
                            SoundService.playSuccess();
                            if(tutEngine) tutEngine.style.left = '85%'; // Move train engine to make space
                        }
                    }

                    SpeechService.speak(ts.text, currentLanguage, () => {
                        step++;
                        window._sightTimeouts.push(setTimeout(runStep, 1000));
                    });
                } else {
                    btnPracticeBtn.style.display = 'inline-block';
                    SpeechService.speak(currentLanguage === 'zh' ? '来试试连接车厢吧！' : 'Try placing a coupler!');
                }
            };
            runStep();
        };

        btnPracticeBtn.onclick = () => {
            tutArea.style.display = 'none';
            pracArea.style.display = 'block';
            SpeechService.speak(currentLanguage === 'zh' ? '拖动连接器，把4拍分到一个车厢里！' : 'Drag the coupler to connect the train car after 4 beats!');
        };

        // Practice Drag and Drop
        const pDrag = document.getElementById('prac-bar-line-drag');
        const pDrops = document.querySelectorAll('.l5-prac-dz');
        const pFeedback = document.getElementById('l5-prac-feedback');

        pDrag.ondragstart = (e) => {
            e.dataTransfer.setData('type', pDrag.dataset.type);
            pDrag.style.opacity = '0.5';
        };
        pDrag.ondragend = () => {
            pDrag.style.opacity = '1';
        };

        pDrops.forEach(drop => {
            drop.ondragover = (e) => e.preventDefault();
            drop.ondragenter = (e) => e.preventDefault();
            drop.ondrop = (e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData('type');
                if (type === 'barline') {
                    if (drop.classList.contains('wrong-dz')) {
                        SoundService.playWrong();
                        pFeedback.innerText = currentLanguage === 'zh' ? '那个连接器不合适！我们需要4拍！' : 'That coupler doesn\'t fit! We need 4 beats!';
                        pFeedback.style.color = "var(--accent-red)";
                        SpeechService.speak(currentLanguage === 'zh' ? '那个连接器不合适！我们需要4拍！' : 'That coupler doesn\'t fit! We need 4 beats!');
                        return;
                    }

                    SoundService.playSuccess();
                    pDrag.style.visibility = 'hidden';
                    drop.style.background = 'transparent';
                    drop.style.border = 'none';
                    const line = document.getElementById('prac-built-barline');
                    if(line) {
                        line.style.display = 'block';
                        drop.appendChild(line);
                    }
                    const overlay = document.getElementById('prac-room-overlay');
                    overlay.style.display = 'block';
                    
                    // Sparkle animation
                    overlay.animate([ {opacity: 0.2}, {opacity: 0.6}, {opacity: 0.2} ], { duration: 600, iterations: 2 });
                    playNote(261.63, 0.4); setTimeout(() => playNote(329.63, 0.4), 200); setTimeout(() => playNote(392.00, 0.6), 400);

                    pFeedback.innerText = currentLanguage === 'zh' ? '✨ 完美！车厢连接好了！' : '✨ Perfect! Train car connected!';
                    pFeedback.style.color = "var(--accent-green)";
                    btnMinigame.style.display = 'inline-block';
                }
            };
        });

        btnMinigame.onclick = () => {
            pracArea.style.display = 'none';
            mgArea.style.display = 'block';
            SpeechService.speak(currentLanguage === 'zh' ? '把连接器放在确的位置上，让小火车通过！' : 'Place the couplers so the train can pass!');
        };

        // MiniGame Drag and Drop
        const mDrags = document.querySelectorAll('.mg-bar-line-drag');
        const mDrops = document.querySelectorAll('.l5-mg-dz');
        const mFeedback = document.getElementById('l5-mg-feedback');
        
        mDrags.forEach(drag => {
            drag.ondragstart = (e) => {
                e.dataTransfer.setData('type', drag.dataset.type);
                e.dataTransfer.setData('sourceId', drag.id);
                drag.style.opacity = '0.5';
            };
            drag.ondragend = () => {
                drag.style.opacity = '1';
            };
        });

        const setupDrops = () => {
            mDrops.forEach(drop => {
                // Initialize dataset appropriately
                drop.dataset.filled = "false";
                drop.ondragover = (e) => e.preventDefault();
                drop.ondragenter = (e) => e.preventDefault();
                drop.ondrop = (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('type');
                    const sourceId = e.dataTransfer.getData('sourceId');
                    
                    if (type === 'barline') {
                        // Hide original dragged item
                        const sourceEl = document.getElementById(sourceId);
                        if(sourceEl) sourceEl.style.visibility = 'hidden';
                        
                        SoundService.playSuccess();
                        drop.style.background = 'transparent';
                        const line = drop.querySelector('.mg-built-barline');
                        if(line) line.style.display = 'block';
                        
                        drop.dataset.filled = "true";
                        
                        const filledCount = Array.from(mDrops).filter(d => d.dataset.filled === "true").length;
                        if (filledCount === 2) {
                            mFeedback.innerText = currentLanguage === 'zh' ? '👍 车厢连接好了，开动火车试试！' : '👍 Couplers connected, start the train!';
                        }
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
            const filledCount = Array.from(mDrops).filter(d => d.dataset.filled === "true").length;
            if (filledCount < 2) {
                mFeedback.innerText = currentLanguage === 'zh' ? '请先放好 2 个连接器！' : 'Please place 2 couplers first!';
                return;
            }

            trainStartBtn.disabled = true;
            mDrops.forEach(d => { d.ondragover = null; d.ondragenter = null; d.ondrop = null; });

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

            const d1Correct = document.querySelector('.l5-mg-dz.correct-dz[data-idx="correct1"]').dataset.filled === "true";
            const d2Correct = document.querySelector('.l5-mg-dz.correct-dz[data-idx="correct2"]').dataset.filled === "true";
            
            if (d1Correct && d2Correct) {
                trainContainer.style.left = '80%';
                setTimeout(() => {
                    clearInterval(chugInterval);
                    trainContainer.style.transition = 'left 2.5s linear';
                    trainContainer.style.left = '150%';
                    
                    let completeInterval = setInterval(() => { playClap(0); }, 300);
                    setTimeout(() => clearInterval(completeInterval), 1500);

                    SoundService.playSuccess();
                    mFeedback.innerText = currentLanguage === 'zh' ? '🌟 耶！火车安全通过！赢得3颗星！' : '🌟 Yay! Train passed! 3 Stars!';
                    ProgressService.updateStars('theory', 5, 3);
                    createConfetti();
                }, 1500);
            } else {
                // Determine where it drops based on left-to-right track order
                let stopPos = '120px';
                const wrong1 = document.querySelector('.l5-mg-dz[data-idx="wrong1"]');
                const wrong2 = document.querySelector('.l5-mg-dz[data-idx="wrong2"]');
                
                if (!d1Correct) { stopPos = '120px'; }
                else if (wrong1 && wrong1.dataset.filled === "true") { stopPos = '250px'; }
                else if (!d2Correct) { stopPos = '400px'; }
                else if (wrong2 && wrong2.dataset.filled === "true") { stopPos = '550px'; }
                
                trainContainer.style.left = stopPos;
                
                setTimeout(() => {
                    clearInterval(chugInterval);
                    SoundService.playWrong();
                    trainOverlay.style.display = 'flex';
                    const trnEmoji = document.getElementById('mg-train-emoji');
                    if(trnEmoji) { trnEmoji.classList.remove('train-shake'); void trnEmoji.offsetWidth; trnEmoji.classList.add('train-shake'); }
                    SpeechService.speak(currentLanguage === 'zh' ? '哎呀！让我们修理一下节奏！每节车厢必须有4拍！' : "Let's fix the rhythm! Cars need 4 beats!");
                }, 1500);
            }
        };

        trainRetryBtn.onclick = () => {
            trainOverlay.style.display = 'none';
            trainContainer.style.transition = 'none';
            trainContainer.style.left = '-100px';
            trainStartBtn.disabled = false;
            mFeedback.innerText = '';
            
            mDrags.forEach(drag => drag.style.visibility = 'visible');
            mDrops.forEach(d => {
                d.style.background = 'rgba(255,255,255,0.4)';
                const line = d.querySelector('.mg-built-barline');
                if(line) line.style.display = 'none';
                d.dataset.filled = "false";
            });
            setupDrops();
        };

    }
    if (type === 'sight') {
        let resetAll = () => {
             // Stop any intervals or timeouts from previous games
             if (window._sightInterval) clearInterval(window._sightInterval);
             if (window._sightTimeouts) window._sightTimeouts.forEach(clearTimeout);
             window._sightTimeouts = [];
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
            const btnSkipTut = document.getElementById('v1-btn-skip');
            const btnPracticeBtn = document.getElementById('v1-btn-practice');
            const btnGame = document.getElementById('v1-btn-game');
            const tutArea = document.getElementById('v1-tutorial');
            const pracArea = document.getElementById('v1-practice');
            const gameArea = document.getElementById('v1-minigame');
            
            const tutBubble = document.getElementById('v1-tut-bubble');
            const tutPiano = document.getElementById('v1-tut-piano');
            const tutLyrics = document.getElementById('v1-tut-lyrics');
            const creatureStage = document.getElementById('v1-tut-creature-stage');

            const notesList = [
                { note: 'C', name: 'Do', freq: frequencies['C'], object: "🦌" },
                { note: 'D', name: 'Re', freq: frequencies['D'], object: "☀️" },
                { note: 'E', name: 'Mi', freq: frequencies['E'], object: "👧" },
                { note: 'F', name: 'Fa', freq: frequencies['F'], object: "🛣️" },
                { note: 'G', name: 'Sol', freq: frequencies['G'], object: "🪡" },
                { note: 'A', name: 'La', freq: frequencies['A'], object: "🎵" },
                { note: 'B', name: 'Ti', freq: frequencies['B'], object: "🍞" }
            ];

            let isRecording = false;
            let audioStream = null;
            let checkPitchAnim = null;
            window._v1Stars = 0;
            
            const cleanupMic = () => {
                isRecording = false;
                if (checkPitchAnim) cancelAnimationFrame(checkPitchAnim);
                if (audioStream) audioStream.getTracks().forEach(t => t.stop());
                audioStream = null;
            };
            
            const baseResetAll = resetAll;
            resetAll = () => {
                baseResetAll();
                cleanupMic();
                const btnRecord = document.getElementById('sight-record-start');
                const btnStop = document.getElementById('sight-record-stop');
                if (btnRecord && btnStop) {
                    btnRecord.style.display = 'inline-block';
                    btnStop.style.display = 'none';
                }
            };

            const cleanupTut = () => {
                const keys = tutPiano.querySelectorAll('.key');
                keys.forEach(k => k.classList.remove('guide'));
                keys.forEach(k => k.onclick = null);
                tutLyrics.innerText = "";
                if (creatureStage) {
                    creatureStage.innerHTML = "";
                    creatureStage.style.transform = "translateY(20px) scale(0)";
                    creatureStage.style.opacity = "0";
                }
                cleanupMic();
            };

            btnSkipTut.onclick = () => {
                resetAll();
                cleanupTut();
                btnPracticeBtn.style.display = 'inline-block';
                btnSkipTut.style.display = 'none';
                tutBubble.innerHTML = currentLanguage === 'zh' ? '准备好了吗？去试试看吧！' : "Ready? Try the practice!";
            };

            // TUTORIAL LOGIC
            const initInteractiveTutorial_v1 = () => {
                resetAll();
                cleanupTut();
                
                const btnStartTut = document.getElementById('v1-btn-start-tut');
                btnStartTut.style.display = 'inline-block';
                btnSkipTut.style.display = 'inline-block';
                btnPracticeBtn.style.display = 'none';
                btnGame.style.display = 'none';

                let step = 0;
                let currentTargetFreq = 0;
                const keys = tutPiano.querySelectorAll('.key');
                const creatureStage = document.getElementById('v1-tut-creature-stage');

                const promptNextKey = () => {
                    if (step >= notesList.length) {
                        // Finished waking notes, do the parade and song
                        creatureStage.style.transform = "translateY(20px) scale(0)";
                        creatureStage.style.opacity = "0";
                        tutBubble.innerHTML = currentLanguage === 'zh' ? '音符朋友们排队走过！' : "Note Friend Parade!";
                        SpeechService.speak(tutBubble.innerHTML, currentLanguage, startNoteParade);
                        return;
                    }
                    keys.forEach(k => { k.classList.remove('guide'); k.onclick = null; });
                    const n = notesList[step];
                    const key = tutPiano.querySelector(`.key[data-note="${n.note}4"]`);
                    const msg = (currentLanguage === 'zh' ? `点击 ` : `Listen to `) + n.name;
                    tutBubble.innerHTML = msg;
                    SpeechService.speak(msg, currentLanguage);
                    
                    if (key) {
                        key.classList.add('guide');
                        key.onclick = () => {
                            key.classList.remove('guide');
                            key.onclick = null;
                            handleKeyTapped(n, key);
                        };
                        // Auto-tap after 2 seconds if not tapped yet to keep flow
                        window._sightTimeouts.push(setTimeout(() => { if (key.onclick) key.onclick(); }, 2500));
                    }
                };

                const startNoteParade = () => {
                    let paradeHtml = '';
                    notesList.forEach((n, i) => {
                        paradeHtml += `<span style="display:inline-block; transition:transform 0.3s; animation: bounce 1s infinite ${i*0.1}s;">${n.object}</span>`;
                    });
                    creatureStage.innerHTML = paradeHtml;
                    creatureStage.style.transform = "translateY(0) scale(1)";
                    creatureStage.style.opacity = "1";
                    
                    tutBubble.innerHTML = "Do Re Mi Fa Sol La Ti!";
                    playNote(frequencies['C'], 0.5);
                    setTimeout(() => playNote(frequencies['D'], 0.5), 300);
                    setTimeout(() => playNote(frequencies['E'], 0.5), 600);
                    setTimeout(() => playNote(frequencies['F'], 0.5), 900);
                    setTimeout(() => playNote(frequencies['G'], 0.5), 1200);
                    setTimeout(() => playNote(frequencies['A'], 0.5), 1500);
                    setTimeout(() => playNote(frequencies['B'], 0.5), 1800);
                    
                    SpeechService.speak("Do Re Mi Fa Sol La Ti", currentLanguage, () => {
                        window._sightTimeouts.push(setTimeout(startMemorySong, 1500));
                    });
                };

                const startMemorySong = () => {
                    const lyrics = currentLanguage === 'zh' ? [
                        { text: "Do 是一只小鹿！", note: 'C' },
                        { text: "Re 是金色的太阳！", note: 'D' },
                        { text: "Mi 是唱歌的小孩！", note: 'E' },
                        { text: "Fa 是一条长长的路！", note: 'F' },
                        { text: "Sol 是一根缝衣针！", note: 'G' },
                        { text: "La 是开心的笑声！", note: 'A' },
                        { text: "Ti 是一杯香甜的茶！", note: 'B' }
                    ] : [
                        { text: "Do is a deer!", note: 'C' },
                        { text: "Re is the sun!", note: 'D' },
                        { text: "Mi sings with everyone!", note: 'E' },
                        { text: "Fa runs far away!", note: 'F' },
                        { text: "Sol sews all day!", note: 'G' },
                        { text: "La laughs loud!", note: 'A' },
                        { text: "Ti drinks tea in the clouds!", note: 'B' }
                    ];

                    let s = 0;
                    const singNext = () => {
                        if (s >= lyrics.length) {
                            tutBubble.innerHTML = currentLanguage === 'zh' ? '太棒了！你学会了彩虹歌！' : "Great job! You learned the Rainbow Song!";
                            SpeechService.speak(tutBubble.innerHTML, currentLanguage);
                            createConfetti();
                            btnPracticeBtn.style.display = 'inline-block';
                            btnSkipTut.style.display = 'none';
                            return;
                        }
                        const l = lyrics[s];
                        tutLyrics.innerText = l.text;
                        const key = tutPiano.querySelector(`.key[data-note="${l.note}4"]`);
                        if(key) {
                            key.classList.add('guide');
                            setTimeout(() => key.classList.remove('guide'), 800);
                        }
                        playNote(frequencies[l.note], 0.6);
                        
                        const objSpan = creatureStage.children[s];
                        if (objSpan) {
                            objSpan.style.transform = "scale(2) translateY(-20px)";
                            setTimeout(() => objSpan.style.transform = "none", 1000);
                        }

                        SpeechService.speak(l.text, currentLanguage, () => {
                            s++;
                            window._sightTimeouts.push(setTimeout(singNext, 500));
                        });
                    };
                    singNext();
                };

                const handleKeyTapped = (n, keyElement) => {
                    playNote(n.freq, 0.8);
                    creatureStage.innerHTML = n.object;
                    creatureStage.style.transform = "translateY(0) scale(1.5)";
                    creatureStage.style.opacity = "1";
                    
                    const singWord = "Doooo! Reeee! Miiii! Faaaa! Soool! Laaaa! Tiiii!".split(' ')[step];
                    tutBubble.innerHTML = `🎵 ` + singWord;
                    createConfetti();
                    currentTargetFreq = n.freq;

                    window._sightTimeouts.push(setTimeout(() => {
                        tutBubble.innerHTML = currentLanguage === 'zh' ? `${n.name} 的声音真好听！` : `${n.name} sounds nice!`;
                        SpeechService.speak(tutBubble.innerHTML, currentLanguage, () => {
                            setTimeout(() => {
                                creatureStage.style.transform = "translateY(20px) scale(0)";
                                creatureStage.style.opacity = "0";
                                step++;
                                promptNextKey();
                            }, 1000);
                        });
                    }, 1000));
                };

                btnStartTut.onclick = () => {
                    btnStartTut.style.display = 'none';
                    promptNextKey();
                };
            };

            btnPracticeBtn.onclick = () => {
                resetAll();
                tutArea.style.display = 'none';
                gameArea.style.display = 'none';
                pracArea.style.display = 'flex';
                initSingingPractice_v1();
            };
            
            btnGame.onclick = () => {
                resetAll();
                tutArea.style.display = 'none';
                pracArea.style.display = 'none';
                gameArea.style.display = 'flex';
                initMiniGame_v1();
            };
            
            const updateStarsDisplay = (num) => {
                const el = document.getElementById('v1-prac-stars');
                if (el) {
                    let s = '';
                    for(let i=0; i<3; i++) {
                        s += i < num ? '⭐' : '☆';
                    }
                    el.innerText = s;
                }
            };

            const initSingingPractice_v1 = () => {
                let currentTargetFreq = 0;
                let targetNoteObj = null;
                window._v1Stars = 0;
                updateStarsDisplay(0);
                
                if (btnGame) btnGame.style.display = 'none';

                const pracPiano = document.getElementById('v1-prac-piano');
                const startBtn = document.getElementById('sight-start-game');
                const micStartBtn = document.getElementById('sight-record-start');
                const micStopBtn = document.getElementById('sight-record-stop');
                const status = document.getElementById('record-status');
                const micVisualizer = document.getElementById('mic-visualizer');
                const micBar = document.getElementById('mic-bar');
                
                const cloud = document.getElementById('prac-cloud');
                const hiddenNote = document.getElementById('prac-hidden-note');
                
                const keys = pracPiano.querySelectorAll('.key');
                keys.forEach(k => {
                    k.onclick = () => {
                        const noteLetter = k.dataset.note.charAt(0);
                        playNote(frequencies[noteLetter], 0.4);
                        k.classList.add('guide');
                        setTimeout(() => k.classList.remove('guide'), 300);
                        
                        // Practice mode allows finding it by clicking the piano OR singing
                        if (targetNoteObj && noteLetter === targetNoteObj.note) {
                            successFind();
                        } else if (targetNoteObj) {
                            wrongFind();
                        }
                    };
                });
                
                const pickNewNote = () => {
                    targetNoteObj = notesList[Math.floor(Math.random() * 7)];
                    currentTargetFreq = targetNoteObj.freq;
                    status.innerText = (currentLanguage === 'zh' ? '请唱出或点击：' : 'Sing or Play: ') + targetNoteObj.name;
                    playNote(currentTargetFreq, 0.8);
                    
                    cloud.style.transform = 'scale(1)';
                    cloud.style.opacity = '1';
                    hiddenNote.style.transform = 'scale(0)';
                    hiddenNote.style.opacity = '0';
                    hiddenNote.innerText = targetNoteObj.object;
                    
                    keys.forEach(k => k.classList.remove('guide'));
                    const targetKey = pracPiano.querySelector(`.key[data-note="${targetNoteObj.note}4"]`);
                    if (targetKey) {
                        targetKey.classList.add('guide');
                        setTimeout(() => targetKey.classList.remove('guide'), 500);
                    }
                };
                
                startBtn.onclick = () => {
                    pickNewNote();
                    if (isRecording) {
                        evalPitch();
                    } else {
                        showFeedback('sight-feedback', currentLanguage === 'zh' ? '请先开启麦克风！(或用下方琴键)' : 'Enable mic! (or use keys)', '#E65100');
                    }
                };
                
                const successFind = () => {
                    showFeedback('sight-feedback', '⭐ ' + (currentLanguage === 'zh' ? '你找到 '+targetNoteObj.name+' 啦！' : 'You found '+targetNoteObj.name+'!'), '#4CAF50');
                    createConfetti();
                    SoundService.playSuccess();
                    
                    cloud.style.transform = 'scale(0)';
                    cloud.style.opacity = '0';
                    hiddenNote.style.transform = 'scale(1.5) translateY(-20px)';
                    hiddenNote.style.opacity = '1';
                    
                    window._v1Stars++;
                    updateStarsDisplay(window._v1Stars);

                    if (window._v1Stars >= 3) {
                        setTimeout(() => {
                            showFeedback('sight-feedback', currentLanguage === 'zh' ? '恭喜过关！去拯救迷路的音符！' : 'Finished! Rescue the Lost Notes!', '#6A1B9A');
                            btnGame.style.display = 'inline-block';
                            targetNoteObj = null;
                            keys.forEach(k => k.classList.remove('guide'));
                        }, 2000);
                    } else {
                        setTimeout(() => {
                            if (pracArea.style.display !== 'none') pickNewNote();
                        }, 2500);
                    }
                };
                
                const wrongFind = () => {
                    showFeedback('sight-feedback', '❌ ' + (currentLanguage === 'zh' ? '仔细听再试一次！' : 'Listen carefully & try again!'), '#D32F2F');
                    SoundService.playWrong();
                    playNote(currentTargetFreq, 0.8);
                    
                    cloud.style.transform = 'translateX(10px)';
                    setTimeout(() => cloud.style.transform = 'translateX(-10px)', 100);
                    setTimeout(() => cloud.style.transform = 'translateX(10px)', 200);
                    setTimeout(() => cloud.style.transform = 'translateX(0)', 300);
                };
                
                const evalPitch = () => {
                    if (!isRecording || !targetNoteObj) return;
                    let detectedFreqs = [];
                    let evalCount = 0;
                    status.innerText = currentLanguage === 'zh' ? `请唱： ${targetNoteObj.name}` : `Sing: ${targetNoteObj.name}`;
                    
                    const collect = () => {
                        window._sightTimeouts.push(setTimeout(() => {
                            if (!isRecording || !targetNoteObj) return;
                            evalCount++;
                            if (window._latestPitch > 50 && window._latestPitch < 2000) {
                                detectedFreqs.push(window._latestPitch);
                            }
                            if (evalCount < 10) {
                                collect();
                            } else {
                                if (detectedFreqs.length < 3) {
                                    evalCount = 0; detectedFreqs = []; collect();
                                    return;
                                }
                                detectedFreqs.sort((a,b) => a-b);
                                const medianPitch = detectedFreqs[Math.floor(detectedFreqs.length/2)];
                                const diff = Math.abs(medianPitch - currentTargetFreq);
                                
                                if (diff < 80) { // Forgiving
                                    successFind();
                                } else {
                                    wrongFind();
                                    evalCount = 0; detectedFreqs = [];
                                    if (isRecording) collect();
                                }
                            }
                        }, 300));
                    };
                    collect();
                };

                micStartBtn.onclick = async () => {
                    try {
                        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const source = audioCtx.createMediaStreamSource(audioStream);
                        const analyser = audioCtx.createAnalyser();
                        analyser.fftSize = 2048;
                        source.connect(analyser);
                        
                        isRecording = true;
                        micStartBtn.style.display = 'none';
                        micStopBtn.style.display = 'inline-block';
                        micVisualizer.style.display = 'block';
                        status.innerText = currentLanguage === 'zh' ? '🎤 麦克风已开启。点击"随机播放"！' : '🎤 Mic on. Click "Play a Random Note"!';
                        
                        const trackVolume = () => {
                            if (!isRecording) return;
                            const buffer = new Float32Array(analyser.fftSize);
                            analyser.getFloatTimeDomainData(buffer);
                            let sum = 0;
                            for(let i=0; i<buffer.length; i++) sum += buffer[i]*buffer[i];
                            const volume = Math.sqrt(sum/buffer.length);
                            micBar.style.width = Math.min(100, volume * 500) + '%';
                            window._latestPitch = getPitchSample(buffer, audioCtx.sampleRate);
                            checkPitchAnim = requestAnimationFrame(trackVolume);
                        };
                        trackVolume();

                        if (targetNoteObj) evalPitch();
                    } catch (err) {
                        console.error(err);
                        showFeedback('sight-feedback', currentLanguage === 'zh' ? '需要麦克风权限哦' : 'Microphone access denied', 'var(--accent-red)');
                    }
                };

                micStopBtn.onclick = () => {
                    cleanupMic();
                    micStartBtn.style.display = 'inline-block';
                    micStopBtn.style.display = 'none';
                    micVisualizer.style.display = 'none';
                    status.innerText = "";
                    keys.forEach(k => k.classList.remove('guide'));
                    targetNoteObj = null;
                };
            };
            
            const initMiniGame_v1 = () => {
                const finishBtn = document.getElementById('v1-btn-finish');
                const floatingArea = document.getElementById('mg-floating-area');
                const housesArea = document.getElementById('mg-houses-area');
                floatingArea.innerHTML = "";
                housesArea.innerHTML = "";
                
                let matchesLeft = 7;
                
                // Colors dict
                const noteColors = { C: '#F44336', D: '#FF9800', E: '#FFC107', F: '#4CAF50', G: '#2196F3', A: '#9C27B0', B: '#E91E63' };

                // Create houses
                notesList.forEach(n => {
                    const house = document.createElement('div');
                    house.dataset.note = n.note;
                    house.style.cssText = `width: 100px; height: 120px; background: rgba(255,255,255,0.5); border: 4px dashed ${noteColors[n.note]}; border-radius: 10px 10px 0 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:10px; position:relative; transition:all 0.3s;`;
                    house.innerHTML = `<div style="font-size:2rem; font-weight:bold; color:${noteColors[n.note]}; text-shadow:1px 1px white;">${n.name}</div>`;
                    
                    // Allow dropping
                    house.ondragover = (e) => {
                        e.preventDefault();
                        if (house.dataset.filled) return;
                        house.style.background = 'rgba(255,255,255,0.9)';
                        house.style.transform = 'scale(1.1)';
                    };
                    house.ondragleave = () => {
                        house.style.background = 'rgba(255,255,255,0.5)';
                        house.style.transform = 'scale(1)';
                    };
                    house.ondrop = (e) => {
                        e.preventDefault();
                        if (house.dataset.filled) return;
                        const draggedNote = e.dataTransfer.getData('note');
                        if (draggedNote === n.note) {
                            // Correct
                            house.dataset.filled = 'true';
                            house.style.background = noteColors[n.note];
                            house.style.borderStyle = 'solid';
                            house.style.transform = 'scale(1)';
                            house.innerHTML = `<div style="font-size:50px;">${n.object}</div><div style="font-size:2rem; font-weight:bold; color:white;">${n.name}</div>`;
                            playNote(n.freq, 0.8);
                            SoundService.playSuccess();
                            
                            const draggedEl = document.getElementById('drag-'+draggedNote);
                            if (draggedEl) draggedEl.remove();
                            
                            SpeechService.speak(currentLanguage === 'zh' ? n.name + ' 回家啦！' : n.name + ' is home!', currentLanguage);
                            
                            matchesLeft--;
                            if (matchesLeft <= 0) {
                                setTimeout(() => {
                                    createConfetti();
                                    createConfetti();
                                    finishBtn.style.display = 'inline-block';
                                    document.getElementById('v1-game-bubble').innerText = currentLanguage === 'zh' ? '太棒了！所有音符都回家了！' : 'You saved the Rainbow Notes!';
                                    
                                    // Play full scale
                                    notesList.forEach((nl, i) => {
                                        setTimeout(() => playNote(nl.freq, 0.8), i*300);
                                    });
                                }, 1000);
                            }
                        } else {
                            // Wrong
                            house.style.background = 'rgba(255,255,255,0.5)';
                            house.style.transform = 'scale(1)';
                            house.style.animation = 'shake 0.5s';
                            setTimeout(() => house.style.animation = '', 500);
                            SoundService.playWrong();
                            document.getElementById('v1-game-bubble').innerText = currentLanguage === 'zh' ? '哎呀！换个房子试试！' : 'Oops! Try another home!';
                        }
                    };
                    
                    housesArea.appendChild(house);
                });
                
                // Create draggable creatures
                const shuffled = [...notesList].sort(() => Math.random() - 0.5);
                shuffled.forEach((n, idx) => {
                    const creature = document.createElement('div');
                    creature.id = 'drag-' + n.note;
                    creature.draggable = true;
                    creature.style.cssText = `font-size: 60px; cursor: grab; animation: floatCloud ${3+Math.random()*2}s infinite alternate; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));`;
                    creature.innerHTML = n.object;
                    
                    creature.ondragstart = (e) => {
                        e.dataTransfer.setData('note', n.note);
                        creature.style.opacity = '0.5';
                    };
                    creature.ondragend = () => {
                        creature.style.opacity = '1';
                    };
                    
                    floatingArea.appendChild(creature);
                });

                finishBtn.onclick = () => {
                    ProgressService.updateStars('sight', 1, 3);
                    navigateTo('sight-hub');
                };
            };
            
            // start tutorial immediately
            initInteractiveTutorial_v1();
        }

        if (level == 2) {
            
            const songsInfo = {
                twinkle: {
                    title: currentLanguage === 'zh' ? '小星星' : 'Twinkle Star',
                    melody: ['C','C','G','G','A','A','G', 'F','F','E','E','D','D','C'],
                    practice: [
                        { diff: 'easy', seq: ['C','C','G','G'] },
                        { diff: 'easy', seq: ['E','E','D','D','C'] },
                        { diff: 'med', seq: ['G','G','A','A','G'] },
                        { diff: 'full', seq: ['C','C','G','G','A','A','G'] }
                    ]
                },
                boat: {
                    title: currentLanguage === 'zh' ? '划小船' : 'Row Your Boat',
                    melody: ['C','C','C','D','E', 'E','D','E','F','G'],
                    practice: [
                        { diff: 'easy', seq: ['C','C','C'] },
                        { diff: 'med', seq: ['D','E','E'] },
                        { diff: 'full', seq: ['C','C','C','D','E'] }
                    ]
                },
                jingle: {
                    title: currentLanguage === 'zh' ? '铃儿响叮当' : 'Jingle Bells',
                    melody: ['E','E','E', 'E','E','E', 'E','G','C','D','E'],
                    practice: [
                        { diff: 'easy', seq: ['E','E','E'] },
                        { diff: 'med', seq: ['E','G','C'] },
                        { diff: 'full', seq: ['E','G','C','D','E'] }
                    ]
                }
            };
            
            const noteData = {
                'C': {n:'Do', f:frequencies['C'], o:'🔴'},
                'D': {n:'Re', f:frequencies['D'], o:'🟠'},
                'E': {n:'Mi', f:frequencies['E'], o:'🟡'},
                'F': {n:'Fa', f:frequencies['F'], o:'🟢'},
                'G': {n:'Sol',f:frequencies['G'], o:'🔵'},
                'A': {n:'La', f:frequencies['A'], o:'🟣'},
                'B': {n:'Ti', f:frequencies['B'], o:'💖'}
            };

            let selectedSong = null;
            let pracStep = 0;
            let currentPracSeq = [];

            // DOM Elements
            const sStart = document.getElementById('v2-tutorial-start');
            const sTut = document.getElementById('v2-piano-tutorial');
            const sPrac = document.getElementById('v2-practice');
            const sMini = document.getElementById('v2-minigame');
            
            document.querySelectorAll('.v2-song-card').forEach(card => {
                card.onclick = () => {
                    const songId = card.dataset.song;
                    selectedSong = songsInfo[songId];
                    
                    sStart.style.display = 'none';
                    sTut.style.display = 'flex';
                    startPianoTutorial();
                };
            });

            const startPianoTutorial = () => {
                document.getElementById('v2-tut-song-title').innerText = selectedSong.title;
                const bubble = document.getElementById('v2-tut-bubble');
                const lyrics = document.getElementById('v2-tut-lyrics');
                const pKeys = document.querySelectorAll('.v2-k');
                
                let tutIndex = 0;
                let melody = selectedSong.melody;

                const playMelody = () => {
                    if (tutIndex >= melody.length) {
                        document.getElementById('v2-tut-practice-btn').style.display = 'inline-block';
                        bubble.innerText = currentLanguage === 'zh' ? '太棒了！去练习吧！' : 'Great! Lets Practice!';
                        return;
                    }
                    
                    const noteStr = melody[tutIndex];
                    const nd = noteData[noteStr];
                    
                    pKeys.forEach(k => k.style.transform = 'scale(1)');
                    const targetKey = Array.from(pKeys).find(k => k.dataset.n === noteStr);
                    if (targetKey) {
                        targetKey.style.transform = 'scale(1.05)';
                        targetKey.style.boxShadow = '0 0 20px ' + targetKey.style.backgroundColor;
                        setTimeout(() => {
                            targetKey.style.transform = 'scale(1)';
                            targetKey.style.boxShadow = 'none';
                        }, 500);
                    }
                    
                    lyrics.innerText = `${nd.o} ${nd.n}`;
                    playNote(nd.f, 0.8);
                    
                    tutIndex++;
                    window._sightTimeouts.push(setTimeout(playMelody, 800));
                };
                
                window._sightTimeouts.push(setTimeout(playMelody, 1000));
            };

            document.getElementById('v2-tut-skip-btn').onclick = () => {
                sTut.style.display = 'none';
                sPrac.style.display = 'flex';
                initPracticeSequence();
            };
            document.getElementById('v2-tut-practice-btn').onclick = () => {
                sTut.style.display = 'none';
                sPrac.style.display = 'flex';
                initPracticeSequence();
            };
            
            let micActive = false;
            let pitchDetectedInterval;
            let audioStream = null;
            let analyser = null;

            const initPitchDetection = async () => {
                if (audioCtx.state === 'suspended') await audioCtx.resume();
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = audioCtx.createMediaStreamSource(audioStream);
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);
            };

            const getPitch = () => {
                if (!analyser) return null;
                const buffer = new Float32Array(analyser.fftSize);
                analyser.getFloatTimeDomainData(buffer);
                
                let sum = 0;
                for(let i=0; i<buffer.length; i++) sum += buffer[i]*buffer[i];
                const volume = Math.sqrt(sum/buffer.length);
                if (volume < 0.05) return { freq: 0, volume: volume };

                const freq = getPitchSample(buffer, audioCtx.sampleRate);
                if (freq > 50 && freq < 2000) {
                     let closestNote = null;
                     let minDiff = Infinity;
                     for (const k in noteData) {
                         const diff = Math.abs(noteData[k].f - freq);
                         if (diff < minDiff) {
                             minDiff = diff;
                             closestNote = k;
                         }
                     }
                     if (minDiff < 40) {
                        return { note: closestNote, freq: freq, volume: volume };
                     }
                     return { freq: freq, volume: volume };
                }
                return { freq: 0, volume: volume };
            };

            const btnStartPrac = document.getElementById('v2-btn-start-prac');
            const pracStatus = document.getElementById('v2-prac-status');
            const btnGame = document.getElementById('v2-btn-game');
            let pracActive = false;
            let currTargetIdx = 0;

            const initPracticeSequence = () => {
                if (pracStep >= selectedSong.practice.length) {
                    document.getElementById('v2-prac-bubble').innerText = currentLanguage==='zh'?'你完成了所有练习！':'You finished all practice!';
                    btnGame.style.display = 'inline-block';
                    btnStartPrac.style.display = 'none';
                    return;
                }
                
                const seq = selectedSong.practice[pracStep].seq;
                currentPracSeq = seq;
                
                const texts = seq.map(n => noteData[n].n).join(' - ');
                document.getElementById('v2-prac-lyrics').innerText = texts;
                
                btnStartPrac.style.display = 'inline-block';
                btnStartPrac.innerText = currentLanguage==='zh'?'▶️ 开始听示范':'▶️ Listen Demo';
            };
            
            btnStartPrac.onclick = async () => {
                pracActive = false;
                currTargetIdx = 0;
                btnStartPrac.style.display = 'none';
                
                pracStatus.innerText = currentLanguage==='zh'?'准备...':'Ready...';
                await new Promise(r => setTimeout(r, 1000));
                
                // Demo first
                const seq = currentPracSeq;
                let i = 0;
                const demo = () => {
                    if (i < seq.length) {
                        const noteStr = seq[i];
                        const key = Array.from(document.querySelectorAll('.v2-pk')).find(k => k.dataset.n === noteStr);
                        if (key) {
                            key.style.transform = 'scale(0.95)';
                            key.style.boxShadow = '0 0 20px ' + key.style.backgroundColor;
                        }
                        playNote(noteData[noteStr].f, 0.5);
                        setTimeout(() => {
                            if (key) {
                                key.style.transform = 'scale(1)';
                                key.style.boxShadow = 'none';
                            }
                            i++;
                            window._sightTimeouts.push(setTimeout(demo, 600));
                        }, 400);
                    } else {
                        pracStatus.innerText = currentLanguage==='zh'?'现在换你弹刚才的旋律！':'Now you play the melody!';
                        pracActive = true;
                    }
                };
                demo();
            };

            document.querySelectorAll('.v2-pk').forEach(k => {
                k.onclick = () => {
                    const noteStr = k.dataset.n;
                    playNote(noteData[noteStr].f, 0.3);
                    k.style.transform = 'scale(0.95)';
                    k.style.boxShadow = '0 0 20px ' + k.style.backgroundColor;
                    setTimeout(() => {
                        k.style.transform = 'scale(1)';
                        k.style.boxShadow = 'none';
                    }, 200);

                    if (!pracActive) return;

                    const targetNote = currentPracSeq[currTargetIdx];
                    if (noteStr === targetNote) {
                        currTargetIdx++;
                        createConfetti();
                        
                        if (currTargetIdx >= currentPracSeq.length) {
                            pracActive = false;
                            SoundService.playSuccess();
                            pracStatus.innerText = currentLanguage==='zh'?'太棒了！':'Amazing playing!';
                            let stars = document.getElementById('v2-prac-stars').innerText;
                            document.getElementById('v2-prac-stars').innerText = stars.replace('☆', '⭐');
                            
                            setTimeout(() => {
                                pracStep++;
                                pracStatus.innerText = '';
                                initPracticeSequence();
                            }, 2000);
                        }
                    } else {
                        pracActive = false;
                        SoundService.playWrong();
                        pracStatus.style.color = '#F44336';
                        pracStatus.innerText = currentLanguage==='zh'?'哎呀不对，重新听示范吧！':'Oops, listen to demo again!';
                        setTimeout(() => {
                            pracStatus.style.color = '#e65100';
                            pracStatus.innerText = '';
                            btnStartPrac.style.display = 'inline-block';
                        }, 2000);
                    }
                };
            });
            
            document.getElementById('v2-btn-skip-prac').onclick = () => {
                sPrac.style.display = 'none';
                pracActive = false;
                sMini.style.display = 'flex';
                initMiniGame();
            };

            // Minigame
            document.getElementById('v2-btn-game').onclick = () => {
                sPrac.style.display = 'none';
                pracActive = false;
                sMini.style.display = 'flex';
                initMiniGame();
            };

            let mgSlots = [];
            let activeSlotIdx = 0;
            
            const initMiniGame = () => {
                const targetMelody = selectedSong.melody;
                const slotsArea = document.getElementById('v2-mg-slots');
                const poolArea = document.getElementById('v2-mg-pool');
                
                slotsArea.innerHTML = '';
                poolArea.innerHTML = '';
                mgSlots = [];
                activeSlotIdx = 0;
                
                // Create slots
                targetMelody.forEach((expectedNote, idx) => {
                    const slot = document.createElement('div');
                    slot.style.cssText = 'width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.8); border: 2px dashed #01579b; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; transition: background 0.3s, border 0.3s, transform 0.2s; cursor:pointer;';
                    if (idx === 0) slot.style.border = '4px solid #F44336';
                    slot.dataset.expected = expectedNote;
                    slot.dataset.idx = idx;
                    slot.onclick = () => {
                        mgSlots.forEach(s => {
                            if (s.dataset.filled) s.style.border = '2px solid #01579b';
                            else s.style.border = '2px dashed #01579b';
                        });
                        slot.style.border = '4px solid #F44336';
                        activeSlotIdx = idx;
                    };
                    slotsArea.appendChild(slot);
                    mgSlots.push(slot);
                });
                
                // Create pool (4 of each)
                const baseNotes = ['C','D','E','F','G','A','B'];
                const padNotes = [];
                for(let i=0; i<4; i++) {
                    padNotes.push(...baseNotes);
                }
                const shuffled = padNotes.sort(() => Math.random() - 0.5);
                
                shuffled.forEach(n => {
                    const lpad = document.createElement('div');
                    lpad.style.cssText = 'width:60px; height:60px; background:#4CAF50; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer; box-shadow: 0 5px 10px rgba(0,0,0,0.3); border: 4px solid #81C784; transition:transform 0.1s;';
                    lpad.innerHTML = `<span style="font-size:24px;">${noteData[n].o}</span><span style="font-size:12px; color:white; font-weight:bold;">${noteData[n].n}</span>`;
                    lpad.onclick = () => {
                        lpad.style.transform = 'scale(0.9)';
                        setTimeout(() => lpad.style.transform='scale(1)', 100);
                        
                        const slot = mgSlots[activeSlotIdx];
                        if (slot) {
                            slot.innerHTML = noteData[n].o;
                            slot.dataset.filled = n;
                            slot.style.background = 'white';
                            slot.style.borderStyle = 'solid';
                            slot.style.borderWidth = '2px';
                            slot.style.borderColor = '#01579b';
                            playNote(noteData[n].f, 0.4);
                            
                            // Advance active slot to the next empty one
                            let nextIdle = -1;
                            for(let i=activeSlotIdx+1; i<mgSlots.length; i++){
                                if (!mgSlots[i].dataset.filled) { nextIdle = i; break; }
                            }
                            if (nextIdle === -1) {
                                for(let i=0; i<activeSlotIdx; i++) {
                                    if (!mgSlots[i].dataset.filled) { nextIdle = i; break; }
                                }
                            }
                            
                            if (nextIdle !== -1) {
                                mgSlots[nextIdle].click();
                            }
                        }
                    };
                    poolArea.appendChild(lpad);
                });
            };
            
            document.getElementById('v2-mg-play').onclick = async () => {
                const bubble = document.getElementById('v2-mg-bubble');
                let allCorrect = true;
                
                for(let i=0; i<mgSlots.length; i++) {
                    const slot = mgSlots[i];
                    if (!slot.dataset.filled) {
                        bubble.innerText = currentLanguage==='zh'?'还有空位哦！':'Fill all the lily pads!';
                        return;
                    }
                    
                    if (slot.dataset.filled === slot.dataset.expected) {
                        slot.style.boxShadow = '0 0 15px #4CAF50';
                        playNote(noteData[slot.dataset.filled].f, 0.4);
                        await new Promise(r => setTimeout(r, 600));
                        slot.style.boxShadow = 'none';
                    } else {
                        slot.style.background = '#EF5350';
                        slot.style.animation = 'shake 0.5s';
                        SoundService.playWrong();
                        allCorrect = false;
                        bubble.innerText = currentLanguage==='zh'?'有音符迷路了，再检查一下！':'Something is not right here, check again.';
                        setTimeout(() => {
                            slot.style.animation = '';
                            slot.style.background = 'white';
                        }, 500);
                        break;
                    }
                }
                
                if (allCorrect) {
                    createConfetti();
                    createConfetti();
                    bubble.innerText = currentLanguage==='zh'?'太棒了！旋律完全正确！':'Great job! You made the melody!';
                    setTimeout(() => {
                        ProgressService.updateStars('sight', 2, 3);
                        navigateTo('sight-hub');
                    }, 3000);
                }
            };
            
            document.getElementById('v2-mg-clear').onclick = () => {
                activeSlotIdx = 0;
                mgSlots.forEach((slot, idx) => {
                    slot.dataset.filled = '';
                    slot.innerHTML = '';
                    slot.style.background = 'rgba(255,255,255,0.8)';
                    slot.style.borderStyle = 'dashed';
                    slot.style.borderWidth = '2px';
                    slot.style.borderColor = '#01579b';
                    if (idx === 0) slot.style.border = '4px solid #F44336';
                });
            };
        }

        if (level == 3) {
            
            const btnStartTut = document.getElementById('v3-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v3-btn-practice');
            const btnSkipTut = document.getElementById('v3-btn-skip');
            const tutArea = document.getElementById('v3-tutorial');
            const pracArea = document.getElementById('v3-practice');
            const miniArea = document.getElementById('v3-minigame');
            const tutStage = document.getElementById('v3-tut-stage');
            const tutVisuals = document.getElementById('v3-tut-visuals');

            const tutSteps = [
                { type: 'text', ts: '2/4', text: currentLanguage === 'zh' ? '小知识：节拍有一个稳定的循环，就像钟表一样！' : 'Fun fact: Beats have a steady loop, like a clock!' },
                { type: 'ts-2', ts: '2/4', text: currentLanguage === 'zh' ? '2/4 拍的意思是：每个小节有 2 拍！' : '2/4 means 2 beats in each bar!' },
                { type: 'ts-4', ts: '4/4', text: currentLanguage === 'zh' ? '如果是 4/4 拍，每个小节就有 4 拍！' : 'If it is 4/4, there are 4 beats in each bar!' },
                { type: 'pulse-2', ts: '2/4', text: currentLanguage === 'zh' ? '现在我们感受 2 拍：大... 大... 停！' : 'Now lets feel 2 beats: Da... Da... pause!' },
                { type: 'pulse-4', ts: '4/4', text: currentLanguage === 'zh' ? '感受 4 拍：大... 大... 大... 大... 停！' : 'Now feel 4 beats: Da... Da... Da... Da... pause!' }
            ];

            let tutTimeout = null;
            const cleanupTut = () => {
                if(tutTimeout) clearTimeout(tutTimeout);
                window._sightTimeouts.forEach(clearTimeout);
                tutVisuals.innerHTML = '';
            };

            btnSkipTut.style.display = 'inline-block';
            btnSkipTut.onclick = () => {
                cleanupTut();
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

            btnPracticeBtn.onclick = () => {
                cleanupTut();
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';

                let step = 0;
                const runStep = () => {
                    tutVisuals.innerHTML = '';
                    if (step < tutSteps.length) {
                        const s = tutSteps[step];
                        const bubble = document.getElementById('v3-tut-bubble');
                        bubble.innerText = s.text;

                        if (s.type === 'ts-2' || s.type === 'ts-4') {
                            const tsEl = document.createElement('div');
                            tsEl.style.fontSize = '8rem';
                            tsEl.style.fontWeight = '900';
                            tsEl.style.color = 'var(--accent-purple)';
                            tsEl.innerText = s.ts;
                            tutVisuals.appendChild(tsEl);
                            tsEl.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            playNote(400, 0.5);
                        } else if (s.type === 'pulse-2' || s.type === 'pulse-4') {
                            const num = s.type === 'pulse-2' ? 2 : 4;
                            for(let i=0; i<num; i++) {
                                const d = document.createElement('div');
                                d.style.width = '60px';
                                d.style.height = '60px';
                                d.style.background = '#ccc';
                                d.style.borderRadius = '50%';
                                d.id = 'tut-dot-' + i;
                                tutVisuals.appendChild(d);
                            }
                            
                            let beat = 0;
                            const playBeat = () => {
                                if (beat < num) {
                                    const dot = document.getElementById('tut-dot-' + beat);
                                    if(dot) {
                                        dot.style.background = '#ff9800';
                                        dot.style.transform = 'scale(1.2)';
                                        dot.style.boxShadow = '0 0 20px #ff9800';
                                        setTimeout(() => {
                                            dot.style.background = '#ccc';
                                            dot.style.transform = 'scale(1)';
                                            dot.style.boxShadow = 'none';
                                        }, 400);
                                    }
                                    playNote(261.63, 0.1); // C4 tick
                                    beat++;
                                    tutTimeout = setTimeout(playBeat, 800);
                                    window._sightTimeouts.push(tutTimeout);
                                } else {
                                    SpeechService.speak(s.text, currentLanguage, () => {
                                        step++;
                                        tutTimeout = setTimeout(runStep, 800);
                                        window._sightTimeouts.push(tutTimeout);
                                    });
                                }
                            };
                            if (num > 0) playBeat();
                            return; // Wait for beats to finish before speech
                        }

                        SpeechService.speak(s.text, currentLanguage, () => {
                            step++;
                            tutTimeout = setTimeout(runStep, 800);
                            window._sightTimeouts.push(tutTimeout);
                        });

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        btnSkipTut.style.display = 'none';
                        const bubble = document.getElementById('v3-tut-bubble');
                        bubble.innerText = currentLanguage==='zh'?'太棒了！现在我们去练习！':'Awesome! Let\'s go practice!';
                    }
                };
                runStep();
            };

            // Practice Section
            const btnPracStart = document.getElementById('v3-btn-start-prac');
            const btnPracStop = document.getElementById('v3-btn-stop-prac');
            const btnGame = document.getElementById('v3-btn-game');
            const pracDot = document.getElementById('v3-prac-dot');
            const pracMarkers = document.getElementById('v3-prac-markers');
            const pracBubble = document.getElementById('v3-prac-bubble');

            let timeSig = 4;
            let tempoBPM = 60; 
            let currentBarBeat = 0;
            let isPracActive = false;

            const updatePracVisuals = () => {
                document.getElementById('v3-ts-2').style.background = timeSig === 2 ? '#2196F3' : '#e0e0e0';
                document.getElementById('v3-ts-2').style.color = timeSig === 2 ? '#fff' : '#333';
                document.getElementById('v3-ts-4').style.background = timeSig === 4 ? '#2196F3' : '#e0e0e0';
                document.getElementById('v3-ts-4').style.color = timeSig === 4 ? '#fff' : '#333';
                
                document.getElementById('v3-sp-slow').style.background = tempoBPM === 60 ? '#4CAF50' : '#e0e0e0';
                document.getElementById('v3-sp-slow').style.color = tempoBPM === 60 ? '#fff' : '#333';
                document.getElementById('v3-sp-fast').style.background = tempoBPM === 100 ? '#4CAF50' : '#e0e0e0';
                document.getElementById('v3-sp-fast').style.color = tempoBPM === 100 ? '#fff' : '#333';

                pracBubble.innerText = currentLanguage==='zh'?`每个小节有 ${timeSig} 拍哦！圆点亮起时点击！` : `Each bar has ${timeSig} beats! Tap when lit!`;
                
                // create markers
                pracMarkers.innerHTML = '';
                for(let i=0; i<timeSig; i++) {
                    const m = document.createElement('div');
                    m.style.width = '15px';
                    m.style.height = '15px';
                    m.style.background = '#ccc';
                    m.style.borderRadius = '50%';
                    m.id = 'prac-m-' + i;
                    pracMarkers.appendChild(m);
                }
            };
            
            document.getElementById('v3-ts-2').onclick = () => { if(isPracActive)return; timeSig=2; updatePracVisuals(); };
            document.getElementById('v3-ts-4').onclick = () => { if(isPracActive)return; timeSig=4; updatePracVisuals(); };
            document.getElementById('v3-sp-slow').onclick = () => { if(isPracActive)return; tempoBPM=60; updatePracVisuals(); };
            document.getElementById('v3-sp-fast').onclick = () => { if(isPracActive)return; tempoBPM=100; updatePracVisuals(); };

            updatePracVisuals();

            let lastPracBeatTime = 0;
            let tapsInBar = 0;

            const stopPrac = () => {
                isPracActive = false;
                if(window._sightInterval) clearInterval(window._sightInterval);
                btnPracStart.style.display = 'inline-block';
                btnPracStop.style.display = 'none';
                btnGame.style.display = 'inline-block';
                pracDot.style.background = '#ff9800';
                pracDot.style.boxShadow = '0 10px 20px rgba(255,152,0,0.4)';
            };

            btnPracStop.onclick = stopPrac;

            btnPracStart.onclick = () => {
                isPracActive = true;
                btnPracStart.style.display = 'none';
                btnPracStop.style.display = 'inline-block';
                btnGame.style.display = 'none';
                
                currentBarBeat = 0;
                tapsInBar = 0;
                
                const msPerBeat = 60000 / tempoBPM;
                
                const tick = () => {
                    if(!isPracActive) return;
                    lastPracBeatTime = Date.now();
                    
                    // Reset markers at bar start
                    if (currentBarBeat === 0) {
                        tapsInBar = 0;
                        for(let i=0; i<timeSig; i++) {
                            const m = document.getElementById('prac-m-' + i);
                            if(m) m.style.background = '#ccc';
                        }
                    }

                    // highlight marker
                    const m = document.getElementById('prac-m-' + currentBarBeat);
                    if(m) m.style.background = '#ff9800';
                    
                    pracDot.style.transform = 'scale(1.1)';
                    pracDot.innerText = '✨';
                    setTimeout(() => {
                        pracDot.style.transform = 'scale(1)';
                        pracDot.innerText = '🖐️';
                    }, 200);

                    playNote(150, 0.1);

                    currentBarBeat = (currentBarBeat + 1) % timeSig;
                };

                tick();
                window._sightInterval = setInterval(tick, msPerBeat);
            };

            pracDot.onclick = () => {
                if(!isPracActive) return;
                
                pracDot.style.background = '#4CAF50';
                pracDot.style.boxShadow = '0 0 30px #4CAF50';
                setTimeout(() => {
                    pracDot.style.background = '#ff9800';
                    pracDot.style.boxShadow = '0 10px 20px rgba(255,152,0,0.4)';
                }, 200);
                
                const now = Date.now();
                const msPerBeat = 60000 / tempoBPM;
                const diff = Math.abs(now - lastPracBeatTime);
                const halfTempo = msPerBeat / 2;
                const dist = diff > halfTempo ? Math.abs(diff - msPerBeat) : diff;

                if (dist < 200) {
                    tapsInBar++;
                    playNote(400, 0.1);
                    createConfetti();
                    if(tapsInBar >= timeSig) {
                        pracBubble.innerText = currentLanguage==='zh'?'干得漂亮！太准啦！':'Great job! Very accurate!';
                    }
                } else {
                    playNote(100, 0.1); 
                    pracBubble.innerText = currentLanguage==='zh'?'哎呀偏了一点，注意节奏哦！':'Oops a bit off, watch the beat!';
                }
            };

            btnGame.onclick = () => {
                stopPrac();
                pracArea.style.display = 'none';
                miniArea.style.display = 'flex';
                initBeatTrain();
            };

            // MINI GAME BEAT TRAIN
            let mgTempo = 80;
            let mgTimeSig = 2; // current car's TS
            let mgBarBeat = 0;
            let mgActive = false;
            let mgLastBeatTime = 0;
            let mgTaps = 0;
            let carIdx = 0;
            const trainCars = [2, 4, 3, 4]; // time signatures for cars

            const initBeatTrain = () => {
                carIdx = 0;
                mgActive = false;
                document.getElementById('v3-mg-btn-start').style.display = 'inline-block';
                document.getElementById('v3-mg-tap-area').style.display = 'none';
                resetTrainCar();
            };

            const resetTrainCar = () => {
                const car = document.getElementById('v3-mg-car');
                car.style.opacity = '0';
                car.style.transform = 'translateX(50px)';
                
                if (carIdx >= trainCars.length) {
                    document.getElementById('v3-mg-bubble').innerText = currentLanguage==='zh'?'太棒了！火车到站啦！':'Amazing! Train reached the station!';
                    createConfetti();
                    createConfetti();
                    document.getElementById('v3-mg-tap-area').style.display = 'none';
                    setTimeout(() => {
                        ProgressService.updateStars('sight', 3, 3);
                        navigateTo('sight-hub');
                    }, 3000);
                    return;
                }

                mgTimeSig = trainCars[carIdx];
                document.getElementById('v3-mg-ts').innerText = mgTimeSig + '/4';
                
                const beatsContainer = document.getElementById('v3-mg-car-beats');
                beatsContainer.innerHTML = '';
                for(let i=0; i<mgTimeSig; i++) {
                    const b = document.createElement('div');
                    b.style.width = '12px';
                    b.style.height = '12px';
                    b.style.background = '#ccc';
                    b.style.borderRadius = '50%';
                    b.id = 'mg-car-b-' + i;
                    beatsContainer.appendChild(b);
                }

                setTimeout(() => {
                    car.style.opacity = '1';
                    car.style.transform = 'translateX(0)';
                }, 100);
            };

            document.getElementById('v3-mg-btn-start').onclick = () => {
                document.getElementById('v3-mg-btn-start').style.display = 'none';
                document.getElementById('v3-mg-tap-area').style.display = 'flex';
                document.getElementById('v3-mg-dot').style.display = 'block';
                startCarSequence();
            };

            const startCarSequence = () => {
                mgActive = true;
                mgBarBeat = 0;
                mgTaps = 0;
                const msPerBeat = 60000 / mgTempo;
                
                const mgDot = document.getElementById('v3-mg-dot');
                
                const mgTick = () => {
                    if(!mgActive) return;
                    mgLastBeatTime = Date.now();
                    
                    mgDot.style.background = '#ffeb3b';
                    mgDot.style.transform = 'scale(1.5)';
                    setTimeout(() => {
                        mgDot.style.background = '#fff';
                        mgDot.style.transform = 'scale(1)';
                    }, 200);
                    
                    playNote(150, 0.1);
                    
                    mgBarBeat++;
                    if(mgBarBeat >= mgTimeSig) {
                        mgActive = false; // End of bar reading
                        if(window._sightInterval) clearInterval(window._sightInterval);
                        
                        window._sightTimeouts.push(setTimeout(() => checkCarResult(), msPerBeat)); 
                    }
                };
                
                mgTick();
                window._sightInterval = setInterval(mgTick, msPerBeat);
            };

            document.getElementById('v3-mg-tap-area').onclick = () => {
                if(!mgActive && mgTaps >= mgTimeSig) return;
                
                const area = document.getElementById('v3-mg-tap-area');
                area.style.transform = 'scale(0.95)';
                setTimeout(() => area.style.transform = 'scale(1)', 100);
                
                const msPerBeat = 60000 / mgTempo;
                const diff = Date.now() - mgLastBeatTime;
                
                if (diff < 250 || diff > msPerBeat - 250) {
                    playNote(400, 0.1);
                    const bMark = document.getElementById('mg-car-b-' + mgTaps);
                    if(bMark) bMark.style.background = '#4CAF50';
                    mgTaps++;
                } else {
                    playNote(100, 0.1); // wrong
                    document.getElementById('v3-mg-bubble').innerText = currentLanguage==='zh'?'哎呀！找准节奏点击哦！':'Oops! Not on the beat!';
                }
            };

            let tracksX = 0;
            const checkCarResult = () => {
                if(mgTaps === mgTimeSig) {
                    SoundService.playSuccess();
                    document.getElementById('v3-mg-bubble').innerText = currentLanguage==='zh'?'太准了！火车前进！':'Perfect! Train moving!';
                    
                    const pKeys = document.getElementById('v3-mg-car');
                    pKeys.style.boxShadow = '0 0 20px #4CAF50';
                    
                    document.getElementById('v3-mg-smoke').style.opacity = '1';
                    document.getElementById('v3-mg-smoke').style.transform = 'translateY(-20px) scale(1.5)';
                    
                    tracksX -= 100;
                    document.getElementById('v3-mg-tracks').style.transform = `translateX(${tracksX}px)`;
                    
                    window._sightTimeouts.push(setTimeout(() => {
                        document.getElementById('v3-mg-smoke').style.opacity = '0';
                        document.getElementById('v3-mg-smoke').style.transform = 'translateY(0) scale(1)';
                        pKeys.style.boxShadow = '0 3px 0 #F57F17';
                        carIdx++;
                        resetTrainCar();
                        if(carIdx < trainCars.length) {
                            window._sightTimeouts.push(setTimeout(startCarSequence, 1000));
                        }
                    }, 1000));
                    
                } else {
                    document.getElementById('v3-mg-bubble').innerText = currentLanguage==='zh'?`车厢需要 ${mgTimeSig} 拍！再试一次！`:`This car needs ${mgTimeSig} beats! Try again!`;
                    SoundService.playWrong();
                    mgBarBeat = 0;
                    mgTaps = 0;
                    for(let i=0; i<mgTimeSig; i++) {
                        const bMark = document.getElementById('mg-car-b-' + i);
                        if(bMark) bMark.style.background = '#ccc';
                    }
                    window._sightTimeouts.push(setTimeout(startCarSequence, 1000));
                }
            };
        }

        if (level == 4) {
            const btnStartTut = document.getElementById('v4-btn-start-tut');
            const btnSkipTut = document.getElementById('v4-btn-skip');
            const btnPracticeBtn = document.getElementById('v4-btn-practice');
            const btnGame = document.getElementById('v4-btn-game');
            const btnResetGame = document.getElementById('v4-mg-reset');
            
            const tutArea = document.getElementById('v4-tutorial');
            const pracArea = document.getElementById('v4-practice');
            const miniArea = document.getElementById('v4-minigame');
            
            const tutStage = document.getElementById('v4-tut-stage');
            const tutImg = document.getElementById('v4-tut-img');
            const tutText = document.getElementById('v4-tut-text');
            const tutPulses = document.getElementById('v4-tut-pulses');

            btnSkipTut.style.display = 'inline-block';

            let isTutActive = false;
            let tutTimeout = null;
            
            const cleanupTut = () => {
                isTutActive = false;
                if(tutTimeout) clearTimeout(tutTimeout);
                window._sightTimeouts.forEach(clearTimeout);
                tutPulses.innerHTML = '';
            };

            btnSkipTut.onclick = () => {
                cleanupTut();
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

            btnPracticeBtn.onclick = () => {
                cleanupTut();
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };
            
            const NoteIconRenderer = {
                draw(type) {
                    const s = `<svg viewBox="0 0 100 100" width="40" height="40" style="overflow:visible; vertical-align:middle;">`;
                    const drawHead = (fill, stroke) => `<ellipse cx="30" cy="80" rx="20" ry="14" transform="rotate(-20 30 80)" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
                    const drawStem = () => `<line x1="48" y1="80" x2="48" y2="10" stroke="#333" stroke-width="5"/>`;
                    
                    if(type === 'whole') {
                         return s + `<ellipse cx="50" cy="50" rx="30" ry="22" transform="rotate(-20 50 50)" fill="none" stroke="#333" stroke-width="6"/>` + `</svg>`;
                    }
                    if(type === 'half') {
                         return s + drawHead('none', '#333') + drawStem() + `</svg>`;
                    }
                    if(type === 'quarter') {
                         return s + drawHead('#333', '#333') + drawStem() + `</svg>`;
                    }
                    if(type === 'eighth') {
                         return s + drawHead('#333', '#333') + drawStem() + `<path d="M48,10 Q80,20 60,60 Q70,35 48,25 Z" fill="#333"/>` + `</svg>`;
                    }
                    if(type === 'eighth2') {
                         const s2 = `<svg viewBox="0 0 120 100" width="50" height="40" style="overflow:visible; vertical-align:middle;">`;
                         const h1 = `<ellipse cx="30" cy="80" rx="20" ry="14" transform="rotate(-20 30 80)" fill="#333" />`;
                         const h2 = `<ellipse cx="80" cy="80" rx="20" ry="14" transform="rotate(-20 80 80)" fill="#333" />`;
                         const st1 = `<line x1="48" y1="80" x2="48" y2="10" stroke="#333" stroke-width="5"/>`;
                         const st2 = `<line x1="98" y1="80" x2="98" y2="10" stroke="#333" stroke-width="5"/>`;
                         const beam = `<line x1="46" y1="12" x2="100" y2="12" stroke="#333" stroke-width="10"/>`;
                         return s2 + h1 + h2 + st1 + st2 + beam + `</svg>`;
                    }
                    return '';
                }
            };
            
            const tutSteps = [
                { id: 'intro', emoji: '👣', text: currentLanguage === 'zh' ? '音符就像小小足迹，告诉你什么时候敲、敲几次！' : 'Notes are like little footprints. They tell you when to tap and how many times to tap.' },
                { id: 'whole', icon: NoteIconRenderer.draw('whole'), text: currentLanguage === 'zh' ? '全音符有4拍。唱一次，敲4下。' : 'Whole note has 4 beats. Sing once, tap 4 times.' },
                { id: 'half', icon: NoteIconRenderer.draw('half'), text: currentLanguage === 'zh' ? '二分音符有2拍。唱一次，敲2下。' : 'Half note has 2 beats. Sing once, tap 2 times.' },
                { id: 'quarter', icon: NoteIconRenderer.draw('quarter'), text: currentLanguage === 'zh' ? '四分音符有1拍。唱一次，敲1下。' : 'Quarter note has 1 beat. Sing once, tap 1 time.' },
                { id: 'eighth', icon: NoteIconRenderer.draw('eighth2'), text: currentLanguage === 'zh' ? '两个八分音符也是1拍。敲2下，要快！' : 'Two eighth notes are 1 beat. Tap 2 times, fast!' }
            ];

            btnStartTut.onclick = () => {
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'block';
                isTutActive = true;
                let step = 0;

                const runStep = () => {
                    if (!isTutActive) return;
                    tutPulses.innerHTML = '';
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        if (ts.icon) {
                            tutImg.innerHTML = ts.icon;
                            const svg = tutImg.querySelector('svg');
                            if(svg) { svg.style.width = '100px'; svg.style.height = '100px'; }
                        } else {
                            tutImg.innerHTML = ts.emoji;
                        }
                        tutText.innerText = ts.text;
                        
                        tutImg.style.animation = 'popIn 0.5s ease';
                        setTimeout(()=> { if(tutImg) tutImg.style.animation = 'none'; }, 500);

                        let playBeats = () => {
                            SpeechService.speak(ts.text, currentLanguage, () => {
                                step++;
                                tutTimeout = setTimeout(runStep, 1000);
                                window._sightTimeouts.push(tutTimeout);
                            });
                        };

                        if (ts.id === 'intro') {
                            SoundService.playSuccess();
                            playBeats();
                        } else {
                            let pulses = [];
                            let num = 0;
                            let dur = 0;
                            let voice = 'Da';
                            let speed = 800;
                            if (ts.id === 'whole') { num = 4; dur = 3; voice = 'Da~~~'; speed = 800; }
                            if (ts.id === 'half') { num = 2; dur = 1.5; voice = 'Da~'; speed = 800; }
                            if (ts.id === 'quarter') { num = 1; dur = 0.5; voice = 'Da'; speed = 800; }
                            if (ts.id === 'eighth') { num = 2; dur = 0.1; voice = 'Da Da'; speed = 300; }

                            for(let i=0; i<num; i++){
                                const p = document.createElement('div');
                                p.style.width = '30px'; p.style.height = '30px';
                                p.style.borderRadius = '50%'; p.style.background = '#ccc';
                                tutPulses.appendChild(p);
                                pulses.push(p);
                            }

                            let pulseState = 0;
                            let bp = () => {
                                if (!isTutActive) return;
                                if (pulseState < num) {
                                    if(pulses[pulseState]) {
                                        pulses[pulseState].style.background = '#ff9800';
                                        pulses[pulseState].style.transform = 'scale(1.2)';
                                        pulses[pulseState].style.boxShadow = '0 0 15px #ff9800';
                                    }
                                    playNote(261.63, 0.1); 
                                    playNote(330, dur); 
                                    setTimeout(()=>{
                                        if (pulses[pulseState]) {
                                            pulses[pulseState].style.transform = 'scale(1)';
                                        }
                                    }, 200);
                                    pulseState++;
                                    let t = setTimeout(bp, speed);
                                    window._sightTimeouts.push(t);
                                } else {
                                    playBeats();
                                }
                            };
                            bp();
                        }

                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        btnSkipTut.style.display = 'none';
                        tutImg.innerHTML = '🎉';
                        tutText.innerText = currentLanguage==='zh'?'准备好了吗？去练习吧！':'Ready? Try it out!';
                    }
                };
                runStep();
            };

            const btnPracListen = document.getElementById('v4-prac-btn-listen');
            const btnPracPlay = document.getElementById('v4-prac-btn-play');
            const pad = document.getElementById('v4-rhythm-tap-pad');
            const pracPattern = document.getElementById('v4-rhythm-pattern');
            const pracPrints = document.getElementById('v4-prac-prints');
            const pracFeedback = document.getElementById('v4-prac-feedback');

            const pracExamples = [
                { pattern: ['quarter', 'quarter', 'quarter', 'quarter'], beats: [1,1,1,1] },
                { pattern: ['half', 'eighth2', 'quarter'], beats: [2, 0.5, 0.5, 1] },
                { pattern: ['whole'], beats: [4] }
            ];

            let currPracEx = 0;
            let isPracPlaying = false;
            let expectedTaps = 0;
            let playerTaps = [];
            let isPracRecording = false;
            let recordTimeout = null;

            const renderPrac = () => {
                 pracPattern.innerHTML = '';
                 pracPrints.innerHTML = '';
                 expectedTaps = 0;
                 const ex = pracExamples[currPracEx];
                 ex.pattern.forEach(p => {
                     const el = document.createElement('div');
                     el.className = 'symbol-icon-large';
                     el.style.margin = '0 5px';
                     el.innerHTML = NoteIconRenderer.draw(p);
                     const svg = el.querySelector('svg');
                     if(svg) { svg.style.width = '60px'; svg.style.height = '60px'; }
                     
                     if (p==='whole') { expectedTaps+=4; }
                     if (p==='half') { expectedTaps+=2; }
                     if (p==='quarter') { expectedTaps+=1; }
                     if (p==='eighth2') { expectedTaps+=2; }
                     pracPattern.appendChild(el);
                 });
            };

            renderPrac();

            btnPracListen.onclick = () => {
                if(isPracPlaying) return;
                isPracPlaying = true;
                pracFeedback.innerText = '';
                pracPrints.innerHTML = '';
                const ex = pracExamples[currPracEx];
                
                let bIdx = 0;
                let pb = () => {
                    if (!isPracPlaying) return;
                    if(bIdx < ex.beats.length) {
                        const b = ex.beats[bIdx];
                        const f = document.createElement('div');
                        f.innerText = '👣';
                        f.style.fontSize = '30px';
                        f.style.animation = 'popIn 0.3s ease';
                        pracPrints.appendChild(f);
                        
                        playNote(261.63, 0.1);
                        if (b===4) playNote(330, 2);
                        if (b===2) playNote(330, 1);
                        if (b===1) playNote(330, 0.5);
                        if (b===0.5) playNote(330, 0.2);

                        bIdx++;
                        let wait = b * 600;
                        if (b===0.5) wait = 300;
                        if (b===4) wait = 600; 
                        if (b===2) wait = 600;

                        window._sightTimeouts.push(setTimeout(pb, wait));
                    } else {
                        isPracPlaying = false;
                    }
                };
                pb();
            };

            btnPracPlay.onclick = () => {
                if(isPracPlaying) return;
                playerTaps = [];
                isPracRecording = true;
                pracPrints.innerHTML = '';
                pracFeedback.innerText = currentLanguage==='zh'?'该你了！敲击面板！':'Your turn! Tap the pad!';
                pracFeedback.style.color = 'var(--accent-blue)';
                
                if(recordTimeout) clearTimeout(recordTimeout);
                recordTimeout = setTimeout(checkPracResult, 5000);
            };

            pad.onclick = () => {
                if (!isPracRecording) {
                    playNote(150, 0.1);
                    return;
                }
                playNote(150, 0.1);
                playerTaps.push(Date.now());
                
                const f = document.createElement('div');
                f.innerText = '👣';
                f.style.fontSize = '30px';
                f.style.color = '#ffb300';
                f.style.animation = 'popIn 0.3s ease';
                pracPrints.appendChild(f);

                pad.style.transform = 'scale(0.9)';
                setTimeout(()=>pad.style.transform='none', 100);

                if(recordTimeout) clearTimeout(recordTimeout);
                recordTimeout = setTimeout(checkPracResult, 2000);
            };

            const checkPracResult = () => {
                isPracRecording = false;
                if(playerTaps.length === expectedTaps || playerTaps.length > 0) {
                    if (playerTaps.length === expectedTaps) {
                        pracFeedback.innerText = currentLanguage==='zh'?'太准啦！节奏完美！':'Perfect! Great rhythm!';
                        pracFeedback.style.color = 'var(--accent-green)';
                        SoundService.playSuccess();
                        createConfetti();
                        
                        setTimeout(() => {
                            currPracEx++;
                            if(currPracEx >= pracExamples.length) {
                                pracFeedback.innerText = currentLanguage==='zh'?'练习完成！':'Practice completed!';
                                btnGame.style.display = 'inline-block';
                            } else {
                                renderPrac();
                            }
                        }, 2000);
                    } else {
                        pracFeedback.innerText = currentLanguage==='zh'?'哎呀不对，再听一次？':'Oops, try again?';
                        pracFeedback.style.color = 'var(--accent-red)';
                        SoundService.playWrong();
                    }
                }
            };

            btnGame.onclick = () => {
                pracArea.style.display = 'none';
                miniArea.style.display = 'flex';
                initFishingGame();
            };

            const pond = document.getElementById('v4-mg-pond');
            const hooksContainer = document.getElementById('v4-mg-hooks');
            
            const fishes = [
                { id: 'f1', beats: '1 Beat', target: 'quarter' },
                { id: 'f2', beats: '2 Beats', target: 'half' },
                { id: 'f3', beats: '4 Beats', target: 'whole' },
                { id: 'f4', beats: 'Half Beat', target: 'eighth' }
            ];

            const drawMiniNote = (type) => {
                const s = `<svg viewBox="0 0 100 100" width="40" height="40" style="overflow:visible; vertical-align:middle;">`;
                const drawHead = (fill, stroke) => `<ellipse cx="30" cy="80" rx="20" ry="14" transform="rotate(-20 30 80)" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
                const drawStem = () => `<line x1="48" y1="80" x2="48" y2="10" stroke="#333" stroke-width="5"/>`;
                
                if(type === 'whole') {
                     return s + `<ellipse cx="50" cy="50" rx="30" ry="22" transform="rotate(-20 50 50)" fill="none" stroke="#333" stroke-width="6"/>` + `</svg>`;
                }
                if(type === 'half') {
                     return s + drawHead('none', '#333') + drawStem() + `</svg>`;
                }
                if(type === 'quarter') {
                     return s + drawHead('#333', '#333') + drawStem() + `</svg>`;
                }
                if(type === 'eighth') {
                     return s + drawHead('#333', '#333') + drawStem() + `<path d="M48,10 Q80,20 60,60 Q70,35 48,25 Z" fill="#333"/>` + `</svg>`;
                }
            };

            const hooks = [
                { id: 'quarter', icon: drawMiniNote('quarter') },
                { id: 'half', icon: drawMiniNote('half') },
                { id: 'whole', icon: drawMiniNote('whole') },
                { id: 'eighth', icon: drawMiniNote('eighth') }
            ];

            let matchedCount = 0;
            let dragNote = null;

            const initFishingGame = () => {
                pond.innerHTML = '';
                pond.style.background = 'linear-gradient(to bottom, #80DEEA, #00ACC1)';
                pond.style.boxShadow = 'inset 0 10px 20px rgba(0,0,0,0.1)';
                pond.style.overflow = 'hidden';
                
                // Add ambient bubbles
                for(let b=0; b<5; b++) {
                    const bub = document.createElement('div');
                    bub.style.position = 'absolute';
                    bub.style.bottom = '-20px';
                    bub.style.left = Math.random() * 80 + 10 + '%';
                    bub.style.width = bub.style.height = (Math.random() * 20 + 10) + 'px';
                    bub.style.background = 'rgba(255,255,255,0.4)';
                    bub.style.borderRadius = '50%';
                    bub.style.animation = `floatUp ${Math.random()*3+3}s infinite linear`;
                    pond.appendChild(bub);
                }

                hooksContainer.innerHTML = '';
                matchedCount = 0;
                
                const fishColors = ['#FF9800', '#FF4081', '#4CAF50', '#9C27B0'];

                fishes.forEach((f, i) => {
                    const el = document.createElement('div');
                    el.className = 'mg-fish';
                    el.id = 'mg-fish-' + f.id;
                    el.dataset.target = f.target;
                    el.style.width = '100px';
                    el.style.height = '80px';
                    el.style.background = fishColors[i];
                    el.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
                    el.style.display = 'flex';
                    el.style.flexDirection = 'column';
                    el.style.justifyContent = 'center';
                    el.style.alignItems = 'center';
                    el.style.color = '#fff';
                    el.style.fontWeight = 'bold';
                    el.style.position = 'absolute';
                    // Spread fish around the pond randomly
                    el.style.top = (10 + Math.random()*40) + '%';
                    el.style.left = (10 + i * 20) + '%';
                    el.style.animation = `fishSwim ${4 + i}s infinite ease-in-out alternate`;
                    el.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                    el.style.cursor = 'pointer';
                    el.style.border = '3px solid rgba(255,255,255,0.5)';
                    el.style.transition = 'all 0.3s ease';
                    el.draggable = true;
                    el.ondragstart = (e) => {
                         e.dataTransfer.setData('text/plain', 'fish:' + f.target);
                         dragNote = el; // Store fish element
                         el.style.transform = 'scale(1.1)';
                    };
                    el.ondragend = () => { el.style.transform = ''; };
                    
                    const tail = document.createElement('div');
                    tail.style.position='absolute'; tail.style.right='-20px'; tail.style.top='25px';
                    tail.style.borderLeft=`25px solid ${fishColors[i]}`; tail.style.borderTop='15px solid transparent'; tail.style.borderBottom='15px solid transparent';
                    el.appendChild(tail);
                    
                    const eye = document.createElement('div');
                    eye.style.position='absolute'; eye.style.left='15px'; eye.style.top='20px';
                    eye.style.width='10px'; eye.style.height='10px'; eye.style.background='#fff'; eye.style.borderRadius='50%';
                    const pupil = document.createElement('div');
                    pupil.style.width='4px'; pupil.style.height='4px'; pupil.style.background='#000'; pupil.style.borderRadius='50%'; pupil.style.margin='3px';
                    eye.appendChild(pupil);
                    el.appendChild(eye);

                    const lbl = document.createElement('div');
                    lbl.innerText = f.beats;
                    lbl.style.fontSize='14px';
                    lbl.style.marginTop='5px';
                    lbl.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
                    el.appendChild(lbl);

                    pond.appendChild(el);

                    el.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        el.style.transform = 'scale(1.1) translateY(-10px)';
                        el.style.boxShadow = '0 10px 25px rgba(255,255,255,0.6)';
                    });
                    el.addEventListener('dragleave', () => {
                        el.style.transform = '';
                        el.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                    });
                    el.addEventListener('drop', (e) => {
                        e.preventDefault();
                        el.style.transform = '';
                        el.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                        if (dragNote && dragNote.classList.contains('mg-hook')) {
                            handleDrop(el, dragNote);
                        }
                    });
                     el.onclick = () => { 
                         if(dragNote && dragNote.classList.contains('mg-hook')) {
                             handleDrop(el, dragNote);
                         } else {
                             dragNote = el;
                             el.style.transform = 'scale(1.1)';
                             setTimeout(() => el.style.transform='', 200);
                         }
                     };
                });

                hooks.forEach(h => {
                    const el = document.createElement('div');
                    el.className = 'mg-hook';
                    el.id = 'mg-hook-' + h.id;
                    el.dataset.id = h.id;
                    el.style.position = 'relative';
                    el.style.cursor = 'grab';
                    el.draggable = true;
                    el.style.transition = 'transform 0.2s';
                    
                    const line = document.createElement('div');
                    line.style.width = '2px'; line.style.height = '30px'; line.style.background = '#999';
                    line.style.margin = '0 auto';
                    el.appendChild(line);

                    const hookBody = document.createElement('div');
                    hookBody.innerHTML = h.icon;
                    hookBody.style.fontSize = '45px';
                    hookBody.style.width = '70px'; hookBody.style.height = '70px';
                    hookBody.style.background = '#fff'; hookBody.style.border = '3px solid #ccc';
                    hookBody.style.borderRadius = '50%';
                    hookBody.style.display = 'flex'; hookBody.style.justifyContent = 'center'; hookBody.style.alignItems = 'center';
                    hookBody.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
                    el.appendChild(hookBody);

                    el.ondragstart = (e) => { 
                        e.dataTransfer.setData('text/plain', h.id);
                        dragNote = el; 
                        hookBody.style.borderColor = 'var(--accent-orange)';
                        el.style.transform = 'scale(1.1) rotate(5deg)';
                        playNote(500, 0.1);
                    };
                    el.ondragend = () => {
                        if (dragNote === el) {
                            hookBody.style.borderColor = '#ccc';
                            el.style.transform = '';
                        }
                    };
                    
                    el.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        el.style.transform = 'scale(1.1)';
                    });
                    el.addEventListener('dragleave', () => { el.style.transform = ''; });
                    el.addEventListener('drop', (e) => {
                        e.preventDefault();
                        el.style.transform = '';
                        if (dragNote) {
                            if (dragNote.classList.contains('mg-fish')) handleDrop(dragNote, el);
                            else if (dragNote.classList.contains('mg-hook')) handleDrop(el, dragNote);
                        }
                    });

                    el.onclick = () => {  
                         if (dragNote && dragNote.classList.contains('mg-fish')) {
                             handleDrop(dragNote, el);
                         } else if (dragNote && dragNote !== el) {
                             dragNote.lastChild.style.border = '3px solid #ccc';
                             dragNote.style.transform = '';
                             dragNote = el; 
                         } else {
                             dragNote = el; 
                         }
                         hookBody.style.border = '3px solid var(--accent-orange)';
                         el.style.transform = 'scale(1.1) translateY(-10px)';
                         playNote(500, 0.1);
                    };

                    hooksContainer.appendChild(el);
                });
                
                document.getElementById('v4-mg-bubble').innerText = currentLanguage === 'zh' ? '🎣 帮鸟儿把音符拖到对应拍数的鱼身上！' : '🎣 Drag the notes to the fish with the matching beats!';
            };

            const handleDrop = (fishEl, hookEl) => {
                const target = fishEl.dataset.target;
                const id = hookEl.dataset.id;
                
                if (target === id) {
                    SoundService.playSuccess();
                    fishEl.style.background = '#81C784';
                    fishEl.innerHTML = '<div style="font-size:40px;">✨</div>';
                    fishEl.style.animation = 'popIn 0.5s ease';
                    hookEl.style.opacity = '0';
                    hookEl.style.pointerEvents = 'none';
                    dragNote = null;
                    matchedCount++;
                    document.getElementById('v4-mg-bubble').innerText = currentLanguage==='zh'?`答对啦！这是一个${id}音符。`:`Got it! That is a ${id} note.`;
                    
                    if (matchedCount === 4) {
                        createConfetti();
                        createConfetti();
                        document.getElementById('v4-mg-bubble').innerText = currentLanguage==='zh'?'太棒了！你认识所有的音符！':'Amazing! You know all the notes!';
                        setTimeout(() => {
                             ProgressService.updateStars('sight', 4, 3);
                             navigateTo('sight-hub');
                        }, 3000);
                    }
                } else {
                    SoundService.playWrong();
                    hookEl.style.animation = 'shake 0.5s ease';
                    setTimeout(()=>hookEl.style.animation='', 500);
                    fishEl.style.transform = 'scale(1.1)';
                    setTimeout(()=>fishEl.style.transform='scale(1)', 200);
                    document.getElementById('v4-mg-bubble').innerText = currentLanguage==='zh'?'不对哦，再试一次！':'Not right, try again.';
                    if(dragNote) dragNote.style.border = '2px solid #ccc';
                    dragNote = null;
                }
            };
            
            btnResetGame.onclick = initFishingGame;
        }

        if (level == 5) {

            const btnStartTut = document.getElementById('v5-btn-start-tut');
            const btnPracticeBtn = document.getElementById('v5-btn-practice');
            const btnMinigame = document.getElementById('v5-btn-game');
            const btnSkip = document.getElementById('v5-btn-skip');
            
            const tutStage = document.getElementById('v5-tut-stage');
            const tutArea = document.getElementById('v5-tutorial');
            const pracArea = document.getElementById('v5-practice');
            const mgArea = document.getElementById('v5-minigame');

            const SONGS = {
                twinkle: {
                    name: "Twinkle Twinkle Little Star",
                    bpm: 100,
                    notes: [
                        {time: "0:0:0", note: "C4", dur: "8n"}, {time: "0:1:0", note: "C4", dur: "8n"},
                        {time: "0:2:0", note: "G4", dur: "8n"}, {time: "0:3:0", note: "G4", dur: "8n"},
                        {time: "1:0:0", note: "A4", dur: "8n"}, {time: "1:1:0", note: "A4", dur: "8n"},
                        {time: "1:2:0", note: "G4", dur: "4n"},
                        {time: "2:0:0", note: "F4", dur: "8n"}, {time: "2:1:0", note: "F4", dur: "8n"},
                        {time: "2:2:0", note: "E4", dur: "8n"}, {time: "2:3:0", note: "E4", dur: "8n"},
                        {time: "3:0:0", note: "D4", dur: "8n"}, {time: "3:1:0", note: "D4", dur: "8n"},
                        {time: "3:2:0", note: "C4", dur: "4n"}
                    ],
                    beats: ["0:0:0","0:1:0","0:2:0","0:3:0","1:0:0","1:1:0","1:2:0","1:3:0",
                            "2:0:0","2:1:0","2:2:0","2:3:0","3:0:0","3:1:0","3:2:0","3:3:0"]
                },
                boat: {
                    name: "Row Your Boat",
                    bpm: 110,
                    notes: [
                         {time: "0:0:0", note: "C4", dur: "4n"},  {time: "0:1:0", note: "C4", dur: "4n"},
                         {time: "0:2:0", note: "C4", dur: "8n"},  {time: "0:2:2", note: "D4", dur: "8n"},
                         {time: "0:3:0", note: "E4", dur: "4n"},  
                         {time: "1:0:0", note: "E4", dur: "8n"},  {time: "1:0:2", note: "D4", dur: "8n"},
                         {time: "1:1:0", note: "E4", dur: "8n"},  {time: "1:1:2", note: "F4", dur: "8n"},
                         {time: "1:2:0", note: "G4", dur: "2n"}
                    ],
                    beats: ["0:0:0","0:1:0","0:2:0","0:3:0","1:0:0","1:1:0","1:2:0","1:3:0"]
                },
                happy: {
                    name: "If You're Happy & You Know It",
                    bpm: 120,
                    notes: [
                        {time: "0:0:0", note: "C4", dur: "8n"}, {time: "0:0:2", note: "C4", dur: "8n"},
                        {time: "0:1:0", note: "F4", dur: "8n"}, {time: "0:1:2", note: "F4", dur: "8n"},
                        {time: "0:2:0", note: "F4", dur: "8n"}, {time: "0:2:2", note: "F4", dur: "8n"},
                        {time: "0:3:0", note: "F4", dur: "4n"},
                        {time: "1:0:0", note: "E4", dur: "8n"}, {time: "1:0:2", note: "F4", dur: "8n"},
                        {time: "1:1:0", note: "G4", dur: "2n"}
                    ],
                    beats: ["0:0:0","0:1:0","0:2:0","0:3:0","1:0:0","1:1:0","1:2:0","1:3:0"],
                    actions: {"1:2:0":"clap", "1:3:0":"clap"}
                }
            };
            
            // Vanilla JS replacement for Tone.js Playback
            let currentTimeouts = [];
            let currentOscillators = [];
            let musicStartTime = 0;
            let lastBeatTimeStr = "";
            let currentBpm = 100;
            
            const stopAllMusic = () => {
                currentTimeouts.forEach(id => window.clearTimeout(id));
                currentTimeouts = [];
                currentOscillators.forEach(osc => {
                    try { osc.stop(); } catch(e) {}
                    try { osc.disconnect(); } catch(e) {}
                });
                currentOscillators = [];
            };
            window.stopLevel5Music = stopAllMusic;

            const noteFreqs = {
                "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
                "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77
            };
            function noteToFreq(note) { return noteFreqs[note] || 440; }
            
            function timeToSeconds(timeStr, bpm) {
                if(!timeStr) return 0;
                const parts = timeStr.split(':');
                const bars = parseInt(parts[0]) || 0;
                const quarters = parseInt(parts[1]) || 0;
                const sixteenths = parseInt(parts[2]) || 0;
                const totalQuarters = (bars * 4) + quarters + (sixteenths / 4);
                return totalQuarters * (60 / bpm);
            }
            
            function durToSeconds(durStr, bpm) {
                let quarters = 1;
                if (durStr === "8n") quarters = 0.5;
                if (durStr === "4n") quarters = 1;
                if (durStr === "2n") quarters = 2;
                if (durStr === "16n") quarters = 0.25;
                if (durStr === "1m") quarters = 4;
                return quarters * (60 / bpm);
            }

            const initSynth = async () => {
                if(audioCtx && audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }
            };

            let isMicListening = false;
            let micStream = null;
            const startMic = async (onClap) => {
                if (isMicListening) return;
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    const source = audioCtx.createMediaStreamSource(micStream);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 512;
                    source.connect(analyser);
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    
                    let clapping = false;
                    const detect = () => {
                        if(!isMicListening) return;
                        analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for(let i=0; i<dataArray.length;i++) sum += dataArray[i];
                        const avg = sum / dataArray.length;
                        if(avg > 90 && !clapping) {
                            clapping = true;
                            onClap();
                            setTimeout(()=> {clapping = false}, 200); 
                        }
                        window._clapDetectorFrame = requestAnimationFrame(detect);
                    };
                    isMicListening = true;
                    detect();
                } catch(e) {
                    console.warn("Mic not available", e);
                }
            };
            
            const stopMic = () => {
                isMicListening = false;
                if(window._clapDetectorFrame) cancelAnimationFrame(window._clapDetectorFrame);
                if(micStream) micStream.getTracks().forEach(t=>t.stop());
            };
            window.stopLevel5Mic = stopMic;

            // TUTORIAL
            const tutSteps = [
                { emoji: '👋', text: currentLanguage === 'zh' ? '你好！今天我们来跟着儿歌拍手！' : 'Hi! Today we will clap along with songs!' },
                { emoji: '🎵', text: currentLanguage === 'zh' ? '仔细听，在每一下稳定的节拍上拍手。' : 'Listen closely, and clap on every steady beat.' },
                { emoji: '🌟', text: currentLanguage === 'zh' ? '当星星闪烁时，就是拍手的时候！' : 'When the star flashes, it means it is time to clap!' }
            ];

            btnStartTut.onclick = async () => {
                await initSynth();
                btnStartTut.style.display = 'none';
                tutStage.style.display = 'flex';
                
                let step = 0;
                const runStep = () => {
                    const tutText = document.getElementById('v5-tut-text');
                    const birdie = document.getElementById('v5-tut-birdie');
                    if (step < tutSteps.length) {
                        const ts = tutSteps[step];
                        tutText.innerText = ts.text;
                        SoundService.playSuccess();
                        birdie.style.transform = 'translateY(-20px)';
                        setTimeout(() => birdie.style.transform = '', 300);
                        SpeechService.speak(ts.text, currentLanguage, () => {
                            step++;
                            window._sightTimeouts.push(setTimeout(runStep, 800));
                        });
                    } else {
                        btnPracticeBtn.style.display = 'inline-block';
                        document.getElementById('v5-tut-cards').style.display = 'flex';
                        tutText.innerText = currentLanguage==='zh'?'准备好了吗？去试试吧！':'Ready? Practice Time!';
                        SpeechService.speak(currentLanguage==='zh'?'准备好了吗？去试试吧！':'Ready? Practice Time!');
                    }
                };
                runStep();
            };

            btnPracticeBtn.onclick = async () => {
                await initSynth();
                stopAllMusic();
                tutArea.style.display = 'none';
                pracArea.style.display = 'flex';
            };

            // PRACTICE
            const playSong = async (songId, visualizerCallback, onEnd) => {
                await initSynth();
                stopAllMusic();
                const song = SONGS[songId];
                currentBpm = song.bpm;
                const bpm = song.bpm;
                
                const startTimeOffset = 0.2;
                musicStartTime = audioCtx.currentTime + startTimeOffset;
                
                song.notes.forEach((noteData) => {
                    const sec = timeToSeconds(noteData.time, bpm);
                    const durSec = durToSeconds(noteData.dur, bpm);
                    const freq = noteToFreq(noteData.note);
                    
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    
                    osc.type = "sine";
                    osc.frequency.value = freq;
                    
                    const t = musicStartTime + sec;
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.5, t + Math.min(0.05, durSec * 0.1));
                    gain.gain.setValueAtTime(0.5, t + durSec - Math.min(0.1, durSec * 0.1));
                    gain.gain.linearRampToValueAtTime(0, t + durSec);
                    
                    osc.start(t);
                    osc.stop(t + durSec);
                    currentOscillators.push(osc);
                });

                song.beats.forEach((bTime) => {
                    const sec = timeToSeconds(bTime, bpm);
                    const delayMs = (startTimeOffset + sec) * 1000;
                    
                    let tid = setTimeout(() => {
                        visualizerCallback(sec, bTime);
                    }, delayMs);
                    currentTimeouts.push(tid);
                });
                
                let lengthParts = song.beats[song.beats.length-1].split(':');
                let durMs = (((parseInt(lengthParts[0]) * 4) + parseInt(lengthParts[1]) + 1) * (60/song.bpm) * 1000) + 1500;
                let endTid = setTimeout(() => {
                    if(onEnd) onEnd();
                }, durMs + startTimeOffset * 1000);
                currentTimeouts.push(endTid);
            };

            const fireworkEffect = (parent) => {
                for(let i=0; i<8; i++){
                    let f = document.createElement('div');
                    f.style.position='absolute'; f.style.width='10px'; f.style.height='10px';
                    f.style.background='#FCD34D'; f.style.borderRadius='50%';
                    f.style.top='50%'; f.style.left='50%';
                    parent.appendChild(f);
                    let angle = (i/8)*Math.PI*2;
                    let tx = Math.cos(angle)*60; let ty = Math.sin(angle)*60;
                    f.animate([
                        {transform:'translate(-50%,-50%) scale(1)', opacity:1},
                        {transform:`translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(0)`, opacity:0}
                    ], {duration:600, easing:'ease-out'});
                    setTimeout(()=>f.remove(), 600);
                }
            };
            
            let pracScore = 0;

            const handlePracClap = () => {
                playNote(400, 0.1); 
                const pracPad = document.getElementById('v5-prac-tap-pad');
                pracPad.style.transform = 'scale(0.9)';
                setTimeout(()=>pracPad.style.transform='', 100);

                const nowSec = audioCtx.currentTime - musicStartTime;
                const beatSec = timeToSeconds(lastBeatTimeStr, currentBpm);
                
                if(musicStartTime > 0 && Math.abs(nowSec - beatSec) < 0.4) {
                    const bBall = document.getElementById('v5-prac-ball');
                    fireworkEffect(bBall.parentElement);
                    bBall.style.background = '#4ADE80';
                    bBall.style.boxShadow = '0 0 20px #4ADE80';
                    document.getElementById('v5-prac-birdie').innerText = '🤩';
                    
                    const fb = document.getElementById('v5-prac-feedback');
                    fb.innerText = 'PERFECT! 🎉';
                    fb.style.color = '#4ADE80';
                    fb.style.opacity = '1';
                    pracScore++;
                    setTimeout(()=>fb.style.opacity='0', 500);
                }
            };

            document.getElementById('v5-prac-tap-pad').addEventListener('pointerdown', handlePracClap);
            
            document.querySelectorAll('.v5-prac-song-btn').forEach(btn => {
                btn.onclick = () => {
                    const sid = btn.dataset.song;
                    const sd = SONGS[sid];
                    document.getElementById('v5-prac-lyric').innerText = sd.name;
                    document.getElementById('v5-prac-birdie').innerText = '🎶';
                    const ra = document.getElementById('v5-prac-rhythm-area');
                    
                    ra.innerHTML = '<div id="v5-prac-ball" style="position:absolute; width:40px; height:40px; background:#FCD34D; border-radius:50%; box-shadow:0 0 15px #FCD34D; z-index:20; bottom:0; transition:left 0.1s linear;"></div>';
                    const ball = document.getElementById('v5-prac-ball');
                    
                    for(let i=0; i<sd.beats.length; i++){
                        let s = document.createElement('div');
                        s.innerText = '⭐'; s.style.fontSize='30px'; 
                        s.style.opacity='0.3'; s.style.transition='all 0.2s';
                        s.style.position = 'absolute';
                        s.style.left = (i/(sd.beats.length-1)*100) + '%';
                        s.style.transform = 'translateX(-50%)';
                        s.style.bottom = '30px';
                        s.id = 'prac-star-'+i;
                        ra.appendChild(s);
                    }
                    
                    startMic(handlePracClap);
                    
                    let beatIdx = 0;
                    playSong(sid, (time, bTime) => {
                        lastBeatTimeStr = bTime;
                        const st = document.getElementById('prac-star-'+beatIdx);
                        if(st){
                            st.style.opacity = '1';
                            st.style.transform = 'translateX(-50%) scale(1.5)';
                            setTimeout(()=> {
                                if(st) { st.style.opacity='0.5'; st.style.transform='translateX(-50%) scale(1)'; }
                            }, 300);
                        }
                        
                        ball.style.background = '#FCD34D'; 
                        ball.style.boxShadow = '0 0 15px #FCD34D';
                        ball.style.left = (beatIdx/(sd.beats.length-1)*100) + '%';
                        ball.animate([ {bottom:'0px'}, {bottom:'40px'}, {bottom:'0px'} ], {duration: 60000/sd.bpm, easing:'ease-in-out'});
                        
                        beatIdx++;
                    }, () => {
                        stopMic();
                        btnMinigame.style.display = 'inline-block';
                        const fb = document.getElementById('v5-prac-feedback');
                        fb.innerText = currentLanguage==='zh'?`你拍中了 ${pracScore} 次！`:`You scored ${pracScore} claps!`;
                        fb.style.opacity = '1';
                        pracScore = 0;
                    });
                }
            });

            // MINI GAME
            btnMinigame.onclick = () => {
                stopAllMusic(); stopMic();
                pracArea.style.display = 'none';
                mgArea.style.display = 'flex';
            };

            let mgScore = 0;
            const handleMgClap = () => {
                playNote(500, 0.1); 
                const pad = document.getElementById('v5-mg-tap-pad');
                pad.style.transform = 'scale(0.9)'; setTimeout(()=>pad.style.transform='', 100);

                const nowSec = audioCtx.currentTime - musicStartTime;
                const beatSec = timeToSeconds(lastBeatTimeStr, currentBpm);
                
                if(musicStartTime > 0 && Math.abs(nowSec - beatSec) < 0.4) {
                    mgScore++;
                    const cond = document.getElementById('v5-mg-conductor');
                    cond.innerText = '🦁👍'; setTimeout(()=>cond.innerText='🦁', 400);
                    cond.style.transform = 'translateY(-20px)'; setTimeout(()=>cond.style.transform='', 200);
                    
                    const bar = document.getElementById('v5-mg-progress-bar');
                    let targetSc = 10;
                    let pct = Math.min((mgScore/targetSc)*100, 100);
                    bar.style.width = pct + '%';
                    
                    if(pct >= 100) {
                        createConfetti();
                        document.getElementById('v5-mg-bubble').innerText = currentLanguage==='zh'?'太棒了！你是节奏大师！':'Amazing! You are a Rhythm Master!';
                        SoundService.playSuccess();
                        stopAllMusic();
                    }
                } else {
                    const cond = document.getElementById('v5-mg-conductor');
                    cond.innerText = '🦁❌'; setTimeout(()=>cond.innerText='🦁', 400);
                }
            };
            
            document.getElementById('v5-mg-tap-pad').addEventListener('pointerdown', handleMgClap);

            document.querySelectorAll('.v5-mg-song-btn').forEach(btn => {
                btn.onclick = () => {
                    const sid = btn.dataset.song;
                    const sd = SONGS[sid];
                    document.getElementById('v5-mg-lyric').innerText = sd.name;
                    mgScore = 0;
                    document.getElementById('v5-mg-progress-bar').style.width = '0%';
                    document.getElementById('v5-mg-bubble').innerText = currentLanguage==='zh'?'准备...拍！':'Ready... CLAP!';
                    
                    startMic(handleMgClap);
                    
                    const actionsBox = document.getElementById('v5-mg-action-icons');
                    actionsBox.innerHTML = '';
                    
                    playSong(sid, (time, bTime) => {
                        lastBeatTimeStr = bTime;
                        const cond = document.getElementById('v5-mg-conductor');
                        cond.style.transform = 'scale(1.1)'; setTimeout(()=>cond.style.transform='', 200);
                        
                        if(sd.actions && sd.actions[bTime]){
                            cond.innerText = '🦁👏';
                            let ai = document.createElement('div');
                            ai.innerText = '👏 CLAP!'; ai.style.fontSize='30px'; ai.style.fontWeight='bold'; ai.style.color='#FF5722';
                            actionsBox.innerHTML = ''; actionsBox.appendChild(ai);
                            ai.animate([{transform:'scale(0)'},{transform:'scale(1.2)'},{transform:'scale(1)'}], {duration:300});
                        } else {
                            cond.innerText = '🦁';
                            actionsBox.innerHTML = '';
                        }
                    }, () => { stopMic(); });
                }
            });
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

// Global cleanup for Sight Singing state
window._sightInterval = null;
window._sightTimeouts = [];

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
