// Run this ONLY after configuring MongoDB Atlas (tomorrow's step).
const { connectDatabase, closeDatabase } = require('../database.js');

async function main() {
  try {
    const db = await connectDatabase();
    console.log(`MongoDB connected: ${db.databaseName}`);
  } catch (error) {
    console.error(error.message); // no secrets in error messages
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
