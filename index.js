import express from "express";
import cors from "cors";
import initSqlJs from "sql.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "data.db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "dist")));

const SQL = await initSqlJs();

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let db;
if (existsSync(DB_PATH)) {
  const buffer = readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

db.run(`
  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    description TEXT,
    image TEXT,
    active INTEGER DEFAULT 0,
    lat REAL,
    lng REAL
  )
`);

const result = db.exec("SELECT COUNT(*) AS count FROM venues");
const count = result.length > 0 ? result[0].values[0][0] : 0;

if (count === 0) {
  const TARGETS = { Restaurant: 150, Café: 80, Theatre: 40, "Fast Food": 50, Bar: 50, Museum: 40, Park: 40, Shopping: 50 };

  const prefixes = [
    "Royal", "Golden", "Silver", "Grand", "Prime", "Fresh", "Tasty", "Spicy", "Sweet", "Crispy",
    "Green", "Blue", "Red", "White", "Black", "Old", "New", "Central", "Northern", "Southern",
    "Eastern", "Western", "Sunny", "Moon", "Star", "City", "Town", "Urban", "Country", "Classic",
    "Modern", "Elite", "Premium", "Superior", "Fine", "Best", "Top", "Alpha", "Omega", "Delta",
    "Cascade", "Royal", "Vernissage", "Aragast", "Ararat", "Moscow", "Paris", "London", "Rome", "Vienna",
    "Berlin", "Madrid", "Cairo", "Tokyo", "Delhi", "Beijing", "Sydney", "Dubai", "Geneva", "Oslo"
  ];

  const suffixes = {
    Restaurant: ["Kitchen", "Grill", "Bistro", "House", "Garden", "Table", "Dining", "Corner", "Place", "Spot", "Restaurant", "Café", "Lounge", "Tavern", "Inn"],
    Café: ["Café", "Coffee", "Brew", "Roast", "House", "Corner", "Spot", "Place", "Lounge", "Bar"],
    Theatre: ["Cinema", "Theatre", "Stage", "Hall", "Screen", "Playhouse", "Studio", "Theater"],
    "Fast Food": ["Burger", "Pizza", "Chicken", "Grill", "Wok", "Bites", "Express", "Kitchen", "Corner", "Spot"],
    Bar: ["Bar", "Pub", "Lounge", "Club", "Tavern", "Inn", "House", "Spot"],
    Museum: ["Museum", "Gallery", "Center", "Hall", "Exhibit", "Collection", "Archive", "Pavilion"],
    Park: ["Park", "Garden", "Grove", "Meadow", "Square", "Plaza", "Green", "Field"],
    Shopping: ["Mall", "Market", "Plaza", "Center", "Square", "Arcade", "Bazaar", "Gallery", "Mart", "Outlet"],
  };

  const streets = [
    "Abovyan Str", "Mashtots Ave", "Tumanyan Str", "Pushkin Str",
    "Saryan Str", "Nalbandyan Str", "Baghramyan Str", "Sayat-Nova Ave",
    "Arshakunyats Ave", "Northern Ave", "Khanjyan Str", "Moskovyan Str",
    "Aram Str", "Paronyan Str", "Isahakyan Str"
  ];

  const images = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
    "https://images.unsplash.com/photo-1531913764164-f85c3e04bb0a?w=400",
    "https://images.unsplash.com/photo-1574936145840-28808b77a0b6?w=400",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
    "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=400",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400",
  ];

  const phones = [
    "+374 10 123456", "+374 10 654321", "+374 10 111222", "+374 10 333444",
    "+374 10 555666", "+374 10 777888", "+374 10 999000", "+374 10 222333",
    "+374 10 444555", "+374 10 666777", "+374 10 888999", "+374 10 101112",
    "+374 10 131415", "+374 10 161718", "+374 10 192021",
  ];

  const coords = [
    [40.1776, 44.5126], [40.1858, 44.5150], [40.1914, 44.5153],
    [40.1850, 44.5140], [40.1921, 44.5193], [40.1802, 44.5090],
    [40.1940, 44.4980], [40.2000, 44.5060], [40.1622, 44.5175],
    [40.1787, 44.5123], [40.1830, 44.5150], [40.1880, 44.5100],
    [40.1805, 44.5060], [40.1820, 44.5130], [40.1795, 44.5100],
    [40.1700, 44.5140], [40.1900, 44.5030], [40.1760, 44.5110],
    [40.1840, 44.5080], [40.1740, 44.5160],
    [40.1860, 44.5010], [40.1780, 44.5180], [40.1930, 44.5080],
    [40.1710, 44.5090], [40.1960, 44.5120], [40.1750, 44.5200],
    [40.1885, 44.4950], [40.1825, 44.5220], [40.1950, 44.5000],
    [40.1690, 44.5150], [40.1875, 44.5180], [40.1730, 44.5070],
    [40.1990, 44.5100], [40.1810, 44.5050], [40.1925, 44.5210],
    [40.1765, 44.5030], [40.1890, 44.5145], [40.1835, 44.5190],
    [40.1720, 44.5105], [40.1970, 44.5040],
  ];

  const descriptions = {
    Restaurant: ["Delicious", "Authentic", "Traditional", "Modern", "Exquisite", "Fine", "Gourmet", "Tasty"],
    Café: ["Cozy", "Charming", "Warm", "Artistic", "Relaxed", "Quaint", "Bohemian", "Intimate"],
    Theatre: ["Captivating", "Exciting", "Cultural", "Classic", "Modern", "Dramatic", "Live", "Spectacular"],
    "Fast Food": ["Quick", "Tasty", "Fresh", "Fast", "Delicious", "Affordable", "Hot", "Crispy"],
    Bar: ["Lively", "Vibrant", "Cozy", "Trendy", "Classic", "Chic", "Relaxed", "Upscale"],
    Museum: ["Fascinating", "Educational", "Historic", "Cultural", "Unique", "Renowned", "Prestigious", "Captivating"],
    Park: ["Peaceful", "Beautiful", "Serene", "Lush", "Scenic", "Tranquil", "Picturesque", "Green"],
    Shopping: ["Vibrant", "Modern", "Popular", "Trendy", "Luxury", "Bustling", "Chic", "Spacious"],
  };

  function generateName(cat, idx) {
    const p = prefixes;
    const s = suffixes[cat];
    const pIdx = idx % p.length;
    const sIdx = Math.floor(idx / p.length) % s.length;
    return `${p[pIdx]} ${s[sIdx]}`;
  }

  let venues = [];
  let ci = 0;

  for (const [cat, target] of Object.entries(TARGETS)) {
    const descList = descriptions[cat];
    const descBase = cat === "Restaurant" ? "restaurant" : cat === "Café" ? "café" : cat.toLowerCase();
    for (let i = 0; i < target; i++) {
      const globalIdx = ci;
      venues.push([
        generateName(cat, i), cat,
        `${globalIdx + 1} ${streets[globalIdx % streets.length]}`,
        `+374 10 ${String(100000 + globalIdx).slice(1)}`,
        `${descList[i % descList.length]} ${descBase} in Yerevan`,
        images[i % images.length],
        0, coords[ci % coords.length][0], coords[ci % coords.length][1],
      ]);
      ci++;
    }
  }

  const activeFlat = [14, 152, 270, 322, 451];
  for (const idx of activeFlat) {
    if (idx < venues.length) venues[idx][6] = 1;
  }

  const stmt = db.prepare(
    "INSERT INTO venues (name, category, address, phone, description, image, active, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const v of venues) {
    stmt.run(v);
  }
  stmt.free();
  saveDb();
}

app.get("/api/venues", (req, res) => {
  const { search, category } = req.query;
  let sql = "SELECT * FROM venues WHERE 1=1";
  const params = [];

  if (search) {
    sql += " AND (name LIKE ? OR description LIKE ? OR address LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  sql += " ORDER BY active DESC, name ASC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  res.json(rows);
});

app.get("/api/venues/nearby", (req, res) => {
  const { lat, lng, limit = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const stmt = db.prepare("SELECT * FROM venues");
  stmt.bind([]);
  const rows = [];
  while (stmt.step()) {
    const v = stmt.getAsObject();
    if (v.lat != null && v.lng != null) {
      v.distance = Math.round(haversineKm(userLat, userLng, v.lat, v.lng) * 100) / 100;
      rows.push(v);
    }
  }
  stmt.free();

  rows.sort((a, b) => b.active - a.active || a.distance - b.distance);
  res.json(rows.slice(0, parseInt(limit)));
});

app.get("/api/categories", (_req, res) => {
  const stmt = db.prepare("SELECT DISTINCT category FROM venues ORDER BY category ASC");
  const categories = [];
  while (stmt.step()) {
    categories.push(stmt.getAsObject().category);
  }
  stmt.free();
  res.json(categories);
});

app.post("/api/venues/:id/activate", (req, res) => {
  const { id } = req.params;
  db.run("UPDATE venues SET active = 1 WHERE id = ?", [id]);
  saveDb();
  const stmt = db.prepare("SELECT * FROM venues WHERE id = ?");
  stmt.bind([id]);
  let venue = null;
  if (stmt.step()) venue = stmt.getAsObject();
  stmt.free();
  res.json(venue);
});

app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
