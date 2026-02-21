import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const GEMINI_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;


const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

const apiCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = apiCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  if (entry) apiCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  if (apiCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of apiCache) {
      if (v.expiry < now) apiCache.delete(k);
    }
    if (apiCache.size > 500) {
      const firstKey = apiCache.keys().next().value;
      if (firstKey) apiCache.delete(firstKey);
    }
  }
  apiCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

function sanitizeString(s: any): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[<>]/g, '').trim().slice(0, 500);
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

if (!TMDB_API_KEY || !RAWG_API_KEY) {
  console.warn("Warning: TMDB_API_KEY or RAWG_API_KEY not set in environment variables.");
}

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());


  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: "Too many requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", apiLimiter);

  // TMDB Proxy
  app.get("/api/tmdb/search/:type", async (req, res) => {
    const { type } = req.params;
    if (type !== 'MOVIE' && type !== 'SERIES') {
      return res.status(400).json({ error: "Invalid type" });
    }
    const query = sanitizeString(req.query.query);
    if (!query) return res.status(400).json({ error: "Query required" });

    const cacheKey = `tmdb:search:${type}:${query}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const endpoint = type === 'MOVIE' ? 'search/movie' : 'search/tv';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      setCache(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("TMDB Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
  });

  app.get("/api/tmdb/details/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    if (type !== 'MOVIE' && type !== 'SERIES') {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cacheKey = `tmdb:details:${type}:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const endpoint = type === 'MOVIE' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      setCache(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("TMDB Details Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch details from TMDB" });
    }
  });

  // RAWG Proxy
  app.get("/api/rawg/search", async (req, res) => {
    const query = sanitizeString(req.query.query);
    if (!query) return res.status(400).json({ error: "Query required" });
    const pageSize = Math.min(Math.max(parseInt(req.query.page_size as string) || 10, 1), 40);

    const cacheKey = `rawg:search:${query}:${pageSize}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      setCache(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("RAWG Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from RAWG" });
    }
  });

  app.get("/api/rawg/details/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cacheKey = `rawg:details:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      setCache(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("RAWG Details Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch details from RAWG" });
    }
  });

  // OpenLibrary Proxy
  app.get("/api/openlibrary/*path", async (req, res) => {
    const olPath = sanitizeString(req.params.path);
    if (!olPath) return res.status(400).json({ error: "Path required" });
    const query = new URLSearchParams(req.query as any).toString();
    const url = `https://openlibrary.org/${olPath}${query ? '?' + query : ''}`;

    const cacheKey = `ol:${olPath}:${query}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      setCache(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("OpenLibrary Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from OpenLibrary" });
    }
  });

  // Gemini AI Proxy Routes
  app.post("/api/gemini/generate", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const { prompt, model } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Generate Error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  app.post("/api/gemini/translate", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.json({ text: text || '' });
    }
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following text to Brazilian Portuguese (pt-BR). Maintain the original tone, line breaks, and formatting. If the text is already in Portuguese, return it exactly as is: \n\n${text}`,
      });
      res.json({ text: response.text || text });
    } catch (error) {
      console.error("Gemini Translate Error:", error);
      res.json({ text: text });
    }
  });

  app.post("/api/gemini/entertainment-info", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const { title, type } = req.body;
    if (!title || !type || typeof title !== 'string' || typeof type !== 'string') {
      return res.status(400).json({ error: "Missing title or type" });
    }
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find detailed information about the ${type} titled "${title}". 
        Return a JSON object with the following fields:
        - title: The official title.
        - posterUrl: A valid public URL for the poster image if available.
        - releaseDate: Release date in YYYY-MM-DD format.
        - totalSeasons: Total number of seasons (for TV/Anime).
        - totalEpisodes: Total number of episodes (for TV/Anime).
        - author: The author name (for Books).
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              posterUrl: { type: Type.STRING },
              releaseDate: { type: Type.STRING },
              totalSeasons: { type: Type.INTEGER },
              totalEpisodes: { type: Type.INTEGER },
              author: { type: Type.STRING },
            },
          },
        }
      });
      if (response.text) {
        res.json(JSON.parse(response.text));
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Gemini Entertainment Info Error:", error);
      res.status(500).json({ error: "Failed to fetch entertainment info" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
