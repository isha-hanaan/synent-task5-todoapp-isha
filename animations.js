const AnimationsModule = (() => {
    /**
     * Create confetti effect
     */
    const createConfetti = (count = 50) => {
        const container = document.getElementById('confettiContainer');
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';

            const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            const size = Math.random() * 10 + 5;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';

            const startX = Math.random() * window.innerWidth;
            confetti.style.left = startX + 'px';
            confetti.style.top = '-10px';

            const rotation = Math.random() * 360;
            confetti.style.transform = `rotate(${rotation}deg)`;

            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 0.5;
            const tx = (Math.random() - 0.5) * 200;
            const ty = Math.random() * 300 + 200;

            confetti.style.setProperty('--tx', `${tx}px`);
            confetti.style.setProperty('--ty', `${ty}px`);
            confetti.style.animation = `confettiFall ${duration}s linear ${delay}s forwards, confettiSwing ${Math.random() * 2 + 1}s ease-in-out ${delay}s infinite`;

            container.appendChild(confetti);

            // Remove after animation
            setTimeout(() => confetti.remove(), (duration + delay) * 1000);
        }
    };

    /**
     * Create particle burst effect
     */
    const createParticleBurst = (x, y, count = 20) => {
        const container = document.getElementById('confettiContainer');
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti';

            const size = Math.random() * 6 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            particle.style.backgroundColor = '#10B981';

            const angle = (i / count) * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.animation = `particleBurst 0.8s ease-out forwards`;

            container.appendChild(particle);

            setTimeout(() => particle.remove(), 800);
        }
    };

    /**
     * Shake effect
     */
    const shake = (element, duration = 300) => {
        element.style.animation = `shake 0.1s infinite`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    };

    /**
     * Pulse effect
     */
    const pulse = (element, duration = 600) => {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    };

    /**
     * Glow effect
     */
    const glow = (element, duration = 1000) => {
        element.style.animation = `glow ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    };

    /**
     * Success check animation
     */
    const successCheck = (element, duration = 600) => {
        element.style.animation = `successCheck ${duration}ms ease-out forwards`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    };

    /**
     * Pop animation (fades out while scaling)
     */
    const pop = (element, duration = 400) => {
        element.style.animation = `pop ${duration}ms ease-out forwards`;
        setTimeout(() => {
            element.remove();
        }, duration);
    };

    /**
     * Bounce animation
     */
    const bounce = (element, duration = 600) => {
        element.style.animation = `bounce ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    };

    /**
     * Task completion effect
     */
    const taskCompletionEffect = (taskElement, callback) => {
        // Create particle burst from task
        const rect = taskElement.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        createParticleBurst(x, y, 30);

        // Animate task
        taskElement.style.animation = `taskComplete 600ms ease-out forwards`;

        // Confetti
        createConfetti(20);

        // Play sound if enabled
        playCompletionSound();

        setTimeout(() => {
            if (callback) callback();
        }, 600);
    };

    /**
     * Level up effect
     */
    const levelUpEffect = (element) => {
        const levelUpText = document.createElement('div');
        levelUpText.style.position = 'fixed';
        levelUpText.style.left = '50%';
        levelUpText.style.top = '50%';
        levelUpText.style.transform = 'translate(-50%, -50%)';
        levelUpText.style.fontSize = '3rem';
        levelUpText.style.fontWeight = 'bold';
        levelUpText.style.zIndex = '2000';
        levelUpText.style.pointerEvents = 'none';
        levelUpText.textContent = '🎉 LEVEL UP!';

        document.body.appendChild(levelUpText);

        const container = document.getElementById('confettiContainer');
        if (container) {
            container.style.position = 'fixed';
        }

        createConfetti(100);

        levelUpText.style.animation = `levelUp 1s ease-out forwards`;

        setTimeout(() => {
            levelUpText.remove();
        }, 1000);
    };

    /**
     * Badge unlock effect
     */
    const badgeUnlockEffect = (badgeName) => {
        const badgeElement = document.createElement('div');
        badgeElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            color: white;
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2);
            z-index: 2000;
            font-weight: 600;
            animation: badgeUnlock 0.8s ease-out forwards;
        `;
        badgeElement.textContent = `🏆 Badge Unlocked: ${badgeName}`;

        document.body.appendChild(badgeElement);

        setTimeout(() => {
            badgeElement.remove();
        }, 3000);
    };

    /**
     * Play completion sound
     */
    const playCompletionSound = () => {
        const settings = Storage.getSettings();
        if (!settings.soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    };

    /**
     * Vibration effect (mobile)
     */
    const vibrate = (duration = 200) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    };

    /**
     * Scroll reveal animation
     */
    const setupScrollReveal = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-reveal');
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-aos]').forEach(el => {
            observer.observe(el);
        });
    };

    /**
     * Smooth page transition
     */
    const pageTransition = () => {
        document.body.style.animation = 'pageEnter 0.5s ease-out';
    };

    /**
     * Stagger animation for lists
     */
    const staggerList = (container) => {
        const items = container.querySelectorAll('li, .task-item');
        items.forEach((item, index) => {
            item.style.animation = `slideIn 0.3s ease-out ${index * 0.05}s backwards`;
        });
    };

    /**
     * Smooth color transition
     */
    const smoothColorTransition = (element, fromColor, toColor, duration = 300) => {
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;

            if (progress < 1) {
                const from = hexToRgb(fromColor);
                const to = hexToRgb(toColor);

                const r = Math.round(from.r + (to.r - from.r) * progress);
                const g = Math.round(from.g + (to.g - from.g) * progress);
                const b = Math.round(from.b + (to.b - from.b) * progress);

                element.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                requestAnimationFrame(step);
            } else {
                element.style.backgroundColor = toColor;
            }
        };

        requestAnimationFrame(step);
    };

    /**
     * Helper to convert hex to RGB
     */
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    return {
        createConfetti,
        createParticleBurst,
        shake,
        pulse,
        glow,
        successCheck,
        pop,
        bounce,
        taskCompletionEffect,
        levelUpEffect,
        badgeUnlockEffect,
        playCompletionSound,
        vibrate,
        setupScrollReveal,
        pageTransition,
        staggerList,
        smoothColorTransition
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    AnimationsModule.setupScrollReveal();
});
