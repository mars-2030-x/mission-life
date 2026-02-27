/* =============================================
   Dashboard — Home + Stats
   HTML IDs: dashLevel, dashLevelName, dashExpBar, dashExpText,
   dashStreak, progressCanvas, progressPercent, nextMissionInfo,
   dashboardDate, weeklyHeatmap, monthlyChart, medStatsDetail
   ============================================= */

const Dashboard = {
    init() {
        this.render();
    },

    render() {
        this.renderTodayCard();
        this.renderLevel();
        this.renderStreak();
        this.renderProgress();
        this.renderNextMission();
        this.renderDate();
        Gamification.updateSidebarLevel();
    },

    renderTodayCard() {
        const wrap = document.getElementById('todayCardContent');
        if (!wrap) return;

        const today = store.today();
        const todayMissions = store.getTodayDailyMissions();
        const top3 = todayMissions.slice(0, 3);
        const completed = todayMissions.filter(m => m.completedDates && m.completedDates.includes(today)).length;
        const activeMissionTimer = this._findActiveMissionTimer();
        const meditationState = Meditation && Meditation.isRunning
            ? {
                type: 'meditation',
                label: `🧘 명상 ${Meditation.isPaused ? '일시정지' : '진행 중'}`,
                time: this._formatSeconds(Meditation.elapsed || 0)
            }
            : null;
        const activeTop = activeMissionTimer || meditationState;

        const checklistHtml = top3.length > 0
            ? top3.map(m => {
                const checked = m.completedDates && m.completedDates.includes(today);
                return `
                    <label class="today-quest-item ${checked ? 'done' : ''}">
                        <input type="checkbox" disabled ${checked ? 'checked' : ''}>
                        <span>${m.title}</span>
                    </label>
                `;
            }).join('')
            : '<p class="today-card-empty">오늘 데일리 퀘스트가 없습니다.</p>';

        wrap.innerHTML = `
            ${activeTop ? `
                <div class="today-active-session">
                    <strong>${activeTop.label}</strong>
                    <span>${activeTop.time}</span>
                </div>
            ` : ''}
            <div class="today-card-section">
                <h4>오늘의 데일리 퀘스트 3개</h4>
                <div class="today-quest-list">${checklistHtml}</div>
                <div class="today-card-status">완료 ${completed}/${todayMissions.length}</div>
            </div>
            <div class="today-card-actions">
                <button class="btn-add" id="todayCardAddMission">오늘 미션 추가</button>
                <button class="btn-add" id="todayCardMeditate">명상 시작</button>
            </div>
        `;

        const addBtn = document.getElementById('todayCardAddMission');
        const medBtn = document.getElementById('todayCardMeditate');
        if (addBtn) addBtn.addEventListener('click', () => {
            location.hash = '#plan';
            Missions.openModal('daily');
        });
        if (medBtn) medBtn.addEventListener('click', () => {
            location.hash = '#meditation';
        });
    },

    _findActiveMissionTimer() {
        if (!window.Missions || !Missions.activeTimers) return null;
        const ids = Object.keys(Missions.activeTimers);
        if (ids.length === 0) return null;

        const runningId = ids[0];
        const mission = store.getMission(runningId);
        if (!mission) return null;

        const timerEl = document.getElementById(`timer-${runningId}`);
        return {
            type: 'mission',
            label: `⚔️ ${mission.title} 진행 중`,
            time: timerEl?.textContent?.replace('⏱ ', '') || '00:00'
        };
    },

    _formatSeconds(total) {
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    renderLevel() {
        const profile = store.getProfile();
        const title = Gamification.getTitle(profile.level);
        const requiredExp = Gamification.expForLevel(profile.level);
        const percentage = requiredExp > 0 ? Math.round((profile.totalExp / requiredExp) * 100) : 0;

        const levelEl = document.getElementById('dashLevel');
        const nameEl = document.getElementById('dashLevelName');
        const barEl = document.getElementById('dashExpBar');
        const textEl = document.getElementById('dashExpText');

        if (levelEl) levelEl.textContent = profile.level;
        if (nameEl) nameEl.textContent = `${title.emoji} ${title.name}`;
        if (barEl) barEl.style.width = `${Math.min(percentage, 100)}%`;
        if (textEl) textEl.textContent = `${profile.totalExp} / ${requiredExp} EXP`;
    },

    renderStreak() {
        const profile = store.getProfile();
        const el = document.getElementById('dashStreak');
        if (el) el.textContent = profile.currentStreak || 0;
    },

    renderProgress() {
        const todayMissions = store.getTodayDailyMissions();
        const today = store.today();
        const total = todayMissions.length;
        const completed = todayMissions.filter(m => m.completedDates && m.completedDates.includes(today)).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const percentEl = document.getElementById('progressPercent');
        if (percentEl) {
            percentEl.textContent = total > 0 ? `${percent}%` : '오늘 미션 없음';
            percentEl.classList.toggle('is-empty', total === 0);
        }

        const canvas = document.getElementById('progressCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 140;
        canvas.width = size * 2;
        canvas.height = size * 2;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(2, 2);

        const cx = size / 2, cy = size / 2, radius = 52, lineWidth = 10;
        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(124, 92, 252, 0.15)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        if (percent > 0) {
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * percent / 100);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.strokeStyle = '#7c5cfc';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        ctx.fillStyle = '#e8e8ff';
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(total > 0 ? `${completed}/${total} 완료` : '오늘 미션 없음', cx, cy + 4);
    },

    renderNextMission() {
        const todayMissions = store.getTodayDailyMissions();
        const today = store.today();
        const pending = todayMissions.filter(m => !(m.completedDates && m.completedDates.includes(today)));
        const info = document.getElementById('nextMissionInfo');
        if (!info) return;

        if (todayMissions.length === 0) {
            info.innerHTML = `<p class="next-mission-empty">다음 미션: 오늘 미션이 없습니다.</p>`;
            return;
        }

        if (pending.length === 0) {
            info.innerHTML = `<p class="next-mission-empty" style="color:var(--accent-green);">다음 미션: 오늘 미션을 모두 완료했어요! 🎉</p>`;
            return;
        }

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const upcoming = pending.filter(m => m.scheduledTime && m.scheduledTime >= currentTime)
            .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
        const next = upcoming[0] || pending[0];

        info.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="font-size:28px;">⚡</div>
                <div>
                    <div style="font-weight:700;font-size:15px;">${next.title}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${next.scheduledTime || '미정'} · +${next.expReward || 0} EXP</div>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">남은 미션: ${pending.length}개</div>
        `;
    },

    renderDate() {
        const now = new Date();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
        const el = document.getElementById('dashboardDate');
        if (el) el.textContent = dateStr;
    },

    renderStats() {
        this.renderWeeklyHeatmap();
        this.renderMonthlyChart();
        this.renderMeditationStats();
    },

    renderWeeklyHeatmap() {
        const container = document.getElementById('weeklyHeatmap');
        if (!container) return;
        container.innerHTML = '';

        const cta = document.getElementById('weeklyStatsCta');

        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        const monday = new Date(today);
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diff);

        let hasAnyData = false;

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            const missions = store.getMissions();
            const dayNum = date.getDay();
            const dailyForDay = missions.filter(m => {
                if (m.type !== 'daily') return false;
                if (m.repeatDays && m.repeatDays.length > 0) return m.repeatDays.includes(dayNum);
                return true;
            });
            const completed = dailyForDay.filter(m => m.completedDates && m.completedDates.includes(dateStr)).length;
            const total = dailyForDay.length;
            const rate = total > 0 ? completed / total : 0;

            if (total > 0 || completed > 0) hasAnyData = true;

            let level = 0;
            if (rate >= 1) level = 4;
            else if (rate >= 0.8) level = 3;
            else if (rate >= 0.5) level = 2;
            else if (rate > 0) level = 1;

            const isToday = dateStr === store.today();
            const cell = document.createElement('button');
            cell.className = `heatmap-cell level-${level}`;
            cell.type = 'button';
            if (isToday) cell.style.boxShadow = '0 0 0 2px var(--accent-primary)';
            cell.innerHTML = `
                <span class="heatmap-day">${dayNames[(i + 1) % 7]}</span>
                <span class="heatmap-date">${date.getDate()}</span>
                <span class="heatmap-rate">${total > 0 ? `${completed}/${total}` : '미션 없음'}</span>
            `;
            cell.addEventListener('click', () => {
                alert(`${dateStr}\n완료 ${completed}/${total}`);
            });
            container.appendChild(cell);
        }

        if (cta) {
            cta.innerHTML = hasAnyData ? '' : `
                <div class="stats-empty-cta">
                    <p>이번 주 첫 기록을 만들어보세요.</p>
                    <div class="today-card-actions">
                        <button class="btn-add" id="weeklyAddMission">오늘 미션 추가</button>
                        <button class="btn-add" id="weeklyStartMeditation">명상 시작</button>
                    </div>
                </div>
            `;

            const addBtn = document.getElementById('weeklyAddMission');
            const medBtn = document.getElementById('weeklyStartMeditation');
            if (addBtn) addBtn.addEventListener('click', () => {
                location.hash = '#plan';
                Missions.openModal('daily');
            });
            if (medBtn) medBtn.addEventListener('click', () => location.hash = '#meditation');
        }
    },

    renderMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = 250 * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.offsetWidth;
        const height = 250;
        ctx.clearRect(0, 0, width, height);

        const today = new Date();
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayNum = d.getDay();
            const missions = store.getMissions();
            const dailyForDay = missions.filter(m => {
                if (m.type !== 'daily') return false;
                if (m.repeatDays && m.repeatDays.length > 0) return m.repeatDays.includes(dayNum);
                return true;
            });
            const completed = dailyForDay.filter(m => m.completedDates && m.completedDates.includes(dateStr)).length;
            const total = dailyForDay.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            data.push({ date: d.getDate(), rate, total, completed });
        }

        const cta = document.getElementById('monthlyChartCta');
        const hasData = data.some(d => d.total > 0 || d.completed > 0);
        if (cta) {
            cta.innerHTML = hasData ? '' : `
                <div class="stats-empty-cta">
                    <p>이번 주 첫 기록을 만들어보세요.</p>
                    <div class="today-card-actions">
                        <button class="btn-add" id="monthlyAddMission">오늘 미션 추가</button>
                        <button class="btn-add" id="monthlyStartMeditation">명상 시작</button>
                    </div>
                </div>
            `;
            const addBtn = document.getElementById('monthlyAddMission');
            const medBtn = document.getElementById('monthlyStartMeditation');
            if (addBtn) addBtn.addEventListener('click', () => {
                location.hash = '#plan';
                Missions.openModal('daily');
            });
            if (medBtn) medBtn.addEventListener('click', () => location.hash = '#meditation');
        }

        const pad = { top: 20, right: 20, bottom: 30, left: 40 };
        const cw = width - pad.left - pad.right;
        const ch = height - pad.top - pad.bottom;

        ctx.strokeStyle = 'rgba(124,92,252,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (ch / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(width - pad.right, y);
            ctx.stroke();
            ctx.fillStyle = '#5a5a7a';
            ctx.font = '11px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`${100 - i * 25}%`, pad.left - 8, y + 4);
        }

        if (data.some(d => d.rate > 0)) {
            ctx.beginPath();
            ctx.strokeStyle = '#7c5cfc';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            data.forEach((d, i) => {
                const x = pad.left + (i / (data.length - 1)) * cw;
                const y = pad.top + ch - (d.rate / 100) * ch;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
            gradient.addColorStop(0, 'rgba(124,92,252,0.15)');
            gradient.addColorStop(1, 'rgba(124,92,252,0)');
            ctx.lineTo(pad.left + cw, height - pad.bottom);
            ctx.lineTo(pad.left, height - pad.bottom);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            data.forEach((d, i) => {
                if (d.rate > 0) {
                    const x = pad.left + (i / (data.length - 1)) * cw;
                    const y = pad.top + ch - (d.rate / 100) * ch;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#7c5cfc';
                    ctx.fill();
                }
            });
        }

        ctx.fillStyle = '#5a5a7a';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        for (let i = 0; i < data.length; i += 5) {
            const x = pad.left + (i / (data.length - 1)) * cw;
            ctx.fillText(data[i].date, x, height - 8);
        }
        ctx.fillText(data[data.length - 1].date, pad.left + cw, height - 8);
    },

    renderMeditationStats() {
        const container = document.getElementById('medStatsDetail');
        if (!container) return;
        const profile = store.getProfile();
        const records = store.getMeditationRecords();
        const levelNames = ['수련생', '수련생', '명상자', '도반', '선인', '현자'];
        const avgFocus = records.length > 0
            ? (records.reduce((sum, r) => sum + (r.focusRating || 0), 0) / records.length).toFixed(1)
            : 0;

        container.innerHTML = `
            <div class="med-stat-item"><span>총 명상 시간</span><strong>${profile.meditationMinutes || 0}분</strong></div>
            <div class="med-stat-item"><span>명상 횟수</span><strong>${records.length}회</strong></div>
            <div class="med-stat-item"><span>연속 명상</span><strong>${profile.meditationStreak || 0}일</strong></div>
            <div class="med-stat-item"><span>마음 레벨</span><strong>${levelNames[profile.meditationLevel || 1]}</strong></div>
            <div class="med-stat-item"><span>평균 집중도</span><strong>${avgFocus} ★</strong></div>
        `;
    }
};
