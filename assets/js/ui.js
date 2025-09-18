/**
 * UI components and interactions for buddy exchange
 */
class BuddyExchangeUI {
    constructor() {
        this.issuesContainer = $('#issues-list');
        this.loadingIndicator = $('#loading');
        this.errorContainer = $('#error');
        this.errorMessage = $('#error-message');
        this.noIssuesMessage = $('#no-issues');
        this.refreshButton = $('#refresh-btn');

        // Use global configuration
        this.config = BuddyExchangeConfig;

        // Leaderboard elements
        this.leaderboardLoading = $('#leaderboard-loading');
        this.leaderboardError = $('#leaderboard-error');
        this.leaderboardErrorMessage = $('#leaderboard-error-message');
        this.leaderboardList = $('#leaderboard-list');
        this.totalCompleted = $('#total-completed');
        this.activeContributors = $('#active-contributors');
        this.lastUpdated = $('#last-updated');

        // Next identifier modal elements
        this.nextIdentifierLink = $('#next-identifier-link');
        this.nextIdentifierModal = $('#nextIdentifierModal');
        this.identifierLoading = $('#identifier-loading');
        this.identifierError = $('#identifier-error');
        this.identifierErrorMessage = $('#identifier-error-message');
        this.identifierContent = $('#identifier-content');
        this.nextIdentifierDisplay = $('#next-identifier-display');
        this.suggestedTitle = $('#suggested-title');
        this.submitWithIdentifier = $('#submit-with-identifier');

        // Settings configuration modal elements
        this.configureSettingsLink = $('#configure-settings-link');
        this.settingsConfigModal = $('#settingsConfigModal');
        this.currentSettingsDisplay = $('#current-settings-display');
        this.currentAuthorDisplay = $('#current-author-display');
        this.currentAuthorText = $('#current-author-text');
        this.currentUsernameDisplayItem = $('#current-username-display-item');
        this.currentUsernameText = $('#current-username-text');
        this.authorNameInput = $('#author-name-input');
        this.githubUsernameInput = $('#github-username-input');
        this.saveSettingsBtn = $('#save-settings-btn');
        this.removeSettingsBtn = $('#remove-settings-btn');
        this.usernameSpinner = $('#username-spinner');
        this.autoFillNote = $('#auto-fill-note');

        // Main submit button
        this.mainSubmitBtn = $('#main-submit-btn');

        // Assigned issues link
        this.assignedIssuesLink = $('#assigned-issues-link');

        // Debounce timer for username API calls
        this.usernameDebounceTimer = null;
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAll();
        this.loadingIndicator.show();
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.loadingIndicator.hide();
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.hideAll();
        this.errorMessage.text(message);
        this.errorContainer.show();
    }

    /**
     * Show no issues message
     */
    showNoIssues() {
        this.hideAll();
        this.noIssuesMessage.show();
    }

    /**
     * Hide all status messages
     */
    hideAll() {
        this.loadingIndicator.hide();
        this.errorContainer.hide();
        this.noIssuesMessage.hide();
    }

    /**
     * Render issues list
     * @param {Array} issues - Array of formatted issue data
     */
    renderIssues(issues) {
        this.hideAll();

        if (issues.length === 0) {
            this.showNoIssues();
            return;
        }

        this.issuesContainer.empty();

        // Limit number of issues displayed according to configuration
        const displayedIssues = issues.slice(0, BuddyExchangeConfig.maxIssuesDisplayed);

        displayedIssues.forEach(issue => {
            const issueCard = this.createIssueCard(issue);
            this.issuesContainer.append(issueCard);
        });

        // Show message if issues were truncated
        if (issues.length > BuddyExchangeConfig.maxIssuesDisplayed) {
            const remainingCount = issues.length - BuddyExchangeConfig.maxIssuesDisplayed;
            this.issuesContainer.append(`
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <strong>Showing ${BuddyExchangeConfig.maxIssuesDisplayed} of ${issues.length} available issues.</strong><br>
                        ${remainingCount} more issue${remainingCount !== 1 ? 's' : ''} available.
                        <a href="${window.app.githubAPI.generateAllBuddyExchangeIssuesSearchUrl()}" target="_blank" class="text-decoration-none">
                            View all on GitHub
                        </a>
                    </div>
                </div>
            `);
        }
    }

    /**
     * Render markdown content as HTML
     * @param {string} markdown - Markdown content
     * @param {number} maxLength - Maximum length before truncation (defaults to config value)
     * @returns {string} Rendered HTML
     */
    renderMarkdown(markdown, maxLength = null) {
        if (!markdown) return '';

        // Use configured excerpt length if no maxLength specified
        const actualMaxLength = maxLength !== null ? maxLength : this.config.excerptLength;

        // Truncate markdown before rendering to avoid processing large content
        const truncatedMarkdown = this.truncateText(markdown, actualMaxLength);

        try {
            // Configure marked for GitHub-flavored markdown
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false,
                smartLists: true,
                smartypants: false
            });

            return marked.parse(truncatedMarkdown);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            // Fallback to escaped text if markdown parsing fails
            return this.escapeHtml(truncatedMarkdown);
        }
    }

    /**
     * Create an issue card element
     * @param {Object} issue - Formatted issue data
     * @returns {jQuery} Issue card element
     */
    createIssueCard(issue) {
        const timeAgo = this.getTimeAgo(issue.createdAt);
        const renderedBody = this.renderMarkdown(issue.body || '');

        // Create card element using DOM manipulation instead of template literals
        // to avoid issues with HTML comments and backticks in markdown content
        const cardElement = this.createIssueCardSafely(issue, timeAgo, renderedBody);
        return cardElement;
    }

    /**
     * Create issue card safely using DOM manipulation to avoid template string issues
     * @param {Object} issue - Formatted issue data
     * @param {string} timeAgo - Formatted time string
     * @param {string} renderedBody - Rendered markdown content
     * @returns {jQuery} Issue card element
     */
    createIssueCardSafely(issue, timeAgo, renderedBody) {
        // Create the basic card structure without dynamic content
        const $card = $(`
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 issue-card">
                    <div class="card-header d-flex justify-content-between align-items-start">
                        <h5 class="card-title mb-0">
                            <a href="" target="_blank" class="text-decoration-none"></a>
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <img src="" alt="" class="avatar me-2" width="24" height="24">
                            <small class="text-muted">
                                by <a href="" target="_blank"></a>
                                <span class="ms-2"></span>
                            </small>
                        </div>

                        <div class="issue-content">
                            <div class="card-text markdown-content" style="display: none;"></div>

                            <div class="labels-section">
                                <div class="labels mb-2"></div>
                                <div class="issue-meta">
                                    <small class="text-muted">
                                        <i class="bi bi-chat"></i> <span class="comment-count"></span> comments
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <a href="" target="_blank" class="btn btn-primary btn-sm">
                            View on GitHub
                        </a>
                        <button class="btn btn-outline-success btn-sm ms-2" onclick="">
                            Claim Issue
                        </button>
                    </div>
                </div>
            </div>
        `);

        // Safely populate the dynamic content
        $card.find('.card-title a').attr('href', issue.url).text(`#${issue.number}: ${issue.title}`);
        $card.find('.avatar').attr('src', issue.author.avatar).attr('alt', issue.author.login);
        $card.find('small.text-muted a').attr('href', issue.author.url).text(issue.author.login);
        $card.find('small.text-muted .ms-2').text(timeAgo);
        $card.find('.comment-count').text(issue.comments);
        $card.find('.card-footer a').attr('href', issue.url);
        $card.find('.card-footer button').attr('onclick', `ui.claimIssue('${issue.url}')`);

        // Add rendered body content safely
        if (renderedBody) {
            $card.find('.card-text.markdown-content').html(renderedBody).show();
        }

        // Add labels safely
        const $labelsContainer = $card.find('.labels');
        if (issue.labels && issue.labels.length > 0) {
            issue.labels.forEach(label => {
                const labelColor = label.color || 'cccccc';
                const textColor = this.getContrastColor(labelColor);
                const $labelLink = $('<a>', {
                    href: this.getLabelUrl(label.name),
                    target: '_blank',
                    class: 'badge me-1 text-decoration-none',
                    style: `background-color: #${labelColor}; color: ${textColor};`,
                    title: `View all issues with label '${label.name}'`,
                    text: label.name
                });
                $labelsContainer.append($labelLink);
            });
        } else {
            $labelsContainer.append('<small class="text-muted">No labels</small>');
        }

        return $card;
    }

    /**
     * Handle issue claiming
     * @param {string} issueUrl - GitHub issue URL
     */
    claimIssue(issueUrl) {
        // Show modal with instructions (don't open GitHub page)
        this.showClaimInstructions(issueUrl);
    }

    /**
     * Get GitHub username (prioritizes stored username, then tries browser detection)
     * @returns {Promise<string|null>} GitHub username or null
     */
    async getGitHubUsername() {
        // First check if user has configured their username
        const storedUsername = this.getStoredGitHubUsername();
        if (storedUsername) {
            return storedUsername;
        }

        // Fallback to browser detection (legacy method)
        try {
            // Try to fetch the GitHub user API to check if logged in
            const response = await fetch('https://api.github.com/user', {
                credentials: 'omit' // Don't send cookies due to CORS
            });

            // If user is logged in, we'll get a 401 with rate limit headers
            // If not logged in, we'll get a 401 without user info
            // We need to check localStorage or try a different approach

            // Check if there's GitHub user info in localStorage (some GitHub apps store this)
            const githubUser = localStorage.getItem('github_username') ||
                              localStorage.getItem('gh_username') ||
                              sessionStorage.getItem('github_username');

            if (githubUser) {
                return githubUser;
            }

            // Try to extract from GitHub.com if in an iframe or opener
            if (window.opener && window.opener.location.hostname === 'github.com') {
                // Can't access due to CORS, but we could try postMessage
            }

            return null;
        } catch (error) {
            console.log('Could not detect GitHub username:', error);
            return null;
        }
    }

    /**
     * Show instructions for claiming an issue
     * @param {string} issueUrl - GitHub issue URL
     */
    async showClaimInstructions(issueUrl) {
        const githubUsername = await this.getGitHubUsername();
        const usernameDisplay = githubUsername ? `@${githubUsername}` : '@your-github-username';
        const hasConfiguredUsername = !!this.getStoredGitHubUsername();

        const markdownSnippet = `I would like to claim this issue for CODECHECK review.

${usernameDisplay} is interested in conducting the computational reproducibility check for this submission.

Please assign me to this issue if available. Thank you!`;

        const modal = $(`
            <div class="modal fade" id="claimModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Claim This CODECHECK Issue</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${!hasConfiguredUsername ? `
                            <div class="alert alert-info mb-4">
                                <h6>💡 Tip:</h6>
                                <p class="mb-2">For a better experience, consider <a href="#" class="configure-username-from-claim">configuring your default settings</a> first. This will automatically fill in your username in the claim message.</p>
                            </div>
                            ` : ''}

                            <div class="mb-4">
                                <h6>How to claim this issue:</h6>
                                <ol>
                                    <li>Copy the markdown snippet below</li>
                                    <li>Go to the GitHub issue and paste it as a comment</li>
                                    <li>Wait for the issue author to assign you</li>
                                    <li>Once assigned, start working on your CODECHECK</li>
                                    <li>Remember: this follows the "give one, get one" principle</li>
                                </ol>
                            </div>

                            <div class="mb-3">
                                <label for="markdownSnippet" class="form-label"><strong>Markdown snippet to copy:</strong></label>
                                <textarea id="markdownSnippet" class="form-control" rows="6" readonly>${this.escapeHtml(markdownSnippet)}</textarea>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary" onclick="ui.copyToClipboard('markdownSnippet')">
                                    📋 Copy Markdown Snippet
                                </button>
                                <a href="${issueUrl}" target="_blank" class="btn btn-outline-primary">
                                    🔗 Open GitHub Issue
                                </a>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);
        const modalInstance = new bootstrap.Modal(modal[0]);
        modalInstance.show();

        // Clean up modal after hiding
        modal[0].addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Handle settings configuration link in claim modal
        modal.find('.configure-username-from-claim').on('click', (e) => {
            e.preventDefault();
            modalInstance.hide();
            this.showSettingsConfigModal();
        });
    }

    /**
     * Get relative time string
     * @param {Date} date - Date to compare
     * @returns {string} Relative time string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
            }
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        }

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths === 1) return '1 month ago';
        if (diffMonths < 12) return `${diffMonths} months ago`;

        const diffYears = Math.floor(diffDays / 365);
        return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get contrast color for background
     * @param {string} hexColor - Hex color without #
     * @returns {string} 'white' or 'black'
     */
    getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? 'black' : 'white';
    }

    /**
     * Generate GitHub search URL for a specific label
     * @param {string} labelName - Name of the label
     * @returns {string} GitHub search URL for the label
     */
    getLabelUrl(labelName) {
        const searchQuery = `repo:${BuddyExchangeConfig.repository.fullName} label:"${labelName}"`;
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=issues`;
    }

    /**
     * Copy text content to clipboard
     * @param {string} elementId - ID of the element to copy from
     */
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.select();
        element.setSelectionRange(0, 99999); // For mobile devices

        try {
            document.execCommand('copy');

            // Show temporary success feedback
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.disabled = true;

            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);

        } catch (err) {
            console.error('Failed to copy text: ', err);

            // Fallback: show alert with text to copy manually
            alert('Copy failed. Please copy this text manually:\n\n' + element.value);
        }
    }

    /**
     * Show leaderboard loading state
     */
    showLeaderboardLoading() {
        this.leaderboardError.hide();
        this.leaderboardLoading.show();
    }

    /**
     * Hide leaderboard loading state
     */
    hideLeaderboardLoading() {
        this.leaderboardLoading.hide();
    }

    /**
     * Show leaderboard error
     * @param {string} message - Error message to display
     */
    showLeaderboardError(message) {
        this.hideLeaderboardLoading();
        this.leaderboardErrorMessage.text(message);
        this.leaderboardError.show();
    }

    /**
     * Render leaderboard data
     * @param {Object} leaderboardData - Leaderboard data object
     */
    renderLeaderboard(leaderboardData) {
        this.hideLeaderboardLoading();
        this.leaderboardError.hide();

        const { leaderboard, totalCompleted, activeContributors, lastUpdated } = leaderboardData;

        // Update statistics
        this.totalCompleted.text(totalCompleted);
        this.activeContributors.text(activeContributors);
        this.lastUpdated.text(this.getTimeAgo(lastUpdated));

        // Set up link for total completed to show all closed issues
        const allClosedIssuesUrl = window.app.githubAPI.generateAllClosedIssuesSearchUrl();
        this.totalCompleted.attr('href', allClosedIssuesUrl).attr('target', '_blank');

        // Set up link for active contributors to show all buddy exchange issues
        const allBuddyExchangeIssuesUrl = window.app.githubAPI.generateAllBuddyExchangeIssuesSearchUrl();
        this.activeContributors.attr('href', allBuddyExchangeIssuesUrl).attr('target', '_blank');

        // Clear and populate leaderboard list
        this.leaderboardList.empty();

        if (leaderboard.length === 0) {
            this.leaderboardList.append(`
                <div class="list-group-item text-center text-muted">
                    <p class="mb-0">No completed buddy exchanges found.</p>
                    <small>Be the first to complete one!</small>
                </div>
            `);
            return;
        }

        // Limit leaderboard length according to configuration
        const displayedLeaderboard = leaderboard.slice(0, BuddyExchangeConfig.leaderboardLength);

        displayedLeaderboard.forEach((user, index) => {
            const leaderboardItem = this.createLeaderboardItem(user, index + 1);
            this.leaderboardList.append(leaderboardItem);
        });

        // Show message if leaderboard was truncated
        if (leaderboard.length > BuddyExchangeConfig.leaderboardLength) {
            const remainingCount = leaderboard.length - BuddyExchangeConfig.leaderboardLength;
            this.leaderboardList.append(`
                <div class="list-group-item text-center text-muted">
                    <p class="mb-0">Showing top ${BuddyExchangeConfig.leaderboardLength} contributors.</p>
                    <small>${remainingCount} more contributor${remainingCount !== 1 ? 's' : ''} with completed CODECHECKs.</small>
                </div>
            `);
        }
    }

    /**
     * Create a leaderboard item element
     * @param {Object} user - User data
     * @param {number} rank - User's rank (1-based)
     * @returns {jQuery} Leaderboard item element
     */
    createLeaderboardItem(user, rank) {
        const rankIcon = this.getRankIcon(rank);
        const lastCompletedText = user.lastCompleted ?
            `Last: ${this.getTimeAgo(user.lastCompleted)}` :
            'Recently active';

        return $(`
            <a href="${user.searchUrl}" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-decoration-none leaderboard-item-link">
                <div class="d-flex align-items-center">
                    <div class="rank-badge me-3">
                        <span class="rank-number ${rank <= 3 ? 'rank-top' : ''}">${rankIcon}</span>
                    </div>
                    <img src="${user.avatar}" alt="${user.username}" class="avatar me-3" width="40" height="40">
                    <div>
                        <h6 class="mb-0">
                            <span class="username-text">
                                ${this.escapeHtml(user.username)}
                            </span>
                        </h6>
                        <small class="text-muted">${lastCompletedText}</small>
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary fs-6">${user.completedCount}</span>
                    <div><small class="text-muted">completed</small></div>
                </div>
            </a>
        `);
    }

    /**
     * Get rank icon for position
     * @param {number} rank - Rank position
     * @returns {string} Rank icon or number
     */
    getRankIcon(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return rank;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Initialize Bootstrap tooltips
        this.initializeTooltips();

        this.refreshButton.on('click', () => {
            window.app.loadIssues();
            window.app.loadLeaderboard();
        });

        // Next identifier link
        this.nextIdentifierLink.on('click', (e) => {
            e.preventDefault();
            this.showNextIdentifierModal();
        });

        // Submit with identifier button - close modal when clicked
        this.submitWithIdentifier.on('click', () => {
            const modalInstance = bootstrap.Modal.getInstance(this.nextIdentifierModal[0]);
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        // Settings configuration link
        this.configureSettingsLink.on('click', (e) => {
            e.preventDefault();
            this.showSettingsConfigModal();
        });

        // Save settings button
        this.saveSettingsBtn.on('click', () => {
            this.saveSettings();
        });

        // Remove settings button
        this.removeSettingsBtn.on('click', () => {
            this.removeAllSettings();
        });

        // Enter key in author name or username input
        this.authorNameInput.on('keypress', (e) => {
            if (e.which === 13) { // Enter key
                this.saveSettings();
            }
        });

        this.githubUsernameInput.on('keypress', (e) => {
            if (e.which === 13) { // Enter key
                this.saveSettings();
            }
        });

        // Add debounced input listener for username field
        this.githubUsernameInput.on('input', (e) => {
            this.debouncedFetchGitHubUserInfo();
        });

        // Main submit button - open next identifier modal
        this.mainSubmitBtn.on('click', () => {
            this.showNextIdentifierModal();
        });

        // Set up assigned issues link
        const assignedIssuesUrl = window.app.githubAPI.generateAssignedOpenIssuesSearchUrl();
        this.assignedIssuesLink.attr('href', assignedIssuesUrl).attr('target', '_blank');

        // Auto-refresh using configured interval
        setInterval(() => {
            window.app.loadIssues();
            window.app.loadLeaderboard();
        }, BuddyExchangeConfig.getRefreshIntervalMs());
    }

    /**
     * Initialize Bootstrap tooltips
     */
    initializeTooltips() {
        // Initialize all tooltips on the page
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    /**
     * Show next identifier modal and fetch the next available identifier
     */
    async showNextIdentifierModal() {
        // Show modal
        const modalInstance = new bootstrap.Modal(this.nextIdentifierModal[0]);
        modalInstance.show();

        // Reset modal state
        this.identifierContent.hide();
        this.identifierError.hide();
        this.submitWithIdentifier.hide();
        this.identifierLoading.show();

        try {
            // Fetch all issues from the repository
            const allIssues = await window.app.githubAPI.fetchAllIssues();

            // Extract certificate identifiers from titles
            const existingIdentifiers = window.app.githubAPI.extractCertificateIdentifiers(allIssues);

            // Calculate next available identifier
            const nextNumber = window.app.githubAPI.calculateNextIdentifier(existingIdentifiers);
            const nextIdentifier = window.app.githubAPI.formatCertificateIdentifier(nextNumber);

            // Update modal content
            this.displayNextIdentifier(nextIdentifier);

        } catch (error) {
            console.error('Error fetching next identifier:', error);
            this.showIdentifierError('Failed to fetch next identifier. Please try again later.');
        } finally {
            this.identifierLoading.hide();
        }
    }

    /**
     * Display the next identifier in the modal
     * @param {string} identifier - The next available identifier
     */
    displayNextIdentifier(identifier) {
        this.nextIdentifierDisplay.text(identifier);

        // Get stored author name or use placeholder
        const storedAuthorName = this.getStoredAuthorName();
        let suggestedTitle;
        let usedStoredInfo = false;

        if (storedAuthorName) {
            // Use stored author name without square brackets
            suggestedTitle = `${storedAuthorName} | ${identifier}`;
            usedStoredInfo = true;
        } else {
            // Use placeholder with square brackets
            suggestedTitle = `[Author Name] | ${identifier}`;
        }

        this.suggestedTitle.val(suggestedTitle);

        // Show/hide note about using stored information
        this.updateStoredInfoNote(usedStoredInfo);

        // Generate GitHub issue URL with pre-filled title and additional label
        const baseUrl = BuddyExchangeConfig.urls.getGitHubNewIssueUrl();
        const params = new URLSearchParams({
            assignees: '',
            labels: `${BuddyExchangeConfig.labels.buddyExchange},${BuddyExchangeConfig.labels.identifierAssigned}`,
            projects: '',
            template: BuddyExchangeConfig.urls.issueTemplate,
            title: suggestedTitle
        });
        const issueUrl = `${baseUrl}?${params.toString()}`;

        this.submitWithIdentifier.attr('href', issueUrl);
        this.submitWithIdentifier.show();
        this.identifierContent.show();
    }

    /**
     * Update the stored info note visibility and content
     * @param {boolean} usedStoredInfo - Whether stored information was used
     */
    updateStoredInfoNote(usedStoredInfo) {
        let noteElement = $('#stored-info-note');

        // Create note element if it doesn't exist
        if (noteElement.length === 0) {
            this.suggestedTitle.after(`
                <div id="stored-info-note" class="form-text text-success mt-1" style="display: none;">
                    <i class="bi bi-info-circle"></i> Using your saved author name from settings
                </div>
            `);
            noteElement = $('#stored-info-note');
        }

        if (usedStoredInfo) {
            noteElement.show();
        } else {
            noteElement.hide();
        }
    }

    /**
     * Show error in identifier modal
     * @param {string} message - Error message
     */
    showIdentifierError(message) {
        this.identifierErrorMessage.text(message);
        this.identifierError.show();
    }

    /**
     * Get stored GitHub username from localStorage
     * @returns {string|null} Stored username or null
     */
    getStoredGitHubUsername() {
        return localStorage.getItem(BuddyExchangeConfig.storage.githubUsername);
    }

    /**
     * Get stored author name from localStorage
     * @returns {string|null} Stored author name or null
     */
    getStoredAuthorName() {
        return localStorage.getItem(BuddyExchangeConfig.storage.authorName);
    }

    /**
     * Store GitHub username in localStorage
     * @param {string} username - GitHub username to store
     */
    storeGitHubUsername(username) {
        localStorage.setItem(BuddyExchangeConfig.storage.githubUsername, username);
    }

    /**
     * Store author name in localStorage
     * @param {string} authorName - Author name to store
     */
    storeAuthorName(authorName) {
        localStorage.setItem(BuddyExchangeConfig.storage.authorName, authorName);
    }

    /**
     * Remove stored GitHub username from localStorage
     */
    removeStoredGitHubUsername() {
        localStorage.removeItem(BuddyExchangeConfig.storage.githubUsername);
    }

    /**
     * Remove stored author name from localStorage
     */
    removeStoredAuthorName() {
        localStorage.removeItem(BuddyExchangeConfig.storage.authorName);
    }

    /**
     * Remove all stored settings from localStorage
     */
    removeAllStoredSettings() {
        this.removeStoredGitHubUsername();
        this.removeStoredAuthorName();
    }

    /**
     * Show settings configuration modal
     */
    showSettingsConfigModal() {
        // Show modal
        const modalInstance = new bootstrap.Modal(this.settingsConfigModal[0]);
        modalInstance.show();

        // Load current settings
        const currentUsername = this.getStoredGitHubUsername();
        const currentAuthor = this.getStoredAuthorName();

        // Update display of current settings
        let hasSettings = false;

        if (currentAuthor) {
            this.currentAuthorText.text(currentAuthor);
            this.currentAuthorDisplay.show();
            this.authorNameInput.val(currentAuthor);
            hasSettings = true;
        } else {
            this.currentAuthorDisplay.hide();
            this.authorNameInput.val('');
        }

        if (currentUsername) {
            this.currentUsernameText.text(currentUsername);
            this.currentUsernameDisplayItem.show();
            this.githubUsernameInput.val(currentUsername);
            hasSettings = true;
        } else {
            this.currentUsernameDisplayItem.hide();
            this.githubUsernameInput.val('');
        }

        if (hasSettings) {
            this.currentSettingsDisplay.show();
            this.removeSettingsBtn.show();
        } else {
            this.currentSettingsDisplay.hide();
            this.removeSettingsBtn.hide();
        }
    }

    /**
     * Save settings (both author name and GitHub username)
     */
    saveSettings() {
        const authorName = this.authorNameInput.val().trim();
        const username = this.githubUsernameInput.val().trim();

        // Validate author name if provided
        if (authorName && authorName.length < 2) {
            alert('Author name must be at least 2 characters long');
            return;
        }

        // Validate GitHub username if provided
        if (username && !/^[a-zA-Z0-9]([a-zA-Z0-9]|-)*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(username)) {
            alert('Please enter a valid GitHub username (alphanumeric characters and hyphens only)');
            return;
        }

        // Store both settings
        if (authorName) {
            this.storeAuthorName(authorName);
        }
        if (username) {
            this.storeGitHubUsername(username);
        }

        // Close modal
        const modalInstance = bootstrap.Modal.getInstance(this.settingsConfigModal[0]);
        if (modalInstance) {
            modalInstance.hide();
        }

        // Show success message
        const savedItems = [];
        if (authorName) savedItems.push('Author name');
        if (username) savedItems.push('GitHub username');

        if (savedItems.length > 0) {
            this.showTemporaryMessage(`${savedItems.join(' and ')} saved successfully!`, 'success');
        } else {
            this.showTemporaryMessage('Settings updated!', 'info');
        }
    }

    /**
     * Remove all stored settings
     */
    removeAllSettings() {
        if (confirm('Are you sure you want to clear all your saved settings? This will remove your author name and GitHub username.')) {
            this.removeAllStoredSettings();

            // Update modal display
            this.currentSettingsDisplay.hide();
            this.removeSettingsBtn.hide();
            this.authorNameInput.val('');
            this.githubUsernameInput.val('');

            this.showTemporaryMessage('All settings cleared successfully!', 'info');
        }
    }

    /**
     * Debounced function to fetch GitHub user info
     */
    debouncedFetchGitHubUserInfo() {
        // Clear existing timer
        if (this.usernameDebounceTimer) {
            clearTimeout(this.usernameDebounceTimer);
        }

        // Set new timer using configured debounce time
        this.usernameDebounceTimer = setTimeout(() => {
            this.fetchGitHubUserInfo();
        }, BuddyExchangeConfig.ui.usernameDebounceTime);
    }

    /**
     * Fetch GitHub user information and auto-fill author name
     */
    async fetchGitHubUserInfo() {
        const username = this.githubUsernameInput.val().trim();

        // Don't fetch if username is empty or invalid
        if (!username || !/^[a-zA-Z0-9]([a-zA-Z0-9]|-)*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(username)) {
            this.autoFillNote.hide();
            return;
        }

        // Don't auto-fill if author name is already filled by user
        const currentAuthorName = this.authorNameInput.val().trim();
        if (currentAuthorName && currentAuthorName !== 'Your Full Name') {
            return;
        }

        try {
            // Show loading spinner and note
            this.usernameSpinner.show();
            this.autoFillNote.show();

            // Fetch user info from GitHub API
            const response = await fetch(`https://api.github.com/users/${username}`);

            if (response.ok) {
                const userData = await response.json();

                // Auto-fill author name if GitHub profile has a real name
                if (userData.name && userData.name.trim()) {
                    this.authorNameInput.val(userData.name.trim());

                    // Show success feedback
                    this.autoFillNote.html('<span class="text-success">✓ Fetched from GitHub profile</span>');

                    // Reset note after configured time
                    setTimeout(() => {
                        this.autoFillNote.html('We\'ll try to fetch this from your GitHub profile.');
                    }, BuddyExchangeConfig.ui.messageDisplayDuration);
                } else {
                    // User exists but no real name set
                    this.autoFillNote.html('<span class="text-warning">Profile found, but no real name is set</span>');

                    setTimeout(() => {
                        this.autoFillNote.hide();
                    }, BuddyExchangeConfig.ui.messageDisplayDuration);
                }
            } else if (response.status === 404) {
                // User not found
                this.autoFillNote.html('<span class="text-warning">GitHub user not found</span>');

                setTimeout(() => {
                    this.autoFillNote.hide();
                }, BuddyExchangeConfig.ui.messageDisplayDuration);
            } else {
                // Other API error
                console.warn('GitHub API error:', response.status, response.statusText);
                this.autoFillNote.hide();
            }
        } catch (error) {
            console.warn('Failed to fetch GitHub user info:', error);
            this.autoFillNote.hide();
        } finally {
            // Hide loading spinner
            this.usernameSpinner.hide();
        }
    }

    /**
     * Show temporary message to user
     * @param {string} message - Message to show
     * @param {string} type - Bootstrap alert type (success, info, warning, danger)
     */
    showTemporaryMessage(message, type = 'info') {
        const alertId = 'temp-alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed"
                 style="top: 20px; right: 20px; z-index: 9999; max-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        $('body').append(alertHtml);

        // Auto-remove after configured time
        setTimeout(() => {
            $(`#${alertId}`).alert('close');
        }, BuddyExchangeConfig.ui.messageDisplayDuration);
    }
}