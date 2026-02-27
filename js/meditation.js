/* =============================================
   Meditation — Timer, Types, Review
   HTML IDs: timerProgress, timerDisplay, timerDurationSelect,
   timerTypeSelect, btnMeditationStart, btnMeditationPause,
   btnMeditationStop, meditationAfterModal, medCompleteDuration,
   focusRating, medMemo, btnSaveMeditation,
   medTotalTime, medStreak, medLevel
   ============================================= */

const Meditation = {
    timer: null,
    elapsed: 0,
    duration: 300,
    selectedMinutes: 5,
    selectedType: 'breath',
    isRunning: false,
    isPaused: false,
    focusRating: 0,

    init() {
        this.bindEvents();
        this.updateStats();
    },

    bindEvents() {
        // Duration select
        document.querySelectorAll('#timerDurationSelect .dur-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return;
                document.querySelectorAll('#timerDurationSelect .dur-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMinutes = parseInt(btn.dataset.min);
                this.duration = this.selectedMinutes * 60;
                this.updateDisplay(this.duration);
            });
        });

        // Type select
        document.querySelectorAll('#timerTypeSelect .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return;
                document.querySelectorAll('#timerTypeSelect .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedType = btn.dataset.type;
            });
        });

        // Controls
        document.getElementById('btnMeditationStart').addEventListener('click', () => this.start());
        document.getElementById('btnMeditationPause').addEventListener('click', () => this.pause());
        document.getElementById('btnMeditationStop').addEventListener('click', () => this.stop());

        // Star rating
        document.querySelectorAll('#focusRating .star').forEach(star => {
            star.addEventListener('click', () => {
                this.focusRating = parseInt(star.dataset.val);
                this.updateStars();
            });
        });

        // Save
        document.getElementById('btnSaveMeditation').addEventListener('click', () => this.save());

        // Close after-modal on overlay click
        document.getElementById('meditationAfterModal').addEventListener('click', (e) => {
            if (e.target.id === 'meditationAfterModal'); // don't close, must save
        });
    },

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.elapsed = 0;

        document.getElementById('btnMeditationStart').classList.add('hidden');
        document.getElementById('btnMeditationPause').classList.remove('hidden');
        document.getElementById('btnMeditationStop').classList.remove('hidden');

        // Disable selectors
        document.getElementById('timerDurationSelect').style.opacity = '0.4';
        document.getElementById('timerDurationSelect').style.pointerEvents = 'none';
        document.getElementById('timerTypeSelect').style.opacity = '0.4';
        document.getElementById('timerTypeSelect').style.pointerEvents = 'none';

        const circumference = 2 * Math.PI * 90;
        const progressEl = document.getElementById('timerProgress');
        progressEl.style.strokeDasharray = circumference;

        this.timer = setInterval(() => {
            if (this.isPaused) return;
            this.elapsed++;

            if (this.selectedMinutes === 0) {
                // Free mode: count up
                this.updateDisplay(this.elapsed);
                const progress = Math.min(this.elapsed / 1800, 1);
                progressEl.style.strokeDashoffset = circumference * (1 - progress);
            } else {
                const remaining = this.duration - this.elapsed;
                this.updateDisplay(remaining);
                const progress = this.elapsed / this.duration;
                progressEl.style.strokeDashoffset = circumference * (1 - progress);

                if (remaining <= 0) {
                    this.finish();
                }
            }
        }, 1000);
    },

    pause() {
        this.isPaused = !this.isPaused;
        document.getElementById('btnMeditationPause').textContent = this.isPaused ? '재개' : '일시정지';
    },

    stop() {
        if (this.elapsed < 10) {
            this.reset();
            return;
        }
        this.finish();
    },

    finish() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        // Show after modal
        const min = Math.floor(this.elapsed / 60);
        const sec = this.elapsed % 60;
        document.getElementById('medCompleteDuration').textContent = `${min}분 ${sec}초 명상했어요 🙏`;
        this.focusRating = 0;
        this.updateStars();
        document.getElementById('medMemo').value = '';
        document.getElementById('meditationAfterModal').classList.remove('hidden');
    },

    save() {
        const typeNames = { breath: '호흡 관찰', bodyscan: '바디스캔', loving: '자애 명상', silent: '무음' };
        const record = {
            date: store.today(),
            duration: this.elapsed,
            type: this.selectedType,
            typeName: typeNames[this.selectedType] || this.selectedType,
            focusRating: this.focusRating,
            memo: document.getElementById('medMemo').value.trim()
        };
        store.addMeditationRecord(record);

        // Update profile
        const profile = store.getProfile();
        profile.meditationMinutes += Math.round(this.elapsed / 60);
        const today = store.today();
        if (profile.lastMeditationDate !== today) {
            profile.meditationStreak = (profile.lastMeditationDate === this._yesterday()) ? profile.meditationStreak + 1 : 1;
            profile.lastMeditationDate = today;
        }
        // Meditation levels
        const totalMin = profile.meditationMinutes;
        if (totalMin >= 3000) profile.meditationLevel = 5;
        else if (totalMin >= 1000) profile.meditationLevel = 4;
        else if (totalMin >= 300) profile.meditationLevel = 3;
        else if (totalMin >= 60) profile.meditationLevel = 2;
        else profile.meditationLevel = 1;
        store.saveProfile(profile);



        // Auto-complete linked daily quest (e.g., 명상 5분)
        const todayKey = store.today();
        const missions = store.getTodayDailyMissions();
        const target = missions.find(m => {
            if (m.completedDates && m.completedDates.includes(todayKey)) return false;
            const t = (m.title || '').toLowerCase();
            const minMatch = t.match(/(\d+)\s*분/);
            const needMin = minMatch ? parseInt(minMatch[1]) : 0;
            const isMeditationMission = t.includes('명상') || t.includes('meditation');
            return isMeditationMission && (!needMin || this.elapsed >= needMin * 60);
        });
        if (target) {
            Gamification.completeMission(target.id);
        }

        // Award EXP
        const medExp = Math.max(5, Math.round(this.elapsed / 12));
        Gamification.awardExp(medExp);

        // Close modal and reset
        document.getElementById('meditationAfterModal').classList.add('hidden');
        this.reset();
        this.updateStats();
        Dashboard.render();
    },

    reset() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        this.elapsed = 0;

        document.getElementById('btnMeditationStart').classList.remove('hidden');
        document.getElementById('btnMeditationPause').classList.add('hidden');
        document.getElementById('btnMeditationStop').classList.add('hidden');
        document.getElementById('btnMeditationPause').textContent = '일시정지';

        document.getElementById('timerDurationSelect').style.opacity = '1';
        document.getElementById('timerDurationSelect').style.pointerEvents = 'auto';
        document.getElementById('timerTypeSelect').style.opacity = '1';
        document.getElementById('timerTypeSelect').style.pointerEvents = 'auto';

        // Reset ring
        const circumference = 2 * Math.PI * 90;
        const progressEl = document.getElementById('timerProgress');
        progressEl.style.strokeDasharray = circumference;
        progressEl.style.strokeDashoffset = circumference;

        this.updateDisplay(this.selectedMinutes * 60 || 0);
    },

    updateDisplay(totalSeconds) {
        const display = document.getElementById('timerDisplay');
        if (totalSeconds === 0 && this.selectedMinutes === 0 && !this.isRunning) {
            display.textContent = '자유';
            return;
        }
        const m = Math.floor(Math.abs(totalSeconds) / 60);
        const s = Math.abs(totalSeconds) % 60;
        display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    updateStars() {
        document.querySelectorAll('#focusRating .star').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.val) <= this.focusRating);
        });
    },

    updateStats() {
        const profile = store.getProfile();
        const totalEl = document.getElementById('medTotalTime');
        const streakEl = document.getElementById('medStreak');
        const levelEl = document.getElementById('medLevel');
        const levelNames = ['수련생', '수련생', '명상자', '도반', '선인', '현자'];
        if (totalEl) totalEl.textContent = `${profile.meditationMinutes || 0}분`;
        if (streakEl) streakEl.textContent = `${profile.meditationStreak || 0}일`;
        if (levelEl) levelEl.textContent = levelNames[profile.meditationLevel || 1];
    },

    _yesterday() {
        const d = new Date(Date.now() - 86400000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
};
