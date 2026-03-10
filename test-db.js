import Database from "better-sqlite3";
const db = new Database("shopping.db");
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables:", tables);
  const users = db.prepare("SELECT * FROM users").all();
  console.log("Users count:", users.length);
} catch (e) {
  console.error("Error:", e.message);
}
