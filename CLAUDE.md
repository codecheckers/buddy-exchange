# Project: CODECHECK Buddy Exchange

## Purpose

A standalone JavaScript application that queries the GitHub API to find issues labeled "buddy exchange" in the CODECHECK register repository at <https://github.com/codecheckers/register> to provide easy access to issues that currently do not have an assigned codechecker.
The app helps to facilitate the "give one get one" principle of the buddy exchange by making it easy for codecheckers to find issues that need reviewing and to claim them.
The app is built with jQuery and Bootstrap for simplicity and ease of use.

## Architecture

- Frontend: jQuery, Bootstrap and HTML5
- API: Read-only access to the GitHub API (unauthenticated, 60 requests/hour)
- Authentication: None (public data only)
- No build step: static files served directly

## Versioning

This project uses **semantic versioning** (MAJOR.MINOR.PATCH) as defined in `package.json`.

- **Any code change must include a version bump.** Update the `version` field in both `package.json` and `BuddyExchangeConfig.version` in `assets/js/config.js` — these must always match.
- **MAJOR**: Breaking changes or fundamental redesign
- **MINOR**: New features or significant enhancements
- **PATCH**: Bug fixes, small tweaks, style changes

The version is displayed in the app footer via the `#app-version` element, populated from `BuddyExchangeConfig.version` on page load.

## Key Directories

- `assets/js/` — Application JavaScript (config, API, UI, app entry point)
- `assets/css/` — Stylesheets (Bootstrap + custom)
- `assets/images/` — Icons and images

## Coding Standards

- Component names are PascalCase
- Utility functions are camelCase
- We do not load JS or CSS from CDNs, all dependencies are managed locally via npm

## Design Standards

- We use a consistent color scheme and typography based on the CODECHECK branding from the website at <https://codecheck.org.uk> and the logo files at <https://github.com/codecheckers/codecheckers.github.io/tree/master/logo>
- We use Bootstrap for layout and styling
- We ensure accessibility with semantic HTML and ARIA attributes
- We follow responsive design principles for mobile compatibility
