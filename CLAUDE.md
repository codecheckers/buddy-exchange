# Project: CODECHECK Buddy Exchange

## Purpose

A standalone JavaScript application that queries the GitHub API to find issues labeled "buddy exchang" in the CODECHECK register repository at <https://github.com/codecheckers/testing-dev-register> to provide easy access to issues that currently do not have an assigned codechecker.
The app helps to facilitate the "give one get one" principle of the buddy exchange by making it easy for codecheckers to find issues that need reviewing and to claim them.
The app is built with  and Bootstrap for simplicity and ease of use.

## Architecture

- Frontend: jQuery, Bootstrap and HTML5
- API: Read-only access to the GitHub API
- Authentication: None (public data only)

## Key Directories

- ...

## Coding Standards

#- We use ESLint with the Airbnb config

- Component names are PascalCase
- Utility functions are camelCase
- We use functional components with hooks
- We do not load JS or CSS from CDNs, all dependencies are managed locally via npm

## Design Standards

- We use a consistent color scheme and typography based on the CODECHECK branding from the website at <https://codecheck.org.uk> and the logo files at <https://github.com/codecheckers/codecheckers.github.io/tree/master/logo>
- We use Bootstrap for layout and styling
- We ensure accessibility with semantic HTML and ARIA attributes
- We follow responsive design principles for mobile compatibility
