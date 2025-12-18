require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/config/sequelize");

const PORT = process.env.PORT || 3000;

// Initialize database connection lazily for serverless
let dbConnected = false;

const ensureDbConnected = async () => {
  if (!dbConnected) {
    try {
      await sequelize.authenticate();
      console.log("Database connection established");
      
      // Register models and associations
      const models = require("./src/models");
      if (models.applyAssociations) {
        models.applyAssociations();
      }
      
      // Don't sync in production serverless - tables should already exist
      if (process.env.NODE_ENV !== "production") {
        await sequelize.sync();
        console.log("Database synced");
      }
      
      dbConnected = true;
    } catch (err) {
      console.error("Database connection failed:", err);
      throw err;
    }
  }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database connection failed",
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// For local development
if (require.main === module) {
  const { initDb } = require("./src/config/sequelize");
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
