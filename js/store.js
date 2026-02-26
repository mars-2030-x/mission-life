/* =============================================
   Store — LocalStorage CRUD + Event System
   ============================================= */

class Store {
    constructor() {
        this.defaults = {
            missions: [],
            meditation: [],
            profile: {
                level: 1,
                totalExp: 0,
                currentStreak: 0,
                longestStreak: 0,
                meditationMinutes: 0,
                meditationLevel: 1,
                meditationStreak: 0,
                lastCompletionDate: null,
                lastMeditationDate: null,
                onboarded: false,
            }
        };
        // Init defaults if empty
        for (const [key, val] of Object.entries(this.defaults)) {
            if (localStorage.getItem(`ml_${key}`) === null) {
                this.set(key, val);
            }
        }
    }

    get(key) {
        try {
            const data = localStorage.getItem(`ml_${key}`);
            return data ? JSON.parse(data) : JSON.parse(JSON.stringify(this.defaults[key]));
        } catch { return JSON.parse(JSON.stringify(this.defaults[key])); }
    }

    set(key, value) {
        localStorage.setItem(`ml_${key}`, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('store:update', { detail: { key, value } }));
    }

    // Missions
    getMissions() { return this.get('missions'); }
    saveMissions(m) { this.set('missions', m); }

    addMission(mission) {
        const missions = this.getMissions();
        mission.id = this._uid();
        mission.createdAt = new Date().toISOString();
        mission.completedDates = [];
        mission.streak = 0;
        missions.push(mission);
        this.saveMissions(missions);
        return mission;
    }

    updateMission(id, updates) {
        const missions = this.getMissions();
        const idx = missions.findIndex(m => m.id === id);
        if (idx === -1) return null;
        missions[idx] = { ...missions[idx], ...updates };
        this.saveMissions(missions);
        return missions[idx];
    }

    deleteMission(id) {
        let missions = this.getMissions();
        // Also remove children
        const childIds = missions.filter(m => m.parentId === id).map(m => m.id);
        childIds.forEach(cid => {
            const gc = missions.filter(m => m.parentId === cid).map(m => m.id);
            missions = missions.filter(m => !gc.includes(m.id));
        });
        missions = missions.filter(m => m.id !== id && !childIds.includes(m.id));
        this.saveMissions(missions);
    }

    getMission(id) { return this.getMissions().find(m => m.id === id) || null; }

    getTodayDailyMissions() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        return this.getMissions().filter(m => {
            if (m.type !== 'daily') return false;
            if (m.repeatDays && m.repeatDays.length > 0) return m.repeatDays.includes(dayOfWeek);
            return true;
        });
    }

    // Profile
    getProfile() { return this.get('profile'); }
    saveProfile(p) { this.set('profile', p); }

    // Meditation
    getMeditationRecords() { return this.get('meditation'); }
    addMeditationRecord(record) {
        const records = this.getMeditationRecords();
        record.id = this._uid();
        records.push(record);
        this.set('meditation', records);
        return record;
    }

    // Helpers
    _uid() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 8); }
    today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}

const store = new Store();
