import app from "./src/server.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res); // Express apps are functions: (req, res)
}
