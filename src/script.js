/**
 * Little Maestro - Music for Kids
 * Vanilla JavaScript Logic
 */

// --- STATE MANAGEMENT ---
let currentScore = {
    pitch: 0,
    rhythm: 0
};

let audioCtx = null;
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

    // Mascot logic for Theory Page
    if (pageId === 'theory-page') {
        const messages = [
            "Ready to discover the magic of music?",
            "Which adventure should we start today?",
            "I love learning new notes with you!",
            "You're becoming a real Little Maestro!"
        ];
        const bubble = document.querySelector('.bubble');
        if (bubble) {
            bubble.innerText = messages[Math.floor(Math.random() * messages.length)];
        }
    }

    // Stop metronome if navigating away from sight singing
    if (pageId !== 'sight-singing') {
        stopMetronome();
    }

    // Initialize Audio Context on first interaction
    if (!audioCtx) {
        initAudio();
    }
}

// --- AUDIO ENGINE (Web Audio API) ---
function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API not supported", e);
    }
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
    if (!audioCtx) initAudio();
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
        alert("Please select a song first!");
        return;
    }

    isPracticeMode = true;
    songStep = 0;
    currentSong = song;
    document.getElementById('piano-instructions').innerText = "Follow the yellow keys!";
    showNextGuide();
}

function stopPractice() {
    isPracticeMode = false;
    document.querySelectorAll('.key').forEach(k => k.classList.remove('guide'));
    document.getElementById('piano-instructions').innerText = "Click the keys to play!";
}

function showNextGuide() {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('guide'));
    if (songStep < currentSong.length) {
        const nextNote = currentSong[songStep];
        const key = document.querySelector(`.key[data-note="${nextNote}"]`);
        if (key) key.classList.add('guide');
    } else {
        document.getElementById('piano-instructions').innerText = "🎉 You finished the song! Great job!";
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
        document.getElementById('pitch-feedback').innerText = "Which note was that?";
    };
}

function checkPitch(note) {
    if (!targetPitch) return;
    
    const feedback = document.getElementById('pitch-feedback');
    if (note === targetPitch) {
        feedback.innerText = "🌟 Correct! You're a star!";
        feedback.style.color = "var(--accent-green)";
        currentScore.pitch += 10;
        updateScores();
        targetPitch = null;
    } else {
        feedback.innerText = "❌ Try again! Listen closely.";
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
    document.getElementById('rhythm-feedback').innerText = "Listening...";
}

function playRhythm() {
    isListening = false;
    rhythmPattern.forEach((delay, i) => {
        setTimeout(() => {
            playNote(400, 0.1);
            if (i === rhythmPattern.length - 1) {
                isListening = true;
                document.getElementById('rhythm-feedback').innerText = "Your turn! Tap the drum!";
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
        feedback.innerText = "🥁 Great rhythm! Boom-clap!";
        feedback.style.color = "var(--accent-green)";
        currentScore.rhythm += 10;
        updateScores();
    } else {
        feedback.innerText = "🐢 A bit slow! Try again!";
        feedback.style.color = "var(--accent-orange)";
    }
}

// --- METRONOME ---
function toggleMetronome() {
    const btn = document.getElementById('metronome-toggle');
    if (isMetronomePlaying) {
        stopMetronome();
        btn.innerText = "Start Metronome";
    } else {
        startMetronome();
        btn.innerText = "Stop Metronome";
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
    document.getElementById('score-1').innerText = (scores[0]?.score || 0) + " points";
    document.getElementById('score-2').innerText = (scores[1]?.score || 0) + " points";
    document.getElementById('score-3').innerText = (scores[2]?.score || 0) + " points";
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
        mascotBubble.innerText = "You can do it! Go go go!";
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
    const messages = [
        "Ready to discover the magic of music?",
        "Which adventure should we start today?",
        "I love learning new notes with you!",
        "You're becoming a real Little Maestro!"
    ];
    const bubble = document.querySelector('.bubble');
    if (bubble) {
        bubble.innerText = messages[Math.floor(Math.random() * messages.length)];
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
        <h3>Match the Note!</h3>
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
        feedback.innerText = "🌟 Perfect Match!";
        updateStars('story');
        setTimeout(closeMiniGame, 1500);
    } else {
        feedback.innerText = "❌ Try another one!";
        playNote(100, 0.2);
    }
};

// 2. Note Ladders: Scale Up
function setupLadderGame(stage, feedback) {
    const steps = ['C', 'D', 'E'];
    let currentStep = 0;
    
    stage.innerHTML = `
        <h3>Climb the Ladder!</h3>
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
                    feedback.innerText = "🪜 You reached the top!";
                    updateStars('ladder');
                    setTimeout(closeMiniGame, 1500);
                }
            } else {
                feedback.innerText = "Oops! Start from the bottom.";
            }
        };
    });
}

// 3. Secret Signs: Symbol Hunt
function setupSignsGame(stage, feedback) {
    const symbols = [
        { icon: '𝄞', name: 'G-Clef' },
        { icon: '𝄢', name: 'F-Clef' },
        { icon: '🎵', name: 'Notes' }
    ];
    const target = symbols[0];
    
    stage.innerHTML = `
        <h3>Find the ${target.name}!</h3>
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
        feedback.innerText = "✨ You found the magic sign!";
        updateStars('signs');
        setTimeout(closeMiniGame, 1500);
    } else {
        feedback.innerText = "Not that one! Look again.";
    }
};

// 4. Star Quest: Speed Tap
function setupQuestGame(stage, feedback) {
    let taps = 0;
    const goal = 5;
    
    stage.innerHTML = `
        <h3>Tap the Star 5 times!</h3>
        <button id="quest-star" class="drum-pad" style="width:120px; height:120px; font-size:3rem;">⭐</button>
        <p>Taps: <span id="quest-count">0</span></p>
    `;

    const star = document.getElementById('quest-star');
    star.onpointerdown = (e) => {
        e.preventDefault();
        taps++;
        playNote(1000 + (taps * 100), 0.1);
        document.getElementById('quest-count').innerText = taps;
        star.style.transform = `scale(${1 + taps * 0.1})`;
        
        if (taps === goal) {
            feedback.innerText = "🏆 Quest Complete!";
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
    { type: 'clap', icon: '👏', color: 'clap-star', key: 'c', label: 'CLAP' },
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
    document.getElementById('start-star-game-btn').style.display = 'block';
    document.getElementById('start-star-game-btn').innerText = 'Play Again!';
    
    const finalScore = starGameState.score;
    alert(`Game Over! Final Score: ${finalScore}`);
    saveScore(finalScore);
}

// --- INITIALIZATION ---
window.onload = () => {
    setupPiano();
    setupPitchGame();
    setupRhythmGame();
    initStarGame();
    displayTrophies();
    
    document.getElementById('metronome-toggle').onclick = toggleMetronome;
};
window.navigateTo = navigateTo;
window.startMiniGame = startMiniGame;
window.resetScores = resetScores;
window.closeMiniGame = closeMiniGame;
window.stopStarGame = stopStarGame;
