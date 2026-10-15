# scrapr web

This workspace includes a small local web interface for the existing `scrapr`
library. It sends requests to the actual installed scraper methods; it does not
mock results or change the scraper implementations.

## Run on Windows

1. Install Node.js 16 or newer (npm is included).
2. Double-click `start.bat`. It installs the package dependencies the first
   time, starts the local server, and opens the page in your browser.
3. Paste a URL, choose a platform and one of its available methods, then select
   **Scrape link**.

You can also start it from this folder with `npm start`. By default the server
is available only on this computer at <http://127.0.0.1:3000>. Press Ctrl+C in
the terminal to stop it. Set `OPEN_BROWSER=0` to start the server without
opening a browser window.

The session history stays in the current browser tab and is cleared when the
page is refreshed. Use scraper results only where you have permission to access
or download the content.
