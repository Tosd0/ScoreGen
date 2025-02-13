// 定义全局变量，用于OBS捕获窗口引用
let obsWindow = null;

document.addEventListener("DOMContentLoaded", function() {
    const schools = [
        "<联>醒",
        "北京市第三十五中学",
        "<联>上古神兽",
        "北大附中朝阳未来学校",
        "<联>QwQ",
        "北京教师进修学校"
    ];

    // 新增：绑定“打开OBS捕获窗口”按钮事件
    document.getElementById('open-obs-window').addEventListener('click', function() {
        if (!obsWindow || obsWindow.closed) {
            obsWindow = window.open("", "obsWindow", "width=1300,height=280");
            obsWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OBS捕获窗口</title>
  <!-- 引入与主页面相同的CSS（如果有的话） -->
  <link rel="stylesheet" href="styles.css">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      position: relative;
    }
    body {
      background: url('https://patchwiki.biligame.com/images/dwrg/c/c2/e11ewgd95uf04495nybhhkqev5sjo0j.png') no-repeat center center fixed;
      background-size: cover;
    }
    /* 遮罩层 */
    #background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);  /* 50% 不透明的黑色 */
      z-index: 1;
    }
    /* OBS 结果容器：内容层 */
    #obs-results {
      position: relative;
      z-index: 2; /* 确保内容在遮罩层之上 */
      display: flex;
      justify-content: center;  /* 水平居中 */
      align-items: center;      /* 垂直居中 */
      height: 100vh;
      box-sizing: border-box;
      padding: 25px;            /* 上下左右均留25px */
    }
    /* 表格整体设置 */
    #obs-results table {
        margin: 0 auto;
        border-collapse: separate;
        border: 1px solid #fff;
        color: #fff;
        background-color: transparent;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }

    /* 针对表头和单元格的额外设置 */
    #obs-results table th,
    #obs-results table td {
        border: 1px solid #fff;
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        background-color: transparent;
        padding: 5px;
    }
  </style>
</head>
<body>
  <!-- 遮罩层 -->
  <div id="background-overlay"></div>
  <!-- OBS 结果显示区域 -->
  <div id="obs-results"></div>
</body>
</html>`);
            obsWindow.document.close();
        } else {
            obsWindow.focus();
        }
    });

    const mainTeamSelect = document.getElementById('main-team');
    const subTeamSelect = document.getElementById('sub-team');

    // 初始化下拉框
    function populateSelectOptions(selectElement, options) {
        options.forEach(school => {
            const option = document.createElement('option');
            option.value = school;
            option.textContent = school;
            selectElement.appendChild(option);
        });
    }

    populateSelectOptions(mainTeamSelect, schools);
    populateSelectOptions(subTeamSelect, schools);

    document.getElementById('next-button').addEventListener('click', function() {
        const mainTeam = mainTeamSelect.value;
        const subTeam = subTeamSelect.value;

        if (mainTeam && subTeam) {
            document.getElementById('input-stage').style.display = 'none';
            document.getElementById('output-stage').style.display = 'block';
            document.getElementById('match-title').textContent = `${mainTeam} vs ${subTeam}`;
            document.getElementById('match-instructions').style.display = 'block';
            createBO('bo1', mainTeam, subTeam);
            createBO('bo2', mainTeam, subTeam);
            document.getElementById('add-bo').style.display = 'block';
            saveData();
        } else {
            alert('请选择队伍');
        }
    });

    document.getElementById('restore-button').addEventListener('click', restoreData);

    // 绑定按钮事件
    document.getElementById('toggle-intermission').addEventListener('click', toggleIntermission);
    document.getElementById('toggle-match-end').addEventListener('click', toggleMatchEnd);
});

let boCount = 2; // 初始已创建bo1和bo2

document.getElementById('add-bo').addEventListener('click', function() {
    boCount++;
    createBO(`bo${boCount}`, document.getElementById('main-team').value, document.getElementById('sub-team').value);
    if (document.getElementById(`bo${boCount}-header`)) {
        document.getElementById(`bo${boCount}-header`).style.display = 'table-cell';
        document.getElementById(`bo${boCount}-result1`).style.display = 'table-cell';
        document.getElementById(`bo${boCount}-result2`).style.display = 'table-cell';
    }
    if (boCount === 3) {
        document.getElementById('add-bo').style.display = 'none';
        document.getElementById('add-tiebreaker').style.display = 'block';
    }
    saveData();
});

document.getElementById('add-tiebreaker').addEventListener('click', function() {
    createTiebreaker(document.getElementById('main-team').value, document.getElementById('sub-team').value);
    if (document.getElementById('tiebreaker-header')) {
        document.getElementById('tiebreaker-header').style.display = 'table-cell';
        document.getElementById('tiebreaker-result1').style.display = 'table-cell';
        document.getElementById('tiebreaker-result2').style.display = 'table-cell';
    }
    document.getElementById('add-tiebreaker').style.display = 'none';
    saveData();
});

function restoreData() {
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Restoring data:', data);
        document.getElementById('main-team').value = data.mainTeam;
        document.getElementById('sub-team').value = data.subTeam;
        document.getElementById('next-button').click();
        setTimeout(() => {
            loadSavedData(data);
            displayRestoredData(data);
        }, 100);
    } else {
        alert('没有找到任何保存的数据。');
    }
}

function saveData() {
    const matchData = {
        mainTeam: document.getElementById('main-team').value,
        subTeam: document.getElementById('sub-team').value,
        bos: [],
        tiebreaker: null,
    };

    const boDivs = document.querySelectorAll('[id^=bo]');
    boDivs.forEach(boDiv => {
        const boId = boDiv.id;
        const role1 = document.querySelector(`select[data-result-id="${boId}-result1"]`);
        const result1 = document.querySelector(`select[data-id="${boId}-result1-main"]`);
        const role2 = document.querySelector(`select[data-result-id="${boId}-result2"]`);
        const result2 = document.querySelector(`select[data-id="${boId}-result2-main"]`);

        if (role1 && result1 && role2 && result2) {
            matchData.bos.push({
                boId,
                role1: role1.value,
                result1: result1.value,
                role2: role2.value,
                result2: result2.value
            });
        }
    });

    const tiebreakerDiv = document.getElementById('tiebreaker');
    if (tiebreakerDiv) {
        const role1 = document.querySelector(`select[data-result-id="tiebreaker-result1"]`);
        const result1 = document.querySelector(`select[data-id="tiebreaker-result1-main"]`);
        const time1 = document.querySelector(`input[data-id="tiebreaker-result1-time"]`);
        const role2 = document.querySelector(`select[data-result-id="tiebreaker-result2"]`);
        const result2 = document.querySelector(`select[data-id="tiebreaker-result2-main"]`);
        const time2 = document.querySelector(`input[data-id="tiebreaker-result2-time"]`);

        if (role1 && result1 && time1 && role2 && result2 && time2) {
            matchData.tiebreaker = {
                role1: role1.value,
                result1: result1.value,
                time1: time1.value,
                role2: role2.value,
                result2: result2.value,
                time2: time2.value
            };
        }
    }

    localStorage.setItem('matchData', JSON.stringify(matchData));
    console.log('Data saved:', matchData);
}

function loadSavedData(data) {
    data.bos.forEach(bo => {
        setBOData(bo.boId, bo.role1, bo.result1, bo.role2, bo.result2);
    });

    if (data.tiebreaker) {
        setTiebreakerData(
            data.tiebreaker.role1,
            data.tiebreaker.result1,
            data.tiebreaker.time1,
            data.tiebreaker.role2,
            data.tiebreaker.result2,
            data.tiebreaker.time2
        );
    }

    updateResults();
}

function displayRestoredData(data) {
    let restoredDataContent = '';

    data.bos.forEach(bo => {
        const mainTeam = data.mainTeam;
        restoredDataContent += `${bo.boId.toUpperCase()} 上半:\n`;
        restoredDataContent += `${mainTeam}（${bo.role1}）结果（${bo.result1}）\n`;
        restoredDataContent += `${bo.boId.toUpperCase()} 下半:\n`;
        restoredDataContent += `${mainTeam}（${bo.role2}）结果（${bo.result2}）\n\n`;
    });

    if (data.tiebreaker) {
        restoredDataContent += `加赛:\n`;
        restoredDataContent += `${data.mainTeam}（${data.tiebreaker.role1}）用了${data.tiebreaker.time1}秒结果（${data.tiebreaker.result1}）\n`;
        restoredDataContent += `${data.mainTeam}（${data.tiebreaker.role2}）用了${data.tiebreaker.time2}秒结果（${data.tiebreaker.result2}）\n`;
    }

    document.getElementById('restored-data-content').textContent = restoredDataContent;
    document.getElementById('restored-data').style.display = 'block';
}

function setBOData(boId, role1, result1, role2, result2) {
    const role1Select = document.querySelector(`select[data-result-id="${boId}-result1"]`);
    const result1Select = document.querySelector(`select[data-id="${boId}-result1-main"]`);
    const role2Select = document.querySelector(`select[data-result-id="${boId}-result2"]`);
    const result2Select = document.querySelector(`select[data-id="${boId}-result2-main"]`);

    if (role1Select && result1Select && role2Select && result2Select) {
        role1Select.value = role1;
        updateScoreOptions(result1Select, role1);
        result1Select.value = result1;

        role2Select.value = role2;
        updateScoreOptions(result2Select, role2);
        result2Select.value = result2;

        role1Select.dispatchEvent(new Event('change'));
        result1Select.dispatchEvent(new Event('change'));
        role2Select.dispatchEvent(new Event('change'));
        result2Select.dispatchEvent(new Event('change'));
    }
}

function setTiebreakerData(role1, result1, time1, role2, result2, time2) {
    const role1Select = document.querySelector(`select[data-result-id="tiebreaker-result1"]`);
    const result1Select = document.querySelector(`select[data-id="tiebreaker-result1-main"]`);
    const time1Input = document.querySelector(`input[data-id="tiebreaker-result1-time"]`);
    const role2Select = document.querySelector(`select[data-result-id="tiebreaker-result2"]`);
    const result2Select = document.querySelector(`select[data-id="tiebreaker-result2-main"]`);
    const time2Input = document.querySelector(`input[data-id="tiebreaker-result2-time"]`);

    if (role1Select && result1Select && time1Input && role2Select && result2Select && time2Input) {
        role1Select.value = role1;
        updateScoreOptions(result1Select, role1);
        result1Select.value = result1;
        time1Input.value = time1;

        role2Select.value = role2;
        updateScoreOptions(result2Select, role2);
        result2Select.value = result2;
        time2Input.value = time2;

        role1Select.dispatchEvent(new Event('change'));
        result1Select.dispatchEvent(new Event('change'));
        time1Input.dispatchEvent(new Event('input'));
        role2Select.dispatchEvent(new Event('change'));
        result2Select.dispatchEvent(new Event('change'));
        time2Input.dispatchEvent(new Event('input'));
    }
}

document.addEventListener('change', function(e) {
    if (e.target && (e.target.classList.contains('role-select') || e.target.classList.contains('score-select') || e.target.classList.contains('time-input'))) {
        saveData();
    }
});

function createBO(id, mainTeam, subTeam) {
    const boDiv = document.createElement('div');
    boDiv.id = id;
    boDiv.innerHTML = `
        <h3>${id.toUpperCase()}</h3>
        <div>
            ${mainTeam}（<select class="role-select" data-main-team="${mainTeam}" data-sub-team="${subTeam}" data-result-id="${id}-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result1-main"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 上半：</strong>${mainTeam}（<span class="role-display" data-id="${id}-result1-role"></span>）<span class="score-display" data-id="${id}-result1-main-display"></span>，
            ${mainTeam}积<span class="score-points" data-id="${id}-result1-main-points"></span>分，${subTeam}积<span class="score-points" data-id="${id}-result1-sub-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result1"></span>。
        </div>
        <div>
            ${mainTeam}（<select class="role-select" data-main-team="${mainTeam}" data-sub-team="${subTeam}" data-result-id="${id}-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result2-main"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 下半：</strong>${mainTeam}（<span class="role-display" data-id="${id}-result2-role"></span>）<span class="score-display" data-id="${id}-result2-main-display"></span>，
            ${mainTeam}积<span class="score-points" data-id="${id}-result2-main-points"></span>分，${subTeam}积<span class="score-points" data-id="${id}-result2-sub-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(boDiv);

    const selects = boDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-main"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-main"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-main"]`), select.value);
        document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`).textContent = select.value;
    });

    const inputs = boDiv.getElementsByClassName('score-select');
    Array.from(inputs).forEach(input => {
        input.addEventListener('change', updateResults);
    });
}

function createTiebreaker(mainTeam, subTeam) {
    const tiebreakerDiv = document.createElement('div');
    tiebreakerDiv.id = 'tiebreaker';
    tiebreakerDiv.innerHTML = `
        <h3>加赛</h3>
        <div>
            ${mainTeam}（<select class="role-select" data-main-team="${mainTeam}" data-sub-team="${subTeam}" data-result-id="tiebreaker-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result1-main"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result1-time">
        </div>
        <div>
            <strong>加赛：</strong>${mainTeam}（<span class="role-display" data-id="tiebreaker-result1-role"></span>）用了<span class="time-display" data-id="tiebreaker-result1-time-display"></span><span class="score-display" data-id="tiebreaker-result1-main-display"></span>，
            ${mainTeam}积<span class="score-points" data-id="tiebreaker-result1-main-points"></span>分，${subTeam}积<span class="score-points" data-id="tiebreaker-result1-sub-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result1"></span>。
        </div>
        <div>
            ${mainTeam}（<select class="role-select" data-main-team="${mainTeam}" data-sub-team="${subTeam}" data-result-id="tiebreaker-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result2-main"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result2-time">
        </div>
        <div>
            <strong>加赛：</strong>${mainTeam}（<span class="role-display" data-id="tiebreaker-result2-role"></span>）用了<span class="time-display" data-id="tiebreaker-result2-time-display"></span><span class="score-display" data-id="tiebreaker-result2-main-display"></span>，
            ${mainTeam}积<span class="score-points" data-id="tiebreaker-result2-main-points"></span>分，${subTeam}积<span class="score-points" data-id="tiebreaker-result2-sub-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(tiebreakerDiv);

    const selects = tiebreakerDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-main"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-main"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-main"]`), select.value);
        document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`).textContent = select.value;
    });

    const inputs = tiebreakerDiv.getElementsByClassName('score-select');
    Array.from(inputs).forEach(input => {
        input.addEventListener('change', updateResults);
    });

    const timeInputs = tiebreakerDiv.getElementsByClassName('time-input');
    Array.from(timeInputs).forEach(input => {
        input.addEventListener('input', updateResults);
    });
}

function updateScoreOptions(scoreSelect, role) {
    scoreSelect.innerHTML = '<option value="未选择">未选择</option>';
    if (role === '监管') {
        scoreSelect.innerHTML += `
            <option value="4">四杀</option>
            <option value="3">三杀</option>
            <option value="2">平局</option>
            <option value="1">一杀</option>
            <option value="0">零杀</option>
        `;
    } else if (role === '求生') {
        scoreSelect.innerHTML += `
            <option value="4">四跑</option>
            <option value="3">三跑</option>
            <option value="2">平局</option>
            <option value="1">一跑</option>
            <option value="0">零跑</option>
        `;
    }
}

function updateResults() {
    const selects = document.getElementsByClassName('role-select');
    Array.from(selects).forEach(select => {
        const resultId = select.getAttribute('data-result-id');
        const mainScoreOption = document.querySelector(`select[data-id="${resultId}-main"]`).value;
        const role = select.value;

        let mainScore, subScore;

        if (role === '未选择' || mainScoreOption === '未选择') {
            document.querySelector(`span[data-id="${resultId}-main-display"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-main-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-sub-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}"]`).textContent = '-';
        } else if (role === '监管') {
            switch (mainScoreOption) {
                case '4':
                    mainScore = 5;
                    subScore = 0;
                    break;
                case '3':
                    mainScore = 3;
                    subScore = 1;
                    break;
                case '2':
                    mainScore = 2;
                    subScore = 2;
                    break;
                case '1':
                    mainScore = 1;
                    subScore = 3;
                    break;
                case '0':
                    mainScore = 0;
                    subScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-main-display"]`).textContent = `${mainScoreOption}杀`;
            document.querySelector(`span[data-id="${resultId}-main-points"]`).textContent = mainScore;
            document.querySelector(`span[data-id="${resultId}-sub-points"]`).textContent = subScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${mainScore}:${subScore}`;
        } else {
            switch (mainScoreOption) {
                case '4':
                    mainScore = 5;
                    subScore = 0;
                    break;
                case '3':
                    mainScore = 3;
                    subScore = 1;
                    break;
                case '2':
                    mainScore = 2;
                    subScore = 2;
                    break;
                case '1':
                    mainScore = 1;
                    subScore = 3;
                    break;
                case '0':
                    mainScore = 0;
                    subScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-main-display"]`).textContent = `${mainScoreOption}跑`;
            document.querySelector(`span[data-id="${resultId}-main-points"]`).textContent = mainScore;
            document.querySelector(`span[data-id="${resultId}-sub-points"]`).textContent = subScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${mainScore}-${subScore}`;
        }
    });

    const timeInputs = document.getElementsByClassName('time-input');
    Array.from(timeInputs).forEach(input => {
        const resultId = input.getAttribute('data-id').replace('-time', '');
        const time = input.value;
        if (time) {
            const seconds = formatTimeToSeconds(time);
            document.querySelector(`span[data-id="${resultId}-time-display"]`).textContent = `${seconds}秒`;
            const scoreResult = document.querySelector(`span[data-id="${resultId}"]`).textContent;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${scoreResult}(${seconds})`;
        }
    });

    // 更新新表格
    updateResultTableNew();
}

function formatTimeToSeconds(time) {
    const timeParts = time.split(/[:：]/);

    if (timeParts.length === 2) {
        const [minutes, seconds] = timeParts.map(Number);
        return minutes * 60 + seconds;
    } else {
        return Number(time);
    }
}

function updateResultTableNew() {
    const { bigScoreHome, bigScoreAway, smallScoreHome, smallScoreAway } = calculateScores();
    const mainTeam = document.getElementById('main-team').value || '主队';
    const subTeam = document.getElementById('sub-team').value || '客队';

    // 构造标题和大分小分
    const headerHTML = `
        <div class="match-header" style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 28px;">${mainTeam} vs ${subTeam}</h2>
            <div class="big-score" style="font-size: 24px; margin: 5px 0;">大分 ${bigScoreHome}:${bigScoreAway}</div>
            <div class="small-score" style="font-size: 20px; margin: 5px 0;">小分 ${smallScoreHome}:${smallScoreAway}</div>
            ${document.getElementById('intermission-alert') ? '<div class="intermission-alert" style="color: #ffeb3b; font-size: 18px;">场间休息中，请耐心等待～</div>' : ''}
        </div>
    `;

    let tableHTML = `<div style="padding: 0 25px; overflow-x:auto;"> 
        ${headerHTML}
        <table id="obs-new-table" border="1" cellspacing="0" cellpadding="5" style="width:100%; margin:0 auto;">
            <thead>
                <tr>
                    <th rowspan="2">学校/队伍</th>`;

    const games = [
        { id: "bo1", label: "GAME1" },
        { id: "bo2", label: "GAME2" },
        { id: "bo3", label: "GAME3" },
        { id: "tiebreaker", label: "TIEBREAKER" }
    ];

    games.forEach(game => {
        tableHTML += `<th colspan="2">${game.label}</th>`;
    });
    tableHTML += `</tr><tr>`;
    games.forEach(game => {
        tableHTML += `<th>FIRST HALF</th><th>SECOND HALF</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    // 主队行
    tableHTML += `<tr><td>${mainTeam}</td>`;
    games.forEach(game => {
        const firstHalf = getHalfDisplay(game.id, 'result1').main;
        const secondHalf = getHalfDisplay(game.id, 'result2').main;
        tableHTML += `<td>${firstHalf}</td><td>${secondHalf}</td>`;
    });
    tableHTML += `</tr>`;

    // 客队行
    tableHTML += `<tr><td>${subTeam}</td>`;
    games.forEach(game => {
        const firstHalf = getHalfDisplay(game.id, 'result1').sub;
        const secondHalf = getHalfDisplay(game.id, 'result2').sub;
        tableHTML += `<td>${firstHalf}</td><td>${secondHalf}</td>`;
    });
    tableHTML += `</tr></tbody></table>
        <div style="font-size: 12px; text-align: center; margin-top: 5px;" class="role-note">H为监管，S为求生</div>
    </div>`;

    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.innerHTML = tableHTML;
    }
    updateOBSWindow();
}


// 计算大分和小分
function calculateScores() {
    let bigHome = 0, bigAway = 0;
    let smallHome = 0, smallAway = 0;

    const games = ['bo1', 'bo2', 'bo3', 'tiebreaker'];
    games.forEach(gameId => {
        const result1 = getHalfScores(gameId, 'result1');
        const result2 = getHalfScores(gameId, 'result2');

        // 小分累加
        smallHome += result1.main + result2.main;
        smallAway += result1.sub + result2.sub;

        // 大分计算（需要上下半场都有效）
        if (result1.valid && result2.valid) {
            const totalHome = result1.main + result2.main;
            const totalAway = result1.sub + result2.sub;
            if (totalHome > totalAway) bigHome++;
            else if (totalAway > totalHome) bigAway++;
        }
    });

    return {
        bigScoreHome: bigHome,
        bigScoreAway: bigAway,
        smallScoreHome: smallHome,
        smallScoreAway: smallAway
    };
}

// 新增：获取半场分数（数值）
function getHalfScores(gameId, half) {
    const roleSelect = document.querySelector(`select[data-result-id="${gameId}-${half}"]`);
    const scoreSelect = document.querySelector(`select[data-id="${gameId}-${half}-main"]`);
    
    if (!roleSelect || !scoreSelect || 
        roleSelect.value === '未选择' || 
        scoreSelect.value === '未选择') {
        return { main: 0, sub: 0, valid: false };
    }

    const option = scoreSelect.value;
    let main = 0, sub = 0;
    switch(option) {
        case '4': main = 5; sub = 0; break;
        case '3': main = 3; sub = 1; break;
        case '2': main = 2; sub = 2; break;
        case '1': main = 1; sub = 3; break;
        case '0': main = 0; sub = 5; break;
    }
    return { main, sub, valid: true };
}

function getHalfDisplay(gameId, half) {
    const scores = getHalfScores(gameId, half);
    const roleSelect = document.querySelector(`select[data-result-id="${gameId}-${half}"]`);
    
    let displayMain = '', displaySub = '';
    if (scores.valid) {
        const role = roleSelect.value;
        const prefixMain = role === '监管' ? 'H' : (role === '求生' ? 'S' : '');
        const prefixSub = role === '监管' ? 'S' : (role === '求生' ? 'H' : '');
        
        // 处理加赛时间显示
        let timeSuffix = '';
        if (gameId === 'tiebreaker') {
            const timeInput = document.querySelector(`input[data-id="${gameId}-${half}-time"]`);
            if (timeInput && timeInput.value) timeSuffix = `(${timeInput.value})`;
        }

        displayMain = `${prefixMain}${scores.main}${timeSuffix}`;
        displaySub = `${prefixSub}${scores.sub}${timeSuffix}`;
    }
    return { main: displayMain || '-', sub: displaySub || '-' };
}

function updateOBSWindow() {
    if (obsWindow && !obsWindow.closed) {
          // 添加OBS专用样式
        obsWindow.document.head.innerHTML += `
        <style>
            .match-header, .big-score, .small-score, .intermission-alert {
                color: #fff !important;
                text-shadow: 0 0 10px rgba(255,255,255,0.8) !important;
            }
            .highlight {
                background-color: #ffeb3b !important;
                color: #000 !important;
                text-shadow: 0 0 10px rgba(255,235,59,0.8) !important;
            }
        </style>`;
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            obsWindow.document.getElementById('obs-results').innerHTML = resultsDiv.outerHTML;
        }
    }
}

// 新增功能函数
let isIntermission = false;
let isMatchEnd = false;

function toggleIntermission() {
    const btn = document.getElementById('toggle-intermission');
    const alertDiv = document.getElementById('intermission-alert');
    
    if (!isIntermission) {
        const newAlert = document.createElement('div');
        newAlert.id = 'intermission-alert';
        newAlert.className = 'intermission-alert';
        newAlert.style.cssText = 'color: #ffeb3b; font-size: 18px; text-align: center; text-shadow: 0 0 10px #ffeb3b;';
        newAlert.textContent = '场间休息中，请耐心等待～';
        document.querySelector('.match-header').appendChild(newAlert);
        btn.textContent = '结束场间';
    } else {
        if (alertDiv) alertDiv.remove();
        btn.textContent = '进入场间';
    }
    isIntermission = !isIntermission;
    updateResultTableNew();
}

function toggleMatchEnd() {
    const btn = document.getElementById('toggle-match-end');
    const mainTeam = document.getElementById('main-team').value;
    const subTeam = document.getElementById('sub-team').value;
    const { bigScoreHome, bigScoreAway } = calculateScores();

    if (!isMatchEnd) {
        // 标黄获胜队伍
        const winnerClass = 'highlight';
        const header = document.querySelector('.match-header h2');
        const rows = document.querySelectorAll('#obs-new-table tr');
        
        if (bigScoreHome > bigScoreAway) {
            header.innerHTML = header.innerHTML.replace(mainTeam, `<span class="${winnerClass}">${mainTeam}</span>`);
            rows[0].querySelectorAll('td').forEach(td => td.classList.add(winnerClass));
        } else if (bigScoreAway > bigScoreHome) {
            header.innerHTML = header.innerHTML.replace(subTeam, `<span class="${winnerClass}">${subTeam}</span>`);
            rows[1].querySelectorAll('td').forEach(td => td.classList.add(winnerClass));
        }
        btn.textContent = '取消结束';
    } else {
        // 恢复原状
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });
        btn.textContent = '比赛结束';
    }
    isMatchEnd = !isMatchEnd;
    updateResultTableNew();
}