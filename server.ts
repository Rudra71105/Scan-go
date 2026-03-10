import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("shopping.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Data
const seedProducts = [
  { id: 'CLOTH-001', name: 'Premium Polo T-shirt', price: 1499, image_url: 'https://picsum.photos/seed/polo/400/600', description: 'Classic fit premium cotton polo t-shirt.' },
  { id: 'CLOTH-002', name: 'Vintage Denim Jacket', price: 4499, image_url: 'https://picsum.photos/seed/denim-jacket/400/600', description: 'Vintage wash denim jacket with metal buttons.' },
  { id: 'CLOTH-003', name: 'Classic Blue Jeans', price: 2499, image_url: 'https://picsum.photos/seed/jeans/400/600', description: 'Durable and stylish classic blue denim jeans.' },
  { id: 'CLOTH-004', name: 'Oversized Hoodie', price: 1999, image_url: 'https://picsum.photos/seed/hoodie/400/600', description: 'Warm and cozy oversized cotton hoodie.' },
];

// Use REPLACE instead of INSERT OR IGNORE to update existing data if needed
const insertProduct = db.prepare('INSERT OR REPLACE INTO products (id, name, price, image_url, description) VALUES (?, ?, ?, ?, ?)');
seedProducts.forEach(p => insertProduct.run(p.id, p.name, p.price, p.image_url, p.description));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/signup", (req, res) => {
    const { username, name, password } = req.body;
    try {
      const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
      db.prepare('INSERT INTO users (id, name, password) VALUES (?, ?, ?)').run(username, name, password);
      res.json({ success: true, user: { id: username, name } });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error during signup" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Legacy support for bit197
    if (username === "bit197" && password === "1234") {
      return res.json({ success: true, user: { id: "bit197", name: "User 197" } });
    }

    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(username, password);
      if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name } });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error during login" });
    }
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });

  app.post("/api/checkout", (req, res) => {
    const { userId, total, items, paymentMethod } = req.body;
    const info = db.prepare('INSERT INTO orders (user_id, total, items, payment_method) VALUES (?, ?, ?, ?)').run(userId, total, JSON.stringify(items), paymentMethod || 'Cash');
    res.json({ success: true, orderId: info.lastInsertRowid });
  });

  app.get("/api/orders/:userId", (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(orders);
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
