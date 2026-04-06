/**
 * Memory Whitening System - main.js
 * Narrative Integration: "Whiteing Day" by USER
 */

// --- Audio Manager (Refined for Chapter-specific Sounds) ---
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

    // --- Chapter 1 & 2: Shakin / Pure-ish ---
    playShakin() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3000, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
    }

    playPureish() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, t);
        osc.frequency.exponentialRampToValueAtTime(4000, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.05);
    }

    // --- Chapter 4: Nucha / Gucha (Flesh/Bone Grinding) ---
    playNucha() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        
        // Low frequency squelch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.2);
        
        // Low pass filter to make it "wet"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(t + 0.2);
    }

    playGucha() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        
        // High frequency bone cracking (noise)
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.Q.setValueAtTime(10, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    }

    // Standard sounds
    playClick() { if (this.enabled) this.playShakin(); }
    playSwipe() {
        if (!this.enabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1000, t + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.2);
    }
    playLock() { if (this.enabled) this.playShakin(); }
    playError() { if (this.enabled) this.playNucha(); }
}

const audio = new AudioManager();

// --- State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "不透明な社会的ノイズ",
    stage: 0,
    targetCount: 0,
    activeChatTimers: []
};

// --- Initialization ---
async function fetchLatestNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        state.latestNews = data.items[0].title.split(' - ')[0];
        
        const container = document.getElementById('notif-container');
        container.innerHTML = `
            <div class="notification" onmousedown="handleSwipeStart(event, this)">
                <div class="notif-header"><div class="notif-icon">🌍</div><span class="notif-tag">News</span></div>
                <div class="notif-body">${state.latestNews}</div>
            </div>
            <div class="notification" onmousedown="handleSwipeStart(event, this)">
                <div class="notif-header"><div class="notif-icon">🛡️</div><span class="notif-tag">System</span></div>
                <div class="notif-body">未処理の記垢（きこう）が蓄積しています。</div>
            </div>
        `;
    } catch (e) {
        state.latestNews = "未定義の社会不安";
        document.getElementById('loading-notif').querySelector('.notif-body').innerText = "オフラインモード：← スワイプして消去";
    }
}

// Fixed time at startup: 03:14
function updateClocks() {
    const now = new Date();
    const fullTimeStr = now.toLocaleTimeString('ja-JP', { hour12: false });
    const dateStr = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });

    // Lock screen clock is fixed at 03:14 initially in HTML
    // PC clock is real-time
    if (document.getElementById('phone-date')) document.getElementById('phone-date').innerText = dateStr;
    if (document.getElementById('pc-clock')) document.getElementById('pc-clock').innerText = fullTimeStr;
}

setInterval(updateClocks, 1000);
updateClocks();
fetchLatestNews();

// --- Smartphone Interaction ---
let startX = 0;
let removedNotifs = 0;

function handleSwipeStart(e, el) {
    audio.init();
    startX = e.clientX;
    const initialTransform = 0;
    
    const moveHandler = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        el.style.transform = `translateX(${deltaX}px)`;
        el.style.opacity = 1 - Math.abs(deltaX / 300);
    };

    const upHandler = (upEvent) => {
        const deltaX = upEvent.clientX - startX;
        if (Math.abs(deltaX) > 120) {
            el.style.transform = deltaX < 0 ? "translateX(-200%)" : "translateX(200%)";
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

document.addEventListener('touchstart', (e) => {
    audio.init();
    if (e.target.closest('.notification')) {
        const el = e.target.closest('.notification');
        startX = e.touches[0].clientX;
        const moveHandler = (moveEvent) => {
            const deltaX = moveEvent.touches[0].clientX - startX;
            el.style.transform = `translateX(${deltaX}px)`;
            el.style.opacity = 1 - Math.abs(deltaX / 300);
        };
        const endHandler = (endEvent) => {
            const deltaX = endEvent.changedTouches[0].clientX - startX;
            if (Math.abs(deltaX) > 100) {
                el.style.transform = deltaX < 0 ? "translateX(-200%)" : "translateX(200%)";
                el.style.opacity = "0";
                audio.playSwipe();
                setTimeout(() => {
                    el.remove();
                    removedNotifs++;
                    if (removedNotifs >= 2) document.getElementById('auth-area').classList.remove('hidden');
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
    if (!state.pName || !state.pFood) return;

    audio.playLock();
    // Background Whiteflash effect simulation via overlay
    const overlay = document.getElementById('overlay');
    overlay.style.transition = 'opacity 0.2s';
    overlay.style.opacity = 1;

    setTimeout(() => {
        document.getElementById('phone-screen').classList.add('hidden');
        document.getElementById('pc-screen').style.display = "flex";
        overlay.style.opacity = 0;
        startWork();
    }, 400);
}

// --- Professional Terminal (PC) Logic ---
async function startWork() {
    renderStage();
}

const scenarios = [
    {
        id: "A-102",
        text: "案件：A-102（他個体）\n脳表に強固な記垢を確認。\n対象：<span class='kikou' onclick='polish(this)'>失恋の痛み</span>、<span class='kikou' onclick='polish(this)'>他人への劣等感</span>",
        mono: "（……あぁ、これ。みんな同じようなことで記垢を溜める。不潔だなぁ。さっさと削って白くしよう。白くなれば、全部なかったことになるのに。）",
        chat: ["お疲れさま。A-102、無難なところからだね。", "あぁ、やっぱり他人への劣等感か。不清潔の極みだ。"]
    },
    {
        id: "P-882",
        text: "案件：P-882（外部流入）\n社会ステインの癒着。社会的ノイズの除去。\n対象：<span class='kikou' onclick='polish(this)'>${news}</span>",
        mono: "（……あ、これさっきスマホの通知で消したやつだ。結局、仕事でも消さなきゃいけないのか。社会のノイズ。自分とは無関係な、誰かの不幸。）",
        chat: ["ニュース、さっき消したやつでしょ？", "情報の鮮度が速すぎて、掃除も追いつかないよ。"]
    },
    {
        id: "BIO-CHECK",
        text: "案件：BIO-CHECK\n感覚情報の整合性確認。\n対象：<span class='kikou' onclick='polish(this)'>${food}の匂い</span>、<span class='kikou' onclick='polish(this)'>${food}の食感</span>",
        mono: "（……え？ なぜこれが研磨対象になっているんだ。これは、僕の。指が氷のように冷たい。キーボードを叩く音すら、水の中にいるように遠く響く。）",
        chat: ["……返信がないね。", "大丈夫ですか？ 聞こえますか？"]
    }
];

async function renderStage() {
    state.activeChatTimers.forEach(clearTimeout);
    state.activeChatTimers = [];
    document.getElementById('chat-log').innerHTML = "";

    const scenario = scenarios[Math.min(state.stage, scenarios.length - 1)];
    const consoleBox = document.getElementById('console');
    const monoBox = document.getElementById('monologue');
    document.getElementById('case-id').innerText = scenario.id;

    let content = scenario.text.replace("${news}", state.latestNews).replace(/\${food}/g, state.pFood);
    consoleBox.innerHTML = content;
    monoBox.innerHTML = scenario.mono.replace(/\${food}/g, state.pFood);
    
    state.targetCount = consoleBox.querySelectorAll('.kikou').length;
    document.getElementById('btn-next').disabled = true;

    scenario.chat.forEach((msg, i) => {
        const t = setTimeout(() => pushChat("サトウ", msg), (i + 1) * 3000);
        state.activeChatTimers.push(t);
    });
}

function polish(el) {
    if(el.classList.contains('polished')) return;
    
    if (state.stage < 2) {
        audio.playShakin();
    } else {
        audio.playNucha();
        audio.playGucha();
        bleed();
    }
    
    el.classList.add('polished');
    state.targetCount--;

    if(state.targetCount === 0) {
        const btn = document.getElementById('btn-next');
        btn.disabled = false;
        btn.innerText = state.stage === 2 ? "浄化完了：全削除" : "研磨完了：次の層へ";
    }
}

function bleed() {
    const area = document.getElementById('work-area');
    const leak = document.createElement('div');
    leak.className = 'blood-leak';
    leak.style.left = Math.random() * 80 + 10 + "%";
    leak.style.top = "0";
    leak.style.width = "20px";
    leak.style.height = "100%";
    leak.style.opacity = "0.8";
    area.appendChild(leak);
    leak.animate([{ height: '0%' }, { height: '100%' }], { duration: 1500, easing: 'ease-in' });
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

async function finalize() {
    document.getElementById('btn-next').classList.add('hidden');
    const consoleBox = document.getElementById('console');
    const monoBox = document.getElementById('monologue');
    consoleBox.innerHTML = "";
    
    const finalScript = `[警告：意識のホワイトニング完了]\n\n${new Date().toLocaleTimeString()}：周りの声で目が覚めた。\n「大丈夫ですか！」「聞こえますか！」\nそうか、また寝袋で寝てしまったのか。\n指先が氷みたいに冷たい。感覚がない。\n\nスマホの画面には、死ぬまで見ていたニュース。\n「${state.latestNews}」\nアスファルトに転がる、${state.pName}さんが落とした${state.pFood}。\n\n僕の人生という名の記垢は、今、すべて綺麗に削り取られた。\n\n時刻、〇時〇分。ホワイトニング（死亡）を確認。`;

    let i = 0;
    function type() {
        if (i < finalScript.length) {
            consoleBox.innerHTML += finalScript.charAt(i);
            i++;
            setTimeout(type, 40);
        } else {
            monoBox.innerHTML = "（……あぁ、やっと。私は、清潔になれた。）";
            setTimeout(() => {
                const finalScreen = document.getElementById('final-purified');
                finalScreen.classList.remove('hidden');
                finalScreen.style.opacity = 1;
            }, 3000);
        }
    }
    type();
}

window.login = login;
window.polish = polish;
window.nextStage = nextStage;
window.handleSwipeStart = handleSwipeStart;
