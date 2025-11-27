import dotenv from "dotenv";
import app from "./server.js";

dotenv.config();

const PORT = process.env.PORT || 8080;


app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
