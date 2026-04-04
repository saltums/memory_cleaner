// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "未定義の社会的ノイズ",
    stage: 0,
    phase: 1, // 1: 当日(Portal), 2: 翌日(Brain)
    targetsToClean: 0,
    currentIntensity: 0,
    activeChatTimers: [],
    chipsCleared: 0
};

const UI = {
    screens: {
        setup: document.getElementById('ui-setup'),
        work: document.getElementById('ui-work'),
        day2: document.getElementById('ui-day2')
    },
    console: document.getElementById('console'),
    monologue: document.getElementById('monologue'),
    chatLog: document.getElementById('chat-log'),
    btnNext: document.getElementById('btn-next'),
    startBtn: document.getElementById('start-btn'),
    newsLoader: document.getElementById('news-loader'),
    clock: document.getElementById('clock'),
    container: document.getElementById('container'),
    brain: document.getElementById('brain'),
    statusDay2: document.getElementById('status-day2'),
    overlayMsg: document.getElementById('overlay-msg')
};

// --- Initialization ---
if (!state.apiKey) {
    console.warn("No API Key. Demo Mode enabled.");
    state.isDemoMode = true;
}

async function initNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        state.latestNews = data.items[0].title.split(' - ')[0];
        if (UI.newsLoader) UI.newsLoader.innerText = `【同期完了】最新の汚染源：${state.latestNews}`;
    } catch (e) {
        state.latestNews = "未定義の社会不安";
        if (UI.newsLoader) UI.newsLoader.innerText = "【同期失敗】オフラインモード";
    } finally {
        if (UI.startBtn) UI.startBtn.disabled = false;
    }
}
initNews();

// --- Lifecycle ---
function startWork() {
    state.pName = document.getElementById('p-name').value || "未定義職員";
    state.pFood = document.getElementById('p-food').value || "規定の栄養剤";

    UI.screens.setup.classList.add('hidden');
    UI.screens.work.classList.remove('hidden');
    
    setInterval(() => {
        UI.clock.innerText = new Date().toLocaleTimeString();
    }, 1000);

    renderStage();
}

async function renderStage() {
    UI.btnNext.disabled = true;
    UI.btnNext.innerText = "漂白未完了";
    UI.btnNext.style.background = "#e2e8f0";

    UI.console.innerHTML = '<span style="color: #94a3b8;">案件データをロード中...</span>';
    UI.monologue.innerHTML = "";

    state.activeChatTimers.forEach(clearTimeout);
    state.activeChatTimers = [];

    const caseData = await generateCaseData();
    
    UI.console.innerHTML = `[案件：${caseData.title}]\n${caseData.detail}`;
    UI.monologue.innerHTML = caseData.monologue;
    
    state.targetsToClean = UI.console.querySelectorAll('.target-word').length;

    caseData.chat.forEach((msg, i) => {
        const timer = setTimeout(() => {
            pushChat("サトウ", msg);
        }, (i + 1) * 3500);
        state.activeChatTimers.push(timer);
    });
}

// --- Content Generation ---
async function generateCaseData() {
    const titles = ["G-102: 過去の電子記号", "A-405: 承認欲求の膿", "P-882: 最新汚染 [ニュース]", "P-883: 特定個体の好物記憶"];
    const currentTitle = titles[state.stage];

    if (state.isDemoMode) {
        // ... (Demo data remains same as previous version but fits current state)
        const demoData = [
            { title: titles[0], detail: "不衛生なカビ。対象：<span class='target-word' onclick='cleanWord(this)'>たまごっち</span>、<span class='target-word' onclick='cleanWord(this)'>ポケモン</span>", monologue: "（削って帰ろう。）", chat: ["黄ばんでるね。", "おにぎり最高。"] },
            { title: titles[1], detail: "対象：<span class='target-word' onclick='cleanWord(this)'>いいねの数</span>、<span class='target-word' onclick='cleanWord(this)'>過去のポエム</span>", monologue: "（ガリガリ削ろう。）", chat: ["何食べた？", "お腹空くよね。"] },
            { title: titles[2], detail: `対象：<span class='target-word' onclick='cleanWord(this)'>${state.latestNews}</span>`, monologue: `（[${state.pFood}] 最高。）`, chat: ["王道だ。", "外が騒がしい。"] },
            { title: titles[3], detail: `対象：<span class='target-word' onclick='cleanWord(this)'>${state.pFood}の匂い</span>`, monologue: "（……これ、僕の？）", chat: ["？", "返信して？"] }
        ];
        return demoData[state.stage];
    }

    const prompt = `{"title": "...", "detail": "... <span class='target-word' onclick='cleanWord(this)'>...</span> ...", "monologue": "...", "chat": ["...", "..."]} の形式で、記憶漂白システムの第${state.stage+1}段階（全4段階）の案件データを生成して。職員名:${state.pName}, ニュース:${state.latestNews}, 好物:${state.pFood}。徐々に不穏に。`;
    
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
        return generateCaseData();
    }
}

// --- Interactions ---
function cleanWord(el) {
    if (el.classList.contains('cleaned')) return;
    el.classList.add('cleaned');
    state.targetsToClean--;
    if (state.targetsToClean <= 0) {
        UI.btnNext.disabled = false;
        UI.btnNext.innerText = "漂白完了：次へ進む";
        UI.btnNext.style.background = "var(--accent-blue)";
    }
}

function advanceStage() {
    state.stage++;
    state.currentIntensity += 0.2;
    document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.currentIntensity})`;

    if (state.stage < 4) {
        renderStage();
    } else {
        triggerTwist();
    }
}

function pushChat(sender, message) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<div class='chat-sender'>${sender}</div>${message.replace("[${food}]", state.pFood)}`;
    UI.chatLog.appendChild(div);
    setTimeout(() => { div.style.opacity = 1; div.style.transform = "translateY(0)"; }, 50);
    UI.chatLog.scrollTop = UI.chatLog.scrollHeight;
}

// --- Phase 2 transition ---
async function triggerTwist() {
    UI.btnNext.classList.add('hidden');
    UI.console.innerHTML = "";
    UI.console.style.color = "#94a3b8";
    
    const twistText = `[致命的なエラー：外部接続の断絶]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。\n急ブレーキの音。世界がひっくり返り、アスファルトが空になる。\n\n${state.pName}さんが落とした${state.pFood}のおにぎりが、血にまみれて、真っ白に、光り輝いている。`;

    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < twistText.length) {
            UI.console.innerHTML += twistText.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            setTimeout(startPhase2, 3000);
        }
    }, 50);
}

async function startPhase2() {
    state.phase = 2;
    UI.screens.work.classList.add('hidden');
    UI.container.style.borderLeft = "none";
    UI.container.style.backgroundColor = "transparent";
    UI.container.style.boxShadow = "none";
    document.body.style.backgroundColor = "#f0f2f5";
    
    UI.screens.day2.classList.remove('hidden');
    UI.screens.day2.classList.add('active');

    const memories = await generateMemoryChips();
    state.targetsToClean = memories.length;

    memories.forEach((m, index) => {
        const chip = document.createElement('div');
        chip.className = 'memory-chip';
        chip.innerText = m.text;
        chip.style.backgroundColor = m.color || "#fff";
        chip.style.setProperty('--delay', `${Math.random() * 2}s`);
        
        chip.onclick = () => {
            if (chip.classList.contains('poof')) return;
            chip.classList.add('poof');
            state.targetsToClean--;
            updateStatusDay2(m.text);
            
            // 画面を段階的に白くする
            document.body.style.backgroundColor = `rgba(255, 255, 255, ${1 - (state.targetsToClean / memories.length)})`;

            if (state.targetsToClean === 0) finishEverything();
        };
        UI.brain.appendChild(chip);
    });
}

function updateStatusDay2(text) {
    UI.statusDay2.innerText = `「${text}」を消去しました...`;
    setTimeout(() => { if(state.targetsToClean > 0) UI.statusDay2.innerText = "残された記憶を選択してください"; }, 1200);
}

async function generateMemoryChips() {
    if (state.isDemoMode) {
        return [
            { text: "掃除のコツ", color: "#e7f5ff" },
            { text: "サトウの笑顔", color: "#fff0f6" },
            { text: `今朝の${state.pFood}`, color: "#fff9db" },
            { text: "急な衝撃", color: "#f1f3f5" },
            { text: "ブレーキの音", color: "#fff4e6" },
            { text: "業務マニュアル", color: "#e9fac8" },
            { text: "最後の清々しさ", color: "#f3f0ff" }
        ];
    }

    const prompt = `JSON配列形式で、死んだ職員 [${state.pName}] の脳内に残った「10個の記憶」を生成して。好物:${state.pFood}, ニュース:${state.latestNews}, 同僚サトウとの会話を含めて。
    形式: [{"text": "記憶の内容", "color": "薄いパステルカラーの16進数"}, ...]`;
    
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
        return generateMemoryChips();
    }
}

function finishEverything() {
    document.body.style.backgroundColor = "#fff";
    UI.screens.day2.style.opacity = "0";
    setTimeout(() => {
        UI.overlayMsg.classList.add('show');
    }, 2000);
}

// Export
window.startWork = startWork;
window.cleanWord = cleanWord;
window.advanceStage = advanceStage;
