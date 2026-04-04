// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "未定義の社会的ノイズ",
    stage: 0,
    step: 0,
    whitening: 0
};

const UI = {
    screens: {
        setup: document.getElementById('ui-setup'),
        work: document.getElementById('ui-work')
    },
    console: document.getElementById('console'),
    monologue: document.getElementById('monologue'),
    progress: document.getElementById('progress'),
    btnAction: document.getElementById('btn-action'),
    startBtn: document.getElementById('start-btn'),
    newsStatus: document.getElementById('news-status'),
    clock: document.getElementById('clock'),
    container: document.getElementById('container')
};

// --- API Key / Mode Initialization ---
if (!state.apiKey) {
    console.warn("No API Key found. Demo Mode enabled.");
    state.isDemoMode = true;
}

// --- News Fetching (RSS2JSON) ---
async function fetchNews() {
    try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await response.json();
        state.latestNews = data.items[0].title.split(' - ')[0];
        UI.newsStatus.innerText = `【同期完了】最新の汚染源：${state.latestNews}`;
        UI.startBtn.disabled = false;
    } catch (e) {
        state.latestNews = "未定義の社会不安";
        UI.newsStatus.innerText = "【同期失敗】オフラインモードで開始します。";
        UI.startBtn.disabled = false;
    }
}
fetchNews();

// --- Lifecycle Functions ---
function boot() {
    state.pName = document.getElementById('p-name').value || "未定義職員";
    state.pFood = document.getElementById('p-food').value || "規定の栄養剤";

    UI.screens.setup.classList.add('hidden');
    UI.screens.work.classList.remove('hidden');
    
    // Clock updates
    setInterval(() => {
        UI.clock.innerText = new Date().toLocaleTimeString();
    }, 1000);

    renderStage();
}

async function renderStage() {
    UI.btnAction.disabled = true;
    UI.progress.style.width = "0%";
    state.step = 0;

    UI.console.innerHTML = '<span style="color: #94a3b8;">案件データをロード中...</span>';
    UI.monologue.innerHTML = "";

    const caseInfo = await generateCaseContent();
    
    UI.console.innerHTML = `[案件：${caseInfo.title}]\n${caseInfo.detail}`;
    UI.monologue.innerHTML = caseInfo.monologue;
    
    UI.btnAction.disabled = false;
    UI.btnAction.innerText = "漂白を開始する";
}

async function handleStep() {
    state.step++;
    if (state.step === 1) {
        UI.progress.style.width = "50%";
        UI.console.innerHTML += "\n\n>> 洗浄液を塗布中... 表面の執着が溶解しています。";
        UI.btnAction.innerText = "洗浄する";
    } else if (state.step === 2) {
        UI.progress.style.width = "100%";
        UI.console.innerHTML += "\n>> 洗浄完了。個体は清潔な『無』へ回帰しました。";
        UI.btnAction.innerText = "次の案件へ";
    } else {
        state.stage++;
        state.whitening += 0.2;
        document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.whitening})`;
        
        if (state.stage <= 3) {
            renderStage();
        } else {
            showTwist();
        }
    }
}

// --- Content Generation (Gemini / Demo) ---
async function generateCaseContent() {
    const titles = [
        "G-102: 過去の電子記号",
        "A-405: 承認欲求の膿",
        "P-882: 最新の社会的汚染",
        "P-883: 有機的癒着 [好物記憶]"
    ];
    const currentTitle = titles[state.stage];

    if (state.isDemoMode) {
        const demoData = [
            { detail: "たまごっちの死、ポケモンの交換、赤外線通信。懐かしさという名の『カビ』が深層心理に繁殖しています。", monologue: "（あー、またこれ。この世代の客、みんなプラスチックのゴミに感情を乗せてる。不衛生だなぁ。）" },
            { detail: "数年前のSNS投稿。「いいね」の数で自分の肉体の価値を測ろうとするエラー。自意識がドロドロに溶け出しています。", monologue: "（うわ、ベタついてる。こういう承認欲求の脂汚れはヘラでこすらないと落ちないんだよね。肩がこる……。）" },
            { detail: `現在、社会ネットワーク上に蔓延しているノイズ：\n「${state.latestNews}」\n個体名 [${state.pName}] の脳内にも深く癒着しています。`, monologue: "（……？ このニュース、僕がさっき休憩中に見たやつだ。嫌な偶然だな。胃のあたりが少し、重い。）" },
            { detail: `「${state.pFood}」の咀嚼、嚥下、および胃壁での分解プロセスへの執着。不潔なエネルギー代謝の残滓。`, monologue: "（……おかしい。これ、僕がさっき食べた${state.pFood}の感触と全く同じだ。……おい、これ、何の冗談だ？）" }
        ];
        return { title: currentTitle, ...demoData[state.stage] };
    }

    // Gemini Mode
    const prompt = `
 あなたは「記憶清浄ポータル」のシステムAI、および「清掃員」の深層心理です。
 現在の案件[${currentTitle}]に対して、以下の情報を元に出力してください。
 
 【状況】
 案件タイトル: ${currentTitle}
 職員氏名: ${state.pName}
 今朝のニュース: ${state.latestNews}
 好物: ${state.pFood}
 
 【出力指令】
 1. システムメッセージ(detail): 村田沙耶香風の冷徹・生理的な文体で、その「記憶」がいかに不潔な汚れであるかを記述せよ。
 2. 職員の独り言(monologue): 仕事に疲れ、皮肉屋な清掃員の独り言を（）で記述せよ。徐々に自分との共通点に気づき、不穏になる様子を段階的に表現せよ。
 3. 日本語で、JSON形式で返せ。
    {"detail": "...", "monologue": "..."}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '');
        return { title: currentTitle, ...JSON.parse(jsonStr) };
    } catch (e) {
        console.error("Gemini failed. Defaulting to Demo.", e);
        state.isDemoMode = true;
        return generateCaseContent();
    }
}

// --- Final Twist ---
async function showTwist() {
    UI.btnAction.disabled = true;
    UI.container.style.borderLeft = "12px solid #fff";
    UI.console.style.color = "#cbd5e1";
    
    const twistText = `[警告：致命的なエラー / 走馬灯発現]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。\nスマホの画面には、死ぬまで見ていたニュース。\n「${state.latestNews}」\n急ブレーキの音。世界がひっくり返り、アスファルトが空になる。\n\n地面に転がる、${state.pName}さんが落とした${state.pFood}のおにぎり。\n血にまみれて、真っ白に、洗浄されていく。`;

    UI.console.innerHTML = "";
    await typeEffect(twistText);
    
    UI.monologue.innerHTML = "（……あぁ、そうか。掃除をしていたんじゃない。\n僕は、自分を消し去るための『機能』だったんだ。）";
    
    UI.btnAction.disabled = false;
    UI.btnAction.innerText = "すべてを完了する（Commit）";
    UI.btnAction.style.background = "#ef4444";
    
    UI.btnAction.onclick = () => {
        UI.container.innerHTML = `<div class="fade-in" style="color:#cbd5e1; font-size:0.8rem; letter-spacing:1.8em; text-align:center; width:100%; margin-top: 40px;">SHUTDOWN // COMPLETE</div>`;
        document.body.style.backgroundColor = "#fff";
    };
}

// --- Utilities ---
async function typeEffect(text) {
    const chars = Array.from(text);
    for (const char of chars) {
        UI.console.innerHTML += char;
        const delay = (char === "。" || char === "、" || char === "\n") ? 350 : 35;
        await new Promise(r => setTimeout(r, delay));
    }
}

// Export functions for HTML
window.boot = boot;
window.handleStep = handleStep;
