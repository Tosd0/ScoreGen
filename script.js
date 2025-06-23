/**
 * IVBL 赛果填写辅助工具
 * @version 3.5.0
 * @author Tosd0, Refactored by Gemini
 */

const BackGroundImageUrl = "https://patchwiki.biligame.com/images/dwrg/c/c2/e11ewgd95uf04495nybhhkqev5sjo0j.png";

const SCHOOLS = [
    "<联>醒", "北京市第三十五中学", "<联>上古神兽",
    "北大附中朝阳未来学校", "<联>QwQ", "北京教师进修学校"
];
const ROLES = {
    hunter: '监管',
    survivor: '求生'
};
const MATCH_MODES = {
    bo3: { initialGames: 2, maxGames: 3 },
    bo5: { initialGames: 3, maxGames: 5 }
};

let STATE = {
    mainTeam: '',
    subTeam: '',
    matchMode: 'bo5',
    games: [], // { id: 'bo1', role1: '', result1: '', role2: '', result2: '', time1: '', time2: '' }
    isIntermission: false,
    isMatchEnd: false
};

let obsWindow = null;
let isAppInitialized = false;

// --- 2. DOM ELEMENT REFERENCES ---
const elements = {
    mainTeamSelect: document.getElementById('main-team'),
    subTeamSelect: document.getElementById('sub-team'),
    matchModeSelect: document.getElementById('game-mode-select'),
    inputStage: document.getElementById('input-stage'),
    outputStage: document.getElementById('output-stage'),
    matchTitle: document.getElementById('match-title'),
    matchInstructions: document.getElementById('match-instructions'),
    matchesContainer: document.getElementById('matches'),
    resultsContainer: document.getElementById('results'),
    addBoButton: document.getElementById('add-bo'),
    addTiebreakerButton: document.getElementById('add-tiebreaker'),
    restoredDataContainer: document.getElementById('restored-data'),
    restoredDataContent: document.getElementById('restored-data-content'),
    // 按钮
    nextButton: document.getElementById('next-button'),
    restoreButton: document.getElementById('restore-button'),
    obsWindowButton: document.getElementById('open-obs-window'),
    intermissionButton: document.getElementById('toggle-intermission'),
    matchEndButton: document.getElementById('toggle-match-end'),
    sendToNotionButton: document.getElementById('send-to-notion-button'),
    // login
    loginContainer: document.getElementById('login-container'),
    appContainer: document.getElementById('app-container'),
    clerkSigninComponent: document.getElementById('clerk-signin'),
    userButtonComponent: document.getElementById('user-button'),
};

// Clerk initialization
let clerk;
async function startClerk() {
    clerk = window.Clerk;
    if (!clerk) {
        console.error("Clerk instance not found. Make sure the Clerk script is loaded correctly.");
        return;
    }

    await clerk.load();
    console.log("Clerk 核心加载完成！");

    const updateUI = () => {
        if (clerk.user) {
            elements.loginContainer.style.display = 'none';
            elements.appContainer.style.display = 'block';
            clerk.mountUserButton(elements.userButtonComponent);
            if (!isAppInitialized) {
                initializeApp();
            }
        } else {
            elements.loginContainer.style.display = 'block';
            elements.appContainer.style.display = 'none';
            clerk.mountSignIn(elements.clerkSigninComponent);
        }
    };

    clerk.addListener(({ user }) => {
        console.log("Clerk 监听到状态变化，当前用户:", user ? user.id : '未登录');
        updateUI();
    });

    updateUI();
}

// --- 应用初始化函数 ---
function initializeApp() {
    if (isAppInitialized) return;
    console.log("应用首次初始化...");
    const optionsHTML = SCHOOLS.map(school => `<option value="${school}">${school}</option>`).join('');
    elements.mainTeamSelect.innerHTML = `<option value="" disabled selected>请选择主场队伍</option>${optionsHTML}`;
    elements.subTeamSelect.innerHTML = `<option value="" disabled selected>请选择客场队伍</option>${optionsHTML}`;

    bindEventListeners();
    isAppInitialized = true;
}

// --- 3. UI RENDERING FUNCTIONS ---

function render() {
    renderMatchUI();
    renderResultTable();
    updateOBSWindow();
    saveStateToLocalStorage();
}

/**
 * 创建或更新所有比赛场次的输入界面
 */
function renderMatchUI() {
    elements.matchesContainer.innerHTML = '';
    STATE.games.forEach(game => {
        const isTiebreaker = game.id === 'tiebreaker';
        elements.matchesContainer.appendChild(createGameUI(game, isTiebreaker));
    });
    updateButtonVisibility();
}

/**
 * 创建单个游戏场次（BO或加赛）的HTML结构
 * @param {object} game - 游戏状态对象
 * @param {boolean} isTiebreaker - 是否为加赛
 * @returns {HTMLElement}
 */
function createGameUI(game, isTiebreaker) {
    const RESULTS = {
        hunter: { 4: '四杀', 3: '三杀', 2: '平局', 1: '一杀', 0: '零杀' },
        survivor: { 4: '四跑', 3: '三跑', 2: '平局', 1: '一跑', 0: '零跑' }
    };

    const gameDiv = document.createElement('div');
    gameDiv.id = game.id;
    gameDiv.className = 'game-instance';
    const gameLabel = game.id.toUpperCase();

    const createHalfUI = (half) => {
        const role = game[`role${half}`];
        const result = game[`result${half}`];
        const time = game[`time${half}`];

        const roleOptions = Object.values(ROLES).map(r =>
            `<option value="${r}" ${role === r ? 'selected' : ''}>${r}</option>`
        ).join('');

        const resultOptions = role ? Object.entries(RESULTS[role === ROLES.hunter ? 'hunter' : 'survivor']).map(([value, text]) =>
            `<option value="${value}" ${result === value ? 'selected' : ''}>${text}</option>`
        ).join('') : '';

        const timeInputHTML = isTiebreaker ? `<input type="text" class="time-input" placeholder="比赛时间(秒)" data-half="${half}" value="${time || ''}">` : '';

        return `
            <div>
                ${STATE.mainTeam}（<select class="role-select" data-half="${half}">
                    <option value="">未选择</option>
                    ${roleOptions}
                </select>）
                游戏结果：<select class="score-select" data-half="${half}">
                    <option value="">未选择</option>
                    ${resultOptions}
                </select>
                ${timeInputHTML}
            </div>
        `;
    };

    gameDiv.innerHTML = `
        <h3>${gameLabel}</h3>
        ${createHalfUI(1)}
        ${createHalfUI(2)}
    `;
    return gameDiv;
}

function updateButtonVisibility() {
    const matchConfig = MATCH_MODES[STATE.matchMode];
    const currentBoCount = STATE.games.filter(g => g.id.startsWith('bo')).length;
    const hasTiebreaker = STATE.games.some(g => g.id === 'tiebreaker');

    elements.addBoButton.style.display = (currentBoCount < matchConfig.maxGames) ? 'block' : 'none';
    elements.addTiebreakerButton.style.display = (currentBoCount === matchConfig.maxGames && !hasTiebreaker) ? 'block' : 'none';
}

function renderResultTable() {
    const { bigScoreMain, bigScoreSub, smallScoreMain, smallScoreSub, gameDetails } = calculateScores();

    let winningTeam = null;
    if (STATE.isMatchEnd) {
        if (bigScoreMain !== bigScoreSub) {
            winningTeam = bigScoreMain > bigScoreSub ? 'main' : 'sub';
        } else if (smallScoreMain !== smallScoreSub) {
            winningTeam = smallScoreMain > smallScoreSub ? 'main' : 'sub';
        }
    }

    const mainHighlight = winningTeam === 'main' ? 'class="highlight"' : '';
    const subHighlight = winningTeam === 'sub' ? 'class="highlight"' : '';

    const headerHTML = `
        <div class="match-header" style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 26px;">
                <span ${mainHighlight}>${STATE.mainTeam}</span> vs <span ${subHighlight}>${STATE.subTeam}</span>
            </h2>
            <div class="big-score" style="font-size: 22px; margin: 2px 0;">大分 ${bigScoreMain}:${bigScoreSub}</div>
            <div class="small-score" style="font-size: 18px; margin: 2px 0;">小分 ${smallScoreMain}:${smallScoreSub}</div>
            ${STATE.isIntermission ? '<div class="intermission-alert" style="color: #ffeb3b; font-size: 18px;">场间休息中，请耐心等待～</div>' : ''}
        </div>
    `;

    const tableHeaders = gameDetails.map(g => `<th colspan="2">${g.label}</th>`).join('');
    const halfHeaders = gameDetails.map(() => `<th>上半</th><th>下半</th>`).join('');

    const mainTeamRow = gameDetails.map(g => `<td ${mainHighlight}>${g.main1}</td><td ${mainHighlight}>${g.main2}</td>`).join('');
    const subTeamRow = gameDetails.map(g => `<td ${subHighlight}>${g.sub1}</td><td ${subHighlight}>${g.sub2}</td>`).join('');

    elements.resultsContainer.innerHTML = `
        <div style="padding: 0 25px; overflow-x:auto;">
            ${headerHTML}
            <table id="obs-new-table" border="1" cellspacing="0" cellpadding="5" style="width:100%; margin:0 auto;">
                <thead>
                    <tr><th rowspan="2">学校/队伍</th>${tableHeaders}</tr>
                    <tr>${halfHeaders}</tr>
                </thead>
                <tbody>
                    <tr><td ${mainHighlight}>${STATE.mainTeam}</td>${mainTeamRow}</tr>
                    <tr><td ${subHighlight}>${STATE.subTeam}</td>${subTeamRow}</tr>
                </tbody>
            </table>
            <div style="color: #ffeb3b; font-size: 12px; text-align: center; margin-top: 5px;" class="role-note">H为监管 S为求生</div>
        </div>`;
}

// --- 4. LOGIC & CALCULATIONS ---

/**
 * 计算大分和小分
 * @returns {object}
 */
function calculateScores() {
    let bigScoreMain = 0, bigScoreSub = 0;
    let smallScoreMain = 0, smallScoreSub = 0;
    const gameDetails = [];

    STATE.games.forEach(game => {
        const half1 = getHalfScores(game, 1);
        const half2 = getHalfScores(game, 2);

        smallScoreMain += half1.main + half2.main;
        smallScoreSub += half1.sub + half2.sub;

        if (half1.valid && half2.valid) {
            const totalMain = half1.main + half2.main;
            const totalSub = half1.sub + half2.sub;
            if (totalMain > totalSub) bigScoreMain++;
            else if (totalSub > totalMain) bigScoreSub++;
        }

        gameDetails.push({
            label: game.id.toUpperCase(),
            main1: getHalfDisplay(game, 1, 'main'),
            main2: getHalfDisplay(game, 2, 'main'),
            sub1: getHalfDisplay(game, 1, 'sub'),
            sub2: getHalfDisplay(game, 2, 'sub'),
        });
    });

    return { bigScoreMain, bigScoreSub, smallScoreMain, smallScoreSub, gameDetails };
}

/**
 * 获取单个半场的分数
 * @param {object} game
 * @param {number} halfIndex
 * @returns {{main: number, sub: number, valid: boolean}}
 */
function getHalfScores(game, halfIndex) {
    const POINTS = {
        '4': { main: 5, sub: 0 },
        '3': { main: 3, sub: 1 },
        '2': { main: 2, sub: 2 },
        '1': { main: 1, sub: 3 },
        '0': { main: 0, sub: 5 }
    };

    const role = game[`role${halfIndex}`];
    const result = game[`result${halfIndex}`];

    if (!role || result === '' || result === null || result === undefined) {
        return { main: 0, sub: 0, valid: false };
    }

    const points = POINTS[result];

    if (!points) {
        return { main: 0, sub: 0, valid: false };
    }

    return { ...points, valid: true };
}

/**
 * 获取用于在表格中显示的半场结果字符串
 * @param {object} game
 * @param {number} halfIndex
 * @param {string} teamType - 'main' 或 'sub'
 * @returns {string}
 */
function getHalfDisplay(game, halfIndex, teamType) {
    const { main, sub, valid } = getHalfScores(game, halfIndex);
    if (!valid) return '-';

    const mainRole = game[`role${halfIndex}`];
    const mainPrefix = mainRole === ROLES.hunter ? 'H' : 'S';
    const subPrefix = mainRole === ROLES.hunter ? 'S' : 'H';
    const time = game[`time${halfIndex}`];
    const timeSuffix = time ? `(${time})` : '';

    if (teamType === 'main') {
        return `${mainPrefix}${main}${timeSuffix}`;
    } else {
        return `${subPrefix}${sub}${timeSuffix}`;
    }
}

/**
 * 收集并直接格式化为 Notion API pages.create 方法所需的 JSON 格式
 * @returns {object} 一个包含 properties 和 children 的对象
 */
function collectDataForNotion() {
    const { mainTeam, subTeam } = STATE;

    const pageProperties = {
        "标题": {
            "title": [{ "text": { "content": `${mainTeam} vs ${subTeam}` } }]
        },
        "主场": { "select": { "name": mainTeam } },
        "客场": { "select": { "name": subTeam } },
        "比赛状态": { "status": { "name": "已结束" } },
        "日期": { "date": { "start": new Date().toISOString().split('T')[0] } },
    };

    const contentBlocks = [];
    contentBlocks.push({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{ "type": "text", "text": { "content": "比赛结果" } }]
        }
    })
    STATE.games.forEach(game => {
        contentBlocks.push({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{ "type": "text", "text": { "content": game.id.toUpperCase() } }]
            }
        });

        const half1Result = getHalfScores(game, 1);
        if (half1Result.valid) {
            const mainTeamRole = game.role1;
            const text = mainTeamRole === '监管'
                ? `上半场 ${half1Result.main}监(${game.time1 || ''}) : ${half1Result.sub}求`
                : `上半场 ${half1Result.main}求(${game.time1 || ''}) : ${half1Result.sub}监`;

            contentBlocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{ "type": "text", "text": { "content": text.replace(/\(\)/g, '') } }]
                }
            });
        }

        const half2Result = getHalfScores(game, 2);
        if (half2Result.valid) {
            const mainTeamRole = game.role2;
            const text = mainTeamRole === '监管'
                ? `下半场 ${half2Result.main}监(${game.time2 || ''}) : ${half2Result.sub}求`
                : `下半场 ${half2Result.main}求(${game.time2 || ''}) : ${half2Result.sub}监`;

            contentBlocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{ "type": "text", "text": { "content": text.replace(/\(\)/g, '') } }]
                }
            });
        }
    });

    const payload = {
        properties: pageProperties,
        children: contentBlocks
    };
    
    // console.log("直接生成给Notion API的最终Payload:", JSON.stringify(payload, null, 2));
    return payload;
}


// --- 5. EVENT HANDLERS ---

function bindEventListeners() {
    console.log("绑定所有事件监听器...");
    Object.entries(elements).forEach(([key, el]) => {
        if (!el) console.warn(`Element not found for: ${key}`);
    });

    if (elements.nextButton) elements.nextButton.addEventListener('click', handleNextStep);
    if (elements.restoreButton) elements.restoreButton.addEventListener('click', handleRestoreState);
    if (elements.addBoButton) elements.addBoButton.addEventListener('click', handleAddBo);
    if (elements.addTiebreakerButton) elements.addTiebreakerButton.addEventListener('click', handleAddTiebreaker);
    if (elements.intermissionButton) elements.intermissionButton.addEventListener('click', handleToggleIntermission);
    if (elements.matchEndButton) elements.matchEndButton.addEventListener('click', handleToggleMatchEnd);
    if (elements.obsWindowButton) elements.obsWindowButton.addEventListener('click', handleOpenOBSWindow);
    if (elements.sendToNotionButton) elements.sendToNotionButton.addEventListener('click', handleSendToNotion);
    if (elements.matchesContainer) {
        elements.matchesContainer.addEventListener('change', handleGameInputChange);
        elements.matchesContainer.addEventListener('input', handleGameInputChange);
    }
}

function handleNextStep() {
    const mainTeam = elements.mainTeamSelect.value;
    const subTeam = elements.subTeamSelect.value;
    const matchMode = elements.matchModeSelect.querySelector('input:checked').value;

    if (!mainTeam || !subTeam) {
        alert('请选择队伍');
        return;
    }

    STATE.mainTeam = mainTeam;
    STATE.subTeam = subTeam;
    STATE.matchMode = matchMode;

    STATE.games = [];
    const initialGameCount = MATCH_MODES[matchMode].initialGames;
    for (let i = 1; i <= initialGameCount; i++) {
        STATE.games.push({ id: `bo${i}` });
    }

    elements.inputStage.classList.remove('active-stage');
    elements.outputStage.classList.add('active-stage');
    elements.matchTitle.textContent = `${mainTeam} vs ${subTeam}`;
    elements.matchInstructions.style.display = 'block';

    render();
}

function handleGameInputChange(e) {
    const target = e.target;
    const gameDiv = target.closest('.game-instance');
    if (!gameDiv) return;

    const gameId = gameDiv.id;
    const half = target.dataset.half;
    const game = STATE.games.find(g => g.id === gameId);
    if (!game) return;

    if (target.classList.contains('role-select')) {
        const role = target.value;
        game[`role${half}`] = role;
        game[`result${half}`] = '';
        if (game[`time${half}`] !== undefined) game[`time${half}`] = '';

        const otherHalf = half === '1' ? '2' : '1';
        const otherRoleSelect = gameDiv.querySelector(`.role-select[data-half="${otherHalf}"]`);
        if (role) {
            const oppositeRole = role === ROLES.hunter ? ROLES.survivor : ROLES.hunter;
            game[`role${otherHalf}`] = oppositeRole;
            game[`result${otherHalf}`] = '';
            if (otherRoleSelect) otherRoleSelect.value = oppositeRole;
        } else {
            game[`role${otherHalf}`] = "";
            game[`result${otherHalf}`] = '';
            if (otherRoleSelect) otherRoleSelect.value = "";
        }
        renderMatchUI();

    } else if (target.classList.contains('score-select')) {
        game[`result${half}`] = target.value;
    } else if (target.classList.contains('time-input')) {
        game[`time${half}`] = target.value;
    }

    render();
}

function handleAddBo() {
    const nextBoNum = STATE.games.filter(g => g.id.startsWith('bo')).length + 1;
    STATE.games.push({ id: `bo${nextBoNum}` });
    render();
}

function handleAddTiebreaker() {
    STATE.games.push({ id: 'tiebreaker' });
    render();
}

function handleToggleIntermission() {
    STATE.isIntermission = !STATE.isIntermission;
    elements.intermissionButton.textContent = STATE.isIntermission ? '结束场间' : '进入场间';
    render();
}

function handleToggleMatchEnd() {
    STATE.isMatchEnd = !STATE.isMatchEnd;
    elements.matchEndButton.textContent = STATE.isMatchEnd ? '取消结束' : '比赛结束';
    render();
}

async function handleSendToNotion() {
    if (!clerk.user) {
        alert('请先登录。');
        return;
    }

    const data = collectDataForNotion();

    try {
        const token = await clerk.session.getToken();

        const response = await fetch('/api/send-to-notion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('成功发送到Notion！');
        } else {
            const errorResult = await response.json();
            alert(`发送失败: ${errorResult.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('发送请求时出错:', error);
        alert('发送请求时发生网络错误。');
    }
}

// --- 6. DATA PERSISTENCE & OBS WINDOW ---

function saveStateToLocalStorage() {
    localStorage.setItem('matchData', JSON.stringify(STATE));
}

function handleRestoreState() {
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        STATE = JSON.parse(savedData);

        elements.mainTeamSelect.value = STATE.mainTeam;
        elements.subTeamSelect.value = STATE.subTeam;
        const matchModeRadio = elements.matchModeSelect.querySelector(`input[value="${STATE.matchMode}"]`);
        if (matchModeRadio) matchModeRadio.checked = true;

        elements.inputStage.classList.remove('active-stage');
        elements.outputStage.classList.add('active-stage');
        elements.matchTitle.textContent = `${STATE.mainTeam} vs ${STATE.subTeam}`;
        elements.matchInstructions.style.display = 'block';
        
        render();
        
        alert('已成功恢复上次的数据。');

    } else {
        alert('没有找到任何保存的数据。');
    }
}

function handleOpenOBSWindow() {
    if (!obsWindow || obsWindow.closed) {
        obsWindow = window.open("", "obsWindow", "width=800,height=360");
        obsWindow.document.write(`
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>OBS捕获窗口</title><link rel="stylesheet" href="styles.css">
            <style>
                html, body { background: transparent; margin: 0; color: #fff; }
                body { background: url('${BackGroundImageUrl}') no-repeat center center fixed; background-size: cover; }
                #background-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 1; }
                #obs-results { position: relative; z-index: 2; height: 100vh; display: flex; align-items: center; justify-content: center; text-shadow: 0 0 10px rgba(255,255,255,0.8); }
                .highlight { color: #ffeb3b !important; text-shadow: 0 0 10px #ffeb3b, 0 0 20px #ffeb3b !important; }
            </style></head><body><div id="background-overlay"></div><div id="obs-results"></div></body></html>
        `);
        obsWindow.document.close();
        setTimeout(updateOBSWindow, 100);
    } else {
        obsWindow.focus();
    }
}

function updateOBSWindow() {
    if (obsWindow && !obsWindow.closed) {
        const resultsDiv = obsWindow.document.getElementById('obs-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = elements.resultsContainer.innerHTML;
        }
    }
}

window.addEventListener('load', startClerk);