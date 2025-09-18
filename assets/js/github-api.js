/**
 * GitHub API interface for buddy exchange issues
 */
class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.repo = BuddyExchangeConfig.repository.fullName;
        this.label = BuddyExchangeConfig.labels.buddyExchange; // Used for leaderboard and closed issues
        this.availableIssuesLabel = BuddyExchangeConfig.labels.needsCodechecker; // Used for available issues list
    }

    /**
     * Fetch available issues (unassigned OR with "needs codechecker" label)
     * @returns {Promise<Array>} Array of GitHub issues
     */
    async fetchBuddyExchangeIssues() {
        try {
            // Fetch all open issues in the repository
            const url = `${this.baseURL}/repos/${this.repo}/issues?state=open&sort=created&direction=desc&per_page=${BuddyExchangeConfig.github.issuesPerPage}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const issues = await response.json();
            return this.filterAvailableIssues(issues);
        } catch (error) {
            console.error('Error fetching issues:', error);
            throw error;
        }
    }

    /**
     * Filter issues to show available ones that have "buddy exchange" label AND (unassigned OR with "needs codechecker" label)
     * "needs codechecker" label takes precedence - such issues are shown even if assigned
     * @param {Array} issues - Array of GitHub issues
     * @returns {Array} Filtered available issues
     */
    filterAvailableIssues(issues) {
        return issues.filter(issue => {
            // First check if issue has "buddy exchange" label - this is required for all issues
            const hasBuddyExchangeLabel = issue.labels.some(label =>
                label.name.toLowerCase() === this.label.toLowerCase()
            );

            // If no "buddy exchange" label, exclude the issue
            if (!hasBuddyExchangeLabel) {
                return false;
            }

            // Check if issue has "needs codechecker" label
            const hasNeedsCodecheckerLabel = issue.labels.some(label =>
                label.name.toLowerCase() === this.availableIssuesLabel.toLowerCase()
            );

            // If it has the "needs codechecker" label, include it regardless of assignment
            if (hasNeedsCodecheckerLabel) {
                return true;
            }

            // Otherwise, only include if unassigned
            const isUnassigned = !issue.assignee && (!issue.assignees || issue.assignees.length === 0);
            return isUnassigned;
        });
    }

    /**
     * Filter out issues that already have assignees (legacy method for backward compatibility)
     * @param {Array} issues - Array of GitHub issues
     * @returns {Array} Filtered issues without assignees
     */
    filterUnassignedIssues(issues) {
        return issues.filter(issue =>
            !issue.assignee &&
            (!issue.assignees || issue.assignees.length === 0)
        );
    }

    /**
     * Get formatted issue data for display
     * @param {Object} issue - GitHub issue object
     * @returns {Object} Formatted issue data
     */
    formatIssueData(issue) {
        return {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            url: issue.html_url,
            apiUrl: issue.url,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            author: {
                login: issue.user.login,
                avatar: issue.user.avatar_url,
                url: issue.user.html_url
            },
            labels: issue.labels.map(label => ({
                name: label.name,
                color: label.color,
                description: label.description
            })),
            comments: issue.comments,
            state: issue.state
        };
    }

    /**
     * Fetch closed buddy exchange issues for leaderboard
     * @param {number} perPage - Number of issues per page (max 100)
     * @param {number} maxPages - Maximum number of pages to fetch
     * @returns {Promise<Array>} Array of closed GitHub issues
     */
    async fetchClosedBuddyExchangeIssues(perPage = BuddyExchangeConfig.github.issuesPerPage, maxPages = BuddyExchangeConfig.github.maxLeaderboardPages) {
        try {
            const allIssues = [];
            let page = 1;

            while (page <= maxPages) {
                const url = `${this.baseURL}/repos/${this.repo}/issues?labels=${encodeURIComponent(this.label)}&state=closed&sort=updated&direction=desc&per_page=${perPage}&page=${page}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }

                const issues = await response.json();

                if (issues.length === 0) {
                    break; // No more issues
                }

                allIssues.push(...issues);

                // If we got fewer issues than requested, we're on the last page
                if (issues.length < perPage) {
                    break;
                }

                page++;
            }

            return allIssues;
        } catch (error) {
            console.error('Error fetching closed issues:', error);
            throw error;
        }
    }

    /**
     * Calculate leaderboard from closed issues
     * @param {Array} closedIssues - Array of closed GitHub issues
     * @returns {Object} Leaderboard data with user statistics
     */
    calculateLeaderboard(closedIssues) {
        const userStats = {};
        let totalCompleted = 0;

        closedIssues.forEach(issue => {
            // Count issues that were actually completed (had assignees when closed)
            if (issue.assignee || (issue.assignees && issue.assignees.length > 0)) {
                totalCompleted++;

                // Count for primary assignee
                if (issue.assignee) {
                    const username = issue.assignee.login;
                    if (!userStats[username]) {
                        userStats[username] = {
                            username: username,
                            avatar: issue.assignee.avatar_url,
                            url: issue.assignee.html_url,
                            completedCount: 0,
                            lastCompleted: null,
                            completedIssues: []
                        };
                    }
                    userStats[username].completedCount++;
                    userStats[username].completedIssues.push(issue.number);

                    const closedDate = new Date(issue.closed_at);
                    if (!userStats[username].lastCompleted || closedDate > userStats[username].lastCompleted) {
                        userStats[username].lastCompleted = closedDate;
                    }
                }

                // Count for additional assignees
                if (issue.assignees && issue.assignees.length > 0) {
                    issue.assignees.forEach(assignee => {
                        const username = assignee.login;
                        if (!userStats[username]) {
                            userStats[username] = {
                                username: username,
                                avatar: assignee.avatar_url,
                                url: assignee.html_url,
                                completedCount: 0,
                                lastCompleted: null,
                                completedIssues: []
                            };
                        }

                        // Only count once if user is both assignee and in assignees array
                        if (!issue.assignee || issue.assignee.login !== username) {
                            userStats[username].completedCount++;
                            userStats[username].completedIssues.push(issue.number);

                            const closedDate = new Date(issue.closed_at);
                            if (!userStats[username].lastCompleted || closedDate > userStats[username].lastCompleted) {
                                userStats[username].lastCompleted = closedDate;
                            }
                        }
                    });
                }
            }
        });

        // Convert to array and sort by completed count
        const leaderboard = Object.values(userStats)
            .sort((a, b) => b.completedCount - a.completedCount);

        // Generate search URLs for each user
        leaderboard.forEach(user => {
            user.searchUrl = this.generateUserIssuesSearchUrl(user.username);
        });

        return {
            leaderboard,
            totalCompleted,
            activeContributors: leaderboard.length,
            lastUpdated: new Date()
        };
    }

    /**
     * Generate GitHub search URL for a user's completed buddy exchange issues
     * @param {string} username - GitHub username
     * @returns {string} GitHub search URL
     */
    generateUserIssuesSearchUrl(username) {
        const searchQuery = `repo:${this.repo} label:"${this.label}" assignee:${username} is:closed`;
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=issues`;
    }

    /**
     * Generate GitHub search URL for all closed buddy exchange issues
     * @returns {string} GitHub search URL
     */
    generateAllClosedIssuesSearchUrl() {
        const searchQuery = `repo:${this.repo} label:"${this.label}" is:closed`;
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=issues`;
    }

    /**
     * Generate GitHub search URL for buddy exchange issues in progress (open issues with "buddy exchange" label but without "needs codechecker" label)
     * @returns {string} GitHub search URL
     */
    generateAssignedOpenIssuesSearchUrl() {
        const searchQuery = `repo:${this.repo} is:open label:"${this.label}" -label:"${this.availableIssuesLabel}"`;
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=issues`;
    }

    /**
     * Generate GitHub search URL for all buddy exchange issues (open and closed)
     * @returns {string} GitHub search URL
     */
    generateAllBuddyExchangeIssuesSearchUrl() {
        const searchQuery = `repo:${this.repo} label:"${this.label}"`;
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=issues`;
    }

    /**
     * Fetch all issues from the repository (both open and closed)
     * @param {number} perPage - Number of issues per page (max 100)
     * @param {number} maxPages - Maximum number of pages to fetch
     * @returns {Promise<Array>} Array of all GitHub issues
     */
    async fetchAllIssues(perPage = BuddyExchangeConfig.github.issuesPerPage, maxPages = BuddyExchangeConfig.github.maxAllIssuesPages) {
        try {
            const allIssues = [];
            let page = 1;

            while (page <= maxPages) {
                const url = `${this.baseURL}/repos/${this.repo}/issues?state=all&sort=created&direction=desc&per_page=${perPage}&page=${page}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }

                const issues = await response.json();

                if (issues.length === 0) {
                    break; // No more issues
                }

                allIssues.push(...issues);

                // If we got fewer issues than requested, we're on the last page
                if (issues.length < perPage) {
                    break;
                }

                page++;
            }

            return allIssues;
        } catch (error) {
            console.error('Error fetching all issues:', error);
            throw error;
        }
    }

    /**
     * Extract certificate identifiers from issue titles
     * @param {Array} issues - Array of GitHub issues
     * @returns {Array} Array of extracted certificate identifiers (numbers)
     */
    extractCertificateIdentifiers(issues) {
        const identifiers = [];

        issues.forEach(issue => {
            const title = issue.title;

            // Look for patterns like:
            // - "2024-001"
            // - "2025-042"
            // - "[Author Name] | 2024-001"
            // - "Some Title | 2025-003"
            const patterns = [
                /(\d{4}-\d{3})/g,  // YYYY-XXX format
                /(\d{4}-\d{2})/g,  // YYYY-XX format
                /(\d{4}-\d{1})/g,  // YYYY-X format
                /(\d{3})/g,        // XXX format (3 digits)
                /(\d{2})/g,        // XX format (2 digits)
                /(\d{1})/g         // X format (1 digit)
            ];

            for (const pattern of patterns) {
                const matches = title.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        // Extract just the number part
                        let number;
                        if (match.includes('-')) {
                            // For YYYY-XXX format, take the part after the dash
                            number = parseInt(match.split('-')[1]);
                        } else {
                            // For plain numbers
                            number = parseInt(match);
                        }

                        if (!isNaN(number) && number > 0 && number < 10000) {
                            identifiers.push(number);
                        }
                    });
                    break; // Stop after first successful pattern match
                }
            }
        });

        // Remove duplicates and sort
        return [...new Set(identifiers)].sort((a, b) => a - b);
    }

    /**
     * Calculate the next available certificate identifier
     * @param {Array} existingIdentifiers - Array of existing identifier numbers
     * @returns {number} Next available identifier
     */
    calculateNextIdentifier(existingIdentifiers) {
        if (existingIdentifiers.length === 0) {
            return 1;
        }

        // Find the first gap in the sequence
        for (let i = 1; i <= existingIdentifiers[existingIdentifiers.length - 1] + 1; i++) {
            if (!existingIdentifiers.includes(i)) {
                return i;
            }
        }

        // If no gaps found, return the next number after the highest
        return existingIdentifiers[existingIdentifiers.length - 1] + 1;
    }

    /**
     * Generate formatted certificate identifier
     * @param {number} number - The identifier number
     * @returns {string} Formatted identifier (e.g., "2025-001")
     */
    formatCertificateIdentifier(number) {
        return BuddyExchangeConfig.certificate.formatIdentifier(number);
    }

    /**
     * Fetch all buddy exchange issues (both open and closed) for buddy analysis
     * @param {number} perPage - Number of issues per page (max 100)
     * @param {number} maxPages - Maximum number of pages to fetch
     * @returns {Promise<Array>} Array of all buddy exchange issues
     */
    async fetchAllBuddyExchangeIssues(perPage = BuddyExchangeConfig.github.issuesPerPage, maxPages = BuddyExchangeConfig.github.maxAllIssuesPages) {
        try {
            const allIssues = [];
            let page = 1;

            while (page <= maxPages) {
                const url = `${this.baseURL}/repos/${this.repo}/issues?labels=${encodeURIComponent(this.label)}&state=all&sort=updated&direction=desc&per_page=${perPage}&page=${page}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }

                const issues = await response.json();

                if (issues.length === 0) {
                    break; // No more issues
                }

                allIssues.push(...issues);

                // If we got fewer issues than requested, we're on the last page
                if (issues.length < perPage) {
                    break;
                }

                page++;
            }

            return allIssues;
        } catch (error) {
            console.error('Error fetching all buddy exchange issues:', error);
            throw error;
        }
    }

    /**
     * Calculate buddy ratios (received checks vs conducted checks)
     * @param {Array} allIssues - Array of all buddy exchange issues
     * @returns {Object} Buddy analysis data
     */
    calculateBuddyRatios(allIssues) {
        const userStats = {};

        if (BuddyExchangeConfig.ui.debug) {
            console.log('Calculating buddy ratios for', allIssues.length, 'issues');
        }

        // Count received checks (issues created by users)
        allIssues.forEach(issue => {
            const creator = issue.user.login;
            if (!userStats[creator]) {
                userStats[creator] = {
                    username: creator,
                    avatar: issue.user.avatar_url,
                    url: issue.user.html_url,
                    receivedChecks: 0,
                    conductedChecks: 0,
                    receivedIssues: [],
                    conductedIssues: []
                };
            }
            userStats[creator].receivedChecks++;
            userStats[creator].receivedIssues.push(issue.number);

            if (BuddyExchangeConfig.ui.debug) {
                console.log(`${creator} received check from issue #${issue.number}`);
            }
        });

        // Count conducted checks (issues assigned to users and closed)
        allIssues.forEach(issue => {
            if (issue.state === 'closed' && (issue.assignee || (issue.assignees && issue.assignees.length > 0))) {

                if (BuddyExchangeConfig.ui.debug) {
                    console.log(`Issue #${issue.number} is closed with assignees:`,
                        issue.assignee?.login,
                        issue.assignees?.map(a => a.login));
                }

                // Count for primary assignee
                if (issue.assignee) {
                    const assignee = issue.assignee.login;
                    if (!userStats[assignee]) {
                        userStats[assignee] = {
                            username: assignee,
                            avatar: issue.assignee.avatar_url,
                            url: issue.assignee.html_url,
                            receivedChecks: 0,
                            conductedChecks: 0,
                            receivedIssues: [],
                            conductedIssues: []
                        };
                    }
                    userStats[assignee].conductedChecks++;
                    userStats[assignee].conductedIssues.push(issue.number);

                    if (BuddyExchangeConfig.ui.debug) {
                        console.log(`${assignee} conducted check for issue #${issue.number}`);
                    }
                }

                // Count for additional assignees
                if (issue.assignees && issue.assignees.length > 0) {
                    issue.assignees.forEach(assignee => {
                        const assigneeLogin = assignee.login;
                        if (!userStats[assigneeLogin]) {
                            userStats[assigneeLogin] = {
                                username: assigneeLogin,
                                avatar: assignee.avatar_url,
                                url: assignee.html_url,
                                receivedChecks: 0,
                                conductedChecks: 0,
                                receivedIssues: [],
                                conductedIssues: []
                            };
                        }

                        // Only count once if user is both assignee and in assignees array
                        if (!issue.assignee || issue.assignee.login !== assigneeLogin) {
                            userStats[assigneeLogin].conductedChecks++;
                            userStats[assigneeLogin].conductedIssues.push(issue.number);
                        }
                    });
                }
            }
        });

        // Calculate ratios and filter for "find a buddy" candidates
        const allUsers = Object.values(userStats);

        if (BuddyExchangeConfig.ui.debug) {
            console.log('All user stats:', allUsers);
        }

        const allRecipients = allUsers
            .filter(user => {
                // Show all users who have received checks
                const hasReceived = user.receivedChecks > 0;
                if (BuddyExchangeConfig.ui.debug) {
                    console.log(`${user.username}: received=${user.receivedChecks}, conducted=${user.conductedChecks}, hasReceived=${hasReceived}`);
                }
                return hasReceived;
            })
            .map(user => ({
                ...user,
                ratio: user.receivedChecks / Math.max(user.conductedChecks, 1), // Avoid division by zero
                deficit: user.receivedChecks - user.conductedChecks,
                searchUrl: this.generateUserIssuesSearchUrl(user.username)
            }))
            .sort((a, b) => b.ratio - a.ratio); // Sort by highest ratio first

        return {
            allRecipients,
            totalUsers: allUsers.length,
            totalIssues: allIssues.length,
            lastUpdated: new Date()
        };
    }

    /**
     * Fetch codecheckers metadata from CSV
     * @returns {Promise<Map>} Map of usernames to codecheckers metadata
     */
    async fetchCodecheckersMetadata() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/codecheckers/codecheckers/refs/heads/master/codecheckers.csv');

            if (!response.ok) {
                throw new Error(`Failed to fetch codecheckers CSV: ${response.status}`);
            }

            const csvText = await response.text();
            const codecheckersMap = new Map();

            // Parse CSV
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            // Find column indices
            const nameIndex = headers.indexOf('name');
            const handleIndex = headers.indexOf('handle');
            const fieldsIndex = headers.indexOf('fields');
            const languagesIndex = headers.indexOf('languages');

            if (handleIndex === -1 || fieldsIndex === -1 || languagesIndex === -1) {
                console.warn('Missing required columns in codecheckers CSV');
                return codecheckersMap;
            }

            // Process each row (skip header)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple CSV parsing (handles quoted fields)
                const values = this.parseCSVLine(line);
                if (values.length <= Math.max(handleIndex, fieldsIndex, languagesIndex)) continue;

                const handle = values[handleIndex]?.trim().replace(/^@/, ''); // Remove @ prefix
                const name = values[nameIndex]?.trim().replace(/"/g, '');
                const fields = values[fieldsIndex]?.trim().replace(/"/g, '');
                const languages = values[languagesIndex]?.trim().replace(/"/g, '');

                if (handle && (fields || languages)) {
                    codecheckersMap.set(handle, {
                        name: name || handle,
                        fields: fields || '',
                        languages: languages || ''
                    });
                }
            }

            console.log(`Loaded metadata for ${codecheckersMap.size} codecheckers`);
            return codecheckersMap;

        } catch (error) {
            console.error('Error fetching codecheckers metadata:', error);
            return new Map();
        }
    }

    /**
     * Simple CSV line parser that handles quoted fields
     * @param {string} line - CSV line to parse
     * @returns {Array} Array of field values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current); // Add the last field

        return result;
    }

    /**
     * Check API rate limit status
     * @returns {Promise<Object>} Rate limit information
     */
    async checkRateLimit() {
        try {
            const response = await fetch(`${this.baseURL}/rate_limit`);
            return await response.json();
        } catch (error) {
            console.error('Error checking rate limit:', error);
            throw error;
        }
    }
}