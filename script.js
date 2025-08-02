/**
 * IVBL 赛果填写辅助工具
 * @version 3.8.2
 * @author Tosd0
 */

const BackGroundImageUrl = "https://patchwiki.biligame.com/images/dwrg/c/c2/e11ewgd95uf04495nybhhkqev5sjo0j.png";

const SCHOOLS = [
    "北京科技大学附属中学",
    "北京市第十四中学",
    "我不行了",
    "北京大学附属中学朝阳未来学校",
    "北京市第三中学",
    "中央美术学院附属中等美术学校",
    "北京教院附中",
    "首都师范大学附属苹果园中学",
    "神本无相",
    "北京外国语大学附属外国语学校",
    "人大附中北京经济技术开发区学校",
    "北京三里屯一中",
    "北京市海淀区尚丽外国语学校",
    "北京日坛中学",
    "北京市第八十中学",
    "Falcons",
    "北京市中关村中学",
    "潞河国际教育学园",
    "北京市第二中学通州校区",
    "北京市海淀区教师进修附属香山学校",
    "理工大学附属中学",
    "北京市回民学校",
    "RDF",
    "清华大学附属中学将台路",
    "北京市海淀区教师进修学校",
    "北京二中朝阳学校",
    "清华大学附属中学奥森",
    "北京市第九中学",
    "北京大学附属中学",
    "睡",
    "北京市第十三中学",
    "北京市人朝分实验",
    "首都师范大学第二附属中学",
    "DW",
    "身处于地面之下",
    "北师大实验丰台",
    "Pitafans",
    "北京市第五中学通州校区",
    "NKDG",
    "清华大学附属中学",
    "北京市第一五六中学",
    "北京市通州区潞河中学",
    "grood",
    "北二外附中",
    "T1",
    "北京市密云区第二中学",
    "对外经贸附中",
    "北京市一〇一中怀柔分校",
    "你说的都队"
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
    homeTeam: '',
    awayTeam: '',
    homeLineup: '',
    awayLineup: '',
    matchMode: 'bo5',
    games: [], // { id: 'bo1', role1: '', result1: '', role2: '', result2: '', time1: '', time2: '' }
    databaseId: '',
    databaseTitle: ''
};

let isAppInitialized = false;

// --- 2. DOM ELEMENT REFERENCES ---
const elements = {
    appContainer: document.getElementById('app-container'),
    homeTeamSelect: document.getElementById('home-team'),
    awayTeamSelect: document.getElementById('away-team'),
    matchModeSelect: document.getElementById('game-mode-select'),
    inputStage: document.getElementById('input-stage'),
    outputStage: document.getElementById('output-stage'),
    matchTitle: document.getElementById('match-title'),
    matchesContainer: document.getElementById('matches'),
    resultsContainer: document.getElementById('results'),
    addBoButton: document.getElementById('add-bo'),
    addTiebreakerButton: document.getElementById('add-tiebreaker'),
    homeLineupInput: document.getElementById('home-lineup'),
    awayLineupInput: document.getElementById('away-lineup'),
    homeLineupLabel: document.getElementById('home-lineup-label'),
    awayLineupLabel: document.getElementById('away-lineup-label'),
    // 按钮
    nextButton: document.getElementById('next-button'),
    restoreButton: document.getElementById('restore-button'),
    
    sendToNotionButton: document.getElementById('send-to-notion-button'),
    // login
    loginContainer: document.getElementById('login-container'),
    clerkSigninComponent: document.getElementById('clerk-signin'),
    userButtonComponent: document.getElementById('user-button'),
    // token login
    accountLoginTab: document.getElementById('account-login-tab'),
    tokenLoginTab: document.getElementById('token-login-tab'),
    accountLoginPanel: document.getElementById('account-login-panel'),
    tokenLoginPanel: document.getElementById('token-login-panel'),
    tokenInput: document.getElementById('token-input'),
    tokenLoginButton: document.getElementById('token-login-button'),
    tokenError: document.getElementById('token-error'),
    greetingMessage: document.getElementById('greeting-message'),
    dbGreetingMessage: document.getElementById('db-greeting-message'),
    choiceGreetingMessage: document.getElementById('choice-greeting-message'),
    databaseIdContainer: document.getElementById('database-id-container'),
    databaseIdInput: document.getElementById('database-id-input'),
    verifyDatabaseButton: document.getElementById('verify-database-button'),
    databaseError: document.getElementById('database-error'),
    databaseTitle: document.getElementById('database-title'),
    changeDatabaseContainer: document.getElementById('change-database-container'),
    changeDatabaseLink: document.getElementById('change-database-link'),
    confirmationStage: document.getElementById('confirmation-stage'),
    confirmationSummary: document.getElementById('confirmation-summary'),
    cancelSendButton: document.getElementById('cancel-send-button'),
    confirmSendButton: document.getElementById('confirm-send-button'),
    // choice
    choiceStage: document.getElementById('choice-stage'),
    choiceDbTitle: document.getElementById('choice-db-title'),
    goToFillButton: document.getElementById('go-to-fill-button'),
    backToChoiceFromFillButton: document.getElementById('back-to-choice-from-fill-button'),
    // query
    goToQueryButton: document.getElementById('go-to-query-button'),
    queryContainer: document.getElementById('query-container'),
    queryStage: document.getElementById('query-stage'),
    queryTeamSelect: document.getElementById('query-team-select'),
    queryResultContainer: document.getElementById('query-result-container'),
    backToChoiceButton: document.getElementById('back-to-choice-button'),
    // match exists confirmation
    matchExistsConfirmationStage: document.getElementById('match-exists-confirmation-stage'),
    reviewMatchButton: document.getElementById('review-match-button'),
    continueSubmitButton: document.getElementById('continue-submit-button'),
};

// Clerk initialization
let clerk;

// Token authentication state
let tokenUser = null;
async function startClerk() {
    clerk = window.Clerk;
    if (!clerk) {
        console.error("Clerk instance not found. Make sure the Clerk script is loaded correctly.");
        return;
    }

    await clerk.load();
    console.log("Clerk 核心加载完成！");

    // Check for stored token user on page load
    const storedTokenUser = localStorage.getItem('tokenUser');
    if (storedTokenUser) {
        try {
            tokenUser = JSON.parse(storedTokenUser);
            console.log("恢复令牌用户状态:", tokenUser);
        } catch (error) {
            console.error("恢复令牌用户状态失败:", error);
            localStorage.removeItem('tokenUser');
        }
    }

    const updateUI = () => {
        const currentUser = getCurrentUser();
        if (currentUser) {            
            const savedDatabaseId = localStorage.getItem('notionDatabaseId');
            if (savedDatabaseId) {
                STATE.databaseId = savedDatabaseId;
                verifyDatabaseId(savedDatabaseId)
                    .then(isValid => {
                        if (isValid) {
                            const onLoginPage = elements.loginContainer.style.display !== 'none';
                            const onDbPage = elements.databaseIdContainer.style.display !== 'none';

                            if (onLoginPage || onDbPage) {
                                showStage('choice-stage');
                            }
                            
                            elements.choiceDbTitle.textContent = `当前数据库: ${STATE.databaseTitle}`;
                        } else {
                            showStage('database-id-container');
                        }
                    })
                    .catch(() => {
                        showDatabaseIdContainer();
                    });
            } else {
                showStage('database-id-container');
            }
            
            // Mount user button only for Clerk users
            if (clerk && clerk.user) {
                clerk.mountUserButton(elements.userButtonComponent);
            } else {
                // For token users, clear the user button area
                elements.userButtonComponent.innerHTML = '';
            }
            updateGreeting(currentUser);
        } else {
            showStage('login-container');
            // 默认隐藏两个面板，等待用户选择
            elements.accountLoginPanel.style.display = 'none';
            elements.tokenLoginPanel.style.display = 'none';
            elements.accountLoginTab.className = 'btn btn-secondary';
            elements.tokenLoginTab.className = 'btn btn-secondary';
            updateGreeting(null);
        }

        // 确保事件监听器总是在首次UI更新时被绑定
        if (!isAppInitialized) {
            initializeApp();
        }
    };

    clerk.addListener(({ user }) => {
        console.log("Clerk 监听到状态变化，当前用户:", user ? user.id : '未登录');
        updateUI();
    });

    updateUI();
}

/**
 * 统一的页面切换函数
 * @param {string} stageId 要显示的页面的ID
 */
function showStage(stageId) {
    const topLevelStages = ['login-container', 'database-id-container', 'choice-stage', 'app-container'];
    const appSubStages = [
        'input-stage', 
        'output-stage', 
        'confirmation-stage', 
        'query-stage', 
        'match-exists-confirmation-stage'
    ];

    // 确定哪个顶级容器应该是活动的
    let activeTopLevel = '';
    if (topLevelStages.includes(stageId)) {
        activeTopLevel = stageId;
    } else if (appSubStages.includes(stageId)) {
        activeTopLevel = 'app-container';
    }

    // 显示正确的顶级容器并隐藏其他容器
    topLevelStages.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === activeTopLevel) {
                el.style.display = 'block';
                el.classList.add('active-stage');
            } else {
                el.style.display = 'none';
                el.classList.remove('active-stage');
            }
        }
    });

    // 处理 app-container 内的子舞台
    if (activeTopLevel === 'app-container') {
        appSubStages.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === stageId) {
                    el.style.display = 'block';
                    el.classList.add('active-stage');
                } else {
                    el.style.display = 'none';
                    el.classList.remove('active-stage');
                }
            }
        });
    }
}


/**
 * 显示数据库ID输入界面
 */
function showDatabaseIdContainer() {
    showStage('database-id-container');
}

/**
 * 显示主应用界面
 */
function showAppContainer() {
    showStage('app-container');
}


/**
 * 验证数据库ID并获取数据库标题
 * @param {string} databaseId - Notion数据库ID
 * @returns {Promise<boolean>} - 验证是否成功
 */
async function verifyDatabaseId(databaseId) {
    try {
        if (!getCurrentUser()) {
            return false;
        }

        const token = await getAuthToken();
        
        // 查询数据库以获取标题
        const response = await fetch(`/api/verify-database?databaseId=${databaseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('无法验证数据库ID');
        }

        const data = await response.json();
        STATE.databaseTitle = data.title || '未知数据库';
        
        if (elements.databaseTitle) {
            elements.databaseTitle.textContent = `您正在填写 ${STATE.databaseTitle} 的赛果数据`;
            elements.changeDatabaseContainer.style.display = 'block';
        }
        
        localStorage.setItem('notionDatabaseId', databaseId);
        return true;
    } catch (error) {
        console.error('验证数据库ID时出错:', error);
        return false;
    }
}

// --- 应用初始化函数 ---
function initializeApp() {
    if (isAppInitialized) return;
    console.log("应用首次初始化...");
    const optionsHTML = SCHOOLS.map(school => `<option value="${school}">${school}</option>`).join('');
    elements.homeTeamSelect.innerHTML = `<option value="" disabled selected>请选择主场队伍</option>${optionsHTML}`;
    elements.awayTeamSelect.innerHTML = `<option value="" disabled selected>请选择客场队伍</option>${optionsHTML}`;

    bindEventListeners();
    isAppInitialized = true;
}

// --- 3. UI RENDERING FUNCTIONS ---

function generateSummaryText(game, half) {
    const role = game[`role${half}`];
    const result = game[`result${half}`];

    if (!role || result === '' || result === null || result === undefined) {
        return '';
    }

    const homeTeam = STATE.homeTeam;
    const awayTeam = STATE.awayTeam;

    const homeTeamRole = game[`role${half}`];

    const survivorResultMap = {
        '4': '四跑（零抓）',
        '3': '三跑（一抓）',
        '2': '平局',
        '1': '一跑（三抓）',
        '0': '零跑（四抓）'
    };

    const hunterResultMap = {
        '4': '四抓（零跑）',
        '3': '三抓（一跑）',
        '2': '平局',
        '1': '一抓（三跑）',
        '0': '零抓（四跑）'
    };

    let resultText;
    if (homeTeamRole === ROLES.survivor) {
        resultText = survivorResultMap[result];
    } else if (homeTeamRole === ROLES.hunter) {
        resultText = hunterResultMap[result];
    }

    if (!resultText) return '';

    const scores = getHalfScores(game, half);
    if (!scores.valid) return '';

    let survivorTeamName, survivorTeamScore, hunterTeamName, hunterTeamScore;

    if (homeTeamRole === ROLES.survivor) {
        survivorTeamName = homeTeam;
        survivorTeamScore = scores.home;
        hunterTeamName = awayTeam;
        hunterTeamScore = scores.away;
    } else {
        survivorTeamName = awayTeam;
        survivorTeamScore = scores.away;
        hunterTeamName = homeTeam;
        hunterTeamScore = scores.home;
    }

    return `本场比赛为${survivorTeamName}求生者方对战${hunterTeamName}监管者方，比赛结果为${resultText}，${survivorTeamName}求生者方获得${survivorTeamScore}分小分，${hunterTeamName}监管者方获得${hunterTeamScore}小分。`;
}

function generateHalfSummaryHTML(game, half) {
    const summaryText = generateSummaryText(game, half);
    if (!summaryText) return '';

    return `
        <div class="summary-container" style="position: relative; margin-top: 10px;">
            <textarea readonly class="summary-text" data-half="${half}" rows="3" style="width: 100%; resize: vertical; padding: 8px 75px 8px 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; background-color: #f9f9f9; font-size: 13px;">${summaryText}</textarea>
            <button type="button" class="btn btn-secondary btn-copy" data-half="${half}" style="position: absolute; right: 5px; top: 8px; font-size: 12px; padding: 4px 10px;">复制</button>
        </div>
    `;
}

function render() {
    renderMatchUI();
    renderResultTable();
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
        const summaryHTML = generateHalfSummaryHTML(game, half);

        return `
            <div>
                ${STATE.homeTeam}（<select class="role-select" data-half="${half}">
                    <option value="">---</option>
                    ${roleOptions}
                </select>）
                游戏结果：<select class="score-select" data-half="${half}">
                    <option value="">---</option>
                    ${resultOptions}
                </select>
                ${timeInputHTML}
                ${summaryHTML}
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
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway, gameDetails } = calculateScores();

    const headerHTML = `
        <div class="match-header" style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 26px;">
                <span>${STATE.homeTeam}</span> vs <span>${STATE.awayTeam}</span>
            </h2>
            <div class="big-score" style="font-size: 22px; margin: 2px 0;">大分 ${bigScoreHome}:${bigScoreAway}</div>
            <div class="small-score" style="font-size: 18px; margin: 2px 0;">小分 ${smallScoreHome}:${smallScoreAway}</div>
            
        </div>
    `;

    const tableHeaders = gameDetails.map(g => `<th colspan="2">${g.label}</th>`).join('');
    const halfHeaders = gameDetails.map(() => `<th>上半</th><th>下半</th>`).join('');

    const homeTeamRow = gameDetails.map(g => `<td>${g.home1}</td><td>${g.home2}</td>`).join('');
    const awayTeamRow = gameDetails.map(g => `<td>${g.away1}</td><td>${g.away2}</td>`).join('');

    elements.resultsContainer.innerHTML = `
        <div style="padding: 0 25px; overflow-x:auto;">
            ${headerHTML}
            <table id="obs-new-table" border="1" cellspacing="0" cellpadding="5" style="width:100%; margin:0 auto;">
                <thead>
                    <tr><th rowspan="2">学校/队伍</th>${tableHeaders}</tr>
                    <tr>${halfHeaders}</tr>
                </thead>
                <tbody>
                    <tr><td>${STATE.homeTeam}</td>${homeTeamRow}</tr>
                    <tr><td>${STATE.awayTeam}</td>${awayTeamRow}</tr>
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
    let bigScoreHome = 0, bigScoreAway = 0;
    let smallScoreHome = 0, smallScoreAway = 0;
    const gameDetails = [];

    STATE.games.forEach(game => {
        const half1 = getHalfScores(game, 1);
        const half2 = getHalfScores(game, 2);

        smallScoreHome += half1.home + half2.home;
        smallScoreAway += half1.away + half2.away;

        if (game.id !== 'tiebreaker') {
            if (half1.valid && half2.valid) {
                const totalHome = half1.home + half2.home;
                const totalAway = half1.away + half2.away;
                if (totalHome > totalAway) bigScoreHome++;
                else if (totalAway > totalHome) bigScoreAway++;
            }
        }

        gameDetails.push({
            label: game.id.toUpperCase(),
            home1: getHalfDisplay(game, 1, 'home'),
            home2: getHalfDisplay(game, 2, 'home'),
            away1: getHalfDisplay(game, 1, 'away'),
            away2: getHalfDisplay(game, 2, 'away'),
        });
    });

    return { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway, gameDetails };
}

/**
 * 获取单个半场的分数
 * @param {object} game
 * @param {number} halfIndex
 * @returns {{home: number, away: number, valid: boolean}}
 */
function getHalfScores(game, halfIndex) {
    const POINTS = {
        '4': { home: 5, away: 0 },
        '3': { home: 3, away: 1 },
        '2': { home: 2, away: 2 },
        '1': { home: 1, away: 3 },
        '0': { home: 0, away: 5 }
    };

    const role = game[`role${halfIndex}`];
    const result = game[`result${halfIndex}`];

    if (!role || result === '' || result === null || result === undefined) {
        return { home: 0, away: 0, valid: false };
    }

    const points = POINTS[result];

    if (!points) {
        return { home: 0, away: 0, valid: false };
    }

    return { ...points, valid: true };
}

/**
 * 获取用于在表格中显示的半场结果字符串
 * @param {object} game
 * @param {number} halfIndex
 * @param {string} teamType - 'home' 或 'away'
 * @returns {string}
 */
function getHalfDisplay(game, halfIndex, teamType) {
    const { home, away, valid } = getHalfScores(game, halfIndex);
    if (!valid) return '-';

    const homeRole = game[`role${halfIndex}`];
    const homePrefix = homeRole === ROLES.hunter ? 'H' : 'S';
    const awayPrefix = homeRole === ROLES.hunter ? 'S' : 'H';
    const time = game[`time${halfIndex}`];
    const timeSuffix = time ? `(${time})` : '';

    if (teamType === 'home') {
        return `${homePrefix}${home}${timeSuffix}`;
    } else {
        return `${awayPrefix}${away}${timeSuffix}`;
    }
}

/**
 * 计算并生成 raw_score 字符串
 * @returns {string}
 */
function calculateRawScore() {
    let rawScoreString = "";

    STATE.games.forEach(game => {
        if (!game.role1 || !game.result1 || !game.role2 || !game.result2) {
            return; // 如果半场数据不完整，则跳过此BO
        }

        let gameScores = {
            home: { hunter: 0, survivor: 0 },
            away: { hunter: 0, survivor: 0 }
        };

        // 处理上半场
        const half1Scores = getHalfScores(game, 1);
        if (game.role1 === ROLES.hunter) { // 主队监管
            gameScores.home.hunter += half1Scores.home;
            gameScores.away.survivor += half1Scores.away;
        } else { // 主队求生
            gameScores.home.survivor += half1Scores.home;
            gameScores.away.hunter += half1Scores.away;
        }

        // 处理下半场
        const half2Scores = getHalfScores(game, 2);
        if (game.role2 === ROLES.hunter) { // 主队监管
            gameScores.home.hunter += half2Scores.home;
            gameScores.away.survivor += half2Scores.away;
        } else { // 主队求生
            gameScores.home.survivor += half2Scores.home;
            gameScores.away.hunter += half2Scores.away;
        }

        rawScoreString += `${gameScores.home.hunter}${gameScores.home.survivor}${gameScores.away.hunter}${gameScores.away.survivor}`;
    });

    return rawScoreString;
}

/**
 * 收集并直接格式化为 Notion API pages.create 方法所需的 JSON 格式
 * @returns {object} 一个包含 properties 和 children 的对象
 */
function collectDataForNotion() {
    const { homeTeam, awayTeam, homeLineup, awayLineup } = STATE;
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway } = calculateScores();
    const rawScore = calculateRawScore();

    const pageProperties = {
        "标题": {
            "title": [{ "text": { "content": `${homeTeam} vs ${awayTeam}` } }]
        },
        "主场": { "select": { "name": homeTeam } },
        "客场": { "select": { "name": awayTeam } },
        "比赛状态": { "status": { "name": "進行中" } },
        "主队小分": { "number": smallScoreHome },
        "客队小分": { "number": smallScoreAway },
        "主队大分": { "number": bigScoreHome },
        "客队大分": { "number": bigScoreAway },
        "raw_score": { "rich_text": [{ "text": { "content": rawScore } }] }
    };

    const contentBlocks = [];
    contentBlocks.push({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{ "type": "text", "text": { "content": "主队首发名单" } }]
        }
    })
    contentBlocks.push({
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{ "type": "text", "text": { "content": homeLineup || '未填写' } }]
        }
    })
    contentBlocks.push({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{ "type": "text", "text": { "content": "客队首发名单" } }]
        }
    })
    contentBlocks.push({
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{ "type": "text", "text": { "content": awayLineup || '未填写' } }]
        }
    })
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
            const homeTeamRole = game.role1;
            const text = homeTeamRole === '监管'
                ? `上半场 监${half1Result.home} : ${half1Result.away}求(${game.time1 || ''})`
                : `上半场 求${half1Result.home} : ${half1Result.away}监(${game.time1 || ''})`;

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
            const homeTeamRole = game.role2;
            const text = homeTeamRole === '监管'
                ? `下半场 监${half2Result.home} : ${half2Result.away}求(${game.time2 || ''})`
                : `下半场 求${half2Result.home} : ${half2Result.away}监(${game.time2 || ''})`;

            contentBlocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{ "type": "text", "text": { "content": text.replace(/\(\)/g, '') } }]
                }
            });
        }

        if (half1Result.valid || half2Result.valid) {
            const roundSmallScoreHome = half1Result.home + half2Result.home;
            const roundSmallScoreAway = half1Result.away + half2Result.away;
            contentBlocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": { "content": `${roundSmallScoreHome} : ${roundSmallScoreAway}` }
                    }]
                }
            });
        }
    });

    contentBlocks.push({
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{ "type": "text", "text": { "content": " " } }]
        }
    });

    contentBlocks.push({
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                { "type": "text", 
                    "text": { "content": 
                        `大分 ${bigScoreHome} : ${bigScoreAway}，小分 ${smallScoreHome} : ${smallScoreAway}` 
                    } 
                },
            ]
        }
    });

    const payload = {
        properties: pageProperties,
        children: contentBlocks
    };

    // DEBUG: console.log("直接生成给Notion API的最终Payload:", JSON.stringify(payload, null, 2));
    return payload;
}


// --- 5. EVENT HANDLERS ---

function bindLoginEventListeners() {
    console.log("绑定登录事件监听器...");
    if (elements.accountLoginTab) elements.accountLoginTab.addEventListener('click', showAccountLogin);
    if (elements.tokenLoginTab) elements.tokenLoginTab.addEventListener('click', showTokenLogin);
    if (elements.tokenLoginButton) elements.tokenLoginButton.addEventListener('click', handleTokenLogin);
    if (elements.tokenInput) {
        elements.tokenInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleTokenLogin();
            }
        });
    }
}

function bindEventListeners() {
    console.log("绑定所有事件监听器...");
    Object.entries(elements).forEach(([key, el]) => {
        if (!el) console.warn(`Element not found for: ${key}`);
    });

    if (elements.nextButton) elements.nextButton.addEventListener('click', handleNextStep);
    if (elements.restoreButton) elements.restoreButton.addEventListener('click', handleRestoreState);
    if (elements.addBoButton) elements.addBoButton.addEventListener('click', handleAddBo);
    if (elements.addTiebreakerButton) elements.addTiebreakerButton.addEventListener('click', handleAddTiebreaker);
    
    if (elements.sendToNotionButton) elements.sendToNotionButton.addEventListener('click', handleSendToNotion);
    if (elements.matchesContainer) {
        elements.matchesContainer.addEventListener('change', handleGameInputChange);
        elements.matchesContainer.addEventListener('input', handleGameInputChange);
        elements.matchesContainer.addEventListener('focusout', handleInputBlur);
        elements.matchesContainer.addEventListener('click', handleCopySummary);
    }
    
    if (elements.verifyDatabaseButton) {
        elements.verifyDatabaseButton.addEventListener('click', handleVerifyDatabase);
    }
    if (elements.changeDatabaseLink) {
        elements.changeDatabaseLink.addEventListener('click', handleChangeDatabase);
    }

    if (elements.cancelSendButton) elements.cancelSendButton.addEventListener('click', handleCancelSend);
    if (elements.confirmSendButton) elements.confirmSendButton.addEventListener('click', handleConfirmSend);

    if (elements.goToFillButton) elements.goToFillButton.addEventListener('click', handleGoToFill);
    if (elements.goToQueryButton) elements.goToQueryButton.addEventListener('click', handleGoToQuery);
    if (elements.backToChoiceFromFillButton) elements.backToChoiceFromFillButton.addEventListener('click', handleBackToChoice);
    if (elements.queryTeamSelect) elements.queryTeamSelect.addEventListener('change', handleQueryTeamSelect);
    if (elements.backToChoiceButton) elements.backToChoiceButton.addEventListener('click', handleBackToChoice);
    if (elements.homeLineupInput) elements.homeLineupInput.addEventListener('input', handleLineupInputChange);
    if (elements.awayLineupInput) elements.awayLineupInput.addEventListener('input', handleLineupInputChange);
    if (elements.reviewMatchButton) elements.reviewMatchButton.addEventListener('click', handleReviewMatch);
    if (elements.continueSubmitButton) elements.continueSubmitButton.addEventListener('click', handleContinueSubmit);
}

// Token login functions
function showAccountLogin() {
    elements.accountLoginTab.className = 'btn btn-primary';
    elements.tokenLoginTab.className = 'btn btn-secondary';
    elements.accountLoginPanel.style.display = 'block';
    elements.tokenLoginPanel.style.display = 'none';
    
    // 只有在需要时才挂载Clerk组件，避免重复
    if (clerk && clerk.loaded && elements.clerkSigninComponent && !elements.clerkSigninComponent.hasChildNodes()) {
        clerk.mountSignIn(elements.clerkSigninComponent);
    }
    hideTokenError();
}

function showTokenLogin() {
    elements.accountLoginTab.className = 'btn btn-secondary';
    elements.tokenLoginTab.className = 'btn btn-primary';
    elements.accountLoginPanel.style.display = 'none';
    elements.tokenLoginPanel.style.display = 'block';
}

function hideTokenError() {
    if (elements.tokenError) {
        elements.tokenError.style.display = 'none';
        elements.tokenError.textContent = '';
    }
}

function showTokenError(message) {
    if (elements.tokenError) {
        elements.tokenError.textContent = message;
        elements.tokenError.style.display = 'block';
    }
}

async function handleTokenLogin() {
    const token = elements.tokenInput ? elements.tokenInput.value.trim() : '';
    
    if (!token) {
        showTokenError('请输入访问令牌');
        return;
    }

    hideTokenError();
    elements.tokenLoginButton.disabled = true;
    elements.tokenLoginButton.textContent = '验证中...';

    try {
        const response = await fetch('/api/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '令牌验证失败');
        }

        // 保存令牌用户信息
        tokenUser = data.user;
        tokenUser._isTokenUser = true;
        tokenUser._token = token;
        
        // Persist token user to localStorage
        localStorage.setItem('tokenUser', JSON.stringify(tokenUser));
        
        console.log('令牌登录成功:', tokenUser);
        
        // 更新问候语
        updateGreeting(tokenUser);
        
        // 检查是否已有数据库ID
        const savedDatabaseId = localStorage.getItem('notionDatabaseId');
        if (savedDatabaseId) {
            STATE.databaseId = savedDatabaseId;
            try {
                const isValid = await verifyDatabaseId(savedDatabaseId);
                if (isValid) {
                    showStage('choice-stage');
                } else {
                    showStage('database-id-container');
                }
            } catch (error) {
                console.error('Database verification error:', error);
                showStage('database-id-container');
            }
        } else {
            showStage('database-id-container');
        }
        
        // 初始化应用（如果尚未初始化）
        if (!isAppInitialized) {
            initializeApp();
        }

    } catch (error) {
        console.error('Token login error:', error);
        showTokenError(error.message || '令牌验证失败');
    } finally {
        elements.tokenLoginButton.disabled = false;
        elements.tokenLoginButton.textContent = '验证令牌并登录';
    }
}

function getCurrentUser() {
    if (tokenUser) {
        return tokenUser;
    }
    if (clerk && clerk.user) {
        return clerk.user;
    }
    return null;
}

async function getAuthToken() {
    if (tokenUser && tokenUser._token) {
        return tokenUser._token;
    }
    if (clerk && clerk.session) {
        return await clerk.session.getToken();
    }
    throw new Error('未找到有效的认证信息');
}

async function checkMatchExists(homeTeam, awayTeam) {
    try {
        const token = await getAuthToken();
        const databaseId = STATE.databaseId;
        const response = await fetch(`/api/check-match?databaseId=${databaseId}&homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '检查比赛是否存在时出错');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('检查比赛是否存在时出错:', error);
        alert(`检查比赛时出错: ${error.message}`);
        return { exists: false }; // 发生错误时假定比赛不存在，以免阻塞用户
    }
}

function handleChangeDatabase(e) {
    e.preventDefault();

    localStorage.removeItem('notionDatabaseId');
    STATE.databaseId = '';
    STATE.databaseTitle = '';

    elements.databaseIdInput.value = '';
    elements.databaseTitle.textContent = '';
    elements.changeDatabaseContainer.style.display = 'none';
    
    showDatabaseIdContainer();
}

function handleNextStep() {
    const homeTeam = elements.homeTeamSelect.value;
    const awayTeam = elements.awayTeamSelect.value;

    if (!homeTeam || !awayTeam) {
        alert('请选择队伍');
        return;
    }
    if (homeTeam === awayTeam) {
        alert('主队和客队不能相同');
        return;
    }

    checkMatchExists(homeTeam, awayTeam).then(({ exists }) => {
        if (!exists) {
            showStage('match-exists-confirmation-stage');
        } else {
            proceedToFillForm();
        }
    });
}

function proceedToFillForm() {
    const homeTeam = elements.homeTeamSelect.value;
    const awayTeam = elements.awayTeamSelect.value;
    const matchMode = elements.matchModeSelect.querySelector('input:checked').value;

    STATE.homeTeam = homeTeam;
    STATE.awayTeam = awayTeam;
    STATE.matchMode = matchMode;

    STATE.homeLineup = '';
    STATE.awayLineup = '';
    elements.homeLineupInput.value = '';
    elements.awayLineupInput.value = '';
    elements.homeLineupLabel.textContent = `${homeTeam} 首发名单：`;
    elements.awayLineupLabel.textContent = `${awayTeam} 首发名单：`;


    STATE.games = [];
    const initialGameCount = MATCH_MODES[matchMode].initialGames;
    for (let i = 1; i <= initialGameCount; i++) {
        STATE.games.push({ id: `bo${i}` });
    }

    showStage('output-stage');
    elements.matchTitle.textContent = `${homeTeam} vs ${awayTeam}`;

    render();
}

function handleReviewMatch() {
    showStage('input-stage');
}

function handleContinueSubmit() {
    proceedToFillForm();
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
        render();
    } else if (target.classList.contains('time-input')) {
        game[`time${half}`] = target.value;
        saveStateToLocalStorage();
    }
}

function handleCopySummary(e) {
    const target = e.target;
    if (!target.classList.contains('btn-copy')) return;

    const summaryContainer = target.closest('.summary-container');
    if (!summaryContainer) return;

    const textarea = summaryContainer.querySelector('.summary-text');
    if (!textarea) return;

    navigator.clipboard.writeText(textarea.value).then(() => {
        const originalText = target.textContent;
        target.textContent = '已复制!';
        setTimeout(() => {
            target.textContent = originalText;
        }, 1500);
    }).catch(err => {
        console.error('无法复制文本: ', err);
        alert('复制失败，请手动复制。');
    });
}

function handleLineupInputChange(e) {
    if (e.target.id === 'home-lineup') {
        STATE.homeLineup = e.target.value;
    } else {
        STATE.awayLineup = e.target.value;
    }
    saveStateToLocalStorage();
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



function handleSendToNotion() {
    const summaryHTML = generateConfirmationHTML();
    elements.confirmationSummary.innerHTML = summaryHTML;
    showStage('confirmation-stage');
}

/**
 * 返回修改
 */
function handleCancelSend() {
    showStage('output-stage');
}

/**
 * 执行发送逻辑
 */
async function handleConfirmSend() {
    if (!getCurrentUser()) {
        alert('请先登录。');
        return;
    }
    
    if (!STATE.databaseId) {
        alert('请先输入有效的数据库ID。');
        return;
    }
    
    elements.confirmSendButton.disabled = true;
    elements.confirmSendButton.textContent = '发送中...';

    const data = collectDataForNotion();
    data.homeLineup = STATE.homeLineup;
    data.awayLineup = STATE.awayLineup;

    try {
        const token = await getAuthToken();
        
        // 在发送前再次检查是否存在以获取 pageId
        const { exists, pageId } = await checkMatchExists(STATE.homeTeam, STATE.awayTeam);
        if (exists) {
            data.pageId = pageId;
        }

        const response = await fetch('/api/send-to-notion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Database-ID': STATE.databaseId
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('成功发送到Notion！');
            showStage('input-stage');
            // 清理状态以便开始新的输入
            STATE.homeTeam = '';
            STATE.awayTeam = '';
            elements.homeTeamSelect.value = '';
            elements.awayTeamSelect.value = '';
        } else {
            const errorResult = await response.json();
            alert(`发送失败: ${errorResult.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('发送请求时出错:', error);
        alert('发送请求时发生网络错误。');
    } finally {
        elements.confirmSendButton.disabled = false;
        elements.confirmSendButton.textContent = '确认无误并发送';
    }
}


// --- 6. DATA PERSISTENCE ---

function saveStateToLocalStorage() {
    localStorage.setItem('matchData', JSON.stringify(STATE));
}

function handleRestoreState() {
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        STATE = JSON.parse(savedData);

        elements.homeTeamSelect.value = STATE.homeTeam;
        elements.awayTeamSelect.value = STATE.awayTeam;
        const matchModeRadio = elements.matchModeSelect.querySelector(`input[value="${STATE.matchMode}"]`);
        if (matchModeRadio) matchModeRadio.checked = true;

        if (elements.homeLineupInput) {
            elements.homeLineupInput.value = STATE.homeLineup || '';
            elements.homeLineupLabel.textContent = `${STATE.homeTeam || '主队'} 首发名单：`;
        }
        if (elements.awayLineupInput) {
            elements.awayLineupInput.value = STATE.awayLineup || '';
            elements.awayLineupLabel.textContent = `${STATE.awayTeam || '客队'} 首发名单：`;
        }

        elements.inputStage.classList.remove('active-stage');
        elements.outputStage.classList.add('active-stage');
        elements.matchTitle.textContent = `${STATE.homeTeam} vs ${STATE.awayTeam}`;
        
        render();
        
        alert('已成功恢复上次的数据。');

    } else {
        alert('没有找到任何保存的数据。');
    }
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    
    console.log("正在登出...");

    // 清除令牌用户状态
    tokenUser = null;
    localStorage.removeItem('tokenUser');
    
    // 清除数据库ID
    localStorage.removeItem('notionDatabaseId');

    // 如果是Clerk用户，执行登出
    if (clerk && clerk.user) {
        await clerk.signOut();
    }

    // 刷新页面
    window.location.reload();
}

function updateGreeting(user) {
    const greetingContainers = [
        elements.greetingMessage,
        elements.dbGreetingMessage,
        elements.choiceGreetingMessage
    ];

    if (!user) {
        greetingContainers.forEach(container => {
            if (container) {
                const textEl = container.querySelector('.greeting-text');
                const linkContainer = container.querySelector('.logout-link-container');
                if (textEl) textEl.textContent = '';
                if (linkContainer) linkContainer.style.display = 'none';
            }
        });
        return;
    }

    const hour = new Date().getHours();
    let greetingText;
    if (hour >= 0 && hour < 6) {
        greetingText = '夜深了';
    } else if (hour >= 6 && hour < 11) {
        greetingText = '早上好';
    } else if (hour >= 11 && hour < 14) {
        greetingText = '中午好';
    } else if (hour >= 14 && hour < 19) {
        greetingText = '下午好';
    } else { // 19-24
        greetingText = '晚上好';
    }

    const username = user.username || user.id;
    const fullGreeting = `${greetingText}，${username}`;

    greetingContainers.forEach(container => {
        if (container) {
            const textEl = container.querySelector('.greeting-text');
            const linkContainer = container.querySelector('.logout-link-container');
            const logoutLink = container.querySelector('.logout-link');

            if (textEl) textEl.textContent = fullGreeting;
            if (linkContainer) linkContainer.style.display = 'inline';
            if (logoutLink) {
                logoutLink.removeEventListener('click', handleLogout); // 避免重复绑定
                logoutLink.addEventListener('click', handleLogout);
            }
        }
    });
    
    createWatermark(user);
}


/**
 * 创建页面水印
 * @param {Object} user - 用户信息对象
 */
function createWatermark(user) {
    if (!user) return;
    
    const oldWatermark = document.querySelector('.watermark-container');
    if (oldWatermark) {
        document.body.removeChild(oldWatermark);
    }
    
    const userId = user.id;
    const username = user.username || userId;
    
    const container = document.createElement('div');
    container.className = 'watermark-container';
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const spacingY = 140;
    const spacingX = 130;
    
    for (let y = -screenHeight; y < screenHeight * 2; y += spacingY) {
        for (let x = -screenWidth; x < screenWidth * 2; x += spacingX) {
            const watermark = document.createElement('div');
            watermark.className = 'watermark';
            
            const usernameSpan = document.createElement('div');
            usernameSpan.textContent = username;
            usernameSpan.style.textAlign = 'center';
            
            const userIdSpan = document.createElement('div');
            userIdSpan.textContent = userId;
            userIdSpan.style.textAlign = 'center';
            userIdSpan.style.fontSize = '10px';
            
            watermark.appendChild(usernameSpan);
            watermark.appendChild(userIdSpan);
            
            // 随机偏移
            const randomOffsetY = Math.floor(Math.random() * 80) - 40;
            const randomOffsetX = Math.floor(Math.random() * 40) - 20;
            
            watermark.style.left = `${x + randomOffsetX}px`;
            watermark.style.top = `${y + randomOffsetY}px`;
            container.appendChild(watermark);
        }
    }
    
    document.body.appendChild(container);
    
    window.addEventListener('resize', () => {
        createWatermark(user);
    });
}

function handleInputBlur(e) {
    const target = e.target;
    if (target.classList.contains('time-input')) {
        render();
    }
}

/**
 * 处理数据库ID验证按钮点击事件
 */
async function handleVerifyDatabase() {
    const databaseId = elements.databaseIdInput.value.trim();
    
    if (!databaseId) {
        showDatabaseError('请输入数据库ID');
        return;
    }
    
    elements.verifyDatabaseButton.disabled = true;
    elements.verifyDatabaseButton.textContent = '验证中...';
    
    try {
        const isValid = await verifyDatabaseId(databaseId);
        
        if (isValid) {
            STATE.databaseId = databaseId;
            showStage('choice-stage');
            elements.choiceDbTitle.textContent = `当前数据库: ${STATE.databaseTitle}`;
        } else {
            showDatabaseError('数据库ID错误，请二次核对');
        }
    } catch (error) {
        showDatabaseError('验证过程中出错，请稍后重试');
        console.error(error);
    } finally {
        elements.verifyDatabaseButton.disabled = false;
        elements.verifyDatabaseButton.innerHTML = '验证并继续 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>';
    }
}

function handleGoToFill() {
    showStage('input-stage');
}

function handleBackToChoice() {
    // 清理状态
    elements.queryResultContainer.innerHTML = '';
    if(elements.queryTeamSelect) elements.queryTeamSelect.value = '';

    STATE.homeTeam = '';
    STATE.awayTeam = '';
    STATE.games = [];
    STATE.homeLineup = '';
    STATE.awayLineup = '';
    elements.homeTeamSelect.value = '';
    elements.awayTeamSelect.value = '';
    elements.homeLineupInput.value = '';
    elements.awayLineupInput.value = '';
    elements.matchTitle.textContent = '';
    elements.matchesContainer.innerHTML = '';
    render();

    showStage('choice-stage');
}


/**
 * 显示数据库ID错误信息
 * @param {string} message - 错误信息
 */
function showDatabaseError(message) {
    elements.databaseError.textContent = message;
    elements.databaseError.style.display = 'block';
    
    setTimeout(() => {
        elements.databaseError.style.display = 'none';
    }, 3000);
}

/**
 * 生成用于确认页面的HTML内容
 * @returns {string} - HTML字符串
 */
function generateConfirmationHTML() {
    const { homeTeam, awayTeam, games, homeLineup, awayLineup} = STATE;
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway } = calculateScores();

    let winner = null;
    if (bigScoreHome > bigScoreAway) {
        winner = 'home';
    } else if (bigScoreAway > bigScoreHome) {
        winner = 'away';
    } else if (smallScoreHome > smallScoreAway) {
        winner = 'home';
    } else if (smallScoreAway > smallScoreHome) {
        winner = 'away';
    }

    const homeHighlight = winner === 'home' ? 'style="color: var(--color-accent);"' : '';
    const awayHighlight = winner === 'away' ? 'style="color: var(--color-accent);"' : '';

    let html = `<h3><span ${homeHighlight}>${homeTeam}</span> vs <span ${awayHighlight}>${awayTeam}</span></h3>`;

    html += `<div class="lineup-confirmation" style="margin-bottom: 20px;">
                <p><strong>${homeTeam}首发：</strong><br>${homeLineup.replace(/\n/g, '<br>')}</p>
                <p><strong>${awayTeam}首发：</strong><br>${awayLineup.replace(/\n/g, '<br>')}</p>
             </div>`;

    const RESULT_TEXT_MAP = {
        hunter: { '4': '四杀', '3': '三杀', '2': '平局', '1': '一杀', '0': '零杀' },
        survivor: { '4': '四跑', '3': '三跑', '2': '平局', '1': '一跑', '0': '零跑' }
    };
    
    games.forEach(game => {
        if (!game.role1 && !game.role2) return;

        html += `<h4>${game.id.toUpperCase()}</h4>`;
        
        let gameScoreHome = 0;
        let gameScoreAway = 0;

        // 上半
        if (game.role1 && game.result1) {
            const homeRole = game.role1;
            const awayRole = homeRole === ROLES.hunter ? ROLES.survivor : ROLES.hunter;
            const resultText = RESULT_TEXT_MAP[homeRole === ROLES.hunter ? 'hunter' : 'survivor'][game.result1];
            const timeText = game.id === 'tiebreaker' && game.time1 ? `，对局时长 ${game.time1} 秒` : '';
            html += `<p>上半：${homeTeam}的<strong>${homeRole}</strong> vs ${awayTeam}的<strong>${awayRole}</strong>，结果为<strong>${resultText}</strong>${timeText}。</p>`;
            
            const half1Scores = getHalfScores(game, 1);
            gameScoreHome += half1Scores.home;
            gameScoreAway += half1Scores.away;
        }

        // 下半
        if (game.role2 && game.result2) {
            const homeRole = game.role2;
            const awayRole = homeRole === ROLES.hunter ? ROLES.survivor : ROLES.hunter;
            const resultText = RESULT_TEXT_MAP[homeRole === ROLES.hunter ? 'hunter' : 'survivor'][game.result2];
            const timeText = game.id === 'tiebreaker' && game.time2 ? `，对局时长 ${game.time2} 秒` : '';
            html += `<p>下半：${homeTeam}的<strong>${homeRole}</strong> vs ${awayTeam}的<strong>${awayRole}</strong>，结果为<strong>${resultText}</strong>${timeText}。</p>`;

            const half2Scores = getHalfScores(game, 2);
            gameScoreHome += half2Scores.home;
            gameScoreAway += half2Scores.away;
        }

        html += `<p>本轮比分：<strong>${gameScoreHome} : ${gameScoreAway}</strong></p>`;
    });

    // 最终总结
    let winnerText = '';
    if (winner === 'home') {
        winnerText = `<strong><span ${homeHighlight}>${homeTeam}</span></strong> 取得比赛的胜利。`;
    } else if (winner === 'away') {
        winnerText = `<strong><span ${awayHighlight}>${awayTeam}</span></strong> 取得比赛的胜利。`;
    } else {
        winnerText = '请人工核对加赛信息。';
    }

    html += `<div class="final-summary">
        <p>大分 <strong>${bigScoreHome} : ${bigScoreAway}</strong>，小分 <strong>${smallScoreHome} : ${smallScoreAway}</strong>，${winnerText}</p>
    </div>`;

    return html;
}

async function handleGoToQuery() {
    showStage('query-stage');
    
    try {
        if (!getCurrentUser()) {
            alert("请先登录！");
            showStage('choice-stage');
            return;
        }
        const token = await getAuthToken();
        const response = await fetch(`/api/get-teams?databaseId=${STATE.databaseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('获取队伍列表失败');
        }

        const { teams } = await response.json();
        const optionsHTML = teams.map(team => `<option value="${team}">${team}</option>`).join('');
        elements.queryTeamSelect.innerHTML = `<option value="" disabled selected>请选择队伍进行查询</option>${optionsHTML}`;

    } catch (error) {
        console.error('获取队伍列表时出错:', error);
        alert('加载队伍列表失败，请稍后重试或检查数据库ID是否正确。');
    }
}


/**
 * 处理查询队伍选择事件
 */
async function handleQueryTeamSelect(e) {
    const teamName = e.target.value;
    if (!teamName) return;

    elements.queryResultContainer.innerHTML = '<p>查询中...</p>';

    try {
        const token = await getAuthToken();
        const response = await fetch(`/api/get-results?databaseId=${STATE.databaseId}&team=${encodeURIComponent(teamName)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('获取赛果失败');
        }

        const { results } = await response.json();
        renderQueryResults(results);

    } catch (error) {
        console.error('获取赛果时出错:', error);
        elements.queryResultContainer.innerHTML = '<p style="color:red;">查询失败，请检查网络或联系管理员。</p>';
    }
}


/**
 * 渲染查询结果
 * @param {Array} results - Notion返回的页面对象数组
 * @param {string} selectedTeam - 当前查询的队伍名
 */
function renderQueryResults(results) {
    if (results.length === 0) {
        elements.queryResultContainer.innerHTML = '<p>未找到该队伍的比赛记录。</p>';
        return;
    }

    const html = results.map(page => {
        const props = page.properties;
        const title = props['标题']?.title[0]?.plain_text || '无标题';
        const date = props['日期']?.date?.start || '无日期';
        
        let resultText = '';
        if (page.children) {
            page.children.forEach(block => {
                if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
                    resultText += `<p>${block.paragraph.rich_text[0].plain_text}</p>`;
                }
            });
        }
        
        return `
            <div class="game-instance">
                <h4>${title} (${date})</h4>
                <div>${resultText}</div>
            </div>
        `;
    }).join('');

    elements.queryResultContainer.innerHTML = html;
}

/**
 * 处理返回按钮点击事件
 */
function handleBackToInput() {
    elements.queryStage.classList.remove('active-stage');
    elements.inputStage.classList.add('active-stage');
    elements.queryResultContainer.innerHTML = '';
    elements.queryTeamSelect.value = '';
}

// --- 7. INITIALIZATION ---
bindLoginEventListeners();
window.addEventListener('load', startClerk);
