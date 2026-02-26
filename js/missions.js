/* =============================================
   Missions — CRUD, Plan View, Today Board
   Matches HTML IDs: addBossMission, addChapterMission, addDailyQuest,
   bossMissionList, chapterMissionList, dailyQuestList,
   todayMissionList, missionModal, missionForm, etc.
   ============================================= */

const Missions = {
    activeTimers: {},

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Plan page add buttons
        document.getElementById('addBossMission').addEventListener('click', () => this.openModal('boss'));
        document.getElementById('addChapterMission').addEventListener('click', () => this.openModal('chapter'));
        document.getElementById('addDailyQuest').addEventListener('click', () => this.openModal('daily'));

        // Modal
        document.getElementById('missionModalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('missionForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('missionModal').addEventListener('click', (e) => {
            if (e.target.id === 'missionModal') this.closeModal();
        });

        // Type change affects form visibility and parent options
        document.getElementById('missionType').addEventListener('change', (e) => {
            this.updateFormVisibility(e.target.value);
            this.populateParentOptions(e.target.value);
        });
    },

    openModal(type, missionId) {
        const modal = document.getElementById('missionModal');
        const form = document.getElementById('missionForm');
        form.reset();
        document.getElementById('missionId').value = '';
        document.getElementById('missionType').value = type || 'daily';
        this.updateFormVisibility(type);
        this.populateParentOptions(type);

        // Default repeat: Mon-Fri
        document.querySelectorAll('#repeatDays input').forEach((cb, i) => {
            cb.checked = (i >= 1 && i <= 5);
        });

        if (missionId) {
            const mission = store.getMission(missionId);
            if (mission) {
                document.getElementById('missionModalTitle').textContent = '미션 수정';
                document.getElementById('missionId').value = mission.id;
                document.getElementById('missionTitle').value = mission.title;
                document.getElementById('missionType').value = mission.type;
                document.getElementById('missionDifficulty').value = mission.difficulty || 2;
                document.getElementById('missionMinutes').value = mission.estimatedMinutes || 30;
                if (mission.scheduledTime) document.getElementById('missionTime').value = mission.scheduledTime;
                if (mission.parentId) {
                    this.populateParentOptions(mission.type);
                    document.getElementById('parentMission').value = mission.parentId;
                }
                if (mission.repeatDays) {
                    document.querySelectorAll('#repeatDays input').forEach(cb => {
                        cb.checked = mission.repeatDays.includes(parseInt(cb.value));
                    });
                }
                this.updateFormVisibility(mission.type);
            }
        } else {
            document.getElementById('missionModalTitle').textContent = '미션 생성';
        }

        modal.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('missionModal').classList.add('hidden');
    },

    updateFormVisibility(type) {
        const schedule = document.getElementById('scheduleGroup');
        const repeat = document.getElementById('repeatGroup');
        const parent = document.getElementById('parentMissionGroup');

        if (type === 'daily') {
            schedule.style.display = '';
            repeat.style.display = '';
            parent.style.display = '';
        } else if (type === 'chapter') {
            schedule.style.display = 'none';
            repeat.style.display = 'none';
            parent.style.display = '';
        } else {
            schedule.style.display = 'none';
            repeat.style.display = 'none';
            parent.style.display = 'none';
        }
    },

    populateParentOptions(type) {
        const select = document.getElementById('parentMission');
        select.innerHTML = '<option value="">없음</option>';
        const missions = store.getMissions();

        let parents = [];
        if (type === 'chapter') parents = missions.filter(m => m.type === 'boss');
        else if (type === 'daily') parents = missions.filter(m => m.type === 'chapter');

        parents.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = (m.type === 'boss' ? '🏰 ' : '📖 ') + m.title;
            select.appendChild(opt);
        });
    },

    handleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('missionId').value;
        const type = document.getElementById('missionType').value;

        const data = {
            title: document.getElementById('missionTitle').value.trim(),
            type,
            difficulty: parseInt(document.getElementById('missionDifficulty').value),
            estimatedMinutes: parseInt(document.getElementById('missionMinutes').value),
            parentId: document.getElementById('parentMission').value || null,
            scheduledTime: type === 'daily' ? document.getElementById('missionTime').value : null,
            repeatDays: type === 'daily'
                ? Array.from(document.querySelectorAll('#repeatDays input:checked')).map(cb => parseInt(cb.value))
                : [],
            expReward: Gamification.calcMissionExp(parseInt(document.getElementById('missionDifficulty').value)),
        };

        if (id) {
            store.updateMission(id, data);
        } else {
            store.addMission(data);
        }

        this.closeModal();
        this.renderPlan();
        this.renderToday();
        Dashboard.render();
    },

    // ===== PLAN VIEW =====
    renderPlan() {
        const missions = store.getMissions();
        const bossList = document.getElementById('bossMissionList');
        const chapterList = document.getElementById('chapterMissionList');
        const dailyList = document.getElementById('dailyQuestList');

        bossList.innerHTML = '';
        chapterList.innerHTML = '';
        dailyList.innerHTML = '';

        missions.filter(m => m.type === 'boss').forEach(m => bossList.appendChild(this._planCard(m, missions)));
        missions.filter(m => m.type === 'chapter').forEach(m => {
            const card = this._planCard(m, missions);
            const parent = missions.find(p => p.id === m.parentId);
            if (parent) {
                const badge = document.createElement('div');
                badge.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:4px;';
                badge.textContent = `└ 🏰 ${parent.title}`;
                card.querySelector('.plan-card-meta').after(badge);
            }
            chapterList.appendChild(card);
        });
        missions.filter(m => m.type === 'daily').forEach(m => {
            const card = this._planCard(m, missions);
            const parent = missions.find(p => p.id === m.parentId);
            if (parent) {
                const badge = document.createElement('div');
                badge.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:4px;';
                badge.textContent = `└ 📖 ${parent.title}`;
                card.querySelector('.plan-card-meta').after(badge);
            }
            dailyList.appendChild(card);
        });
    },

    _planCard(mission, allMissions) {
        const card = document.createElement('div');
        card.className = 'plan-card';
        const stars = '⭐'.repeat(mission.difficulty || 1);
        const time = mission.scheduledTime ? `🕐 ${mission.scheduledTime}` : '';

        card.innerHTML = `
            <div class="plan-card-title">${mission.title}</div>
            <div class="plan-card-meta">
                <span>${stars}</span>
                <span>${time}</span>
                <span>${mission.estimatedMinutes || ''}분</span>
                <span class="exp-badge">+${mission.expReward || 0} EXP</span>
            </div>
            <div class="plan-card-actions">
                <button data-action="edit">✏️ 수정</button>
                <button data-action="delete">🗑️ 삭제</button>
            </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener('click', () => this.openModal(mission.type, mission.id));
        card.querySelector('[data-action="delete"]').addEventListener('click', () => {
            if (confirm('이 미션을 삭제하시겠습니까?')) {
                store.deleteMission(mission.id);
                this.renderPlan();
                this.renderToday();
                Dashboard.render();
            }
        });

        return card;
    },

    // ===== TODAY VIEW =====
    renderToday() {
        const todayMissions = store.getTodayDailyMissions();
        const container = document.getElementById('todayMissionList');
        const today = store.today();

        // Update date display
        const d = new Date();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dateEl = document.getElementById('todayDate');
        if (dateEl) dateEl.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

        if (todayMissions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚔️</div>
                    <p>오늘 수행할 Daily Quest가 없습니다.</p>
                    <button class="btn-primary" style="max-width:300px;margin:16px auto 0;" id="goToPlan">계획 페이지에서 미션 추가</button>
                </div>
            `;
            const btn = document.getElementById('goToPlan');
            if (btn) btn.addEventListener('click', () => { location.hash = '#plan'; });
            return;
        }

        // Sort by time
        todayMissions.sort((a, b) => {
            if (!a.scheduledTime) return 1;
            if (!b.scheduledTime) return -1;
            return a.scheduledTime.localeCompare(b.scheduledTime);
        });

        container.innerHTML = '';
        todayMissions.forEach(mission => {
            const isCompleted = mission.completedDates && mission.completedDates.includes(today);
            container.appendChild(this._missionCard(mission, isCompleted));
        });
    },

    _missionCard(mission, isCompleted) {
        const card = document.createElement('div');
        card.className = `mission-card${isCompleted ? ' completed' : ''}`;
        card.id = `mission-${mission.id}`;

        const stars = '⭐'.repeat(mission.difficulty || 1);
        const exp = mission.expReward || Gamification.calcMissionExp(mission.difficulty || 2);
        const hasTimer = !!this.activeTimers[mission.id];

        card.innerHTML = `
            <div class="mission-time-badge">${mission.scheduledTime || '--:--'}</div>
            <div class="mission-card-body">
                <div class="mission-card-title">${mission.title}</div>
                <div class="mission-card-info">
                    <span class="diff-badge">${stars}</span>
                    <span class="exp-badge">+${exp} EXP</span>
                    <span>🔥 ${mission.streak || 0}일 연속</span>
                </div>
                <div class="mission-card-timer" id="timer-${mission.id}"></div>
            </div>
            <div class="mission-card-actions">
                ${isCompleted
                ? '<span style="color:var(--accent-green);font-size:24px;">✅</span>'
                : (hasTimer
                    ? `<button class="btn-mission-complete" data-complete="${mission.id}">완료</button>`
                    : `<button class="btn-mission-start" data-start="${mission.id}">시작</button>`
                )
            }
            </div>
        `;

        if (!isCompleted) {
            const startBtn = card.querySelector('[data-start]');
            const completeBtn = card.querySelector('[data-complete]');
            if (startBtn) startBtn.addEventListener('click', () => this.startTimer(mission.id));
            if (completeBtn) completeBtn.addEventListener('click', () => this._completeMission(mission.id));
        }

        return card;
    },

    startTimer(missionId) {
        const startTime = Date.now();
        this.activeTimers[missionId] = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            const el = document.getElementById(`timer-${missionId}`);
            if (el) el.textContent = `⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }, 1000);
        this.renderToday();
    },

    _completeMission(missionId) {
        if (this.activeTimers[missionId]) {
            clearInterval(this.activeTimers[missionId]);
            delete this.activeTimers[missionId];
        }
        Gamification.completeMission(missionId);
        this.renderToday();
        Dashboard.render();
    },
};
