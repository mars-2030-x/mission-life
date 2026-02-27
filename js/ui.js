/* =============================================
   UI Interactions — Liquid Buttons & Magnetic Cards
   Inspired by React Bits & FreeFrontend
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Globals for requested animation frames
    let rafId = null;

    // Track mouse movement globally for UI effects
    document.body.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
            // 1. Magnetic Card Glow Effect
            const targetCard = e.target.closest('.card');
            if (targetCard) {
                const rect = targetCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                targetCard.style.setProperty('--cursor-x', `${x}px`);
                targetCard.style.setProperty('--cursor-y', `${y}px`);
            }

            // 2. Liquid Button Blob Tracking
            const targetBtn = e.target.closest('.btn-primary, .btn-mission-start, .btn-mission-complete, .btn-timer-start, .btn-add');
            if (targetBtn) {
                const rect = targetBtn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                targetBtn.style.setProperty('--mouse-x', `${x}px`);
                targetBtn.style.setProperty('--mouse-y', `${y}px`);
            }
        });
    });

    // Add CSS classes for Liquid Button setup
    document.querySelectorAll('.btn-primary, .btn-mission-start, .btn-mission-complete, .btn-timer-start, .btn-add').forEach(btn => {
        btn.classList.add('liquid-setup');

        // Add elements inside button for the liquid effect
        if (!btn.querySelector('.liquid-blob')) {
            const blob = document.createElement('span');
            blob.classList.add('liquid-blob');
            btn.appendChild(blob);
        }
    });

    // Monitor DOM for new buttons and cards (e.g. Daily Quests added dynamically)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    // If the added node is a button or contains buttons
                    const btns = node.matches('.btn-primary, .btn-mission-start, .btn-mission-complete, .btn-timer-start, .btn-add') ? [node] : node.querySelectorAll('.btn-primary, .btn-mission-start, .btn-mission-complete, .btn-timer-start, .btn-add');

                    btns.forEach(btn => {
                        if (!btn.classList.contains('liquid-setup')) {
                            btn.classList.add('liquid-setup');
                            if (!btn.querySelector('.liquid-blob')) {
                                const blob = document.createElement('span');
                                blob.classList.add('liquid-blob');
                                btn.appendChild(blob);
                            }
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
