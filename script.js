document.getElementById('next-button').addEventListener('click', function() {
    const homeTeam = document.getElementById('home-team').value;
    const awayTeam = document.getElementById('away-team').value;

    if (homeTeam && awayTeam) {
        document.getElementById('input-stage').style.display = 'none';
        document.getElementById('output-stage').style.display = 'block';
        document.getElementById('match-title').textContent = `${homeTeam} vs ${awayTeam}`;

        createBO('bo1', homeTeam, awayTeam);
        createBO('bo2', homeTeam, awayTeam);
        document.getElementById('add-bo').style.display = 'block';
    } else {
        alert('请填写所有队伍名称');
    }
});

let boCount = 2;

document.getElementById('add-bo').addEventListener('click', function() {
    boCount++;
    createBO(`bo${boCount}`, document.getElementById('home-team').value, document.getElementById('away-team').value);
    document.getElementById(`bo${boCount}-header`).style.display = 'table-cell';
    document.getElementById(`bo${boCount}-result1`).style.display = 'table-cell';
    document.getElementById(`bo${boCount}-result2`).style.display = 'table-cell';
    if (boCount === 3) {
        document.getElementById('add-bo').style.display = 'none';
        document.getElementById('add-tiebreaker').style.display = 'block';
    }
});

document.getElementById('add-tiebreaker').addEventListener('click', function() {
    createTiebreaker(document.getElementById('home-team').value, document.getElementById('away-team').value);
    document.getElementById('tiebreaker-header').style.display = 'table-cell';
    document.getElementById('tiebreaker-result1').style.display = 'table-cell';
    document.getElementById('tiebreaker-result2').style.display = 'table-cell';
    document.getElementById('add-tiebreaker').style.display = 'none';
});

function createBO(id, homeTeam, awayTeam) {
    const boDiv = document.createElement('div');
    boDiv.id = id;
    boDiv.innerHTML = `
        <h3>${id.toUpperCase()}</h3>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="${id}-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result1-home"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 上半：</strong>${homeTeam}（<span class="role-display" data-id="${id}-result1-role"></span>）<span class="score-display" data-id="${id}-result1-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="${id}-result1-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="${id}-result1-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result1"></span>。
        </div>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="${id}-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result2-home"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 下半：</strong>${homeTeam}（<span class="role-display" data-id="${id}-result2-role"></span>）<span class="score-display" data-id="${id}-result2-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="${id}-result2-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="${id}-result2-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(boDiv);

    const selects = boDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        // 初始化分数选项和角色显示
        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`), select.value);
        document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`).textContent = select.value;
    });

    const inputs = boDiv.getElementsByClassName('score-select');
    Array.from(inputs).forEach(input => {
        input.addEventListener('change', updateResults);
    });
}

function createTiebreaker(homeTeam, awayTeam) {
    const tiebreakerDiv = document.createElement('div');
    tiebreakerDiv.id = 'tiebreaker';
    tiebreakerDiv.innerHTML = `
        <h3>加赛</h3>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="tiebreaker-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result1-home"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result1-time">
        </div>
        <div>
            <strong>加赛：</strong>${homeTeam}（<span class="role-display" data-id="tiebreaker-result1-role"></span>）用了<span class="time-display" data-id="tiebreaker-result1-time-display"></span><span class="score-display" data-id="tiebreaker-result1-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="tiebreaker-result1-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="tiebreaker-result1-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result1"></span>。
        </div>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="tiebreaker-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result2-home"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result2-time">
        </div>
        <div>
            <strong>加赛：</strong>${homeTeam}（<span class="role-display" data-id="tiebreaker-result2-role"></span>）用了<span class="time-display" data-id="tiebreaker-result2-time-display"></span><span class="score-display" data-id="tiebreaker-result2-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="tiebreaker-result2-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="tiebreaker-result2-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(tiebreakerDiv);

    const selects = tiebreakerDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        // 初始化分数选项和角色显示
        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`), select.value);
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
            <option value="2">二跑</option>
            <option value="1">一跑</option>
            <option value="0">零跑</option>
        `;
    }
}

function updateResults() {
    const selects = document.getElementsByClassName('role-select');
    Array.from(selects).forEach(select => {
        const resultId = select.getAttribute('data-result-id');
        const homeScoreOption = document.querySelector(`select[data-id="${resultId}-home"]`).value;
        const role = select.value;

        let homeScore, awayScore;

        if (role === '未选择' || homeScoreOption === '未选择') {
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}"]`).textContent = '比赛结果尚未填写。';
        } else if (role === '监管') {
            switch (homeScoreOption) {
                case '4':
                    homeScore = 5;
                    awayScore = 0;
                    break;
                case '3':
                    homeScore = 3;
                    awayScore = 1;
                    break;
                case '2':
                    homeScore = 2;
                    awayScore = 2;
                    break;
                case '1':
                    homeScore = 1;
                    awayScore = 3;
                    break;
                case '0':
                    homeScore = 0;
                    awayScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = `${homeScoreOption}杀`;
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = homeScore;
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = awayScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${homeScore}:${awayScore}`;
        } else {
            switch (homeScoreOption) {
                case '4':
                    homeScore = 5;
                    awayScore = 0;
                    break;
                case '3':
                    homeScore = 3;
                    awayScore = 1;
                    break;
                case '2':
                    homeScore = 2;
                    awayScore = 2;
                    break;
                case '1':
                    homeScore = 1;
                    awayScore = 3;
                    break;
                case '0':
                    homeScore = 0;
                    awayScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = `${homeScoreOption}跑`;
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = homeScore;
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = awayScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${homeScore}-${awayScore}`;
        }
    });

    const timeInputs = document.getElementsByClassName('time-input');
    Array.from(timeInputs).forEach(input => {
        const resultId = input.getAttribute('data-id').replace('-time', '');
        const time = input.value;
        if (time) {
            const seconds = formatTimeToSeconds(time);
            document.querySelector(`span[data-id="${resultId}-time-display"]`).textContent = `${seconds}秒`;
        }
    });

    // 更新表格中的结果
    updateTableResults();
}

function formatTimeToSeconds(time) {
    if (time.includes(':')) {
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * 60 + seconds;
    } else {
        return Number(time);
    }
}

function updateTableResults() {
    const bo1Result1 = document.querySelector('span[data-id="bo1-result1"]').textContent;
    const bo1Result2 = document.querySelector('span[data-id="bo1-result2"]').textContent;
    const bo2Result1 = document.querySelector('span[data-id="bo2-result1"]').textContent;
    const bo2Result2 = document.querySelector('span[data-id="bo2-result2"]').textContent;
    const bo3Result1 = document.querySelector('span[data-id="bo3-result1"]')?.textContent || '';
    const bo3Result2 = document.querySelector('span[data-id="bo3-result2"]')?.textContent || '';
    const tiebreakerResult1 = document.querySelector('span[data-id="tiebreaker-result1"]')?.textContent || '';
    const tiebreakerResult2 = document.querySelector('span[data-id="tiebreaker-result2"]')?.textContent || '';

    document.getElementById('bo1-result1').textContent = bo1Result1;
    document.getElementById('bo1-result2').textContent = bo1Result2;
    document.getElementById('bo2-result1').textContent = bo2Result1;
    document.getElementById('bo2-result2').textContent = bo2Result2;
    if (bo3Result1 && bo3Result2) {
        document.getElementById('bo3-result1').textContent = bo3Result1;
        document.getElementById('bo3-result2').textContent = bo3Result2;
    }
    if (tiebreakerResult1 && tiebreakerResult2) {
        document.getElementById('tiebreaker-result1').textContent = tiebreakerResult1;
        document.getElementById('tiebreaker-result2').textContent = tiebreakerResult2;
    }
}
