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
        this.renderLevel();
        this.renderStreak();
        this.renderProgress();
        this.renderNextMission();
        this.renderDate();
        Gamification.updateSidebarLevel();
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

        // Update text
        const percentEl = document.getElementById('progressPercent');
        if (percentEl) percentEl.textContent = `${percent}%`;

        // Draw canvas
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

        // Background circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(124, 92, 252, 0.15)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Progress arc
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

        // Center text
        ctx.fillStyle = '#e8e8ff';
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${completed}/${total} 완료`, cx, cy + 4);
    },

    renderNextMission() {
        const todayMissions = store.getTodayDailyMissions();
        const today = store.today();
        const pending = todayMissions.filter(m => !(m.completedDates && m.completedDates.includes(today)));
        const info = document.getElementById('nextMissionInfo');
        if (!info) return;

        if (pending.length === 0) {
            info.innerHTML = `<p class="next-mission-empty" style="color:var(--accent-green);">모든 미션을 완료했어요! 🎉</p>`;
            return;
        }

        // Find next by scheduled time
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

    // ===== STATS PAGE =====
    renderStats() {
        this.renderWeeklyHeatmap();
        this.renderMonthlyChart();
        this.renderMeditationStats();
    },

    renderWeeklyHeatmap() {
        const container = document.getElementById('weeklyHeatmap');
        if (!container) return;
        container.innerHTML = '';

        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        // Start from Monday
        const monday = new Date(today);
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            // Get missions for that day
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

            let level = 0;
            if (rate >= 1) level = 4;
            else if (rate >= 0.8) level = 3;
            else if (rate >= 0.5) level = 2;
            else if (rate > 0) level = 1;

            const isToday = dateStr === store.today();
            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${level}`;
            if (isToday) cell.style.boxShadow = '0 0 0 2px var(--accent-primary)';
            cell.innerHTML = `
                <span class="heatmap-day">${dayNames[(i + 1) % 7]}</span>
                <span class="heatmap-date">${date.getDate()}</span>
            `;
            container.appendChild(cell);
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

        // Get last 30 days
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
            data.push({ date: d.getDate(), rate });
        }

        const pad = { top: 20, right: 20, bottom: 30, left: 40 };
        const cw = width - pad.left - pad.right;
        const ch = height - pad.top - pad.bottom;

        // Grid
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

            // Fill
            const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
            gradient.addColorStop(0, 'rgba(124,92,252,0.15)');
            gradient.addColorStop(1, 'rgba(124,92,252,0)');
            ctx.lineTo(pad.left + cw, height - pad.bottom);
            ctx.lineTo(pad.left, height - pad.bottom);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Points
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

        // X-axis
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
