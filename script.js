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
    guestLineup: '',
    matchMode: 'bo5',
    games: [], // { id: 'bo1', role1: '', result1: '', role2: '', result2: '', time1: '', time2: '' }
    databaseId: '',
    databaseTitle: ''
};

let obsWindow = null;
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
    guestLineupInput: document.getElementById('guest-lineup'),
    homeLineupLabel: document.getElementById('home-lineup-label'),
    guestLineupLabel: document.getElementById('guest-lineup-label'),
    // 按钮
    nextButton: document.getElementById('next-button'),
    restoreButton: document.getElementById('restore-button'),
    obsWindowButton: document.getElementById('open-obs-window'),
    intermissionButton: document.getElementById('toggle-intermission'),
    matchEndButton: document.getElementById('toggle-match-end'),
    sendToNotionButton: document.getElementById('send-to-notion-button'),
    // login
    loginContainer: document.getElementById('login-container'),
    clerkSigninComponent: document.getElementById('clerk-signin'),
    userButtonComponent: document.getElementById('user-button'),
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
            
            clerk.mountUserButton(elements.userButtonComponent);
            updateGreeting(clerk.user);
            if (!isAppInitialized) {
                initializeApp();
            }
        } else {
            showStage('login-container');
            clerk.mountSignIn(elements.clerkSigninComponent);
            updateGreeting(null);
        }
    };

    clerk.addListener(({ user }) => {
        console.log("Clerk 监听到状态变化，当前用户:", user ? user.id : '未登录');
        updateUI();
    });

    updateUI();
}

/**
 * 页面切换的辅助函数
 * @param {string} stageId 要显示的页面的ID
 */
function showStage(stageId) {
    const stages = ['login-container', 'database-id-container', 'choice-stage', 'app-container'];
    stages.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === stageId) {
                el.style.display = 'block';
                if(el.classList.contains('card')) {
                    el.classList.add('active-stage');
                }
            } else {
                el.style.display = 'none';
                if(el.classList.contains('card')) {
                    el.classList.remove('active-stage');
                }
            }
        }
    });

    if (stageId === 'app-container') {
        elements.appContainer.style.display = 'block';
        elements.inputStage.classList.add('active-stage');
        elements.outputStage.classList.remove('active-stage');
        elements.queryStage.classList.remove('active-stage');
    } else if (stageId === 'query-stage') {
        elements.appContainer.style.display = 'block';
        elements.inputStage.classList.remove('active-stage');
        elements.outputStage.classList.remove('active-stage');
        elements.queryStage.classList.add('active-stage');
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
        if (!clerk.user) {
            return false;
        }

        const token = await clerk.session.getToken();
        
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

/**
 * 检测当前设备是否为电脑
 * @returns {boolean} 如果是桌面设备，则返回true，否则返回false
 */
function isDesktopDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk|mobile safari|iemobile/.test(userAgent);
    return !isMobile;
}

// --- 应用初始化函数 ---
function initializeApp() {
    if (isAppInitialized) return;
    console.log("应用首次初始化...");
    const optionsHTML = SCHOOLS.map(school => `<option value="${school}">${school}</option>`).join('');
    elements.homeTeamSelect.innerHTML = `<option value="" disabled selected>请选择主场队伍</option>${optionsHTML}`;
    elements.awayTeamSelect.innerHTML = `<option value="" disabled selected>请选择客场队伍</option>${optionsHTML}`;

    if (!isDesktopDevice()) {
        elements.obsWindowButton.style.display = 'none';
    }

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
                ${STATE.homeTeam}（<select class="role-select" data-half="${half}">
                    <option value="">---</option>
                    ${roleOptions}
                </select>）
                游戏结果：<select class="score-select" data-half="${half}">
                    <option value="">---</option>
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
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway, gameDetails } = calculateScores();

    let winningTeam = null;
    if (STATE.isMatchEnd) {
        if (bigScoreHome !== bigScoreAway) {
            winningTeam = bigScoreHome > bigScoreAway ? 'home' : 'away';
        } else if (smallScoreHome !== smallScoreAway) {
            winningTeam = smallScoreHome > smallScoreAway ? 'home' : 'away';
        }
    }

    const homeHighlight = winningTeam === 'home' ? 'class="highlight"' : '';
    const awayHighlight = winningTeam === 'away' ? 'class="highlight"' : '';

    const headerHTML = `
        <div class="match-header" style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 26px;">
                <span ${homeHighlight}>${STATE.homeTeam}</span> vs <span ${awayHighlight}>${STATE.awayTeam}</span>
            </h2>
            <div class="big-score" style="font-size: 22px; margin: 2px 0;">大分 ${bigScoreHome}:${bigScoreAway}</div>
            <div class="small-score" style="font-size: 18px; margin: 2px 0;">小分 ${smallScoreHome}:${smallScoreAway}</div>
            ${STATE.isIntermission ? '<div class="intermission-alert" style="color: #ffeb3b; font-size: 18px;">场间休息中，请耐心等待～</div>' : ''}
        </div>
    `;

    const tableHeaders = gameDetails.map(g => `<th colspan="2">${g.label}</th>`).join('');
    const halfHeaders = gameDetails.map(() => `<th>上半</th><th>下半</th>`).join('');

    const homeTeamRow = gameDetails.map(g => `<td ${homeHighlight}>${g.home1}</td><td ${homeHighlight}>${g.home2}</td>`).join('');
    const awayTeamRow = gameDetails.map(g => `<td ${awayHighlight}>${g.away1}</td><td ${awayHighlight}>${g.away2}</td>`).join('');

    elements.resultsContainer.innerHTML = `
        <div style="padding: 0 25px; overflow-x:auto;">
            ${headerHTML}
            <table id="obs-new-table" border="1" cellspacing="0" cellpadding="5" style="width:100%; margin:0 auto;">
                <thead>
                    <tr><th rowspan="2">学校/队伍</th>${tableHeaders}</tr>
                    <tr>${halfHeaders}</tr>
                </thead>
                <tbody>
                    <tr><td ${homeHighlight}>${STATE.homeTeam}</td>${homeTeamRow}</tr>
                    <tr><td ${awayHighlight}>${STATE.awayTeam}</td>${awayTeamRow}</tr>
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

        if (half1.valid && half2.valid) {
            const totalHome = half1.home + half2.home;
            const totalAway = half1.away + half2.away;
            if (totalHome > totalAway) bigScoreHome++;
            else if (totalAway > totalHome) bigScoreAway++;
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
 * 收集并直接格式化为 Notion API pages.create 方法所需的 JSON 格式
 * @returns {object} 一个包含 properties 和 children 的对象
 */
function collectDataForNotion() {
    const { homeTeam, awayTeam, homeLineup, guestLineup } = STATE;
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway } = calculateScores();

    const pageProperties = {
        "标题": {
            "title": [{ "text": { "content": `${homeTeam} vs ${awayTeam}` } }]
        },
        "主场": { "select": { "name": homeTeam } },
        "客场": { "select": { "name": awayTeam } },
        "比赛状态": { "status": { "name": "已结束" } },
        "日期": { "date": { "start": new Date().toISOString().split('T')[0] } },
        "主队小分": { "number": smallScoreHome },
        "客队小分": { "number": smallScoreAway },
        "主队大分": { "number": bigScoreHome },
        "客队大分": { "number": bigScoreAway },
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
            "rich_text": [{ "type": "text", "text": { "content": guestLineup || '未填写' } }]
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
        elements.matchesContainer.addEventListener('focusout', handleInputBlur);
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
    if (elements.guestLineupInput) elements.guestLineupInput.addEventListener('input', handleLineupInputChange);



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
    const matchMode = elements.matchModeSelect.querySelector('input:checked').value;

    if (!homeTeam || !awayTeam) {
        alert('请选择队伍');
        return;
    }

    STATE.homeTeam = homeTeam;
    STATE.awayTeam = awayTeam;
    STATE.matchMode = matchMode;

    STATE.homeLineup = '';
    STATE.guestLineup = '';
    elements.homeLineupInput.value = '';
    elements.guestLineupInput.value = '';
    elements.homeLineupLabel.textContent = `${homeTeam} 首发名单：`;
    elements.guestLineupLabel.textContent = `${awayTeam} 首发名单：`;


    STATE.games = [];
    const initialGameCount = MATCH_MODES[matchMode].initialGames;
    for (let i = 1; i <= initialGameCount; i++) {
        STATE.games.push({ id: `bo${i}` });
    }

    elements.inputStage.classList.remove('active-stage');
    elements.outputStage.classList.add('active-stage');
    elements.matchTitle.textContent = `${homeTeam} vs ${awayTeam}`;

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
        render();
    } else if (target.classList.contains('time-input')) {
        game[`time${half}`] = target.value;
        saveStateToLocalStorage();
        updateOBSWindow();
    }
}

function handleLineupInputChange(e) {
    if (e.target.id === 'home-lineup') {
        STATE.homeLineup = e.target.value;
    } else {
        STATE.guestLineup = e.target.value;
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

/**
 * 显示确认页面
 */
function handleSendToNotion() {
    if (!STATE.isMatchEnd) {
        alert('请先点击“比赛结束”按钮。');
        return;
    }
    const summaryHTML = generateConfirmationHTML();
    elements.confirmationSummary.innerHTML = summaryHTML;

    elements.outputStage.classList.remove('active-stage');
    elements.confirmationStage.classList.add('active-stage');
}

/**
 * 返回修改
 */
function handleCancelSend() {
    elements.confirmationStage.classList.remove('active-stage');
    elements.outputStage.classList.add('active-stage');
}

/**
 * 执行发送逻辑
 */
async function handleConfirmSend() {
    if (!clerk.user) {
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

    try {
        const token = await clerk.session.getToken();

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
            elements.confirmationStage.classList.remove('active-stage');
            elements.inputStage.classList.add('active-stage');
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


// --- 6. DATA PERSISTENCE & OBS WINDOW ---

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
        if (elements.guestLineupInput) {
            elements.guestLineupInput.value = STATE.guestLineup || '';
            elements.guestLineupLabel.textContent = `${STATE.awayTeam || '客队'} 首发名单：`;
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
                
                /* OBS窗口的水印样式 */
                .watermark-container {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  pointer-events: none;
                  z-index: 1000;
                  overflow: hidden;
                }
                
                .watermark {
                  position: absolute;
                  font-family: var(--font-home);
                  color: rgba(255, 255, 255, 0.15);
                  font-size: 12px;
                  transform: rotate(45deg);
                  white-space: nowrap;
                  user-select: none;
                  text-align: center;
                  line-height: 1.5;
                  display: flex;
                  flex-direction: column;
                  gap: 2px;
                  width: 140px;
                }
            </style></head><body><div id="background-overlay"></div><div id="obs-results"></div></body></html>
        `);
        obsWindow.document.close();
        setTimeout(() => {
            updateOBSWindow();
            if (clerk && clerk.user) {
                createOBSWatermark(clerk.user);
                
                obsWindow.addEventListener('resize', () => {
                    if (clerk && clerk.user) {
                        createOBSWatermark(clerk.user);
                    }
                });
            }
        }, 100);
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

/**
 * 为OBS窗口创建水印
 * @param {Object} user - 用户信息对象
 */
function createOBSWatermark(user) {
    if (!obsWindow || obsWindow.closed || !user) return;
    
    const oldWatermark = obsWindow.document.querySelector('.watermark-container');
    if (oldWatermark) {
        obsWindow.document.body.removeChild(oldWatermark);
    }
    
    const userId = user.id;
    const username = user.username || userId;
    
    const container = obsWindow.document.createElement('div');
    container.className = 'watermark-container';
    
    const screenWidth = obsWindow.innerWidth;
    const screenHeight = obsWindow.innerHeight;
    const spacingY = 140;
    const spacingX = 130; 
    
    for (let y = -screenHeight; y < screenHeight * 2; y += spacingY) {
        for (let x = -screenWidth; x < screenWidth * 2; x += spacingX) {
            const watermark = obsWindow.document.createElement('div');
            watermark.className = 'watermark';
            
            const usernameSpan = obsWindow.document.createElement('div');
            usernameSpan.textContent = username;
            usernameSpan.style.textAlign = 'center';
            
            const userIdSpan = obsWindow.document.createElement('div');
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
    
    obsWindow.document.body.appendChild(container);
}

function updateGreeting(user) {
    if (!elements.greetingMessage || !elements.dbGreetingMessage || !elements.choiceGreetingMessage) return;

    if (!user) {
        elements.greetingMessage.textContent = '';
        elements.dbGreetingMessage.textContent = '';
        elements.choiceGreetingMessage.textContent = '';
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
    
    elements.greetingMessage.textContent = fullGreeting;
    elements.dbGreetingMessage.textContent = fullGreeting;
    elements.choiceGreetingMessage.textContent = fullGreeting;
    
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
    showStage('app-container');
    elements.inputStage.classList.add('active-stage');
    elements.outputStage.classList.remove('active-stage');
    elements.queryStage.classList.remove('active-stage');
}

function handleBackToChoice() {
    elements.appContainer.style.display = 'none';

    elements.inputStage.classList.remove('active-stage');
    elements.outputStage.classList.remove('active-stage');
    elements.queryStage.classList.remove('active-stage');

    elements.choiceStage.style.display = 'block';
    elements.choiceStage.classList.add('active-stage');

    elements.queryResultContainer.innerHTML = '';
    if(elements.queryTeamSelect) elements.queryTeamSelect.value = '';

    STATE.homeTeam = '';
    STATE.awayTeam = '';
    STATE.games = [];
    STATE.homeLineup = '';
    STATE.guestLineup = '';
    elements.homeTeamSelect.value = '';
    elements.awayTeamSelect.value = '';
    elements.homeLineupInput.value = '';
    elements.guestLineupInput.value = '';
    elements.matchTitle.textContent = '';
    elements.matchesContainer.innerHTML = '';
    render();
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
    const { homeTeam, awayTeam, games, homeLineup, guestLineup} = STATE;
    let html = `<h3>${homeTeam} vs ${awayTeam}</h3>`;

    html += `<div class="lineup-confirmation" style="margin-bottom: 20px;">
                <p><strong>${homeTeam}首发：</strong><br>${homeLineup.replace(/\n/g, '<br>')}</p>
                <p><strong>${awayTeam}首发：</strong><br>${guestLineup.replace(/\n/g, '<br>')}</p>
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
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway } = calculateScores();
    let winnerText = '';
    if (bigScoreHome > bigScoreAway || (bigScoreHome === bigScoreAway && smallScoreHome > smallScoreAway)) {
        winnerText = `<strong>${homeTeam}</strong> 取得比赛的胜利。`;
    } else if (bigScoreAway > bigScoreHome || (bigScoreAway === bigScoreHome && smallScoreAway > smallScoreHome)) {
        winnerText = `<strong>${awayTeam}</strong> 取得比赛的胜利。`;
    } else {
        winnerText = '请人工核对加赛信息。';
    }

    html += `<div class="final-summary">
        <p>比赛结束，大分 <strong>${bigScoreHome} : ${bigScoreAway}</strong>，小分 <strong>${smallScoreHome} : ${smallScoreAway}</strong>，${winnerText}</p>
    </div>`;

    return html;
}

/**
 * 处理“查询赛果”按钮点击事件
 */
async function handleGoToQuery() {
    elements.choiceStage.style.display = 'none';
    elements.choiceStage.classList.remove('active-stage');

    elements.appContainer.style.display = 'block';
    elements.queryStage.classList.add('active-stage');
    
    elements.inputStage.classList.remove('active-stage');
    elements.outputStage.classList.remove('active-stage');


    try {
        if (!clerk.user) {
            alert("请先登录！");
            handleBackToInput();
            return;
        }
        const token = await clerk.session.getToken();
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
        const token = await clerk.session.getToken();
        const response = await fetch(`/api/get-results?databaseId=${STATE.databaseId}&team=${encodeURIComponent(teamName)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('获取赛果失败');
        }

        const { results } = await response.json();
        renderQueryResults(results, teamName);

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
function renderQueryResults(results, selectedTeam) {
    if (results.length === 0) {
        elements.queryResultContainer.innerHTML = '<p>未找到该队伍的比赛记录。</p>';
        return;
    }

    const html = results.map(page => {
        const props = page.properties;
        const title = props['标题']?.title[0]?.plain_text || '无标题';
        const date = props['日期']?.date?.start || '无日期';
        const homeTeam = props['主场']?.select?.name || '';
        const awayTeam = props['客场']?.select?.name || '';
        
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

window.addEventListener('load', startClerk);
