import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Google OAuth Endpoints
  // Note: These will need real CLIENT_ID and CLIENT_SECRET in production
  app.get("/api/auth/google/url", (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: `${process.env.APP_URL}/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/drive.file",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  app.get("/auth/google/callback", (req, res) => {
    const { code } = req.query;
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code: '${code}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. Closing window...</p>
        </body>
      </html>
    `);
  });

  // Proxy to save data to drive would go here
  // For now, we'll provide a placeholder for the logic
  app.post("/api/drive/sync", (req, res) => {
    // In a real implementation:
    // 1. Exchange code for tokens
    // 2. Use access token to create/update file in Drive
    // 3. Return success
    res.json({ success: true, message: "Sync feature prepared. Requires GOOGLE_CLIENT_ID/SECRET for full functionality." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
