# Linkora

**One Link. More Data.**

Linkora is a multi-platform link scraper featuring a bold, modern Neo-Brutalist interface inspired by creator-focused platforms. It brings supported social media and music platforms together in one place through a clean, intuitive user experience.

## Supported Platforms

- Apple Music
- Spotify
- Facebook
- Instagram
- TikTok
- YouTube
- X (formerly Twitter)

## Run locally on Windows

1. Install Node.js 16 or newer (npm is included).
2. Double-click [`start.bat`](./start.bat). It installs the dependencies the first time, starts the local server, and opens Linkora in your browser.
3. Paste a URL, choose a platform and method, then select **Scrape link**.

Alternatively, run `npm start` from this folder. The server is available only on this computer at http://127.0.0.1:3000 by default. Press Ctrl+C in the terminal to stop it. Set `OPEN_BROWSER=0` to start without opening a browser window.

## Credits & Attribution

Linkora's UI/UX redesign and visual enhancements are created by **Hafiz Arya Pratama**.

The underlying scraping functionality is based on the original [Scrapr](https://github.com/coflyn/scrapr) project by **Coflyn**. The Scrapr library and its license notices are retained in [`scrapr/`](./scrapr/).

This repository builds upon the original project. Please review its license and preserve the required attribution notices.

## Developer

- **GitHub:** [hafizarya326](https://github.com/hafizarya326)
- **Instagram:** [hafizpratama326](https://www.instagram.com/hafizpratama326/)
- **TikTok:** [@fizmood](https://www.tiktok.com/@fizmood)

## Disclaimer

Linkora is an independent project and is not affiliated with or endorsed by the listed platforms. Availability of metadata and functionality depends on the underlying scraper implementation and each platform's policies.

Use this project responsibly and respect applicable terms of service, copyright, and privacy requirements.