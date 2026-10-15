const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { execFile } = require("child_process");
const scrapr = require("./scrapr");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const MAX_BODY_SIZE = 32 * 1024;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_SIZE) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        req.resume();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (size > MAX_BODY_SIZE) return;
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(pathname, res, method) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(res, 400, { message: "Invalid URL path." });
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    sendJson(res, 403, { message: "Access denied." });
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      sendJson(res, 404, { message: "Not found." });
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    if (method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || HOST}`);

  if (requestUrl.pathname === "/api/platforms" && req.method === "GET") {
    const platforms = Object.entries(scrapr)
      .filter(([id]) => id !== "default" && Object.prototype.hasOwnProperty.call(scrapr, id))
      .map(([id, methods]) => ({
        id,
        methods: Object.keys(methods).filter((method) => typeof methods[method] === "function"),
      }));
    sendJson(res, 200, { platforms });
    return;
  }

  if (requestUrl.pathname === "/api/scrape" && req.method === "POST") {
    try {
      const { platform, method, url } = await readJson(req);
      if (typeof platform !== "string" || typeof method !== "string" || typeof url !== "string") {
        sendJson(res, 400, { message: "Platform, method, and URL are required." });
        return;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url.trim());
      } catch {
        sendJson(res, 400, { message: "Enter a valid URL, including https://." });
        return;
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        sendJson(res, 400, { message: "Only HTTP and HTTPS URLs are supported." });
        return;
      }

      const platformMethods = Object.prototype.hasOwnProperty.call(scrapr, platform)
        ? scrapr[platform]
        : null;
      const scraper =
        platformMethods && Object.prototype.hasOwnProperty.call(platformMethods, method)
          ? platformMethods[method]
          : null;
      if (typeof scraper !== "function") {
        sendJson(res, 400, { message: "That platform or scraper method is not available." });
        return;
      }

      const result = await scraper(url.trim());
      sendJson(res, 200, result);
    } catch (error) {
      if (res.headersSent) return;
      sendJson(res, error.statusCode || 500, {
        message: error.statusCode ? error.message : "The scraper could not complete this request.",
      });
    }
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(requestUrl.pathname, res, req.method);
    return;
  }

  sendJson(res, 405, { message: "Method not allowed." });
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : PORT;
  const webUrl = `http://${HOST}:${port}`;
  console.log(`scrapr web is ready at ${webUrl}`);
  console.log("Press Ctrl+C to stop the local server.");

  if (process.env.OPEN_BROWSER === "0") return;
  const browserCommand = process.platform === "win32"
    ? "rundll32.exe"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const browserArgs = process.platform === "win32"
    ? ["url.dll,FileProtocolHandler", webUrl]
    : [webUrl];
  execFile(browserCommand, browserArgs, { windowsHide: true }, (error) => {
    if (error) console.warn(`Open ${webUrl} in your browser to use scrapr web.`);
  });
});

server.on("error", (error) => {
  console.error(`Could not start the web server: ${error.message}`);
  process.exitCode = 1;
});
