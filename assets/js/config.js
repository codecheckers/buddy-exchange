/**
 * Configuration settings for CODECHECK Buddy Exchange
 * Modify these values to customize the application behavior
 */
const BuddyExchangeConfig = {
    // App version (must match package.json)
    version: '0.1.0',

    // Maximum number of issues to display per page
    maxIssuesDisplayed: 50,

    // Length of issue description excerpt in characters
    excerptLength: 400,

    // Maximum number of entries in the leaderboard
    leaderboardLength: 20,

    // GitHub repository configuration
    repository: {
        owner: 'codecheckers',
        name: 'register',

        // Get full repository path
        get fullName() {
            return `${this.owner}/${this.name}`;
        }
    },

    // GitHub API configuration
    github: {
        // Issues per page when fetching from GitHub API (max 100)
        issuesPerPage: 100,

        // Maximum pages to fetch for closed issues (leaderboard)
        maxLeaderboardPages: 10,

        // Maximum pages to fetch for all issues (identifier calculation)
        maxAllIssuesPages: 50
    },

    // Issue filtering labels
    labels: {
        // Label used for filtering buddy exchange issues (for leaderboard and closed issues)
        buddyExchange: 'buddy exchange',

        // Label used for available issues (takes precedence over assignment status)
        needsCodechecker: 'needs codechecker',

        // Additional label applied when identifier is assigned
        identifierAssigned: 'id assigned'
    },

    // UI configuration
    ui: {
        // Show debug information in console
        debug: false,

        // Animation duration in milliseconds
        animationDuration: 300,

        // Tooltip delay in milliseconds
        tooltipDelay: 500,

        // Temporary message display duration in milliseconds
        messageDisplayDuration: 3000,

        // Username API call debounce time in milliseconds
        usernameDebounceTime: 2000
    },

    // API rate limiting
    rateLimit: {
        // Warn when remaining API calls fall below this threshold
        warningThreshold: 10,

        // Show rate limit info in console
        showRateLimitInfo: true
    },

    // Local storage keys
    storage: {
        githubUsername: 'cdchck_github_username',
        authorName: 'cdchck_author_name',
        registerInstance: 'cdchck_register_instance'
    },

    // Available register instances
    instances: {
        production: {
            label: 'Production (register)',
            owner: 'codecheckers',
            name: 'register'
        },
        testing: {
            label: 'Testing (testing-dev-register)',
            owner: 'codecheckers',
            name: 'testing-dev-register'
        }
    },

    /**
     * Get the currently active instance key from localStorage
     * @returns {string} 'production' or 'testing'
     */
    getActiveInstance() {
        const stored = localStorage.getItem(this.storage.registerInstance);
        return (stored === 'testing') ? 'testing' : 'production';
    },

    /**
     * Set the active instance and update repository config
     * @param {string} key - 'production' or 'testing'
     */
    setActiveInstance(key) {
        if (!this.instances[key]) return;
        localStorage.setItem(this.storage.registerInstance, key);
        this.repository.owner = this.instances[key].owner;
        this.repository.name = this.instances[key].name;
        console.log(`Switched to ${key} instance: ${this.repository.fullName}`);
    },

    // External URLs
    urls: {
        // Base URL for GitHub issues
        githubIssuesBase: 'https://github.com/{owner}/{repo}/issues',

        // Base URL for creating new GitHub issues
        githubNewIssueBase: 'https://github.com/{owner}/{repo}/issues/new',

        // Base URL for GitHub search
        githubSearchBase: 'https://github.com/search',

        // GitHub issue template name for buddy exchange requests
        issueTemplate: 'buddy-exchange-request.md',

        // Get formatted GitHub issues URL
        getGitHubIssuesUrl() {
            return this.githubIssuesBase
                .replace('{owner}', BuddyExchangeConfig.repository.owner)
                .replace('{repo}', BuddyExchangeConfig.repository.name);
        },

        // Get formatted GitHub new issue URL
        getGitHubNewIssueUrl() {
            return this.githubNewIssueBase
                .replace('{owner}', BuddyExchangeConfig.repository.owner)
                .replace('{repo}', BuddyExchangeConfig.repository.name);
        }
    },

    // Certificate identifier formatting
    certificate: {
        // Number of digits to pad the identifier with (e.g., 3 = "001", "042")
        identifierPadding: 3,

        // Current year for identifier generation (defaults to current year)
        get currentYear() {
            return new Date().getFullYear();
        },

        // Format certificate identifier
        formatIdentifier(number) {
            const paddedNumber = number.toString().padStart(this.identifierPadding, '0');
            return `${this.currentYear}-${paddedNumber}`;
        }
    },

    // Validation functions
    validate() {
        const errors = [];

        if (this.maxIssuesDisplayed < 1 || this.maxIssuesDisplayed > 100) {
            errors.push('maxIssuesDisplayed must be between 1 and 100');
        }

        if (this.excerptLength < 50 || this.excerptLength > 1000) {
            errors.push('excerptLength must be between 50 and 1000');
        }

        if (this.leaderboardLength < 5 || this.leaderboardLength > 100) {
            errors.push('leaderboardLength must be between 5 and 100');
        }

        if (!this.repository.owner || !this.repository.name) {
            errors.push('repository owner and name must be specified');
        }

        if (this.github.issuesPerPage < 1 || this.github.issuesPerPage > 100) {
            errors.push('github.issuesPerPage must be between 1 and 100');
        }

        if (errors.length > 0) {
            console.error('Configuration validation errors:', errors);
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }

        if (this.ui.debug) {
            console.log('Configuration validation passed:', this);
        }

        return true;
    },

    // Helper method to log configuration info
    logInfo() {
        if (this.ui.debug) {
            console.group('Buddy Exchange Configuration');
            console.log('Repository:', this.repository.fullName);
            console.log('Max issues displayed:', this.maxIssuesDisplayed);
            console.log('Excerpt length:', this.excerptLength, 'characters');
            console.log('Leaderboard length:', this.leaderboardLength);
            console.groupEnd();
        }
    }
};

// Validate configuration on load
try {
    BuddyExchangeConfig.validate();
    // Apply stored instance selection (must happen after validation)
    const activeInstance = BuddyExchangeConfig.getActiveInstance();
    if (activeInstance !== 'production') {
        BuddyExchangeConfig.setActiveInstance(activeInstance);
    }
    BuddyExchangeConfig.logInfo();
} catch (error) {
    console.error('Failed to initialize Buddy Exchange configuration:', error);
    alert('Configuration error: ' + error.message + '\nPlease check the configuration in config.js');
}