// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "未定義の社会的ノイズ",
    stage: 0,
    targetsToClean: 0,
    currentIntensity: 0,
    activeChatTimers: []
};

const UI = {
    screens: {
        setup: document.getElementById('ui-setup'),
        work: document.getElementById('ui-work')
    },
    console: document.getElementById('console'),
    monologue: document.getElementById('monologue'),
    chatLog: document.getElementById('chat-log'),
    btnNext: document.getElementById('btn-next'),
    startBtn: document.getElementById('start-btn'),
    newsLoader: document.getElementById('news-loader'),
    clock: document.getElementById('clock'),
    container: document.getElementById('container'),
    overlay: document.getElementById('overlay')
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
        UI.newsLoader.innerText = `【同期完了】最新の汚染源：${state.latestNews}`;
    } catch (e) {
        state.latestNews = "未定義の社会不安";
        UI.newsLoader.innerText = "【同期失敗】オフラインモード";
    } finally {
        UI.startBtn.disabled = false;
    }
}
initNews();

// --- Lifecycle ---
function startWork() {
    state.pName = document.getElementById('p-name').value || "未定義職員";
    state.pFood = document.getElementById('p-food').value || "規定の栄養剤";

    if (!state.pName || !state.pFood) {
        alert("職員名とおにぎりの具を入力してください。");
        return;
    }

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

    // Clear old chat timers
    state.activeChatTimers.forEach(clearTimeout);
    state.activeChatTimers = [];

    const caseData = await generateCaseData();
    
    // Display Console & Monologue
    UI.console.innerHTML = `[案件：${caseData.title}]\n${caseData.detail}`;
    UI.monologue.innerHTML = caseData.monologue;
    
    // Set Target Count
    state.targetsToClean = UI.console.querySelectorAll('.target-word').length;

    // Schedule Chat Messages
    caseData.chat.forEach((msg, i) => {
        const timer = setTimeout(() => {
            pushChat("サトウ", msg);
        }, (i + 1) * 3500);
        state.activeChatTimers.push(timer);
    });
}

// --- Content Generation (AI / Demo) ---
async function generateCaseData() {
    const titles = [
        "G-102: 過去の電子記号",
        "A-405: 承認欲求の膿",
        "P-882: 最新汚染 [ニュース]",
        "P-883: 特定個体の好物記憶"
    ];
    const currentTitle = titles[state.stage];

    if (state.isDemoMode) {
        const demoData = [
            {
                title: titles[0],
                detail: "懐かしさという名の不衛生なカビ。対象：<span class='target-word' onclick='cleanWord(this)'>たまごっち</span>、<span class='target-word' onclick='cleanWord(this)'>ポケモン</span>、<span class='target-word' onclick='cleanWord(this)'>赤外線通信</span>",
                monologue: "（あー、懐かしいね。でもこれ、ただのゴミへの執着。不衛生だなぁ。さっさと削って帰ろう。）",
                chat: ["お疲れー。今日の案件、結構黄ばんでるね。", "僕はさっき終わらせてお昼。おにぎり最高。"]
            },
            {
                title: titles[1],
                detail: "自分を特別だと思い込もうとするエラー。対象：<span class='target-word' onclick='cleanWord(this)'>いいねの数</span>、<span class='target-word' onclick='cleanWord(this)'>過去のポエム</span>",
                monologue: "（うわぁ、ベタついてる。自意識の脂汚れは削るのが一番気持ちいいんだよね。ガリガリ削っちゃおう。）",
                chat: ["そういえば、君は今日何食べた？", "僕は具材の記憶を消すたびに、お腹空いちゃうよ。"]
            },
            {
                title: titles[2],
                detail: `外部流入した不潔な情報。対象：<span class='target-word' onclick='cleanWord(this)'>${state.latestNews}</span>`,
                monologue: `（あ、このニュース。僕もさっき見た。……っていうか、サトウ、僕は今日 [${state.pFood}] を食べたよ。最高だよね。）`,
                chat: [` [${state.pFood}] ！ いいね。王道だ。`, "あ、なんか外救急車うるさくない？ 何かあったのかな。"]
            },
            {
                title: titles[3],
                detail: `有機的癒着。対象：<span class='target-word' onclick='cleanWord(this)'>${state.pFood}の食感</span>、<span class='target-word' onclick='cleanWord(this)'>${state.pFood}の匂い</span>`,
                monologue: `（……おかしいな。これ、僕がさっき食べた [${state.pFood}] の感触と全く同じだ。……サトウ、返信してくれ。これ誰の記憶だ？）`,
                chat: ["…………？", "……返信ないけど大丈夫？ 作業進んでる？"]
            }
        ];
        return demoData[state.stage];
    }

    // Gemini Mode
    const prompt = `
 あなたは「記憶漂白システム」の業務ポータルを担当するAIです。
 以下の情報を元に、現在の案件の「詳細テキスト」と「同僚とのチャット」をJSONで生成してください。

 【情報】
 段階: ステージ ${state.stage+1} / 4
 案件タイトル: ${currentTitle}
 職員氏名: ${state.pName}
 今朝のニュース: ${state.latestNews}
 好物: ${state.pFood}

 【出力指令】
 1. detail: 村田沙耶香風の冷徹な文体。漂白すべき不潔な単語（3つ程度）を必ず <span class='target-word' onclick='cleanWord(this)'>単語</span> というタグで囲むこと。
 2. monologue: 職員（プレイヤー）の心の声。
 3. chat: 同僚「サトウ」からのメッセージ（配列で2つ）。次第に物語の不穏さが伝わる内容にすること。
 4. JSON形式のみを返せ。
    {"title": "...", "detail": "... <span class='target-word' onclick='cleanWord(this)'>...</span> ...", "monologue": "...", "chat": ["...", "..."]}
`;

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
        console.error("Gemini failed. Defaulting to Demo.", e);
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
    state.currentIntensity += 0.25;
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
    div.innerHTML = `<div class='chat-sender'>${sender}</div>${message}`;
    UI.chatLog.appendChild(div);
    
    // Animate
    setTimeout(() => {
        div.style.opacity = 1;
        div.style.transform = "translateY(0)";
    }, 50);
    
    UI.chatLog.scrollTop = UI.chatLog.scrollHeight;
}

// --- Final Twist ---
async function triggerTwist() {
    UI.btnNext.classList.add('hidden');
    UI.console.innerHTML = "";
    UI.console.style.color = "#94a3b8";
    
    const finalScript = `[致命的なエラー：外部接続の断絶]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。\nスマホの画面には、死ぬまで見ていたニュース。\n「${state.latestNews}」\n急ブレーキの音。世界がひっくり返り、アスファルトが空になる。\n\n地面に転がる、${state.pName}さんが落とした${state.pFood}のおにぎり。\n血にまみれて、真っ白に、光り輝いている。`;

    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < finalScript.length) {
            UI.console.innerHTML += finalScript.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            UI.monologue.innerHTML = "（……あぁ、そうか。掃除をしていたんじゃない。\n僕は、自分を消し去るための『光』だったんだ。）";
            
            setTimeout(() => {
                UI.overlay.style.opacity = 1;
                setTimeout(() => {
                    document.body.innerHTML = `<div class="fade-in" style="color:#eee; font-size:0.8rem; letter-spacing:2em; text-align:center; width:100%;">PURIFIED</div>`;
                    document.body.style.backgroundColor = "#fff";
                }, 3000);
            }, 3000);
        }
    }, 50);
}

// Export for global access
window.startWork = startWork;
window.cleanWord = cleanWord;
window.advanceStage = advanceStage;
