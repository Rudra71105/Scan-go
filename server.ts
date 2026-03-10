import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("shopping.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
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

// Migration: Add email column if it doesn't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT');
} catch (e) {
  // Column might already exist, ignore error
}

// Seed Data
const seedProducts = [
  { id: 'CLOTH-001', name: 'Tshirt', price: 999, image_url: 'https://picsum.photos/seed/tshirt/400/600', description: 'Comfortable cotton T-shirt.' },
  { id: 'CLOTH-002', name: 'shirt', price: 1299, image_url: 'https://picsum.photos/seed/shirt/400/600', description: 'Formal button-down shirt.' },
  { id: 'CLOTH-003', name: 'denim jeans', price: 2499, image_url: 'https://picsum.photos/seed/jeans/400/600', description: 'Classic blue denim jeans.' },
  { id: 'CLOTH-004', name: 'socks', price: 299, image_url: 'https://picsum.photos/seed/socks/400/600', description: 'Soft cotton socks.' },
  { id: 'CLOTH-005', name: 'cargo', price: 1899, image_url: 'https://picsum.photos/seed/cargo/400/600', description: 'Multi-pocket cargo pants.' },
];

// Use REPLACE instead of INSERT OR IGNORE to update existing data if needed
const insertProduct = db.prepare('INSERT OR REPLACE INTO products (id, name, price, image_url, description) VALUES (?, ?, ?, ?, ?)');
seedProducts.forEach(p => insertProduct.run(p.id, p.name, p.price, p.image_url, p.description));

// Seed a default user for legacy support
const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)');
insertUser.run('bit197', 'Rudraksh Goyal', 'rudraksh@example.com', '1234');

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // API Routes
  app.post("/api/signup", (req, res) => {
    const { userId, name, email, password } = req.body;
    
    try {
      const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User ID already exists" });
      }

      db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(userId, name, email, password);
      res.json({ success: true, user: { id: userId, name, email } });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error during signup" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(username, password);
    
    if (user) {
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email || '' } });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
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
