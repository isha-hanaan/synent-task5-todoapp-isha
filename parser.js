
const Parser = (() => {
    const parse = (input) => {
        const result = {
            title: "",
            dueDate: null,
            dueTime: null,
            priority: "medium",
            category: ""
        };

        if (!input || !input.trim()) return result;

        const cleanInput = input.trim();

        result.priority = extractPriority(cleanInput);
        const dateInfo = extractDateAndTime(cleanInput);

        result.dueDate = dateInfo.dueDate;
        result.dueTime = dateInfo.dueTime;
        result.title = extractTitle(cleanInput);

        return result;
    };

    const extractPriority = (input) => {
        const lower = input.toLowerCase();

        if (
            lower.includes("urgent") ||
            lower.includes("asap") ||
            lower.includes("important") ||
            lower.includes("critical")
        ) {
            return "high";
        }

        if (lower.includes("low priority") || lower.includes("sometime")) {
            return "low";
        }

        return "medium";
    };

    const extractDateAndTime = (input) => {
        const lower = input.toLowerCase();
        let dueDate = null;
        let dueTime = null;

        const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
            dueTime = formatTime(timeMatch[1], timeMatch[2], timeMatch[3]);
        } else if (lower.includes("morning")) {
            dueTime = "09:00";
        } else if (lower.includes("afternoon")) {
            dueTime = "14:00";
        } else if (lower.includes("evening")) {
            dueTime = "18:00";
        } else if (lower.includes("night")) {
            dueTime = "20:00";
        }

        const today = new Date();

        if (lower.includes("tomorrow")) {
            const d = new Date(today);
            d.setDate(d.getDate() + 1);
            dueDate = formatDate(d);
        } else if (lower.includes("today")) {
            dueDate = formatDate(today);
        } else {
            const dayMatch = lower.match(
                /(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/
            );
            if (dayMatch) {
                dueDate = getNextWeekday(dayMatch[2], Boolean(dayMatch[1]));
            }
        }

        const specificMatch = input.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
        if (!dueDate && specificMatch) {
            const month = getMonthNumber(specificMatch[1]);
            const day = parseInt(specificMatch[2], 10);

            if (month !== null) {
                const d = new Date();
                d.setMonth(month, day);

                if (d < new Date()) {
                    d.setFullYear(d.getFullYear() + 1);
                }

                dueDate = formatDate(d);
            }
        }

        const slashMatch = input.match(/(\d{1,2})\/(\d{1,2})/);
        if (!dueDate && slashMatch) {
            const month = parseInt(slashMatch[1], 10) - 1;
            const day = parseInt(slashMatch[2], 10);
            const d = new Date();
            d.setMonth(month, day);

            if (d < new Date()) {
                d.setFullYear(d.getFullYear() + 1);
            }

            dueDate = formatDate(d);
        }

        return { dueDate, dueTime };
    };

    const extractTitle = (input) => {
        let title = input;

        title = title.replace(
            /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi,
            ""
        );
        title = title.replace(
            /(morning|afternoon|evening|night|today|tomorrow)/gi,
            ""
        );
        title = title.replace(
            /(urgent|asap|important|critical|low priority|sometime)/gi,
            ""
        );
        title = title.replace(
            /(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
            ""
        );
        title = title.replace(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/gi, "");
        title = title.replace(/on\s+/gi, "");
        title = title.replace(/at\s+/gi, "");
        title = title.trim().replace(/\s+/g, " ");

        return title || input;
    };

    const formatTime = (hoursStr, minutesStr, meridiem) => {
        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

        if (meridiem) {
            const m = meridiem.toLowerCase();
            if (m === "pm" && hours !== 12) hours += 12;
            if (m === "am" && hours === 12) hours = 0;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const getNextWeekday = (dayName, isNext = false) => {
        const days = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };

        const today = new Date();
        const currentDay = today.getDay();
        const targetDay = days[dayName.toLowerCase()];

        let diff = targetDay - currentDay;
        if (diff <= 0 || isNext) diff += 7;

        const d = new Date(today);
        d.setDate(d.getDate() + diff);
        return formatDate(d);
    };

    const getMonthNumber = (monthName) => {
        const months = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };

        return months[monthName.toLowerCase()] ?? null;
    };

    return { parse };
})();