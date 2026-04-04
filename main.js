// --- Constants & State ---
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    isDemoMode: false,
    pName: '',
    pFood: '',
    pSns: '',
    stage: 0,
    bgWhite: 0
};

const UI = {
    screens: {
        setup: document.getElementById('ui-setup'),
        work: document.getElementById('ui-work')
    },
    console: document.getElementById('console'),
    btnNext: document.getElementById('btn-next'),
    container: document.getElementById('container')
};

// --- API Key / Mode Check ---
// 初回起動時にキーがない場合はデモモードを案内する仕組み（簡易版）
if (!state.apiKey) {
    console.log("No API Key found. Switching to Demo Mode automatically for preview.");
    state.isDemoMode = true;
}

// --- Bootstrap Function ---
function boot() {
    state.pName = document.getElementById('p-name').value;
    state.pFood = document.getElementById('p-food').value;
    state.pSns = document.getElementById('p-sns').value;

    if (!state.pName || !state.pFood || !state.pSns) {
        return alert("全ての検査項目に回答してください。");
    }

    UI.screens.setup.classList.add('hidden');
    UI.screens.work.classList.remove('hidden');
    render();
}

// --- Rendering Logic ---
async function render() {
    UI.btnNext.style.display = "none";
    UI.console.innerHTML = '<span style="color: #999;">個体データをスキャン中...</span>';

    let text = "";

    if (state.stage === 0) {
        text = await generateAnalysis("sns_pollution");
    } else if (state.stage === 1) {
        text = await generateAnalysis("biological_residue");
    } else {
        showFinalTwist();
        return;
    }

    await typeWriter(text);
    UI.btnNext.style.display = "block";
    UI.btnNext.innerText = "漂白（Whitening）を実行";
}

// --- Gemini / Demo Analysis ---
async function generateAnalysis(type) {
    if (state.isDemoMode) {
        if (type === "sns_pollution") {
            return `[解析対象：短期的執着]\nあなたが先ほどまで意識していた「${state.pSns}」という概念。これは脳細胞に癒着した${state.pName}という個体の「汚れ」です。SNSという不潔なプールに、自ら浸かりにいく行為は、精神のホワイトニングにおいて最も忌むべきバグです。\n直ちに漂白を実行してください。\n\n除去レベル：推奨`;
        } else {
            return `[解析対象：有機的残滓]\nあなたの胃腔内に残留している「${state.pFood}」の記憶。それはただのタンパク質と糖質の塊であり、明日には排泄されるべきゴミに過ぎません。その「味」や「食感」に固執することは、磨き残した奥歯の黄ばみと同じです。\n清潔な「無」へ変換してください。\n\n除去レベル：最大`;
        }
    }

    // AI Mode
    const prompt = `
 あなたは厚生労働省 精神衛生管理局の、冷徹で無機質なAI検査官です。
 以下の情報を元に、個体の「不潔な記憶」に対する解析報告書を、村田沙耶香のような生理的で冷ややかな文体で作製してください。

 【個体情報】
 氏名: ${state.pName}
 外部汚染源（SNS単語）: ${state.pSns}
 生物学的残滓（朝食）: ${state.pFood}

 【解析指令】
 1. ${type === "sns_pollution" ? `SNSで見た「${state.pSns}」という概念が、いかに個体の精神を汚染し、不潔な癒着を引き起こしているかを、臨床的・生理的な表現で糾弾せよ。` : `胃にある「${state.pFood}」という有機物の記憶が、いかに生命維持に不要なゴミであり、個体の純度を下げているかを記述せよ。`}
 2. 感情を排し、事務的かつ不気味なトーンを維持すること。
 3. 200文字程度で出力し、最後に必ず「不純物含有率：◯％」という一文を添えること。
 4. 日本語で出力すること。
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("AI Analysis failed. Falling back to Demo Mode.", e);
        state.isDemoMode = true;
        return generateAnalysis(type);
    }
}

// --- Final Stage Logic ---
function showFinalTwist() {
    const twistText = `[警告：システム強制終了 / 最終ログ]\n\n${new Date().toLocaleTimeString()}：いつもと同じ信号待ち。\nスマホの画面には、さっきまで見ていた「${state.pSns}」の文字。\n急ブレーキの音。世界が激しく回転し、白一色に染まっていく。\n\nアスファルトの上、砕けたスマホの隣に、\n${state.pName}さんが落とした「${state.pFood}」が、\n血と混じって無機質に転がっている。\n\n……あぁ、そうか。\n掃除をしていたんじゃない。\n僕は、消え去る前の自分の記憶を、\n必死に「汚れ」だと思い込もうとしていただけなんだ。`;

    typeWriter(twistText).then(() => {
        UI.btnNext.style.display = "block";
        UI.btnNext.innerText = "人生の漂白を完了する";
        UI.btnNext.style.background = "var(--gov-red)";
        document.body.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    });
}

function nextStage() {
    state.stage++;
    if (state.stage <= 2) {
        state.bgWhite += 0.3;
        document.body.style.backgroundColor = `rgba(255, 255, 255, ${state.bgWhite})`;
        render();
    } else {
        completeProcess();
    }
}

function completeProcess() {
    UI.container.innerHTML = `
        <div class="fade-in" style="line-height:2.5;">
            <p style="font-weight:bold; letter-spacing:0.5em; color:#ccc; margin-bottom: 2rem;">COMPLETE</p>
            <p>${state.pName} 様</p>
            <p>全ての汚れ（人生）の漂白が正常に完了しました。<br>
            あなたは今、完璧に清潔な「無」となりました。</p>
            <div style="margin-top: 3rem; border-top: 1px solid #eee; padding-top: 2rem;">
                <p style="font-size: 0.9rem; color: #999;">本日の業務はすべて終了です。ゆっくりとお休みください。</p>
                <button onclick="location.reload()" style="background: transparent; border: 1px solid var(--gov-light-gray); color: #999; font-size: 0.7rem; width: auto; padding: 0.5rem 1rem; margin-top: 2rem;">ログオフ</button>
            </div>
        </div>`;
    document.body.style.backgroundColor = "#fff";
}

// --- Typing Effect ---
async function typeWriter(text) {
    UI.console.innerHTML = "";
    const chars = Array.from(text);
    for (const char of chars) {
        UI.console.innerHTML += char;
        const delay = (char === "。" || char === "、" || char === "\n") ? 350 : 35;
        await new Promise(r => setTimeout(r, delay));
    }
}

// HTML側からの呼び出しのためにグローバルに登録（または直接onclickで使用）
window.boot = boot;
window.nextStage = nextStage;
