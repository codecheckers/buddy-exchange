# CODECHECK Buddy Exchange

A single page application that helps facilitate the "give one get one" principle of the buddy exchange by making it easy for codecheckers to find and claim issues that need reviewing.

The app queries the GitHub API to find issues labeled "buddy exchange" in the [CODECHECK register repository](https://github.com/codecheckers/testing-dev-register) and provides easy access to issues that currently do not have an assigned codechecker.

## Features

- 📋 Browse available buddy exchange issues
- 🔍 View issue details, authors, and labels
- 🎯 One-click claim functionality with instructions
- 🔄 Auto-refresh every 5 minutes
- 📱 Responsive design for mobile and desktop
- 🎨 Consistent CODECHECK branding

## Quick Start

1. **Download dependencies:**

   ```bash
   npm run download-deps
   ```

2. **Start the development server:**

   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8000`

## Available Scripts

### `npm start`

Starts a local development server on port 8000 using Python's built-in HTTP server.

- **Command:** `python3 -m http.server 8000`
- **Access:** http://localhost:8000

### `npm run serve`

Alternative command to start the development server (same as `npm start`).

- **Command:** `python3 -m http.server 8000`
- **Access:** http://localhost:8000

### `npm run download-deps`

Downloads all required JavaScript and CSS dependencies locally. This ensures the app works offline and doesn't rely on CDNs.

- **Downloads:** jQuery 3.7.1 and Bootstrap 5.3.2
- **Run this first** before starting the application

### `npm run download-jquery`

Downloads only the jQuery library to `assets/js/jquery.min.js`.

- **Source:** https://code.jquery.com/jquery-3.7.1.min.js
- **Output:** `assets/js/jquery.min.js`

### `npm run download-bootstrap`

Downloads Bootstrap CSS and JavaScript files to the assets directory.

- **CSS Source:** https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css
- **JS Source:** https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js
- **Output:** `assets/css/bootstrap.min.css` and `assets/js/bootstrap.min.js`

## Deployment

This application is designed for static hosting and is fully compatible with GitHub Pages:

1. Push your changes to the `main` branch
2. Enable GitHub Pages in repository settings
3. Set source to "Deploy from a branch" → `main` → `/ (root)`
4. Your app will be available at `https://codecheck.org.uk/buddy-exchange`

## Project Structure

```txt
buddy-exchange/
├── index.html                # Main entry point
├── package.json              # Project configuration
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css # Bootstrap CSS (downloaded)
│   │   └── main.css          # Custom styles
│   ├── js/
│   │   ├── jquery.min.js     # jQuery library (downloaded)
│   │   ├── bootstrap.min.js  # Bootstrap JS (downloaded)
│   │   ├── app.js            # Main application logic
│   │   ├── github-api.js     # GitHub API interface
│   │   └── ui.js             # UI components
│   └── images/               # Images and icons
└── README.md                 # This file
```

## Libraries and Licenses

This project uses the following third-party libraries:

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| [jQuery](https://jquery.com/) | 3.7.1 | MIT | DOM manipulation and AJAX requests |
| [Bootstrap](https://getbootstrap.com/) | 5.3.2 | MIT | CSS framework for responsive design |
| [Marked.js](https://marked.js.org/) | 9.1.6 | MIT | Markdown parsing and rendering |

All libraries are distributed under the MIT License, which is compatible with this project's MIT License.

## Requirements

- **Python 3** (for local development server)
- **curl** (for downloading dependencies)
- **Modern web browser** with JavaScript enabled

## License

MIT License - see [LICENSE](LICENSE) file for details.
