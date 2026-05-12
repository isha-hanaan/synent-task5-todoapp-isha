const Parser = (() => {
    /**
     * Parse natural language input
     * Examples:
     * - "Doctor appointment next Tuesday at 3 PM"
     * - "Submit assignment tomorrow evening"
     * - "Pay electricity bill on May 18"
     */
    const parse = (input) => {
        const result = {
            title: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium'
        };

        // Extract time information
        const timeInfo = extractTime(input);
        if (timeInfo.time) {
            result.dueTime = timeInfo.time;
        }
        if (timeInfo.date) {
            result.dueDate = timeInfo.date;
        }

        // Extract priority indicators
        const priority = extractPriority(input);
        if (priority) {
            result.priority = priority;
        }

        // Extract title (remove time/date references)
        result.title = extractTitle(input, timeInfo);

        return result;
    };

    /**
     * Extract time and date from input
     */
    const extractTime = (input) => {
        const result = { date: null, time: null };
        const lowerInput = input.toLowerCase();

        // Time patterns
        const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/gi,
            /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/gi
        ];

        for (const pattern of timePatterns) {
            const match = pattern.exec(input);
            if (match) {
                result.time = formatTime(match[0]);
                break;
            }
        }

        // Morning, afternoon, evening
        if (!result.time) {
            if (lowerInput.includes('morning')) result.time = '09:00';
            else if (lowerInput.includes('afternoon')) result.time = '14:00';
            else if (lowerInput.includes('evening')) result.time = '18:00';
            else if (lowerInput.includes('night')) result.time = '20:00';
        }

        // Date patterns
        const today = new Date();

        // Tomorrow
        if (lowerInput.includes('tomorrow')) {
            today.setDate(today.getDate() + 1);
            result.date = formatDate(today);
        }
        // Today
        else if (lowerInput.includes('today')) {
            result.date = formatDate(new Date());
        }
        // Next [day]
        else {
            const dayOfWeekMatch = lowerInput.match(/(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
            if (dayOfWeekMatch) {
                result.date = getDateOfNextDay(dayOfWeekMatch[2], lowerInput.includes('next'));
            }
        }

        // Specific date patterns (May 18, 5/18, May 18th, etc.)
        const datePatterns = [
            /([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
            /(\d{1,2})\/(\d{1,2})/,
            /(\d{1,2})-(\d{1,2})/
        ];

        for (const pattern of datePatterns) {
            const match = pattern.exec(input);
            if (match) {
                const parsed = parseSpecificDate(match, input);
                if (parsed) {
                    result.date = parsed;
                    break;
                }
            }
        }

        return result;
    };

    /**
     * Extract priority from input
     */
    const extractPriority = (input) => {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('critical') || lowerInput.includes('important')) {
            return 'high';
        }
        if (lowerInput.includes('maybe') || lowerInput.includes('eventually') || lowerInput.includes('low priority')) {
            return 'low';
        }

        return null;
    };

    /**
     * Extract title by removing time/date references
     */
    const extractTitle = (input, timeInfo) => {
        let title = input;

        // Remove time references
        title = title.replace(/(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/gi, '');
        title = title.replace(/(morning|afternoon|evening|night)/gi, '');

        // Remove date references
        title = title.replace(/(tomorrow|today|next\s+\w+)/gi, '');
        title = title.replace(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/gi, '');
        title = title.replace(/on\s+/gi, '');
        title = title.replace(/at\s+/gi, '');

        // Remove priority indicators
        title = title.replace(/(urgent|asap|critical|important|maybe|eventually|low priority)/gi, '');

        // Clean up excess whitespace
        title = title.trim().replace(/\s+/g, ' ');

        return title || input;
    };

    /**
     * Format time to HH:MM format
     */
    const formatTime = (timeStr) => {
        const match = timeStr.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
        if (!match) return null;

        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3] ? match[3].toLowerCase() : '';

        if (meridiem === 'pm' || meridiem === 'p.m.') {
            if (hours !== 12) hours += 12;
        } else if (meridiem === 'am' || meridiem === 'a.m.') {
            if (hours === 12) hours = 0;
        }

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    /**
     * Format date to YYYY-MM-DD format
     */
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * Get date of next occurrence of a day of week
     */
    const getDateOfNextDay = (dayName, isNext = false) => {
        const days = {
            monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
            friday: 5, saturday: 6, sunday: 0
        };

        const dayIndex = days[dayName.toLowerCase()];
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = dayIndex - currentDay;

        if (daysToAdd <= 0) {
            daysToAdd += 7;
        } else if (daysToAdd === 0 && isNext) {
            daysToAdd = 7;
        } else if (daysToAdd === 0) {
            daysToAdd = 0; // Today
        }

        const date = new Date(today);
        date.setDate(date.getDate() + daysToAdd);
        return formatDate(date);
    };

    /**
     * Parse specific date patterns
     */
    const parseSpecificDate = (match, input) => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const currentDate = new Date().getDate();

        // Month Day format
        if (isNaN(parseInt(match[1]))) {
            const monthName = match[1];
            const day = parseInt(match[2]);
            const month = getMonthNumber(monthName);

            if (month !== null) {
                const date = new Date(currentYear, month, day);
                // If the date is in the past, assume next year
                if (date < new Date()) {
                    date.setFullYear(currentYear + 1);
                }
                return formatDate(date);
            }
        }
        // Month/Day format
        else {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);

            if (month > 0 && month <= 12 && day > 0 && day <= 31) {
                const date = new Date(currentYear, month - 1, day);
                if (date < new Date()) {
                    date.setFullYear(currentYear + 1);
                }
                return formatDate(date);
            }
        }

        return null;
    };

    /**
     * Get month number from month name
     */
    const getMonthNumber = (monthName) => {
        const months = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };

        return months[monthName.toLowerCase()] ?? null;
    };

    return {
        parse
    };
})();
