// deploy-entry.js
import express5 from "express";
import path4 from "path";
import fs4 from "fs";

// src/auth.js
import crypto from "crypto";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/db.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
var FILE = path.join(DATA_DIR, "db.json");
function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: [], seq: 0 };
  }
}
var db = load();
function persist() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}
var listUsers = () => db.users;
var userCount = () => db.users.length;
var getById = (id) => db.users.find((u) => u.id === id);
var getByEmail = (email) => db.users.find((u) => u.email === String(email || "").toLowerCase());
function createUser(data) {
  db.seq += 1;
  const user = { id: db.seq, ...data };
  db.users.push(user);
  persist();
  return user;
}
function updateUser(id, patch) {
  const u = getById(id);
  if (!u) return null;
  Object.assign(u, patch);
  persist();
  return u;
}
function deleteUser(id) {
  const i = db.users.findIndex((u) => u.id === id);
  if (i < 0) return false;
  db.users.splice(i, 1);
  persist();
  return true;
}

// src/auth.js
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var SECRET = process.env.SESSION_SECRET || loadOrCreateSecret();
function loadOrCreateSecret() {
  const f = path2.join(process.env.DATA_DIR || path2.join(process.cwd(), "data"), "secret.key");
  try {
    return fs2.readFileSync(f, "utf8");
  } catch {
    const s = crypto.randomBytes(32).toString("hex");
    fs2.mkdirSync(path2.dirname(f), { recursive: true });
    fs2.writeFileSync(f, s);
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
function authMiddleware(req, res, next) {
  const t = parseCookies(req)[COOKIE];
  const p = t ? verifyToken(t) : null;
  req.user = p ? getById(p.uid) || null : null;
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
  const name = (req.body?.name || "").trim();
  const email = norm(req.body?.email);
  const password = req.body?.password || "";
  if (!name) return res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
  if (!emailOk(email)) return res.status(400).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
  if (password.length < 8) return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0668 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
  if (getByEmail(email)) return res.status(409).json({ error: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0633\u062C\u0651\u0644 \u0645\u0633\u0628\u0642\u064B\u0627" });
  const code = genCode();
  const isAdmin = userCount() === 0 || email === norm(process.env.ADMIN_EMAIL);
  createUser({
    name,
    email,
    password: hashPassword(password),
    verified: false,
    isAdmin,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    address: "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636",
    favorites: [],
    codeHash: hashCode(code),
    codeExp: Date.now() + CODE_TTL,
    codePurpose: "verify",
    codeAttempts: 0
  });
  const m = await sendCode(email, code, "verify");
  res.json({ ok: true, email, mode: mailMode(), devCode: m.dev ? code : void 0 });
});
router.post("/verify", (req, res) => {
  const email = norm(req.body?.email);
  const code = req.body?.code || "";
  const u = getByEmail(email);
  if (!u) return res.status(404).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  if (u.verified) {
    setSession(res, u.id);
    return res.json({ ok: true, user: publicUser(u) });
  }
  if (!u.codeHash || u.codePurpose !== "verify" || Date.now() > u.codeExp)
    return res.status(400).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632\u060C \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u064B\u0627 \u062C\u062F\u064A\u062F\u064B\u0627" });
  if ((u.codeAttempts || 0) >= 5) return res.status(429).json({ error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629\u060C \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u064B\u0627 \u062C\u062F\u064A\u062F\u064B\u0627" });
  if (hashCode(code) !== u.codeHash) {
    updateUser(u.id, { codeAttempts: (u.codeAttempts || 0) + 1 });
    return res.status(400).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
  }
  updateUser(u.id, { verified: true, codeHash: null, codeExp: null, codePurpose: null, codeAttempts: 0 });
  setSession(res, u.id);
  res.json({ ok: true, user: publicUser(getById(u.id)) });
});
router.post("/resend", async (req, res) => {
  const email = norm(req.body?.email);
  const u = getByEmail(email);
  if (!u) return res.status(404).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  if (u.verified) return res.status(400).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0641\u0639\u0651\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" });
  const code = genCode();
  updateUser(u.id, { codeHash: hashCode(code), codeExp: Date.now() + CODE_TTL, codePurpose: "verify", codeAttempts: 0 });
  const m = await sendCode(email, code, "verify");
  res.json({ ok: true, devCode: m.dev ? code : void 0 });
});
router.post("/login", (req, res) => {
  const email = norm(req.body?.email);
  const u = getByEmail(email);
  if (!u || !verifyPassword(req.body?.password || "", u.password))
    return res.status(401).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
  if (!u.verified) return res.status(403).json({ error: "\u0641\u0639\u0651\u0644 \u062D\u0633\u0627\u0628\u0643 \u0623\u0648\u0644\u064B\u0627", needVerify: true, email });
  setSession(res, u.id);
  res.json({ ok: true, user: publicUser(u) });
});
router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});
router.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));
router.post("/forgot", async (req, res) => {
  const email = norm(req.body?.email);
  const u = getByEmail(email);
  if (u) {
    const code = genCode();
    updateUser(u.id, { codeHash: hashCode(code), codeExp: Date.now() + CODE_TTL, codePurpose: "reset", codeAttempts: 0 });
    const m = await sendCode(email, code, "reset");
    return res.json({ ok: true, devCode: m.dev ? code : void 0 });
  }
  res.json({ ok: true });
});
router.post("/reset", (req, res) => {
  const email = norm(req.body?.email);
  const code = req.body?.code || "";
  const password = req.body?.password || "";
  const u = getByEmail(email);
  if (!u) return res.status(400).json({ error: "\u062A\u0639\u0630\u0651\u0631 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646" });
  if (!u.codeHash || u.codePurpose !== "reset" || Date.now() > u.codeExp)
    return res.status(400).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632" });
  if ((u.codeAttempts || 0) >= 5) return res.status(429).json({ error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629" });
  if (hashCode(code) !== u.codeHash) {
    updateUser(u.id, { codeAttempts: (u.codeAttempts || 0) + 1 });
    return res.status(400).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
  }
  if (password.length < 8) return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0668 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
  updateUser(u.id, { password: hashPassword(password), verified: true, codeHash: null, codeExp: null, codePurpose: null, codeAttempts: 0 });
  res.json({ ok: true });
});
var auth_routes_default = router;

// src/routes/app.routes.js
import express2 from "express";

// src/data.js
var LOCATION = "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636";
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

// src/compare.js
var round2 = (n) => Math.round(n * 100) / 100;
function flatItems(store) {
  return store.menu.flatMap((g) => g.items);
}
function cartSubtotal(store, cart) {
  const items = flatItems(store);
  return Object.entries(cart || {}).reduce((sum, [id, q]) => {
    const it = items.find((i) => i.id === id);
    return sum + (it ? it.p * q : 0);
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
import fs3 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var __dirname3 = path3.dirname(fileURLToPath3(import.meta.url));
var CACHE = path3.join(process.env.DATA_DIR || path3.join(process.cwd(), "data"), "live-data.json");
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
    return JSON.parse(fs3.readFileSync(CACHE, "utf8"));
  } catch {
    return null;
  }
}
function saveLive(data) {
  fs3.mkdirSync(path3.dirname(CACHE), { recursive: true });
  fs3.writeFileSync(CACHE, JSON.stringify(data, null, 2), "utf8");
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
  s.menu.forEach((g) => g.items.forEach((it) => {
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
var publicApps = () => Object.fromEntries(
  Object.entries(APPS).map(([id, a]) => [id, { name: a.name, short: a.short, color: a.color, text: a.text, sub: a.sub, promoLabel: a.promo.label || "" }])
);
var summary = (s) => ({
  id: s.id,
  kind: s.kind,
  name: s.name,
  cat: s.cat,
  color: s.color,
  rating: s.rating,
  eta: s.eta,
  logo: s.logo,
  on: s.on,
  live: !!s.live,
  liveSource: s.liveSource,
  liveAt: s.liveAt
});
router2.get("/config", (req, res) => {
  const live = loadLive();
  res.json({ location: LOCATION, apps: publicApps(), live: live ? { source: live.source, fetchedAt: live.fetchedAt } : null });
});
router2.get("/stores", requireVerified, (req, res) => {
  const live = loadLive();
  res.json(STORES.map((s) => summary(mergeLive(s, live))));
});
router2.get("/stores/:id", requireVerified, (req, res) => {
  const live = loadLive();
  const s = STORES.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "\u0627\u0644\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  res.json(mergeLive(s, live));
});
router2.post("/compare", requireVerified, (req, res) => {
  const { storeId, cart = {}, subs = {} } = req.body || {};
  const live = loadLive();
  const s0 = STORES.find((x) => x.id === storeId);
  if (!s0) return res.status(404).json({ error: "\u0627\u0644\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  const s = mergeLive(s0, live);
  res.json({ store: summary(s), live: s.live ? { source: s.liveSource, at: s.liveAt, app: s.liveApp } : null, ...computeOffers(s, cart, subs) });
});
router2.post("/refresh-live", requireVerified, async (req, res) => {
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
router3.put("/", (req, res) => {
  const patch = {};
  const name = (req.body?.name || "").trim();
  const address = (req.body?.address || "").trim();
  if (name) patch.name = name;
  if (address) patch.address = address;
  const u = updateUser(req.user.id, patch);
  res.json({ user: publicUser(u) });
});
router3.get("/favorites", (req, res) => res.json({ favorites: req.user.favorites || [] }));
router3.post("/favorites", (req, res) => {
  const { storeId } = req.body || {};
  if (!STORES.find((s) => s.id === storeId)) return res.status(400).json({ error: "\u0645\u062A\u062C\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
  const fav = new Set(req.user.favorites || []);
  fav.has(storeId) ? fav.delete(storeId) : fav.add(storeId);
  const u = updateUser(req.user.id, { favorites: [...fav] });
  res.json({ favorites: u.favorites });
});
var profile_routes_default = router3;

// src/routes/admin.routes.js
import express4 from "express";
var router4 = express4.Router();
router4.use(requireAdmin);
router4.get("/users", (req, res) => res.json({ users: listUsers().map(publicUser) }));
router4.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643" });
  deleteUser(id);
  res.json({ ok: true });
});
var admin_routes_default = router4;

// src/_assets.js
var ASSETS = { "index.html": { "type": "text/html; charset=utf-8", "b64": "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImFyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCIgLz4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiIC8+Cjx0aXRsZT7Ys9mI2KjYsSDYotioIOKAlCDZhdmG2LXYqSDZhdmC2KfYsdmG2Kkg2KfZhNiq2YjYtdmK2YQ8L3RpdGxlPgo8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iIC8+CjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4gLz4KPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1DYWlybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0IiAvPgo8bGluayByZWw9InN0eWxlc2hlZXQiIGhyZWY9InN0eWxlcy5jc3MiIC8+CjxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iYXV0aC5jc3MiIC8+CjwvaGVhZD4KPGJvZHk+CjxkaXYgY2xhc3M9ImFwcCIgaWQ9ImFwcCI+CiAgPGhlYWRlciBpZD0idG9wbmF2Ij48L2hlYWRlcj4KICA8bWFpbiBpZD0ic2NyZWVuIj48ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYp9mE2KrYrdmF2YrZhOKApjwvZGl2PjwvbWFpbj4KPC9kaXY+CjxzY3JpcHQgc3JjPSJhcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K" }, "styles.css": { "type": "text/css; charset=utf-8", "b64": "OnJvb3R7CiAgLS1icmFuZDE6IzZEMjhEOTsgLS1icmFuZDI6IzRGNDZFNTsgLS1icmFuZC1ncmFkOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzZEMjhEOSwjNEY0NkU1KTsKICAtLWdvbGQ6I0Y1OUUwQjsgLS1ncmVlbjojMTZBMzRBOyAtLWdyZWVuLXNvZnQ6I0RDRkNFNzsKICAtLWluazojMEYxNzJBOyAtLW11dGVkOiM2NDc0OEI7IC0tbGluZTojRTVFOUYwOyAtLWJnOiNGNEY2RkI7IC0tY2FyZDojZmZmOwogIC0tc2hhZG93OjAgNnB4IDIycHggcmdiYSgxNSwyMyw0MiwuMDcpOyAtLXJhZGl1czoxNnB4Owp9Cip7Ym94LXNpemluZzpib3JkZXItYm94O21hcmdpbjowO3BhZGRpbmc6MDstd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7fQpib2R5e2ZvbnQtZmFtaWx5OidDYWlybycsc3lzdGVtLXVpLCdTZWdvZSBVSScsc2Fucy1zZXJpZjtiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO21pbi1oZWlnaHQ6MTAwdmg7fQphe2N1cnNvcjpwb2ludGVyO30KLmFwcHttaW4taGVpZ2h0OjEwMHZoO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47fQoKLyogPT09PT0gVG9wIG5hdiA9PT09PSAqLwojdG9wbmF2e3Bvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjQwO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3gtc2hhZG93OjAgMXB4IDhweCByZ2JhKDE1LDIzLDQyLC4wNCk7fQoubmF2LWlubmVye21heC13aWR0aDoxMTgwcHg7bWFyZ2luOjAgYXV0bztwYWRkaW5nOjAgMjRweDtoZWlnaHQ6NjRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoyMHB4O30KLmJyYW5ke2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjE5cHg7Y3Vyc29yOnBvaW50ZXI7fQouYnJhbmQgLm1hcmt7d2lkdGg6MzRweDtoZWlnaHQ6MzRweDtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxN3B4O30KLm5hdi1saW5rc3tkaXNwbGF5OmZsZXg7Z2FwOjZweDtmbGV4OjE7fQoubmF2LWxpbmtzIGF7cGFkZGluZzo4cHggMTRweDtib3JkZXItcmFkaXVzOjEwcHg7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNHB4O2NvbG9yOnZhcigtLW11dGVkKTt9Ci5uYXYtbGlua3MgYTpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1pbmspO30KLm5hdi1saW5rcyBhLmFjdGl2ZXtiYWNrZ3JvdW5kOiNFRUYyRkY7Y29sb3I6dmFyKC0tYnJhbmQyKTt9Ci5uYXYtcmlnaHR7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDt9Ci5sb2MtY2hpcHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo3MDA7Y29sb3I6dmFyKC0tbXV0ZWQpO2JhY2tncm91bmQ6dmFyKC0tYmcpO3BhZGRpbmc6N3B4IDEycHg7Ym9yZGVyLXJhZGl1czozMHB4O30KLmJ0bi1vdXR7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtjb2xvcjp2YXIoLS1pbmspO2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxM3B4O3BhZGRpbmc6OHB4IDE2cHg7Ym9yZGVyLXJhZGl1czoxMHB4O2N1cnNvcjpwb2ludGVyO30KLmJ0bi1vdXQ6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kMik7Y29sb3I6dmFyKC0tYnJhbmQyKTt9Cgojc2NyZWVue2ZsZXg6MTt9Ci5jb250YWluZXJ7bWF4LXdpZHRoOjExODBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjZweCAyNHB4IDYwcHg7fQouY29udGFpbmVyLm5hcnJvd3ttYXgtd2lkdGg6NjgwcHg7fQouY3J1bWJ7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDttYXJnaW4tYm90dG9tOjE2cHg7fQouY3J1bWIgYXtjb2xvcjp2YXIoLS1icmFuZDIpO30KCi8qID09PT09IEhlcm8gKyBzZWFyY2ggPT09PT0gKi8KLmhlcm97YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MjJweDtwYWRkaW5nOjMwcHggMzBweDttYXJnaW4tYm90dG9tOjIycHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtnYXA6MjRweDtmbGV4LXdyYXA6d3JhcDt9Ci5oZXJvLXR4dCBoMXtmb250LXNpemU6MjZweDtmb250LXdlaWdodDo5MDA7fQouaGVyby10eHQgcHtvcGFjaXR5Oi45Mjtmb250LXNpemU6MTMuNXB4O21hcmdpbi10b3A6OHB4O21heC13aWR0aDo1MjBweDtsaW5lLWhlaWdodDoxLjc7fQouc2VhcmNoe2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjE0cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtwYWRkaW5nOjEzcHggMTZweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7bWluLXdpZHRoOjMwMHB4O2ZsZXg6MTttYXgtd2lkdGg6NDIwcHg7fQouc2VhcmNoIGlucHV0e2JvcmRlcjowO291dGxpbmU6MDtmbGV4OjE7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0taW5rKTtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O30KLnNlYXJjaC53aWRle21heC13aWR0aDpub25lO21hcmdpbi1ib3R0b206MThweDt9CgoubGl2ZS1zdHJpcHtiYWNrZ3JvdW5kOnZhcigtLWdyZWVuLXNvZnQpO2NvbG9yOnZhcigtLWdyZWVuKTtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjEwcHggMTZweDtib3JkZXItcmFkaXVzOjEycHg7bWFyZ2luLWJvdHRvbToxOHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDt9Ci5saXZlLXN0cmlwIC5kb3R7Zm9udC1zaXplOjlweDt9Ci5saXZlLXN0cmlwLnNte21hcmdpbjowIDAgMTRweDt9Cgouc2Vje2ZvbnQtc2l6ZToxN3B4O2ZvbnQtd2VpZ2h0OjgwMDttYXJnaW46MjZweCAycHggMTRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O30KLnNlYyBhe2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0tYnJhbmQyKTtmb250LXdlaWdodDo3MDA7bWFyZ2luLWlubGluZS1zdGFydDphdXRvO30KCi8qID09PT09IENhdGVnb3JpZXMgPT09PT0gKi8KLmNhdHN7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnIgMWZyO2dhcDoxNnB4O30KLmNhdHtib3JkZXItcmFkaXVzOjE4cHg7cGFkZGluZzoyMnB4O2NvbG9yOiNmZmY7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1czt9Ci5jYXQ6aG92ZXJ7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTJweCk7fQouY2F0LmZvb2R7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmYjcxODUsI2UxMWQ0OCk7fQouY2F0Lmdyb2Nlcnl7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCMzNGQzOTksIzA1OTY2OSk7fQouY2F0IGg0e2ZvbnQtc2l6ZToxOXB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5jYXQgcHtmb250LXNpemU6MTIuNXB4O29wYWNpdHk6LjkyO21hcmdpbi10b3A6NHB4O30KLmNhdCAuZW1vaml7Zm9udC1zaXplOjQ2cHg7fQoKLyogPT09PT0gR3JpZCArIGNhcmRzID09PT09ICovCi5ncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMjMycHgsMWZyKSk7Z2FwOjE2cHg7fQouZ3JpZC5pdGVtc3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMzAwcHgsMWZyKSk7fQouY2FyZHtiYWNrZ3JvdW5kOnZhcigtLWNhcmQpO2JvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzKTtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7b3ZlcmZsb3c6aGlkZGVuO2JvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7fQoucGxhY2V7Y3Vyc29yOnBvaW50ZXI7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1cyxib3gtc2hhZG93IC4xNXM7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjt9Ci5wbGFjZTpob3Zlcnt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtM3B4KTtib3gtc2hhZG93OjAgMTRweCAzMHB4IHJnYmEoMTUsMjMsNDIsLjEyKTt9Ci5jYXJkLXRvcHtoZWlnaHQ6OTZweDtwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7fQoubG9nby1iYWRnZXtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6OHB4IDEycHg7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxNHB4O2JveC1zaGFkb3c6MCA0cHggMTBweCByZ2JhKDAsMCwwLC4xMik7fQouZmF2LWhlYXJ0e3Bvc2l0aW9uOmFic29sdXRlO3RvcDo4cHg7aW5zZXQtaW5saW5lLXN0YXJ0OjhweDtmb250LXNpemU6MThweDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjkpO3dpZHRoOjMycHg7aGVpZ2h0OjMycHg7Ym9yZGVyLXJhZGl1czo1MCU7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtjdXJzb3I6cG9pbnRlcjt9Ci5jYXJkLWJvZHl7cGFkZGluZzoxM3B4IDE0cHggMTVweDt9Ci5jYXJkLWJvZHkgaDR7Zm9udC1zaXplOjE1cHg7Zm9udC13ZWlnaHQ6ODAwO30KLmNhcmQtYm9keSBwe2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweDt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7fQoubWV0YXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O21hcmdpbi10b3A6OXB4O2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDt9Ci5tZXRhIC5zdGFye2NvbG9yOnZhcigtLWdvbGQpO30KLmJhZGdlLW57YmFja2dyb3VuZDojRUVGMkZGO2NvbG9yOnZhcigtLWJyYW5kMik7Zm9udC1zaXplOjEwcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6M3B4IDhweDtib3JkZXItcmFkaXVzOjIwcHg7fQouYmFkZ2Utbi5saXZle2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLmFwcHMtbWluaXtkaXNwbGF5OmZsZXg7bWFyZ2luLXRvcDoxMHB4O30KLmFwcHMtbWluaSBpe3dpZHRoOjE4cHg7aGVpZ2h0OjE4cHg7Ym9yZGVyLXJhZGl1czo1MCU7Ym9yZGVyOjJweCBzb2xpZCAjZmZmO21hcmdpbi1pbmxpbmUtc3RhcnQ6LTZweDtkaXNwbGF5OmlubGluZS1ibG9jaztib3gtc2hhZG93OjAgMCAwIDFweCB2YXIoLS1saW5lKTt9CgovKiA9PT09PSBTdG9yZSA9PT09PSAqLwouc3RvcmUtYmFubmVye2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoyMHB4O3BhZGRpbmc6MjZweDttYXJnaW4tYm90dG9tOjIwcHg7fQouc3RvcmUtYmFubmVyIGgye2ZvbnQtc2l6ZToyNHB4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5zdG9yZS1iYW5uZXIgLnRhZ3N7Zm9udC1zaXplOjEzcHg7b3BhY2l0eTouOTM7bWFyZ2luLXRvcDo1cHg7fQouc3RvcmUtYmFubmVyIC5jaGlwc3tkaXNwbGF5OmZsZXg7Z2FwOjhweDttYXJnaW4tdG9wOjE0cHg7ZmxleC13cmFwOndyYXA7fQouc3RvcmUtYmFubmVyIC5jaGlwe2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMTgpO2JvcmRlci1yYWRpdXM6MjBweDtwYWRkaW5nOjVweCAxMnB4O2ZvbnQtc2l6ZToxMS41cHg7Zm9udC13ZWlnaHQ6NzAwO30KLnN0b3JlLWxheW91dHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmciAzMjBweDtnYXA6MjJweDthbGlnbi1pdGVtczpzdGFydDt9Ci5tZW51LWNhdHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7Y29sb3I6dmFyKC0taW5rKTttYXJnaW46MThweCAycHggMTJweDt9Ci5pdGVte2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7cGFkZGluZzoxM3B4O30KLml0ZW0gLnBoe3dpZHRoOjU0cHg7aGVpZ2h0OjU0cHg7Ym9yZGVyLXJhZGl1czoxM3B4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjZjhmYWZjLCNlZWYyZjcpO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjI3cHg7ZmxleC1zaHJpbms6MDt9Ci5pdGVtIC5ke2ZsZXg6MTttaW4td2lkdGg6MDt9Ci5pdGVtIC5kIGg1e2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5pdGVtIC5kIHB7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O30KLml0ZW0gLmQgLnBye2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjgwMDtjb2xvcjp2YXIoLS1icmFuZDIpO21hcmdpbi10b3A6NXB4O30KLmxpdmUtdGFne2ZvbnQtc2l6ZTo5cHg7Y29sb3I6dmFyKC0tZ3JlZW4pO2ZvbnQtd2VpZ2h0OjgwMDtiYWNrZ3JvdW5kOnZhcigtLWdyZWVuLXNvZnQpO3BhZGRpbmc6MnB4IDZweDtib3JkZXItcmFkaXVzOjZweDt9Ci5zdGVwcGVye2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDt9Ci5zdGVwcGVyIGJ1dHRvbnt3aWR0aDozMHB4O2hlaWdodDozMHB4O2JvcmRlci1yYWRpdXM6OXB4O2JvcmRlcjowO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQxKTtjb2xvcjojZmZmO2ZvbnQtc2l6ZToxOHB4O2ZvbnQtd2VpZ2h0OjgwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2xpbmUtaGVpZ2h0OjE7fQouc3RlcHBlciBidXR0b24ubWludXN7YmFja2dyb3VuZDojZmZmO2NvbG9yOnZhcigtLWJyYW5kMSk7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO30KLnN0ZXBwZXIgLnF7bWluLXdpZHRoOjE2cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC13ZWlnaHQ6ODAwO30KLmFkZHtib3JkZXI6MDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kMSk7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzo4cHggMTVweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTNweDtjdXJzb3I6cG9pbnRlcjt9Ci5jYXJ0LWNvbHtwb3NpdGlvbjpzdGlja3k7dG9wOjg0cHg7fQouY2FydC1ib3h7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzKTtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxOHB4O30KLmNhcnQtYm94IGg0e2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjgwMDttYXJnaW4tYm90dG9tOjEycHg7fQouY2FydC1saW5lc3tkaXNwbGF5OmdyaWQ7Z2FwOjhweDttYXJnaW4tYm90dG9tOjEycHg7fQouY2xpbmV7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZToxM3B4O30KLmNsaW5lIGJ7Zm9udC13ZWlnaHQ6ODAwO30KLmNhcnQtdG90YWx7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2JvcmRlci10b3A6MXB4IGRhc2hlZCB2YXIoLS1saW5lKTtwYWRkaW5nLXRvcDoxMnB4O21hcmdpbi1ib3R0b206MTRweDtmb250LXdlaWdodDo5MDA7fQouY2FydC1lbXB0eXtmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS44O3BhZGRpbmc6OHB4IDAgNHB4O30KCi8qID09PT09IENvbXBhcmUgPT09PT0gKi8KLnNhdmUtYmFubmVye2JhY2tncm91bmQ6I2ZmZjtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci1yYWRpdXM6MTZweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxNnB4IDE4cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTRweDttYXJnaW4tYm90dG9tOjE2cHg7fQouc2F2ZS1iYW5uZXIgLmlje3dpZHRoOjQ2cHg7aGVpZ2h0OjQ2cHg7Ym9yZGVyLXJhZGl1czoxMnB4O2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjI0cHg7ZmxleC1zaHJpbms6MDt9Ci5zYXZlLWJhbm5lciBoNHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7fQouc2F2ZS1iYW5uZXIgaDQgYntjb2xvcjp2YXIoLS1ncmVlbik7fQouc2F2ZS1iYW5uZXIgcHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHg7fQouc3Vic3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXA7bWFyZ2luLWJvdHRvbToxOHB4O30KLnN1YnMgLmxibHtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtjb2xvcjp2YXIoLS1tdXRlZCk7fQouc3ViLWNoaXB7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjMwcHg7cGFkZGluZzo3cHggMTRweDtmb250LXNpemU6MTJweDtmb250LXdlaWdodDo4MDA7Y29sb3I6dmFyKC0tbXV0ZWQpO2N1cnNvcjpwb2ludGVyO2ZvbnQtZmFtaWx5OmluaGVyaXQ7fQouc3ViLWNoaXAub257YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Ym9yZGVyLWNvbG9yOnZhcigtLWdyZWVuKTtjb2xvcjojZmZmO30KLm9mZmVycy1ncmlke2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMzEwcHgsMWZyKSk7Z2FwOjE2cHg7fQoub2ZmZXJ7cGFkZGluZzoxNnB4O2N1cnNvcjpwb2ludGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xNXM7fQoub2ZmZXI6aG92ZXJ7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTJweCk7fQoub2ZmZXIuYmVzdHtib3JkZXI6MnB4IHNvbGlkIHZhcigtLWdyZWVuKTtib3gtc2hhZG93OjAgMTRweCAzMHB4IHJnYmEoMjIsMTYzLDc0LC4xNik7fQoub2ZmZXIgLnJpYmJvbntwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTExcHg7aW5zZXQtaW5saW5lLXN0YXJ0OjE2cHg7YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Y29sb3I6I2ZmZjtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjRweCAxMXB4O2JvcmRlci1yYWRpdXM6MjBweDt9Ci5vZmZlci10b3B7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDt9Ci5hbG9nb3tib3JkZXItcmFkaXVzOjEycHg7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjEycHg7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS4wNTtmbGV4LXNocmluazowO30KLmFubXtmbGV4OjE7bWluLXdpZHRoOjA7fQouYW5tIGg0e2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5hbm0gLnN1Yntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDozcHg7ZGlzcGxheTpmbGV4O2dhcDo5cHg7ZmxleC13cmFwOndyYXA7fQouYW5tIC5zdWIgLm9re2NvbG9yOnZhcigtLWdyZWVuKTtmb250LXdlaWdodDo4MDA7fQouYW5tIC5zdWIgLm11dGVke2NvbG9yOiM5NEEzQjg7fQoudG90e3RleHQtYWxpZ246bGVmdDtmbGV4LXNocmluazowO30KLnRvdCAuYmlne2ZvbnQtc2l6ZToyMXB4O2ZvbnQtd2VpZ2h0OjkwMDtsaW5lLWhlaWdodDoxO30KLm9mZmVyLmJlc3QgLnRvdCAuYmlne2NvbG9yOnZhcigtLWdyZWVuKTt9Ci50b3QgLmN1cntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO30KLmJyZWFrZG93bnttYXJnaW4tdG9wOjEzcHg7Ym9yZGVyLXRvcDoxcHggZGFzaGVkIHZhcigtLWxpbmUpO3BhZGRpbmctdG9wOjEycHg7ZGlzcGxheTpncmlkO2dhcDo3cHg7fQouYnJvd3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC1zaXplOjEyLjVweDt9Ci5icm93IHNwYW57Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjYwMDt9Ci5icm93IGJ7Zm9udC13ZWlnaHQ6NzAwO30KLmJyb3cuZGlzYyBie2NvbG9yOnZhcigtLWdyZWVuKTt9Ci5wcm9tby10YWd7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjVweDtiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjRweCA5cHg7Ym9yZGVyLXJhZGl1czo4cHg7bWFyZ2luLXRvcDoxMHB4O30KLnBpY2tidG57bWFyZ2luLXRvcDoxM3B4O3dpZHRoOjEwMCU7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTFweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTMuNXB4O2N1cnNvcjpwb2ludGVyO2JhY2tncm91bmQ6I0VFRjJGRjtjb2xvcjp2YXIoLS1icmFuZDIpO30KLm9mZmVyLmJlc3QgLnBpY2tidG57YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Y29sb3I6I2ZmZjt9CgovKiA9PT09PSBPZmZlcnMgLyBwcm9tbyBjYXJkcyA9PT09PSAqLwoucHJvbW8tY2FyZHtwYWRkaW5nOjE1cHg7ZGlzcGxheTpmbGV4O2dhcDoxMnB4O2FsaWduLWl0ZW1zOmNlbnRlcjt9Ci5wcm9tby1jYXJkIC5wbHt3aWR0aDo0OHB4O2hlaWdodDo0OHB4O2JvcmRlci1yYWRpdXM6MTJweDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtd2VpZ2h0OjkwMDtmb250LXNpemU6MTFweDtmbGV4LXNocmluazowO30KLnByb21vLWNhcmQgLnB0e2ZsZXg6MTt9Ci5wcm9tby1jYXJkIC5wdCBoNXtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQoucHJvbW8tY2FyZCAucHQgcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweDt9Ci5wcm9tby1jYXJkIC5jb2Rle2JvcmRlcjoxLjVweCBkYXNoZWQgdmFyKC0tYnJhbmQyKTtjb2xvcjp2YXIoLS1icmFuZDIpO2ZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjZweCAxMHB4O2JvcmRlci1yYWRpdXM6OXB4O2JhY2tncm91bmQ6I0VFRjJGRjt9CgovKiA9PT09PSBQcm9maWxlIC8gQWRtaW4gPT09PT0gKi8KLnBhZHtwYWRkaW5nOjE4cHg7bWFyZ2luLWJvdHRvbToxNHB4O30KLnBhZCBoNHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7bWFyZ2luLWJvdHRvbTo4cHg7fQoubXV0ZWR7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMi41cHg7bGluZS1oZWlnaHQ6MS43O30KLnByb2YtaGVhZHtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoxOHB4O3BhZGRpbmc6MjRweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxNnB4O21hcmdpbi1ib3R0b206MTZweDt9Ci5wcm9mLWhlYWQgLmF2e3dpZHRoOjY0cHg7aGVpZ2h0OjY0cHg7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToyNnB4O2ZvbnQtd2VpZ2h0OjkwMDtib3JkZXI6M3B4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjUpO30KLnByb2YtaGVhZCBoMntmb250LXNpemU6MTlweDtmb250LXdlaWdodDo5MDA7fQoucHJvZi1oZWFkIHB7Zm9udC1zaXplOjEyLjVweDtvcGFjaXR5Oi45O21hcmdpbi10b3A6MnB4O30KLnByb2YtaGVhZCAudmJhZGdle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi10b3A6OHB4O2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMik7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6NHB4IDEycHg7Ym9yZGVyLXJhZGl1czoyMHB4O30KLmZpZWxke21hcmdpbi1ib3R0b206MTBweDt9Ci5maWVsZCBsYWJlbHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLWJvdHRvbTo2cHg7fQouZmllbGQgaW5wdXR7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweCAxNHB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NjAwO291dGxpbmU6bm9uZTtjb2xvcjp2YXIoLS1pbmspO2JhY2tncm91bmQ6I2ZmZjt9Ci5maWVsZCBpbnB1dDpmb2N1c3tib3JkZXItY29sb3I6dmFyKC0tYnJhbmQyKTtib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDc5LDcwLDIyOSwuMTIpO30KLmJ0bi1zb2Z0e3dpZHRoOjEwMCU7Ym9yZGVyOjA7YmFja2dyb3VuZDojRUVGMkZGO2NvbG9yOnZhcigtLWJyYW5kMik7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5idG4tZGFuZ2Vye3dpZHRoOjEwMCU7Ym9yZGVyOjEuNXB4IHNvbGlkICNGQ0E1QTU7Y29sb3I6I0I5MUMxQztiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMXB4O3BhZGRpbmc6MTJweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5hY2Mtcm93e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47cGFkZGluZzoxMXB4IDA7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7fQouYWNjLXJvdzpsYXN0LWNoaWxke2JvcmRlci1ib3R0b206MDt9Ci5hY2Mtcm93IC5se2ZvbnQtc2l6ZToxMy41cHg7Zm9udC13ZWlnaHQ6NzAwO30KLnN3aXRjaHt3aWR0aDo0MnB4O2hlaWdodDoyNXB4O2JvcmRlci1yYWRpdXM6MzBweDtiYWNrZ3JvdW5kOnZhcigtLWxpbmUpO3Bvc2l0aW9uOnJlbGF0aXZlO2N1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246LjJzO2ZsZXgtc2hyaW5rOjA7ZGlzcGxheTppbmxpbmUtYmxvY2s7fQouc3dpdGNoLm9ue2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4pO30KLnN3aXRjaCBpe3Bvc2l0aW9uOmFic29sdXRlO3RvcDoyLjVweDtpbnNldC1pbmxpbmUtc3RhcnQ6Mi41cHg7d2lkdGg6MjBweDtoZWlnaHQ6MjBweDtib3JkZXItcmFkaXVzOjUwJTtiYWNrZ3JvdW5kOiNmZmY7dHJhbnNpdGlvbjouMnM7Ym94LXNoYWRvdzowIDFweCAzcHggcmdiYSgwLDAsMCwuMik7fQouc3dpdGNoLm9uIGl7aW5zZXQtaW5saW5lLXN0YXJ0OjE5LjVweDt9Ci5zdGF0LXJvd3tkaXNwbGF5OmZsZXg7Z2FwOjE0cHg7bWFyZ2luLWJvdHRvbTo4cHg7fQouc3RhdHtmbGV4OjE7cGFkZGluZzoxOHB4O3RleHQtYWxpZ246Y2VudGVyO30KLnN0YXQgLm57Zm9udC1zaXplOjI2cHg7Zm9udC13ZWlnaHQ6OTAwO2NvbG9yOnZhcigtLWJyYW5kMSk7fQouc3RhdCAubHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO21hcmdpbi10b3A6M3B4O30KLnVzZXItcm93e3BhZGRpbmc6MTNweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21hcmdpbi1ib3R0b206MTBweDt9Ci51c2VyLXJvdyAuYXZ7d2lkdGg6NDJweDtoZWlnaHQ6NDJweDtib3JkZXItcmFkaXVzOjUwJTtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo4MDA7ZmxleC1zaHJpbms6MDt9Ci51c2VyLXJvdyAudWl7ZmxleDoxO21pbi13aWR0aDowO30KLnVzZXItcm93IC51aSBoNXtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo4MDA7fQoudXNlci1yb3cgLnVpIHB7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7fQoudGFncy1yb3d7ZGlzcGxheTpmbGV4O2dhcDo1cHg7bWFyZ2luLXRvcDo1cHg7fQoudGFndntmb250LXNpemU6OS41cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6MnB4IDdweDtib3JkZXItcmFkaXVzOjIwcHg7fQoudGFndi55e2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4tc29mdCk7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLnRhZ3YubntiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTt9Ci50YWd2LmF7YmFja2dyb3VuZDojRURFOUZFO2NvbG9yOnZhcigtLWJyYW5kMSk7fQouZGVse2JvcmRlcjowO2JhY2tncm91bmQ6I0ZFRjJGMjtjb2xvcjojQjkxQzFDO2JvcmRlci1yYWRpdXM6OXB4O3BhZGRpbmc6OHB4IDEycHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjExcHg7Y3Vyc29yOnBvaW50ZXI7ZmxleC1zaHJpbms6MDt9CgouZGlzY2xhaW1lcntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS44O21hcmdpbi10b3A6MThweDt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5kaXNjbGFpbWVyIGJ7Y29sb3I6Izk0YTNiODt9CgovKiA9PT09PSBNb2RhbCA9PT09PSAqLwoubW9kYWwtYmd7cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDtiYWNrZ3JvdW5kOnJnYmEoMTUsMjMsNDIsLjUpO3otaW5kZXg6MTAwO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjE2cHg7YW5pbWF0aW9uOmZhZGUgLjJzO30KQGtleWZyYW1lcyBmYWRle2Zyb217b3BhY2l0eTowO310b3tvcGFjaXR5OjE7fX0KLnNoZWV0e2JhY2tncm91bmQ6I2ZmZjt3aWR0aDoxMDAlO21heC13aWR0aDo0NDBweDtib3JkZXItcmFkaXVzOjIwcHg7cGFkZGluZzoyMnB4O2FuaW1hdGlvbjpwb3AgLjJzIGVhc2U7fQpAa2V5ZnJhbWVzIHBvcHtmcm9te3RyYW5zZm9ybTp0cmFuc2xhdGVZKDEycHgpO29wYWNpdHk6MDt9dG97dHJhbnNmb3JtOm5vbmU7b3BhY2l0eToxO319Ci5zaGVldCAuaHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O30KLnNoZWV0IC5oIGgze2ZvbnQtc2l6ZToxN3B4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5zaGVldCAuaCBwe2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDt9Ci5zaGVldCAuc3Vte2JhY2tncm91bmQ6dmFyKC0tYmcpO2JvcmRlci1yYWRpdXM6MTRweDtwYWRkaW5nOjE0cHg7bWFyZ2luOjE2cHggMDtkaXNwbGF5OmdyaWQ7Z2FwOjhweDt9Ci5zaGVldCAuc3VtIC5ye2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtmb250LXNpemU6MTIuNXB4O30KLnNoZWV0IC5zdW0gLnIgc3Bhbntjb2xvcjp2YXIoLS1tdXRlZCk7fQouc2hlZXQgLnN1bSAuci50dHtib3JkZXItdG9wOjFweCBkYXNoZWQgdmFyKC0tbGluZSk7cGFkZGluZy10b3A6OXB4O21hcmdpbi10b3A6M3B4O2ZvbnQtd2VpZ2h0OjkwMDtmb250LXNpemU6MTVweDt9Ci5zaGVldCAubm90ZXtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtiYWNrZ3JvdW5kOiNGRUYzQzc7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTFweCAxM3B4O2xpbmUtaGVpZ2h0OjEuNzt9Ci5zaGVldCAubm90ZSBie2NvbG9yOiM5MjQwMEU7fQouc2hlZXQgLmN0YXttYXJnaW4tdG9wOjE2cHg7ZGlzcGxheTpmbGV4O2dhcDoxMHB4O30KLnNoZWV0IC5jdGEgYnV0dG9ue2ZsZXg6MTtib3JkZXI6MDtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxM3B4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxNHB4O2N1cnNvcjpwb2ludGVyO30KLnNoZWV0IC5jdGEgLmdve2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4pO2NvbG9yOiNmZmY7fQouc2hlZXQgLmN0YSAuY2FuY2Vse2JhY2tncm91bmQ6dmFyKC0tYmcpO2NvbG9yOnZhcigtLW11dGVkKTtmbGV4OjAgMCA5MHB4O30KCi5sb2FkaW5ne2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtnYXA6MTBweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6ODBweCAwO30KLnNwaW57d2lkdGg6MjJweDtoZWlnaHQ6MjJweDtib3JkZXI6M3B4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci10b3AtY29sb3I6dmFyKC0tYnJhbmQxKTtib3JkZXItcmFkaXVzOjUwJTthbmltYXRpb246cm90IDFzIGxpbmVhciBpbmZpbml0ZTt9CkBrZXlmcmFtZXMgcm90e3Rve3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt9fQouZW1wdHl7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpO3BhZGRpbmc6NzBweCAyMHB4O30KLmVtcHR5IC5le2ZvbnQtc2l6ZTo1NHB4O30KLmVtcHR5IGgze2ZvbnQtc2l6ZToxN3B4O21hcmdpbi10b3A6MTJweDtjb2xvcjp2YXIoLS1pbmspO30KLmVtcHR5IHB7Zm9udC1zaXplOjEzcHg7bWFyZ2luLXRvcDo2cHg7fQoKLyogPT09PT0gUmVzcG9uc2l2ZSA9PT09PSAqLwpAbWVkaWEobWF4LXdpZHRoOjgyMHB4KXsKICAubmF2LWlubmVye3BhZGRpbmc6MCAxNHB4O2dhcDoxMHB4O30KICAubG9jLWNoaXB7ZGlzcGxheTpub25lO30KICAubmF2LWxpbmtze292ZXJmbG93LXg6YXV0bzt9CiAgLm5hdi1saW5rcyBhe3BhZGRpbmc6OHB4IDEwcHg7Zm9udC1zaXplOjEzcHg7d2hpdGUtc3BhY2U6bm93cmFwO30KICAuY29udGFpbmVye3BhZGRpbmc6MThweCAxNHB4IDgwcHg7fQogIC5oZXJve3BhZGRpbmc6MjJweDt9CiAgLmhlcm8tdHh0IGgxe2ZvbnQtc2l6ZToyMXB4O30KICAuc3RvcmUtbGF5b3V0e2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQogIC5jYXJ0LWNvbHtwb3NpdGlvbjpzdGF0aWM7fQogIC5ncmlkLml0ZW1ze2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQp9CkBtZWRpYShtYXgtd2lkdGg6NDgwcHgpewogIC5jYXRze2dyaWQtdGVtcGxhdGUtY29sdW1uczoxZnI7fQp9Cg==" }, "auth.css": { "type": "text/css; charset=utf-8", "b64": "Lyog2LXZgdit2Kkg2KfZhNmF2LXYp9iv2YLYqSDZg9i12YHYrdipINmI2YrYqDog2KjYt9in2YLYqSDZgdmKINmF2YbYqti12YEg2K7ZhNmB2YrYqSDZhdiq2K/YsdmR2KzYqSAqLwouYXBwLmF1dGgtbW9kZSAjdG9wbmF2e2Rpc3BsYXk6bm9uZTt9Ci5hcHAuYXV0aC1tb2RlICNzY3JlZW57bWluLWhlaWdodDoxMDB2aDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO3BhZGRpbmc6MjRweDsKICBiYWNrZ3JvdW5kOnJhZGlhbC1ncmFkaWVudCgxMDAwcHggNjAwcHggYXQgODAlIC0xMCUsIzdjM2FlZCx0cmFuc3BhcmVudCksbGluZWFyLWdyYWRpZW50KDEzNWRlZywjNkQyOEQ5LCM0RjQ2RTUpO30KLmF1dGgtY2FyZHt3aWR0aDoxMDAlO21heC13aWR0aDo0MjBweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoyMnB4O292ZXJmbG93OmhpZGRlbjtib3gtc2hhZG93OjAgMzBweCA2MHB4IHJnYmEoNzYsMjksMTQ5LC4zNSk7fQouYXV0aC1oZXJve2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7Y29sb3I6I2ZmZjtwYWRkaW5nOjM4cHggMjZweCAyNnB4O3RleHQtYWxpZ246Y2VudGVyO30KLmF1dGgtaGVybyAubWt7d2lkdGg6NThweDtoZWlnaHQ6NThweDtib3JkZXItcmFkaXVzOjE2cHg7YmFja2dyb3VuZDojZmZmO2NvbG9yOnZhcigtLWJyYW5kMSk7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjI4cHg7bWFyZ2luOjAgYXV0byAxMnB4O2JveC1zaGFkb3c6MCA4cHggMjBweCByZ2JhKDAsMCwwLC4xOCk7fQouYXV0aC1oZXJvIGgxe2ZvbnQtc2l6ZToyM3B4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5hdXRoLWhlcm8gcHtvcGFjaXR5Oi45Mjtmb250LXNpemU6MTIuNXB4O21hcmdpbi10b3A6NnB4O2xpbmUtaGVpZ2h0OjEuNjt9Ci5hdXRoLWJvZHl7cGFkZGluZzoyNHB4O30KLmF1dGgtdGl0bGV7Zm9udC1zaXplOjE5cHg7Zm9udC13ZWlnaHQ6ODAwO21hcmdpbi1ib3R0b206NHB4O30KLmF1dGgtc3Vie2ZvbnQtc2l6ZToxMi41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi1ib3R0b206MThweDtsaW5lLWhlaWdodDoxLjc7fQouYnRuLXByaW1hcnl7d2lkdGg6MTAwJTtib3JkZXI6MDtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTRweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTVweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjZweDt9Ci5idG4tcHJpbWFyeTpkaXNhYmxlZHtvcGFjaXR5Oi42O2N1cnNvcjpkZWZhdWx0O30KLmF1dGgtbXNne2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjEwcHggMTNweDtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuNjtkaXNwbGF5Om5vbmU7fQouYXV0aC1tc2cuc2hvd3tkaXNwbGF5OmJsb2NrO30KLmF1dGgtbXNnLmVycntiYWNrZ3JvdW5kOiNGRUYyRjI7Y29sb3I6I0I5MUMxQzt9Ci5hdXRoLW1zZy5va3tiYWNrZ3JvdW5kOiNFQ0ZERjU7Y29sb3I6IzE2QTM0QTt9Ci5hdXRoLWxpbmtze21hcmdpbi10b3A6MThweDt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLW11dGVkKTtsaW5lLWhlaWdodDoyO30KLmF1dGgtbGlua3MgYXtjb2xvcjp2YXIoLS1icmFuZDIpO2ZvbnQtd2VpZ2h0OjgwMDt9Ci5jb2RlLWlucHV0IGlucHV0e3RleHQtYWxpZ246Y2VudGVyO2xldHRlci1zcGFjaW5nOjEwcHg7Zm9udC1zaXplOjI0cHg7Zm9udC13ZWlnaHQ6OTAwO30KLmRldi1oaW50e2JhY2tncm91bmQ6I0ZFRjNDNztjb2xvcjojOTI0MDBFO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjEycHggMTNweDtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luLWJvdHRvbToxNHB4O2xpbmUtaGVpZ2h0OjEuODt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5kZXYtaGludCAuY3tmb250LXNpemU6MjJweDtmb250LXdlaWdodDo5MDA7bGV0dGVyLXNwYWNpbmc6NHB4O2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDo0cHg7fQo=" }, "app.js": { "type": "text/javascript; charset=utf-8", "b64": "LyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgINiz2YjYqNixINii2Kgg4oCUINmF2YbYtdipINmI2YrYqCAo2KrYrti32YrYtyDYs9i32K0g2YXZg9iq2Kgg2YXYqtis2KfZiNioKQogICDYtNix2YrYtyDYqtmG2YLZkdmEINi52YTZiNmKICsg2K3Yp9mI2YrYqSDYudix2YrYttipICsg2LTYqNmD2KfYqiDYqNi32KfZgtin2KouCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpjb25zdCBzdGF0ZSA9IHsKICB1c2VyOiBudWxsLCBjZmc6IG51bGwsIHN0b3JlczogW10sCiAgdGFiOiAnaG9tZScsIHNjcmVlbjogJ2hvbWUnLCBtb2RlOiAnYWxsJywKICBzdG9yZTogbnVsbCwgY2FydDoge30sIHN1YnM6IHt9LCBjbXA6IG51bGwsIHF1ZXJ5OiAnJywKICBhdXRoOiB7IHZpZXc6ICdsb2dpbicsIGVtYWlsOiAnJywgZGV2Q29kZTogbnVsbCB9LAogIGFkbWluOiB7IHVzZXJzOiBudWxsIH0sCn07Cgpjb25zdCAkID0gaWQgPT4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpOwpjb25zdCBtb25leSA9IG4gPT4gKE1hdGgucm91bmQobiAqIDEwMCkgLyAxMDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycsIHsgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAwLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDIgfSk7CmNvbnN0IGFwcHMgPSAoKSA9PiBzdGF0ZS5jZmcuYXBwczsKY29uc3QgY2FydENvdW50ID0gKCkgPT4gT2JqZWN0LnZhbHVlcyhzdGF0ZS5jYXJ0KS5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTsKY29uc3QgZmxhdCA9IHMgPT4gcy5tZW51LmZsYXRNYXAoZyA9PiBnLml0ZW1zKTsKY29uc3QgY2FydFN1YnRvdGFsID0gcyA9PiBPYmplY3QuZW50cmllcyhzdGF0ZS5jYXJ0KS5yZWR1Y2UoKHQsIFtpZCwgcV0pID0+IHsgY29uc3QgaXQgPSBmbGF0KHMpLmZpbmQoaSA9PiBpLmlkID09PSBpZCk7IHJldHVybiB0ICsgKGl0ID8gaXQucCAqIHEgOiAwKTsgfSwgMCk7CmNvbnN0IGlzRmF2ID0gaWQgPT4gKHN0YXRlLnVzZXI/LmZhdm9yaXRlcyB8fCBbXSkuaW5jbHVkZXMoaWQpOwpjb25zdCB2YWwgPSBpZCA9PiAoJChpZCkgPyAkKGlkKS52YWx1ZS50cmltKCkgOiAnJyk7CmNvbnN0IGVzYyA9IHMgPT4gU3RyaW5nKHMpLnJlcGxhY2UoLyYvZywnJmFtcDsnKS5yZXBsYWNlKC88L2csJyZsdDsnKS5yZXBsYWNlKC8+L2csJyZndDsnKTsKCmFzeW5jIGZ1bmN0aW9uIGFwaShwYXRoLCBvcHRzID0ge30sIF90cnkgPSAwKSB7CiAgbGV0IHI7CiAgdHJ5IHsKICAgIHIgPSBhd2FpdCBmZXRjaChwYXRoLCB7IGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwgLi4ub3B0cyB9KTsKICB9IGNhdGNoIChlKSB7CiAgICBpZiAoX3RyeSA8IDMpIHsgYXdhaXQgbmV3IFByb21pc2UocyA9PiBzZXRUaW1lb3V0KHMsIDE4MDApKTsgcmV0dXJuIGFwaShwYXRoLCBvcHRzLCBfdHJ5ICsgMSk7IH0KICAgIHRocm93IG5ldyBFcnJvcign2KrYudiw2ZHYsSDYp9mE2KfYqti12KfZhCDYqNin2YTYrtin2K/ZhdiMINit2KfZiNmEINio2LnYryDZgtmE2YrZhCcpOwogIH0KICBjb25zdCBjdCA9IHIuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpIHx8ICcnOwogIGNvbnN0IGogPSBjdC5pbmNsdWRlcygnYXBwbGljYXRpb24vanNvbicpID8gYXdhaXQgci5qc29uKCkuY2F0Y2goKCkgPT4gKHt9KSkgOiB7fTsKICBpZiAoIXIub2spIHsKICAgIGlmICghai5lcnJvciAmJiAoci5zdGF0dXMgPj0gNTAwIHx8IHIuc3RhdHVzID09PSA0MDQpICYmIF90cnkgPCAzKSB7CiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHMgPT4gc2V0VGltZW91dChzLCAxODAwKSk7IHJldHVybiBhcGkocGF0aCwgb3B0cywgX3RyeSArIDEpOwogICAgfQogICAgdGhyb3cgbmV3IEVycm9yKGouZXJyb3IgfHwgKCfYrti32KMgJyArIHIuc3RhdHVzKSk7CiAgfQogIHJldHVybiBqOwp9CgovKiAtLS0tLS0tLS0tINil2YLZhNin2LkgLS0tLS0tLS0tLSAqLwphc3luYyBmdW5jdGlvbiBpbml0KCkgewogIHRyeSB7CiAgICBjb25zdCBtZSA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL21lJyk7CiAgICBpZiAobWUudXNlcikgeyBzdGF0ZS51c2VyID0gbWUudXNlcjsgYXdhaXQgbG9hZEFwcCgpOyByZXR1cm47IH0KICB9IGNhdGNoIChlKSB7CiAgICAkKCd0b3BuYXYnKS5pbm5lckhUTUwgPSAnJzsKICAgICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iZSI+4pqg77iPPC9kaXY+PGgzPtiq2LnYsNmR2LEg2KfZhNin2KrYtdin2YQg2KjYp9mE2K7Yp9iv2YU8L2gzPjxwPtit2KfZiNmEINiq2K3Yr9mK2Ksg2KfZhNi12YHYrdipINio2LnYryDZgtmE2YrZhC48L3A+PC9kaXY+YDsKICAgIHJldHVybjsKICB9CiAgcmVuZGVyKCk7Cn0KYXN5bmMgZnVuY3Rpb24gbG9hZEFwcCgpIHsKICBjb25zdCBbY2ZnLCBzdG9yZXMsIGZhdl0gPSBhd2FpdCBQcm9taXNlLmFsbChbYXBpKCcvYXBpL2NvbmZpZycpLCBhcGkoJy9hcGkvc3RvcmVzJyksIGFwaSgnL2FwaS9wcm9maWxlL2Zhdm9yaXRlcycpXSk7CiAgc3RhdGUuY2ZnID0gY2ZnOyBzdGF0ZS5zdG9yZXMgPSBzdG9yZXM7IHN0YXRlLnVzZXIuZmF2b3JpdGVzID0gZmF2LmZhdm9yaXRlczsKICBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdob21lJzsgcmVuZGVyKCk7Cn0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDYp9mE2YXYtdin2K/ZgtipICjYtdmB2K3YqSDZiNmK2Kgg2KjYt9in2YLYqSDZgdmKINin2YTZhdmG2KrYtdmBKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gdmlld0F1dGgoKSB7CiAgY29uc3QgdiA9IHN0YXRlLmF1dGgudmlldzsKICBjb25zdCBoZXJvID0gYDxkaXYgY2xhc3M9ImF1dGgtaGVybyI+PGRpdiBjbGFzcz0ibWsiPlM8L2Rpdj48aDE+2LPZiNio2LEg2KLYqDwvaDE+PHA+2YXZhti12Kkg2KrZgtin2LHZhiDYt9mE2KjZgyDYudio2LEg2YPZhCDYqti32KjZitmC2KfYqiDYp9mE2KrZiNi12YrZhCDZiNiq2K7Yqtin2LEg2YTZgyDYp9mE2KPYsdiu2LU8L3A+PC9kaXY+YDsKICBjb25zdCBtc2cgPSBgPGRpdiBjbGFzcz0iYXV0aC1tc2cgZXJyIiBpZD0iYXV0aEVyciI+PC9kaXY+YDsKICBjb25zdCBkZXYgPSBzdGF0ZS5hdXRoLmRldkNvZGUgPyBgPGRpdiBjbGFzcz0iZGV2LWhpbnQiPvCfk6cg2YjYtti5INiq2KzYsdmK2KjZiiAo2KjYr9mI2YYg2KjYsdmK2K8g2K3ZgtmK2YLZiikg4oCUINix2YXYstmDINmH2Yg6PGJyPjxzcGFuIGNsYXNzPSJjIj4ke3N0YXRlLmF1dGguZGV2Q29kZX08L3NwYW4+PC9kaXY+YCA6ICcnOwogIGxldCBib2R5ID0gJyc7CiAgaWYgKHYgPT09ICdyZWdpc3RlcicpIGJvZHkgPSBgCiAgICA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7YpdmG2LTYp9ihINit2LPYp9ioPC9kaXY+PGRpdiBjbGFzcz0iYXV0aC1zdWIiPtiz2KzZkdmEINmE2YTZiNi12YjZhCDYpdmE2Ykg2KfZhNmF2YbYtdipLjwvZGl2PiR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Yp9mE2KfYs9mFPC9sYWJlbD48aW5wdXQgaWQ9InJOYW1lIiBwbGFjZWhvbGRlcj0i2KfYs9mF2YMiIC8+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJyRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIgLz48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2YPZhNmF2Kkg2KfZhNmF2LHZiNixPC9sYWJlbD48aW5wdXQgaWQ9InJQYXNzIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9ItmoINij2K3YsdmBINi52YTZiSDYp9mE2KPZgtmEIiAvPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIGlkPSJyQnRuIiBvbmNsaWNrPSJkb1JlZ2lzdGVyKCkiPtil2YbYtNin2KEg2K3Ys9in2Kg8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPtmE2K/ZitmDINit2LPYp9io2J8gPGEgb25jbGljaz0iYXV0aFZpZXcoJ2xvZ2luJykiPtiz2KzZkdmEINin2YTYr9iu2YjZhDwvYT48L2Rpdj5gOwogIGVsc2UgaWYgKHYgPT09ICd2ZXJpZnknKSBib2R5ID0gYAogICAgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2KrZgdi52YrZhCDYp9mE2K3Ys9in2Kg8L2Rpdj48ZGl2IGNsYXNzPSJhdXRoLXN1YiI+2KPYr9iu2YQg2KfZhNix2YXYsiDYp9mE2YXYsdiz2YQg2KXZhNmJIDxiPiR7ZXNjKHN0YXRlLmF1dGguZW1haWwpfTwvYj48L2Rpdj4ke2Rldn0ke21zZ30KICAgIDxkaXYgY2xhc3M9ImZpZWxkIGNvZGUtaW5wdXQiPjxpbnB1dCBpZD0idkNvZGUiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIiAvPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIGlkPSJ2QnRuIiBvbmNsaWNrPSJkb1ZlcmlmeSgpIj7YqtmB2LnZitmEINmI2K/YrtmI2YQ8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPjxhIG9uY2xpY2s9ImRvUmVzZW5kKCkiPtil2LnYp9iv2Kkg2KXYsdiz2KfZhCDYp9mE2LHZhdiyPC9hPiDCtyA8YSBvbmNsaWNrPSJhdXRoVmlldygnbG9naW4nKSI+2LHYrNmI2Lk8L2E+PC9kaXY+YDsKICBlbHNlIGlmICh2ID09PSAnZm9yZ290JykgYm9keSA9IGAKICAgIDxkaXYgY2xhc3M9ImF1dGgtdGl0bGUiPtmG2LPZitiqINmD2YTZhdipINin2YTZhdix2YjYsTwvZGl2PjxkaXYgY2xhc3M9ImF1dGgtc3ViIj7Zhtix2LPZhCDZhNmDINix2YXYsiDYpdi52KfYr9ipINin2YTYqti52YrZitmGLjwvZGl2PiR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Yp9mE2KjYsdmK2K8g2KfZhNil2YTZg9iq2LHZiNmG2Yo8L2xhYmVsPjxpbnB1dCBpZD0iZkVtYWlsIiB0eXBlPSJlbWFpbCIgcGxhY2Vob2xkZXI9InlvdUBlbWFpbC5jb20iIC8+PC9kaXY+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4tcHJpbWFyeSIgaWQ9ImZCdG4iIG9uY2xpY2s9ImRvRm9yZ290KCkiPtil2LHYs9in2YQg2KfZhNix2YXYsjwvYnV0dG9uPgogICAgPGRpdiBjbGFzcz0iYXV0aC1saW5rcyI+PGEgb25jbGljaz0iYXV0aFZpZXcoJ2xvZ2luJykiPtix2KzZiNi5INmE2KrYs9is2YrZhCDYp9mE2K/YrtmI2YQ8L2E+PC9kaXY+YDsKICBlbHNlIGlmICh2ID09PSAncmVzZXQnKSBib2R5ID0gYAogICAgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2YPZhNmF2Kkg2YXYsdmI2LEg2KzYr9mK2K/YqTwvZGl2PjxkaXYgY2xhc3M9ImF1dGgtc3ViIj7Yp9mE2LHZhdiyINij2Y/Ysdiz2YQg2KXZhNmJIDxiPiR7ZXNjKHN0YXRlLmF1dGguZW1haWwpfTwvYj48L2Rpdj4ke2Rldn0ke21zZ30KICAgIDxkaXYgY2xhc3M9ImZpZWxkIGNvZGUtaW5wdXQiPjxpbnB1dCBpZD0ic0NvZGUiIGlucHV0bW9kZT0ibnVtZXJpYyIgbWF4bGVuZ3RoPSI2IiBwbGFjZWhvbGRlcj0i4oCi4oCi4oCi4oCi4oCi4oCiIiAvPjwvZGl2PgogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Zg9mE2YXYqSDYp9mE2YXYsdmI2LEg2KfZhNis2K/Zitiv2Kk8L2xhYmVsPjxpbnB1dCBpZD0ic1Bhc3MiIHR5cGU9InBhc3N3b3JkIiBwbGFjZWhvbGRlcj0i2agg2KPYrdix2YEg2LnZhNmJINin2YTYo9mC2YQiIC8+PC9kaXY+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4tcHJpbWFyeSIgaWQ9InNCdG4iIG9uY2xpY2s9ImRvUmVzZXQoKSI+2K3Zgdi4INmI2KfZhNiv2K7ZiNmEPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJhdXRoVmlldygnbG9naW4nKSI+2LHYrNmI2Lk8L2E+PC9kaXY+YDsKICBlbHNlIGJvZHkgPSBgCiAgICA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7Yqtiz2KzZitmEINin2YTYr9iu2YjZhDwvZGl2PjxkaXYgY2xhc3M9ImF1dGgtc3ViIj7Yo9mH2YTZi9inINio2LnZiNiv2KrZgyDwn5GLPC9kaXY+JHttc2d9CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJsRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIgLz48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2YPZhNmF2Kkg2KfZhNmF2LHZiNixPC9sYWJlbD48aW5wdXQgaWQ9ImxQYXNzIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAouKAouKAoiIgLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0ibEJ0biIgb25jbGljaz0iZG9Mb2dpbigpIj7Yr9iu2YjZhDwvYnV0dG9uPgogICAgPGRpdiBjbGFzcz0iYXV0aC1saW5rcyI+PGEgb25jbGljaz0iYXV0aFZpZXcoJ2ZvcmdvdCcpIj7Zhtiz2YrYqiDZg9mE2YXYqSDYp9mE2YXYsdmI2LHYnzwvYT48YnI+2YXYpyDYudmG2K/ZgyDYrdiz2KfYqNifIDxhIG9uY2xpY2s9ImF1dGhWaWV3KCdyZWdpc3RlcicpIj7Yo9mG2LTYpiDYrdiz2KfYqDwvYT48L2Rpdj5gOwogIHJldHVybiBgPGRpdiBjbGFzcz0iYXV0aC1jYXJkIj4ke2hlcm99PGRpdiBjbGFzcz0iYXV0aC1ib2R5Ij4ke2JvZHl9PC9kaXY+PC9kaXY+YDsKfQpmdW5jdGlvbiBhdXRoVmlldyh2KSB7IHN0YXRlLmF1dGgudmlldyA9IHY7IHN0YXRlLmF1dGguZGV2Q29kZSA9IG51bGw7IHJlbmRlcigpOyB9CmZ1bmN0aW9uIHNldEVycihtKSB7IGNvbnN0IGUgPSAkKCdhdXRoRXJyJyk7IGlmIChlKSB7IGUudGV4dENvbnRlbnQgPSBtOyBlLmNsYXNzTmFtZSA9ICdhdXRoLW1zZyBlcnIgc2hvdyc7IH0gfQpmdW5jdGlvbiBidXN5KGlkLCBvbiwgbGFiZWwpIHsgY29uc3QgYiA9ICQoaWQpOyBpZiAoYikgeyBiLmRpc2FibGVkID0gb247IGlmIChvbikgeyBiLmRhdGFzZXQudCA9IGIudGV4dENvbnRlbnQ7IGIudGV4dENvbnRlbnQgPSAn4o+zIC4uLic7IH0gZWxzZSBiLnRleHRDb250ZW50ID0gbGFiZWwgfHwgYi5kYXRhc2V0LnQ7IH0gfQphc3luYyBmdW5jdGlvbiBkb1JlZ2lzdGVyKCkgewogIGNvbnN0IG5hbWUgPSB2YWwoJ3JOYW1lJyksIGVtYWlsID0gdmFsKCdyRW1haWwnKSwgcGFzc3dvcmQgPSAkKCdyUGFzcycpPy52YWx1ZSB8fCAnJzsKICBpZiAoIW5hbWUgfHwgIWVtYWlsIHx8ICFwYXNzd29yZCkgcmV0dXJuIHNldEVycign2KfZhdmE2KMg2YPZhCDYp9mE2K3ZgtmI2YQnKTsKICBidXN5KCdyQnRuJywgdHJ1ZSk7CiAgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL3JlZ2lzdGVyJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBuYW1lLCBlbWFpbCwgcGFzc3dvcmQgfSkgfSk7IHN0YXRlLmF1dGguZW1haWwgPSByLmVtYWlsOyBzdGF0ZS5hdXRoLmRldkNvZGUgPSByLmRldkNvZGUgfHwgbnVsbDsgc3RhdGUuYXV0aC52aWV3ID0gJ3ZlcmlmeSc7IHJlbmRlcigpOyB9CiAgY2F0Y2ggKGUpIHsgYnVzeSgnckJ0bicsIGZhbHNlLCAn2KXZhti02KfYoSDYrdiz2KfYqCcpOyBzZXRFcnIoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGRvVmVyaWZ5KCkgewogIGNvbnN0IGNvZGUgPSB2YWwoJ3ZDb2RlJyk7IGlmIChjb2RlLmxlbmd0aCA8IDQpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINin2YTYsdmF2LInKTsKICBidXN5KCd2QnRuJywgdHJ1ZSk7CiAgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL3ZlcmlmeScsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IHN0YXRlLmF1dGguZW1haWwsIGNvZGUgfSkgfSk7IHN0YXRlLnVzZXIgPSByLnVzZXI7IGF3YWl0IGxvYWRBcHAoKTsgfQogIGNhdGNoIChlKSB7IGJ1c3koJ3ZCdG4nLCBmYWxzZSwgJ9iq2YHYudmK2YQg2YjYr9iu2YjZhCcpOyBzZXRFcnIoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGRvUmVzZW5kKCkgeyB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvcmVzZW5kJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbDogc3RhdGUuYXV0aC5lbWFpbCB9KSB9KTsgc3RhdGUuYXV0aC5kZXZDb2RlID0gci5kZXZDb2RlIHx8IG51bGw7IHJlbmRlcigpOyB9IGNhdGNoIChlKSB7IHNldEVycihlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gZG9Mb2dpbigpIHsKICBjb25zdCBlbWFpbCA9IHZhbCgnbEVtYWlsJyksIHBhc3N3b3JkID0gJCgnbFBhc3MnKT8udmFsdWUgfHwgJyc7CiAgaWYgKCFlbWFpbCB8fCAhcGFzc3dvcmQpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINin2YTYqNix2YrYryDZiNmD2YTZhdipINin2YTZhdix2YjYsScpOwogIGJ1c3koJ2xCdG4nLCB0cnVlKTsKICB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbG9naW4nLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsLCBwYXNzd29yZCB9KSB9KTsgc3RhdGUudXNlciA9IHIudXNlcjsgYXdhaXQgbG9hZEFwcCgpOyB9CiAgY2F0Y2ggKGUpIHsgYnVzeSgnbEJ0bicsIGZhbHNlLCAn2K/YrtmI2YQnKTsgaWYgKGUubWVzc2FnZS5pbmNsdWRlcygn2YHYudmR2YQnKSkgeyBzdGF0ZS5hdXRoLmVtYWlsID0gZW1haWw7IHN0YXRlLmF1dGgudmlldyA9ICd2ZXJpZnknOyByZW5kZXIoKTsgc2V0RXJyKCfZgdi52ZHZhCDYrdiz2KfYqNmDINij2YjZhNmL2KcnKTsgfSBlbHNlIHNldEVycihlLm1lc3NhZ2UpOyB9Cn0KYXN5bmMgZnVuY3Rpb24gZG9Gb3Jnb3QoKSB7IGNvbnN0IGVtYWlsID0gdmFsKCdmRW1haWwnKTsgaWYgKCFlbWFpbCkgcmV0dXJuIHNldEVycign2KPYr9iu2YQg2KjYsdmK2K/ZgycpOyBidXN5KCdmQnRuJywgdHJ1ZSk7IHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC9mb3Jnb3QnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsIH0pIH0pOyBzdGF0ZS5hdXRoLmVtYWlsID0gZW1haWw7IHN0YXRlLmF1dGguZGV2Q29kZSA9IHIuZGV2Q29kZSB8fCBudWxsOyBzdGF0ZS5hdXRoLnZpZXcgPSAncmVzZXQnOyByZW5kZXIoKTsgfSBjYXRjaCAoZSkgeyBidXN5KCdmQnRuJywgZmFsc2UsICfYpdix2LPYp9mEINin2YTYsdmF2LInKTsgc2V0RXJyKGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBkb1Jlc2V0KCkgewogIGNvbnN0IGNvZGUgPSB2YWwoJ3NDb2RlJyksIHBhc3N3b3JkID0gJCgnc1Bhc3MnKT8udmFsdWUgfHwgJyc7CiAgaWYgKGNvZGUubGVuZ3RoIDwgNCB8fCAhcGFzc3dvcmQpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINin2YTYsdmF2LIg2YjZg9mE2YXYqSDYp9mE2YXYsdmI2LEnKTsKICBidXN5KCdzQnRuJywgdHJ1ZSk7CiAgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2F1dGgvcmVzZXQnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBzdGF0ZS5hdXRoLmVtYWlsLCBjb2RlLCBwYXNzd29yZCB9KSB9KTsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL2xvZ2luJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbDogc3RhdGUuYXV0aC5lbWFpbCwgcGFzc3dvcmQgfSkgfSk7IHN0YXRlLnVzZXIgPSByLnVzZXI7IGF3YWl0IGxvYWRBcHAoKTsgfQogIGNhdGNoIChlKSB7IGJ1c3koJ3NCdG4nLCBmYWxzZSwgJ9it2YHYuCDZiNin2YTYr9iu2YjZhCcpOyBzZXRFcnIoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGRvTG9nb3V0KCkgeyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYXV0aC9sb2dvdXQnLCB7IG1ldGhvZDogJ1BPU1QnIH0pOyB9IGNhdGNoIHt9IHN0YXRlLnVzZXIgPSBudWxsOyBzdGF0ZS5hdXRoID0geyB2aWV3OiAnbG9naW4nLCBlbWFpbDogJycsIGRldkNvZGU6IG51bGwgfTsgcmVuZGVyKCk7IH0KCi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQogICDYtNix2YrYtyDYp9mE2KrZhtmC2ZHZhCDYp9mE2LnZhNmI2YogKNmF2YbYtdipKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KZnVuY3Rpb24gdG9wTmF2KCkgewogIGNvbnN0IHRhYnMgPSBbWydob21lJywgJ9in2YTYsdim2YrYs9mK2KknXSwgWydvZmZlcnMnLCAn2KfZhNi52LHZiNi2J10sIFsnb3JkZXJzJywgJ9in2YTYt9mE2KjYp9iqJ10sIFsnYWNjb3VudCcsICfYrdiz2KfYqNmKJ11dOwogIHJldHVybiBgPGRpdiBjbGFzcz0ibmF2LWlubmVyIj4KICAgIDxkaXYgY2xhc3M9ImJyYW5kIiBvbmNsaWNrPSJnb0hvbWUoKSI+PHNwYW4gY2xhc3M9Im1hcmsiPlM8L3NwYW4+INiz2YjYqNixINii2Kg8L2Rpdj4KICAgIDxuYXYgY2xhc3M9Im5hdi1saW5rcyI+CiAgICAgICR7dGFicy5tYXAoKFtrLCBsXSkgPT4gYDxhIGNsYXNzPSIke3N0YXRlLnRhYiA9PT0gayA/ICdhY3RpdmUnIDogJyd9IiBvbmNsaWNrPSJzZXRUYWIoJyR7a30nKSI+JHtsfTwvYT5gKS5qb2luKCcnKX0KICAgIDwvbmF2PgogICAgPGRpdiBjbGFzcz0ibmF2LXJpZ2h0Ij4KICAgICAgPHNwYW4gY2xhc3M9ImxvYy1jaGlwIj7wn5ONICR7ZXNjKChzdGF0ZS51c2VyLmFkZHJlc3MgfHwgc3RhdGUuY2ZnLmxvY2F0aW9uKS5zcGxpdCgn2IwnKVswXSl9PC9zcGFuPgogICAgICA8YnV0dG9uIGNsYXNzPSJidG4tb3V0IiBvbmNsaWNrPSJkb0xvZ291dCgpIj7Yrtix2YjYrDwvYnV0dG9uPgogICAgPC9kaXY+CiAgPC9kaXY+YDsKfQoKLyogLS0tLS0tLS0tLSDYo9iv2YjYp9iqIC0tLS0tLS0tLS0gKi8KZnVuY3Rpb24gYXBwTG9nbyhpZCwgc2l6ZSkgeyBjb25zdCBhID0gYXBwcygpW2lkXTsgcmV0dXJuIGA8ZGl2IGNsYXNzPSJhbG9nbyIgc3R5bGU9ImJhY2tncm91bmQ6JHthLmNvbG9yfTtjb2xvcjoke2EudGV4dH07d2lkdGg6JHtzaXplfXB4O2hlaWdodDoke3NpemV9cHgiPiR7YS5zaG9ydH08L2Rpdj5gOyB9CmZ1bmN0aW9uIHNoYWRlKGhleCwgcCkgeyBoZXggPSBoZXgucmVwbGFjZSgnIycsICcnKTsgY29uc3QgbiA9IHBhcnNlSW50KGhleCwgMTYpOyBsZXQgciA9IChuID4+IDE2KSAmIDI1NSwgZyA9IChuID4+IDgpICYgMjU1LCBiID0gbiAmIDI1NTsgciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgciArIHIgKiBwIC8gMTAwKSk7IGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcgKyBnICogcCAvIDEwMCkpOyBiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBiICsgYiAqIHAgLyAxMDApKTsgcmV0dXJuICcjJyArICgoMSA8PCAyNCkgKyAoTWF0aC5yb3VuZChyKSA8PCAxNikgKyAoTWF0aC5yb3VuZChnKSA8PCA4KSArIE1hdGgucm91bmQoYikpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTsgfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgINin2YTYtNin2LTYp9iqCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiB2aWV3SG9tZSgpIHsKICBjb25zdCBmb29kID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gJ2Zvb2QnKTsKICBjb25zdCBncm9jID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gJ2dyb2NlcnknKTsKICBjb25zdCBmYXZzID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IGlzRmF2KHMuaWQpKTsKICBjb25zdCBxID0gc3RhdGUucXVlcnkudHJpbSgpOwogIGNvbnN0IGZpbHRlcmVkID0gcSA/IHN0YXRlLnN0b3Jlcy5maWx0ZXIocyA9PiBzLm5hbWUuaW5jbHVkZXMocSkgfHwgcy5jYXQuaW5jbHVkZXMocSkpIDogbnVsbDsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+CiAgICA8c2VjdGlvbiBjbGFzcz0iaGVybyI+CiAgICAgIDxkaXYgY2xhc3M9Imhlcm8tdHh0Ij48aDE+2YjYtCDYqtio2Yog2KrYt9mE2Kgg2KfZhNmK2YjZhSDZitinICR7ZXNjKHN0YXRlLnVzZXIubmFtZS5zcGxpdCgnICcpWzBdKX3YnzwvaDE+CiAgICAgICAgPHA+2KfYt9mE2Kgg2YXYsdipINmI2K3Yr9ipIOKAlCDZhtmC2KfYsdmGINmE2YMg2KfZhNiz2LnYsSDZiNin2YTYqtmI2LXZitmEINmI2KfZhNiu2LXZiNmF2KfYqiDYudio2LEg2YPZhCDYp9mE2KrYt9io2YrZgtin2Kog2YjZhtiu2KrYp9ixINin2YTYo9ix2K7YtS48L3A+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InNlYXJjaCI+PHNwYW4+8J+UjTwvc3Bhbj48aW5wdXQgaWQ9InEiIHBsYWNlaG9sZGVyPSLYp9io2K3YqyDYudmGINmF2LfYudmFINij2Ygg2YXYqtis2LHigKYiIHZhbHVlPSIke2VzYyhxKX0iIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiAvPjwvZGl2PgogICAgPC9zZWN0aW9uPgogICAgJHtzdGF0ZS5jZmcubGl2ZSA/IGA8ZGl2IGNsYXNzPSJsaXZlLXN0cmlwIj48c3BhbiBjbGFzcz0iZG90Ij7il488L3NwYW4+INix2KjYtyDYrdmKINmF2LkgJHtlc2Moc3RhdGUuY2ZnLmxpdmUuc291cmNlKX0gwrcg2KLYrtixINiq2K3Yr9mK2KsgJHtlc2Moc3RhdGUuY2ZnLmxpdmUuZmV0Y2hlZEF0KX08L2Rpdj5gIDogJyd9CiAgICAke2ZpbHRlcmVkID8gYDxoMyBjbGFzcz0ic2VjIj7Zhtiq2KfYptisINin2YTYqNit2KsgKCR7ZmlsdGVyZWQubGVuZ3RofSk8L2gzPiR7ZmlsdGVyZWQubGVuZ3RoID8gYDxkaXYgY2xhc3M9ImdyaWQiPiR7ZmlsdGVyZWQubWFwKHBsYWNlQ2FyZCkuam9pbignJyl9PC9kaXY+YCA6IGA8ZGl2IGNsYXNzPSJlbXB0eSI+PGRpdiBjbGFzcz0iZSI+8J+UjjwvZGl2PjxoMz7ZhdinINmE2YLZitmG2Kcg2YbYqtin2KbYrDwvaDM+PC9kaXY+YH1gCiAgICA6IGAKICAgICAgPGRpdiBjbGFzcz0iY2F0cyI+CiAgICAgICAgPGRpdiBjbGFzcz0iY2F0IGZvb2QiIG9uY2xpY2s9InNldE1vZGUoJ2Zvb2QnKSI+PGRpdj48aDQ+2LfYudin2YU8L2g0PjxwPtmF2LfYp9i52YUg2YjZiNis2KjYp9iqINiz2LHZiti52Kk8L3A+PC9kaXY+PHNwYW4gY2xhc3M9ImVtb2ppIj7wn42UPC9zcGFuPjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImNhdCBncm9jZXJ5IiBvbmNsaWNrPSJzZXRNb2RlKCdncm9jZXJ5JykiPjxkaXY+PGg0PtmF2YLYp9i22Yo8L2g0PjxwPtio2YLYp9mE2Kkg2YjYs9mI2KjYsdmF2KfYsdmD2Ko8L3A+PC9kaXY+PHNwYW4gY2xhc3M9ImVtb2ppIj7wn5uSPC9zcGFuPjwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgJHtmYXZzLmxlbmd0aCA/IGA8aDMgY2xhc3M9InNlYyI+4p2k77iPINmF2YHYttmR2YTYqtmDPC9oMz48ZGl2IGNsYXNzPSJncmlkIj4ke2ZhdnMubWFwKHBsYWNlQ2FyZCkuam9pbignJyl9PC9kaXY+YCA6ICcnfQogICAgICA8aDMgY2xhc3M9InNlYyI+8J+NlCDZhdi32KfYudmFIDxhIG9uY2xpY2s9InNldE1vZGUoJ2Zvb2QnKSI+2LnYsdi2INin2YTZg9mEPC9hPjwvaDM+PGRpdiBjbGFzcz0iZ3JpZCI+JHtmb29kLm1hcChwbGFjZUNhcmQpLmpvaW4oJycpfTwvZGl2PgogICAgICA8aDMgY2xhc3M9InNlYyI+8J+bkiDZhdmC2KfYttmKINmI2LPZiNio2LHZhdin2LHZg9iqIDxhIG9uY2xpY2s9InNldE1vZGUoJ2dyb2NlcnknKSI+2LnYsdi2INin2YTZg9mEPC9hPjwvaDM+PGRpdiBjbGFzcz0iZ3JpZCI+JHtncm9jLm1hcChwbGFjZUNhcmQpLmpvaW4oJycpfTwvZGl2PgogICAgYH0KICA8L2Rpdj5gOwp9CmZ1bmN0aW9uIHZpZXdMaXN0KCkgewogIGNvbnN0IGxpc3QgPSBzdGF0ZS5zdG9yZXMuZmlsdGVyKHMgPT4gcy5raW5kID09PSBzdGF0ZS5tb2RlKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+CiAgICA8ZGl2IGNsYXNzPSJjcnVtYiI+PGEgb25jbGljaz0iZ29Ib21lKCkiPtin2YTYsdim2YrYs9mK2Kk8L2E+IOKAuiAke3N0YXRlLm1vZGUgPT09ICdmb29kJyA/ICfZhdi32KfYudmFJyA6ICfZhdmC2KfYttmKJ308L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNlYXJjaCB3aWRlIj48c3Bhbj7wn5SNPC9zcGFuPjxpbnB1dCBpZD0icSIgcGxhY2Vob2xkZXI9Itin2KjYrdir4oCmIiBvbmlucHV0PSJvblNlYXJjaCh0aGlzLnZhbHVlKSIgLz48L2Rpdj4KICAgIDxoMyBjbGFzcz0ic2VjIj4ke2xpc3QubGVuZ3RofSDZhdiq2KzYsSDZhdiq2KfYrTwvaDM+CiAgICA8ZGl2IGNsYXNzPSJncmlkIj4ke2xpc3QubWFwKHBsYWNlQ2FyZCkuam9pbignJyl9PC9kaXY+CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiBwbGFjZUNhcmQocykgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY2FyZCBwbGFjZSI+CiAgICA8ZGl2IGNsYXNzPSJjYXJkLXRvcCIgc3R5bGU9ImJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywke3MuY29sb3J9LCR7c2hhZGUocy5jb2xvciwgLTIyKX0pIiBvbmNsaWNrPSJvcGVuU3RvcmUoJyR7cy5pZH0nKSI+CiAgICAgIDxzcGFuIGNsYXNzPSJsb2dvLWJhZGdlIiBzdHlsZT0iY29sb3I6JHtzLmNvbG9yfSI+JHtzLmxvZ299PC9zcGFuPgogICAgICA8c3BhbiBjbGFzcz0iZmF2LWhlYXJ0IiBvbmNsaWNrPSJldmVudC5zdG9wUHJvcGFnYXRpb24oKTt0b2dnbGVGYXYoJyR7cy5pZH0nKSI+JHtpc0ZhdihzLmlkKSA/ICfinaTvuI8nIDogJ/CfpI0nfTwvc3Bhbj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iY2FyZC1ib2R5IiBvbmNsaWNrPSJvcGVuU3RvcmUoJyR7cy5pZH0nKSI+CiAgICAgIDxoND4ke2VzYyhzLm5hbWUpfTwvaDQ+PHA+JHtlc2Mocy5jYXQpfTwvcD4KICAgICAgPGRpdiBjbGFzcz0ibWV0YSI+PHNwYW4gY2xhc3M9InN0YXIiPuKYhSAke3MucmF0aW5nfTwvc3Bhbj48c3Bhbj7ij7EgJHtlc2Mocy5ldGEpfTwvc3Bhbj4KICAgICAgICAke3MubGl2ZSA/ICc8c3BhbiBjbGFzcz0iYmFkZ2UtbiBsaXZlIj7il48g2YXYqNin2LTYsTwvc3Bhbj4nIDogYDxzcGFuIGNsYXNzPSJiYWRnZS1uIj4ke3Mub24ubGVuZ3RofSDYqti32KjZitmC2KfYqjwvc3Bhbj5gfTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJhcHBzLW1pbmkiPiR7cy5vbi5zbGljZSgwLCA2KS5tYXAoaWQgPT4gYDxpIHN0eWxlPSJiYWNrZ3JvdW5kOiR7YXBwcygpW2lkXS5jb2xvcn0iPjwvaT5gKS5qb2luKCcnKX08L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gdmlld1N0b3JlKCkgewogIGNvbnN0IHMgPSBzdGF0ZS5zdG9yZTsKICBjb25zdCBpdGVtcyA9IGNhcnRDb3VudCgpOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj4KICAgIDxkaXYgY2xhc3M9ImNydW1iIj48YSBvbmNsaWNrPSJnb0hvbWUoKSI+2KfZhNix2KbZitiz2YrYqTwvYT4g4oC6ICR7ZXNjKHMubmFtZSl9PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJzdG9yZS1iYW5uZXIiIHN0eWxlPSJiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsJHtzLmNvbG9yfSwke3NoYWRlKHMuY29sb3IsIC0yNSl9KSI+CiAgICAgIDxoMj4ke2VzYyhzLm5hbWUpfTwvaDI+PGRpdiBjbGFzcz0idGFncyI+JHtlc2Mocy5jYXQpfSDCtyDimIUgJHtzLnJhdGluZ30gwrcg4o+xICR7ZXNjKHMuZXRhKX08L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iY2hpcHMiPiR7cy5saXZlID8gYDxzcGFuIGNsYXNzPSJjaGlwIj7il48g2YXYqNin2LTYsSDZhdmGICR7ZXNjKHMubGl2ZVNvdXJjZSl9PC9zcGFuPmAgOiAnJ308c3BhbiBjbGFzcz0iY2hpcCI+JHtzLm9uLmxlbmd0aH0g2KrYt9io2YrZgtin2Kog2KrZiNi12YrZhDwvc3Bhbj48c3BhbiBjbGFzcz0iY2hpcCI+8J+TjSAke2VzYygoc3RhdGUudXNlci5hZGRyZXNzIHx8IHN0YXRlLmNmZy5sb2NhdGlvbikuc3BsaXQoJ9iMJylbMF0pfTwvc3Bhbj48L2Rpdj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0ic3RvcmUtbGF5b3V0Ij4KICAgICAgPGRpdiBjbGFzcz0ibWVudS1jb2wiPgogICAgICAgICR7cy5saXZlID8gYDxkaXYgY2xhc3M9ImxpdmUtc3RyaXAgc20iPjxzcGFuIGNsYXNzPSJkb3QiPuKXjzwvc3Bhbj4g2KPYs9i52KfYsSDZhdio2KfYtNix2Kkg2YXZhiAke2VzYyhzLmxpdmVTb3VyY2UpfSDCtyAke2VzYyhzLmxpdmVBdCl9PC9kaXY+YCA6ICcnfQogICAgICAgICR7cy5tZW51Lm1hcChnID0+IGA8aDMgY2xhc3M9Im1lbnUtY2F0Ij4ke2VzYyhnLmcpfTwvaDM+PGRpdiBjbGFzcz0iZ3JpZCBpdGVtcyI+JHtnLml0ZW1zLm1hcChpdGVtUm93KS5qb2luKCcnKX08L2Rpdj5gKS5qb2luKCcnKX0KICAgICAgICA8cCBjbGFzcz0iZGlzY2xhaW1lciI+JHtzLmxpdmUgPyBg2KPYs9i52KfYsSAke2VzYyhzLmxpdmVTb3VyY2UpfSDZhdiz2K3ZiNio2Kkg2YHYudmE2YrZi9inICjYsdio2Lcg2K3ZiikuYCA6ICfYp9mE2KPYs9i52KfYsSDYqtmI2LbZitit2YrYqSDZhNmE2YbZhdmI2LDYrC4nfSDYqNin2YLZiiDYp9mE2KrYt9io2YrZgtin2Kog2KrZgtiv2YrYsdmK2KkuPC9wPgogICAgICA8L2Rpdj4KICAgICAgPGFzaWRlIGNsYXNzPSJjYXJ0LWNvbCI+CiAgICAgICAgPGRpdiBjbGFzcz0iY2FydC1ib3giPgogICAgICAgICAgPGg0Ptiz2YTYqtmDPC9oND4KICAgICAgICAgICR7aXRlbXMgPyBgPGRpdiBjbGFzcz0iY2FydC1saW5lcyI+JHtjYXJ0TGluZXMocyl9PC9kaXY+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImNhcnQtdG90YWwiPjxzcGFuPtin2YTYpdis2YXYp9mE2Yog2KfZhNmF2KjYr9im2Yo8L3NwYW4+PGI+JHttb25leShjYXJ0U3VidG90YWwocykpfSDYsS7YszwvYj48L2Rpdj4KICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIG9uY2xpY2s9ImdvQ29tcGFyZSgpIj7Zgtin2LHZhiDYp9mE2LnYsdmI2LYgKCR7aXRlbXN9KSDigLo8L2J1dHRvbj5gCiAgICAgICAgICA6IGA8ZGl2IGNsYXNzPSJjYXJ0LWVtcHR5Ij7Ys9mE2KrZgyDZgdin2LHYutipIOKAlCDYo9i22YEg2KPYtdmG2KfZgdmL2Kcg2YTZhdmC2KfYsdmG2Kkg2KfZhNij2LPYudin2LEuPC9kaXY+YH0KICAgICAgICA8L2Rpdj4KICAgICAgPC9hc2lkZT4KICAgIDwvZGl2PgogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gY2FydExpbmVzKHMpIHsKICByZXR1cm4gT2JqZWN0LmVudHJpZXMoc3RhdGUuY2FydCkubWFwKChbaWQsIHFdKSA9PiB7IGNvbnN0IGl0ID0gZmxhdChzKS5maW5kKGkgPT4gaS5pZCA9PT0gaWQpOyByZXR1cm4gaXQgPyBgPGRpdiBjbGFzcz0iY2xpbmUiPjxzcGFuPiR7cX3DlyAke2VzYyhpdC5uKX08L3NwYW4+PGI+JHttb25leShpdC5wICogcSl9PC9iPjwvZGl2PmAgOiAnJzsgfSkuam9pbignJyk7Cn0KZnVuY3Rpb24gaXRlbVJvdyhpdCkgewogIGNvbnN0IHEgPSBzdGF0ZS5jYXJ0W2l0LmlkXSB8fCAwOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY2FyZCBpdGVtIj4KICAgIDxkaXYgY2xhc3M9InBoIj4ke2l0LmV9PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJkIj48aDU+JHtlc2MoaXQubil9PC9oNT48cD4ke2VzYyhpdC5kKX08L3A+CiAgICAgIDxkaXYgY2xhc3M9InByIj4ke21vbmV5KGl0LnApfSDYsS7YsyAke2l0LmxpdmUgPyAnPHNwYW4gY2xhc3M9ImxpdmUtdGFnIj7il48g2YXYqNin2LTYsTwvc3Bhbj4nIDogJyd9PC9kaXY+PC9kaXY+CiAgICAke3EgPyBgPGRpdiBjbGFzcz0ic3RlcHBlciI+PGJ1dHRvbiBjbGFzcz0ibWludXMiIG9uY2xpY2s9ImRlYygnJHtpdC5pZH0nKSI+4oiSPC9idXR0b24+PHNwYW4gY2xhc3M9InEiPiR7cX08L3NwYW4+PGJ1dHRvbiBvbmNsaWNrPSJpbmMoJyR7aXQuaWR9JykiPis8L2J1dHRvbj48L2Rpdj5gIDogYDxidXR0b24gY2xhc3M9ImFkZCIgb25jbGljaz0iaW5jKCcke2l0LmlkfScpIj7Ypdi22KfZgdipICs8L2J1dHRvbj5gfQogIDwvZGl2PmA7Cn0KZnVuY3Rpb24gdmlld0NvbXBhcmUoKSB7CiAgY29uc3QgYyA9IHN0YXRlLmNtcDsKICBpZiAoIWMpIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYrdiz2KfYqCDYo9mB2LbZhCDYudix2LbigKY8L2Rpdj48L2Rpdj5gOwogIGNvbnN0IG9mZmVycyA9IGMub2ZmZXJzLCBiZXN0ID0gb2ZmZXJzWzBdLCBzYXZpbmcgPSBjLnNhdmluZzsKICBjb25zdCBzdWJBcHBzID0gYy5zdG9yZS5vbi5maWx0ZXIoaWQgPT4gYXBwcygpW2lkXS5zdWIpOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj4KICAgIDxkaXYgY2xhc3M9ImNydW1iIj48YSBvbmNsaWNrPSJnb0hvbWUoKSI+2KfZhNix2KbZitiz2YrYqTwvYT4g4oC6IDxhIG9uY2xpY2s9Im9wZW5TdG9yZSgnJHtjLnN0b3JlLmlkfScpIj4ke2VzYyhjLnN0b3JlLm5hbWUpfTwvYT4g4oC6INmF2YLYp9ix2YbYqSDYp9mE2LnYsdmI2LY8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNhdmUtYmFubmVyIj48ZGl2IGNsYXNzPSJpYyI+8J+SsDwvZGl2PjxkaXY+PGg0Ptij2YHYttmEINi52LHYtiDYudio2LEgPGI+JHtlc2MoYmVzdC5hcHAubmFtZSl9PC9iPiDYqNmAICR7bW9uZXkoYmVzdC50b3RhbCl9INixLtizPC9oND48cD4ke3NhdmluZyA+IDAgPyAn2KrZiNmB2ZHYsSA8YiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj4nICsgbW9uZXkoc2F2aW5nKSArICcg2LEu2LM8L2I+INmF2YLYp9ix2YbYqSDYqNij2LrZhNmJINiq2LfYqNmK2YInIDogJ9in2YTYo9iz2LnYp9ixINmF2KrZgtin2LHYqNipJ30gwrcgJHtjYXJ0Q291bnQoKX0g2LXZhtmBINmF2YYgJHtlc2MoYy5zdG9yZS5uYW1lKX08L3A+PC9kaXY+PC9kaXY+CiAgICAke2MubGl2ZSA/IGA8ZGl2IGNsYXNzPSJsaXZlLXN0cmlwIj48c3BhbiBjbGFzcz0iZG90Ij7il488L3NwYW4+INij2LPYudin2LEgJHtlc2MoYy5saXZlLnNvdXJjZSl9INmF2KjYp9i02LHYqSDigJQg2KjYp9mC2Yog2KfZhNiq2LfYqNmK2YLYp9iqINiq2YLYr9mK2LHZitipPC9kaXY+YCA6ICcnfQogICAgJHtzdWJBcHBzLmxlbmd0aCA/IGA8ZGl2IGNsYXNzPSJzdWJzIj48c3BhbiBjbGFzcz0ibGJsIj7wn46f77iPINmB2LnZkdmEINin2LTYqtix2KfZg9in2KrZgyAo2KrZiNi12YrZhCDZhdis2KfZhtmKKTo8L3NwYW4+JHtzdWJBcHBzLm1hcChpZCA9PiBgPGJ1dHRvbiBjbGFzcz0ic3ViLWNoaXAgJHtzdGF0ZS5zdWJzW2lkXSA/ICdvbicgOiAnJ30iIG9uY2xpY2s9InRvZ2dsZVN1YignJHtpZH0nKSI+JHtlc2MoYXBwcygpW2lkXS5zdWIpfTwvYnV0dG9uPmApLmpvaW4oJycpfTwvZGl2PmAgOiAnJ30KICAgIDxkaXYgY2xhc3M9Im9mZmVycy1ncmlkIj4ke29mZmVycy5tYXAoKG8sIGkpID0+IG9mZmVyQ2FyZChvLCBpID09PSAwLCBzYXZpbmcpKS5qb2luKCcnKX08L2Rpdj4KICAgIDxwIGNsYXNzPSJkaXNjbGFpbWVyIj48Yj7YqtmG2YjZitmHOjwvYj4g2KPYs9i52KfYsSAke2MubGl2ZSA/IGVzYyhjLmxpdmUuc291cmNlKSA6ICfZh9mG2YLYsdiz2KrZiti02YYnfSDZhdiz2K3ZiNio2Kkg2YHYudmE2YrZi9inLiDYsdiz2YjZhSDYp9mE2KrZiNi12YrZhCDZiNin2YTYrti12YjZhdin2Kog2YjYo9iz2LnYp9ixINio2KfZgtmKINin2YTYqti32KjZitmC2KfYqiDYqtmC2K/Zitix2YrYqS4g2KXZhti02KfYoSDYp9mE2LfZhNioINii2YTZitmL2Kcg2YHZiiDZg9mEINiq2LfYqNmK2YIg2YrYqti32YTYqCDYp9iq2YHYp9mC2YrYqSBBUEkg2LHYs9mF2YrYqS48L3A+CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiBvZmZlckNhcmQobywgaXNCZXN0LCBzYXZpbmcpIHsKICBjb25zdCBpc0xpdmUgPSBzdGF0ZS5jbXAubGl2ZSAmJiBvLmFwcElkID09PSBzdGF0ZS5jbXAubGl2ZS5hcHA7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjYXJkIG9mZmVyICR7aXNCZXN0ID8gJ2Jlc3QnIDogJyd9IiBvbmNsaWNrPSJwaWNrT2ZmZXIoJyR7by5hcHBJZH0nKSI+CiAgICAke2lzQmVzdCA/IGA8ZGl2IGNsYXNzPSJyaWJib24iPuKtkCDYo9mB2LbZhCDYudix2LYke3NhdmluZyA+IDAgPyAnIMK3INmI2YHZkdixICcgKyBtb25leShzYXZpbmcpICsgJyDYsS7YsycgOiAnJ308L2Rpdj5gIDogJyd9CiAgICA8ZGl2IGNsYXNzPSJvZmZlci10b3AiPiR7YXBwTG9nbyhvLmFwcElkLCA0Nil9PGRpdiBjbGFzcz0iYW5tIj48aDQ+JHtlc2Moby5hcHAubmFtZSl9PC9oND4KICAgICAgPGRpdiBjbGFzcz0ic3ViIj48c3Bhbj7ij7EgJHtlc2Moby5ldGEpfTwvc3Bhbj4ke2lzTGl2ZSA/ICc8c3BhbiBjbGFzcz0ib2siPuKXjyDYs9i52LEg2YXYqNin2LTYsTwvc3Bhbj4nIDogJzxzcGFuIGNsYXNzPSJtdXRlZCI+2KrZgtiv2YrYsdmKPC9zcGFuPid9JHtvLmZyZWVEZWwgPyAnPHNwYW4gY2xhc3M9Im9rIj7YqtmI2LXZitmEINmF2KzYp9mG2Yog4pyTPC9zcGFuPicgOiAnJ308L2Rpdj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idG90Ij48ZGl2IGNsYXNzPSJiaWciPiR7bW9uZXkoby50b3RhbCl9PC9kaXY+PGRpdiBjbGFzcz0iY3VyIj7YsS7YszwvZGl2PjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0iYnJlYWtkb3duIj4KICAgICAgPGRpdiBjbGFzcz0iYnJvdyI+PHNwYW4+2LPYudixINin2YTYo9i12YbYp9mBPC9zcGFuPjxiPiR7bW9uZXkoby5zdWJ0b3RhbCl9INixLtizPC9iPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJicm93Ij48c3Bhbj7Ysdiz2YjZhSDYp9mE2KrZiNi12YrZhDwvc3Bhbj48Yj4ke28uZGVsaXZlcnkgPT09IDAgPyAnPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWdyZWVuKSI+2YXYrNin2YbZijwvc3Bhbj4nIDogbW9uZXkoby5kZWxpdmVyeSkgKyAnINixLtizJ308L2I+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImJyb3ciPjxzcGFuPtix2LPZiNmFINin2YTYrtiv2YXYqTwvc3Bhbj48Yj4ke21vbmV5KG8uc2VydmljZSl9INixLtizPC9iPjwvZGl2PgogICAgICAke28uZGlzY291bnQgPiAwID8gYDxkaXYgY2xhc3M9ImJyb3cgZGlzYyI+PHNwYW4+2KfZhNiu2LXZhTwvc3Bhbj48Yj7iiJIgJHttb25leShvLmRpc2NvdW50KX0g2LEu2LM8L2I+PC9kaXY+YCA6ICcnfTwvZGl2PgogICAgJHtvLnByb21vTGFiZWwgPyBgPGRpdiBjbGFzcz0icHJvbW8tdGFnIj7wn46f77iPICR7ZXNjKG8ucHJvbW9MYWJlbCl9PC9kaXY+YCA6ICcnfQogICAgPGJ1dHRvbiBjbGFzcz0icGlja2J0biI+2KfYt9mE2Kgg2LnYqNixICR7ZXNjKG8uYXBwLm5hbWUpfSDigLo8L2J1dHRvbj4KICA8L2Rpdj5gOwp9CmZ1bmN0aW9uIHZpZXdPZmZlcnMoKSB7CiAgY29uc3Qgcm93cyA9IE9iamVjdC5lbnRyaWVzKGFwcHMoKSkuZmlsdGVyKChbaWQsIGFdKSA9PiBhLnByb21vTGFiZWwpLm1hcCgoW2lkLCBhXSkgPT4gYDxkaXYgY2xhc3M9ImNhcmQgcHJvbW8tY2FyZCI+PGRpdiBjbGFzcz0icGwiIHN0eWxlPSJiYWNrZ3JvdW5kOiR7YS5jb2xvcn07Y29sb3I6JHthLnRleHR9Ij4ke2Euc2hvcnR9PC9kaXY+PGRpdiBjbGFzcz0icHQiPjxoNT4ke2VzYyhhLm5hbWUpfTwvaDU+PHA+JHtlc2MoYS5wcm9tb0xhYmVsKX08L3A+PC9kaXY+PGRpdiBjbGFzcz0iY29kZSI+U1VQRVIke2Euc2hvcnQubGVuZ3RofTwvZGl2PjwvZGl2PmApLmpvaW4oJycpOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIj48aDMgY2xhc3M9InNlYyI+JSDYp9mE2LnYsdmI2LYg2YjYp9mE2K7YtdmI2YXYp9iqPC9oMz48ZGl2IGNsYXNzPSJncmlkIj4ke3Jvd3N9PC9kaXY+PHAgY2xhc3M9ImRpc2NsYWltZXIiPtin2YTYudix2YjYtiDYqtmI2LbZitit2YrYqSDZhNmE2YbZhdmI2LDYrC48L3A+PC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3UHJvZmlsZSgpIHsKICBjb25zdCB1ID0gc3RhdGUudXNlcjsKICBjb25zdCBzdWJSb3dzID0gT2JqZWN0LmVudHJpZXMoYXBwcygpKS5maWx0ZXIoKFtpZCwgYV0pID0+IGEuc3ViKS5tYXAoKFtpZCwgYV0pID0+IGA8ZGl2IGNsYXNzPSJhY2Mtcm93Ij48c3BhbiBjbGFzcz0ibCI+8J+On++4jyAke2VzYyhhLnN1Yil9PC9zcGFuPjxzcGFuIGNsYXNzPSJzd2l0Y2ggJHtzdGF0ZS5zdWJzW2lkXSA/ICdvbicgOiAnJ30iIG9uY2xpY2s9InRvZ2dsZVN1YignJHtpZH0nKSI+PGk+PC9pPjwvc3Bhbj48L2Rpdj5gKS5qb2luKCcnKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciBuYXJyb3ciPgogICAgPGRpdiBjbGFzcz0icHJvZi1oZWFkIj48ZGl2IGNsYXNzPSJhdiI+JHtlc2ModS5uYW1lWzBdIHx8ICfwn5GkJyl9PC9kaXY+PGRpdj48aDI+JHtlc2ModS5uYW1lKX08L2gyPjxwPiR7ZXNjKHUuZW1haWwpfTwvcD48c3BhbiBjbGFzcz0idmJhZGdlIj4ke3UudmVyaWZpZWQgPyAn4pyTINmF2YHYudmR2YQnIDogJ9i62YrYsSDZhdmB2LnZkdmEJ30ke3UuaXNBZG1pbiA/ICcgwrcg2YXYr9mK2LEnIDogJyd9PC9zcGFuPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0iY2FyZCBwYWQiPjxoND7YudmG2YjYp9mGINin2YTYqtmI2LXZitmEPC9oND48ZGl2IGNsYXNzPSJmaWVsZCI+PGlucHV0IGlkPSJwQWRkciIgdmFsdWU9IiR7ZXNjKHUuYWRkcmVzcyB8fCAnJyl9IiAvPjwvZGl2PjxidXR0b24gY2xhc3M9ImJ0bi1zb2Z0IiBvbmNsaWNrPSJzYXZlQWRkcigpIj7YrdmB2Lgg2KfZhNi52YbZiNin2YY8L2J1dHRvbj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNhcmQgcGFkIj48aDQ+2KfYtNiq2LHYp9mD2KfYqtmKPC9oND48cCBjbGFzcz0ibXV0ZWQiPtiq2Y/Yrdiq2LPYqCDZgdmKINin2YTZhdmC2KfYsdmG2KkgKNiq2YjYtdmK2YQg2YXYrNin2YbZiikuPC9wPiR7c3ViUm93c308L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNhcmQgcGFkIj48aDQ+2KfZhNix2KjYtyDYp9mE2K3ZijwvaDQ+PHAgY2xhc3M9Im11dGVkIj4ke3N0YXRlLmNmZy5saXZlID8gYNmF2YHYudmR2YQg2YXYuSAke2VzYyhzdGF0ZS5jZmcubGl2ZS5zb3VyY2UpfSDCtyAke2VzYyhzdGF0ZS5jZmcubGl2ZS5mZXRjaGVkQXQpfWAgOiAn2LrZitixINmF2YHYudmR2YQnfTwvcD48YnV0dG9uIGNsYXNzPSJidG4tc29mdCIgaWQ9InJlZnJlc2hCdG4iIG9uY2xpY2s9InJlZnJlc2hMaXZlKCkiPvCflIQg2KrYrdiv2YrYqyDYp9mE2KPYs9i52KfYsSDYp9mE2K3ZitipPC9idXR0b24+PC9kaXY+CiAgICAke3UuaXNBZG1pbiA/IGA8YnV0dG9uIGNsYXNzPSJidG4tc29mdCIgb25jbGljaz0ib3BlbkFkbWluKCkiPvCfm6HvuI8g2YTZiNit2Kkg2KfZhNiq2K3Zg9mFICjYp9mE2KLYr9mF2YYpPC9idXR0b24+YCA6ICcnfQogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLWRhbmdlciIgb25jbGljaz0iZG9Mb2dvdXQoKSI+2KrYs9is2YrZhCDYp9mE2K7YsdmI2Kw8L2J1dHRvbj4KICA8L2Rpdj5gOwp9CmZ1bmN0aW9uIHZpZXdBZG1pbigpIHsKICBjb25zdCB1cyA9IHN0YXRlLmFkbWluLnVzZXJzOwogIGNvbnN0IHZlcmlmaWVkID0gdXMgPyB1cy5maWx0ZXIodSA9PiB1LnZlcmlmaWVkKS5sZW5ndGggOiAwOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY29udGFpbmVyIG5hcnJvdyI+CiAgICA8ZGl2IGNsYXNzPSJjcnVtYiI+PGEgb25jbGljaz0ic2V0VGFiKCdhY2NvdW50JykiPtit2LPYp9io2Yo8L2E+IOKAuiDZhNmI2K3YqSDYp9mE2KrYrdmD2YU8L2Rpdj4KICAgICR7dXMgPyBgPGRpdiBjbGFzcz0ic3RhdC1yb3ciPjxkaXYgY2xhc3M9ImNhcmQgc3RhdCI+PGRpdiBjbGFzcz0ibiI+JHt1cy5sZW5ndGh9PC9kaXY+PGRpdiBjbGFzcz0ibCI+2KXYrNmF2KfZhNmKINin2YTZhdiz2KzZkdmE2YrZhjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9ImNhcmQgc3RhdCI+PGRpdiBjbGFzcz0ibiI+JHt2ZXJpZmllZH08L2Rpdj48ZGl2IGNsYXNzPSJsIj7Yrdiz2KfYqNin2Kog2YXZgdi52ZHZhNipPC9kaXY+PC9kaXY+PC9kaXY+CiAgICAgIDxoMyBjbGFzcz0ic2VjIj7Yp9mE2YXYs9iq2K7Yr9mF2YjZhjwvaDM+JHt1cy5tYXAoYWRtaW5Vc2VyUm93KS5qb2luKCcnKX1gCiAgICA6IGA8ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYp9mE2KrYrdmF2YrZhOKApjwvZGl2PmB9CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiBhZG1pblVzZXJSb3codSkgewogIHJldHVybiBgPGRpdiBjbGFzcz0iY2FyZCB1c2VyLXJvdyI+PGRpdiBjbGFzcz0iYXYiPiR7ZXNjKHUubmFtZVswXSB8fCAnPycpfTwvZGl2PgogICAgPGRpdiBjbGFzcz0idWkiPjxoNT4ke2VzYyh1Lm5hbWUpfTwvaDU+PHA+JHtlc2ModS5lbWFpbCl9PC9wPgogICAgICA8ZGl2IGNsYXNzPSJ0YWdzLXJvdyI+PHNwYW4gY2xhc3M9InRhZ3YgJHt1LnZlcmlmaWVkID8gJ3knIDogJ24nfSI+JHt1LnZlcmlmaWVkID8gJ9mF2YHYudmR2YQnIDogJ9i62YrYsSDZhdmB2LnZkdmEJ308L3NwYW4+JHt1LmlzQWRtaW4gPyAnPHNwYW4gY2xhc3M9InRhZ3YgYSI+2YXYr9mK2LE8L3NwYW4+JyA6ICcnfTwvZGl2PjwvZGl2PgogICAgJHt1LmlkID09PSBzdGF0ZS51c2VyLmlkID8gJzxzcGFuIGNsYXNzPSJtdXRlZCI+2KPZhtiqPC9zcGFuPicgOiBgPGJ1dHRvbiBjbGFzcz0iZGVsIiBvbmNsaWNrPSJkZWxVc2VyKCR7dS5pZH0pIj7Yrdiw2YE8L2J1dHRvbj5gfTwvZGl2PmA7Cn0KCi8qIC0tLS0tLS0tLS0g2YXZiNiv2KfZhCDYp9mE2KrYrdmI2YrZhCAtLS0tLS0tLS0tICovCmZ1bmN0aW9uIHNob3dIYW5kb2ZmKGFwcElkKSB7CiAgY29uc3QgbyA9IHN0YXRlLmNtcC5vZmZlcnMuZmluZCh4ID0+IHguYXBwSWQgPT09IGFwcElkKTsKICBjb25zdCBtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IG0uY2xhc3NOYW1lID0gJ21vZGFsLWJnJzsgbS5pZCA9ICdtb2RhbCc7IG0ub25jbGljayA9IGUgPT4geyBpZiAoZS50YXJnZXQgPT09IG0pIGNsb3NlTW9kYWwoKTsgfTsKICBtLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJzaGVldCI+PGRpdiBjbGFzcz0iaCI+JHthcHBMb2dvKGFwcElkLCA1MCl9PGRpdj48aDM+JHtlc2Moby5hcHAubmFtZSl9PC9oMz48cD4ke2VzYyhvLmV0YSl9IMK3ICR7ZXNjKHN0YXRlLnVzZXIuYWRkcmVzcyB8fCBzdGF0ZS5jZmcubG9jYXRpb24pfTwvcD48L2Rpdj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9InN1bSI+PGRpdiBjbGFzcz0iciI+PHNwYW4+JHtlc2Moc3RhdGUuY21wLnN0b3JlLm5hbWUpfSDCtyAke2NhcnRDb3VudCgpfSDYtdmG2YE8L3NwYW4+PGI+JHttb25leShvLnN1YnRvdGFsKX0g2LEu2LM8L2I+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InIiPjxzcGFuPtin2YTYqtmI2LXZitmEPC9zcGFuPjxiPiR7by5kZWxpdmVyeSA9PT0gMCA/ICfZhdis2KfZhtmKJyA6IG1vbmV5KG8uZGVsaXZlcnkpICsgJyDYsS7Ysyd9PC9iPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJyIj48c3Bhbj7Yp9mE2K7Yr9mF2Kk8L3NwYW4+PGI+JHttb25leShvLnNlcnZpY2UpfSDYsS7YszwvYj48L2Rpdj4KICAgICAgJHtvLmRpc2NvdW50ID4gMCA/IGA8ZGl2IGNsYXNzPSJyIj48c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj7Yp9mE2K7YtdmFPC9zcGFuPjxiIHN0eWxlPSJjb2xvcjp2YXIoLS1ncmVlbikiPuKIkiAke21vbmV5KG8uZGlzY291bnQpfSDYsS7YszwvYj48L2Rpdj5gIDogJyd9CiAgICAgIDxkaXYgY2xhc3M9InIgdHQiPjxzcGFuPtin2YTYpdis2YXYp9mE2Yo8L3NwYW4+PHNwYW4+JHttb25leShvLnRvdGFsKX0g2LEu2LM8L3NwYW4+PC9kaXY+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJub3RlIj7wn5SSIDxiPtmE2YTYqtij2YPZitivINmI2KfZhNiv2YHYuTo8L2I+INiz2YrYrdmI2ZHZhNmDINiz2YjYqNixINii2Kgg2KXZhNmJICR7ZXNjKG8uYXBwLm5hbWUpfSDZhNil2YPZhdin2YQg2LfZhNio2YMg2KjZhtmB2LPZgy4g2YTYpyDZhtiq2YXZkSDYp9mE2K/Zgdi5INmG2YrYp9io2KnZiyDYudmG2YMuPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJjdGEiPjxidXR0b24gY2xhc3M9ImNhbmNlbCIgb25jbGljaz0iY2xvc2VNb2RhbCgpIj7Ysdis2YjYuTwvYnV0dG9uPjxidXR0b24gY2xhc3M9ImdvIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPtiq2K3ZiNmK2YQg2KXZhNmJICR7ZXNjKG8uYXBwLm5hbWUpfSDigLo8L2J1dHRvbj48L2Rpdj48L2Rpdj5gOwogIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobSk7Cn0KZnVuY3Rpb24gY2xvc2VNb2RhbCgpIHsgY29uc3QgbSA9ICQoJ21vZGFsJyk7IGlmIChtKSBtLnJlbW92ZSgpOyB9CgovKiAtLS0tLS0tLS0tINiq2YbZgtmR2YQgKyDYudix2LYgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiB2aWV3QnlUYWIoKSB7CiAgaWYgKHN0YXRlLnRhYiA9PT0gJ29mZmVycycpIHJldHVybiB2aWV3T2ZmZXJzKCk7CiAgaWYgKHN0YXRlLnRhYiA9PT0gJ2FjY291bnQnKSByZXR1cm4gc3RhdGUuc2NyZWVuID09PSAnYWRtaW4nID8gdmlld0FkbWluKCkgOiB2aWV3UHJvZmlsZSgpOwogIGlmIChzdGF0ZS5zY3JlZW4gPT09ICdzdG9yZScpIHJldHVybiB2aWV3U3RvcmUoKTsKICBpZiAoc3RhdGUuc2NyZWVuID09PSAnY29tcGFyZScpIHJldHVybiB2aWV3Q29tcGFyZSgpOwogIGlmIChzdGF0ZS5zY3JlZW4gPT09ICdsaXN0JykgcmV0dXJuIHZpZXdMaXN0KCk7CiAgcmV0dXJuIHZpZXdIb21lKCk7Cn0KZnVuY3Rpb24gcmVuZGVyKCkgewogIGNvbnN0IGFwcCA9ICQoJ2FwcCcpOwogIGlmICghc3RhdGUudXNlcikgeyBhcHAuY2xhc3NOYW1lID0gJ2FwcCBhdXRoLW1vZGUnOyAkKCd0b3BuYXYnKS5pbm5lckhUTUwgPSAnJzsgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gdmlld0F1dGgoKTsgd2luZG93LnNjcm9sbFRvKDAsIDApOyByZXR1cm47IH0KICBhcHAuY2xhc3NOYW1lID0gJ2FwcCc7CiAgJCgndG9wbmF2JykuaW5uZXJIVE1MID0gdG9wTmF2KCk7CiAgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gdmlld0J5VGFiKCk7CiAgd2luZG93LnNjcm9sbFRvKDAsIDApOwp9CgovKiAtLS0tLS0tLS0tINij2K3Yr9in2KsgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBzZXRUYWIoaykgeyBpZiAoayA9PT0gJ29yZGVycycpIHsgYWxlcnQoJ9i02KfYtNipINin2YTYt9mE2KjYp9iqIOKAlCDZgtix2YrYqNmL2KcuJyk7IHJldHVybjsgfSBzdGF0ZS50YWIgPSBrOyBpZiAoayA9PT0gJ2hvbWUnKSB7IHN0YXRlLnNjcmVlbiA9ICdob21lJzsgc3RhdGUucXVlcnkgPSAnJzsgfSBlbHNlIHN0YXRlLnNjcmVlbiA9IGsgPT09ICdhY2NvdW50JyA/ICdwcm9maWxlJyA6ICdob21lJzsgcmVuZGVyKCk7IH0KZnVuY3Rpb24gc2V0TW9kZShtKSB7IHN0YXRlLm1vZGUgPSBtOyBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdsaXN0JzsgcmVuZGVyKCk7IH0KZnVuY3Rpb24gZ29Ib21lKCkgeyBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdob21lJzsgc3RhdGUucXVlcnkgPSAnJzsgcmVuZGVyKCk7IH0KYXN5bmMgZnVuY3Rpb24gb3BlblN0b3JlKGlkKSB7CiAgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+PGRpdiBjbGFzcz0ibG9hZGluZyI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g2KzYp9ix2Yog2KfZhNmB2KrYreKApjwvZGl2PjwvZGl2PmA7CiAgdHJ5IHsgc3RhdGUuc3RvcmUgPSBhd2FpdCBhcGkoJy9hcGkvc3RvcmVzLycgKyBpZCk7IHN0YXRlLmNhcnQgPSB7fTsgc3RhdGUudGFiID0gJ2hvbWUnOyBzdGF0ZS5zY3JlZW4gPSAnc3RvcmUnOyByZW5kZXIoKTsgfQogIGNhdGNoIChlKSB7ICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJjb250YWluZXIiPjxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7imqDvuI88L2Rpdj48aDM+JHtlc2MoZS5tZXNzYWdlKX08L2gzPjwvZGl2PjwvZGl2PmA7IH0KfQphc3luYyBmdW5jdGlvbiBnb0NvbXBhcmUoKSB7IHN0YXRlLnNjcmVlbiA9ICdjb21wYXJlJzsgc3RhdGUuY21wID0gbnVsbDsgcmVuZGVyKCk7IGF3YWl0IHJlZnJlc2hDb21wYXJlKCk7IH0KYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENvbXBhcmUoKSB7IHN0YXRlLmNtcCA9IGF3YWl0IGFwaSgnL2FwaS9jb21wYXJlJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdG9yZUlkOiBzdGF0ZS5zdG9yZS5pZCwgY2FydDogc3RhdGUuY2FydCwgc3Viczogc3RhdGUuc3VicyB9KSB9KTsgaWYgKHN0YXRlLnNjcmVlbiA9PT0gJ2NvbXBhcmUnKSByZW5kZXIoKTsgfQpmdW5jdGlvbiBpbmMoaWQpIHsgc3RhdGUuY2FydFtpZF0gPSAoc3RhdGUuY2FydFtpZF0gfHwgMCkgKyAxOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBkZWMoaWQpIHsgc3RhdGUuY2FydFtpZF0gPSBNYXRoLm1heCgwLCAoc3RhdGUuY2FydFtpZF0gfHwgMCkgLSAxKTsgaWYgKCFzdGF0ZS5jYXJ0W2lkXSkgZGVsZXRlIHN0YXRlLmNhcnRbaWRdOyByZW5kZXIoKTsgfQpmdW5jdGlvbiBvblNlYXJjaCh2KSB7IHN0YXRlLnF1ZXJ5ID0gdjsgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gdmlld0J5VGFiKCk7IGNvbnN0IGkgPSAkKCdxJyk7IGlmIChpKSB7IGkuZm9jdXMoKTsgaS5zZXRTZWxlY3Rpb25SYW5nZSh2Lmxlbmd0aCwgdi5sZW5ndGgpOyB9IH0KYXN5bmMgZnVuY3Rpb24gdG9nZ2xlU3ViKGlkKSB7IHN0YXRlLnN1YnNbaWRdID0gIXN0YXRlLnN1YnNbaWRdOyBpZiAoc3RhdGUudGFiID09PSAnYWNjb3VudCcpIHJlbmRlcigpOyBlbHNlIGlmIChzdGF0ZS5zY3JlZW4gPT09ICdjb21wYXJlJykgYXdhaXQgcmVmcmVzaENvbXBhcmUoKTsgZWxzZSByZW5kZXIoKTsgfQpmdW5jdGlvbiBwaWNrT2ZmZXIoaWQpIHsgc2hvd0hhbmRvZmYoaWQpOyB9CmFzeW5jIGZ1bmN0aW9uIHRvZ2dsZUZhdihpZCkgeyB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL3Byb2ZpbGUvZmF2b3JpdGVzJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdG9yZUlkOiBpZCB9KSB9KTsgc3RhdGUudXNlci5mYXZvcml0ZXMgPSByLmZhdm9yaXRlczsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfSB9CmFzeW5jIGZ1bmN0aW9uIHNhdmVBZGRyKCkgeyBjb25zdCBhZGRyZXNzID0gdmFsKCdwQWRkcicpOyBpZiAoIWFkZHJlc3MpIHJldHVybjsgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9wcm9maWxlJywgeyBtZXRob2Q6ICdQVVQnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFkZHJlc3MgfSkgfSk7IHN0YXRlLnVzZXIgPSB7IC4uLnN0YXRlLnVzZXIsIC4uLnIudXNlciB9OyByZW5kZXIoKTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gcmVmcmVzaExpdmUoKSB7IGNvbnN0IGIgPSAkKCdyZWZyZXNoQnRuJyk7IGlmIChiKSB7IGIuZGlzYWJsZWQgPSB0cnVlOyBiLnRleHRDb250ZW50ID0gJ+KPsyDYrNin2LHZiiDYp9mE2LPYrdio4oCmJzsgfSB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL3JlZnJlc2gtbGl2ZScsIHsgbWV0aG9kOiAnUE9TVCcgfSk7IHN0YXRlLmNmZyA9IGF3YWl0IGFwaSgnL2FwaS9jb25maWcnKTsgc3RhdGUuc3RvcmVzID0gYXdhaXQgYXBpKCcvYXBpL3N0b3JlcycpOyBhbGVydChg4pyFINiq2YUg2KrYrdiv2YrYqyAke3IucHJpY2VzfSDYs9i52LFgKTsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoJ+KdjCAnICsgZS5tZXNzYWdlICsgJ1xu2KvYqNmR2KogUHVwcGV0ZWVyOiBucG0gaSBwdXBwZXRlZXInKTsgaWYgKGIpIHsgYi5kaXNhYmxlZCA9IGZhbHNlOyBiLnRleHRDb250ZW50ID0gJ/CflIQg2KrYrdiv2YrYqyDYp9mE2KPYs9i52KfYsSDYp9mE2K3ZitipJzsgfSB9IH0KYXN5bmMgZnVuY3Rpb24gb3BlbkFkbWluKCkgeyBzdGF0ZS50YWIgPSAnYWNjb3VudCc7IHN0YXRlLnNjcmVlbiA9ICdhZG1pbic7IHN0YXRlLmFkbWluLnVzZXJzID0gbnVsbDsgcmVuZGVyKCk7IHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vdXNlcnMnKTsgc3RhdGUuYWRtaW4udXNlcnMgPSByLnVzZXJzOyByZW5kZXIoKTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KYXN5bmMgZnVuY3Rpb24gZGVsVXNlcihpZCkgeyBpZiAoIWNvbmZpcm0oJ9it2LDZgSDZh9iw2Kcg2KfZhNmF2LPYqtiu2K/ZhdifJykpIHJldHVybjsgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2FkbWluL3VzZXJzLycgKyBpZCwgeyBtZXRob2Q6ICdERUxFVEUnIH0pOyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2FkbWluL3VzZXJzJyk7IHN0YXRlLmFkbWluLnVzZXJzID0gci51c2VyczsgcmVuZGVyKCk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfSB9CgpPYmplY3QuYXNzaWduKHdpbmRvdywgeyBhdXRoVmlldywgZG9SZWdpc3RlciwgZG9WZXJpZnksIGRvUmVzZW5kLCBkb0xvZ2luLCBkb0ZvcmdvdCwgZG9SZXNldCwgZG9Mb2dvdXQsIHNldFRhYiwgc2V0TW9kZSwgZ29Ib21lLCBvcGVuU3RvcmUsIGdvQ29tcGFyZSwgaW5jLCBkZWMsIG9uU2VhcmNoLCB0b2dnbGVTdWIsIHBpY2tPZmZlciwgY2xvc2VNb2RhbCwgdG9nZ2xlRmF2LCBzYXZlQWRkciwgcmVmcmVzaExpdmUsIG9wZW5BZG1pbiwgZGVsVXNlciB9KTsKaW5pdCgpOwo=" } };
var LIVE_SEED = { "source": "\u0647\u0646\u0642\u0631\u0633\u062A\u064A\u0634\u0646", "sourceUrl": "https://hungerstation.com/sa-ar/restaurant/\u0627\u0644\u0631\u064A\u0627\u0636/\u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629/3792", "location": "\u062D\u064A \u0627\u0644\u0645\u0648\u0646\u0633\u064A\u0629\u060C \u0627\u0644\u0631\u064A\u0627\u0636", "fetchedAtISO": "2026-06-14T01:42:00+03:00", "fetchedAt": "2026-06-14 \xB7 01:42 (\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0631\u064A\u0627\u0636)", "stores": { "mcd": { "app": "hungerstation", "etaText": "15\u201330 \u062F", "deliveryFee": null, "items": { "bigtasty": 34, "bigmac": 27, "mcchicken": 29, "nuggets": 28, "fries": 9, "cola": 7, "mcflurry": 12 } } } };

// deploy-entry.js
var DATA_DIR2 = process.env.DATA_DIR || path4.join(process.cwd(), "data");
try {
  fs4.mkdirSync(DATA_DIR2, { recursive: true });
  const f = path4.join(DATA_DIR2, "live-data.json");
  if (!fs4.existsSync(f)) fs4.writeFileSync(f, JSON.stringify(LIVE_SEED, null, 2));
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
app.listen(PORT, () => console.log(`\u{1F354} super-app \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 ${PORT}`));
