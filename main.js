// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "未定義の社会的ノイズ",
    stage: 0,
    phase: 1, // 1: 第1章(Portal), 2: 第2章(Transition), 3: 第3章(Brain/Optimization)
    targetsToClean: 0,
    currentIntensity: 0,
    activeChatTimers: [],
    chipsCleared: 0,
    totalChips: 0
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
        if (UI.newsLoader) UI.newsLoader.innerText = `【分析完了】社会的ノイズ：${state.latestNews}`;
    } catch (e) {
        state.latestNews = "未定義の不和";
        if (UI.newsLoader) UI.newsLoader.innerText = "【同期失敗】オフラインモード";
    } finally {
        if (UI.startBtn) UI.startBtn.disabled = false;
    }
}
initNews();

// --- Chapter 1: The Last Cleaning ---
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
        }, (i + 1) * 4000);
        state.activeChatTimers.push(timer);
    });
}

async function generateCaseData() {
    const titles = ["G-102: 生活の澱（窓）", "A-405: 澱んだ空気（床）", "P-882: 外部のノイズ", "P-883: 有機的癒着"];
    const currentTitle = titles[state.stage];

    if (state.isDemoMode) {
        const demoData = [
            { title: titles[0], detail: "窓を拭くことは、世界との境界を清める儀式。対象：<span class='target-word' onclick='cleanWord(this)'>生活の澱</span>、<span class='target-word' onclick='cleanWord(this)'>溜まった埃</span>", monologue: "（掃除は、明日を迎えやすくするための儀式のようなものだ。）", chat: ["お疲れさま。窓、透明感が出てきたね。", "いつも助かるよ。"] },
            { title: titles[1], detail: "床を磨き、空間の「澱」を取り除きます。対象：<span class='target-word' onclick='cleanWord(this)'>古い執着</span>、<span class='target-word' onclick='cleanWord(this)'>磨き残し</span>", monologue: "（汚れを落とすことが目的じゃない。清々しさ、それこそが本質だ。）", chat: ["顧客が満足してる。君の腕は本物だよ。", "夕暮れが見えてきたね。"] },
            { title: titles[2], detail: `外部からの社会的ノイズ混入：<span class='target-word' onclick='cleanWord(this)'>${state.latestNews}</span>`, monologue: `（[${state.pFood}] を食べて、夕暮れの街へ出かけよう。）`, chat: ["今日は定時で上がれそうかな。", "外の信号、青が鮮やかだよ。"] },
            { title: titles[3], detail: `最終確認：<span class='target-word' onclick='cleanWord(this)'>${state.pFood}の味</span>、<span class='target-word' onclick='cleanWord(this)'>夕焼けの色</span>`, monologue: "（……？ この夕焼けの色、さっき見たのと、同じ……？）", chat: ["…………？", "返信がない。もう街へ踏み出したかな。"] }
        ];
        return demoData[state.stage];
    }

    const prompt = `JSON形式で、清掃員が顧客の家を掃除している「最後のお掃除」の第${state.stage+1}フェーズを生成して。職員名:${state.pName}, ニュース:${state.latestNews}, 好物:${state.pFood}。
    村田沙耶香風の冷徹で生理的な文体、生活を「澱（おり）」や「不衛生」と捉える視点を入れて。
    {"title": "...", "detail": "... <span class='target-word' onclick='cleanWord(this)'>...</span> ...", "monologue": "...", "chat": ["...", "..."]}`;
    
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

// --- Chapter 2: The Sudden Termination ---
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
    if (state.stage < 4) {
        state.currentIntensity += 0.2;
        document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.currentIntensity})`;
        renderStage();
    } else {
        triggerGlitch();
    }
}

function pushChat(sender, message) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<div class='chat-sender'>${sender}</div>${message}`;
    UI.chatLog.appendChild(div);
    setTimeout(() => { div.style.opacity = 1; div.style.transform = "translateY(0)"; }, 50);
    UI.chatLog.scrollTop = UI.chatLog.scrollHeight;
}

async function triggerGlitch() {
    state.phase = 2;
    UI.btnNext.classList.add('hidden');
    UI.container.classList.add('glitch');
    document.body.style.backgroundColor = "var(--sunset-orange)";
    
    const crashText = `[FATAL ERROR: CONNECTION LOST]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。\n[信号：緑] - [運命の歯車：停止]\n激しい衝撃。デジタル・ノイズ。遠のく意識。\n\n視界には、最後に見た夕焼けのオレンジ色だけが焼き付いている。\n\nシステムを再起動しています... \n強制最適化モードへ移行します。`;

    UI.console.innerHTML = "";
    UI.console.style.color = "#fff";
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < crashText.length) {
            UI.console.innerHTML += crashText.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            setTimeout(startPhase3, 3500);
        }
    }, 40);
}

// --- Chapter 3: Internal Memory Optimization ---
async function startPhase3() {
    state.phase = 3;
    UI.screens.work.classList.add('hidden');
    UI.container.classList.remove('glitch');
    UI.container.style.borderLeft = "none";
    UI.container.style.backgroundColor = "transparent";
    UI.container.style.boxShadow = "none";
    document.body.style.backgroundColor = "#fafafa"; // 少し青みがかったメンテナンス白
    
    UI.screens.day2.classList.remove('hidden');
    UI.screens.day2.classList.add('active');

    const memories = await generateDiagnosticChips();
    state.totalChips = memories.length;
    state.chipsCleared = 0;

    memories.forEach((m, index) => {
        const chip = document.createElement('div');
        chip.className = 'memory-chip';
        chip.innerText = m.text;
        chip.style.setProperty('--delay', `${Math.random() * 2}s`);
        
        // Final chip logic: Must be the last one
        if (m.isFinal) chip.id = "final-chip";

        chip.onclick = () => {
            if (chip.classList.contains('poof')) return;
            
            // Final chip can only be clicked if it's the last one
            if (m.isFinal && state.chipsCleared < state.totalChips - 1) {
                UI.statusDay2.innerText = "この項目は現在アクセスできません（依存関係あり）";
                return;
            }

            chip.classList.add('poof');
            state.chipsCleared++;
            updateStatusPhase3(m.text, m.isFinal);
            
            // Gradual whiteout
            document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.chipsCleared / state.totalChips})`;

            if (m.isFinal) finishNarrative();
        };
        UI.brain.appendChild(chip);
    });
}

function updateStatusPhase3(text, isFinal) {
    if (isFinal) {
        UI.statusDay2.innerText = "無 への回帰中...";
    } else {
        UI.statusDay2.innerText = `内部記録： [${text}] の最適化を完了しました。`;
        setTimeout(() => { if(state.chipsCleared < state.totalChips - 1) UI.statusDay2.innerText = "次のメモリセクターを選択してください"; }, 1500);
    }
}

async function generateDiagnosticChips() {
    const fixedMemories = [
        { text: "掃除のコツ", isFinal: false },
        { text: "業務マニュアル", isFinal: false },
        { text: "窓の透明感", isFinal: false },
        { text: "顧客の笑顔", isFinal: false },
        { text: `今朝の${state.pFood}`, isFinal: false },
        { text: "昨日の夕焼け", isFinal: false },
        { text: "激しい衝撃（エラーログ）", isFinal: false },
        { text: "掃除した後の、あの清々しさ", isFinal: true }
    ];

    if (state.isDemoMode) return fixedMemories;

    const prompt = `JSON形式で、[${state.pName}] の脳内の「内部メモリ最適化チップ」を10個生成して。
    - 前半は「業務（掃除、マニュアル）」
    - 中盤は「私的（好物、夕焼け、サトウの会話）」
    - 終盤は「違和感（衝撃、オレンジの光）」
    - 最後に必ず {"text": "掃除した後の、あの清々しさ", "isFinal": true} を含めること。
    JSON配列のみを返して。`;
    
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
        return fixedMemories;
    }
}

function finishNarrative() {
    document.body.style.backgroundColor = "#fff";
    UI.screens.day2.style.opacity = "0";
    setTimeout(() => {
        UI.overlayMsg.classList.add('show');
    }, 2500);
}

// Export for direct HTML usage
window.startWork = startWork;
window.cleanWord = cleanWord;
window.advanceStage = advanceStage;
