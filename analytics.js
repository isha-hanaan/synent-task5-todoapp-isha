
const Analytics = (() => {
    /**
     * Get analytics data
     */
    const getAnalytics = () => {
        return Storage.getAnalyticsData();
    };

    /**
     * Update analytics
     */
    const updateAnalytics = (data) => {
        Storage.updateAnalyticsData(data);
    };

    /**
     * Track task completion
     */
    const trackCompletion = (task) => {
        const analytics = getAnalytics();
        const today = new Date().toISOString().split('T')[0];

        // Track daily completions
        if (!analytics.completionHistory) {
            analytics.completionHistory = {};
        }

        analytics.completionHistory[today] = (analytics.completionHistory[today] || 0) + 1;

        // Track category stats
        if (task.category) {
            if (!analytics.categoryStats) {
                analytics.categoryStats = {};
            }
            analytics.categoryStats[task.category] = (analytics.categoryStats[task.category] || 0) + 1;
        }

        // Update weekly count
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        let weekCompleted = 0;
        for (const [date, count] of Object.entries(analytics.completionHistory)) {
            const dateObj = new Date(date);
            if (dateObj >= weekAgo) {
                weekCompleted += count;
            }
        }

        analytics.completedThisWeek = weekCompleted;
        analytics.completedToday = analytics.completionHistory[today] || 0;

        updateAnalytics(analytics);
    };

    /**
     * Get completed this week
     */
    const getCompletedThisWeek = () => {
        const analytics = getAnalytics();
        return analytics.completedThisWeek || 0;
    };

    /**
     * Get completed today
     */
    const getCompletedToday = () => {
        const analytics = getAnalytics();
        return analytics.completedToday || 0;
    };

    /**
     * Get completion history (last 30 days)
     */
    const getCompletionHistory = () => {
        const analytics = getAnalytics();
        const history = analytics.completionHistory || {};

        const result = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            result.push({
                date: dateStr,
                completed: history[dateStr] || 0
            });
        }

        return result;
    };

    /**
     * Get category stats
     */
    const getCategoryStats = () => {
        const analytics = getAnalytics();
        const stats = analytics.categoryStats || {};

        return Object.entries(stats)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    };

    /**
     * Get productivity trend
     */
    const getProductivityTrend = () => {
        const history = getCompletionHistory();

        if (history.length < 2) return 'stable';

        const firstWeek = history.slice(0, 7).reduce((sum, d) => sum + d.completed, 0);
        const lastWeek = history.slice(-7).reduce((sum, d) => sum + d.completed, 0);

        const change = lastWeek - firstWeek;

        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    };

    /**
     * Get average daily completion
     */
    const getAverageDailyCompletion = () => {
        const history = getCompletionHistory();
        const total = history.reduce((sum, d) => sum + d.completed, 0);
        return Math.round(total / history.length * 10) / 10;
    };

    /**
     * Get most productive day
     */
    const getMostProductiveDay = () => {
        const history = getCompletionHistory();
        let max = 0;
        let maxDay = null;

        history.forEach(d => {
            if (d.completed > max) {
                max = d.completed;
                maxDay = d.date;
            }
        });

        return { date: maxDay, completed: max };
    };

    /**
     * Get daily streak (consecutive days with at least 1 task completed)
     */
    const getDailyStreak = () => {
        const history = getCompletionHistory().reverse();

        let streak = 0;
        for (const day of history) {
            if (day.completed > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    };

    /**
     * Get favorite category
     */
    const getFavoriteCategory = () => {
        const stats = getCategoryStats();
        return stats[0] || null;
    };

    /**
     * Get monthly report
     */
    const getMonthlyReport = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const tasks = Storage.getCompletedTasks();
        const monthlyTasks = tasks.filter(t => {
            if (!t.completedAt) return false;
            const completed = new Date(t.completedAt);
            return completed >= monthStart && completed <= monthEnd;
        });

        return {
            month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            tasksCompleted: monthlyTasks.length,
            averagePerDay: Math.round((monthlyTasks.length / monthEnd.getDate()) * 10) / 10,
            highPriority: monthlyTasks.filter(t => t.priority === 'high').length,
            mediumPriority: monthlyTasks.filter(t => t.priority === 'medium').length,
            lowPriority: monthlyTasks.filter(t => t.priority === 'low').length
        };
    };

    /**
     * Get weekly breakdown
     */
    const getWeeklyBreakdown = () => {
        const history = getCompletionHistory();
        const weeks = [];

        for (let i = 0; i < history.length; i += 7) {
            const week = history.slice(i, i + 7);
            weeks.push({
                week: Math.floor(i / 7) + 1,
                completed: week.reduce((sum, d) => sum + d.completed, 0),
                days: week
            });
        }

        return weeks.reverse();
    };

    /**
     * Export analytics as JSON
     */
    const exportAnalytics = () => {
        return {
            analytics: getAnalytics(),
            completionHistory: getCompletionHistory(),
            categoryStats: getCategoryStats(),
            monthlyReport: getMonthlyReport(),
            weeklyBreakdown: getWeeklyBreakdown(),
            trend: getProductivityTrend(),
            averageDaily: getAverageDailyCompletion(),
            dailyStreak: getDailyStreak(),
            mostProductiveDay: getMostProductiveDay()
        };
    };

    return {
        getAnalytics,
        updateAnalytics,
        trackCompletion,
        getCompletedThisWeek,
        getCompletedToday,
        getCompletionHistory,
        getCategoryStats,
        getProductivityTrend,
        getAverageDailyCompletion,
        getMostProductiveDay,
        getDailyStreak,
        getFavoriteCategory,
        getMonthlyReport,
        getWeeklyBreakdown,
        exportAnalytics
    };
})();
