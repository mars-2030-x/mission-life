/* =============================================
   App — Init, Routing, Onboarding
   ============================================= */

const App = {
    currentPage: 'dashboard',

    init() {
        // Init modules
        Missions.init();
        Meditation.init();
        Dashboard.init();

        // Navigation
        this.bindNavigation();
        this.bindQuickFab();

        // Hash routing
        this.route();
        window.addEventListener('hashchange', () => this.route());

        // Onboarding
        this.checkOnboarding();

        // Periodic update
        setInterval(() => {
            if (this.currentPage === 'dashboard') Dashboard.render();
        }, 60000);

        console.log('🚀 Mission Life initialized!');
    },

    bindNavigation() {
        // Sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                location.hash = '#' + page;
            });
        });

        // Bottom tab
        document.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                location.hash = '#' + page;
            });
        });
    },



    bindQuickFab() {
        const fab = document.getElementById('quickFab');
        const menu = document.getElementById('quickFabMenu');
        if (!fab || !menu) return;

        fab.addEventListener('click', () => menu.classList.toggle('hidden'));
        menu.querySelectorAll('.fab-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'add-daily') {
                    location.hash = '#today';
                    const title = prompt('추가할 데일리 퀘스트를 입력하세요');
                    if (title) Missions.quickAddTodayMission(title);
                }
                if (action === 'start-meditation') {
                    location.hash = '#meditation';
                }
                if (action === 'add-record') {
                    location.hash = '#today';
                    const note = prompt('기록 한 줄 남기기');
                    if (note && note.trim()) {
                        localStorage.setItem('ml_lastQuickRecord', note.trim());
                    }
                }
                menu.classList.add('hidden');
            });
        });
    },

    route() {
        const hash = location.hash.replace('#', '') || 'dashboard';
        const validPages = ['dashboard', 'plan', 'today', 'meditation', 'stats'];
        const page = validPages.includes(hash) ? hash : 'dashboard';
        this.showPage(page);
    },

    showPage(page) {
        this.currentPage = page;

        // Toggle pages: use hidden class
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('hidden', p.id !== `page-${page}`);
        });

        // Nav active states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Refresh page data
        if (page === 'dashboard') Dashboard.render();
        if (page === 'plan') Missions.renderPlan();
        if (page === 'today') Missions.renderToday();
        if (page === 'meditation') Meditation.updateStats();
        if (page === 'stats') Dashboard.renderStats();
    },

    checkOnboarding() {
        const profile = store.getProfile();
        if (!profile.onboarded) {
            document.getElementById('onboardingModal').classList.remove('hidden');
            document.getElementById('onboardingStart').addEventListener('click', () => {
                document.getElementById('onboardingModal').classList.add('hidden');
                store.saveProfile({ ...profile, onboarded: true });
            });
        }
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
