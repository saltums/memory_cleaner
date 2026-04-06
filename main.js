/**
 * Memory Whitening System - main.js
 * Narrative/Interactive Interface with iOS-like Sound Engine
 */

// --- Audio Manager (Web Audio API Synthesizer) ---
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    // iOS-like Soft Click
    playClick() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // iOS-like Unlock/Lock Sound
    playLock() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.setValueAtTime(200, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.15);
    }

    // Swipe Notification Sound
    playSwipe() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.2);
    }

    // Polishing / Cleaning Sound
    playPolish() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(3000, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.05);
    }

    // Final Glitch/Error Sound
    playError() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.5);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.5);
    }
}

const audio = new AudioManager();

// --- Application Logic ---

let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "不透明な社会的ノイズ",
    stage: 0,
    targetCount: 0,
    isReversed: false,
    activeChatTimers: []
};

if (!state.apiKey) state.isDemoMode = true;

// --- 1. Init News & Clocks ---
async function fetchLatestNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        state.latestNews = data.items[0].title.split(' - ')[0];
        
        const container = document.getElementById('notif-container');
        container.innerHTML = `
            <div class="notification" onmousedown="handleSwipeStart(event, this)">
                <div class="notif-header"><div class="notif-icon">🌍</div><span class="notif-tag">NEWS</span></div>
                <div class="notif-body">${state.latestNews}</div>
            </div>
            <div class="notification" onmousedown="handleSwipeStart(event, this)">
                <div class="notif-header"><div class="notif-icon">🛡️</div><span class="notif-tag">SYSTEM</span></div>
                <div class="notif-body">未処理の記垢（きこう）が蓄積しています。</div>
            </div>
        `;
    } catch (e) {
        state.latestNews = "未定義の社会不安";
        document.getElementById('loading-notif').querySelector('.notif-body').innerText = "オフラインモード：画面をタップして開始";
    }
}

function updateClocks() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = now.toLocaleTimeString('ja-JP', { hour12: false });
    const dateStr = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });

    if (document.getElementById('clock')) document.getElementById('clock').innerText = timeStr;
    if (document.getElementById('phone-date')) document.getElementById('phone-date').innerText = dateStr;
    if (document.getElementById('pc-clock')) document.getElementById('pc-clock').innerText = fullTimeStr;
}

setInterval(updateClocks, 1000);
updateClocks();
fetchLatestNews();

// --- 2. Smartphone Interaction ---

let startX = 0;
let removedNotifs = 0;

function handleSwipeStart(e, el) {
    audio.init(); // Activate AudioContext on first touch
    startX = e.clientX;
    const initialTransform = 0;
    
    const moveHandler = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        if (deltaX < 0) {
            el.style.transform = `translateX(${deltaX}px)`;
            el.style.opacity = 1 + (deltaX / 300);
        }
    };

    const upHandler = (upEvent) => {
        const deltaX = upEvent.clientX - startX;
        if (deltaX < -150) {
            el.style.transform = "translateX(-200%)";
            el.style.opacity = "0";
            audio.playSwipe();
            setTimeout(() => {
                el.remove();
                removedNotifs++;
                if (removedNotifs >= 2) {
                    document.getElementById('auth-area').classList.remove('hidden');
                }
            }, 300);
        } else {
            el.style.transform = "translateX(0)";
            el.style.opacity = "1";
        }
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
}

// Mobile/Touch Support
document.addEventListener('touchstart', (e) => {
    audio.init();
    if (e.target.closest('.notification')) {
        const el = e.target.closest('.notification');
        startX = e.touches[0].clientX;
        
        const moveHandler = (moveEvent) => {
            const deltaX = moveEvent.touches[0].clientX - startX;
            if (deltaX < 0) {
                el.style.transform = `translateX(${deltaX}px)`;
                el.style.opacity = 1 + (deltaX / 300);
            }
        };

        const endHandler = (endEvent) => {
            const deltaX = endEvent.changedTouches[0].clientX - startX;
            if (deltaX < -100) {
                el.style.transform = "translateX(-200%)";
                el.style.opacity = "0";
                audio.playSwipe();
                setTimeout(() => {
                    el.remove();
                    removedNotifs++;
                    if (removedNotifs >= 2) {
                        document.getElementById('auth-area').classList.remove('hidden');
                    }
                }, 300);
            } else {
                el.style.transform = "translateX(0)";
                el.style.opacity = "1";
            }
            el.removeEventListener('touchmove', moveHandler);
            el.removeEventListener('touchend', endHandler);
        };

        el.addEventListener('touchmove', moveHandler);
        el.addEventListener('touchend', endHandler);
    }
});

function login() {
    state.pName = document.getElementById('p-name').value;
    state.pFood = document.getElementById('p-food').value;
    if (!state.pName || !state.pFood) {
        audio.playError();
        return;
    }

    audio.playLock();
    const phone = document.getElementById('phone-screen');
    phone.classList.add('zoom-out');
    
    setTimeout(() => {
        phone.classList.add('hidden');
        document.getElementById('pc-screen').style.display = "flex";
        startWork();
    }, 1000);
}

// --- 3. Professional Terminal (PC) Logic ---

async function startWork() {
    renderStage();
}

const scenarios = [
    {
        id: "A-102",
        text: "案件：A-102（他個体）\n脳表に強固な記垢（きこう）を確認。\n対象：<span class='kikou' onclick='polish(this)'>失恋の痛み</span>、<span class='kikou' onclick='polish(this)'>仮パクされたゲーム</span>",
        mono: "（……あぁ、これ。みんな同じようなことで記垢を溜める。不潔だなぁ。さっさと削って白くしよう。）",
        chat: ["お疲れさま。A-102入ったね。", "脳表の汚れ、結構ひどいみたいだよ。"]
    },
    {
        id: "P-882",
        text: "案件：P-882（外部流入）\n社会ステインの癒着。対象をホワイトニングしてください。\n対象：<span class='kikou' onclick='polish(this)'>${news}</span>",
        mono: "（……あ、これさっきスマホの通知で消したやつだ。結局、仕事でも消さなきゃいけないのか。……早く帰りたい。）",
        chat: ["ニュースのやつ、もうこっちに回ってきたよ。", "最近は情報の鮮度が速すぎて、掃除も追いつかないね。"]
    },
    {
        id: "BIO-CHECK",
        text: "案件：BIO-CHECK\n感覚情報の整合性確認。\n対象：<span class='kikou' onclick='polish(this)'>${food}の匂い</span>、<span class='kikou' onclick='polish(this)'>${food}の食感</span>",
        mono: "（……おかしいな。これ、僕がさっき食べた [${food}] と全く同じ匂いがする。……指先が冷たい。冷房、誰が下げたんだ。）",
        chat: ["あれ、返事ないね。", "……信号、ずっと赤のままだ。"]
    }
];

async function renderStage() {
    state.activeChatTimers.forEach(clearTimeout);
    state.activeChatTimers = [];
    document.getElementById('chat-log').innerHTML = "";

    const btn = document.getElementById('btn-next');
    btn.disabled = true;
    btn.innerText = "研磨未完了";

    let scenario;
    if (state.isDemoMode || state.stage >= scenarios.length) {
        scenario = scenarios[Math.min(state.stage, scenarios.length - 1)];
    } else {
        scenario = await generateAIScenario();
    }

    const consoleBox = document.getElementById('console');
    const monoBox = document.getElementById('monologue');
    document.getElementById('case-id').innerText = scenario.id;

    let content = scenario.text.replace("${news}", state.latestNews).replace(/\${food}/g, state.pFood);
    consoleBox.innerHTML = content;
    monoBox.innerHTML = scenario.mono.replace(/\${food}/g, state.pFood);
    
    state.targetCount = consoleBox.querySelectorAll('.kikou').length;

    scenario.chat.forEach((msg, i) => {
        const t = setTimeout(() => pushChat("サトウ", msg), (i + 1) * 3000);
        state.activeChatTimers.push(t);
    });
}

async function generateAIScenario() {
    const prompt = `JSON形式で、記垢剥離業務（記憶のお掃除）のシナリオを生成して。
    ステージ:${state.stage + 1}, 職員名:${state.pName}, ニュース:${state.latestNews}, 好物:${state.pFood}。
    村田沙耶香風の冷徹で生理的な文体。
    {"id": "...", "text": "... <span class='kikou' onclick='polish(this)'>...</span> ...", "mono": "...", "chat": ["...", "..."]}`;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        state.isDemoMode = true;
        return scenarios[state.stage];
    }
}

function polish(el) {
    if(el.classList.contains('polished')) return;
    
    audio.playPolish();
    
    if(state.stage === 2) {
        state.isReversed = true;
        el.style.background = "var(--blood-red)";
        el.style.color = "white";
        bleed();
    }

    el.classList.add('polished');
    state.targetCount--;

    if(state.targetCount === 0) {
        const btn = document.getElementById('btn-next');
        btn.disabled = false;
        btn.innerText = state.isReversed ? "研磨完了：全削除" : "研磨完了：次の層へ";
    }
}

function bleed() {
    const leak = document.createElement('div');
    leak.className = 'blood-leak';
    leak.style.left = Math.random() * 80 + 10 + "%";
    leak.style.top = "0";
    leak.style.width = "12px";
    leak.style.height = "100%";
    leak.style.opacity = "0.7";
    document.getElementById('work-area').appendChild(leak);
    
    // Slow drip animation
    leak.animate([
        { height: '0%' },
        { height: '100%' }
    ], { duration: 3000, easing: 'ease-in' });
}

function pushChat(sender, message) {
    const log = document.getElementById('chat-log');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<div class="chat-sender">${sender}</div>${message}`;
    log.appendChild(div);
    setTimeout(() => div.style.opacity = 1, 50);
    log.scrollTop = log.scrollHeight;
}

function nextStage() {
    state.stage++;
    audio.playClick();
    if(state.stage < 3) {
        renderStage();
    } else {
        finalize();
    }
}

// --- 4. Final Purified ---

async function finalize() {
    audio.playError();
    const consoleBox = document.getElementById('console');
    const monoBox = document.getElementById('monologue');
    document.getElementById('btn-next').classList.add('hidden');

    consoleBox.innerHTML = "";
    const finalScript = `[警告：意識のホワイトニング完了]\n\n${new Date().toLocaleTimeString()}：周りの声で目が覚めた。\n「大丈夫ですか！」「聞こえますか！」\nそうか、また寝袋で寝てしまったのか。\n指先が氷みたいに冷たい。感覚がない。\n\nスマホの画面には、死ぬまで見ていたニュース。\n「${state.latestNews}」\nアスファルトに転がる、${state.pName}さんが落とした${state.pFood}のおにぎり。\n\n僕の人生という名の記垢は、今、すべて綺麗に削り取られた。`;

    let i = 0;
    function type() {
        if (i < finalScript.length) {
            consoleBox.innerHTML += finalScript.charAt(i);
            i++;
            setTimeout(type, 50);
        } else {
            monoBox.innerHTML = "（……あぁ、そうか。掃除をしていたんじゃない。僕は、僕を消していたんだ。）";
            setTimeout(() => {
                document.getElementById('overlay').style.opacity = 1;
                setTimeout(() => {
                    document.getElementById('final-purified').classList.remove('hidden');
                    document.getElementById('final-purified').style.opacity = 1;
                }, 3000);
            }, 3000);
        }
    }
    type();
}

// Global Exports
window.login = login;
window.polish = polish;
window.nextStage = nextStage;
window.handleSwipeStart = handleSwipeStart;
