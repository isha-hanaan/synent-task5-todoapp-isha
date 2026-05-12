const Gamification = (() => {
    const XP_PER_TASK = 10;
    const XP_PER_LEVEL = 100;

    const getStats = () => Storage.getGamificationStats();

    const updateStats = (stats) => {
        Storage.updateGamificationStats(stats);
    };

    const addXP = (amount) => {
        const stats = getStats();
        stats.xp = (stats.xp || 0) + amount;

        const newLevel = Math.floor(stats.xp / XP_PER_LEVEL) + 1;
        if (newLevel > (stats.level || 1)) {
            stats.level = newLevel;
            addBadge(`level_${newLevel}`, `Level ${newLevel}`);
        }

        updateStats(stats);
        return stats;
    };

    const updateStreak = () => {
        const stats = getStats();
        const today = new Date().toISOString().split("T")[0];
        const lastDate = stats.lastCompletionDate;

        if (!lastDate) {
            stats.streak = 1;
        } else {
            const last = new Date(lastDate);
            const now = new Date(today);
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                stats.streak = (stats.streak || 0) + 1;
            } else if (diffDays > 1) {
                stats.streak = 1;
            }
        }

        stats.lastCompletionDate = today;
        updateStats(stats);
        return stats.streak || 0;
    };

    const addBadge = (type, name) => {
        const stats = getStats();
        stats.badges = stats.badges || [];

        if (!stats.badges.find((badge) => badge.type === type)) {
            stats.badges.push({
                type,
                name,
                unlockedAt: new Date().toISOString()
            });
            updateStats(stats);
            return true;
        }

        return false;
    };

    const onTaskCompleted = (task) => {
        const xp = task.priority === "high" ? 20 : task.priority === "medium" ? 15 : 10;
        addXP(xp);
        updateStreak();

        const stats = getStats();
        stats.totalCompleted = (stats.totalCompleted || 0) + 1;

        if (stats.totalCompleted === 5) addBadge("tasks_5", "5 Tasks Completed");
        if (stats.totalCompleted === 10) addBadge("tasks_10", "10 Tasks Completed");
        if (stats.totalCompleted === 25) addBadge("tasks_25", "25 Tasks Completed");
        if (stats.totalCompleted === 50) addBadge("tasks_50", "50 Tasks Completed");

        updateStats(stats);
    };

    const getBadges = () => getStats().badges || [];

    const getEarnedBadges = () => {
        return getBadges().sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
    };

    const getProductivityScore = () => {
        const stats = getStats();
        const streak = stats.streak || 0;
        const level = stats.level || 1;
        const totalCompleted = stats.totalCompleted || 0;
        const thisWeek = Tasks.getCompletedThisWeek().length;

        let score = 0;
        score += Math.min(thisWeek * 10, 40);
        score += Math.min(streak * 2, 30);
        score += Math.min((level - 1) * 5, 20);
        score += Math.min(totalCompleted / 10, 10);

        return Math.min(Math.round(score), 100);
    };

    const getProgressToNextMilestone = () => {
        const stats = getStats();
        const completed = stats.totalCompleted || 0;
        const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
        const next = milestones.find((m) => m > completed) || 1000;
        const prev = [...milestones].reverse().find((m) => m < next) || 0;

        return {
            current: completed,
            next,
            progress: completed - prev,
            total: next - prev,
            percentage: Math.round(((completed - prev) / (next - prev)) * 100)
        };
    };

    return {
        getStats,
        updateStats,
        addXP,
        updateStreak,
        addBadge,
        onTaskCompleted,
        getBadges,
        getEarnedBadges,
        getProductivityScore,
        getProgressToNextMilestone
    };
})();