// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    playerName: '',
    playerAge: '',
    playerGender: '',
    playerEpisode: '',
    stage: 0,
    cleanliness: 0
};

const UI = {
    screens: {
        setup: document.getElementById('setup-screen'),
        input: document.getElementById('input-screen'),
        cleaning: document.getElementById('cleaning-screen'),
        end: document.getElementById('end-screen')
    },
    apiKeyInput: document.getElementById('api-key'),
    loginBtn: document.getElementById('login-btn'),
    demoBtn: document.getElementById('demo-btn'),
    startBtn: document.getElementById('start-btn'),
    actionBtn: document.getElementById('action-btn'),
    memoryDisplay: document.getElementById('memory-display'),
    progressBar: document.getElementById('progress-bar'),
    cleanlinessPct: document.getElementById('cleanliness-pct')
};

// --- Initialization ---
if (state.apiKey) {
    showScreen('input');
    UI.apiKeyInput.value = state.apiKey;
}

// --- Event Listeners ---
UI.loginBtn.addEventListener('click', () => {
    const key = UI.apiKeyInput.value.trim();
    if (key) {
        state.apiKey = key;
        state.isDemoMode = false;
        localStorage.setItem('gemini_api_key', key);
        showScreen('input');
    } else {
        alert('APIキーを入力してください。');
    }
});

UI.demoBtn.addEventListener('click', () => {
    state.isDemoMode = true;
    state.apiKey = '';
    showScreen('input');
});

UI.startBtn.addEventListener('click', async () => {
    state.playerName = document.getElementById('player-name').value || '未定義ユニット';
    state.playerAge = document.getElementById('player-age').value || '30';
    state.playerGender = document.getElementById('player-gender').value;
    state.playerEpisode = document.getElementById('player-episode').value || '特になし';

    showScreen('cleaning');
    await processNextStage();
});

UI.actionBtn.addEventListener('click', async () => {
    await processNextStage();
});

// --- Core Logic ---
async function processNextStage() {
    UI.actionBtn.disabled = true;
    state.stage++;
    
    // Update cleanliness UI
    updateCleanliness(state.stage * 33);

    if (state.stage === 1) {
        await generateAiMemory("initial_cleaning");
    } else if (state.stage === 2) {
        await generateAiMemory("deep_whitening");
    } else if (state.stage === 3) {
        showPlotTwist();
    } else {
        showEnd();
    }
}

function updateCleanliness(target) {
    state.cleanliness = Math.min(target, 100);
    UI.progressBar.style.width = `${state.cleanliness}%`;
    UI.cleanlinessPct.innerText = state.cleanliness;

    if (state.cleanliness > 80) {
        document.body.classList.add('whitening');
    }
}

async function generateAiMemory(mode) {
    UI.memoryDisplay.innerHTML = '<span class="system-label">ANALYZING...</span>';
    
    if (state.isDemoMode) {
        // デモ用の固定メッセージ
        let demoText = "";
        if (mode === "initial_cleaning") {
            demoText = `[解析結果：世代的エラーの検出]\nID：${state.playerName} の深層意識をスキャン。${state.playerAge}歳という年次に特有の、酸化した電子音と使い道のなくなった古いプリペイドカードの質感が内壁に癒着しています。\nこれは生命維持に不必要なエラーであり、精神の純度を著しく下げています。\n直ちに第一段階の洗浄を開始します。\n\n黄ばみ度：42%（執着による酸化が進行しています）`;
        } else {
            demoText = `[第二段階：深層漂白プロセス]\n精神の深部より、不衛星な感情の粒子が検出されました。「愛着」や「未練」という名の、腐敗した有機的な意味合いです。\nこれらは${state.playerGender}としての社会的な役割を全うする上で、単なるノイズとして機能しています。\n純白の溶剤を注入し、すべての「思い出」を無機質なデータへと中和します。\n\n黄ばみ度：88%（漂白は順調です）`;
        }
        await typeWriter(demoText);
        UI.actionBtn.disabled = false;
        UI.actionBtn.innerText = "漂白を継続";
        return;
    }

    // 村田沙耶香風プロンプト
    const prompt = `
 あなたは作家の村田沙耶香のような文体を持つ、無機質で清潔なAIです。
 以下の人物の「忘れたい記憶」を、除去すべき不潔な汚れ（黄ばみ）として具体的に描写してください。

 【人物情報】
 ID: ${state.playerName}
 年齢: ${state.playerAge}歳
 性別: ${state.playerGender}
 抽出された記憶: ${state.playerEpisode}

 【出力指令】
 1. 描写は感情を排し、医学的・事務的・生理的な表現を使うこと。
 2. 記憶を「黄ばみ」「癒着」「エラー」「腐敗した有機物」と呼び、それがどのように精神構造を汚染しているかを淡々と記述せよ。
 3. ${mode === "initial_cleaning" ? "この世代特有の文化背景（10代の頃の流行など）を1つ捏造し、それが精神に癒着している様子を描写せよ。" : "より深層にある、生命活動に不要な『愛』や『情』といった不純物が、どのように洗浄されているかを描写せよ。"}
 4. 最後に必ず「黄ばみ度：◯％（酸化が進行しています）」という一文を添えること。
 5. 日本語で出力すること。
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const aiText = data.candidates[0].content.parts[0].text;
        await typeWriter(aiText);
        UI.actionBtn.disabled = false;
        UI.actionBtn.innerText = "漂白を継続";

    } catch (error) {
        UI.memoryDisplay.innerText = `エラー: ${error.message}`;
        console.error(error);
    }
}

function showPlotTwist() {
    document.body.classList.add('whitening');
    const twistText = `
 [対象メモリ：CRITICAL_ERROR_LIFE_STOP]
 
 コンビニのレジ袋が風に舞う。
 アスファルトの上で、剥がれかけた塗装のように意識が薄れていく。
 救急車のサイレンは、清潔な耳鳴りとなって溶け出した。
 
 ID：${state.playerName} の生命維持機能は、現在、漂白プロセスの最終段階に入っています。
 
 黄ばみ度：99.9%（人生という名の汚れが消滅します）
`;
    typeWriter(twistText).then(() => {
        setTimeout(() => {
            UI.memoryDisplay.innerHTML += "\n\n<span style='color: var(--text-muted);'>(……あぁ、そうか。私は、もう……)</span>";
            UI.actionBtn.disabled = false;
            UI.actionBtn.innerText = "人生を完了する";
        }, 1000);
    });
}

function showEnd() {
    showScreen('end');
    const endMessage = `
 識別ID：${state.playerName} 様
 
 全データのホワイトニングが正常に完了しました。
 あなたの「人生」という不潔な汚れは、すべて綺麗に落ちました。
 
 今、あなたは完全に清潔です。
 本日の業務はすべて終了です。
 
 ゆっくりとお休みください。
`;
    document.getElementById('end-message').innerText = endMessage;
}

// --- Utilities ---
function showScreen(screenId) {
    Object.values(UI.screens).forEach(s => s.classList.add('hidden'));
    UI.screens[screenId].classList.remove('hidden');
    UI.screens[screenId].classList.add('fade-in');
}

async function typeWriter(text) {
    UI.memoryDisplay.innerText = '';
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
        UI.memoryDisplay.innerText += chars[i];
        // 読点などは少し長めに待つ
        const delay = (chars[i] === '。' || chars[i] === '、') ? 300 : 20;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
