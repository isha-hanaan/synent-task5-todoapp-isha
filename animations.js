
const AnimationsModule = (() => {
    const createConfetti = (count = 40) => {
        const container = document.getElementById("confettiContainer");
        if (!container) return;

        const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.left = `${Math.random() * window.innerWidth}px`;
            confetti.style.top = "-10px";
            confetti.style.setProperty("--tx", `${(Math.random() - 0.5) * 200}px`);
            confetti.style.setProperty("--ty", `${Math.random() * 300 + 200}px`);
            confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;

            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    };

    const createParticleBurst = (x, y, count = 20) => {
        const container = document.getElementById("confettiContainer");
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "confetti";
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = "6px";
            particle.style.height = "6px";
            particle.style.backgroundColor = "#10B981";

            const angle = (i / count) * Math.PI * 2;
            const distance = Math.random() * 100 + 40;
            particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
            particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
            particle.style.animation = "particleBurst 0.8s ease-out forwards";

            container.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    };

    const taskCompletionEffect = (taskElement, callback) => {
        const rect = taskElement.getBoundingClientRect();
        createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
        taskElement.style.animation = "taskComplete 500ms ease-out forwards";
        createConfetti(18);

        setTimeout(() => {
            if (callback) callback();
        }, 500);
    };

    const badgeUnlockEffect = (badgeName) => {
        const badge = document.createElement("div");
        badge.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2000;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      color: white;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      box-shadow: 0 20px 25px rgba(0,0,0,.2);
      font-weight: 700;
    `;
        badge.textContent = `🏆 Badge Unlocked: ${badgeName}`;
        document.body.appendChild(badge);

        setTimeout(() => badge.remove(), 2600);
    };

    const setupScrollReveal = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("scroll-reveal", "visible");
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll("[data-aos]").forEach((el) => observer.observe(el));
    };

    return {
        createConfetti,
        createParticleBurst,
        taskCompletionEffect,
        badgeUnlockEffect,
        setupScrollReveal
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    AnimationsModule.setupScrollReveal();
});