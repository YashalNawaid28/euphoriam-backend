require("dotenv").config();
const app = require("./src/app");
const { initDb } = require("./src/config/sequelize");

const PORT = process.env.PORT || 3000;

// Initialize database once
let dbInitialized = false;
let dbInitPromise = null;

const ensureDbInitialized = async () => {
  if (dbInitialized) {
    return;
  }
  if (!dbInitPromise) {
    dbInitPromise = initDb()
      .then(() => {
        dbInitialized = true;
        console.log("Database initialized successfully");
      })
      .catch((err) => {
        console.error("Failed to initialize database:", err);
        dbInitPromise = null; // Reset so it can retry
        throw err;
      });
  }
  return dbInitPromise;
};

// For serverless (Vercel)
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    console.error("Database initialization error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// For local development
if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to initialize database:", err);
      process.exit(1);
    });
}

// Export for Vercel
module.exports = app;
