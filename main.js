// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    latestNews: "未定義の社会的ノイズ",
    stage: 0,
    whitening: 0,
    
    // Script Engine State
    script: [], // [{ type: 'system'|'employee', text: '...' }]
    lineIndex: -1,
    isTyping: false,
    currentText: "",
    isComplete: false
};

const UI = {
    screens: {
        setup: document.getElementById('ui-setup'),
        work: document.getElementById('ui-work')
    },
    console: document.getElementById('console'),
    monologue: document.getElementById('monologue'),
    progress: document.getElementById('progress'),
    startBtn: document.getElementById('start-btn'),
    newsStatus: document.getElementById('news-status'),
    clock: document.getElementById('clock'),
    container: document.getElementById('container'),
    nextIndicator: document.querySelector('.next-indicator')
};

// --- API Key / Mode Initialization ---
if (!state.apiKey) {
    console.warn("No API Key found. Demo Mode enabled.");
    state.isDemoMode = true;
}

// --- News Fetching ---
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
    
    setInterval(() => {
        UI.clock.innerText = new Date().toLocaleTimeString();
    }, 1000);

    // Global Click Listener for VN style
    UI.container.addEventListener('click', () => {
        if (UI.screens.work.classList.contains('hidden')) return;
        advanceScript();
    });

    startStage();
}

async function startStage() {
    UI.console.innerHTML = '<span style="color: #94a3b8;">案件データをロード中...</span>';
    UI.monologue.innerHTML = "";
    UI.progress.style.width = "0%";
    state.lineIndex = -1;
    state.isComplete = false;

    // 案件のスクリプト（台本）を取得
    state.script = await generateScript();
    
    advanceScript();
}

async function advanceScript() {
    if (state.isTyping) {
        // タイピング中にクリックしたら全表示（スキップ機能）
        state.isTyping = false;
        return;
    }

    if (state.isComplete) return;

    state.lineIndex++;
    
    if (state.lineIndex >= state.script.length) {
        // ステージ終了
        endStage();
        return;
    }

    const line = state.script[state.lineIndex];
    const targetEl = line.type === 'system' ? UI.console : UI.monologue;
    
    // システムメッセージの場合は追記、モノローグは上書き
    if (line.type === 'employee') UI.monologue.innerHTML = "";
    if (line.type === 'system' && state.lineIndex === 0) UI.console.innerHTML = "";

    await typeEffect(line.text, targetEl, line.type === 'system');
}

function endStage() {
    state.stage++;
    state.whitening += 0.2;
    document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.whitening})`;
    UI.progress.style.width = `${(state.stage / 4) * 100}%`;

    if (state.stage <= 3) {
        startStage();
    } else {
        state.isComplete = true;
        showTwist();
    }
}

// --- Content Generation (VN Script Format) ---
async function generateScript() {
    const titles = [
        "G-102: 過去の電子記号",
        "A-405: 承認欲求の膿",
        "P-882: 最新の社会的汚染",
        "P-883: 有機的癒着 [好物記憶]"
    ];
    const currentTitle = titles[state.stage];

    if (state.isDemoMode) {
        const demoScripts = [
            [
                { type: 'system', text: `[案件：${currentTitle}]\nたまごっちの死、ポケモンの交換、赤外線通信。懐かしさという名の『カビ』が深層心理に繁殖しています。` },
                { type: 'employee', text: "（あー、またこれ。この世代の客、みんなプラスチックのゴミに感情を乗せてる。）" },
                { type: 'employee', text: "（不衛生だなぁ。さっさと消しちゃおう。）" },
                { type: 'system', text: "\n>> 漂白を開始します。溶解中..." }
            ],
            [
                { type: 'system', text: `[案件：${currentTitle}]\n数年前のSNS投稿。「いいね」の数で自分の肉体の価値を測ろうとするエラー。自意識がドロドロに溶け出しています。` },
                { type: 'employee', text: "（うわ、ベタついてる。こういう承認欲求の脂汚れはヘラでこすらないと落ちないんだよね。）" },
                { type: 'employee', text: "（……腰が痛い。僕、今日何件目だっけ？）" },
                { type: 'system', text: "\n>> 表面の執着を削ぎ落としています。完了。" }
            ],
            [
                { type: 'system', text: `[案件：${currentTitle}]\n社会ネットワーク上に蔓延しているノイズ：\n「${state.latestNews}」\n個体名 [${state.pName}] の脳内にも深く癒着しています。` },
                { type: 'employee', text: "（……？ このニュース、僕がさっき休憩中に見たやつだ。）" },
                { type: 'employee', text: "（嫌な偶然だな。胃のあたりが少し、重い。）" },
                { type: 'system', text: "\n>> 社会的ノイズを除去中。意識を『無』へ誘導します。" }
            ],
            [
                { type: 'system', text: `[案件：${currentTitle}]\n「${state.pFood}」の咀嚼、嚥下、および胃壁での分解プロセスへの執着。不潔なエネルギー代謝の残滓。` },
                { type: 'employee', text: "（……おかしい。これ、僕がさっき食べた${state.pFood}の感触と全く同じだ。）" },
                { type: 'employee', text: "（……おい、これ、何の冗談だ？ 僕の胃の中を見てるのか？）" },
                { type: 'system', text: "\n>> 最後の有機的残滓を洗浄しています。まもなく完了。" }
            ]
        ];
        return demoScripts[state.stage];
    }

    // Gemini Mode - 台本(JSON Array)を生成させる
    const prompt = `
 あなたは「記憶清浄ポータル」のノベルゲーム用シナリオライターです。
 解析情報(system)と職員の反応(employee)を交互に繰り返す、全4〜5行の「台本」をJSON形式で出力してください。

 【解析中の案件】: ${currentTitle}
 職員氏名: ${state.pName}
 今朝のニュース: ${state.latestNews}
 今朝食べたもの: ${state.pFood}

 【文体指令】
 - system: 村田沙耶香風の冷徹・生理的な文体。
 - employee: 疲弊した職員の、皮肉まじりの独り言。徐々に自分との共通点に怯え始めること。

 【出力形式】
 JSON配列のみを返してください。
 [
   {"type": "system", "text": "解析結果：..."},
   {"type": "employee", "text": "（ふーん、またかよ...）"},
   ...
 ]
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
        console.error("Gemini failed script generation. Defaulting to Demo.", e);
        state.isDemoMode = true;
        return generateScript();
    }
}

// --- Final Twist ---
async function showTwist() {
    UI.container.style.borderLeft = "12px solid #fff";
    UI.console.style.color = "#cbd5e1";
    
    const twistScript = [
        { type: 'system', text: `[警告：致命的なエラー / 走馬灯発現]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。` },
        { type: 'system', text: `\nスマホの画面には、死ぬまで見ていたニュース。\n「${state.latestNews}」` },
        { type: 'system', text: `\n急ブレーキの音。世界がひっくり返り、アスファルトが空になる。` },
        { type: 'system', text: `\n\n地面に転がる、${state.pName}さんが落とした${state.pFood}のおにぎり。\n血にまみれて、真っ白に、洗浄されていく。` },
        { type: 'employee', text: "（……あぁ、そうか。掃除をしていたんじゃない。）" },
        { type: 'employee', text: "（僕は、自分を消し去るための『機能』だったんだ。）" }
    ];

    state.script = twistScript;
    state.lineIndex = -1;
    advanceScript();
    
    // 最終行での特殊処理（UIの書き換え）
    const checkFinal = setInterval(() => {
        if (state.lineIndex >= state.script.length - 1 && !state.isTyping) {
            clearInterval(checkFinal);
            UI.nextIndicator.innerText = "COMMIT // SHUTOFF";
        }
    }, 500);
}

// --- Utilities ---
async function typeEffect(text, targetEl, append = false) {
    state.isTyping = true;
    const chars = Array.from(text);
    let displayed = append ? targetEl.innerHTML : "";
    
    for (const char of chars) {
        if (!state.isTyping) {
            // スキップされた場合、一気に表示
            targetEl.innerHTML = (append ? targetEl.innerHTML : "") + text;
            break;
        }
        displayed += char;
        targetEl.innerHTML = displayed;
        const delay = (char === "。" || char === "、" || char === "\n") ? 300 : 35;
        await new Promise(r => setTimeout(r, delay));
    }
    state.isTyping = false;
}

// Export functions for HTML
window.boot = boot;
