/**
 * Main application logic for CODECHECK Buddy Exchange
 */
class BuddyExchangeApp {
    constructor() {
        this.githubAPI = new GitHubAPI();
        this.ui = new BuddyExchangeUI();
        this.isLoading = false;
        this.isLeaderboardLoading = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing CODECHECK Buddy Exchange...');

        // Set up event listeners
        this.ui.setupEventListeners();

        // Load initial issues and leaderboard
        await this.loadIssues();
        await this.loadLeaderboard();

        console.log('Application initialized successfully');
    }

    /**
     * Load buddy exchange issues from GitHub
     */
    async loadIssues() {
        if (this.isLoading) {
            console.log('Already loading issues, skipping...');
            return;
        }

        this.isLoading = true;
        this.ui.showLoading();

        try {
            console.log('Fetching buddy exchange issues...');

            const issues = await this.githubAPI.fetchBuddyExchangeIssues();
            const formattedIssues = issues.map(issue =>
                this.githubAPI.formatIssueData(issue)
            );

            console.log(`Found ${formattedIssues.length} available issues`);

            this.ui.renderIssues(formattedIssues);

            // Update page title with issue count
            document.title = `CODECHECK Buddy Exchange (${formattedIssues.length} available)`;

        } catch (error) {
            console.error('Failed to load issues:', error);

            let errorMessage = 'Failed to load buddy exchange issues. ';

            if (error.message.includes('rate limit')) {
                errorMessage += 'GitHub API rate limit exceeded. Please try again later.';
            } else if (error.message.includes('Network')) {
                errorMessage += 'Network error. Please check your connection.';
            } else {
                errorMessage += error.message || 'Please try again later.';
            }

            this.ui.showError(errorMessage);
        } finally {
            this.isLoading = false;
            this.ui.hideLoading();
        }
    }

    /**
     * Load leaderboard data from closed buddy exchange issues
     */
    async loadLeaderboard() {
        if (this.isLeaderboardLoading) {
            console.log('Already loading leaderboard, skipping...');
            return;
        }

        this.isLeaderboardLoading = true;
        this.ui.showLeaderboardLoading();

        try {
            console.log('Fetching closed buddy exchange issues for leaderboard...');

            const closedIssues = await this.githubAPI.fetchClosedBuddyExchangeIssues();
            const leaderboardData = this.githubAPI.calculateLeaderboard(closedIssues);

            console.log(`Loaded leaderboard with ${leaderboardData.activeContributors} contributors and ${leaderboardData.totalCompleted} completed exchanges`);

            this.ui.renderLeaderboard(leaderboardData);

        } catch (error) {
            console.error('Failed to load leaderboard:', error);

            let errorMessage = 'Failed to load leaderboard data. ';

            if (error.message.includes('rate limit')) {
                errorMessage += 'GitHub API rate limit exceeded.';
            } else if (error.message.includes('Network')) {
                errorMessage += 'Network error occurred.';
            } else {
                errorMessage += 'Please try again later.';
            }

            this.ui.showLeaderboardError(errorMessage);
        } finally {
            this.isLeaderboardLoading = false;
            this.ui.hideLeaderboardLoading();
        }
    }

    /**
     * Check GitHub API rate limit and display status
     */
    async checkRateLimit() {
        try {
            const rateLimit = await this.githubAPI.checkRateLimit();
            console.log('GitHub API Rate Limit:', rateLimit);

            if (rateLimit.rate && rateLimit.rate.remaining < BuddyExchangeConfig.rateLimit.warningThreshold) {
                const resetTime = new Date(rateLimit.rate.reset * 1000);
                console.warn(`GitHub API rate limit low: ${rateLimit.rate.remaining} requests remaining. Resets at ${resetTime}`);
            }

            return rateLimit;
        } catch (error) {
            console.error('Failed to check rate limit:', error);
        }
    }

    /**
     * Refresh issues and leaderboard manually
     */
    async refresh() {
        console.log('Manual refresh triggered');
        await Promise.all([
            this.loadIssues(),
            this.loadLeaderboard()
        ]);
    }
}

// Global variables
let app;
let ui;

// Initialize application when DOM is ready
$(document).ready(async function() {
    try {
        // Create global instances
        app = new BuddyExchangeApp();
        ui = app.ui;

        // Make app globally accessible for debugging
        window.app = app;
        window.ui = ui;

        // Initialize the application
        await app.init();

    } catch (error) {
        console.error('Failed to initialize application:', error);

        // Show fallback error message
        $('#app').html(`
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Application Error</h4>
                <p>Failed to initialize the CODECHECK Buddy Exchange application.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">Please refresh the page or check the browser console for more details.</p>
            </div>
        `);
    }
});

// Handle visibility change to refresh when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.app) {
        // Refresh issues when user returns to tab after 1 minute
        const lastUpdate = window.app.lastUpdate || 0;
        const now = Date.now();

        if (now - lastUpdate > BuddyExchangeConfig.getRefreshIntervalMs()) {
            console.log('Tab became active, refreshing issues and leaderboard...');
            window.app.refresh();
        }
    }
});