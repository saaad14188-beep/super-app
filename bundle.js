// deploy-entry.js
import express5 from "express";
import path3 from "path";
import fs3 from "fs";

// src/auth.js
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/db.js
import pg from "pg";

// src/data.js
var APPS = {
  hungerstation: {
    name: "\u0647\u0646\u0642\u0631\u0633\u062A\u064A\u0634\u0646",
    short: "\u0647\u0646\u0642\u0631",
    color: "#FFB400",
    text: "#3b2a00",
    priceFactor: 1,
    baseDelivery: 9,
    serviceFee: 2,
    promo: { type: "percent", value: 0 },
    sub: "\u0647\u0646\u0642\u0631\u0633\u062A\u064A\u0634\u0646 \u0628\u0644\u0633"
  },
  jahez: {
    name: "\u062C\u0627\u0647\u0632",
    short: "\u062C\u0627\u0647\u0632",
    color: "#E2342D",
    text: "#fff",
    priceFactor: 1.03,
    baseDelivery: 7,
    serviceFee: 1.5,
    promo: { type: "amount", value: 10, min: 30, label: "\u062E\u0635\u0645 \u0661\u0660 \u0631.\u0633 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u0648\u0642 \u0663\u0660" },
    sub: "\u062C\u0627\u0647\u0632 \u0628\u0631\u0627\u064A\u0645"
  },
  keeta: {
    name: "\u0643\u064A\u062A\u0627",
    short: "\u0643\u064A\u062A\u0627",
    color: "#FFD100",
    text: "#7a2d00",
    priceFactor: 0.97,
    baseDelivery: 3,
    serviceFee: 0,
    promo: { type: "percent", value: 30, cap: 20, label: "\u062E\u0635\u0645 \u0663\u0660\u066A \u062D\u062A\u0649 \u0662\u0660 \u0631.\u0633 \u2014 \u0639\u0631\u0636 \u0627\u0644\u0625\u0637\u0644\u0627\u0642" },
    sub: null
  },
  toyou: {
    name: "\u062A\u0648 \u064A\u0648",
    short: "ToYou",
    color: "#0FB5AE",
    text: "#fff",
    priceFactor: 1.02,
    baseDelivery: 8,
    serviceFee: 1,
    promo: { type: "amount", value: 5, min: 25, label: "\u062E\u0635\u0645 \u0665 \u0631.\u0633" },
    sub: "ToYou Elite"
  },
  mrsool: {
    name: "\u0645\u0631\u0633\u0648\u0644",
    short: "\u0645\u0631\u0633\u0648\u0644",
    color: "#16A34A",
    text: "#fff",
    priceFactor: 1.05,
    baseDelivery: 14,
    serviceFee: 2.5,
    promo: { type: "percent", value: 0 },
    sub: null
  },
  thechefz: {
    name: "\u0630\u0627 \u0634\u0641\u0632",
    short: "\u0634\u0641\u0632",
    color: "#111827",
    text: "#fff",
    priceFactor: 1.06,
    baseDelivery: 10,
    serviceFee: 2,
    promo: { type: "percent", value: 15, cap: 15, label: "\u062E\u0635\u0645 \u0661\u0665\u066A" },
    sub: null
  }
};
var APPS_ETA = {
  hungerstation: "25\u201335 \u062F",
  jahez: "20\u201330 \u062F",
  keeta: "25\u201340 \u062F",
  toyou: "25\u201335 \u062F",
  mrsool: "30\u201345 \u062F",
  thechefz: "35\u201350 \u062F"
};
var COUPONS = [
  { code: "WELCOME10", type: "percent", value: 10, cap: 15, min_order: 0, active: true, descr: "\u062E\u0635\u0645 \u0661\u0660\u066A \u0639\u0644\u0649 \u0637\u0644\u0628\u0643 (\u062D\u062A\u0649 \u0661\u0665 \u0631.\u0633)" },
  { code: "SAVE5", type: "amount", value: 5, cap: 0, min_order: 30, active: true, descr: "\u062E\u0635\u0645 \u0665 \u0631.\u0633 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u0648\u0642 \u0663\u0660 \u0631.\u0633" },
  { code: "SUPER20", type: "percent", value: 20, cap: 25, min_order: 50, active: true, descr: "\u062E\u0635\u0645 \u0662\u0660\u066A \u0644\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u0648\u0642 \u0665\u0660 \u0631.\u0633 (\u062D\u062A\u0649 \u0662\u0665 \u0631.\u0633)" }
];
var STORES = [
  {
    id: "mcd",
    kind: "food",
    name: "\u0645\u0627\u0643\u062F\u0648\u0646\u0627\u0644\u062F\u0632",
    cat: "\u0628\u0631\u062C\u0631 \xB7 \u0648\u062C\u0628\u0627\u062A \u0633\u0631\u064A\u0639\u0629",
    color: "#DA291C",
    rating: 4.3,
    eta: "15\u201330 \u062F",
    logo: "\u0645\u0627\u0643",
    on: ["hungerstation", "jahez", "keeta", "toyou", "mrsool", "thechefz"],
    menu: [
      { g: "\u0627\u0644\u0648\u062C\u0628\u0627\u062A", items: [
        { id: "bigtasty", n: "\u0648\u062C\u0628\u0629 \u0628\u064A\u062C \u062A\u0627\u064A\u0633\u062A\u064A", d: "\u0628\u064A\u062C \u062A\u0627\u064A\u0633\u062A\u064A + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F354}", p: 34 },
        { id: "bigmac", n: "\u0648\u062C\u0628\u0629 \u0628\u064A\u062C \u0645\u0627\u0643", d: "\u0628\u064A\u062C \u0645\u0627\u0643 + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F354}", p: 27 },
        { id: "mcchicken", n: "\u0648\u062C\u0628\u0629 \u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643", d: "\u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643 + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F357}", p: 29 },
        { id: "nuggets", n: "\u0648\u062C\u0628\u0629 \u0669 \u0642\u0637\u0639 \u0646\u0627\u062C\u062A\u0633", d: "\u0646\u0627\u062C\u062A\u0633 + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F357}", p: 28 }
      ] },
      { g: "\u0625\u0636\u0627\u0641\u0627\u062A", items: [
        { id: "fries", n: "\u0628\u0637\u0627\u0637\u0633 \u0648\u0633\u0637", d: "\u0628\u0637\u0627\u0637\u0633 \u0645\u0642\u0644\u064A\u0629", e: "\u{1F35F}", p: 9 },
        { id: "cola", n: "\u0643\u0648\u0644\u0627", d: "\u0645\u0634\u0631\u0648\u0628 \u063A\u0627\u0632\u064A", e: "\u{1F964}", p: 7 },
        { id: "mcflurry", n: "\u0645\u0627\u0643 \u0641\u0644\u0648\u0631\u064A", d: "\u062D\u0644\u0649 \u0622\u064A\u0633 \u0643\u0631\u064A\u0645", e: "\u{1F366}", p: 12 }
      ] }
    ]
  },
  {
    id: "albaik",
    kind: "food",
    name: "\u0627\u0644\u0628\u064A\u0643",
    cat: "\u062F\u062C\u0627\u062C \xB7 \u0628\u0631\u0648\u0633\u062A\u062F",
    color: "#E30613",
    rating: 4.6,
    eta: "20\u201335 \u062F",
    logo: "\u0627\u0644\u0628\u064A\u0643",
    on: ["hungerstation", "jahez", "keeta", "toyou"],
    menu: [
      { g: "\u0627\u0644\u0648\u062C\u0628\u0627\u062A", items: [
        { id: "broast4", n: "\u0648\u062C\u0628\u0629 \u0628\u0631\u0648\u0633\u062A\u062F \u0664 \u0642\u0637\u0639", d: "\u062F\u062C\u0627\u062C + \u0628\u0637\u0627\u0637\u0633 + \u062E\u0628\u0632 + \u0635\u0648\u0635", e: "\u{1F357}", p: 16 },
        { id: "fillet", n: "\u0648\u062C\u0628\u0629 \u0641\u064A\u0644\u064A\u0647", d: "\u0665 \u0642\u0637\u0639 \u0641\u064A\u0644\u064A\u0647 + \u0628\u0637\u0627\u0637\u0633 + \u0635\u0648\u0635", e: "\u{1F357}", p: 18 },
        { id: "nuggetsb", n: "\u0648\u062C\u0628\u0629 \u0646\u0627\u062C\u062A\u0633", d: "\u0646\u0627\u062C\u062A\u0633 + \u0628\u0637\u0627\u0637\u0633", e: "\u{1F357}", p: 12 }
      ] },
      { g: "\u0625\u0636\u0627\u0641\u0627\u062A", items: [
        { id: "friesb", n: "\u0628\u0637\u0627\u0637\u0633", d: "\u0628\u0637\u0627\u0637\u0633 \u0645\u0642\u0644\u064A\u0629", e: "\u{1F35F}", p: 6 },
        { id: "garlic", n: "\u0635\u0648\u0635 \u062B\u0648\u0645", d: "\u0635\u0648\u0635 \u0625\u0636\u0627\u0641\u064A", e: "\u{1F9C4}", p: 2 }
      ] }
    ]
  },
  {
    id: "kudu",
    kind: "food",
    name: "\u0643\u0648\u062F\u0648",
    cat: "\u0633\u0627\u0646\u062F\u0648\u064A\u062A\u0634 \xB7 \u0648\u062C\u0628\u0627\u062A \u0633\u0631\u064A\u0639\u0629",
    color: "#F2B800",
    rating: 4.1,
    eta: "20\u201330 \u062F",
    logo: "\u0643\u0648\u062F\u0648",
    on: ["hungerstation", "jahez", "mrsool", "thechefz"],
    menu: [
      { g: "\u0627\u0644\u0648\u062C\u0628\u0627\u062A", items: [
        { id: "spicy", n: "\u0648\u062C\u0628\u0629 \u0633\u0628\u0627\u064A\u0633\u064A", d: "\u0628\u0631\u062C\u0631 \u062D\u0627\u0631 + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F336}\uFE0F", p: 25 },
        { id: "fajita", n: "\u0648\u062C\u0628\u0629 \u0641\u0627\u0647\u064A\u062A\u0627", d: "\u0641\u0627\u0647\u064A\u062A\u0627 \u062F\u062C\u0627\u062C + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F32F}", p: 19 },
        { id: "fish", n: "\u0648\u062C\u0628\u0629 \u0641\u064A\u0634", d: "\u0641\u064A\u0644\u064A\u0647 \u0633\u0645\u0643 + \u0628\u0637\u0627\u0637\u0633 + \u0645\u0634\u0631\u0648\u0628", e: "\u{1F41F}", p: 22 }
      ] },
      { g: "\u0625\u0636\u0627\u0641\u0627\u062A", items: [
        { id: "friesk", n: "\u0628\u0637\u0627\u0637\u0633 \u0643\u0628\u064A\u0631", d: "\u0628\u0637\u0627\u0637\u0633 \u0645\u0642\u0644\u064A\u0629", e: "\u{1F35F}", p: 8 },
        { id: "pie", n: "\u0641\u0637\u064A\u0631\u0629 \u062A\u0641\u0627\u062D", d: "\u062D\u0644\u0649", e: "\u{1F967}", p: 6 }
      ] }
    ]
  },
  {
    id: "panda",
    kind: "grocery",
    name: "\u0628\u0646\u062F\u0647",
    cat: "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \xB7 \u0645\u0642\u0627\u0636\u064A",
    color: "#00833E",
    rating: 4.2,
    eta: "30\u201350 \u062F",
    logo: "\u0628\u0646\u062F\u0647",
    on: ["hungerstation", "jahez", "keeta", "toyou"],
    menu: [
      { g: "\u0623\u0633\u0627\u0633\u064A\u0627\u062A", items: [
        { id: "water", n: "\u0645\u0627\u0621 \u0646\u0642\u064A \u0664\u0660 \u0639\u0628\u0648\u0629", d: "\u0662\u0660\u0660 \u0645\u0644 \xD7 \u0664\u0660", e: "\u{1F4A7}", p: 12 },
        { id: "milk", n: "\u062D\u0644\u064A\u0628 \u0627\u0644\u0645\u0631\u0627\u0639\u064A \u0662 \u0644\u062A\u0631", d: "\u0637\u0627\u0632\u062C \u0643\u0627\u0645\u0644 \u0627\u0644\u062F\u0633\u0645", e: "\u{1F95B}", p: 11 },
        { id: "eggs", n: "\u0628\u064A\u0636 \u0663\u0660 \u062D\u0628\u0629", d: "\u0628\u064A\u0636 \u0637\u0627\u0632\u062C", e: "\u{1F95A}", p: 17 },
        { id: "bread", n: "\u062E\u0628\u0632 \u062A\u0648\u0633\u062A", d: "\u0631\u063A\u064A\u0641 \u0643\u0628\u064A\u0631", e: "\u{1F35E}", p: 6 },
        { id: "rice", n: "\u0623\u0631\u0632 \u0628\u0634\u0627\u0648\u0631 \u0665 \u0643\u062C\u0645", d: "\u062D\u0628\u0629 \u0637\u0648\u064A\u0644\u0629", e: "\u{1F35A}", p: 39 }
      ] },
      { g: "\u062E\u0636\u0627\u0631 \u0648\u0641\u0648\u0627\u0643\u0647", items: [
        { id: "tomato", n: "\u0637\u0645\u0627\u0637\u0645 \u0661 \u0643\u062C\u0645", d: "\u0637\u0627\u0632\u062C", e: "\u{1F345}", p: 6 },
        { id: "banana", n: "\u0645\u0648\u0632 \u0661 \u0643\u062C\u0645", d: "\u0645\u0633\u062A\u0648\u0631\u062F", e: "\u{1F34C}", p: 8 },
        { id: "chicken", n: "\u062F\u062C\u0627\u062C \u0637\u0627\u0632\u062C \u0661 \u0643\u062C\u0645", d: "\u0635\u062F\u0648\u0631 \u062F\u062C\u0627\u062C", e: "\u{1F357}", p: 24 }
      ] }
    ]
  },
  {
    id: "tamimi",
    kind: "grocery",
    name: "\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u062A\u0645\u064A\u0645\u064A",
    cat: "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \xB7 \u0645\u0642\u0627\u0636\u064A",
    color: "#003B7E",
    rating: 4.3,
    eta: "35\u201355 \u062F",
    logo: "\u0627\u0644\u062A\u0645\u064A\u0645\u064A",
    on: ["hungerstation", "jahez", "toyou", "mrsool"],
    menu: [
      { g: "\u0623\u0633\u0627\u0633\u064A\u0627\u062A", items: [
        { id: "waterT", n: "\u0645\u0627\u0621 \u0635\u0627\u0641\u064A \u0664\u0660 \u0639\u0628\u0648\u0629", d: "\u0662\u0660\u0660 \u0645\u0644 \xD7 \u0664\u0660", e: "\u{1F4A7}", p: 13 },
        { id: "milkT", n: "\u062D\u0644\u064A\u0628 \u0646\u0627\u062F\u0643 \u0662 \u0644\u062A\u0631", d: "\u0637\u0627\u0632\u062C", e: "\u{1F95B}", p: 12 },
        { id: "eggsT", n: "\u0628\u064A\u0636 \u0663\u0660 \u062D\u0628\u0629", d: "\u0628\u064A\u0636 \u0628\u0644\u062F\u064A", e: "\u{1F95A}", p: 18 },
        { id: "oil", n: "\u0632\u064A\u062A \u062F\u0648\u0627\u0631 \u0627\u0644\u0634\u0645\u0633 \u0661.\u0668 \u0644\u062A\u0631", d: "\u0644\u0644\u0637\u0628\u062E", e: "\u{1FAD2}", p: 21 },
        { id: "sugar", n: "\u0633\u0643\u0631 \u0662 \u0643\u062C\u0645", d: "\u0623\u0628\u064A\u0636", e: "\u{1F9C2}", p: 9 }
      ] },
      { g: "\u0645\u0639\u0644\u0628\u0627\u062A", items: [
        { id: "tuna", n: "\u062A\u0648\u0646\u0629 \u0664 \u0639\u0644\u0628", d: "\u0628\u0627\u0644\u0632\u064A\u062A", e: "\u{1F41F}", p: 16 },
        { id: "pasta", n: "\u0645\u0639\u0643\u0631\u0648\u0646\u0629 \u0665\u0660\u0660 \u062C\u0645", d: "\u0625\u064A\u0637\u0627\u0644\u064A\u0629", e: "\u{1F35D}", p: 5 }
      ] }
    ]
  }
];

// src/db.js
var pool;
function getPool() {
  if (!pool) {
    const cs = process.env.DATABASE_URL;
    pool = new pg.Pool({
      connectionString: cs,
      ssl: cs && !/localhost|127\.0\.0\.1/.test(cs) ? { rejectUnauthorized: false } : false,
      max: 5
    });
  }
  return pool;
}
var q = (text, params) => getPool().query(text, params);
async function init() {
  await q(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, verified BOOLEAN DEFAULT false, is_admin BOOLEAN DEFAULT false,
    address TEXT DEFAULT '\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636', created_at TIMESTAMPTZ DEFAULT now(),
    code_hash TEXT, code_exp BIGINT, code_purpose TEXT, code_attempts INT DEFAULT 0)`);
  await q(`CREATE TABLE IF NOT EXISTS favorites(
    user_id INT REFERENCES users(id) ON DELETE CASCADE, store_id TEXT, PRIMARY KEY(user_id, store_id))`);
  await q(`CREATE TABLE IF NOT EXISTS restaurants(
    id TEXT PRIMARY KEY, kind TEXT, name TEXT, cat TEXT, color TEXT, rating NUMERIC,
    eta TEXT, logo TEXT, apps JSONB, active BOOLEAN DEFAULT true, sort INT DEFAULT 0)`);
  await q(`CREATE TABLE IF NOT EXISTS menu_items(
    id SERIAL PRIMARY KEY, restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
    grp TEXT, item_key TEXT, name TEXT, descr TEXT, emoji TEXT, price NUMERIC, sort INT DEFAULT 0)`);
  await q(`CREATE TABLE IF NOT EXISTS coupons(
    code TEXT PRIMARY KEY, type TEXT, value NUMERIC, cap NUMERIC DEFAULT 0,
    min_order NUMERIC DEFAULT 0, active BOOLEAN DEFAULT true, descr TEXT)`);
  await q(`CREATE TABLE IF NOT EXISTS orders(
    id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id TEXT, restaurant_name TEXT, app_id TEXT, app_name TEXT,
    items JSONB, subtotal NUMERIC, delivery NUMERIC, service NUMERIC, discount NUMERIC,
    total NUMERIC, coupon TEXT, address TEXT, status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS order_events(
    id SERIAL PRIMARY KEY, order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT, at TIMESTAMPTZ DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS reviews(
    id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id TEXT, order_id INT, rating INT, comment TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS notifications(
    id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
    text TEXT, icon TEXT DEFAULT '\u{1F514}', read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())`);
  await seed();
}
async function seed() {
  const { rows } = await q(`SELECT COUNT(*)::int AS c FROM restaurants`);
  if (rows[0].c === 0) {
    for (let i = 0; i < STORES.length; i++) {
      const s = STORES[i];
      await q(
        `INSERT INTO restaurants(id,kind,name,cat,color,rating,eta,logo,apps,active,sort)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.kind, s.name, s.cat, s.color, s.rating, s.eta, s.logo, JSON.stringify(s.on), i]
      );
      let order = 0;
      for (const g of s.menu) for (const it of g.items) {
        await q(`INSERT INTO menu_items(restaurant_id,grp,item_key,name,descr,emoji,price,sort)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [s.id, g.g, it.id, it.n, it.d, it.e, it.p, order++]);
      }
    }
  }
  const c = await q(`SELECT COUNT(*)::int AS c FROM coupons`);
  if (c.rows[0].c === 0) {
    for (const cp of COUPONS) {
      await q(
        `INSERT INTO coupons(code,type,value,cap,min_order,active,descr)
        VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (code) DO NOTHING`,
        [cp.code, cp.type, cp.value, cp.cap, cp.min_order, cp.active, cp.descr]
      );
    }
  }
}
var num = (v) => v == null ? v : Number(v);
async function getByEmail(email) {
  const { rows } = await q(`SELECT * FROM users WHERE email=$1`, [String(email || "").toLowerCase()]);
  return rows[0] ? mapUser(rows[0]) : null;
}
async function getById(id) {
  const { rows } = await q(`SELECT * FROM users WHERE id=$1`, [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}
function mapUser(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    verified: r.verified,
    isAdmin: r.is_admin,
    address: r.address,
    createdAt: r.created_at,
    codeHash: r.code_hash,
    codeExp: num(r.code_exp),
    codePurpose: r.code_purpose,
    codeAttempts: r.code_attempts
  };
}
async function userCount() {
  const { rows } = await q(`SELECT COUNT(*)::int AS c FROM users`);
  return rows[0].c;
}
async function listUsers() {
  const { rows } = await q(`SELECT * FROM users ORDER BY id`);
  return rows.map(mapUser);
}
async function createUser(u) {
  const { rows } = await q(
    `INSERT INTO users(name,email,password,verified,is_admin,address,code_hash,code_exp,code_purpose,code_attempts)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      u.name,
      u.email,
      u.password,
      !!u.verified,
      !!u.isAdmin,
      u.address || "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636",
      u.codeHash || null,
      u.codeExp || null,
      u.codePurpose || null,
      u.codeAttempts || 0
    ]
  );
  return mapUser(rows[0]);
}
async function updateUser(id, patch) {
  const map = {
    name: "name",
    address: "address",
    verified: "verified",
    isAdmin: "is_admin",
    password: "password",
    codeHash: "code_hash",
    codeExp: "code_exp",
    codePurpose: "code_purpose",
    codeAttempts: "code_attempts"
  };
  const sets = [], vals = [];
  let i = 1;
  for (const [k, col] of Object.entries(map)) if (k in patch) {
    sets.push(`${col}=$${i++}`);
    vals.push(patch[k]);
  }
  if (!sets.length) return getById(id);
  vals.push(id);
  const { rows } = await q(`UPDATE users SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals);
  return rows[0] ? mapUser(rows[0]) : null;
}
async function deleteUser(id) {
  await q(`DELETE FROM users WHERE id=$1`, [id]);
  return true;
}
async function getFavorites(uid) {
  const { rows } = await q(`SELECT store_id FROM favorites WHERE user_id=$1`, [uid]);
  return rows.map((r) => r.store_id);
}
async function toggleFavorite(uid, storeId) {
  const ex = await q(`SELECT 1 FROM favorites WHERE user_id=$1 AND store_id=$2`, [uid, storeId]);
  if (ex.rows.length) await q(`DELETE FROM favorites WHERE user_id=$1 AND store_id=$2`, [uid, storeId]);
  else await q(`INSERT INTO favorites(user_id,store_id) VALUES($1,$2)`, [uid, storeId]);
  return getFavorites(uid);
}
function mapStore(r) {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    cat: r.cat,
    color: r.color,
    rating: num(r.rating),
    eta: r.eta,
    logo: r.logo,
    on: Array.isArray(r.apps) ? r.apps : r.apps || [],
    active: r.active
  };
}
async function listRestaurants(includeInactive = false) {
  const { rows } = await q(`SELECT * FROM restaurants ${includeInactive ? "" : "WHERE active=true"} ORDER BY sort, name`);
  return rows.map(mapStore);
}
async function getRestaurant(id) {
  const { rows } = await q(`SELECT * FROM restaurants WHERE id=$1`, [id]);
  if (!rows[0]) return null;
  const s = mapStore(rows[0]);
  const m = await q(`SELECT * FROM menu_items WHERE restaurant_id=$1 ORDER BY sort, id`, [id]);
  const groups = {};
  for (const it of m.rows) {
    (groups[it.grp] = groups[it.grp] || []).push({ id: it.item_key, n: it.name, d: it.descr, e: it.emoji, p: num(it.price) });
  }
  s.menu = Object.entries(groups).map(([g, items]) => ({ g, items }));
  return s;
}
async function createRestaurant(s) {
  await q(
    `INSERT INTO restaurants(id,kind,name,cat,color,rating,eta,logo,apps,active,sort)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,0)`,
    [s.id, s.kind, s.name, s.cat, s.color || "#6D28D9", s.rating || 4.5, s.eta || "20\u201335 \u062F", s.logo || s.name.slice(0, 4), JSON.stringify(s.on || ["hungerstation", "jahez", "keeta", "toyou"])]
  );
  return getRestaurant(s.id);
}
async function updateRestaurant(id, patch) {
  const map = { name: "name", cat: "cat", kind: "kind", color: "color", rating: "rating", eta: "eta", logo: "logo", active: "active" };
  const sets = [], vals = [];
  let i = 1;
  for (const [k, col] of Object.entries(map)) if (k in patch) {
    sets.push(`${col}=$${i++}`);
    vals.push(patch[k]);
  }
  if (sets.length) {
    vals.push(id);
    await q(`UPDATE restaurants SET ${sets.join(",")} WHERE id=$${i}`, vals);
  }
  return getRestaurant(id);
}
async function deleteRestaurant(id) {
  await q(`DELETE FROM restaurants WHERE id=$1`, [id]);
  return true;
}
async function addMenuItem(rid, it) {
  await q(`INSERT INTO menu_items(restaurant_id,grp,item_key,name,descr,emoji,price,sort)
    VALUES($1,$2,$3,$4,$5,$6,$7,0)`, [rid, it.g || "\u0627\u0644\u0623\u0635\u0646\u0627\u0641", it.id || "it" + Date.now(), it.n, it.d || "", it.e || "\u{1F37D}\uFE0F", it.p]);
}
async function deleteMenuItem(rid, itemKey) {
  await q(`DELETE FROM menu_items WHERE restaurant_id=$1 AND item_key=$2`, [rid, itemKey]);
}
function mapCoupon(r) {
  return { code: r.code, type: r.type, value: num(r.value), cap: num(r.cap), min_order: num(r.min_order), active: r.active, descr: r.descr };
}
async function listCoupons() {
  const { rows } = await q(`SELECT * FROM coupons ORDER BY code`);
  return rows.map(mapCoupon);
}
async function getCoupon(code) {
  const { rows } = await q(`SELECT * FROM coupons WHERE code=$1`, [String(code || "").toUpperCase()]);
  return rows[0] ? mapCoupon(rows[0]) : null;
}
async function upsertCoupon(c) {
  await q(
    `INSERT INTO coupons(code,type,value,cap,min_order,active,descr) VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (code) DO UPDATE SET type=$2,value=$3,cap=$4,min_order=$5,active=$6,descr=$7`,
    [String(c.code).toUpperCase(), c.type, c.value, c.cap || 0, c.min_order || 0, c.active !== false, c.descr || ""]
  );
  return getCoupon(c.code);
}
async function deleteCoupon(code) {
  await q(`DELETE FROM coupons WHERE code=$1`, [String(code).toUpperCase()]);
  return true;
}
function mapOrder(r) {
  return {
    id: r.id,
    userId: r.user_id,
    restaurantId: r.restaurant_id,
    restaurantName: r.restaurant_name,
    appId: r.app_id,
    appName: r.app_name,
    items: r.items,
    subtotal: num(r.subtotal),
    delivery: num(r.delivery),
    service: num(r.service),
    discount: num(r.discount),
    total: num(r.total),
    coupon: r.coupon,
    address: r.address,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userName: r.user_name,
    userEmail: r.user_email
  };
}
async function createOrder(o) {
  const { rows } = await q(
    `INSERT INTO orders(user_id,restaurant_id,restaurant_name,app_id,app_name,items,subtotal,delivery,service,discount,total,coupon,address,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending') RETURNING *`,
    [o.userId, o.restaurantId, o.restaurantName, o.appId, o.appName, JSON.stringify(o.items), o.subtotal, o.delivery, o.service, o.discount, o.total, o.coupon || null, o.address]
  );
  await q(`INSERT INTO order_events(order_id,status) VALUES($1,'pending')`, [rows[0].id]);
  return mapOrder(rows[0]);
}
async function listOrdersByUser(uid) {
  const { rows } = await q(`SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC`, [uid]);
  return rows.map(mapOrder);
}
async function getOrder(id) {
  const { rows } = await q(`SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE o.id=$1`, [id]);
  if (!rows[0]) return null;
  const o = mapOrder(rows[0]);
  const ev = await q(`SELECT status, at FROM order_events WHERE order_id=$1 ORDER BY id`, [id]);
  o.events = ev.rows.map((e) => ({ status: e.status, at: e.at }));
  return o;
}
async function listAllOrders(limit = 200) {
  const { rows } = await q(`SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT $1`, [limit]);
  return rows.map(mapOrder);
}
async function updateOrderStatus(id, status) {
  await q(`UPDATE orders SET status=$1, updated_at=now() WHERE id=$2`, [status, id]);
  await q(`INSERT INTO order_events(order_id,status) VALUES($1,$2)`, [id, status]);
  return getOrder(id);
}
async function addReview(rv) {
  const { rows } = await q(
    `INSERT INTO reviews(user_id,restaurant_id,order_id,rating,comment) VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [rv.userId, rv.restaurantId, rv.orderId || null, rv.rating, rv.comment || ""]
  );
  return rows[0];
}
async function reviewsByRestaurant(rid) {
  const { rows } = await q(`SELECT r.rating, r.comment, r.created_at, u.name AS user_name FROM reviews r LEFT JOIN users u ON u.id=r.user_id WHERE restaurant_id=$1 ORDER BY r.id DESC LIMIT 50`, [rid]);
  return rows.map((r) => ({ rating: r.rating, comment: r.comment, at: r.created_at, user: r.user_name }));
}
async function ratingStats(rid) {
  const { rows } = await q(`SELECT COUNT(*)::int AS n, COALESCE(AVG(rating),0)::numeric(3,1) AS avg FROM reviews WHERE restaurant_id=$1`, [rid]);
  return { count: rows[0].n, avg: num(rows[0].avg) };
}
async function userReviewedOrder(uid, orderId) {
  const { rows } = await q(`SELECT 1 FROM reviews WHERE user_id=$1 AND order_id=$2`, [uid, orderId]);
  return rows.length > 0;
}
async function addNotification(uid, text, icon = "\u{1F514}") {
  await q(`INSERT INTO notifications(user_id,text,icon) VALUES($1,$2,$3)`, [uid, text, icon]);
}
async function listNotifications(uid) {
  const { rows } = await q(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY id DESC LIMIT 50`, [uid]);
  return rows;
}
async function unreadCount(uid) {
  const { rows } = await q(`SELECT COUNT(*)::int AS c FROM notifications WHERE user_id=$1 AND read=false`, [uid]);
  return rows[0].c;
}
async function markNotificationsRead(uid) {
  await q(`UPDATE notifications SET read=true WHERE user_id=$1`, [uid]);
}
async function wipeUserData() {
  await q(`TRUNCATE users RESTART IDENTITY CASCADE`);
}

// src/auth.js
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var SECRET = process.env.SESSION_SECRET || loadOrCreateSecret();
function loadOrCreateSecret() {
  const f = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "secret.key");
  try {
    return fs.readFileSync(f, "utf8");
  } catch {
    const s = crypto.randomBytes(32).toString("hex");
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, s);
    return s;
  }
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  const a = Buffer.from(h), b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
var genCode = () => String(crypto.randomInt(0, 1e6)).padStart(6, "0");
var hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");
var b64u = (s) => Buffer.from(s).toString("base64url");
var ub64u = (s) => Buffer.from(s, "base64url").toString();
function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const exp = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try {
    const p = JSON.parse(ub64u(body));
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}
var COOKIE = "sa_session";
var WEEK = 1e3 * 60 * 60 * 24 * 7;
function setSession(res, uid) {
  const token = signToken({ uid, exp: Date.now() + WEEK });
  const secure = process.env.COOKIE_SECURE === "true" ? " Secure;" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${WEEK / 1e3}; SameSite=Lax;${secure}`);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
async function authMiddleware(req, res, next) {
  try {
    const t = parseCookies(req)[COOKIE];
    const p = t ? verifyToken(t) : null;
    req.user = p ? await getById(p.uid) : null;
  } catch (e) {
    req.user = null;
  }
  next();
}
var requireVerified = (req, res, next) => !req.user ? res.status(401).json({ error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" }) : !req.user.verified ? res.status(403).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0641\u0639\u0651\u0644" }) : next();
var requireAdmin = (req, res, next) => req.user && req.user.isAdmin ? next() : res.status(403).json({ error: "\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u062F\u064A\u0631 \u0645\u0637\u0644\u0648\u0628\u0629" });
function publicUser(u) {
  if (!u) return null;
  const { password, codeHash, codeExp, codePurpose, codeAttempts, ...safe } = u;
  return safe;
}

// src/routes/auth.routes.js
import express from "express";

// src/mailer.js
var SMTP = process.env.SMTP_HOST;
var mailMode = () => SMTP ? "smtp" : "dev";
async function sendMail({ to, subject, text }) {
  if (!SMTP) {
    console.log(`
\u{1F4E7} [\u0628\u0631\u064A\u062F \u062A\u062C\u0631\u064A\u0628\u064A] \u0625\u0644\u0649: ${to}
   \u0627\u0644\u0645\u0648\u0636\u0648\u0639: ${subject}
   ${text}
`);
    return { dev: true };
  }
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    host: SMTP,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : void 0
  });
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
  return { dev: false };
}
async function sendCode(to, code, purpose) {
  const subject = purpose === "reset" ? "\u0631\u0645\u0632 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u2014 \u0633\u0648\u0628\u0631 \u0622\u0628" : "\u0631\u0645\u0632 \u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u2014 \u0633\u0648\u0628\u0631 \u0622\u0628";
  const text = `\u0645\u0631\u062D\u0628\u064B\u0627 \u{1F44B}
\u0631\u0645\u0632\u0643 \u0647\u0648: ${code}
\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 \u0661\u0665 \u062F\u0642\u064A\u0642\u0629.

\u0625\u0646 \u0644\u0645 \u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0641\u062A\u062C\u0627\u0647\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629.`;
  return sendMail({ to, subject, text });
}

// src/routes/auth.routes.js
var router = express.Router();
var CODE_TTL = 15 * 60 * 1e3;
var emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
var norm = (e) => String(e || "").trim().toLowerCase();
router.post("/register", async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const email = norm(req.body?.email);
    const password = req.body?.password || "";
    if (!name) return res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
    if (!emailOk(email)) return res.status(400).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    if (password.length < 8) return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0668 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    if (await getByEmail(email)) return res.status(409).json({ error: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0633\u062C\u0651\u0644 \u0645\u0633\u0628\u0642\u064B\u0627" });
    const code = genCode();
    const isAdmin = await userCount() === 0 || email === norm(process.env.ADMIN_EMAIL);
    await createUser({
      name,
      email,
      password: hashPassword(password),
      verified: false,
      isAdmin,
      codeHash: hashCode(code),
      codeExp: Date.now() + CODE_TTL,
      codePurpose: "verify",
      codeAttempts: 0
    });
    const m = await sendCode(email, code, "verify");
    res.json({ ok: true, email, mode: mailMode(), devCode: m.dev ? code : void 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628" });
  }
});
router.post("/verify", async (req, res) => {
  try {
    const email = norm(req.body?.email);
    const code = req.body?.code || "";
    const u = await getByEmail(email);
    if (!u) return res.status(404).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    if (u.verified) {
      setSession(res, u.id);
      return res.json({ ok: true, user: publicUser(u) });
    }
    if (!u.codeHash || u.codePurpose !== "verify" || Date.now() > u.codeExp) return res.status(400).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632\u060C \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u064B\u0627 \u062C\u062F\u064A\u062F\u064B\u0627" });
    if ((u.codeAttempts || 0) >= 5) return res.status(429).json({ error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629\u060C \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u064B\u0627 \u062C\u062F\u064A\u062F\u064B\u0627" });
    if (hashCode(code) !== u.codeHash) {
      await updateUser(u.id, { codeAttempts: (u.codeAttempts || 0) + 1 });
      return res.status(400).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    }
    await updateUser(u.id, { verified: true, codeHash: null, codeExp: null, codePurpose: null, codeAttempts: 0 });
    await addNotification(u.id, "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643 \u0641\u064A \u0633\u0648\u0628\u0631 \u0622\u0628 \u{1F389}", "\u{1F44B}");
    setSession(res, u.id);
    res.json({ ok: true, user: publicUser(await getById(u.id)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u0641\u0639\u064A\u0644" });
  }
});
router.post("/resend", async (req, res) => {
  try {
    const email = norm(req.body?.email);
    const u = await getByEmail(email);
    if (!u) return res.status(404).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    if (u.verified) return res.status(400).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0641\u0639\u0651\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" });
    const code = genCode();
    await updateUser(u.id, { codeHash: hashCode(code), codeExp: Date.now() + CODE_TTL, codePurpose: "verify", codeAttempts: 0 });
    const m = await sendCode(email, code, "verify");
    res.json({ ok: true, devCode: m.dev ? code : void 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062E\u0637\u0623" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const email = norm(req.body?.email);
    const u = await getByEmail(email);
    if (!u || !verifyPassword(req.body?.password || "", u.password)) return res.status(401).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    if (!u.verified) return res.status(403).json({ error: "\u0641\u0639\u0651\u0644 \u062D\u0633\u0627\u0628\u0643 \u0623\u0648\u0644\u064B\u0627", needVerify: true, email });
    setSession(res, u.id);
    res.json({ ok: true, user: publicUser(u) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
});
router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});
router.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));
router.post("/forgot", async (req, res) => {
  try {
    const email = norm(req.body?.email);
    const u = await getByEmail(email);
    if (u) {
      const code = genCode();
      await updateUser(u.id, { codeHash: hashCode(code), codeExp: Date.now() + CODE_TTL, codePurpose: "reset", codeAttempts: 0 });
      const m = await sendCode(email, code, "reset");
      return res.json({ ok: true, devCode: m.dev ? code : void 0 });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062E\u0637\u0623" });
  }
});
router.post("/reset", async (req, res) => {
  try {
    const email = norm(req.body?.email);
    const code = req.body?.code || "";
    const password = req.body?.password || "";
    const u = await getByEmail(email);
    if (!u) return res.status(400).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646" });
    if (!u.codeHash || u.codePurpose !== "reset" || Date.now() > u.codeExp) return res.status(400).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632" });
    if ((u.codeAttempts || 0) >= 5) return res.status(429).json({ error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629" });
    if (hashCode(code) !== u.codeHash) {
      await updateUser(u.id, { codeAttempts: (u.codeAttempts || 0) + 1 });
      return res.status(400).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    }
    if (password.length < 8) return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0668 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    await updateUser(u.id, { password: hashPassword(password), verified: true, codeHash: null, codeExp: null, codePurpose: null, codeAttempts: 0 });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062E\u0637\u0623" });
  }
});
var auth_routes_default = router;

// src/routes/app.routes.js
import express2 from "express";

// src/compare.js
var round2 = (n) => Math.round(n * 100) / 100;
function flatItems(store) {
  return store.menu.flatMap((g) => g.items);
}
function cartSubtotal(store, cart) {
  const items = flatItems(store);
  return Object.entries(cart || {}).reduce((sum, [id, q2]) => {
    const it = items.find((i) => i.id === id);
    return sum + (it ? it.p * q2 : 0);
  }, 0);
}
function computeOffers(store, cart = {}, subs = {}) {
  const base = cartSubtotal(store, cart);
  const offers = store.on.map((appId) => {
    const a = APPS[appId];
    const subtotal = Math.round(base * a.priceFactor);
    let delivery = a.baseDelivery;
    const subActive = !!(a.sub && subs[appId]);
    if (subActive) delivery = 0;
    const service = a.serviceFee;
    let discount = 0, promoLabel = a.promo.label || "";
    if (a.promo.type === "percent" && a.promo.value > 0) {
      discount = subtotal * a.promo.value / 100;
      if (a.promo.cap) discount = Math.min(discount, a.promo.cap);
    } else if (a.promo.type === "amount" && a.promo.value > 0) {
      if (!a.promo.min || subtotal >= a.promo.min) discount = a.promo.value;
      else promoLabel = "\u0623\u0636\u0641 " + round2(a.promo.min - subtotal) + " \u0631.\u0633 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062E\u0635\u0645";
    }
    discount = round2(discount);
    const total = Math.max(0, subtotal + delivery + service - discount);
    return {
      appId,
      app: { name: a.name, short: a.short, color: a.color, text: a.text, sub: a.sub },
      subtotal,
      delivery,
      service,
      discount,
      total,
      promoLabel,
      freeDel: subActive,
      eta: APPS_ETA[appId] || store.eta
    };
  });
  offers.sort((x, y) => x.total - y.total);
  const best = offers[0], worst = offers[offers.length - 1];
  return {
    offers,
    bestAppId: best ? best.appId : null,
    saving: best && worst ? round2(worst.total - best.total) : 0,
    subtotalBase: base
  };
}

// src/live/hungerstation.js
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var CACHE = path2.join(process.env.DATA_DIR || path2.join(process.cwd(), "data"), "live-data.json");
var SCRAPE = {
  source: "\u0647\u0646\u0642\u0631\u0633\u062A\u064A\u0634\u0646",
  location: "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636",
  stores: [
    {
      id: "mcd",
      app: "hungerstation",
      url: "https://hungerstation.com/sa-ar/restaurant/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6/%D8%A7%D9%84%D9%85%D9%88%D9%86%D8%B3%D9%8A%D8%A9/3792",
      etaText: "15\u201330 \u062F",
      itemMap: {
        "\u0648\u062C\u0628\u0629 \u0628\u064A\u062C \u062A\u0627\u064A\u0633\u062A\u064A": "bigtasty",
        "\u0648\u062C\u0628\u0629 \u0628\u064A\u062C \u0645\u0627\u0643": "bigmac",
        "\u0648\u062C\u0628\u0647 \u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643": "mcchicken",
        "\u0648\u062C\u0628\u0629 \u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643": "mcchicken",
        "\u0648\u062C\u0628\u0629 9 \u0642\u0637\u0639 \u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643 \u0646\u0627\u062C\u062A\u0633": "nuggets",
        "\u0648\u062C\u0628\u0629 \u0669 \u0642\u0637\u0639 \u062A\u0634\u064A\u0643\u0646 \u0645\u0627\u0643 \u0646\u0627\u062C\u062A\u0633": "nuggets",
        "\u0628\u0637\u0627\u0637\u0633": "fries",
        "\u0643\u0648\u0644\u0627": "cola",
        "\u0645\u0627\u0643 \u0641\u0644\u0648\u0631\u064A": "mcflurry"
      }
    }
  ]
};
function loadLive() {
  try {
    return JSON.parse(fs2.readFileSync(CACHE, "utf8"));
  } catch {
    return null;
  }
}
function saveLive(data) {
  fs2.mkdirSync(path2.dirname(CACHE), { recursive: true });
  fs2.writeFileSync(CACHE, JSON.stringify(data, null, 2), "utf8");
}
function mergeLive(store, live) {
  if (!live || !live.stores || !live.stores[store.id]) return store;
  const sd = live.stores[store.id];
  const s = structuredClone(store);
  s.live = true;
  s.liveApp = sd.app;
  s.liveAt = live.fetchedAt;
  s.liveSource = live.source;
  if (sd.etaText) s.eta = sd.etaText;
  (s.menu || []).forEach((g) => g.items.forEach((it) => {
    if (sd.items && sd.items[it.id] != null) {
      it.p = sd.items[it.id];
      it.live = true;
    }
  }));
  return s;
}
var toEnDigits = (s) => s.replace(/[٠-٩]/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d));
function parseMenu(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const priceRe = /^([\d٠-٩]+(?:[.,][\d٠-٩]+)?)\s*ر\.?\s*س/;
  const isCal = (l) => /(^|\s)Cal(\s|$)/i.test(l) || /^[\d٠-٩]+\s*Cal/i.test(l) || /Cal\.?$/i.test(l);
  const pairs = {};
  for (let i = 0; i < lines.length; i++) {
    const m = toEnDigits(lines[i]).match(priceRe);
    if (!m) continue;
    const price = parseFloat(m[1].replace(",", "."));
    for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
      const name = lines[j];
      if (!name || isCal(name) || priceRe.test(toEnDigits(name))) continue;
      if (!(name in pairs)) pairs[name] = price;
      break;
    }
  }
  return pairs;
}
async function refreshLive() {
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch {
    throw new Error("Puppeteer \u063A\u064A\u0631 \u0645\u062B\u0628\u0651\u062A. \u0634\u063A\u0651\u0644: npm i puppeteer");
  }
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=ar"]
  });
  const out = {
    source: SCRAPE.source,
    sourceUrl: SCRAPE.stores[0].url,
    location: SCRAPE.location,
    fetchedAtISO: (/* @__PURE__ */ new Date()).toISOString(),
    fetchedAt: (/* @__PURE__ */ new Date()).toLocaleString("en-CA", { timeZone: "Asia/Riyadh", hour12: false }).replace(",", " \xB7") + " (\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0631\u064A\u0627\u0636)",
    stores: {}
  };
  for (const st of SCRAPE.stores) {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36");
    await page.goto(st.url, { waitUntil: "networkidle2", timeout: 6e4 });
    try {
      await page.waitForFunction(() => (document.body.innerText.match(/ر\.?\s*س/g) || []).length > 8, { timeout: 3e4 });
    } catch {
    }
    const text = await page.evaluate(() => document.body.innerText);
    const pairs = parseMenu(text);
    const items = {};
    for (const [arName, id] of Object.entries(st.itemMap)) if (pairs[arName] != null) items[id] = pairs[arName];
    out.stores[st.id] = { app: st.app, etaText: st.etaText, deliveryFee: null, items };
    await page.close();
  }
  await browser.close();
  saveLive(out);
  return out;
}

// src/routes/app.routes.js
var router2 = express2.Router();
var round22 = (n) => Math.round(n * 100) / 100;
var publicApps = () => Object.fromEntries(Object.entries(APPS).map(([id, a]) => [id, { name: a.name, short: a.short, color: a.color, text: a.text, sub: a.sub, promoLabel: a.promo.label || "" }]));
var summary = (s) => ({ id: s.id, kind: s.kind, name: s.name, cat: s.cat, color: s.color, rating: s.rating, eta: s.eta, logo: s.logo, on: s.on, live: !!s.live, liveSource: s.liveSource, liveAt: s.liveAt });
var STATUS_FLOW = ["pending", "confirmed", "preparing", "on_the_way", "delivered"];
var STATUS_AR = { pending: "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u062A\u0623\u0643\u064A\u062F", confirmed: "\u062A\u0645 \u0627\u0644\u062A\u0623\u0643\u064A\u062F", preparing: "\u0642\u064A\u062F \u0627\u0644\u062A\u062C\u0647\u064A\u0632", on_the_way: "\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642", delivered: "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644", cancelled: "\u0645\u0644\u063A\u064A" };
var STATUS_ICON = { confirmed: "\u2705", preparing: "\u{1F468}\u200D\u{1F373}", on_the_way: "\u{1F6F5}", delivered: "\u{1F389}" };
function scheduleOrderProgress(orderId, userId) {
  const steps = [["confirmed", 15e3], ["preparing", 35e3], ["on_the_way", 7e4], ["delivered", 12e4]];
  for (const [status, ms] of steps) {
    setTimeout(async () => {
      try {
        const o = await getOrder(orderId);
        if (!o || o.status === "delivered" || o.status === "cancelled") return;
        await updateOrderStatus(orderId, status);
        await addNotification(userId, `\u0637\u0644\u0628\u0643 #${orderId}: ${STATUS_AR[status]}`, STATUS_ICON[status] || "\u{1F514}");
      } catch {
      }
    }, ms);
  }
}
function couponDiscount(coupon, subtotal) {
  if (!coupon || !coupon.active) return 0;
  if (coupon.min_order && subtotal < coupon.min_order) return 0;
  let d = coupon.type === "percent" ? subtotal * coupon.value / 100 : coupon.value;
  if (coupon.cap) d = Math.min(d, coupon.cap);
  return round22(d);
}
router2.get("/config", (req, res) => {
  const live = loadLive();
  res.json({ location: "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636", apps: publicApps(), live: live ? { source: live.source, fetchedAt: live.fetchedAt } : null });
});
router2.use(requireVerified);
router2.get("/stores", async (req, res) => {
  const live = loadLive();
  const list = await listRestaurants();
  res.json(list.map((s) => summary(mergeLive(s, live))));
});
router2.get("/stores/:id", async (req, res) => {
  const live = loadLive();
  const s0 = await getRestaurant(req.params.id);
  if (!s0) return res.status(404).json({ error: "\u0627\u0644\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  const s = mergeLive(s0, live);
  const [stats, reviews] = await Promise.all([ratingStats(s.id), reviewsByRestaurant(s.id)]);
  res.json({ ...s, ratingStats: stats, reviews });
});
router2.post("/compare", async (req, res) => {
  const { storeId, cart = {}, subs = {} } = req.body || {};
  const live = loadLive();
  const s0 = await getRestaurant(storeId);
  if (!s0) return res.status(404).json({ error: "\u0627\u0644\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  const s = mergeLive(s0, live);
  res.json({ store: summary(s), live: s.live ? { source: s.liveSource, at: s.liveAt, app: s.liveApp } : null, ...computeOffers(s, cart, subs) });
});
router2.get("/coupons", async (req, res) => {
  res.json({ coupons: (await listCoupons()).filter((c) => c.active) });
});
router2.post("/coupon/validate", async (req, res) => {
  const { code, subtotal = 0 } = req.body || {};
  const c = await getCoupon(code);
  if (!c || !c.active) return res.status(404).json({ error: "\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
  if (c.min_order && subtotal < c.min_order) return res.status(400).json({ error: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 ${c.min_order} \u0631.\u0633` });
  res.json({ ok: true, coupon: c, discount: couponDiscount(c, subtotal) });
});
router2.post("/orders", async (req, res) => {
  try {
    const { storeId, appId, cart = {}, subs = {}, coupon } = req.body || {};
    const live = loadLive();
    const s0 = await getRestaurant(storeId);
    if (!s0) return res.status(404).json({ error: "\u0627\u0644\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const s = mergeLive(s0, live);
    const { offers } = computeOffers(s, cart, subs);
    const offer = offers.find((o) => o.appId === appId) || offers[0];
    if (!offer) return res.status(400).json({ error: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0631\u0636 \u0635\u0627\u0644\u062D" });
    let coup = null, cDisc = 0;
    if (coupon) {
      coup = await getCoupon(coupon);
      cDisc = couponDiscount(coup, offer.subtotal);
    }
    const items = Object.entries(cart).map(([id, qty]) => {
      const it = s.menu.flatMap((g) => g.items).find((i) => i.id === id);
      return it ? { id, name: it.n, qty, price: it.p } : null;
    }).filter(Boolean);
    if (!items.length) return res.status(400).json({ error: "\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629" });
    const total = Math.max(0, round22(offer.subtotal + offer.delivery + offer.service - offer.discount - cDisc));
    const order = await createOrder({
      userId: req.user.id,
      restaurantId: s.id,
      restaurantName: s.name,
      appId: offer.appId,
      appName: offer.app.name,
      items,
      subtotal: offer.subtotal,
      delivery: offer.delivery,
      service: offer.service,
      discount: round22(offer.discount + cDisc),
      total,
      coupon: coup ? coup.code : null,
      address: req.user.address
    });
    await addNotification(req.user.id, `\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u0643 #${order.id} \u0645\u0646 ${s.name} \u{1F9FE}`, "\u{1F9FE}");
    scheduleOrderProgress(order.id, req.user.id);
    res.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628" });
  }
});
router2.get("/orders", async (req, res) => {
  res.json({ orders: await listOrdersByUser(req.user.id) });
});
router2.get("/orders/:id", async (req, res) => {
  const o = await getOrder(Number(req.params.id));
  if (!o || o.userId !== req.user.id) return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  res.json({ order: o, flow: STATUS_FLOW, labels: STATUS_AR });
});
router2.post("/reviews", async (req, res) => {
  const { orderId, rating, comment } = req.body || {};
  const o = await getOrder(Number(orderId));
  if (!o || o.userId !== req.user.id) return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  if (o.status !== "delivered") return res.status(400).json({ error: "\u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0628\u0639\u062F \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0641\u0642\u0637" });
  if (await userReviewedOrder(req.user.id, o.id)) return res.status(400).json({ error: "\u0642\u064A\u0651\u0645\u062A \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0645\u0633\u0628\u0642\u064B\u0627" });
  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  await addReview({ userId: req.user.id, restaurantId: o.restaurantId, orderId: o.id, rating: r, comment });
  res.json({ ok: true });
});
router2.get("/notifications", async (req, res) => {
  res.json({ notifications: await listNotifications(req.user.id), unread: await unreadCount(req.user.id) });
});
router2.post("/notifications/read", async (req, res) => {
  await markNotificationsRead(req.user.id);
  res.json({ ok: true });
});
router2.post("/refresh-live", async (req, res) => {
  try {
    const d = await refreshLive();
    res.json({ ok: true, fetchedAt: d.fetchedAt, prices: Object.values(d.stores).reduce((a, s) => a + Object.keys(s.items).length, 0) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
var app_routes_default = router2;

// src/routes/profile.routes.js
import express3 from "express";
var router3 = express3.Router();
router3.use(requireVerified);
router3.get("/", (req, res) => res.json({ user: publicUser(req.user) }));
router3.put("/", async (req, res) => {
  const patch = {};
  const name = (req.body?.name || "").trim();
  const address = (req.body?.address || "").trim();
  if (name) patch.name = name;
  if (address) patch.address = address;
  const u = await updateUser(req.user.id, patch);
  res.json({ user: publicUser(u) });
});
router3.get("/favorites", async (req, res) => res.json({ favorites: await getFavorites(req.user.id) }));
router3.post("/favorites", async (req, res) => {
  const { storeId } = req.body || {};
  const favorites = await toggleFavorite(req.user.id, storeId);
  res.json({ favorites });
});
var profile_routes_default = router3;

// src/routes/admin.routes.js
import express4 from "express";
var router4 = express4.Router();
router4.use(requireAdmin);
router4.get("/stats", async (req, res) => {
  const p = getPool();
  const [u, ru, r, o] = await Promise.all([
    p.query(`SELECT COUNT(*)::int c, COUNT(*) FILTER (WHERE verified)::int v FROM users`),
    p.query(`SELECT COUNT(*)::int c FROM restaurants WHERE active=true`),
    p.query(`SELECT COUNT(*)::int c FROM reviews`),
    p.query(`SELECT COUNT(*)::int c, COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled'))::int active, COALESCE(SUM(total),0)::numeric(12,2) revenue FROM orders`)
  ]);
  res.json({ users: u.rows[0].c, verified: u.rows[0].v, restaurants: ru.rows[0].c, reviews: r.rows[0].c, orders: o.rows[0].c, activeOrders: o.rows[0].active, revenue: Number(o.rows[0].revenue) });
});
router4.get("/users", async (req, res) => res.json({ users: (await listUsers()).map(publicUser) }));
router4.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643" });
  await deleteUser(id);
  res.json({ ok: true });
});
router4.get("/restaurants", async (req, res) => res.json({ restaurants: await listRestaurants(true) }));
router4.post("/restaurants", async (req, res) => {
  const b = req.body || {};
  if (!b.id || !b.name) return res.status(400).json({ error: "\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0648\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
  if (await getRestaurant(b.id)) return res.status(409).json({ error: "\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0645\u0633\u062A\u062E\u062F\u0645" });
  res.json({ restaurant: await createRestaurant(b) });
});
router4.put("/restaurants/:id", async (req, res) => res.json({ restaurant: await updateRestaurant(req.params.id, req.body || {}) }));
router4.delete("/restaurants/:id", async (req, res) => {
  await deleteRestaurant(req.params.id);
  res.json({ ok: true });
});
router4.post("/restaurants/:id/menu", async (req, res) => {
  await addMenuItem(req.params.id, req.body || {});
  res.json({ restaurant: await getRestaurant(req.params.id) });
});
router4.delete("/restaurants/:id/menu/:key", async (req, res) => {
  await deleteMenuItem(req.params.id, req.params.key);
  res.json({ restaurant: await getRestaurant(req.params.id) });
});
router4.get("/orders", async (req, res) => res.json({ orders: await listAllOrders() }));
router4.post("/orders/:id/status", async (req, res) => {
  const { status } = req.body || {};
  const ok = ["pending", "confirmed", "preparing", "on_the_way", "delivered", "cancelled"];
  if (!ok.includes(status)) return res.status(400).json({ error: "\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
  const o = await updateOrderStatus(Number(req.params.id), status);
  if (o) {
    const lbl = { confirmed: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F", preparing: "\u0642\u064A\u062F \u062A\u062C\u0647\u064A\u0632", on_the_way: "\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642", delivered: "\u062A\u0645 \u062A\u0648\u0635\u064A\u0644", cancelled: "\u0623\u064F\u0644\u063A\u064A" }[status] || status;
    await addNotification(o.userId, `\u0637\u0644\u0628\u0643 #${o.id}: ${lbl}`, "\u{1F6F5}");
  }
  res.json({ order: o });
});
router4.get("/coupons", async (req, res) => res.json({ coupons: await listCoupons() }));
router4.post("/coupons", async (req, res) => {
  const b = req.body || {};
  if (!b.code || !b.type) return res.status(400).json({ error: "\u0627\u0644\u0643\u0648\u062F \u0648\u0627\u0644\u0646\u0648\u0639 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
  res.json({ coupon: await upsertCoupon(b) });
});
router4.delete("/coupons/:code", async (req, res) => {
  await deleteCoupon(req.params.code);
  res.json({ ok: true });
});
router4.post("/wipe", async (req, res) => {
  await wipeUserData();
  res.json({ ok: true });
});
var admin_routes_default = router4;

// src/_assets.js
var ASSETS = { "index.html": { "type": "text/html; charset=utf-8", "b64": "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImFyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCIgLz4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiIC8+Cjx0aXRsZT7Ys9mI2KjYsSDYotioIOKAlCDZhdmG2LXYqSDZhdmC2KfYsdmG2Kkg2KfZhNiq2YjYtdmK2YQ8L3RpdGxlPgo8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iIC8+CjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4gLz4KPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1DYWlybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0IiAvPgo8bGluayByZWw9InN0eWxlc2hlZXQiIGhyZWY9InN0eWxlcy5jc3MiIC8+CjxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iYXV0aC5jc3MiIC8+CjwvaGVhZD4KPGJvZHk+CjxkaXYgY2xhc3M9ImFwcCIgaWQ9ImFwcCI+CiAgPGhlYWRlciBpZD0idG9wbmF2Ij48L2hlYWRlcj4KICA8bWFpbiBpZD0ic2NyZWVuIj48ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYp9mE2KrYrdmF2YrZhOKApjwvZGl2PjwvbWFpbj4KPC9kaXY+CjxzY3JpcHQgc3JjPSJhcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K" }, "styles.css": { "type": "text/css; charset=utf-8", "b64": "OnJvb3R7CiAgLS1icmFuZDE6IzZEMjhEOTsgLS1icmFuZDI6IzRGNDZFNTsgLS1icmFuZC1ncmFkOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzZEMjhEOSwjNEY0NkU1KTsKICAtLWdvbGQ6I0Y1OUUwQjsgLS1ncmVlbjojMTZBMzRBOyAtLWdyZWVuLXNvZnQ6I0RDRkNFNzsKICAtLWluazojMEYxNzJBOyAtLW11dGVkOiM2NDc0OEI7IC0tbGluZTojRTVFOUYwOyAtLWJnOiNGNEY2RkI7IC0tY2FyZDojZmZmOwogIC0tc2hhZG93OjAgNnB4IDIycHggcmdiYSgxNSwyMyw0MiwuMDcpOyAtLXJhZGl1czoxNnB4Owp9Cip7Ym94LXNpemluZzpib3JkZXItYm94O21hcmdpbjowO3BhZGRpbmc6MDstd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7fQpib2R5e2ZvbnQtZmFtaWx5OidDYWlybycsc3lzdGVtLXVpLCdTZWdvZSBVSScsc2Fucy1zZXJpZjtiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO21pbi1oZWlnaHQ6MTAwdmg7fQphe2N1cnNvcjpwb2ludGVyO30KLmFwcHttaW4taGVpZ2h0OjEwMHZoO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47fQoKLyogPT09PT0gVG9wIG5hdiA9PT09PSAqLwojdG9wbmF2e3Bvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjQwO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3gtc2hhZG93OjAgMXB4IDhweCByZ2JhKDE1LDIzLDQyLC4wNCk7fQoubmF2LWlubmVye21heC13aWR0aDoxMTgwcHg7bWFyZ2luOjAgYXV0bztwYWRkaW5nOjAgMjRweDtoZWlnaHQ6NjRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoyMHB4O30KLmJyYW5ke2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjE5cHg7Y3Vyc29yOnBvaW50ZXI7fQouYnJhbmQgLm1hcmt7d2lkdGg6MzRweDtoZWlnaHQ6MzRweDtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxN3B4O30KLm5hdi1saW5rc3tkaXNwbGF5OmZsZXg7Z2FwOjZweDtmbGV4OjE7fQoubmF2LWxpbmtzIGF7cGFkZGluZzo4cHggMTRweDtib3JkZXItcmFkaXVzOjEwcHg7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNHB4O2NvbG9yOnZhcigtLW11dGVkKTt9Ci5uYXYtbGlua3MgYTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO30KLm5hdi1saW5rcyBhLmFjdGl2ZXtiYWNrZ3JvdW5kOiNFRUYyRkY7Y29sb3I6dmFyKC0tYnJhbmQyKTt9Ci5uYXYtcmlnaHR7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDt9Ci5sb2MtY2hpcHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo3MDA7Y29sb3I6dmFyKC0tbXV0ZWQpO2JhY2tncm91bmQ6dmFyKC0tYmcpO3BhZGRpbmc6N3B4IDEycHg7Ym9yZGVyLXJhZGl1czozMHB4O30KLmJ0bi1vdXR7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtjb2xvcjp2YXIoLS1pbmspO2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxM3B4O3BhZGRpbmc6OHB4IDE2cHg7Ym9yZGVyLXJhZGl1czoxMHB4O2N1cnNvcjpwb2ludGVyO30KLmJ0bi1vdXQ6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kMik7Y29sb3I6dmFyKC0tYnJhbmQyKTt9Cgojc2NyZWVue2ZsZXg6MTt9Ci5jb250YWluZXJ7bWF4LXdpZHRoOjExODBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjZweCAyNHB4IDYwcHg7fQouY29udGFpbmVyLm5hcnJvd3ttYXgtd2lkdGg6NjgwcHg7fQouY3J1bWJ7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDttYXJnaW4tYm90dG9tOjE2cHg7fQouY3J1bWIgYXtjb2xvcjp2YXIoLS1icmFuZDIpO30KCi8qID09PT09IEhlcm8gKyBzZWFyY2ggPT09PT0gKi8KLmhlcm97YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MjJweDtwYWRkaW5nOjMwcHggMzBweDttYXJnaW4tYm90dG9tOjIycHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtnYXA6MjRweDtmbGV4LXdyYXA6d3JhcDt9Ci5oZXJvLXR4dCBoMXtmb250LXNpemU6MjZweDtmb250LXdlaWdodDo5MDA7fQouaGVyby10eHQgcHtvcGFjaXR5Oi45Mjtmb250LXNpemU6MTMuNXB4O21hcmdpbi10b3A6OHB4O21heC13aWR0aDo1MjBweDtsaW5lLWhlaWdodDoxLjc7fQouc2VhcmNoe2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjE0cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtwYWRkaW5nOjEzcHggMTZweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7bWluLXdpZHRoOjMwMHB4O2ZsZXg6MTttYXgtd2lkdGg6NDIwcHg7fQouc2VhcmNoIGlucHV0e2JvcmRlcjowO291dGxpbmU6MDtmbGV4OjE7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0taW5rKTtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O30KLnNlYXJjaC53aWRle21heC13aWR0aDpub25lO21hcmdpbi1ib3R0b206MThweDt9CgoubGl2ZS1zdHJpcHtiYWNrZ3JvdW5kOnZhcigtLWdyZWVuLXNvZnQpO2NvbG9yOnZhcigtLWdyZWVuKTtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjEwcHggMTZweDtib3JkZXItcmFkaXVzOjEycHg7bWFyZ2luLWJvdHRvbToxOHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDt9Ci5saXZlLXN0cmlwIC5kb3R7Zm9udC1zaXplOjlweDt9Ci5saXZlLXN0cmlwLnNte21hcmdpbjowIDAgMTRweDt9Cgouc2Vje2ZvbnQtc2l6ZToxN3B4O2ZvbnQtd2VpZ2h0OjgwMDttYXJnaW46MjZweCAycHggMTRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O30KLnNlYyBhe2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0tYnJhbmQyKTtmb250LXdlaWdodDo3MDA7bWFyZ2luLWlubGluZS1zdGFydDphdXRvO30KCi8qID09PT09IENhdGVnb3JpZXMgPT09PT0gKi8KLmNhdHN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnIgMWZyO2dhcDoxNnB4O30KLmNhdHtib3JkZXItcmFkaXVzOjE4cHg7cGFkZGluZzoyMnB4O2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1czt9Ci5jYXQ6aG92ZXJ7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTJweCk7fQouY2F0LmZvb2R7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmYjcxODUsI2UxMWQ0OCk7fQouY2F0Lmdyb2Nlcnl7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCMzNGQzOTksIzA1OTY2OSk7fQouY2F0IGg0e2ZvbnQtc2l6ZToxOXB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5jYXQgcHtmb250LXNpemU6MTIuNXB4O29wYWNpdHk6LjkyO21hcmdpbi10b3A6NHB4O30KLmNhdCAuZW1vaml7Zm9udC1zaXplOjQ2cHg7fQoKLyogPT09PT0gR3JpZCArIGNhcmRzID09PT09ICovCi5ncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMjMycHgsMWZyKSk7Z2FwOjE2cHg7fQouZ3JpZC5pdGVtc3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMzAwcHgsMWZyKSk7fQouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLWNhcmQpO2JvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzKTtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7b3ZlcmZsb3c6aGlkZGVuO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7fQoucGxhY2V7Y3Vyc29yOnBvaW50ZXI7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1cyxib3gtc2hhZG93IC4xNXM7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt9Ci5wbGFjZTpob3Zlcnt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtM3B4KTtib3gtc2hhZG93OjAgMTRweCAzMHB4IHJnYmEoMTUsMjMsNDIsLjEyKTt9Ci5jYXJkLXRvcHtoZWlnaHQ6OTZweDtwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7fQoubG9nby1iYWRnZXtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6OHB4IDEycHg7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxNHB4O2JveC1zaGFkb3c6MCA0cHggMTBweCByZ2JhKDAsMCwwLC4xMik7fQouZmF2LWhlYXJ0e3Bvc2l0aW9uOmFic29sdXRlO3RvcDo4cHg7aW5zZXQtaW5saW5lLXN0YXJ0OjhweDtmb250LXNpemU6MThweDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjkpO3dpZHRoOjMycHg7aGVpZ2h0OjMycHg7Ym9yZGVyLXJhZGl1czo1MCU7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtjdXJzb3I6cG9pbnRlcjt9Ci5jYXJkLWJvZHl7cGFkZGluZzoxM3B4IDE0cHggMTVweDt9Ci5jYXJkLWJvZHkgaDR7Zm9udC1zaXplOjE1cHg7Zm9udC13ZWlnaHQ6ODAwO30KLmNhcmQtYm9keSBwe2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweDt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7fQoubWV0YXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O21hcmdpbi10b3A6OXB4O2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDt9Ci5tZXRhIC5zdGFye2NvbG9yOnZhcigtLWdvbGQpO30KLmJhZGdlLW57YmFja2dyb3VuZDojRUVGMkZGO2NvbG9yOnZhcigtLWJyYW5kMik7Zm9udC1zaXplOjEwcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6M3B4IDhweDtib3JkZXItcmFkaXVzOjIwcHg7fQouYmFkZ2Utbi5saXZle2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLmFwcHMtbWluaXtkaXNwbGF5OmZsZXg7bWFyZ2luLXRvcDoxMHB4O30KLmFwcHMtbWluaSBpe3dpZHRoOjE4cHg7aGVpZ2h0OjE4cHg7Ym9yZGVyLXJhZGl1czo1MCU7Ym9yZGVyOjJweCBzb2xpZCAjZmZmO21hcmdpbi1pbmxpbmUtc3RhcnQ6LTZweDtkaXNwbGF5OmlubGluZS1ibG9jaztib3gtc2hhZG93OjAgMCAwIDFweCB2YXIoLS1saW5lKTt9CgovKiA9PT09PSBTdG9yZSA9PT09PSAqLwouc3RvcmUtYmFubmVye2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoyMHB4O3BhZGRpbmc6MjZweDttYXJnaW4tYm90dG9tOjIwcHg7fQouc3RvcmUtYmFubmVyIGgye2ZvbnQtc2l6ZToyNHB4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5zdG9yZS1iYW5uZXIgLnRhZ3N7Zm9udC1zaXplOjEzcHg7b3BhY2l0eTouOTM7bWFyZ2luLXRvcDo1cHg7fQouc3RvcmUtYmFubmVyIC5jaGlwc3tkaXNwbGF5OmZsZXg7Z2FwOjhweDttYXJnaW4tdG9wOjE0cHg7ZmxleC13cmFwOndyYXA7fQouc3RvcmUtYmFubmVyIC5jaGlwe2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMTgpO2JvcmRlci1yYWRpdXM6MjBweDtwYWRkaW5nOjVweCAxMnB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NzAwO30KLnN0b3JlLWxheW91dHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmciAzMjBweDtnYXA6MjJweDthbGlnbi1pdGVtczpzdGFydDt9Ci5tZW51LWNhdHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7Y29sb3I6dmFyKC0taW5rKTttYXJnaW46MThweCAycHggMTJweDt9Ci5pdGVte2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7cGFkZGluZzoxM3B4O30KLml0ZW0gLnBoe3dpZHRoOjU0cHg7aGVpZ2h0OjU0cHg7Ym9yZGVyLXJhZGl1czoxM3B4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjZjhmYWZjLCNlZWYyZjcpO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjI3cHg7ZmxleC1zaHJpbms6MDt9Ci5pdGVtIC5ke2ZsZXg6MTttaW4td2lkdGg6MDt9Ci5pdGVtIC5kIGg1e2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5pdGVtIC5kIHB7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O30KLml0ZW0gLmQgLnBye2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjgwMDtjb2xvcjp2YXIoLS1icmFuZDIpO21hcmdpbi10b3A6NXB4O30KLmxpdmUtdGFne2ZvbnQtc2l6ZTo5cHg7Y29sb3I6dmFyKC0tZ3JlZW4pO2ZvbnQtd2VpZ2h0OjgwMDtiYWNrZ3JvdW5kOnZhcigtLWdyZWVuLXNvZnQpO3BhZGRpbmc6MnB4IDZweDtib3JkZXItcmFkaXVzOjZweDt9Ci5zdGVwcGVye2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDt9Ci5zdGVwcGVyIGJ1dHRvbnt3aWR0aDozMHB4O2hlaWdodDozMHB4O2JvcmRlci1yYWRpdXM6OXB4O2JvcmRlcjowO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQxKTtjb2xvcjojZmZmO2ZvbnQtc2l6ZToxOHB4O2ZvbnQtd2VpZ2h0OjgwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2xpbmUtaGVpZ2h0OjE7fQouc3RlcHBlciBidXR0b24ubWludXN7YmFja2dyb3VuZDojZmZmO2NvbG9yOnZhcigtLWJyYW5kMSk7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO30KLnN0ZXBwZXIgLnF7bWluLXdpZHRoOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC13ZWlnaHQ6ODAwO30KLmFkZHtib3JkZXI6MDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kMSk7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzo4cHggMTVweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTNweDtjdXJzb3I6cG9pbnRlcjt9Ci5jYXJ0LWNvbHtwb3NpdGlvbjpzdGlja3k7dG9wOjg0cHg7fQouY2FydC1ib3h7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzKTtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxOHB4O30KLmNhcnQtYm94IGg0e2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjgwMDttYXJnaW4tYm90dG9tOjEycHg7fQouY2FydC1saW5lc3tkaXNwbGF5OmdyaWQ7Z2FwOjhweDttYXJnaW4tYm90dG9tOjEycHg7fQouY2xpbmV7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZToxM3B4O30KLmNsaW5lIGJ7Zm9udC13ZWlnaHQ6ODAwO30KLmNhcnQtdG90YWx7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2JvcmRlci10b3A6MXB4IGRhc2hlZCB2YXIoLS1saW5lKTtwYWRkaW5nLXRvcDoxMnB4O21hcmdpbi1ib3R0b206MTRweDtmb250LXdlaWdodDo5MDA7fQouY2FydC1lbXB0eXtmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS44O3BhZGRpbmc6OHB4IDAgNHB4O30KCi8qID09PT09IENvbXBhcmUgPT09PT0gKi8KLnNhdmUtYmFubmVye2JhY2tncm91bmQ6I2ZmZjtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6MTZweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxNnB4IDE4cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTRweDttYXJnaW4tYm90dG9tOjE2cHg7fQouc2F2ZS1iYW5uZXIgLmlje3dpZHRoOjQ2cHg7aGVpZ2h0OjQ2cHg7Ym9yZGVyLXJhZGl1czoxMnB4O2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjI0cHg7ZmxleC1zaHJpbms6MDt9Ci5zYXZlLWJhbm5lciBoNHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7fQouc2F2ZS1iYW5uZXIgaDQgYntjb2xvcjp2YXIoLS1ncmVlbik7fQouc2F2ZS1iYW5uZXIgcHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHg7fQouc3Vic3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXA7bWFyZ2luLWJvdHRvbToxOHB4O30KLnN1YnMgLmxibHtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtjb2xvcjp2YXIoLS1tdXRlZCk7fQouc3ViLWNoaXB7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjMwcHg7cGFkZGluZzo3cHggMTRweDtmb250LXNpemU6MTJweDtmb250LXdlaWdodDo4MDA7Y29sb3I6dmFyKC0tbXV0ZWQpO2N1cnNvcjpwb2ludGVyO2ZvbnQtZmFtaWx5OmluaGVyaXQ7fQouc3ViLWNoaXAub257YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Ym9yZGVyLWNvbG9yOnZhcigtLWdyZWVuKTtjb2xvcjojZmZmO30KLm9mZmVycy1ncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMzEwcHgsMWZyKSk7Z2FwOjE2cHg7fQoub2ZmZXJ7cGFkZGluZzoxNnB4O2N1cnNvcjpwb2ludGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xNXM7fQoub2ZmZXI6aG92ZXJ7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTJweCk7fQoub2ZmZXIuYmVzdHtib3JkZXI6MnB4IHNvbGlkIHZhcigtLWdyZWVuKTtib3gtc2hhZG93OjAgMTRweCAzMHB4IHJnYmEoMjIsMTYzLDc0LC4xNik7fQoub2ZmZXIgLnJpYmJvbntwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTExcHg7aW5zZXQtaW5saW5lLXN0YXJ0OjE2cHg7YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Y29sb3I6I2ZmZjtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjRweCAxMXB4O2JvcmRlci1yYWRpdXM6MjBweDt9Ci5vZmZlci10b3B7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDt9Ci5hbG9nb3tib3JkZXItcmFkaXVzOjEycHg7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjEycHg7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS4wNTtmbGV4LXNocmluazowO30KLmFubXtmbGV4OjE7bWluLXdpZHRoOjA7fQouYW5tIGg0e2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5hbm0gLnN1Yntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHg7ZGlzcGxheTpmbGV4O2dhcDo5cHg7ZmxleC13cmFwOndyYXA7fQouYW5tIC5zdWIgLm9re2NvbG9yOnZhcigtLWdyZWVuKTtmb250LXdlaWdodDo4MDA7fQouYW5tIC5zdWIgLm11dGVke2NvbG9yOiM5NEEzQjg7fQoudG90e3RleHQtYWxpZ246bGVmdDtmbGV4LXNocmluazowO30KLnRvdCAuYmlne2ZvbnQtc2l6ZToyMXB4O2ZvbnQtd2VpZ2h0OjkwMDtsaW5lLWhlaWdodDoxO30KLm9mZmVyLmJlc3QgLnRvdCAuYmlne2NvbG9yOnZhcigtLWdyZWVuKTt9Ci50b3QgLmN1cntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO30KLmJyZWFrZG93bnttYXJnaW4tdG9wOjEzcHg7Ym9yZGVyLXRvcDoxcHggZGFzaGVkIHZhcigtLWxpbmUpO3BhZGRpbmctdG9wOjEycHg7ZGlzcGxheTpncmlkO2dhcDo3cHg7fQouYnJvd3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC1zaXplOjEyLjVweDt9Ci5icm93IHNwYW57Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjYwMDt9Ci5icm93IGJ7Zm9udC13ZWlnaHQ6NzAwO30KLmJyb3cuZGlzYyBie2NvbG9yOnZhcigtLWdyZWVuKTt9Ci5wcm9tby10YWd7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjVweDtiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjRweCA5cHg7Ym9yZGVyLXJhZGl1czo4cHg7bWFyZ2luLXRvcDoxMHB4O30KLnBpY2tidG57bWFyZ2luLXRvcDoxM3B4O3dpZHRoOjEwMCU7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTFweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTMuNXB4O2N1cnNvcjpwb2ludGVyO2JhY2tncm91bmQ6I0VFRjJGRjtjb2xvcjp2YXIoLS1icmFuZDIpO30KLm9mZmVyLmJlc3QgLnBpY2tidG57YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Y29sb3I6I2ZmZjt9CgovKiA9PT09PSBPZmZlcnMgLyBwcm9tbyBjYXJkcyA9PT09PSAqLwoucHJvbW8tY2FyZHtwYWRkaW5nOjE1cHg7ZGlzcGxheTpmbGV4O2dhcDoxMnB4O2FsaWduLWl0ZW1zOmNlbnRlcjt9Ci5wcm9tby1jYXJkIC5wbHt3aWR0aDo0OHB4O2hlaWdodDo0OHB4O2JvcmRlci1yYWRpdXM6MTJweDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtd2VpZ2h0OjkwMDtmb250LXNpemU6MTFweDtmbGV4LXNocmluazowO30KLnByb21vLWNhcmQgLnB0e2ZsZXg6MTt9Ci5wcm9tby1jYXJkIC5wdCBoNXtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQoucHJvbW8tY2FyZCAucHQgcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweDt9Ci5wcm9tby1jYXJkIC5jb2Rle2JvcmRlcjoxLjVweCBkYXNoZWQgdmFyKC0tYnJhbmQyKTtjb2xvcjp2YXIoLS1icmFuZDIpO2ZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjZweCAxMHB4O2JvcmRlci1yYWRpdXM6OXB4O2JhY2tncm91bmQ6I0VFRjJGRjt9CgovKiA9PT09PSBQcm9maWxlIC8gQWRtaW4gPT09PT0gKi8KLnBhZHtwYWRkaW5nOjE4cHg7bWFyZ2luLWJvdHRvbToxNHB4O30KLnBhZCBoNHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7bWFyZ2luLWJvdHRvbTo4cHg7fQoubXV0ZWR7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMi41cHg7bGluZS1oZWlnaHQ6MS43O30KLnByb2YtaGVhZHtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoxOHB4O3BhZGRpbmc6MjRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNnB4O21hcmdpbi1ib3R0b206MTZweDt9Ci5wcm9mLWhlYWQgLmF2e3dpZHRoOjY0cHg7aGVpZ2h0OjY0cHg7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToyNnB4O2ZvbnQtd2VpZ2h0OjkwMDtib3JkZXI6M3B4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjUpO30KLnByb2YtaGVhZCBoMntmb250LXNpemU6MTlweDtmb250LXdlaWdodDo5MDA7fQoucHJvZi1oZWFkIHB7Zm9udC1zaXplOjEyLjVweDtvcGFjaXR5Oi45O21hcmdpbi10b3A6MnB4O30KLnByb2YtaGVhZCAudmJhZGdle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi10b3A6OHB4O2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMik7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6NHB4IDEycHg7Ym9yZGVyLXJhZGl1czoyMHB4O30KLmZpZWxke21hcmdpbi1ib3R0b206MTBweDt9Ci5maWVsZCBsYWJlbHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLWJvdHRvbTo2cHg7fQouZmllbGQgaW5wdXR7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweCAxNHB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NjAwO291dGxpbmU6bm9uZTtjb2xvcjp2YXIoLS1pbmspO2JhY2tncm91bmQ6I2ZmZjt9Ci5maWVsZCBpbnB1dDpmb2N1c3tib3JkZXItY29sb3I6dmFyKC0tYnJhbmQyKTtib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDc5LDcwLDIyOSwuMTIpO30KLmJ0bi1zb2Z0e3dpZHRoOjEwMCU7Ym9yZGVyOjA7YmFja2dyb3VuZDojRUVGMkZGO2NvbG9yOnZhcigtLWJyYW5kMik7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5idG4tZGFuZ2Vye3dpZHRoOjEwMCU7Ym9yZGVyOjEuNXB4IHNvbGlkICNGQ0E1QTU7Y29sb3I6I0I5MUMxQztiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5hY2Mtcm93e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47cGFkZGluZzoxMXB4IDA7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7fQouYWNjLXJvdzpsYXN0LWNoaWxke2JvcmRlci1ib3R0b206MDt9Ci5hY2Mtcm93IC5se2ZvbnQtc2l6ZToxMy41cHg7Zm9udC13ZWlnaHQ6NzAwO30KLnN3aXRjaHt3aWR0aDo0MnB4O2hlaWdodDoyNXB4O2JvcmRlci1yYWRpdXM6MzBweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpO3Bvc2l0aW9uOnJlbGF0aXZlO2N1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246LjJzO2ZsZXgtc2hyaW5rOjA7ZGlzcGxheTppbmxpbmUtYmxvY2s7fQouc3dpdGNoLm9ue2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4pO30KLnN3aXRjaCBpe3Bvc2l0aW9uOmFic29sdXRlO3RvcDoyLjVweDtpbnNldC1pbmxpbmUtc3RhcnQ6Mi41cHg7d2lkdGg6MjBweDtoZWlnaHQ6MjBweDtib3JkZXItcmFkaXVzOjUwJTtiYWNrZ3JvdW5kOiNmZmY7dHJhbnNpdGlvbjouMnM7Ym94LXNoYWRvdzowIDFweCAzcHggcmdiYSgwLDAsMCwuMik7fQouc3dpdGNoLm9uIGl7aW5zZXQtaW5saW5lLXN0YXJ0OjE5LjVweDt9Ci5zdGF0LXJvd3tkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7bWFyZ2luLWJvdHRvbTo4cHg7fQouc3RhdHtmbGV4OjE7cGFkZGluZzoxOHB4O3RleHQtYWxpZ246Y2VudGVyO30KLnN0YXQgLm57Zm9udC1zaXplOjI2cHg7Zm9udC13ZWlnaHQ6OTAwO2NvbG9yOnZhcigtLWJyYW5kMSk7fQouc3RhdCAubHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO21hcmdpbi10b3A6M3B4O30KLnVzZXItcm93e3BhZGRpbmc6MTNweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21hcmdpbi1ib3R0b206MTBweDt9Ci51c2VyLXJvdyAuYXZ7d2lkdGg6NDJweDtoZWlnaHQ6NDJweDtib3JkZXItcmFkaXVzOjUwJTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo4MDA7ZmxleC1zaHJpbms6MDt9Ci51c2VyLXJvdyAudWl7ZmxleDoxO21pbi13aWR0aDowO30KLnVzZXItcm93IC51aSBoNXtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQoudXNlci1yb3cgLnVpIHB7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7fQoudGFncy1yb3d7ZGlzcGxheTpmbGV4O2dhcDo1cHg7bWFyZ2luLXRvcDo1cHg7fQoudGFndntmb250LXNpemU6OS41cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6MnB4IDdweDtib3JkZXItcmFkaXVzOjIwcHg7fQoudGFndi55e2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLnRhZ3YubntiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTt9Ci50YWd2LmF7YmFja2dyb3VuZDojRURFOUZFO2NvbG9yOnZhcigtLWJyYW5kMSk7fQouZGVse2JvcmRlcjowO2JhY2tncm91bmQ6I0ZFRjJGMjtjb2xvcjojQjkxQzFDO2JvcmRlci1yYWRpdXM6OXB4O3BhZGRpbmc6OHB4IDEycHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjExcHg7Y3Vyc29yOnBvaW50ZXI7ZmxleC1zaHJpbms6MDt9CgouZGlzY2xhaW1lcntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS44O21hcmdpbi10b3A6MThweDt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5kaXNjbGFpbWVyIGJ7Y29sb3I6Izk0YTNiODt9CgovKiA9PT09PSBNb2RhbCA9PT09PSAqLwoubW9kYWwtYmd7cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEoMTUsMjMsNDIsLjUpO3otaW5kZXg6MTAwO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjE2cHg7YW5pbWF0aW9uOmZhZGUgLjJzO30KQGtleWZyYW1lcyBmYWRle2Zyb217b3BhY2l0eTowO310b3tvcGFjaXR5OjE7fX0KLnNoZWV0e2JhY2tncm91bmQ6I2ZmZjt3aWR0aDoxMDAlO21heC13aWR0aDo0NDBweDtib3JkZXItcmFkaXVzOjIwcHg7cGFkZGluZzoyMnB4O2FuaW1hdGlvbjpwb3AgLjJzIGVhc2U7fQpAa2V5ZnJhbWVzIHBvcHtmcm9te3RyYW5zZm9ybTp0cmFuc2xhdGVZKDEycHgpO29wYWNpdHk6MDt9dG97dHJhbnNmb3JtOm5vbmU7b3BhY2l0eToxO319Ci5zaGVldCAuaHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O30KLnNoZWV0IC5oIGgze2ZvbnQtc2l6ZToxN3B4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5zaGVldCAuaCBwe2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDt9Ci5zaGVldCAuc3Vte2JhY2tncm91bmQ6dmFyKC0tYmcpO2JvcmRlci1yYWRpdXM6MTRweDtwYWRkaW5nOjE0cHg7bWFyZ2luOjE2cHggMDtkaXNwbGF5OmdyaWQ7Z2FwOjhweDt9Ci5zaGVldCAuc3VtIC5ye2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtmb250LXNpemU6MTIuNXB4O30KLnNoZWV0IC5zdW0gLnIgc3Bhbntjb2xvcjp2YXIoLS1tdXRlZCk7fQouc2hlZXQgLnN1bSAuci50dHtib3JkZXItdG9wOjFweCBkYXNoZWQgdmFyKC0tbGluZSk7cGFkZGluZy10b3A6OXB4O21hcmdpbi10b3A6M3B4O2ZvbnQtd2VpZ2h0OjkwMDtmb250LXNpemU6MTVweDt9Ci5zaGVldCAubm90ZXtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtiYWNrZ3JvdW5kOiNGRUYzQzc7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTFweCAxM3B4O2xpbmUtaGVpZ2h0OjEuNzt9Ci5zaGVldCAubm90ZSBie2NvbG9yOiM5MjQwMEU7fQouc2hlZXQgLmN0YXttYXJnaW4tdG9wOjE2cHg7ZGlzcGxheTpmbGV4O2dhcDoxMHB4O30KLnNoZWV0IC5jdGEgYnV0dG9ue2ZsZXg6MTtib3JkZXI6MDtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxM3B4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxNHB4O2N1cnNvcjpwb2ludGVyO30KLnNoZWV0IC5jdGEgLmdve2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4pO2NvbG9yOiNmZmY7fQouc2hlZXQgLmN0YSAuY2FuY2Vse2JhY2tncm91bmQ6dmFyKC0tYmcpO2NvbG9yOnZhcigtLW11dGVkKTtmbGV4OjAgMCA5MHB4O30KCi5sb2FkaW5ne2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtnYXA6MTBweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6ODBweCAwO30KLnNwaW57d2lkdGg6MjJweDtoZWlnaHQ6MjJweDtib3JkZXI6M3B4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci10b3AtY29sb3I6dmFyKC0tYnJhbmQxKTtib3JkZXItcmFkaXVzOjUwJTthbmltYXRpb246cm90IDFzIGxpbmVhciBpbmZpbml0ZTt9CkBrZXlmcmFtZXMgcm90e3Rve3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt9fQouZW1wdHl7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpO3BhZGRpbmc6NzBweCAyMHB4O30KLmVtcHR5IC5le2ZvbnQtc2l6ZTo1NHB4O30KLmVtcHR5IGgze2ZvbnQtc2l6ZToxN3B4O21hcmdpbi10b3A6MTJweDtjb2xvcjp2YXIoLS1pbmspO30KLmVtcHR5IHB7Zm9udC1zaXplOjEzcHg7bWFyZ2luLXRvcDo2cHg7fQoKLyogPT09PT0gUmVzcG9uc2l2ZSA9PT09PSAqLwpAbWVkaWEobWF4LXdpZHRoOjgyMHB4KXsKICAubmF2LWlubmVye3BhZGRpbmc6MCAxNHB4O2dhcDoxMHB4O30KICAubG9jLWNoaXB7ZGlzcGxheTpub25lO30KICAubmF2LWxpbmtze292ZXJmbG93LXg6YXV0bzt9CiAgLm5hdi1saW5rcyBhe3BhZGRpbmc6OHB4IDEwcHg7Zm9udC1zaXplOjEzcHg7d2hpdGUtc3BhY2U6bm93cmFwO30KICAuY29udGFpbmVye3BhZGRpbmc6MThweCAxNHB4IDgwcHg7fQogIC5oZXJve3BhZGRpbmc6MjJweDt9CiAgLmhlcm8tdHh0IGgxe2ZvbnQtc2l6ZToyMXB4O30KICAuc3RvcmUtbGF5b3V0e2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQogIC5jYXJ0LWNvbHtwb3NpdGlvbjpzdGF0aWM7fQogIC5ncmlkLml0ZW1ze2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQp9CkBtZWRpYShtYXgtd2lkdGg6NDgwcHgpewogIC5jYXRze2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQp9CgovKiA9PT09PSBOb3RpZmljYXRpb25zID09PT09ICovCi5iZWxse3Bvc2l0aW9uOnJlbGF0aXZlO2JvcmRlcjoxLjVweCBzb2xpZCB2YXIoLS1saW5lKTtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMHB4O3dpZHRoOjQwcHg7aGVpZ2h0OjM4cHg7Zm9udC1zaXplOjE3cHg7Y3Vyc29yOnBvaW50ZXI7fQoubmJhZGdle3Bvc2l0aW9uOmFic29sdXRlO3RvcDotNnB4O2luc2V0LWlubGluZS1zdGFydDotNnB4O2JhY2tncm91bmQ6I2VmNDQ0NDtjb2xvcjojZmZmO2ZvbnQtc2l6ZToxMHB4O2ZvbnQtd2VpZ2h0OjgwMDttaW4td2lkdGg6MThweDtoZWlnaHQ6MThweDtib3JkZXItcmFkaXVzOjEwcHg7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtwYWRkaW5nOjAgNHB4O30KLm5vdGlmLXBvcHtwb3NpdGlvbjpmaXhlZDt0b3A6NjRweDtpbnNldC1pbmxpbmUtc3RhcnQ6YXV0bztpbnNldC1pbmxpbmUtZW5kOjI0cHg7d2lkdGg6MzQwcHg7bWF4LXdpZHRoOjkydnc7YmFja2dyb3VuZDojZmZmO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxNHB4O2JveC1zaGFkb3c6MCAyMHB4IDUwcHggcmdiYSgxNSwyMyw0MiwuMik7ei1pbmRleDo2MDtvdmVyZmxvdzpoaWRkZW47bWF4LWhlaWdodDo3MHZoO292ZXJmbG93LXk6YXV0bzt9Ci5ub3RpZi1oZWFke3BhZGRpbmc6MTRweCAxNnB4O2ZvbnQtd2VpZ2h0OjgwMDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTt9Ci5ub3RpZntkaXNwbGF5OmZsZXg7Z2FwOjExcHg7cGFkZGluZzoxMnB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7fQoubm90aWYudW5yZWFke2JhY2tncm91bmQ6I0Y1RjNGRjt9Ci5ub3RpZiAubml7Zm9udC1zaXplOjE4cHg7fQoubm90aWYgcHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo2MDA7fQoubm90aWYgLm50e2ZvbnQtc2l6ZToxMC41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO30KLm5vdGlmLWVtcHR5e3BhZGRpbmc6MzBweDt0ZXh0LWFsaWduOmNlbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC1zaXplOjEzcHg7fQoKLyogPT09PT0gQ2hlY2tvdXQgY291cG9uID09PT09ICovCi5jb3Vwb24tcm93e2Rpc3BsYXk6ZmxleDtnYXA6OHB4O21hcmdpbi1ib3R0b206MTBweDt9Ci5jb3Vwb24tcm93IGlucHV0e2ZsZXg6MTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTFweCAxM3B4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC1zaXplOjEzLjVweDtvdXRsaW5lOm5vbmU7fQouY291cG9uLXJvdyBidXR0b257Ym9yZGVyOjA7YmFja2dyb3VuZDp2YXIoLS1icmFuZDEpO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MCAxOHB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxM3B4O2N1cnNvcjpwb2ludGVyO30KLmNvdXBvbi1tc2d7Zm9udC1zaXplOjEycHg7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6OHB4IDEycHg7Ym9yZGVyLXJhZGl1czo5cHg7bWFyZ2luLWJvdHRvbToxMHB4O30KLmNvdXBvbi1tc2cub2t7YmFja2dyb3VuZDp2YXIoLS1ncmVlbi1zb2Z0KTtjb2xvcjp2YXIoLS1ncmVlbik7fQouY291cG9uLW1zZy5lcnJ7YmFja2dyb3VuZDojRkVGMkYyO2NvbG9yOiNCOTFDMUM7fQoKLyogPT09PT0gTXkgb3JkZXJzID09PT09ICovCi5vcmRlci1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTNweDtwYWRkaW5nOjE0cHg7bWFyZ2luLWJvdHRvbToxMnB4O2N1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xNXM7fQoub3JkZXItcm93OmhvdmVye3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0ycHgpO30KLm9yZGVyLXJvdyAub3ItaWN7d2lkdGg6NDRweDtoZWlnaHQ6NDRweDtib3JkZXItcmFkaXVzOjEycHg7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MjJweDtmbGV4LXNocmluazowO30KLm9yZGVyLXJvdyAub3ItZHtmbGV4OjE7bWluLXdpZHRoOjA7fQoub3JkZXItcm93IC5vci1kIGg1e2ZvbnQtc2l6ZToxNC41cHg7Zm9udC13ZWlnaHQ6ODAwO30KLm9yZGVyLXJvdyAub3ItZCBwe2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6M3B4O30KLm9yZGVyLXJvdyAub3Itcnt0ZXh0LWFsaWduOmxlZnQ7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpmbGV4LWVuZDtnYXA6NnB4O30KLnN0LWJhZGdle2ZvbnQtc2l6ZToxMC41cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6M3B4IDlweDtib3JkZXItcmFkaXVzOjIwcHg7fQoub3ItciBie2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjkwMDt9CgovKiA9PT09PSBPcmRlciB0cmFja2luZyA9PT09PSAqLwoub3JkZXItaGVyb3tjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MThweDtwYWRkaW5nOjIycHg7bWFyZ2luLWJvdHRvbToxNnB4O2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjE2cHg7fQoub3JkZXItaGVybyAub2gtYXBwe2ZvbnQtc2l6ZToxMnB4O29wYWNpdHk6Ljk7Zm9udC13ZWlnaHQ6NzAwO30KLm9yZGVyLWhlcm8gaDJ7Zm9udC1zaXplOjIxcHg7Zm9udC13ZWlnaHQ6OTAwO21hcmdpbi10b3A6MnB4O30KLm9yZGVyLWhlcm8gcHtmb250LXNpemU6MTJweDtvcGFjaXR5Oi45MjttYXJnaW4tdG9wOjRweDt9Ci5vcmRlci1oZXJvIC5vaC10b3RhbHt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5vcmRlci1oZXJvIC5vaC10b3RhbCBzcGFue2ZvbnQtc2l6ZToyNnB4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5vcmRlci1oZXJvIC5vaC10b3RhbCBzbWFsbHtmb250LXNpemU6MTJweDtvcGFjaXR5Oi45O2Rpc3BsYXk6YmxvY2s7fQoudGltZWxpbmV7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MDt9Ci50bC1zdGVwe2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjE0cHg7cG9zaXRpb246cmVsYXRpdmU7cGFkZGluZy1ib3R0b206MjBweDt9Ci50bC1zdGVwOm5vdCg6bGFzdC1jaGlsZCk6OmJlZm9yZXtjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2luc2V0LWlubGluZS1zdGFydDoxOHB4O3RvcDozNnB4O2JvdHRvbTowO3dpZHRoOjJweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpO30KLnRsLXN0ZXAuZG9uZTpub3QoOmxhc3QtY2hpbGQpOjpiZWZvcmV7YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7fQoudGwtZG90e3dpZHRoOjM4cHg7aGVpZ2h0OjM4cHg7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDp2YXIoLS1iZyk7Ym9yZGVyOjJweCBzb2xpZCB2YXIoLS1saW5lKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToxN3B4O2ZsZXgtc2hyaW5rOjA7ei1pbmRleDoxO30KLnRsLXN0ZXAuZG9uZSAudGwtZG90e2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Ym9yZGVyLWNvbG9yOnZhcigtLWdyZWVuKTt9Ci50bC1zdGVwLmN1ciAudGwtZG90e2JhY2tncm91bmQ6I0VERTlGRTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQxKTthbmltYXRpb246cHVsc2UgMS40cyBpbmZpbml0ZTt9CkBrZXlmcmFtZXMgcHVsc2V7MCUsMTAwJXtib3gtc2hhZG93OjAgMCAwIDAgcmdiYSgxMDksNDAsMjE3LC4zKTt9NTAle2JveC1zaGFkb3c6MCAwIDAgOHB4IHJnYmEoMTA5LDQwLDIxNywwKTt9fQoudGwtbHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO30KLnRsLWwgYntmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQoudGwtc3RlcDpub3QoLmRvbmUpIC50bC1sIGJ7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjYwMDt9Ci50bC1sIHNwYW57Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO30KCi8qID09PT09IFJhdGluZyA9PT09PSAqLwoucmF0ZS1zdGFyc3tmb250LXNpemU6MzJweDtjb2xvcjp2YXIoLS1nb2xkKTtjdXJzb3I6cG9pbnRlcjtsZXR0ZXItc3BhY2luZzo0cHg7bWFyZ2luLWJvdHRvbToxMHB4O30KLnJhdGUtc3RhcnMgc3BhbntjdXJzb3I6cG9pbnRlcjt9Ci5maWVsZCB0ZXh0YXJlYXt3aWR0aDoxMDAlO2JvcmRlcjoxLjVweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjExcHg7cGFkZGluZzoxMXB4IDEzcHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXNpemU6MTMuNXB4O291dGxpbmU6bm9uZTtyZXNpemU6dmVydGljYWw7fQoucmV2aWV3c3tkaXNwbGF5OmdyaWQ7Z2FwOjEwcHg7fQoucmV2aWV3e2JhY2tncm91bmQ6I2ZmZjtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjEycHggMTRweDt9Ci5yZXZpZXcgLnJ2LXRvcHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO30KLnJldmlldyAucnYtdG9wIGJ7Zm9udC1zaXplOjEzcHg7fQoucmV2aWV3IC5ydi1zdGFyc3tjb2xvcjp2YXIoLS1nb2xkKTtmb250LXNpemU6MTNweDt9Ci5yZXZpZXcgcHtmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjVweDt9CgovKiA9PT09PSBDb3Vwb25zIHNjcmVlbiA9PT09PSAqLwouY291cG9uLWNhcmR7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO30KLmNvdXBvbi1jYXJkIC5jYy1jb2Rle2ZvbnQtc2l6ZToxOHB4O2ZvbnQtd2VpZ2h0OjkwMDtjb2xvcjp2YXIoLS1icmFuZDEpO2xldHRlci1zcGFjaW5nOjFweDtib3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWJyYW5kMik7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6OHB4O2JhY2tncm91bmQ6I0VFRjJGRjt9Ci5jb3Vwb24tY2FyZCBwe2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW46OXB4IDA7fQouY291cG9uLWNhcmQgLmNjLXRhZ3tmb250LXNpemU6MTFweDtmb250LXdlaWdodDo4MDA7YmFja2dyb3VuZDp2YXIoLS1ncmVlbi1zb2Z0KTtjb2xvcjp2YXIoLS1ncmVlbik7cGFkZGluZzo0cHggMTBweDtib3JkZXItcmFkaXVzOjIwcHg7fQoKLyogPT09PT0gQWRtaW4gPT09PT0gKi8KLmFkbS10YWJze2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO21hcmdpbi1ib3R0b206MThweDt9Ci5hZG0tdGFicyBidXR0b257Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjMwcHg7cGFkZGluZzo4cHggMTZweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7Y3Vyc29yOnBvaW50ZXI7fQouYWRtLXRhYnMgYnV0dG9uLm9ue2JhY2tncm91bmQ6dmFyKC0tYnJhbmQxKTtib3JkZXItY29sb3I6dmFyKC0tYnJhbmQxKTtjb2xvcjojZmZmO30KLnN0YXQtZ3JpZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdChhdXRvLWZpbGwsbWlubWF4KDE1MHB4LDFmcikpO2dhcDoxNHB4O21hcmdpbi1ib3R0b206MTBweDt9Ci5hZG0tcm93e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7cGFkZGluZzoxM3B4IDE1cHg7bWFyZ2luLWJvdHRvbToxMHB4O30KLmFkbS1yb3cgLnVpe2ZsZXg6MTttaW4td2lkdGg6MDt9Ci5hZG0tcm93IC51aSBoNXtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQouYWRtLXJvdyAudWkgcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDt9Ci5hZG0tYWN0e2Rpc3BsYXk6ZmxleDtnYXA6NnB4O30KLm1pbml7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjhweDtwYWRkaW5nOjdweCAxMXB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxMS41cHg7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6dmFyKC0taW5rKTt9Ci5taW5pOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1icmFuZDIpO2NvbG9yOnZhcigtLWJyYW5kMik7fQouYWRtLXNlbHtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czo5cHg7cGFkZGluZzo4cHggMTBweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTIuNXB4O2JhY2tncm91bmQ6I2ZmZjtjdXJzb3I6cG9pbnRlcjt9Ci5jb3Vwb24tZm9ybXttYXJnaW4tYm90dG9tOjE2cHg7fQouY2YtZ3JpZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdChhdXRvLWZpbGwsbWlubWF4KDE2MHB4LDFmcikpO2dhcDo5cHg7fQouY2YtZ3JpZCBpbnB1dCwuY2YtZ3JpZCBzZWxlY3R7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjEwcHggMTJweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtc2l6ZToxM3B4O291dGxpbmU6bm9uZTt9Ci5hZG0tcm93IC5jYy1jb2Rle2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjkwMDtjb2xvcjp2YXIoLS1icmFuZDEpO2JhY2tncm91bmQ6I0VFRjJGRjtib3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWJyYW5kMik7Ym9yZGVyLXJhZGl1czo4cHg7cGFkZGluZzo2cHggMTBweDtmbGV4LXNocmluazowO30KQG1lZGlhKG1heC13aWR0aDo1NjBweCl7IC5vcmRlci1oZXJve2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt0ZXh0LWFsaWduOmNlbnRlcjt9IC5hZG0tcm93e2ZsZXgtd3JhcDp3cmFwO30gfQo=" }, "auth.css": { "type": "text/css; charset=utf-8", "b64": "Lyog2LXZgdit2Kkg2KfZhNmF2LXYp9iv2YLYqSDZg9i12YHYrdipINmI2YrYqDog2KjYt9in2YLYqSDZgdmKINmF2YbYqti12YEg2K7ZhNmB2YrYqSDZhdiq2K/YsdmR2KzYqSAqLwouYXBwLmF1dGgtbW9kZSAjdG9wbmF2e2Rpc3BsYXk6bm9uZTt9Ci5hcHAuYXV0aC1tb2RlICNzY3JlZW57bWluLWhlaWdodDoxMDB2aDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO3BhZGRpbmc6MjRweDsKICBiYWNrZ3JvdW5kOnJhZGlhbC1ncmFkaWVudCgxMDAwcHggNjAwcHggYXQgODAlIC0xMCUsIzdjM2FlZCx0cmFuc3BhcmVudCksbGluZWFyLWdyYWRpZW50KDEzNWRlZywjNkQyOEQ5LCM0RjQ2RTUpO30KLmF1dGgtY2FyZHt3aWR0aDoxMDAlO21heC13aWR0aDo0MjBweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoyMnB4O292ZXJmbG93OmhpZGRlbjtib3gtc2hhZG93OjAgMzBweCA2MHB4IHJnYmEoNzYsMjksMTQ5LC4zNSk7fQouYXV0aC1oZXJve2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7Y29sb3I6I2ZmZjtwYWRkaW5nOjM4cHggMjZweCAyNnB4O3RleHQtYWxpZ246Y2VudGVyO30KLmF1dGgtaGVybyAubWt7d2lkdGg6NThweDtoZWlnaHQ6NThweDtib3JkZXItcmFkaXVzOjE2cHg7YmFja2dyb3VuZDojZmZmO2NvbG9yOnZhcigtLWJyYW5kMSk7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjI4cHg7bWFyZ2luOjAgYXV0byAxMnB4O2JveC1zaGFkb3c6MCA4cHggMjBweCByZ2JhKDAsMCwwLC4xOCk7fQouYXV0aC1oZXJvIGgxe2ZvbnQtc2l6ZToyM3B4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5hdXRoLWhlcm8gcHtvcGFjaXR5Oi45Mjtmb250LXNpemU6MTIuNXB4O21hcmdpbi10b3A6NnB4O2xpbmUtaGVpZ2h0OjEuNjt9Ci5hdXRoLWJvZHl7cGFkZGluZzoyNHB4O30KLmF1dGgtdGl0bGV7Zm9udC1zaXplOjE5cHg7Zm9udC13ZWlnaHQ6ODAwO21hcmdpbi1ib3R0b206NHB4O30KLmF1dGgtc3Vie2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi1ib3R0b206MThweDtsaW5lLWhlaWdodDoxLjc7fQouYnRuLXByaW1hcnl7d2lkdGg6MTAwJTtib3JkZXI6MDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTRweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTVweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5idG4tcHJpbWFyeTpkaXNhYmxlZHtvcGFjaXR5Oi42O2N1cnNvcjpkZWZhdWx0O30KLmF1dGgtbXNne2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjEwcHggMTNweDtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuNjtkaXNwbGF5Om5vbmU7fQouYXV0aC1tc2cuc2hvd3tkaXNwbGF5OmJsb2NrO30KLmF1dGgtbXNnLmVycntiYWNrZ3JvdW5kOiNGRUYyRjI7Y29sb3I6I0I5MUMxQzt9Ci5hdXRoLW1zZy5va3tiYWNrZ3JvdW5kOiNFQ0ZERjU7Y29sb3I6IzE2QTM0QTt9Ci5hdXRoLWxpbmtze21hcmdpbi10b3A6MThweDt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtsaW5lLWhlaWdodDoyO30KLmF1dGgtbGlua3MgYXtjb2xvcjp2YXIoLS1icmFuZDIpO2ZvbnQtd2VpZ2h0OjgwMDt9Ci5jb2RlLWlucHV0IGlucHV0e3RleHQtYWxpZ246Y2VudGVyO2xldHRlci1zcGFjaW5nOjEwcHg7Zm9udC1zaXplOjI0cHg7Zm9udC13ZWlnaHQ6OTAwO30KLmRldi1oaW50e2JhY2tncm91bmQ6I0ZFRjNDNztjb2xvcjojOTI0MDBFO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjEycHggMTNweDtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuODt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5kZXYtaGludCAuY3tmb250LXNpemU6MjJweDtmb250LXdlaWdodDo5MDA7bGV0dGVyLXNwYWNpbmc6NHB4O2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDo0cHg7fQo=" }, "app.js": { "type": "text/javascript; charset=utf-8", "b64": "LyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgINiz2YjYqNixINii2Kgg4oCUINmI2KfYrNmH2Kkg2KfZhNmF2YbYtdipINin2YTZg9in2YXZhNipCiAgINmF2LXYp9iv2YLYqSDCtyDYqti12YHZkditIMK3INmF2YLYp9ix2YbYqSDCtyDYt9mE2KjYp9iqIMK3INiq2KrYqNmR2Lkgwrcg2KrZgtmK2YrZhdin2Kogwrcg2YPZiNio2YjZhtin2KoKICAgwrcg2KXYtNi52KfYsdin2Kogwrcg2YTZiNit2Kkg2KLYr9mF2YYKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmNvbnN0IHN0YXRlID0gewogIHVzZXI6IG51bGwsIGNmZzogbnVsbCwgc3RvcmVzOiBbXSwKICB0YWI6ICdob21lJywgc2NyZWVuOiAnaG9tZScsIG1vZGU6ICdhbGwnLAogIHN0b3JlOiBudWxsLCBjYXJ0OiB7fSwgc3Viczoge30sIGNtcDogbnVsbCwgcXVlcnk6ICcnLAogIGF1dGg6IHsgdmlldzogJ2xvZ2luJywgZW1haWw6ICcnLCBkZXZDb2RlOiBudWxsIH0sCiAgb3JkZXJzOiBbXSwgb3JkZXI6IG51bGwsIG9yZGVyUG9sbDogbnVsbCwKICBub3RpZmljYXRpb25zOiBbXSwgbm90aWZVbnJlYWQ6IDAsIG5vdGlmT3BlbjogZmFsc2UsCiAgY2hlY2tvdXQ6IG51bGwsIGNvdXBvbjogbnVsbCwgY291cG9uTXNnOiAnJywKICBhZG1pbjogeyB0YWI6ICdzdGF0cycsIHN0YXRzOiBudWxsLCB1c2VyczogbnVsbCwgcmVzdGF1cmFudHM6IG51bGwsIG9yZGVyczogbnVsbCwgY291cG9uczogbnVsbCB9LAp9OwoKY29uc3QgJCA9IGlkID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKY29uc3QgbW9uZXkgPSBuID0+IChNYXRoLnJvdW5kKG4gKiAxMDApIC8gMTAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnLCB7IG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMCwgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyIH0pOwpjb25zdCBhcHBzID0gKCkgPT4gc3RhdGUuY2ZnLmFwcHM7CmNvbnN0IGNhcnRDb3VudCA9ICgpID0+IE9iamVjdC52YWx1ZXMoc3RhdGUuY2FydCkucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7CmNvbnN0IGZsYXQgPSBzID0+IHMubWVudS5mbGF0TWFwKGcgPT4gZy5pdGVtcyk7CmNvbnN0IGNhcnRTdWJ0b3RhbCA9IHMgPT4gT2JqZWN0LmVudHJpZXMoc3RhdGUuY2FydCkucmVkdWNlKCh0LCBbaWQsIHFdKSA9PiB7IGNvbnN0IGl0ID0gZmxhdChzKS5maW5kKGkgPT4gaS5pZCA9PT0gaWQpOyByZXR1cm4gdCArIChpdCA/IGl0LnAgKiBxIDogMCk7IH0sIDApOwpjb25zdCBpc0ZhdiA9IGlkID0+IChzdGF0ZS51c2VyPy5mYXZvcml0ZXMgfHwgW10pLmluY2x1ZGVzKGlkKTsKY29uc3QgdmFsID0gaWQgPT4gKCQoaWQpID8gJChpZCkudmFsdWUudHJpbSgpIDogJycpOwpjb25zdCBlc2MgPSBzID0+IFN0cmluZyhzID09IG51bGwgPyAnJyA6IHMpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC8iL2csICcmcXVvdDsnKTsKCmNvbnN0IFNUQVRVU19BUiA9IHsgcGVuZGluZzogJ9io2KfZhtiq2LjYp9ixINin2YTYqtij2YPZitivJywgY29uZmlybWVkOiAn2KrZhSDYp9mE2KrYo9mD2YrYrycsIHByZXBhcmluZzogJ9mC2YrYryDYp9mE2KrYrNmH2YrYsicsIG9uX3RoZV93YXk6ICfZgdmKINin2YTYt9ix2YrZgicsIGRlbGl2ZXJlZDogJ9iq2YUg2KfZhNiq2YjYtdmK2YQnLCBjYW5jZWxsZWQ6ICfZhdmE2LrZiicgfTsKY29uc3QgU1RBVFVTX0ZMT1cgPSBbWydwZW5kaW5nJywgJ/Cfp74nXSwgWydjb25maXJtZWQnLCAn4pyFJ10sIFsncHJlcGFyaW5nJywgJ/CfkajigI3wn42zJ10sIFsnb25fdGhlX3dheScsICfwn5u1J10sIFsnZGVsaXZlcmVkJywgJ/CfjoknXV07CmNvbnN0IHN0YXR1c0NvbG9yID0gcyA9PiBzID09PSAnZGVsaXZlcmVkJyA/ICd2YXIoLS1ncmVlbiknIDogcyA9PT0gJ2NhbmNlbGxlZCcgPyAnI0I5MUMxQycgOiAndmFyKC0tYnJhbmQyKSc7Cgphc3luYyBmdW5jdGlvbiBhcGkocGF0aCwgb3B0cyA9IHt9LCBfdHJ5ID0gMCkgewogIGxldCByOwogIHRyeSB7IHIgPSBhd2FpdCBmZXRjaChwYXRoLCB7IGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwgLi4ub3B0cyB9KTsgfQogIGNhdGNoIChlKSB7IGlmIChfdHJ5IDwgMykgeyBhd2FpdCBuZXcgUHJvbWlzZShzID0+IHNldFRpbWVvdXQocywgMTgwMCkpOyByZXR1cm4gYXBpKHBhdGgsIG9wdHMsIF90cnkgKyAxKTsgfSB0aHJvdyBuZXcgRXJyb3IoJ9iq2LnYsNmR2LEg2KfZhNin2KrYtdin2YQg2KjYp9mE2K7Yp9iv2YXYjCDYrdin2YjZhCDYqNi52K8g2YLZhNmK2YQnKTsgfQogIGNvbnN0IGN0ID0gci5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykgfHwgJyc7CiAgY29uc3QgaiA9IGN0LmluY2x1ZGVzKCdhcHBsaWNhdGlvbi9qc29uJykgPyBhd2FpdCByLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKSA6IHt9OwogIGlmICghci5vaykgeyBpZiAoIWouZXJyb3IgJiYgKHIuc3RhdHVzID49IDUwMCB8fCByLnN0YXR1cyA9PT0gNDA0KSAmJiBfdHJ5IDwgMykgeyBhd2FpdCBuZXcgUHJvbWlzZShzID0+IHNldFRpbWVvdXQocywgMTgwMCkpOyByZXR1cm4gYXBpKHBhdGgsIG9wdHMsIF90cnkgKyAxKTsgfSB0aHJvdyBuZXcgRXJyb3Ioai5lcnJvciB8fCAoJ9iu2LfYoyAnICsgci5zdGF0dXMpKTsgfQogIHJldHVybiBqOwp9CgovKiAtLS0tLS0tLS0tINil2YLZhNin2LkgLS0tLS0tLS0tLSAqLwphc3luYyBmdW5jdGlvbiBpbml0KCkgewogIHRyeSB7IGNvbnN0IG1lID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbWUnKTsgaWYgKG1lLnVzZXIpIHsgc3RhdGUudXNlciA9IG1lLnVzZXI7IGF3YWl0IGxvYWRBcHAoKTsgcmV0dXJuOyB9IH0KICBjYXRjaCAoZSkgeyAkKCd0b3BuYXYnKS5pbm5lckhUTUwgPSAnJzsgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7imqDvuI88L2Rpdj48aDM+2KrYudiw2ZHYsSDYp9mE2KfYqti12KfZhCDYqNin2YTYrtin2K/ZhTwvaDM+PHA+2K3Yr9mR2Ksg2KfZhNi12YHYrdipINio2LnYryDZgtmE2YrZhC48L3A+PC9kaXY+YDsgcmV0dXJuOyB9CiAgcmVuZGVyKCk7Cn0KYXN5bmMgZnVuY3Rpb24gbG9hZEFwcCgpIHsKICBjb25zdCBbY2ZnLCBzdG9yZXMsIGZhdl0gPSBhd2FpdCBQcm9taXNlLmFsbChbYXBpKCcvYXBpL2NvbmZpZycpLCBhcGkoJy9hcGkvc3RvcmVzJyksIGFwaSgnL2FwaS9wcm9maWxlL2Zhdm9yaXRlcycpXSk7CiAgc3RhdGUuY2ZnID0gY2ZnOyBzdGF0ZS5zdG9yZXMgPSBzdG9yZXM7IHN0YXRlLnVzZXIuZmF2b3JpdGVzID0gZmF2LmZhdm9yaXRlczsKICBsb2FkTm90aWZpY2F0aW9ucygpOwogIGlmICghc3RhdGUuX25vdGlmVGltZXIpIHN0YXRlLl9ub3RpZlRpbWVyID0gc2V0SW50ZXJ2YWwobG9hZE5vdGlmaWNhdGlvbnMsIDIwMDAwKTsKICBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdob21lJzsgcmVuZGVyKCk7Cn0KYXN5bmMgZnVuY3Rpb24gbG9hZE5vdGlmaWNhdGlvbnMoKSB7CiAgdHJ5IHsgY29uc3QgbiA9IGF3YWl0IGFwaSgnL2FwaS9ub3RpZmljYXRpb25zJyk7IHN0YXRlLm5vdGlmaWNhdGlvbnMgPSBuLm5vdGlmaWNhdGlvbnM7IHN0YXRlLm5vdGlmVW5yZWFkID0gbi51bnJlYWQ7IGNvbnN0IGIgPSAkKCdub3RpZkJhZGdlJyk7IGlmIChiKSBiLnN0eWxlLmRpc3BsYXkgPSBuLnVucmVhZCA/ICdncmlkJyA6ICdub25lJywgYi50ZXh0Q29udGVudCA9IG4udW5yZWFkOyB9CiAgY2F0Y2gge30KfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09INin2YTZhdi12KfYr9mC2KkgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHZpZXdBdXRoKCkgewogIGNvbnN0IHYgPSBzdGF0ZS5hdXRoLnZpZXc7CiAgY29uc3QgaGVybyA9IGA8ZGl2IGNsYXNzPSJhdXRoLWhlcm8iPjxkaXYgY2xhc3M9Im1rIj5TPC9kaXY+PGgxPtiz2YjYqNixINii2Kg8L2gxPjxwPtmF2YbYtdipINiq2YLYp9ix2YYg2LfZhNio2YMg2LnYqNixINmD2YQg2KrYt9io2YrZgtin2Kog2KfZhNiq2YjYtdmK2YQg2YjYqtiu2KrYp9ixINmE2YMg2KfZhNij2LHYrti1PC9wPjwvZGl2PmA7CiAgY29uc3QgbXNnID0gYDxkaXYgY2xhc3M9ImF1dGgtbXNnIGVyciIgaWQ9ImF1dGhFcnIiPjwvZGl2PmA7CiAgY29uc3QgZGV2ID0gc3RhdGUuYXV0aC5kZXZDb2RlID8gYDxkaXYgY2xhc3M9ImRldi1oaW50Ij7wn5OnINmI2LbYuSDYqtis2LHZitio2Yog4oCUINix2YXYstmDINmH2Yg6PGJyPjxzcGFuIGNsYXNzPSJjIj4ke3N0YXRlLmF1dGguZGV2Q29kZX08L3NwYW4+PC9kaXY+YCA6ICcnOwogIGxldCBiID0gJyc7CiAgaWYgKHYgPT09ICdyZWdpc3RlcicpIGIgPSBgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2KXZhti02KfYoSDYrdiz2KfYqDwvZGl2PjxkaXYgY2xhc3M9ImF1dGgtc3ViIj7Ys9is2ZHZhCDZhNmE2YjYtdmI2YQg2KXZhNmJINin2YTZhdmG2LXYqS48L2Rpdj4ke21zZ30KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2KfZhNin2LPZhTwvbGFiZWw+PGlucHV0IGlkPSJyTmFtZSIgcGxhY2Vob2xkZXI9Itin2LPZhdmDIi8+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJyRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIvPjwvZGl2PgogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Zg9mE2YXYqSDYp9mE2YXYsdmI2LE8L2xhYmVsPjxpbnB1dCBpZD0iclBhc3MiIHR5cGU9InBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i2agg2KPYrdix2YEg2LnZhNmJINin2YTYo9mC2YQiLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0ickJ0biIgb25jbGljaz0iZG9SZWdpc3RlcigpIj7YpdmG2LTYp9ihINit2LPYp9ioPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj7ZhNiv2YrZgyDYrdiz2KfYqNifIDxhIG9uY2xpY2s9ImF1dGhWaWV3KCdsb2dpbicpIj7Ys9is2ZHZhCDYp9mE2K/YrtmI2YQ8L2E+PC9kaXY+YDsKICBlbHNlIGlmICh2ID09PSAndmVyaWZ5JykgYiA9IGA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7YqtmB2LnZitmEINin2YTYrdiz2KfYqDwvZGl2PjxkaXYgY2xhc3M9ImF1dGgtc3ViIj7Yo9iv2K7ZhCDYp9mE2LHZhdiyINin2YTZhdix2LPZhCDYpdmE2YkgPGI+JHtlc2Moc3RhdGUuYXV0aC5lbWFpbCl9PC9iPjwvZGl2PiR7ZGV2fSR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQgY29kZS1pbnB1dCI+PGlucHV0IGlkPSJ2Q29kZSIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0idkJ0biIgb25jbGljaz0iZG9WZXJpZnkoKSI+2KrZgdi52YrZhCDZiNiv2K7ZiNmEPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJkb1Jlc2VuZCgpIj7Ypdi52KfYr9ipINil2LHYs9in2YQg2KfZhNix2YXYsjwvYT4gwrcgPGEgb25jbGljaz0iYXV0aFZpZXcoJ2xvZ2luJykiPtix2KzZiNi5PC9hPjwvZGl2PmA7CiAgZWxzZSBpZiAodiA9PT0gJ2ZvcmdvdCcpIGIgPSBgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2YbYs9mK2Kog2YPZhNmF2Kkg2KfZhNmF2LHZiNixPC9kaXY+PGRpdiBjbGFzcz0iYXV0aC1zdWIiPtmG2LHYs9mEINmE2YMg2LHZhdiyINil2LnYp9iv2Kkg2KfZhNiq2LnZitmK2YYuPC9kaXY+JHttc2d9CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJmRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIvPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIGlkPSJmQnRuIiBvbmNsaWNrPSJkb0ZvcmdvdCgpIj7Ypdix2LPYp9mEINin2YTYsdmF2LI8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPjxhIG9uY2xpY2s9ImF1dGhWaWV3KCdsb2dpbicpIj7Ysdis2YjYuSDZhNiq2LPYrNmK2YQg2KfZhNiv2K7ZiNmEPC9hPjwvZGl2PmA7CiAgZWxzZSBpZiAodiA9PT0gJ3Jlc2V0JykgYiA9IGA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7Zg9mE2YXYqSDZhdix2YjYsSDYrNiv2YrYr9ipPC9kaXY+PGRpdiBjbGFzcz0iYXV0aC1zdWIiPtin2YTYsdmF2LIg2KPZj9ix2LPZhCDYpdmE2YkgPGI+JHtlc2Moc3RhdGUuYXV0aC5lbWFpbCl9PC9iPjwvZGl2PiR7ZGV2fSR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQgY29kZS1pbnB1dCI+PGlucHV0IGlkPSJzQ29kZSIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiLz48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2YPZhNmF2Kkg2KfZhNmF2LHZiNixINin2YTYrNiv2YrYr9ipPC9sYWJlbD48aW5wdXQgaWQ9InNQYXNzIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9ItmoINij2K3YsdmBINi52YTZiSDYp9mE2KPZgtmEIi8+PC9kaXY+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4tcHJpbWFyeSIgaWQ9InNCdG4iIG9uY2xpY2s9ImRvUmVzZXQoKSI+2K3Zgdi4INmI2KfZhNiv2K7ZiNmEPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJhdXRoVmlldygnbG9naW4nKSI+2LHYrNmI2Lk8L2E+PC9kaXY+YDsKICBlbHNlIGIgPSBgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2KrYs9is2YrZhCDYp9mE2K/YrtmI2YQ8L2Rpdj48ZGl2IGNsYXNzPSJhdXRoLXN1YiI+2KPZh9mE2YvYpyDYqNi52YjYr9iq2YMg8J+RizwvZGl2PiR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Yp9mE2KjYsdmK2K8g2KfZhNil2YTZg9iq2LHZiNmG2Yo8L2xhYmVsPjxpbnB1dCBpZD0ibEVtYWlsIiB0eXBlPSJlbWFpbCIgcGxhY2Vob2xkZXI9InlvdUBlbWFpbC5jb20iLz48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2YPZhNmF2Kkg2KfZhNmF2LHZiNixPC9sYWJlbD48aW5wdXQgaWQ9ImxQYXNzIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAouKAouKAoiIvPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIGlkPSJsQnRuIiBvbmNsaWNrPSJkb0xvZ2luKCkiPtiv2K7ZiNmEPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJhdXRoVmlldygnZm9yZ290JykiPtmG2LPZitiqINmD2YTZhdipINin2YTZhdix2YjYsdifPC9hPjxicj7ZhdinINi52YbYr9mDINit2LPYp9io2J8gPGEgb25jbGljaz0iYXV0aFZpZXcoJ3JlZ2lzdGVyJykiPtij2YbYtNimINit2LPYp9ioPC9hPjwvZGl2PmA7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJhdXRoLWNhcmQiPiR7aGVyb308ZGl2IGNsYXNzPSJhdXRoLWJvZHkiPiR7Yn08L2Rpdj48L2Rpdj5gOwp9CmZ1bmN0aW9uIGF1dGhWaWV3KHYpIHsgc3RhdGUuYXV0aC52aWV3ID0gdjsgc3RhdGUuYXV0aC5kZXZDb2RlID0gbnVsbDsgcmVuZGVyKCk7IH0KZnVuY3Rpb24gc2V0RXJyKG0pIHsgY29uc3QgZSA9ICQoJ2F1dGhFcnInKTsgaWYgKGUpIHsgZS50ZXh0Q29udGVudCA9IG07IGUuY2xhc3NOYW1lID0gJ2F1dGgtbXNnIGVyciBzaG93JzsgfSB9CmZ1bmN0aW9uIGJ1c3koaWQsIG9uLCBsYWJlbCkgeyBjb25zdCBiID0gJChpZCk7IGlmIChiKSB7IGIuZGlzYWJsZWQgPSBvbjsgaWYgKG9uKSB7IGIuZGF0YXNldC50ID0gYi50ZXh0Q29udGVudDsgYi50ZXh0Q29udGVudCA9ICfij7MgLi4uJzsgfSBlbHNlIGIudGV4dENvbnRlbnQgPSBsYWJlbCB8fCBiLmRhdGFzZXQudDsgfSB9CmFzeW5jIGZ1bmN0aW9uIGRvUmVnaXN0ZXIoKSB7IGNvbnN0IG5hbWUgPSB2YWwoJ3JOYW1lJyksIGVtYWlsID0gdmFsKCdyRW1haWwnKSwgcGFzc3dvcmQgPSAkKCdyUGFzcycpPy52YWx1ZSB8fCAnJzsgaWYgKCFuYW1lIHx8ICFlbWFpbCB8fCAhcGFzc3dvcmQpIHJldHVybiBzZXRFcnIoJ9in2YXZhNijINmD2YQg2KfZhNit2YLZiNmEJyk7IGJ1c3koJ3JCdG4nLCB0cnVlKTsgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL3JlZ2lzdGVyJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBuYW1lLCBlbWFpbCwgcGFzc3dvcmQgfSkgfSk7IHN0YXRlLmF1dGguZW1haWwgPSByLmVtYWlsOyBzdGF0ZS5hdXRoLmRldkNvZGUgPSByLmRldkNvZGUgfHwgbnVsbDsgc3RhdGUuYXV0aC52aWV3ID0gJ3ZlcmlmeSc7IHJlbmRlcigpOyB9IGNhdGNoIChlKSB7IGJ1c3koJ3JCdG4nLCBmYWxzZSwgJ9il2YbYtNin2KEg2K3Ys9in2KgnKTsgc2V0RXJyKGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBkb1ZlcmlmeSgpIHsgY29uc3QgY29kZSA9IHZhbCgndkNvZGUnKTsgaWYgKGNvZGUubGVuZ3RoIDwgNCkgcmV0dXJuIHNldEVycign2KPYr9iu2YQg2KfZhNix2YXYsicpOyBidXN5KCd2QnRuJywgdHJ1ZSk7IHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC92ZXJpZnknLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBzdGF0ZS5hdXRoLmVtYWlsLCBjb2RlIH0pIH0pOyBzdGF0ZS51c2VyID0gci51c2VyOyBhd2FpdCBsb2FkQXBwKCk7IH0gY2F0Y2ggKGUpIHsgYnVzeSgndkJ0bicsIGZhbHNlLCAn2KrZgdi52YrZhCDZiNiv2K7ZiNmEJyk7IHNldEVycihlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gZG9SZXNlbmQoKSB7IHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZXNlbmQnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBzdGF0ZS5hdXRoLmVtYWlsIH0pIH0pOyBzdGF0ZS5hdXRoLmRldkNvZGUgPSByLmRldkNvZGUgfHwgbnVsbDsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgc2V0RXJyKGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBkb0xvZ2luKCkgeyBjb25zdCBlbWFpbCA9IHZhbCgnbEVtYWlsJyksIHBhc3N3b3JkID0gJCgnbFBhc3MnKT8udmFsdWUgfHwgJyc7IGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSByZXR1cm4gc2V0RXJyKCfYo9iv2K7ZhCDYp9mE2KjYsdmK2K8g2YjZg9mE2YXYqSDYp9mE2YXYsdmI2LEnKTsgYnVzeSgnbEJ0bicsIHRydWUpOyB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbG9naW4nLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsLCBwYXNzd29yZCB9KSB9KTsgc3RhdGUudXNlciA9IHIudXNlcjsgYXdhaXQgbG9hZEFwcCgpOyB9IGNhdGNoIChlKSB7IGJ1c3koJ2xCdG4nLCBmYWxzZSwgJ9iv2K7ZiNmEJyk7IGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ9mB2LnZkdmEJykpIHsgc3RhdGUuYXV0aC5lbWFpbCA9IGVtYWlsOyBzdGF0ZS5hdXRoLnZpZXcgPSAndmVyaWZ5JzsgcmVuZGVyKCk7IHNldEVycign2YHYudmR2YQg2K3Ys9in2KjZgyDYo9mI2YTZi9inJyk7IH0gZWxzZSBzZXRFcnIoZS5tZXNzYWdlKTsgfSB9CmFzeW5jIGZ1bmN0aW9uIGRvRm9yZ290KCkgeyBjb25zdCBlbWFpbCA9IHZhbCgnZkVtYWlsJyk7IGlmICghZW1haWwpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINio2LHZitiv2YMnKTsgYnVzeSgnZkJ0bicsIHRydWUpOyB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvZm9yZ290JywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbCB9KSB9KTsgc3RhdGUuYXV0aC5lbWFpbCA9IGVtYWlsOyBzdGF0ZS5hdXRoLmRldkNvZGUgPSByLmRldkNvZGUgfHwgbnVsbDsgc3RhdGUuYXV0aC52aWV3ID0gJ3Jlc2V0JzsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgYnVzeSgnZkJ0bicsIGZhbHNlLCAn2KXYsdiz2KfZhCDYp9mE2LHZhdiyJyk7IHNldEVycihlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gZG9SZXNldCgpIHsgY29uc3QgY29kZSA9IHZhbCgnc0NvZGUnKSwgcGFzc3dvcmQgPSAkKCdzUGFzcycpPy52YWx1ZSB8fCAnJzsgaWYgKGNvZGUubGVuZ3RoIDwgNCB8fCAhcGFzc3dvcmQpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINin2YTYsdmF2LIg2YjZg9mE2YXYqSDYp9mE2YXYsdmI2LEnKTsgYnVzeSgnc0J0bicsIHRydWUpOyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZXNldCcsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IHN0YXRlLmF1dGguZW1haWwsIGNvZGUsIHBhc3N3b3JkIH0pIH0pOyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbG9naW4nLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBzdGF0ZS5hdXRoLmVtYWlsLCBwYXNzd29yZCB9KSB9KTsgc3RhdGUudXNlciA9IHIudXNlcjsgYXdhaXQgbG9hZEFwcCgpOyB9IGNhdGNoIChlKSB7IGJ1c3koJ3NCdG4nLCBmYWxzZSwgJ9it2YHYuCDZiNin2YTYr9iu2YjZhCcpOyBzZXRFcnIoZS5tZXNzYWdlKTsgfSB9CmFzeW5jIGZ1bmN0aW9uIGRvTG9nb3V0KCkgeyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYXV0aC9sb2dvdXQnLCB7IG1ldGhvZDogJ1BPU1QnIH0pOyB9IGNhdGNoIHt9IGNsZWFySW50ZXJ2YWwoc3RhdGUuX25vdGlmVGltZXIpOyBzdGF0ZS5fbm90aWZUaW1lciA9IG51bGw7IGNsZWFySW50ZXJ2YWwoc3RhdGUub3JkZXJQb2xsKTsgc3RhdGUudXNlciA9IG51bGw7IHN0YXRlLmF1dGggPSB7IHZpZXc6ICdsb2dpbicsIGVtYWlsOiAnJywgZGV2Q29kZTogbnVsbCB9OyByZW5kZXIoKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09INi02LHZiti3INi52YTZiNmKID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiB0b3BOYXYoKSB7CiAgY29uc3QgdGFicyA9IFtbJ2hvbWUnLCAn2KfZhNix2KbZitiz2YrYqSddLCBbJ29mZmVycycsICfYp9mE2LnYsdmI2LYnXSwgWydvcmRlcnMnLCAn2LfZhNio2KfYqtmKJ10sIFsnYWNjb3VudCcsICfYrdiz2KfYqNmKJ11dOwogIHJldHVybiBgPGRpdiBjbGFzcz0ibmF2LWlubmVyIj4KICAgIDxkaXYgY2xhc3M9ImJyYW5kIiBvbmNsaWNrPSJnb0hvbWUoKSI+PHNwYW4gY2xhc3M9Im1hcmsiPlM8L3NwYW4+INiz2YjYqNixINii2Kg8L2Rpdj4KICAgIDxuYXYgY2xhc3M9Im5hdi1saW5rcyI+JHt0YWJzLm1hcCgoW2ssIGxdKSA9PiBgPGEgY2xhc3M9IiR7c3RhdGUudGFiID09PSBrID8gJ2FjdGl2ZScgOiAnJ30iIG9uY2xpY2s9InNldFRhYignJHtrfScpIj4ke2x9PC9hPmApLmpvaW4oJycpfTwvbmF2PgogICAgPGRpdiBjbGFzcz0ibmF2LXJpZ2h0Ij4KICAgICAgPGJ1dHRvbiBjbGFzcz0iYmVsbCIgb25jbGljaz0idG9nZ2xlTm90aWYoKSI+8J+UlDxzcGFuIGNsYXNzPSJuYmFkZ2UiIGlkPSJub3RpZkJhZGdlIiBzdHlsZT0iZGlzcGxheToke3N0YXRlLm5vdGlmVW5yZWFkID8gJ2dyaWQnIDogJ25vbmUnfSI+JHtzdGF0ZS5ub3RpZlVucmVhZH08L3NwYW4+PC9idXR0b24+CiAgICAgIDxzcGFuIGNsYXNzPSJsb2MtY2hpcCI+8J+TjSAke2VzYygoc3RhdGUudXNlci5hZGRyZXNzIHx8IHN0YXRlLmNmZy5sb2NhdGlvbikuc3BsaXQoJ9iMJylbMF0pfTwvc3Bhbj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuLW91dCIgb25jbGljaz0iZG9Mb2dvdXQoKSI+2K7YsdmI2Kw8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gbm90aWZQYW5lbCgpIHsKICBpZiAoIXN0YXRlLm5vdGlmT3BlbikgcmV0dXJuICcnOwogIGNvbnN0IGxpc3QgPSBzdGF0ZS5ub3RpZmljYXRpb25zLmxlbmd0aCA/IHN0YXRlLm5vdGlmaWNhdGlvbnMubWFwKG4gPT4gYDxkaXYgY2xhc3M9Im5vdGlmICR7bi5yZWFkID8gJycgOiAndW5yZWFkJ30iPjxzcGFuIGNsYXNzPSJuaSI+JHtuLmljb24gfHwgJ/CflJQnfTwvc3Bhbj48ZGl2PjxwPiR7ZXNjKG4udGV4dCl9PC9wPjxzcGFuIGNsYXNzPSJudCI+JHt0aW1lQWdvKG4uY3JlYXRlZF9hdCl9PC9zcGFuPjwvZGl2PjwvZGl2PmApLmpvaW4oJycpIDogYDxkaXYgY2xhc3M9Im5vdGlmLWVtcHR5Ij7ZhNinINil2LTYudin2LHYp9iqPC9kaXY+YDsKICByZXR1cm4gYDxkaXYgY2xhc3M9Im5vdGlmLXBvcCI+PGRpdiBjbGFzcz0ibm90aWYtaGVhZCI+2KfZhNil2LTYudin2LHYp9iqPC9kaXY+JHtsaXN0fTwvZGl2PmA7Cn0KZnVuY3Rpb24gdGltZUFnbyhkKSB7IGNvbnN0IHMgPSAoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGQpLmdldFRpbWUoKSkgLyAxMDAwOyBpZiAocyA8IDYwKSByZXR1cm4gJ9in2YTYotmGJzsgaWYgKHMgPCAzNjAwKSByZXR1cm4gTWF0aC5mbG9vcihzIC8gNjApICsgJyDYryc7IGlmIChzIDwgODY0MDApIHJldHVybiBNYXRoLmZsb29yKHMgLyAzNjAwKSArICcg2LMnOyByZXR1cm4gTWF0aC5mbG9vcihzIC8gODY0MDApICsgJyDZitmI2YUnOyB9CgovKiAtLS0tLS0tLS0tINij2K/ZiNin2KogLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBhcHBMb2dvKGlkLCBzaXplKSB7IGNvbnN0IGEgPSBhcHBzKClbaWRdOyByZXR1cm4gYDxkaXYgY2xhc3M9ImFsb2dvIiBzdHlsZT0iYmFja2dyb3VuZDoke2EuY29sb3J9O2NvbG9yOiR7YS50ZXh0fTt3aWR0aDoke3NpemV9cHg7aGVpZ2h0OiR7c2l6ZX1weCI+JHthLnNob3J0fTwvZGl2PmA7IH0KZnVuY3Rpb24gc2hhZGUoaGV4LCBwKSB7IGhleCA9IGhleC5yZXBsYWNlKCcjJywgJycpOyBjb25zdCBuID0gcGFyc2VJbnQoaGV4LCAxNik7IGxldCByID0gKG4gPj4gMTYpICYgMjU1LCBnID0gKG4gPj4gOCkgJiAyNTUsIGIgPSBuICYgMjU1OyByID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByICsgciAqIHAgLyAxMDApKTsgZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgZyArIGcgKiBwIC8gMTAwKSk7IGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIgKyBiICogcCAvIDEwMCkpOyByZXR1cm4gJyMnICsgKCgxIDw8IDI0KSArIChNYXRoLnJvdW5kKHIpIDw8IDE2KSArIChNYXRoLnJvdW5kKGcpIDw8IDgpICsgTWF0aC5yb3VuZChiKSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpOyB9CmZ1bmN0aW9uIHN0YXJzKG4pIHsgcmV0dXJuICfimIXimIXimIXimIXimIUnLnNsaWNlKDAsIE1hdGgucm91bmQobikpICsgJ+KYhuKYhuKYhuKYhuKYhicuc2xpY2UoMCwgNSAtIE1hdGgucm91bmQobikpOyB9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0g2KfZhNi02KfYtNin2KogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHZpZXdIb21lKCkgewogIGNvbnN0IGZvb2QgPSBzdGF0ZS5zdG9yZXMuZmlsdGVyKHMgPT4gcy5raW5kID09PSAnZm9vZCcpLCBncm9jID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gJ2dyb2NlcnknKTsKICBjb25zdCBmYXZzID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IGlzRmF2KHMuaWQpKTsgY29uc3QgcSA9IHN0YXRlLnF1ZXJ5LnRyaW0oKTsKICBjb25zdCBmaWx0ZXJlZCA9IHEgPyBzdGF0ZS5zdG9yZXMuZmlsdGVyKHMgPT4gcy5uYW1lLmluY2x1ZGVzKHEpIHx8IHMuY2F0LmluY2x1ZGVzKHEpKSA6IG51bGw7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPgogICAgPHNlY3Rpb24gY2xhc3M9Imhlcm8iPjxkaXYgY2xhc3M9Imhlcm8tdHh0Ij48aDE+2YjYtCDYqtio2Yog2KrYt9mE2Kgg2KfZhNmK2YjZhSDZitinICR7ZXNjKHN0YXRlLnVzZXIubmFtZS5zcGxpdCgnICcpWzBdKX3YnzwvaDE+PHA+2KfYt9mE2Kgg2YXYsdipINmI2K3Yr9ipIOKAlCDZhtmC2KfYsdmGINmE2YMg2KfZhNiz2LnYsSDZiNin2YTYqtmI2LXZitmEINmI2KfZhNiu2LXZiNmF2KfYqiDYudio2LEg2YPZhCDYp9mE2KrYt9io2YrZgtin2Kog2YjZhtiu2KrYp9ixINin2YTYo9ix2K7YtS48L3A+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InNlYXJjaCI+PHNwYW4+8J+UjTwvc3Bhbj48aW5wdXQgaWQ9InEiIHBsYWNlaG9sZGVyPSLYp9io2K3YqyDYudmGINmF2LfYudmFINij2Ygg2YXYqtis2LHigKYiIHZhbHVlPSIke2VzYyhxKX0iIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIi8+PC9kaXY+PC9zZWN0aW9uPgogICAgJHtzdGF0ZS5jZmcubGl2ZSA/IGA8ZGl2IGNsYXNzPSJsaXZlLXN0cmlwIj48c3BhbiBjbGFzcz0iZG90Ij7il488L3NwYW4+INix2KjYtyDYrdmKINmF2LkgJHtlc2Moc3RhdGUuY2ZnLmxpdmUuc291cmNlKX0gwrcg2KLYrtixINiq2K3Yr9mK2KsgJHtlc2Moc3RhdGUuY2ZnLmxpdmUuZmV0Y2hlZEF0KX08L2Rpdj5gIDogJyd9CiAgICAke2ZpbHRlcmVkID8gYDxoMyBjbGFzcz0ic2VjIj7Zhtiq2KfYptisINin2YTYqNit2KsgKCR7ZmlsdGVyZWQubGVuZ3RofSk8L2gzPiR7ZmlsdGVyZWQubGVuZ3RoID8gYDxkaXYgY2xhc3M9ImdyaWQiPiR7ZmlsdGVyZWQubWFwKHBsYWNlQ2FyZCkuam9pbignJyl9PC9kaXY+YCA6IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iZSI+8J+UjjwvZGl2PjxoMz7ZhdinINmE2YLZitmG2Kcg2YbYqtin2KbYrDwvaDM+PC9kaXY+YH1gIDogYAogICAgICA8ZGl2IGNsYXNzPSJjYXRzIj48ZGl2IGNsYXNzPSJjYXQgZm9vZCIgb25jbGljaz0ic2V0TW9kZSgnZm9vZCcpIj48ZGl2PjxoND7Yt9i52KfZhTwvaDQ+PHA+2YXYt9in2LnZhSDZiNmI2KzYqNin2Kog2LPYsdmK2LnYqTwvcD48L2Rpdj48c3BhbiBjbGFzcz0iZW1vamkiPvCfjZQ8L3NwYW4+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iY2F0IGdyb2NlcnkiIG9uY2xpY2s9InNldE1vZGUoJ2dyb2NlcnknKSI+PGRpdj48aDQ+2YXZgtin2LbZijwvaDQ+PHA+2KjZgtin2YTYqSDZiNiz2YjYqNix2YXYp9ix2YPYqjwvcD48L2Rpdj48c3BhbiBjbGFzcz0iZW1vamkiPvCfm5I8L3NwYW4+PC9kaXY+PC9kaXY+CiAgICAgICR7ZmF2cy5sZW5ndGggPyBgPGgzIGNsYXNzPSJzZWMiPuKdpO+4jyDZhdmB2LbZkdmE2KrZgzwvaDM+PGRpdiBjbGFzcz0iZ3JpZCI+JHtmYXZzLm1hcChwbGFjZUNhcmQpLmpvaW4oJycpfTwvZGl2PmAgOiAnJ30KICAgICAgPGgzIGNsYXNzPSJzZWMiPvCfjZQg2YXYt9in2LnZhSA8YSBvbmNsaWNrPSJzZXRNb2RlKCdmb29kJykiPti52LHYtiDYp9mE2YPZhDwvYT48L2gzPjxkaXYgY2xhc3M9ImdyaWQiPiR7Zm9vZC5tYXAocGxhY2VDYXJkKS5qb2luKCcnKX08L2Rpdj4KICAgICAgPGgzIGNsYXNzPSJzZWMiPvCfm5Ig2YXZgtin2LbZiiDZiNiz2YjYqNix2YXYp9ix2YPYqiA8YSBvbmNsaWNrPSJzZXRNb2RlKCdncm9jZXJ5JykiPti52LHYtiDYp9mE2YPZhDwvYT48L2gzPjxkaXYgY2xhc3M9ImdyaWQiPiR7Z3JvYy5tYXAocGxhY2VDYXJkKS5qb2luKCcnKX08L2Rpdj5gfQogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gdmlld0xpc3QoKSB7CiAgY29uc3QgbGlzdCA9IHN0YXRlLnN0b3Jlcy5maWx0ZXIocyA9PiBzLmtpbmQgPT09IHN0YXRlLm1vZGUpOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48ZGl2IGNsYXNzPSJjcnVtYiI+PGEgb25jbGljaz0iZ29Ib21lKCkiPtin2YTYsdim2YrYs9mK2Kk8L2E+IOKAuiAke3N0YXRlLm1vZGUgPT09ICdmb29kJyA/ICfZhdi32KfYudmFJyA6ICfZhdmC2KfYttmKJ308L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNlYXJjaCB3aWRlIj48c3Bhbj7wn5SNPC9zcGFuPjxpbnB1dCBpZD0icSIgcGxhY2Vob2xkZXI9Itin2KjYrdir4oCmIiBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZhbHVlKSIvPjwvZGl2PgogICAgPGgzIGNsYXNzPSJzZWMiPiR7bGlzdC5sZW5ndGh9INmF2KrYrNixINmF2KrYp9itPC9oMz48ZGl2IGNsYXNzPSJncmlkIj4ke2xpc3QubWFwKHBsYWNlQ2FyZCkuam9pbignJyl9PC9kaXY+PC9kaXY+YDsKfQpmdW5jdGlvbiBwbGFjZUNhcmQocykgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY2FyZCBwbGFjZSI+CiAgICA8ZGl2IGNsYXNzPSJjYXJkLXRvcCIgc3R5bGU9ImJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywke3MuY29sb3J9LCR7c2hhZGUocy5jb2xvciwgLTIyKX0pIiBvbmNsaWNrPSJvcGVuU3RvcmUoJyR7cy5pZH0nKSI+PHNwYW4gY2xhc3M9ImxvZ28tYmFkZ2UiIHN0eWxlPSJjb2xvcjoke3MuY29sb3J9Ij4ke2VzYyhzLmxvZ28pfTwvc3Bhbj48c3BhbiBjbGFzcz0iZmF2LWhlYXJ0IiBvbmNsaWNrPSJldmVudC5zdG9wUHJvcGFnYXRpb24oKTt0b2dnbGVGYXYoJyR7cy5pZH0nKSI+JHtpc0ZhdihzLmlkKSA/ICfinaTvuI8nIDogJ/CfpI0nfTwvc3Bhbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNhcmQtYm9keSIgb25jbGljaz0ib3BlblN0b3JlKCcke3MuaWR9JykiPjxoND4ke2VzYyhzLm5hbWUpfTwvaDQ+PHA+JHtlc2Mocy5jYXQpfTwvcD4KICAgICAgPGRpdiBjbGFzcz0ibWV0YSI+PHNwYW4gY2xhc3M9InN0YXIiPuKYhSAke3MucmF0aW5nfTwvc3Bhbj48c3Bhbj7ij7EgJHtlc2Mocy5ldGEpfTwvc3Bhbj4ke3MubGl2ZSA/ICc8c3BhbiBjbGFzcz0iYmFkZ2UtbiBsaXZlIj7il48g2YXYqNin2LTYsTwvc3Bhbj4nIDogYDxzcGFuIGNsYXNzPSJiYWRnZS1uIj4ke3Mub24ubGVuZ3RofSDYqti32KjZitmC2KfYqjwvc3Bhbj5gfTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJhcHBzLW1pbmkiPiR7cy5vbi5zbGljZSgwLCA2KS5tYXAoaWQgPT4gYDxpIHN0eWxlPSJiYWNrZ3JvdW5kOiR7YXBwcygpW2lkXS5jb2xvcn0iPjwvaT5gKS5qb2luKCcnKX08L2Rpdj48L2Rpdj48L2Rpdj5gOwp9CmZ1bmN0aW9uIHZpZXdTdG9yZSgpIHsKICBjb25zdCBzID0gc3RhdGUuc3RvcmUsIGl0ZW1zID0gY2FydENvdW50KCk7CiAgY29uc3QgcnYgPSBzLnJldmlld3MgfHwgW10sIHJzID0gcy5yYXRpbmdTdGF0cyB8fCB7IGF2Zzogcy5yYXRpbmcsIGNvdW50OiAwIH07CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPjxkaXYgY2xhc3M9ImNydW1iIj48YSBvbmNsaWNrPSJnb0hvbWUoKSI+2KfZhNix2KbZitiz2YrYqTwvYT4g4oC6ICR7ZXNjKHMubmFtZSl9PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJzdG9yZS1iYW5uZXIiIHN0eWxlPSJiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsJHtzLmNvbG9yfSwke3NoYWRlKHMuY29sb3IsIC0yNSl9KSI+PGgyPiR7ZXNjKHMubmFtZSl9PC9oMj4KICAgICAgPGRpdiBjbGFzcz0idGFncyI+JHtlc2Mocy5jYXQpfSDCtyDimIUgJHtycy5hdmcgfHwgcy5yYXRpbmd9JHtycy5jb3VudCA/IGAgKCR7cnMuY291bnR9INiq2YLZitmK2YUpYCA6ICcnfSDCtyDij7EgJHtlc2Mocy5ldGEpfTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJjaGlwcyI+JHtzLmxpdmUgPyBgPHNwYW4gY2xhc3M9ImNoaXAiPuKXjyDZhdio2KfYtNixINmF2YYgJHtlc2Mocy5saXZlU291cmNlKX08L3NwYW4+YCA6ICcnfTxzcGFuIGNsYXNzPSJjaGlwIj4ke3Mub24ubGVuZ3RofSDYqti32KjZitmC2KfYqiDYqtmI2LXZitmEPC9zcGFuPjxzcGFuIGNsYXNzPSJjaGlwIj7wn5ONICR7ZXNjKChzdGF0ZS51c2VyLmFkZHJlc3MgfHwgc3RhdGUuY2ZnLmxvY2F0aW9uKS5zcGxpdCgn2IwnKVswXSl9PC9zcGFuPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0ic3RvcmUtbGF5b3V0Ij48ZGl2IGNsYXNzPSJtZW51LWNvbCI+CiAgICAgICR7cy5saXZlID8gYDxkaXYgY2xhc3M9ImxpdmUtc3RyaXAgc20iPjxzcGFuIGNsYXNzPSJkb3QiPuKXjzwvc3Bhbj4g2KPYs9i52KfYsSDZhdio2KfYtNix2Kkg2YXZhiAke2VzYyhzLmxpdmVTb3VyY2UpfSDCtyAke2VzYyhzLmxpdmVBdCl9PC9kaXY+YCA6ICcnfQogICAgICAke3MubWVudS5tYXAoZyA9PiBgPGgzIGNsYXNzPSJtZW51LWNhdCI+JHtlc2MoZy5nKX08L2gzPjxkaXYgY2xhc3M9ImdyaWQgaXRlbXMiPiR7Zy5pdGVtcy5tYXAoaXRlbVJvdykuam9pbignJyl9PC9kaXY+YCkuam9pbignJyl9CiAgICAgICR7cnYubGVuZ3RoID8gYDxoMyBjbGFzcz0ibWVudS1jYXQiPtin2YTYqtmC2YrZitmF2KfYqiAoJHtycy5jb3VudH0pPC9oMz48ZGl2IGNsYXNzPSJyZXZpZXdzIj4ke3J2LnNsaWNlKDAsIDgpLm1hcChyID0+IGA8ZGl2IGNsYXNzPSJyZXZpZXciPjxkaXYgY2xhc3M9InJ2LXRvcCI+PGI+JHtlc2Moci51c2VyIHx8ICfZhdiz2KrYrtiv2YUnKX08L2I+PHNwYW4gY2xhc3M9InJ2LXN0YXJzIj4ke3N0YXJzKHIucmF0aW5nKX08L3NwYW4+PC9kaXY+JHtyLmNvbW1lbnQgPyBgPHA+JHtlc2Moci5jb21tZW50KX08L3A+YCA6ICcnfTwvZGl2PmApLmpvaW4oJycpfTwvZGl2PmAgOiAnJ30KICAgICAgPHAgY2xhc3M9ImRpc2NsYWltZXIiPiR7cy5saXZlID8gYNij2LPYudin2LEgJHtlc2Mocy5saXZlU291cmNlKX0g2YXYs9it2YjYqNipINmB2LnZhNmK2YvYpyAo2LHYqNi3INit2YopLmAgOiAn2KfZhNij2LPYudin2LEg2KrZiNi22YrYrdmK2KkuJ30g2KjYp9mC2Yog2KfZhNiq2LfYqNmK2YLYp9iqINiq2YLYr9mK2LHZitipLjwvcD48L2Rpdj4KICAgICAgPGFzaWRlIGNsYXNzPSJjYXJ0LWNvbCI+PGRpdiBjbGFzcz0iY2FydC1ib3giPjxoND7Ys9mE2KrZgzwvaDQ+CiAgICAgICAgJHtpdGVtcyA/IGA8ZGl2IGNsYXNzPSJjYXJ0LWxpbmVzIj4ke2NhcnRMaW5lcyhzKX08L2Rpdj48ZGl2IGNsYXNzPSJjYXJ0LXRvdGFsIj48c3Bhbj7Yp9mE2KXYrNmF2KfZhNmKINin2YTZhdio2K/YptmKPC9zcGFuPjxiPiR7bW9uZXkoY2FydFN1YnRvdGFsKHMpKX0g2LEu2LM8L2I+PC9kaXY+PGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIG9uY2xpY2s9ImdvQ29tcGFyZSgpIj7Zgtin2LHZhiDYp9mE2LnYsdmI2LYgKCR7aXRlbXN9KSDigLo8L2J1dHRvbj5gIDogYDxkaXYgY2xhc3M9ImNhcnQtZW1wdHkiPtiz2YTYqtmDINmB2KfYsdi62Kkg4oCUINij2LbZgSDYo9i12YbYp9mB2YvYpyDZhNmF2YLYp9ix2YbYqSDYp9mE2KPYs9i52KfYsS48L2Rpdj5gfQogICAgICA8L2Rpdj48L2FzaWRlPjwvZGl2PjwvZGl2PmA7Cn0KZnVuY3Rpb24gY2FydExpbmVzKHMpIHsgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHN0YXRlLmNhcnQpLm1hcCgoW2lkLCBxXSkgPT4geyBjb25zdCBpdCA9IGZsYXQocykuZmluZChpID0+IGkuaWQgPT09IGlkKTsgcmV0dXJuIGl0ID8gYDxkaXYgY2xhc3M9ImNsaW5lIj48c3Bhbj4ke3F9w5cgJHtlc2MoaXQubil9PC9zcGFuPjxiPiR7bW9uZXkoaXQucCAqIHEpfTwvYj48L2Rpdj5gIDogJyc7IH0pLmpvaW4oJycpOyB9CmZ1bmN0aW9uIGl0ZW1Sb3coaXQpIHsKICBjb25zdCBxID0gc3RhdGUuY2FydFtpdC5pZF0gfHwgMDsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNhcmQgaXRlbSI+PGRpdiBjbGFzcz0icGgiPiR7aXQuZX08L2Rpdj48ZGl2IGNsYXNzPSJkIj48aDU+JHtlc2MoaXQubil9PC9oNT48cD4ke2VzYyhpdC5kKX08L3A+PGRpdiBjbGFzcz0icHIiPiR7bW9uZXkoaXQucCl9INixLtizICR7aXQubGl2ZSA/ICc8c3BhbiBjbGFzcz0ibGl2ZS10YWciPuKXjyDZhdio2KfYtNixPC9zcGFuPicgOiAnJ308L2Rpdj48L2Rpdj4KICAgICR7cSA/IGA8ZGl2IGNsYXNzPSJzdGVwcGVyIj48YnV0dG9uIGNsYXNzPSJtaW51cyIgb25jbGljaz0iZGVjKCcke2l0LmlkfScpIj7iiJI8L2J1dHRvbj48c3BhbiBjbGFzcz0icSI+JHtxfTwvc3Bhbj48YnV0dG9uIG9uY2xpY2s9ImluYygnJHtpdC5pZH0nKSI+KzwvYnV0dG9uPjwvZGl2PmAgOiBgPGJ1dHRvbiBjbGFzcz0iYWRkIiBvbmNsaWNrPSJpbmMoJyR7aXQuaWR9JykiPtil2LbYp9mB2KkgKzwvYnV0dG9uPmB9PC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3Q29tcGFyZSgpIHsKICBjb25zdCBjID0gc3RhdGUuY21wOyBpZiAoIWMpIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYrdiz2KfYqCDYo9mB2LbZhCDYudix2LbigKY8L2Rpdj48L2Rpdj5gOwogIGNvbnN0IG9mZmVycyA9IGMub2ZmZXJzLCBiZXN0ID0gb2ZmZXJzWzBdLCBzYXZpbmcgPSBjLnNhdmluZywgc3ViQXBwcyA9IGMuc3RvcmUub24uZmlsdGVyKGlkID0+IGFwcHMoKVtpZF0uc3ViKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+PGRpdiBjbGFzcz0iY3J1bWIiPjxhIG9uY2xpY2s9ImdvSG9tZSgpIj7Yp9mE2LHYptmK2LPZitipPC9hPiDigLogPGEgb25jbGljaz0ib3BlblN0b3JlKCcke2Muc3RvcmUuaWR9JykiPiR7ZXNjKGMuc3RvcmUubmFtZSl9PC9hPiDigLog2YXZgtin2LHZhtipINin2YTYudix2YjYtjwvZGl2PgogICAgPGRpdiBjbGFzcz0ic2F2ZS1iYW5uZXIiPjxkaXYgY2xhc3M9ImljIj7wn5KwPC9kaXY+PGRpdj48aDQ+2KPZgdi22YQg2LnYsdi2INi52KjYsSA8Yj4ke2VzYyhiZXN0LmFwcC5uYW1lKX08L2I+INio2YAgJHttb25leShiZXN0LnRvdGFsKX0g2LEu2LM8L2g0PjxwPiR7c2F2aW5nID4gMCA/ICfYqtmI2YHZkdixIDxiIHN0eWxlPSJjb2xvcjp2YXIoLS1ncmVlbikiPicgKyBtb25leShzYXZpbmcpICsgJyDYsS7YszwvYj4g2YXZgtin2LHZhtipINio2KPYutmE2Ykg2KrYt9io2YrZgicgOiAn2KfZhNij2LPYudin2LEg2YXYqtmC2KfYsdio2KknfSDCtyAke2NhcnRDb3VudCgpfSDYtdmG2YE8L3A+PC9kaXY+PC9kaXY+CiAgICAke2MubGl2ZSA/IGA8ZGl2IGNsYXNzPSJsaXZlLXN0cmlwIj48c3BhbiBjbGFzcz0iZG90Ij7il488L3NwYW4+INij2LPYudin2LEgJHtlc2MoYy5saXZlLnNvdXJjZSl9INmF2KjYp9i02LHYqSDigJQg2KjYp9mC2Yog2KfZhNiq2LfYqNmK2YLYp9iqINiq2YLYr9mK2LHZitipPC9kaXY+YCA6ICcnfQogICAgJHtzdWJBcHBzLmxlbmd0aCA/IGA8ZGl2IGNsYXNzPSJzdWJzIj48c3BhbiBjbGFzcz0ibGJsIj7wn46f77iPINmB2LnZkdmEINin2LTYqtix2KfZg9in2KrZgyAo2KrZiNi12YrZhCDZhdis2KfZhtmKKTo8L3NwYW4+JHtzdWJBcHBzLm1hcChpZCA9PiBgPGJ1dHRvbiBjbGFzcz0ic3ViLWNoaXAgJHtzdGF0ZS5zdWJzW2lkXSA/ICdvbicgOiAnJ30iIG9uY2xpY2s9InRvZ2dsZVN1YignJHtpZH0nKSI+JHtlc2MoYXBwcygpW2lkXS5zdWIpfTwvYnV0dG9uPmApLmpvaW4oJycpfTwvZGl2PmAgOiAnJ30KICAgIDxkaXYgY2xhc3M9Im9mZmVycy1ncmlkIj4ke29mZmVycy5tYXAoKG8sIGkpID0+IG9mZmVyQ2FyZChvLCBpID09PSAwLCBzYXZpbmcpKS5qb2luKCcnKX08L2Rpdj4KICAgIDxwIGNsYXNzPSJkaXNjbGFpbWVyIj48Yj7YqtmG2YjZitmHOjwvYj4g2KPYs9i52KfYsSAke2MubGl2ZSA/IGVzYyhjLmxpdmUuc291cmNlKSA6ICfZh9mG2YLYsdiz2KrZiti02YYnfSDZhdiz2K3ZiNio2Kkg2YHYudmE2YrZi9inLiDYsdiz2YjZhSDYp9mE2KrZiNi12YrZhCDZiNin2YTYrti12YjZhdin2Kog2YjYo9iz2LnYp9ixINio2KfZgtmKINin2YTYqti32KjZitmC2KfYqiDYqtmC2K/Zitix2YrYqS48L3A+PC9kaXY+YDsKfQpmdW5jdGlvbiBvZmZlckNhcmQobywgaXNCZXN0LCBzYXZpbmcpIHsKICBjb25zdCBpc0xpdmUgPSBzdGF0ZS5jbXAubGl2ZSAmJiBvLmFwcElkID09PSBzdGF0ZS5jbXAubGl2ZS5hcHA7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjYXJkIG9mZmVyICR7aXNCZXN0ID8gJ2Jlc3QnIDogJyd9Ij4KICAgICR7aXNCZXN0ID8gYDxkaXYgY2xhc3M9InJpYmJvbiI+4q2QINij2YHYttmEINi52LHYtiR7c2F2aW5nID4gMCA/ICcgwrcg2YjZgdmR2LEgJyArIG1vbmV5KHNhdmluZykgKyAnINixLtizJyA6ICcnfTwvZGl2PmAgOiAnJ30KICAgIDxkaXYgY2xhc3M9Im9mZmVyLXRvcCI+JHthcHBMb2dvKG8uYXBwSWQsIDQ2KX08ZGl2IGNsYXNzPSJhbm0iPjxoND4ke2VzYyhvLmFwcC5uYW1lKX08L2g0PjxkaXYgY2xhc3M9InN1YiI+PHNwYW4+4o+xICR7ZXNjKG8uZXRhKX08L3NwYW4+JHtpc0xpdmUgPyAnPHNwYW4gY2xhc3M9Im9rIj7il48g2LPYudixINmF2KjYp9i02LE8L3NwYW4+JyA6ICc8c3BhbiBjbGFzcz0ibXV0ZWQiPtiq2YLYr9mK2LHZijwvc3Bhbj4nfSR7by5mcmVlRGVsID8gJzxzcGFuIGNsYXNzPSJvayI+2KrZiNi12YrZhCDZhdis2KfZhtmKIOKckzwvc3Bhbj4nIDogJyd9PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0idG90Ij48ZGl2IGNsYXNzPSJiaWciPiR7bW9uZXkoby50b3RhbCl9PC9kaXY+PGRpdiBjbGFzcz0iY3VyIj7YsS7YszwvZGl2PjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0iYnJlYWtkb3duIj48ZGl2IGNsYXNzPSJicm93Ij48c3Bhbj7Ys9i52LEg2KfZhNij2LXZhtin2YE8L3NwYW4+PGI+JHttb25leShvLnN1YnRvdGFsKX0g2LEu2LM8L2I+PC9kaXY+PGRpdiBjbGFzcz0iYnJvdyI+PHNwYW4+2KfZhNiq2YjYtdmK2YQ8L3NwYW4+PGI+JHtvLmRlbGl2ZXJ5ID09PSAwID8gJzxzcGFuIHN0eWxlPSJjb2xvcjp2YXIoLS1ncmVlbikiPtmF2KzYp9mG2Yo8L3NwYW4+JyA6IG1vbmV5KG8uZGVsaXZlcnkpICsgJyDYsS7Ysyd9PC9iPjwvZGl2PjxkaXYgY2xhc3M9ImJyb3ciPjxzcGFuPtin2YTYrtiv2YXYqTwvc3Bhbj48Yj4ke21vbmV5KG8uc2VydmljZSl9INixLtizPC9iPjwvZGl2PiR7by5kaXNjb3VudCA+IDAgPyBgPGRpdiBjbGFzcz0iYnJvdyBkaXNjIj48c3Bhbj7Yrti12YUg2KfZhNiq2LfYqNmK2YI8L3NwYW4+PGI+4oiSICR7bW9uZXkoby5kaXNjb3VudCl9INixLtizPC9iPjwvZGl2PmAgOiAnJ308L2Rpdj4KICAgICR7by5wcm9tb0xhYmVsID8gYDxkaXYgY2xhc3M9InByb21vLXRhZyI+8J+On++4jyAke2VzYyhvLnByb21vTGFiZWwpfTwvZGl2PmAgOiAnJ30KICAgIDxidXR0b24gY2xhc3M9InBpY2tidG4iIG9uY2xpY2s9Im9wZW5DaGVja291dCgnJHtvLmFwcElkfScpIj7Yp9i32YTYqCDYudio2LEgJHtlc2Moby5hcHAubmFtZSl9IOKAujwvYnV0dG9uPjwvZGl2PmA7Cn0KCi8qIC0tLS0tLS0tLS0g2KfZhNiv2YHYuSAvINil2KrZhdin2YUg2KfZhNi32YTYqCAtLS0tLS0tLS0tICovCmZ1bmN0aW9uIG9wZW5DaGVja291dChhcHBJZCkgeyBzdGF0ZS5jaGVja291dCA9IGFwcElkOyBzdGF0ZS5jb3Vwb24gPSBudWxsOyBzdGF0ZS5jb3Vwb25Nc2cgPSAnJzsgcmVuZGVyQ2hlY2tvdXQoKTsgfQpmdW5jdGlvbiByZW5kZXJDaGVja291dCgpIHsKICBjb25zdCBvID0gc3RhdGUuY21wLm9mZmVycy5maW5kKHggPT4geC5hcHBJZCA9PT0gc3RhdGUuY2hlY2tvdXQpOwogIGNvbnN0IGNEaXNjID0gc3RhdGUuY291cG9uID8gc3RhdGUuY291cG9uLmRpc2NvdW50IDogMDsKICBjb25zdCB0b3RhbCA9IE1hdGgubWF4KDAsIE1hdGgucm91bmQoKG8uc3VidG90YWwgKyBvLmRlbGl2ZXJ5ICsgby5zZXJ2aWNlIC0gby5kaXNjb3VudCAtIGNEaXNjKSAqIDEwMCkgLyAxMDApOwogIGNvbnN0IG0gPSAkKCdtb2RhbCcpIHx8IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgeyBpZDogJ21vZGFsJyB9KSk7CiAgbS5jbGFzc05hbWUgPSAnbW9kYWwtYmcnOyBtLm9uY2xpY2sgPSBlID0+IHsgaWYgKGUudGFyZ2V0ID09PSBtKSBjbG9zZU1vZGFsKCk7IH07CiAgbS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz0ic2hlZXQiPjxkaXYgY2xhc3M9ImgiPiR7YXBwTG9nbyhvLmFwcElkLCA1MCl9PGRpdj48aDM+2KXYqtmF2KfZhSDYp9mE2LfZhNioINi52KjYsSAke2VzYyhvLmFwcC5uYW1lKX08L2gzPjxwPiR7ZXNjKHN0YXRlLmNtcC5zdG9yZS5uYW1lKX0gwrcgJHtjYXJ0Q291bnQoKX0g2LXZhtmBIMK3ICR7ZXNjKHN0YXRlLnVzZXIuYWRkcmVzcyl9PC9wPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0ic3VtIj48ZGl2IGNsYXNzPSJyIj48c3Bhbj7Ys9i52LEg2KfZhNij2LXZhtin2YE8L3NwYW4+PGI+JHttb25leShvLnN1YnRvdGFsKX0g2LEu2LM8L2I+PC9kaXY+PGRpdiBjbGFzcz0iciI+PHNwYW4+2KfZhNiq2YjYtdmK2YQ8L3NwYW4+PGI+JHtvLmRlbGl2ZXJ5ID09PSAwID8gJ9mF2KzYp9mG2YonIDogbW9uZXkoby5kZWxpdmVyeSkgKyAnINixLtizJ308L2I+PC9kaXY+PGRpdiBjbGFzcz0iciI+PHNwYW4+2KfZhNiu2K/ZhdipPC9zcGFuPjxiPiR7bW9uZXkoby5zZXJ2aWNlKX0g2LEu2LM8L2I+PC9kaXY+JHtvLmRpc2NvdW50ID4gMCA/IGA8ZGl2IGNsYXNzPSJyIj48c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj7Yrti12YUg2KfZhNiq2LfYqNmK2YI8L3NwYW4+PGIgc3R5bGU9ImNvbG9yOnZhcigtLWdyZWVuKSI+4oiSICR7bW9uZXkoby5kaXNjb3VudCl9INixLtizPC9iPjwvZGl2PmAgOiAnJ30ke2NEaXNjID4gMCA/IGA8ZGl2IGNsYXNzPSJyIj48c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj7Zg9mI2KjZiNmGICR7ZXNjKHN0YXRlLmNvdXBvbi5jb3Vwb24uY29kZSl9PC9zcGFuPjxiIHN0eWxlPSJjb2xvcjp2YXIoLS1ncmVlbikiPuKIkiAke21vbmV5KGNEaXNjKX0g2LEu2LM8L2I+PC9kaXY+YCA6ICcnfTxkaXYgY2xhc3M9InIgdHQiPjxzcGFuPtin2YTYpdis2YXYp9mE2Yo8L3NwYW4+PHNwYW4+JHttb25leSh0b3RhbCl9INixLtizPC9zcGFuPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0iY291cG9uLXJvdyI+PGlucHV0IGlkPSJjb3Vwb25JbnB1dCIgcGxhY2Vob2xkZXI9ItmD2YjYryDZg9mI2KjZiNmGICjZhdir2YQgV0VMQ09NRTEwKSIgdmFsdWU9IiR7c3RhdGUuY291cG9uID8gZXNjKHN0YXRlLmNvdXBvbi5jb3Vwb24uY29kZSkgOiAnJ30iLz48YnV0dG9uIG9uY2xpY2s9ImFwcGx5Q291cG9uKCkiPtiq2LfYqNmK2YI8L2J1dHRvbj48L2Rpdj4KICAgICR7c3RhdGUuY291cG9uTXNnID8gYDxkaXYgY2xhc3M9ImNvdXBvbi1tc2cgJHtzdGF0ZS5jb3Vwb24gPyAnb2snIDogJ2Vycid9Ij4ke2VzYyhzdGF0ZS5jb3Vwb25Nc2cpfTwvZGl2PmAgOiAnJ30KICAgIDxkaXYgY2xhc3M9Im5vdGUiPvCflJIg2LPZhtmG2LTYpiDYt9mE2KjZgyDZgdmKINiz2YjYqNixINii2Kgg2YjZhtit2YjZkdmE2YMg2KXZhNmJICR7ZXNjKG8uYXBwLm5hbWUpfSDZhNil2YPZhdin2YQg2KfZhNiv2YHYuS4g2KfZhNiq2KrYqNmR2Lkg2K/Yp9iu2YQg2KfZhNmF2YbYtdipLjwvZGl2PgogICAgPGRpdiBjbGFzcz0iY3RhIj48YnV0dG9uIGNsYXNzPSJjYW5jZWwiIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+2LHYrNmI2Lk8L2J1dHRvbj48YnV0dG9uIGNsYXNzPSJnbyIgaWQ9ImNvbmZpcm1CdG4iIG9uY2xpY2s9ImNvbmZpcm1PcmRlcigpIj7Yo9mD2ZHYryDYp9mE2LfZhNioIMK3ICR7bW9uZXkodG90YWwpfSDYsS7YszwvYnV0dG9uPjwvZGl2PjwvZGl2PmA7Cn0KYXN5bmMgZnVuY3Rpb24gYXBwbHlDb3Vwb24oKSB7CiAgY29uc3QgY29kZSA9IHZhbCgnY291cG9uSW5wdXQnKTsgaWYgKCFjb2RlKSByZXR1cm47CiAgY29uc3QgbyA9IHN0YXRlLmNtcC5vZmZlcnMuZmluZCh4ID0+IHguYXBwSWQgPT09IHN0YXRlLmNoZWNrb3V0KTsKICB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2NvdXBvbi92YWxpZGF0ZScsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY29kZSwgc3VidG90YWw6IG8uc3VidG90YWwgfSkgfSk7IHN0YXRlLmNvdXBvbiA9IHI7IHN0YXRlLmNvdXBvbk1zZyA9IGDYqtmFINiq2LfYqNmK2YIgJHtyLmNvdXBvbi5jb2RlfSDigJQg2K7YtdmFICR7bW9uZXkoci5kaXNjb3VudCl9INixLtizYDsgfQogIGNhdGNoIChlKSB7IHN0YXRlLmNvdXBvbiA9IG51bGw7IHN0YXRlLmNvdXBvbk1zZyA9IGUubWVzc2FnZTsgfQogIHJlbmRlckNoZWNrb3V0KCk7Cn0KYXN5bmMgZnVuY3Rpb24gY29uZmlybU9yZGVyKCkgewogIGNvbnN0IGIgPSAkKCdjb25maXJtQnRuJyk7IGlmIChiKSB7IGIuZGlzYWJsZWQgPSB0cnVlOyBiLnRleHRDb250ZW50ID0gJ+KPsyDYrNin2LHZiiDYp9mE2KXZhti02KfYoeKApic7IH0KICB0cnkgewogICAgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9vcmRlcnMnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN0b3JlSWQ6IHN0YXRlLmNtcC5zdG9yZS5pZCwgYXBwSWQ6IHN0YXRlLmNoZWNrb3V0LCBjYXJ0OiBzdGF0ZS5jYXJ0LCBzdWJzOiBzdGF0ZS5zdWJzLCBjb3Vwb246IHN0YXRlLmNvdXBvbiA/IHN0YXRlLmNvdXBvbi5jb3Vwb24uY29kZSA6IG51bGwgfSkgfSk7CiAgICBjbG9zZU1vZGFsKCk7IHN0YXRlLmNhcnQgPSB7fTsgbG9hZE5vdGlmaWNhdGlvbnMoKTsgb3Blbk9yZGVyKHIub3JkZXIuaWQpOwogIH0gY2F0Y2ggKGUpIHsgaWYgKGIpIHsgYi5kaXNhYmxlZCA9IGZhbHNlOyBiLnRleHRDb250ZW50ID0gJ9ij2YPZkdivINin2YTYt9mE2KgnOyB9IGFsZXJ0KGUubWVzc2FnZSk7IH0KfQoKLyogLS0tLS0tLS0tLSDYt9mE2KjYp9iq2YogKyDYp9mE2KrYqtio2ZHYuSAtLS0tLS0tLS0tICovCmFzeW5jIGZ1bmN0aW9uIHZpZXdPcmRlcnNUYWIoKSB7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPjxoMyBjbGFzcz0ic2VjIj7wn6e+INi32YTYqNin2KrZijwvaDM+PGRpdiBpZD0ib3JkZXJzTGlzdCI+PGRpdiBjbGFzcz0ibG9hZGluZyI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g2KzYp9ix2Yog2KfZhNiq2K3ZhdmK2YTigKY8L2Rpdj48L2Rpdj48L2Rpdj5gOwp9CmFzeW5jIGZ1bmN0aW9uIGxvYWRPcmRlcnMoKSB7CiAgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9vcmRlcnMnKTsgc3RhdGUub3JkZXJzID0gci5vcmRlcnM7IGNvbnN0IGVsID0gJCgnb3JkZXJzTGlzdCcpOyBpZiAoZWwpIGVsLmlubmVySFRNTCA9IHN0YXRlLm9yZGVycy5sZW5ndGggPyBzdGF0ZS5vcmRlcnMubWFwKG9yZGVyUm93KS5qb2luKCcnKSA6IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iZSI+8J+nvjwvZGl2PjxoMz7ZhNinINi32YTYqNin2Kog2KjYudivPC9oMz48cD7Yp9i32YTYqCDZhdmGINij2Yog2YXYt9i52YUg2YjYs9iq2LjZh9ixINmH2YbYpy48L3A+PC9kaXY+YDsgfQogIGNhdGNoIChlKSB7IGNvbnN0IGVsID0gJCgnb3JkZXJzTGlzdCcpOyBpZiAoZWwpIGVsLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGgzPiR7ZXNjKGUubWVzc2FnZSl9PC9oMz48L2Rpdj5gOyB9Cn0KZnVuY3Rpb24gb3JkZXJSb3cobykgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY2FyZCBvcmRlci1yb3ciIG9uY2xpY2s9Im9wZW5PcmRlcigke28uaWR9KSI+PGRpdiBjbGFzcz0ib3ItaWMiIHN0eWxlPSJiYWNrZ3JvdW5kOiR7c3RhdHVzQ29sb3Ioby5zdGF0dXMpfTIyO2NvbG9yOiR7c3RhdHVzQ29sb3Ioby5zdGF0dXMpfSI+JHsoU1RBVFVTX0ZMT1cuZmluZChzID0+IHNbMF0gPT09IG8uc3RhdHVzKSB8fCBbJycsICfwn6e+J10pWzFdfTwvZGl2PgogICAgPGRpdiBjbGFzcz0ib3ItZCI+PGg1PiR7ZXNjKG8ucmVzdGF1cmFudE5hbWUpfSA8c3BhbiBjbGFzcz0ibXV0ZWQiPsK3ICR7ZXNjKG8uYXBwTmFtZSl9PC9zcGFuPjwvaDU+PHA+2LfZhNioICMke28uaWR9IMK3ICR7by5pdGVtcy5sZW5ndGh9INi12YbZgSDCtyAke3RpbWVBZ28oby5jcmVhdGVkQXQpfTwvcD48L2Rpdj4KICAgIDxkaXYgY2xhc3M9Im9yLXIiPjxzcGFuIGNsYXNzPSJzdC1iYWRnZSIgc3R5bGU9ImJhY2tncm91bmQ6JHtzdGF0dXNDb2xvcihvLnN0YXR1cyl9MjI7Y29sb3I6JHtzdGF0dXNDb2xvcihvLnN0YXR1cyl9Ij4ke1NUQVRVU19BUltvLnN0YXR1c10gfHwgby5zdGF0dXN9PC9zcGFuPjxiPiR7bW9uZXkoby50b3RhbCl9INixLtizPC9iPjwvZGl2PjwvZGl2PmA7Cn0KYXN5bmMgZnVuY3Rpb24gb3Blbk9yZGVyKGlkKSB7CiAgc3RhdGUuc2NyZWVuID0gJ29yZGVyJzsgc3RhdGUudGFiID0gJ29yZGVycyc7IHN0YXRlLm9yZGVyID0gbnVsbDsgcmVuZGVyKCk7CiAgYXdhaXQgcmVmcmVzaE9yZGVyKGlkKTsKICBjbGVhckludGVydmFsKHN0YXRlLm9yZGVyUG9sbCk7CiAgc3RhdGUub3JkZXJQb2xsID0gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4geyBpZiAoc3RhdGUuc2NyZWVuICE9PSAnb3JkZXInKSB7IGNsZWFySW50ZXJ2YWwoc3RhdGUub3JkZXJQb2xsKTsgcmV0dXJuOyB9IGF3YWl0IHJlZnJlc2hPcmRlcihpZCwgdHJ1ZSk7IH0sIDcwMDApOwp9CmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hPcmRlcihpZCwgcXVpZXQpIHsgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9vcmRlcnMvJyArIGlkKTsgc3RhdGUub3JkZXIgPSByLm9yZGVyOyBpZiAoc3RhdGUub3JkZXIuc3RhdHVzID09PSAnZGVsaXZlcmVkJyB8fCBzdGF0ZS5vcmRlci5zdGF0dXMgPT09ICdjYW5jZWxsZWQnKSBjbGVhckludGVydmFsKHN0YXRlLm9yZGVyUG9sbCk7IGlmIChzdGF0ZS5zY3JlZW4gPT09ICdvcmRlcicpIHJlbmRlcigpOyB9IGNhdGNoIChlKSB7IGlmICghcXVpZXQgJiYgc3RhdGUuc2NyZWVuID09PSAnb3JkZXInKSAkKCdzY3JlZW4nKS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48ZGl2IGNsYXNzPSJlbXB0eSI+PGgzPiR7ZXNjKGUubWVzc2FnZSl9PC9oMz48L2Rpdj48L2Rpdj5gOyB9IH0KZnVuY3Rpb24gdmlld09yZGVyKCkgewogIGNvbnN0IG8gPSBzdGF0ZS5vcmRlcjsgaWYgKCFvKSByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+PGRpdiBjbGFzcz0ibG9hZGluZyI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g2KzYp9ix2Yog2KrYrdmF2YrZhCDYp9mE2LfZhNio4oCmPC9kaXY+PC9kaXY+YDsKICBjb25zdCBjdXJJZHggPSBTVEFUVVNfRkxPVy5maW5kSW5kZXgocyA9PiBzWzBdID09PSBvLnN0YXR1cyk7CiAgY29uc3QgY2FuY2VsbGVkID0gby5zdGF0dXMgPT09ICdjYW5jZWxsZWQnOwogIGNvbnN0IHN0ZXBzID0gU1RBVFVTX0ZMT1cubWFwKChzLCBpKSA9PiB7IGNvbnN0IGRvbmUgPSAhY2FuY2VsbGVkICYmIGkgPD0gY3VySWR4OyBjb25zdCBldiA9IChvLmV2ZW50cyB8fCBbXSkuZmluZChlID0+IGUuc3RhdHVzID09PSBzWzBdKTsgcmV0dXJuIGA8ZGl2IGNsYXNzPSJ0bC1zdGVwICR7ZG9uZSA/ICdkb25lJyA6ICcnfSAke2kgPT09IGN1cklkeCAmJiAhY2FuY2VsbGVkID8gJ2N1cicgOiAnJ30iPjxkaXYgY2xhc3M9InRsLWRvdCI+JHtkb25lID8gc1sxXSA6ICfil4snfTwvZGl2PjxkaXYgY2xhc3M9InRsLWwiPjxiPiR7U1RBVFVTX0FSW3NbMF1dfTwvYj4ke2V2ID8gYDxzcGFuPiR7bmV3IERhdGUoZXYuYXQpLnRvTG9jYWxlVGltZVN0cmluZygnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSl9PC9zcGFuPmAgOiAnJ308L2Rpdj48L2Rpdj5gOyB9KS5qb2luKCcnKTsKICBjb25zdCBjYW5SZXZpZXcgPSBvLnN0YXR1cyA9PT0gJ2RlbGl2ZXJlZCc7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjb250YWluZXIgbmFycm93Ij48ZGl2IGNsYXNzPSJjcnVtYiI+PGEgb25jbGljaz0ic2V0VGFiKCdvcmRlcnMnKSI+2LfZhNio2KfYqtmKPC9hPiDigLog2LfZhNioICMke28uaWR9PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJvcmRlci1oZXJvIiBzdHlsZT0iYmFja2dyb3VuZDoke2NhbmNlbGxlZCA/ICcjN2YxZDFkJyA6ICd2YXIoLS1icmFuZC1ncmFkKSd9Ij48ZGl2PjxzcGFuIGNsYXNzPSJvaC1hcHAiPiR7ZXNjKG8uYXBwTmFtZSl9PC9zcGFuPjxoMj4ke2VzYyhvLnJlc3RhdXJhbnROYW1lKX08L2gyPjxwPti32YTYqCAjJHtvLmlkfSDCtyAke28uaXRlbXMubGVuZ3RofSDYtdmG2YEgwrcgJHtlc2Moby5hZGRyZXNzKX08L3A+PC9kaXY+PGRpdiBjbGFzcz0ib2gtdG90YWwiPjxzcGFuPiR7bW9uZXkoby50b3RhbCl9PC9zcGFuPjxzbWFsbD7YsS7Yszwvc21hbGw+PC9kaXY+PC9kaXY+CiAgICAke2NhbmNlbGxlZCA/IGA8ZGl2IGNsYXNzPSJjYXJkIHBhZCIgc3R5bGU9InRleHQtYWxpZ246Y2VudGVyO2NvbG9yOiNCOTFDMUM7Zm9udC13ZWlnaHQ6ODAwIj7Yp9mE2LfZhNioINmF2YTYutmKPC9kaXY+YCA6IGA8ZGl2IGNsYXNzPSJjYXJkIHBhZCI+PGg0IHN0eWxlPSJtYXJnaW4tYm90dG9tOjE0cHgiPtiq2KrYqNmR2Lkg2KfZhNi32YTYqDwvaDQ+PGRpdiBjbGFzcz0idGltZWxpbmUiPiR7c3RlcHN9PC9kaXY+PC9kaXY+YH0KICAgIDxkaXYgY2xhc3M9ImNhcmQgcGFkIj48aDQgc3R5bGU9Im1hcmdpbi1ib3R0b206MTBweCI+2KfZhNij2LXZhtin2YE8L2g0PiR7by5pdGVtcy5tYXAoaXQgPT4gYDxkaXYgY2xhc3M9ImNsaW5lIj48c3Bhbj4ke2l0LnF0eX3DlyAke2VzYyhpdC5uYW1lKX08L3NwYW4+PGI+JHttb25leShpdC5wcmljZSAqIGl0LnF0eSl9INixLtizPC9iPjwvZGl2PmApLmpvaW4oJycpfQogICAgICA8ZGl2IGNsYXNzPSJjbGluZSIgc3R5bGU9ImJvcmRlci10b3A6MXB4IHNvbGlkIHZhcigtLWxpbmUpO21hcmdpbi10b3A6OHB4O3BhZGRpbmctdG9wOjhweCI+PHNwYW4+2KfZhNiq2YjYtdmK2YQgKyDYp9mE2K7Yr9mF2Kk8L3NwYW4+PGI+JHttb25leShvLmRlbGl2ZXJ5ICsgby5zZXJ2aWNlKX0g2LEu2LM8L2I+PC9kaXY+JHtvLmRpc2NvdW50ID4gMCA/IGA8ZGl2IGNsYXNzPSJjbGluZSI+PHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWdyZWVuKSI+2KfZhNiu2LXZhSR7by5jb3Vwb24gPyAnICgnICsgZXNjKG8uY291cG9uKSArICcpJyA6ICcnfTwvc3Bhbj48YiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj7iiJIgJHttb25leShvLmRpc2NvdW50KX0g2LEu2LM8L2I+PC9kaXY+YCA6ICcnfTxkaXYgY2xhc3M9ImNhcnQtdG90YWwiPjxzcGFuPtin2YTYpdis2YXYp9mE2Yo8L3NwYW4+PGI+JHttb25leShvLnRvdGFsKX0g2LEu2LM8L2I+PC9kaXY+PC9kaXY+CiAgICAke2NhblJldmlldyA/IHJldmlld0JveChvKSA6ICcnfQogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gcmV2aWV3Qm94KG8pIHsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNhcmQgcGFkIiBpZD0icmV2aWV3Qm94Ij48aDQgc3R5bGU9Im1hcmdpbi1ib3R0b206OHB4Ij7ZgtmK2ZHZhSDYqtis2LHYqNiq2YMg2YXYuSAke2VzYyhvLnJlc3RhdXJhbnROYW1lKX08L2g0PgogICAgPGRpdiBjbGFzcz0icmF0ZS1zdGFycyIgaWQ9InJhdGVTdGFycyI+JHtbMSwgMiwgMywgNCwgNV0ubWFwKGkgPT4gYDxzcGFuIGRhdGEtdj0iJHtpfSIgb25jbGljaz0ic2V0UmF0ZSgke2l9KSI+4piGPC9zcGFuPmApLmpvaW4oJycpfTwvZGl2PgogICAgPGRpdiBjbGFzcz0iZmllbGQiPjx0ZXh0YXJlYSBpZD0icmV2aWV3Q29tbWVudCIgcGxhY2Vob2xkZXI9Itiq2LnZhNmK2YLZgyAo2KfYrtiq2YrYp9ix2YopIiByb3dzPSIyIj48L3RleHRhcmVhPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXNvZnQiIG9uY2xpY2s9InN1Ym1pdFJldmlldygke28uaWR9KSI+2KXYsdiz2KfZhCDYp9mE2KrZgtmK2YrZhTwvYnV0dG9uPjwvZGl2PmA7Cn0KbGV0IF9yYXRlID0gMDsKZnVuY3Rpb24gc2V0UmF0ZSh2KSB7IF9yYXRlID0gdjsgY29uc3QgZWwgPSAkKCdyYXRlU3RhcnMnKTsgaWYgKGVsKSBbLi4uZWwuY2hpbGRyZW5dLmZvckVhY2goKHMsIGkpID0+IHMudGV4dENvbnRlbnQgPSBpIDwgdiA/ICfimIUnIDogJ+KYhicpOyB9CmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdFJldmlldyhvcmRlcklkKSB7CiAgaWYgKCFfcmF0ZSkgcmV0dXJuIGFsZXJ0KCfYp9iu2KrYsSDYudiv2K8g2KfZhNmG2KzZiNmFJyk7CiAgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL3Jldmlld3MnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG9yZGVySWQsIHJhdGluZzogX3JhdGUsIGNvbW1lbnQ6IHZhbCgncmV2aWV3Q29tbWVudCcpIH0pIH0pOyBfcmF0ZSA9IDA7IGNvbnN0IGIgPSAkKCdyZXZpZXdCb3gnKTsgaWYgKGIpIGIuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9InRleHQtYWxpZ246Y2VudGVyO2NvbG9yOnZhcigtLWdyZWVuKTtmb250LXdlaWdodDo4MDA7cGFkZGluZzo4cHgiPti02YPYsdmL2Kcg2YTYqtmC2YrZitmF2YMhIPCfjJ88L2Rpdj4nOyB9CiAgY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfQp9CgovKiAtLS0tLS0tLS0tINin2YTYudix2YjYtiAvINin2YTZg9mI2KjZiNmG2KfYqiAtLS0tLS0tLS0tICovCmFzeW5jIGZ1bmN0aW9uIHZpZXdPZmZlcnMoKSB7CiAgY29uc3QgcHJvbW9zID0gT2JqZWN0LmVudHJpZXMoYXBwcygpKS5maWx0ZXIoKFtpZCwgYV0pID0+IGEucHJvbW9MYWJlbCkubWFwKChbaWQsIGFdKSA9PiBgPGRpdiBjbGFzcz0iY2FyZCBwcm9tby1jYXJkIj48ZGl2IGNsYXNzPSJwbCIgc3R5bGU9ImJhY2tncm91bmQ6JHthLmNvbG9yfTtjb2xvcjoke2EudGV4dH0iPiR7YS5zaG9ydH08L2Rpdj48ZGl2IGNsYXNzPSJwdCI+PGg1PiR7ZXNjKGEubmFtZSl9PC9oNT48cD4ke2VzYyhhLnByb21vTGFiZWwpfTwvcD48L2Rpdj48L2Rpdj5gKS5qb2luKCcnKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+PGgzIGNsYXNzPSJzZWMiPvCfjp/vuI8g2YPZiNio2YjZhtin2Kog2LPZiNio2LEg2KLYqDwvaDM+PGRpdiBpZD0iY291cG9uc0xpc3QiPjxkaXYgY2xhc3M9ImxvYWRpbmciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOKApjwvZGl2PjwvZGl2PgogICAgPGgzIGNsYXNzPSJzZWMiPiUg2LnYsdmI2LYg2KfZhNiq2LfYqNmK2YLYp9iqPC9oMz48ZGl2IGNsYXNzPSJncmlkIj4ke3Byb21vc308L2Rpdj48cCBjbGFzcz0iZGlzY2xhaW1lciI+2KrZj9i32KjZkdmCINin2YTZg9mI2KjZiNmG2KfYqiDYudmG2K8g2KfZhNiv2YHYuS4g2KfZhNi52LHZiNi2INiq2YjYttmK2K3ZitipLjwvcD48L2Rpdj5gOwp9CmFzeW5jIGZ1bmN0aW9uIGxvYWRDb3Vwb25zKCkgewogIHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvY291cG9ucycpOyBjb25zdCBlbCA9ICQoJ2NvdXBvbnNMaXN0Jyk7IGlmIChlbCkgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9ImdyaWQiPiR7ci5jb3Vwb25zLm1hcChjID0+IGA8ZGl2IGNsYXNzPSJjYXJkIGNvdXBvbi1jYXJkIj48ZGl2IGNsYXNzPSJjYy1jb2RlIj4ke2VzYyhjLmNvZGUpfTwvZGl2PjxwPiR7ZXNjKGMuZGVzY3IpfTwvcD48c3BhbiBjbGFzcz0iY2MtdGFnIj4ke2MudHlwZSA9PT0gJ3BlcmNlbnQnID8gYy52YWx1ZSArICfZqicgOiBjLnZhbHVlICsgJyDYsS7Ysyd9JHtjLm1pbl9vcmRlciA/ICcgwrcg2K3YryDYo9iv2YbZiSAnICsgYy5taW5fb3JkZXIgOiAnJ308L3NwYW4+PC9kaXY+YCkuam9pbignJyl9PC9kaXY+YDsgfQogIGNhdGNoIHt9Cn0KCi8qIC0tLS0tLS0tLS0g2KfZhNmF2YTZgSDYp9mE2LTYrti12YogLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiB2aWV3UHJvZmlsZSgpIHsKICBjb25zdCB1ID0gc3RhdGUudXNlcjsKICBjb25zdCBzdWJSb3dzID0gT2JqZWN0LmVudHJpZXMoYXBwcygpKS5maWx0ZXIoKFtpZCwgYV0pID0+IGEuc3ViKS5tYXAoKFtpZCwgYV0pID0+IGA8ZGl2IGNsYXNzPSJhY2Mtcm93Ij48c3BhbiBjbGFzcz0ibCI+8J+On++4jyAke2VzYyhhLnN1Yil9PC9zcGFuPjxzcGFuIGNsYXNzPSJzd2l0Y2ggJHtzdGF0ZS5zdWJzW2lkXSA/ICdvbicgOiAnJ30iIG9uY2xpY2s9InRvZ2dsZVN1YignJHtpZH0nKSI+PGk+PC9pPjwvc3Bhbj48L2Rpdj5gKS5qb2luKCcnKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciBuYXJyb3ciPgogICAgPGRpdiBjbGFzcz0icHJvZi1oZWFkIj48ZGl2IGNsYXNzPSJhdiI+JHtlc2ModS5uYW1lWzBdIHx8ICfwn5GkJyl9PC9kaXY+PGRpdj48aDI+JHtlc2ModS5uYW1lKX08L2gyPjxwPiR7ZXNjKHUuZW1haWwpfTwvcD48c3BhbiBjbGFzcz0idmJhZGdlIj4ke3UudmVyaWZpZWQgPyAn4pyTINmF2YHYudmR2YQnIDogJ9i62YrYsSDZhdmB2LnZkdmEJ30ke3UuaXNBZG1pbiA/ICcgwrcg2YXYr9mK2LEnIDogJyd9PC9zcGFuPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0iY2FyZCBwYWQiPjxoND7YudmG2YjYp9mGINin2YTYqtmI2LXZitmEPC9oND48ZGl2IGNsYXNzPSJmaWVsZCI+PGlucHV0IGlkPSJwQWRkciIgdmFsdWU9IiR7ZXNjKHUuYWRkcmVzcyB8fCAnJyl9Ii8+PC9kaXY+PGJ1dHRvbiBjbGFzcz0iYnRuLXNvZnQiIG9uY2xpY2s9InNhdmVBZGRyKCkiPtit2YHYuCDYp9mE2LnZhtmI2KfZhjwvYnV0dG9uPjwvZGl2PgogICAgPGRpdiBjbGFzcz0iY2FyZCBwYWQiPjxoND7Yp9i02KrYsdin2YPYp9iq2Yo8L2g0PjxwIGNsYXNzPSJtdXRlZCI+2KrZj9it2KrYs9ioINmB2Yog2KfZhNmF2YLYp9ix2YbYqSAo2KrZiNi12YrZhCDZhdis2KfZhtmKKS48L3A+JHtzdWJSb3dzfTwvZGl2PgogICAgJHt1LmlzQWRtaW4gPyBgPGJ1dHRvbiBjbGFzcz0iYnRuLXNvZnQiIG9uY2xpY2s9Im9wZW5BZG1pbigpIj7wn5uh77iPINmE2YjYrdipINin2YTYqtit2YPZhSAo2KfZhNii2K/ZhdmGKTwvYnV0dG9uPmAgOiAnJ30KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1kYW5nZXIiIG9uY2xpY2s9ImRvTG9nb3V0KCkiPtiq2LPYrNmK2YQg2KfZhNiu2LHZiNisPC9idXR0b24+PC9kaXY+YDsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09INmE2YjYrdipINin2YTYotiv2YXZhiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KYXN5bmMgZnVuY3Rpb24gb3BlbkFkbWluKCkgeyBzdGF0ZS50YWIgPSAnYWNjb3VudCc7IHN0YXRlLnNjcmVlbiA9ICdhZG1pbic7IHN0YXRlLmFkbWluLnRhYiA9ICdzdGF0cyc7IHJlbmRlcigpOyBsb2FkQWRtaW5UYWIoKTsgfQpmdW5jdGlvbiBhZG1pblRhYnMoKSB7CiAgY29uc3QgdCA9IFtbJ3N0YXRzJywgJ9in2YTYpdit2LXYp9im2YrYp9iqJ10sIFsncmVzdGF1cmFudHMnLCAn2KfZhNmF2LfYp9i52YUnXSwgWydvcmRlcnMnLCAn2KfZhNi32YTYqNin2KonXSwgWyd1c2VycycsICfYp9mE2YXYs9iq2K7Yr9mF2YjZhiddLCBbJ2NvdXBvbnMnLCAn2KfZhNmD2YjYqNmI2YbYp9iqJ11dOwogIHJldHVybiBgPGRpdiBjbGFzcz0iYWRtLXRhYnMiPiR7dC5tYXAoKFtrLCBsXSkgPT4gYDxidXR0b24gY2xhc3M9IiR7c3RhdGUuYWRtaW4udGFiID09PSBrID8gJ29uJyA6ICcnfSIgb25jbGljaz0iYWRtaW5UYWIoJyR7a30nKSI+JHtsfTwvYnV0dG9uPmApLmpvaW4oJycpfTwvZGl2PmA7Cn0KZnVuY3Rpb24gdmlld0FkbWluKCkgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48ZGl2IGNsYXNzPSJjcnVtYiI+PGEgb25jbGljaz0ic2V0VGFiKCdhY2NvdW50JykiPtit2LPYp9io2Yo8L2E+IOKAuiDZhNmI2K3YqSDYp9mE2KrYrdmD2YU8L2Rpdj48aDMgY2xhc3M9InNlYyI+8J+boe+4jyDZhNmI2K3YqSDYqtit2YPZhSDYs9mI2KjYsSDYotioPC9oMz4ke2FkbWluVGFicygpfTxkaXYgaWQ9ImFkbUJvZHkiPjxkaXYgY2xhc3M9ImxvYWRpbmciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOKApjwvZGl2PjwvZGl2PjwvZGl2PmA7Cn0KZnVuY3Rpb24gYWRtaW5UYWIoaykgeyBzdGF0ZS5hZG1pbi50YWIgPSBrOyByZW5kZXIoKTsgbG9hZEFkbWluVGFiKCk7IH0KYXN5bmMgZnVuY3Rpb24gbG9hZEFkbWluVGFiKCkgewogIGNvbnN0IGJvZHkgPSAkKCdhZG1Cb2R5Jyk7IGlmICghYm9keSkgcmV0dXJuOwogIHRyeSB7CiAgICBpZiAoc3RhdGUuYWRtaW4udGFiID09PSAnc3RhdHMnKSB7IGNvbnN0IHMgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vc3RhdHMnKTsgYm9keS5pbm5lckhUTUwgPSBhZG1TdGF0cyhzKTsgfQogICAgZWxzZSBpZiAoc3RhdGUuYWRtaW4udGFiID09PSAncmVzdGF1cmFudHMnKSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vcmVzdGF1cmFudHMnKTsgc3RhdGUuYWRtaW4ucmVzdGF1cmFudHMgPSByLnJlc3RhdXJhbnRzOyBib2R5LmlubmVySFRNTCA9IGFkbVJlc3RhdXJhbnRzKHIucmVzdGF1cmFudHMpOyB9CiAgICBlbHNlIGlmIChzdGF0ZS5hZG1pbi50YWIgPT09ICdvcmRlcnMnKSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vb3JkZXJzJyk7IGJvZHkuaW5uZXJIVE1MID0gYWRtT3JkZXJzKHIub3JkZXJzKTsgfQogICAgZWxzZSBpZiAoc3RhdGUuYWRtaW4udGFiID09PSAndXNlcnMnKSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vdXNlcnMnKTsgYm9keS5pbm5lckhUTUwgPSBhZG1Vc2VycyhyLnVzZXJzKTsgfQogICAgZWxzZSBpZiAoc3RhdGUuYWRtaW4udGFiID09PSAnY291cG9ucycpIHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9jb3Vwb25zJyk7IGJvZHkuaW5uZXJIVE1MID0gYWRtQ291cG9ucyhyLmNvdXBvbnMpOyB9CiAgfSBjYXRjaCAoZSkgeyBib2R5LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGgzPiR7ZXNjKGUubWVzc2FnZSl9PC9oMz48L2Rpdj5gOyB9Cn0KZnVuY3Rpb24gYWRtU3RhdHMocykgewogIGNvbnN0IGNhcmRzID0gW1sn8J+RpScsIHMudXNlcnMsICfZhdiz2KrYrtiv2YXZiNmGJ10sIFsn4pyFJywgcy52ZXJpZmllZCwgJ9mF2YHYudmR2YTZiNmGJ10sIFsn8J+PqicsIHMucmVzdGF1cmFudHMsICfZhdi32KfYudmFJ10sIFsn8J+nvicsIHMub3JkZXJzLCAn2LfZhNio2KfYqiddLCBbJ/Cfm7UnLCBzLmFjdGl2ZU9yZGVycywgJ9i32YTYqNin2Kog2YbYtNi32KknXSwgWyfwn5KwJywgbW9uZXkocy5yZXZlbnVlKSwgJ9in2YTYpdmK2LHYp9iv2KfYqiAo2LEu2LMpJ10sIFsn4q2QJywgcy5yZXZpZXdzLCAn2KrZgtmK2YrZhdin2KonXV07CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJzdGF0LWdyaWQiPiR7Y2FyZHMubWFwKGMgPT4gYDxkaXYgY2xhc3M9ImNhcmQgc3RhdCI+PGRpdiBjbGFzcz0ibiI+JHtjWzFdfTwvZGl2PjxkaXYgY2xhc3M9ImwiPiR7Y1swXX0gJHtjWzJdfTwvZGl2PjwvZGl2PmApLmpvaW4oJycpfTwvZGl2PmA7Cn0KZnVuY3Rpb24gYWRtUmVzdGF1cmFudHMobGlzdCkgewogIHJldHVybiBgPGJ1dHRvbiBjbGFzcz0iYnRuLXNvZnQiIHN0eWxlPSJtYXgtd2lkdGg6MjQwcHg7bWFyZ2luLWJvdHRvbToxNHB4IiBvbmNsaWNrPSJhZG1BZGRSZXN0YXVyYW50KCkiPisg2KXYttin2YHYqSDZhdi32LnZhTwvYnV0dG9uPgogICAgJHtsaXN0Lm1hcChyID0+IGA8ZGl2IGNsYXNzPSJjYXJkIGFkbS1yb3ciPjxkaXYgY2xhc3M9ImF2YSIgc3R5bGU9ImJhY2tncm91bmQ6JHtyLmNvbG9yfTt3aWR0aDo0MHB4O2hlaWdodDo0MHB4O2JvcmRlci1yYWRpdXM6MTBweDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2NvbG9yOiNmZmY7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxMXB4Ij4ke2VzYyhyLmxvZ28pfTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJ1aSI+PGg1PiR7ZXNjKHIubmFtZSl9ICR7ci5hY3RpdmUgPyAnJyA6ICc8c3BhbiBjbGFzcz0idGFndiBuIj7Zhdiu2YHZijwvc3Bhbj4nfTwvaDU+PHA+JHtlc2Moci5jYXQpfSDCtyDimIUgJHtyLnJhdGluZ308L3A+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImFkbS1hY3QiPjxidXR0b24gY2xhc3M9Im1pbmkiIG9uY2xpY2s9ImFkbVRvZ2dsZVJlc3QoJyR7ci5pZH0nLCR7IXIuYWN0aXZlfSkiPiR7ci5hY3RpdmUgPyAn2KXYrtmB2KfYoScgOiAn2KXYuNmH2KfYsSd9PC9idXR0b24+PGJ1dHRvbiBjbGFzcz0ibWluaSIgb25jbGljaz0iYWRtRWRpdFJlc3QoJyR7ci5pZH0nKSI+2KrYudiv2YrZhDwvYnV0dG9uPjxidXR0b24gY2xhc3M9ImRlbCIgb25jbGljaz0iYWRtRGVsUmVzdCgnJHtyLmlkfScpIj7Yrdiw2YE8L2J1dHRvbj48L2Rpdj48L2Rpdj5gKS5qb2luKCcnKX1gOwp9CmZ1bmN0aW9uIGFkbU9yZGVycyhsaXN0KSB7CiAgaWYgKCFsaXN0Lmxlbmd0aCkgcmV0dXJuIGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iZSI+8J+nvjwvZGl2PjxoMz7ZhNinINi32YTYqNin2Ko8L2gzPjwvZGl2PmA7CiAgY29uc3Qgb3B0cyA9IFsncGVuZGluZycsICdjb25maXJtZWQnLCAncHJlcGFyaW5nJywgJ29uX3RoZV93YXknLCAnZGVsaXZlcmVkJywgJ2NhbmNlbGxlZCddOwogIHJldHVybiBsaXN0Lm1hcChvID0+IGA8ZGl2IGNsYXNzPSJjYXJkIGFkbS1yb3ciPjxkaXYgY2xhc3M9InVpIj48aDU+IyR7by5pZH0gwrcgJHtlc2Moby5yZXN0YXVyYW50TmFtZSl9IDxzcGFuIGNsYXNzPSJtdXRlZCI+wrcgJHtlc2Moby5hcHBOYW1lKX08L3NwYW4+PC9oNT48cD4ke2VzYyhvLnVzZXJOYW1lIHx8ICcnKX0gwrcgJHtvLml0ZW1zLmxlbmd0aH0g2LXZhtmBIMK3ICR7bW9uZXkoby50b3RhbCl9INixLtizIMK3ICR7dGltZUFnbyhvLmNyZWF0ZWRBdCl9PC9wPjwvZGl2PgogICAgPHNlbGVjdCBjbGFzcz0iYWRtLXNlbCIgb25jaGFuZ2U9ImFkbU9yZGVyU3RhdHVzKCR7by5pZH0sdGhpcy52YWx1ZSkiPiR7b3B0cy5tYXAocyA9PiBgPG9wdGlvbiB2YWx1ZT0iJHtzfSIgJHtvLnN0YXR1cyA9PT0gcyA/ICdzZWxlY3RlZCcgOiAnJ30+JHtTVEFUVVNfQVJbc119PC9vcHRpb24+YCkuam9pbignJyl9PC9zZWxlY3Q+PC9kaXY+YCkuam9pbignJyk7Cn0KZnVuY3Rpb24gYWRtVXNlcnMobGlzdCkgewogIHJldHVybiBsaXN0Lm1hcCh1ID0+IGA8ZGl2IGNsYXNzPSJjYXJkIGFkbS1yb3ciPjxkaXYgY2xhc3M9ImF2YSIgc3R5bGU9ImJhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7d2lkdGg6NDBweDtoZWlnaHQ6NDBweDtib3JkZXItcmFkaXVzOjUwJTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2NvbG9yOiNmZmY7Zm9udC13ZWlnaHQ6ODAwIj4ke2VzYyh1Lm5hbWVbMF0gfHwgJz8nKX08L2Rpdj4KICAgIDxkaXYgY2xhc3M9InVpIj48aDU+JHtlc2ModS5uYW1lKX08L2g1PjxwPiR7ZXNjKHUuZW1haWwpfTwvcD48ZGl2IGNsYXNzPSJ0YWdzLXJvdyI+PHNwYW4gY2xhc3M9InRhZ3YgJHt1LnZlcmlmaWVkID8gJ3knIDogJ24nfSI+JHt1LnZlcmlmaWVkID8gJ9mF2YHYudmR2YQnIDogJ9i62YrYsSDZhdmB2LnZkdmEJ308L3NwYW4+JHt1LmlzQWRtaW4gPyAnPHNwYW4gY2xhc3M9InRhZ3YgYSI+2YXYr9mK2LE8L3NwYW4+JyA6ICcnfTwvZGl2PjwvZGl2PgogICAgJHt1LmlkID09PSBzdGF0ZS51c2VyLmlkID8gJzxzcGFuIGNsYXNzPSJtdXRlZCI+2KPZhtiqPC9zcGFuPicgOiBgPGJ1dHRvbiBjbGFzcz0iZGVsIiBvbmNsaWNrPSJhZG1EZWxVc2VyKCR7dS5pZH0pIj7Yrdiw2YE8L2J1dHRvbj5gfTwvZGl2PmApLmpvaW4oJycpOwp9CmZ1bmN0aW9uIGFkbUNvdXBvbnMobGlzdCkgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY291cG9uLWZvcm0gY2FyZCBwYWQiPjxoNCBzdHlsZT0ibWFyZ2luLWJvdHRvbToxMHB4Ij7Ypdi22KfZgdipL9iq2LnYr9mK2YQg2YPZiNio2YjZhjwvaDQ+CiAgICA8ZGl2IGNsYXNzPSJjZi1ncmlkIj48aW5wdXQgaWQ9ImNmQ29kZSIgcGxhY2Vob2xkZXI9Itin2YTZg9mI2K8gKFdFTENPTUUxMCkiLz48c2VsZWN0IGlkPSJjZlR5cGUiPjxvcHRpb24gdmFsdWU9InBlcmNlbnQiPtmG2LPYqNipINmqPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iYW1vdW50Ij7Zhdio2YTYuiDYsS7Yszwvb3B0aW9uPjwvc2VsZWN0PjxpbnB1dCBpZD0iY2ZWYWx1ZSIgdHlwZT0ibnVtYmVyIiBwbGFjZWhvbGRlcj0i2KfZhNmC2YrZhdipIi8+PGlucHV0IGlkPSJjZkNhcCIgdHlwZT0ibnVtYmVyIiBwbGFjZWhvbGRlcj0i2K3YryDYo9mC2LXZiSDZhNmE2K7YtdmFICgwKSIvPjxpbnB1dCBpZD0iY2ZNaW4iIHR5cGU9Im51bWJlciIgcGxhY2Vob2xkZXI9Itit2K8g2KPYr9mG2Ykg2YTZhNi32YTYqCAoMCkiLz48aW5wdXQgaWQ9ImNmRGVzY3IiIHBsYWNlaG9sZGVyPSLYp9mE2YjYtdmBIi8+PC9kaXY+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4tc29mdCIgc3R5bGU9Im1heC13aWR0aDoyMDBweDttYXJnaW4tdG9wOjEwcHgiIG9uY2xpY2s9ImFkbVNhdmVDb3Vwb24oKSI+2K3Zgdi4INin2YTZg9mI2KjZiNmGPC9idXR0b24+PC9kaXY+CiAgICAke2xpc3QubWFwKGMgPT4gYDxkaXYgY2xhc3M9ImNhcmQgYWRtLXJvdyI+PGRpdiBjbGFzcz0iY2MtY29kZSI+JHtlc2MoYy5jb2RlKX08L2Rpdj48ZGl2IGNsYXNzPSJ1aSI+PGg1PiR7Yy50eXBlID09PSAncGVyY2VudCcgPyBjLnZhbHVlICsgJ9mqJyA6IGMudmFsdWUgKyAnINixLtizJ30ke2MuY2FwID8gJyAo2K3YqtmJICcgKyBjLmNhcCArICcpJyA6ICcnfTwvaDU+PHA+JHtlc2MoYy5kZXNjciB8fCAnJyl9ICR7Yy5hY3RpdmUgPyAnJyA6ICfCtyDZhdi52LfZkdmEJ308L3A+PC9kaXY+PGJ1dHRvbiBjbGFzcz0iZGVsIiBvbmNsaWNrPSJhZG1EZWxDb3Vwb24oJyR7Yy5jb2RlfScpIj7Yrdiw2YE8L2J1dHRvbj48L2Rpdj5gKS5qb2luKCcnKX1gOwp9CmFzeW5jIGZ1bmN0aW9uIGFkbUFkZFJlc3RhdXJhbnQoKSB7CiAgY29uc3QgaWQgPSBwcm9tcHQoJ9mF2LnYsdmR2YEg2KfZhNmF2LfYudmFICjYpdmG2KzZhNmK2LLZiiDYqNiv2YjZhiDZhdiz2KfZgdin2KrYjCDZhdir2YQ6IHNoYXdhcm1hKTonKTsgaWYgKCFpZCkgcmV0dXJuOwogIGNvbnN0IG5hbWUgPSBwcm9tcHQoJ9in2LPZhSDYp9mE2YXYt9i52YU6Jyk7IGlmICghbmFtZSkgcmV0dXJuOwogIGNvbnN0IGtpbmQgPSAocHJvbXB0KCfYp9mE2YbZiNi5OiDYp9mD2KrYqCBmb29kINij2YggZ3JvY2VyeScsICdmb29kJykgfHwgJ2Zvb2QnKS50cmltKCk7CiAgY29uc3QgY2F0ID0gcHJvbXB0KCfYp9mE2KrYtdmG2YrZgSAo2YXYq9mEOiDYtNin2YjYsdmF2Kcgwrcg2LnYsdio2YopOicsICfZhdij2YPZiNmE2KfYqicpIHx8ICfZhdij2YPZiNmE2KfYqic7CiAgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2FkbWluL3Jlc3RhdXJhbnRzJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaWQudHJpbSgpLCBuYW1lOiBuYW1lLnRyaW0oKSwga2luZCwgY2F0LCBsb2dvOiBuYW1lLnRyaW0oKS5zbGljZSgwLCA0KSB9KSB9KTsgbG9hZEFkbWluVGFiKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGFkbUVkaXRSZXN0KGlkKSB7IGNvbnN0IHIgPSBzdGF0ZS5hZG1pbi5yZXN0YXVyYW50cy5maW5kKHggPT4geC5pZCA9PT0gaWQpOyBjb25zdCBuYW1lID0gcHJvbXB0KCfYp9iz2YUg2KfZhNmF2LfYudmFOicsIHIubmFtZSk7IGlmIChuYW1lID09IG51bGwpIHJldHVybjsgY29uc3QgY2F0ID0gcHJvbXB0KCfYp9mE2KrYtdmG2YrZgTonLCByLmNhdCk7IGNvbnN0IHJhdGluZyA9IHByb21wdCgn2KfZhNiq2YLZitmK2YUgKDEtNSk6Jywgci5yYXRpbmcpOyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vcmVzdGF1cmFudHMvJyArIGlkLCB7IG1ldGhvZDogJ1BVVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbmFtZSwgY2F0LCByYXRpbmc6IE51bWJlcihyYXRpbmcpIH0pIH0pOyBsb2FkQWRtaW5UYWIoKTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gYWRtVG9nZ2xlUmVzdChpZCwgYWN0aXZlKSB7IHRyeSB7IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9yZXN0YXVyYW50cy8nICsgaWQsIHsgbWV0aG9kOiAnUFVUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3RpdmUgfSkgfSk7IGxvYWRBZG1pblRhYigpOyB9IGNhdGNoIChlKSB7IGFsZXJ0KGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBhZG1EZWxSZXN0KGlkKSB7IGlmICghY29uZmlybSgn2K3YsNmBINmH2LDYpyDYp9mE2YXYt9i52YUg2YjZhdmG2YrZiNmH2J8nKSkgcmV0dXJuOyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vcmVzdGF1cmFudHMvJyArIGlkLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7IGxvYWRBZG1pblRhYigpOyB9IGNhdGNoIChlKSB7IGFsZXJ0KGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBhZG1PcmRlclN0YXR1cyhpZCwgc3RhdHVzKSB7IHRyeSB7IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9vcmRlcnMvJyArIGlkICsgJy9zdGF0dXMnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN0YXR1cyB9KSB9KTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gYWRtRGVsVXNlcihpZCkgeyBpZiAoIWNvbmZpcm0oJ9it2LDZgSDZh9iw2Kcg2KfZhNmF2LPYqtiu2K/ZhdifJykpIHJldHVybjsgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2FkbWluL3VzZXJzLycgKyBpZCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pOyBsb2FkQWRtaW5UYWIoKTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gYWRtU2F2ZUNvdXBvbigpIHsgY29uc3QgY29kZSA9IHZhbCgnY2ZDb2RlJyk7IGlmICghY29kZSkgcmV0dXJuIGFsZXJ0KCfYo9iv2K7ZhCDYp9mE2YPZiNivJyk7IHRyeSB7IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi9jb3Vwb25zJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBjb2RlLCB0eXBlOiAkKCdjZlR5cGUnKS52YWx1ZSwgdmFsdWU6IE51bWJlcih2YWwoJ2NmVmFsdWUnKSksIGNhcDogTnVtYmVyKHZhbCgnY2ZDYXAnKSkgfHwgMCwgbWluX29yZGVyOiBOdW1iZXIodmFsKCdjZk1pbicpKSB8fCAwLCBkZXNjcjogdmFsKCdjZkRlc2NyJyksIGFjdGl2ZTogdHJ1ZSB9KSB9KTsgbG9hZEFkbWluVGFiKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfSB9CmFzeW5jIGZ1bmN0aW9uIGFkbURlbENvdXBvbihjb2RlKSB7IGlmICghY29uZmlybSgn2K3YsNmBINin2YTZg9mI2KjZiNmGICcgKyBjb2RlICsgJ9ifJykpIHJldHVybjsgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2FkbWluL2NvdXBvbnMvJyArIGNvZGUsIHsgbWV0aG9kOiAnREVMRVRFJyB9KTsgbG9hZEFkbWluVGFiKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfSB9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0g2KrZhtmC2ZHZhCArINi52LHYtiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gdmlld0J5VGFiKCkgewogIGlmIChzdGF0ZS50YWIgPT09ICdvZmZlcnMnKSByZXR1cm4gdmlld09mZmVycygpOwogIGlmIChzdGF0ZS50YWIgPT09ICdvcmRlcnMnKSByZXR1cm4gc3RhdGUuc2NyZWVuID09PSAnb3JkZXInID8gdmlld09yZGVyKCkgOiB2aWV3T3JkZXJzVGFiKCk7CiAgaWYgKHN0YXRlLnRhYiA9PT0gJ2FjY291bnQnKSByZXR1cm4gc3RhdGUuc2NyZWVuID09PSAnYWRtaW4nID8gdmlld0FkbWluKCkgOiB2aWV3UHJvZmlsZSgpOwogIGlmIChzdGF0ZS5zY3JlZW4gPT09ICdzdG9yZScpIHJldHVybiB2aWV3U3RvcmUoKTsKICBpZiAoc3RhdGUuc2NyZWVuID09PSAnY29tcGFyZScpIHJldHVybiB2aWV3Q29tcGFyZSgpOwogIGlmIChzdGF0ZS5zY3JlZW4gPT09ICdsaXN0JykgcmV0dXJuIHZpZXdMaXN0KCk7CiAgaWYgKHN0YXRlLnNjcmVlbiA9PT0gJ29yZGVyJykgcmV0dXJuIHZpZXdPcmRlcigpOwogIHJldHVybiB2aWV3SG9tZSgpOwp9CmFzeW5jIGZ1bmN0aW9uIHJlbmRlcigpIHsKICBjb25zdCBhcHAgPSAkKCdhcHAnKTsKICBpZiAoIXN0YXRlLnVzZXIpIHsgYXBwLmNsYXNzTmFtZSA9ICdhcHAgYXV0aC1tb2RlJzsgJCgndG9wbmF2JykuaW5uZXJIVE1MID0gJyc7ICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IHZpZXdBdXRoKCk7IHdpbmRvdy5zY3JvbGxUbygwLCAwKTsgcmV0dXJuOyB9CiAgYXBwLmNsYXNzTmFtZSA9ICdhcHAnOwogICQoJ3RvcG5hdicpLmlubmVySFRNTCA9IHRvcE5hdigpOwogIGNvbnN0IHYgPSB2aWV3QnlUYWIoKTsKICAkKCdzY3JlZW4nKS5pbm5lckhUTUwgPSAodiBpbnN0YW5jZW9mIFByb21pc2UpID8gJzxkaXYgY2xhc3M9ImxvYWRpbmciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+IOKApjwvZGl2PicgOiB2OwogIGlmICh2IGluc3RhbmNlb2YgUHJvbWlzZSkgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gYXdhaXQgdjsKICAvLyDZhNmI2K3Yp9iqINil2LbYp9mB2YrYqSArINiq2K3ZhdmK2YQg2LrZitixINmF2KrYstin2YXZhgogIGxldCBucCA9ICQoJ25vdGlmUG9wJyk7IGlmIChucCkgbnAucmVtb3ZlKCk7CiAgaWYgKHN0YXRlLm5vdGlmT3BlbikgeyBjb25zdCBkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IGQuaWQgPSAnbm90aWZQb3AnOyBkLmlubmVySFRNTCA9IG5vdGlmUGFuZWwoKTsgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkLmZpcnN0Q2hpbGQpOyB9CiAgaWYgKHN0YXRlLnRhYiA9PT0gJ29yZGVycycgJiYgc3RhdGUuc2NyZWVuICE9PSAnb3JkZXInKSBsb2FkT3JkZXJzKCk7CiAgaWYgKHN0YXRlLnRhYiA9PT0gJ29mZmVycycpIGxvYWRDb3Vwb25zKCk7CiAgd2luZG93LnNjcm9sbFRvKDAsIDApOwp9CgovKiAtLS0tLS0tLS0tINij2K3Yr9in2KsgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBzZXRUYWIoaykgeyBzdGF0ZS5ub3RpZk9wZW4gPSBmYWxzZTsgc3RhdGUudGFiID0gazsgaWYgKGsgPT09ICdob21lJykgeyBzdGF0ZS5zY3JlZW4gPSAnaG9tZSc7IHN0YXRlLnF1ZXJ5ID0gJyc7IH0gZWxzZSBpZiAoayA9PT0gJ29yZGVycycpIHN0YXRlLnNjcmVlbiA9ICdvcmRlcnNMaXN0JzsgZWxzZSBpZiAoayA9PT0gJ2FjY291bnQnKSBzdGF0ZS5zY3JlZW4gPSAncHJvZmlsZSc7IGVsc2Ugc3RhdGUuc2NyZWVuID0gJ2hvbWUnOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBzZXRNb2RlKG0pIHsgc3RhdGUubW9kZSA9IG07IHN0YXRlLnRhYiA9ICdob21lJzsgc3RhdGUuc2NyZWVuID0gJ2xpc3QnOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBnb0hvbWUoKSB7IHN0YXRlLm5vdGlmT3BlbiA9IGZhbHNlOyBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdob21lJzsgc3RhdGUucXVlcnkgPSAnJzsgcmVuZGVyKCk7IH0KYXN5bmMgZnVuY3Rpb24gb3BlblN0b3JlKGlkKSB7ICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPjxkaXYgY2xhc3M9ImxvYWRpbmciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+INis2KfYsdmKINin2YTZgdiq2K3igKY8L2Rpdj48L2Rpdj5gOyB0cnkgeyBzdGF0ZS5zdG9yZSA9IGF3YWl0IGFwaSgnL2FwaS9zdG9yZXMvJyArIGlkKTsgc3RhdGUuY2FydCA9IHt9OyBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdzdG9yZSc7IHJlbmRlcigpOyB9IGNhdGNoIChlKSB7ICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPjxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7imqDvuI88L2Rpdj48aDM+JHtlc2MoZS5tZXNzYWdlKX08L2gzPjwvZGl2PjwvZGl2PmA7IH0gfQphc3luYyBmdW5jdGlvbiBnb0NvbXBhcmUoKSB7IHN0YXRlLnNjcmVlbiA9ICdjb21wYXJlJzsgc3RhdGUuY21wID0gbnVsbDsgcmVuZGVyKCk7IGF3YWl0IHJlZnJlc2hDb21wYXJlKCk7IH0KYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENvbXBhcmUoKSB7IHN0YXRlLmNtcCA9IGF3YWl0IGFwaSgnL2FwaS9jb21wYXJlJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdG9yZUlkOiBzdGF0ZS5zdG9yZS5pZCwgY2FydDogc3RhdGUuY2FydCwgc3Viczogc3RhdGUuc3VicyB9KSB9KTsgaWYgKHN0YXRlLnNjcmVlbiA9PT0gJ2NvbXBhcmUnKSByZW5kZXIoKTsgfQpmdW5jdGlvbiBpbmMoaWQpIHsgc3RhdGUuY2FydFtpZF0gPSAoc3RhdGUuY2FydFtpZF0gfHwgMCkgKyAxOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBkZWMoaWQpIHsgc3RhdGUuY2FydFtpZF0gPSBNYXRoLm1heCgwLCAoc3RhdGUuY2FydFtpZF0gfHwgMCkgLSAxKTsgaWYgKCFzdGF0ZS5jYXJ0W2lkXSkgZGVsZXRlIHN0YXRlLmNhcnRbaWRdOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBvblNlYXJjaCh2KSB7IHN0YXRlLnF1ZXJ5ID0gdjsgY29uc3Qgc2MgPSAkKCdzY3JlZW4nKTsgY29uc3QgdmlldyA9IHZpZXdCeVRhYigpOyBpZiAoISh2aWV3IGluc3RhbmNlb2YgUHJvbWlzZSkpIHsgc2MuaW5uZXJIVE1MID0gdmlldzsgY29uc3QgaSA9ICQoJ3EnKTsgaWYgKGkpIHsgaS5mb2N1cygpOyBpLnNldFNlbGVjdGlvblJhbmdlKHYubGVuZ3RoLCB2Lmxlbmd0aCk7IH0gfSB9CmFzeW5jIGZ1bmN0aW9uIHRvZ2dsZVN1YihpZCkgeyBzdGF0ZS5zdWJzW2lkXSA9ICFzdGF0ZS5zdWJzW2lkXTsgaWYgKHN0YXRlLnRhYiA9PT0gJ2FjY291bnQnKSByZW5kZXIoKTsgZWxzZSBpZiAoc3RhdGUuc2NyZWVuID09PSAnY29tcGFyZScpIGF3YWl0IHJlZnJlc2hDb21wYXJlKCk7IGVsc2UgaWYgKHN0YXRlLmNoZWNrb3V0ICYmICQoJ21vZGFsJykpIHsgLyog2YHZiiDYp9mE2K/Zgdi5ICovIH0gZWxzZSByZW5kZXIoKTsgfQphc3luYyBmdW5jdGlvbiB0b2dnbGVGYXYoaWQpIHsgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9wcm9maWxlL2Zhdm9yaXRlcycsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3RvcmVJZDogaWQgfSkgfSk7IHN0YXRlLnVzZXIuZmF2b3JpdGVzID0gci5mYXZvcml0ZXM7IHJlbmRlcigpOyB9IGNhdGNoIChlKSB7IGFsZXJ0KGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBzYXZlQWRkcigpIHsgY29uc3QgYWRkcmVzcyA9IHZhbCgncEFkZHInKTsgaWYgKCFhZGRyZXNzKSByZXR1cm47IHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvcHJvZmlsZScsIHsgbWV0aG9kOiAnUFVUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZGRyZXNzIH0pIH0pOyBzdGF0ZS51c2VyID0geyAuLi5zdGF0ZS51c2VyLCAuLi5yLnVzZXIgfTsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfSB9CmZ1bmN0aW9uIGNsb3NlTW9kYWwoKSB7IGNvbnN0IG0gPSAkKCdtb2RhbCcpOyBpZiAobSkgbS5yZW1vdmUoKTsgc3RhdGUuY2hlY2tvdXQgPSBudWxsOyB9CmFzeW5jIGZ1bmN0aW9uIHRvZ2dsZU5vdGlmKCkgeyBzdGF0ZS5ub3RpZk9wZW4gPSAhc3RhdGUubm90aWZPcGVuOyBpZiAoc3RhdGUubm90aWZPcGVuICYmIHN0YXRlLm5vdGlmVW5yZWFkKSB7IHRyeSB7IGF3YWl0IGFwaSgnL2FwaS9ub3RpZmljYXRpb25zL3JlYWQnLCB7IG1ldGhvZDogJ1BPU1QnIH0pOyBzdGF0ZS5ub3RpZlVucmVhZCA9IDA7IH0gY2F0Y2gge30gfSByZW5kZXIoKTsgfQoKT2JqZWN0LmFzc2lnbih3aW5kb3csIHsgYXV0aFZpZXcsIGRvUmVnaXN0ZXIsIGRvVmVyaWZ5LCBkb1Jlc2VuZCwgZG9Mb2dpbiwgZG9Gb3Jnb3QsIGRvUmVzZXQsIGRvTG9nb3V0LCBzZXRUYWIsIHNldE1vZGUsIGdvSG9tZSwgb3BlblN0b3JlLCBnb0NvbXBhcmUsIGluYywgZGVjLCBvblNlYXJjaCwgdG9nZ2xlU3ViLCB0b2dnbGVGYXYsIHNhdmVBZGRyLCBjbG9zZU1vZGFsLCBvcGVuQ2hlY2tvdXQsIGFwcGx5Q291cG9uLCBjb25maXJtT3JkZXIsIG9wZW5PcmRlciwgc2V0UmF0ZSwgc3VibWl0UmV2aWV3LCB0b2dnbGVOb3RpZiwgb3BlbkFkbWluLCBhZG1pblRhYiwgYWRtQWRkUmVzdGF1cmFudCwgYWRtRWRpdFJlc3QsIGFkbVRvZ2dsZVJlc3QsIGFkbURlbFJlc3QsIGFkbU9yZGVyU3RhdHVzLCBhZG1EZWxVc2VyLCBhZG1TYXZlQ291cG9uLCBhZG1EZWxDb3Vwb24gfSk7CmluaXQoKTsK" } };
var LIVE_SEED = { "source": "\u0647\u0646\u0642\u0631\u0633\u062A\u064A\u0634\u0646", "sourceUrl": "https://hungerstation.com/sa-ar/restaurant/\u0627\u0644\u0631\u064A\u0627\u0636/\u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629/3792", "location": "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636", "fetchedAtISO": "2026-06-14T01:42:00+03:00", "fetchedAt": "2026-06-14 \xB7 01:42 (\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0631\u064A\u0627\u0636)", "stores": { "mcd": { "app": "hungerstation", "etaText": "15\u201330 \u062F", "deliveryFee": null, "items": { "bigtasty": 34, "bigmac": 27, "mcchicken": 29, "nuggets": 28, "fries": 9, "cola": 7, "mcflurry": 12 } } } };

// deploy-entry.js
var DATA_DIR = process.env.DATA_DIR || path3.join(process.cwd(), "data");
try {
  fs3.mkdirSync(DATA_DIR, { recursive: true });
  const f = path3.join(DATA_DIR, "live-data.json");
  if (!fs3.existsSync(f)) fs3.writeFileSync(f, JSON.stringify(LIVE_SEED, null, 2));
} catch {
}
var app = express5();
app.use(express5.json());
app.use(authMiddleware);
app.use("/api/auth", auth_routes_default);
app.use("/api/profile", profile_routes_default);
app.use("/api/admin", admin_routes_default);
app.use("/api", app_routes_default);
var send = (res, name) => {
  const a = ASSETS[name];
  if (!a) return res.status(404).end();
  res.type(a.type).send(Buffer.from(a.b64, "base64"));
};
app.get(["/", "/index.html"], (req, res) => send(res, "index.html"));
app.get("/styles.css", (req, res) => send(res, "styles.css"));
app.get("/auth.css", (req, res) => send(res, "auth.css"));
app.get("/app.js", (req, res) => send(res, "app.js"));
var PORT = process.env.PORT || 3e3;
init().then(() => app.listen(PORT, () => console.log(`\u{1F354} super-app + Postgres \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 ${PORT}`))).catch((err) => {
  console.error("\u0641\u0634\u0644 \u062A\u0647\u064A\u0626\u0629 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A:", err);
  process.exit(1);
});
