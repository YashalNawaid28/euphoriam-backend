const { Sequelize } = require("sequelize");

// Explicitly require pg to ensure it's included in Vercel build
const pg = require("pg");

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg, // Explicitly set the dialect module
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const initDb = async () => {
  await sequelize.authenticate();
  // Register models and associations before sync
  const models = require("../models");
  models.applyAssociations();
  await sequelize.sync();
  console.log("Database connected and synced");
  return models;
};

module.exports = { sequelize, initDb };


