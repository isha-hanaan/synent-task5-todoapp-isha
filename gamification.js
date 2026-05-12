const Gamification = (() => {
    const XP_PER_TASK = 10;
    const XP_PER_LEVEL = 100;
    const LEVEL_UP_THRESHOLD = 5;

    /**
     * Get current stats
     */
    const getStats = () => {
        return Storage.getGamificationStats();
    };

    /**
     * Update stats
     */
    const updateStats = (stats) => {
        Storage.updateGamificationStats(stats);
    };

    /**
     * Add XP
     */
    const addXP = (amount) => {
        const stats = getStats();
        stats.xp += amount;

        // Check for level up
        const xpPerLevel = XP_PER_LEVEL;
        const newLevel = Math.floor(stats.xp / xpPerLevel) + 1;

        if (newLevel > stats.level) {
            stats.level = newLevel;
            stats.badges = stats.badges || [];

            // Award level up badge
            const badge = {
                type: 'levelup',
                level: newLevel,
                unlockedAt: new Date().toISOString()
            };

            if (!stats.badges.find(b => b.type === 'levelup' && b.level === newLevel)) {
                stats.badges.push(badge);
            }
        }

        updateStats(stats);
        return stats;
    };

    /**
     * Handle task completion
     */
    const onTaskCompleted = (task) => {
        const stats = getStats();

        // Add XP based on priority
        let xp = XP_PER_TASK;
        if (task.priority === 'high') xp = 20;
        else if (task.priority === 'medium') xp = 15;

        addXP(xp);

        // Update streak
        updateStreak();

        // Track completion
        stats.totalCompleted = (stats.totalCompleted || 0) + 1;

        // Check for completion milestones
        checkCompletionMilestones(stats);

        // Update task completion time
        Storage.updateTask(task.id, {
            completedAt: new Date().toISOString()
        });

        updateStats(stats);
    };

    /**
     * Update streak
     */
    const updateStreak = () => {
        const stats = getStats();
        const today = new Date().toISOString().split('T')[0];
        const lastCompletion = stats.lastCompletionDate;

        let newStreak = stats.streak || 0;

        if (!lastCompletion) {
            newStreak = 1;
        } else {
            const lastDate = new Date(lastCompletion);
            const todayDate = new Date(today);
            const dayDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (dayDiff === 0) {
                // Already completed today
            } else if (dayDiff === 1) {
                // Consecutive day
                newStreak += 1;

                // Check streak milestones
                if (newStreak === 7) {
                    addBadge('week_streak', 'One Week Streak');
                } else if (newStreak === 30) {
                    addBadge('month_streak', 'One Month Streak');
                } else if (newStreak === 100) {
                    addBadge('century_streak', 'Century Streak');
                }
            } else {
                // Streak broken
                newStreak = 1;
            }
        }

        stats.streak = newStreak;
        stats.lastCompletionDate = today;
        updateStats(stats);

        return newStreak;
    };

    /**
     * Check for completion milestones
     */
    const checkCompletionMilestones = (stats) => {
        const total = stats.totalCompleted;

        const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];

        milestones.forEach(milestone => {
            if (total === milestone) {
                addBadge(`tasks_${milestone}`, `${milestone} Tasks Completed`);
            }
        });
    };

    /**
     * Add badge
     */
    const addBadge = (type, name) => {
        const stats = getStats();
        stats.badges = stats.badges || [];

        if (!stats.badges.find(b => b.type === type)) {
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

    /**
     * Get badges
     */
    const getBadges = () => {
        const stats = getStats();
        return stats.badges || [];
    };

    /**
     * Get all available badges (for display)
     */
    const getAllBadges = () => {
        return [
            { type: 'tasks_5', name: '5 Tasks Completed', emoji: '🎯' },
            { type: 'tasks_10', name: '10 Tasks Completed', emoji: '⭐' },
            { type: 'tasks_25', name: '25 Tasks Completed', emoji: '🚀' },
            { type: 'tasks_50', name: '50 Tasks Completed', emoji: '👑' },
            { type: 'tasks_100', name: '100 Tasks Completed', emoji: '💎' },
            { type: 'tasks_250', name: '250 Tasks Completed', emoji: '🏆' },
            { type: 'tasks_500', name: '500 Tasks Completed', emoji: '🌟' },
            { type: 'tasks_1000', name: '1000 Tasks Completed', emoji: '👑✨' },
            { type: 'week_streak', name: 'One Week Streak', emoji: '🔥' },
            { type: 'month_streak', name: 'One Month Streak', emoji: '🔥🔥' },
            { type: 'century_streak', name: 'Century Streak', emoji: '🔥🔥🔥' }
        ];
    };

    /**
     * Get earned badges
     */
    const getEarnedBadges = () => {
        const earned = getBadges();
        const all = getAllBadges();

        return earned.map(e => {
            const badge = all.find(b => b.type === e.type);
            return {
                ...badge,
                ...e
            };
        }).sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
    };

    /**
     * Get productivity level
     */
    const getProductivityLevel = (completed, total) => {
        if (total === 0) return 'beginner';

        const percentage = (completed / total) * 100;

        if (percentage >= 90) return 'elite';
        if (percentage >= 75) return 'expert';
        if (percentage >= 60) return 'advanced';
        if (percentage >= 45) return 'intermediate';
        return 'beginner';
    };

    /**
     * Get productivity score (0-100)
     */
    const getProductivityScore = () => {
        const stats = getStats();
        const thisWeek = Tasks.getCompletedThisWeek();
        const thisWeekAll = Storage.getActiveTasks().filter(t => {
            if (!t.createdAt) return false;
            const created = new Date(t.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= weekAgo;
        });

        let score = 0;

        // Completion rate (40%)
        if (thisWeekAll.length > 0) {
            const completionRate = (thisWeek.length / thisWeekAll.length) * 100;
            score += (completionRate / 100) * 40;
        }

        // Streak (30%)
        const streakScore = Math.min((stats.streak || 0) / 30 * 100, 100);
        score += (streakScore / 100) * 30;

        // Level (20%)
        const levelScore = ((stats.level || 1) / 10) * 100;
        score += Math.min((levelScore / 100) * 20, 20);

        // On-time completion (10%)
        const onTime = thisWeek.filter(t => {
            if (t.dueDate && t.completedAt) {
                return new Date(t.completedAt).toISOString().split('T')[0] <= t.dueDate;
            }
            return false;
        });

        if (thisWeek.length > 0) {
            score += ((onTime.length / thisWeek.length) * 100 / 100) * 10;
        }

        return Math.round(score);
    };

    /**
     * Reset streak (for testing)
     */
    const resetStreak = () => {
        const stats = getStats();
        stats.streak = 0;
        stats.lastCompletionDate = null;
        updateStats(stats);
    };

    /**
     * Get next milestone
     */
    const getNextMilestone = () => {
        const stats = getStats();
        const completed = stats.totalCompleted || 0;

        const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
        const next = milestones.find(m => m > completed);

        return next || 1000;
    };

    /**
     * Get progress to next milestone
     */
    const getProgressToNextMilestone = () => {
        const stats = getStats();
        const completed = stats.totalCompleted || 0;
        const next = getNextMilestone();

        const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
        const prev = milestones.filter(m => m < next)[milestones.filter(m => m < next).length - 1] || 0;

        const progress = completed - prev;
        const total = next - prev;

        return {
            current: completed,
            next,
            progress,
            total,
            percentage: Math.round((progress / total) * 100)
        };
    };

    return {
        getStats,
        updateStats,
        addXP,
        onTaskCompleted,
        updateStreak,
        addBadge,
        getBadges,
        getAllBadges,
        getEarnedBadges,
        getProductivityLevel,
        getProductivityScore,
        resetStreak,
        getNextMilestone,
        getProgressToNextMilestone
    };
})();
