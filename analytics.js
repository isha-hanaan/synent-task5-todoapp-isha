
const Analytics = (() => {
    const getAnalytics = () => Storage.getAnalyticsData();

    const updateAnalytics = (data) => {
        Storage.updateAnalyticsData(data);
    };

    const trackCompletion = (task) => {
        const analytics = getAnalytics();
        const today = new Date().toISOString().split("T")[0];

        analytics.completionHistory = analytics.completionHistory || {};
        analytics.categoryStats = analytics.categoryStats || {};

        analytics.completionHistory[today] = (analytics.completionHistory[today] || 0) + 1;

        if (task.category) {
            analytics.categoryStats[task.category] = (analytics.categoryStats[task.category] || 0) + 1;
        }

        analytics.completedToday = analytics.completionHistory[today] || 0;
        analytics.completedThisWeek = getCompletedThisWeekCount(analytics.completionHistory);

        updateAnalytics(analytics);
    };

    const getCompletedThisWeekCount = (history) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        let total = 0;
        Object.entries(history || {}).forEach(([date, count]) => {
            if (new Date(date) >= weekAgo) total += count;
        });

        return total;
    };

    const getCompletedThisWeek = () => getAnalytics().completedThisWeek || 0;

    const getCompletedToday = () => getAnalytics().completedToday || 0;

    const getCompletionHistory = () => {
        const analytics = getAnalytics();
        const history = analytics.completionHistory || {};
        const result = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            result.push({
                date: dateStr,
                completed: history[dateStr] || 0
            });
        }

        return result;
    };

    const getCategoryStats = () => {
        const analytics = getAnalytics();
        const stats = analytics.categoryStats || {};

        return Object.entries(stats)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    };

    const exportAnalytics = () => {
        return {
            analytics: getAnalytics(),
            history: getCompletionHistory(),
            categories: getCategoryStats(),
            productivityScore: Gamification.getProductivityScore(),
            streak: Gamification.getStats().streak || 0
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
        exportAnalytics
    };
})();