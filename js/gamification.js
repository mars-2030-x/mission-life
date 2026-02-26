/* =============================================
   Gamification — EXP, Level, Streak, Effects
   ============================================= */

const Gamification = {
    TITLES: [
        { level: 1, name: '초심자', emoji: '🌱' },
        { level: 5, name: '수련생', emoji: '🔥' },
        { level: 10, name: '모험가', emoji: '⚔️' },
        { level: 20, name: '용사', emoji: '🛡️' },
        { level: 35, name: '마스터', emoji: '👑' },
        { level: 50, name: '전설', emoji: '🌟' },
    ],

    getTitle(level) {
        let title = this.TITLES[0];
        for (const t of this.TITLES) {
            if (level >= t.level) title = t;
        }
        return title;
    },

    expForLevel(level) { return level * 100; },

    calcMissionExp(difficulty) {
        const base = 20;
        const profile = store.getProfile();
        const streakBonus = Math.min(profile.currentStreak * 2, 20);
        return base * (difficulty || 2) + streakBonus;
    },

    awardExp(amount) {
        const profile = store.getProfile();
        profile.totalExp += amount;
        let leveledUp = false;
        while (profile.totalExp >= this.expForLevel(profile.level)) {
            profile.totalExp -= this.expForLevel(profile.level);
            profile.level++;
            leveledUp = true;
        }
        store.saveProfile(profile);
        if (leveledUp) this.showLevelUp(profile.level);
        return { leveledUp, level: profile.level, totalExp: profile.totalExp };
    },

    checkDailyStreak() {
        const profile = store.getProfile();
        const today = store.today();
        if (profile.lastCompletionDate === today) return;

        const todayMissions = store.getTodayDailyMissions();
        if (todayMissions.length === 0) return;

        const completedCount = todayMissions.filter(m =>
            m.completedDates && m.completedDates.includes(today)
        ).length;
        const rate = completedCount / todayMissions.length;

        if (rate >= 0.8) {
            const yesterday = new Date(Date.now() - 86400000);
            const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            if (profile.lastCompletionDate === yStr) {
                profile.currentStreak++;
            } else {
                profile.currentStreak = 1;
            }
            if (profile.currentStreak > profile.longestStreak) {
                profile.longestStreak = profile.currentStreak;
            }
            profile.lastCompletionDate = today;
            store.saveProfile(profile);
        }
    },

    completeMission(missionId) {
        const today = store.today();
        const mission = store.getMission(missionId);
        if (!mission) return null;
        if (!mission.completedDates) mission.completedDates = [];
        if (mission.completedDates.includes(today)) return null;

        mission.completedDates.push(today);
        mission.streak = (mission.streak || 0) + 1;
        store.updateMission(missionId, {
            completedDates: mission.completedDates,
            streak: mission.streak
        });

        const exp = this.calcMissionExp(mission.difficulty || 2);
        const result = this.awardExp(exp);
        this.showCompleteEffect(exp);
        this.checkDailyStreak();
        return { exp, ...result };
    },

    showCompleteEffect(exp) {
        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            font-size:24px;font-weight:800;color:#00e5c8;z-index:3000;
            text-shadow:0 0 20px rgba(0,229,200,0.5);pointer-events:none;
            animation:checkPop 0.4s ease;
        `;
        el.textContent = `✅ +${exp} EXP`;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.transition = '0.5s ease';
            el.style.opacity = '0';
            el.style.transform = 'translate(-50%,-80%)';
        }, 600);
        setTimeout(() => el.remove(), 1200);
    },

    showLevelUp(level) {
        const title = this.getTitle(level);
        const overlay = document.getElementById('levelUpOverlay');
        document.getElementById('levelUpLevel').textContent = `Lv.${level}`;
        document.getElementById('levelUpTitle').textContent = `${title.emoji} ${title.name}`;
        overlay.classList.remove('hidden');

        // Particles
        const particlesEl = document.getElementById('particles');
        particlesEl.innerHTML = '';
        const colors = ['#9b59ff', '#00d4ff', '#ff6bb5', '#ff9f43', '#2ed573', '#00e5c8'];
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const tx = (Math.random() - 0.5) * 600;
            const ty = (Math.random() - 0.5) * 600;
            p.style.cssText = `left:50%;top:50%;background:${colors[i % colors.length]};--tx:${tx}px;--ty:${ty}px;animation-delay:${Math.random() * 0.3}s;`;
            particlesEl.appendChild(p);
        }

        document.getElementById('levelUpClose').onclick = () => overlay.classList.add('hidden');
    },

    updateSidebarLevel() {
        const profile = store.getProfile();
        const title = this.getTitle(profile.level);
        const badge = document.querySelector('.level-badge');
        const titleEl = document.querySelector('.level-title');
        if (badge) badge.textContent = `Lv.${profile.level}`;
        if (titleEl) titleEl.textContent = title.name;
    }
};
