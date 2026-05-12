const LandingPage = (() => {
    /**
     * Initialize landing page
     */
    const init = () => {
        setupThemeToggle();
        setupScrollAnimations();
        setupEventListeners();
    };

    /**
     * Setup theme toggle
     */
    const setupThemeToggle = () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const savedTheme = Storage.getTheme();
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            Storage.setTheme(isDark ? 'dark' : 'light');
        });
    };

    /**
     * Setup scroll animations
     */
    const setupScrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.6s ease-out forwards';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .stats-grid').forEach(el => {
            observer.observe(el);
        });
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        const demoScroll = document.getElementById('demoScroll');
        if (demoScroll) {
            demoScroll.addEventListener('click', () => {
                document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
            });
        }
    };

    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
