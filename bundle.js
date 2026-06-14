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
var ASSETS = { "index.html": { "type": "text/html; charset=utf-8", "b64": "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImFyIiBkaXI9InJ0bCI+CjxoZWFkPgo8bWV0YSBjaGFyc2V0PSJVVEYtOCIgLz4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiIC8+Cjx0aXRsZT7Ys9mI2KjYsSDYotioIOKAlCDZhdmG2LXYqSDZhdmC2KfYsdmG2Kkg2KfZhNiq2YjYtdmK2YQ8L3RpdGxlPgo8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iIC8+CjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4gLz4KPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1DYWlybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0IiAvPgo8bGluayByZWw9InN0eWxlc2hlZXQiIGhyZWY9InN0eWxlcy5jc3MiIC8+CjxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iYXV0aC5jc3MiIC8+CjwvaGVhZD4KPGJvZHk+CjxkaXYgY2xhc3M9InBob25lIj4KICA8ZGl2IGNsYXNzPSJub3RjaCI+PC9kaXY+CiAgPGRpdiBjbGFzcz0ic3RhdHVzYmFyIj48c3Bhbj45OjQxPC9zcGFuPjxzcGFuPtiz2YjYqNixINii2Kgg4pqhPC9zcGFuPjxzcGFuPjEwMCUg8J+Uizwvc3Bhbj48L2Rpdj4KICA8ZGl2IGNsYXNzPSJzY3JlZW4iIGlkPSJzY3JlZW4iPjxkaXYgY2xhc3M9ImxvYWRpbmciPjxzcGFuIGNsYXNzPSJzcGluIj48L3NwYW4+INis2KfYsdmKINin2YTYqtit2YXZitmE4oCmPC9kaXY+PC9kaXY+CiAgPGRpdiBjbGFzcz0ibmF2IiBpZD0ibmF2Ij48L2Rpdj4KPC9kaXY+CjxzY3JpcHQgc3JjPSJhcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K" }, "styles.css": { "type": "text/css; charset=utf-8", "b64": "OnJvb3R7CiAgLS1icmFuZDE6IzZEMjhEOTsgLS1icmFuZDI6IzRGNDZFNTsKICAtLWJyYW5kLWdyYWQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjNkQyOEQ5IDAlLCM0RjQ2RTUgMTAwJSk7CiAgLS1nb2xkOiNGNTlFMEI7IC0tZ3JlZW46IzE2QTM0QTsgLS1ncmVlbi1zb2Z0OiNEQ0ZDRTc7CiAgLS1pbms6IzBGMTcyQTsgLS1tdXRlZDojNjQ3NDhCOyAtLWxpbmU6I0UyRThGMDsgLS1iZzojRjFGNUY5OyAtLWNhcmQ6I0ZGRkZGRjsKICAtLXJhZGl1czoyMHB4OyAtLXNoYWRvdzowIDEwcHggMzBweCByZ2JhKDE1LDIzLDQyLC4xMCk7Cn0KKntib3gtc2l6aW5nOmJvcmRlci1ib3g7bWFyZ2luOjA7cGFkZGluZzowOy13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjp0cmFuc3BhcmVudDt9CmJvZHl7CiAgZm9udC1mYW1pbHk6J0NhaXJvJyxzeXN0ZW0tdWksJ1NlZ29lIFVJJyxzYW5zLXNlcmlmOwogIGJhY2tncm91bmQ6I2VlZjJmNzsKICBjb2xvcjp2YXIoLS1pbmspO21pbi1oZWlnaHQ6MTAwdmg7Cn0KLyog2KrYrti32YrYtyDZiNmK2Kgg2YXYqtis2KfZiNioOiDYudmF2YjYryDZhdix2YPYstmKINmK2YXZhNijINin2YTYp9ix2KrZgdin2Lkg4oCUINio2K/ZiNmGINil2LfYp9ixINis2YjYp9mEICovCi5waG9uZXt3aWR0aDoxMDAlO21heC13aWR0aDo0ODBweDttaW4taGVpZ2h0OjEwMHZoO2hlaWdodDoxMDB2aDttYXJnaW46MCBhdXRvO2JhY2tncm91bmQ6dmFyKC0tYmcpOwogIHBvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmhpZGRlbjtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2JveC1zaGFkb3c6MCAwIDQwcHggcmdiYSgxNSwyMyw0MiwuMDYpO30KLm5vdGNoe2Rpc3BsYXk6bm9uZTt9Ci5zdGF0dXNiYXJ7ZGlzcGxheTpub25lO30KLnNjcmVlbntmbGV4OjE7b3ZlcmZsb3cteTphdXRvO292ZXJmbG93LXg6aGlkZGVuO3Njcm9sbGJhci13aWR0aDpub25lO30KLnNjcmVlbjo6LXdlYmtpdC1zY3JvbGxiYXJ7ZGlzcGxheTpub25lO30KLnRvcGJhcntiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7cGFkZGluZzo2cHggMThweCAyMnB4O2JvcmRlci1yYWRpdXM6MCAwIDI2cHggMjZweDtwb3NpdGlvbjpyZWxhdGl2ZTt9Ci5sb2N7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4O2ZvbnQtc2l6ZToxM3B4O29wYWNpdHk6Ljk1O30KLmxvYyAucGlue3dpZHRoOjI2cHg7aGVpZ2h0OjI2cHg7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4xOCk7Ym9yZGVyLXJhZGl1czo1MCU7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MTRweDt9Ci5sb2MgYntmb250LXdlaWdodDo4MDA7fQoubG9jIC5jaGV2e21hcmdpbi1pbmxpbmUtc3RhcnQ6YXV0bztiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjE4KTtib3JkZXItcmFkaXVzOjMwcHg7Zm9udC1zaXplOjExcHg7cGFkZGluZzo0cHggMTBweDtmb250LXdlaWdodDo3MDA7fQouaGVsbG97bWFyZ2luLXRvcDoxNHB4O2ZvbnQtc2l6ZToyMXB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5oZWxsbyBzcGFue2NvbG9yOiNmZGU2OGE7fQouc2VhcmNoe21hcmdpbi10b3A6MTRweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxNnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHg7cGFkZGluZzoxM3B4IDE1cHg7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo2MDA7fQouc2VhcmNoIGlucHV0e2JvcmRlcjowO291dGxpbmU6MDtmbGV4OjE7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo2MDA7Y29sb3I6dmFyKC0taW5rKTtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O30KLmJyYW5kcm93e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47fQoubG9nb3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxOHB4O2xldHRlci1zcGFjaW5nOi0uM3B4O30KLmxvZ28gLm1hcmt7d2lkdGg6MzBweDtoZWlnaHQ6MzBweDtib3JkZXItcmFkaXVzOjlweDtiYWNrZ3JvdW5kOiNmZmY7Y29sb3I6dmFyKC0tYnJhbmQxKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtd2VpZ2h0OjkwMDtmb250LXNpemU6MTZweDtib3gtc2hhZG93OjAgNHB4IDEwcHggcmdiYSgwLDAsMCwuMTUpO30KLnBhZHtwYWRkaW5nOjE4cHg7fQouc2VjdGlvbi1oe2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47bWFyZ2luOjE4cHggMnB4IDEycHg7fQouc2VjdGlvbi1oIGgze2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5zZWN0aW9uLWggYXtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1icmFuZDIpO2ZvbnQtd2VpZ2h0OjcwMDtjdXJzb3I6cG9pbnRlcjt9Ci5jYXRze2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyIDFmcjtnYXA6MTJweDt9Ci5jYXR7cG9zaXRpb246cmVsYXRpdmU7Ym9yZGVyLXJhZGl1czp2YXIoLS1yYWRpdXMpO3BhZGRpbmc6MTZweDtjb2xvcjojZmZmO292ZXJmbG93OmhpZGRlbjttaW4taGVpZ2h0OjEwNHB4O2N1cnNvcjpwb2ludGVyO2JveC1zaGFkb3c6dmFyKC0tc2hhZG93KTt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTVzO30KLmNhdDphY3RpdmV7dHJhbnNmb3JtOnNjYWxlKC45Nyk7fQouY2F0LmZvb2R7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmYjcxODUsI2UxMWQ0OCk7fQouY2F0Lmdyb2Nlcnl7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCMzNGQzOTksIzA1OTY2OSk7fQouY2F0IGg0e2ZvbnQtc2l6ZToxN3B4O2ZvbnQtd2VpZ2h0OjgwMDt9Ci5jYXQgcHtmb250LXNpemU6MTEuNXB4O29wYWNpdHk6LjkyO21hcmdpbi10b3A6M3B4O2xpbmUtaGVpZ2h0OjEuNTt9Ci5jYXQgLmVtb2ppe3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MTBweDtib3R0b206NnB4O2ZvbnQtc2l6ZTo0MnB4O29wYWNpdHk6Ljk1O30KLnBpbGxze2Rpc3BsYXk6ZmxleDtnYXA6OHB4O292ZXJmbG93LXg6YXV0bztwYWRkaW5nLWJvdHRvbTo0cHg7c2Nyb2xsYmFyLXdpZHRoOm5vbmU7fQoucGlsbHM6Oi13ZWJraXQtc2Nyb2xsYmFye2Rpc3BsYXk6bm9uZTt9Ci5waWxse3doaXRlLXNwYWNlOm5vd3JhcDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjMwcHg7cGFkZGluZzo4cHggMTRweDtmb250LXNpemU6MTIuNXB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1tdXRlZCk7Y3Vyc29yOnBvaW50ZXI7fQoucGlsbC5hY3RpdmV7YmFja2dyb3VuZDp2YXIoLS1icmFuZDEpO2NvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOnZhcigtLWJyYW5kMSk7fQoucGxhY2V7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cyk7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO3BhZGRpbmc6MTNweDtkaXNwbGF5OmZsZXg7Z2FwOjEzcHg7YWxpZ24taXRlbXM6Y2VudGVyO21hcmdpbi1ib3R0b206MTJweDtjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTVzO30KLnBsYWNlOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoLjk4NSk7fQoucGxhY2UgLmF2YXt3aWR0aDo1NnB4O2hlaWdodDo1NnB4O2JvcmRlci1yYWRpdXM6MTVweDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtd2VpZ2h0OjkwMDtjb2xvcjojZmZmO2ZvbnQtc2l6ZToxM3B4O3RleHQtYWxpZ246Y2VudGVyO2xpbmUtaGVpZ2h0OjEuMTtmbGV4LXNocmluazowO30KLnBsYWNlIC5pbmZve2ZsZXg6MTttaW4td2lkdGg6MDt9Ci5wbGFjZSAuaW5mbyBoNHtmb250LXNpemU6MTVweDtmb250LXdlaWdodDo4MDA7fQoucGxhY2UgLmluZm8gcHtmb250LXNpemU6MTEuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjNweDt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7fQoucGxhY2UgLm1ldGF7ZGlzcGxheTpmbGV4O2dhcDoxMHB4O21hcmdpbi10b3A6NnB4O2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXdlaWdodDo3MDA7YWxpZ24taXRlbXM6Y2VudGVyO30KLnBsYWNlIC5tZXRhIC5zdGFye2NvbG9yOnZhcigtLWdvbGQpO30KLmJhZGdlLW57YmFja2dyb3VuZDp2YXIoLS1ncmVlbi1zb2Z0KTtjb2xvcjp2YXIoLS1ncmVlbik7Zm9udC1zaXplOjEwcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6M3B4IDhweDtib3JkZXItcmFkaXVzOjIwcHg7fQouYXBwcy1taW5pe2Rpc3BsYXk6ZmxleDt9Ci5hcHBzLW1pbmkgaXt3aWR0aDoxOHB4O2hlaWdodDoxOHB4O2JvcmRlci1yYWRpdXM6NTAlO2JvcmRlcjoycHggc29saWQgI2ZmZjttYXJnaW4taW5saW5lLXN0YXJ0Oi02cHg7ZGlzcGxheTppbmxpbmUtYmxvY2s7fQouc3RvcmUtaGVyb3twYWRkaW5nOjE4cHg7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjAgMCAyNnB4IDI2cHg7fQouc3RvcmUtaGVybyAuYmFja3tiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjIpO3dpZHRoOjM0cHg7aGVpZ2h0OjM0cHg7Ym9yZGVyLXJhZGl1czo1MCU7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MThweDtjdXJzb3I6cG9pbnRlcjtmb250LXdlaWdodDo4MDA7fQouc3RvcmUtaGVybyBoMntmb250LXNpemU6MjJweDtmb250LXdlaWdodDo5MDA7bWFyZ2luLXRvcDoxNHB4O30KLnN0b3JlLWhlcm8gLnRhZ3N7Zm9udC1zaXplOjEycHg7b3BhY2l0eTouOTI7bWFyZ2luLXRvcDo0cHg7fQouc3RvcmUtaGVybyAuY2hpcHN7ZGlzcGxheTpmbGV4O2dhcDo4cHg7bWFyZ2luLXRvcDoxMnB4O2ZsZXgtd3JhcDp3cmFwO30KLmNoaXB7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4xOCk7Ym9yZGVyLXJhZGl1czoyMHB4O3BhZGRpbmc6NXB4IDExcHg7Zm9udC1zaXplOjExLjVweDtmb250LXdlaWdodDo3MDA7fQouYXZhaWxiYXJ7YmFja2dyb3VuZDojZmZmO21hcmdpbjoxNHB4IDE4cHggMDtib3JkZXItcmFkaXVzOjE0cHg7cGFkZGluZzoxMXB4IDEzcHg7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7fQoubWVudS1jYXR7Zm9udC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6ODAwO2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW46MThweCAycHggMTBweDt9Ci5pdGVte2JhY2tncm91bmQ6dmFyKC0tY2FyZCk7Ym9yZGVyLXJhZGl1czoxNnB4O2JveC1zaGFkb3c6dmFyKC0tc2hhZG93KTtwYWRkaW5nOjEzcHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDttYXJnaW4tYm90dG9tOjExcHg7fQouaXRlbSAucGh7d2lkdGg6NTRweDtoZWlnaHQ6NTRweDtib3JkZXItcmFkaXVzOjEzcHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmOGZhZmMsI2VlZjJmNyk7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MjZweDtmbGV4LXNocmluazowO30KLml0ZW0gLmR7ZmxleDoxO21pbi13aWR0aDowO30KLml0ZW0gLmQgaDV7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6ODAwO30KLml0ZW0gLmQgcHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7fQouaXRlbSAuZCAucHJ7Zm9udC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6ODAwO2NvbG9yOnZhcigtLWJyYW5kMik7bWFyZ2luLXRvcDo1cHg7fQouc3RlcHBlcntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O30KLnN0ZXBwZXIgYnV0dG9ue3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7Ym9yZGVyLXJhZGl1czo5cHg7Ym9yZGVyOjA7YmFja2dyb3VuZDp2YXIoLS1icmFuZDEpO2NvbG9yOiNmZmY7Zm9udC1zaXplOjE4cHg7Zm9udC13ZWlnaHQ6ODAwO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7bGluZS1oZWlnaHQ6MTt9Ci5zdGVwcGVyIGJ1dHRvbi5taW51c3tiYWNrZ3JvdW5kOiNmZmY7Y29sb3I6dmFyKC0tYnJhbmQxKTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7fQouc3RlcHBlciAucXttaW4td2lkdGg6MThweDt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjE0cHg7fQouYWRke2JvcmRlcjowO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQxKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjhweCAxNnB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxM3B4O2N1cnNvcjpwb2ludGVyO30KLmNhcnRiYXJ7cG9zaXRpb246YWJzb2x1dGU7bGVmdDoxNHB4O3JpZ2h0OjE0cHg7Ym90dG9tOjE0cHg7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MThweDtwYWRkaW5nOjE0cHggMThweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2JveC1zaGFkb3c6MCAxNHB4IDMwcHggcmdiYSg3OSw3MCwyMjksLjQ1KTtjdXJzb3I6cG9pbnRlcjt6LWluZGV4OjQwO2FuaW1hdGlvbjpwb3AgLjI1cyBlYXNlO30KQGtleWZyYW1lcyBwb3B7ZnJvbXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgyMHB4KTtvcGFjaXR5OjA7fXRve3RyYW5zZm9ybTpub25lO29wYWNpdHk6MTt9fQouY2FydGJhciAuY3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDt9Ci5jYXJ0YmFyIC5xYmFkZ2V7YmFja2dyb3VuZDojZmZmO2NvbG9yOnZhcigtLWJyYW5kMSk7Ym9yZGVyLXJhZGl1czo5cHg7bWluLXdpZHRoOjI2cHg7aGVpZ2h0OjI2cHg7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo5MDA7fQouY2FydGJhciAuZ297Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxNHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDt9Ci5jbXAtaGVhZHtiYWNrZ3JvdW5kOnZhcigtLWJyYW5kLWdyYWQpO2NvbG9yOiNmZmY7cGFkZGluZzoxNHB4IDE4cHggMjBweDtib3JkZXItcmFkaXVzOjAgMCAyNnB4IDI2cHg7fQouY21wLWhlYWQgLmJhY2t7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTt3aWR0aDozNHB4O2hlaWdodDozNHB4O2JvcmRlci1yYWRpdXM6NTAlO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC1zaXplOjE4cHg7Y3Vyc29yOnBvaW50ZXI7Zm9udC13ZWlnaHQ6ODAwO30KLmNtcC1oZWFkIGgye2ZvbnQtc2l6ZToxOXB4O2ZvbnQtd2VpZ2h0OjkwMDttYXJnaW4tdG9wOjEycHg7fQouY21wLWhlYWQgcHtmb250LXNpemU6MTJweDtvcGFjaXR5Oi45MjttYXJnaW4tdG9wOjNweDt9Ci5zYXZlLWJhbm5lcntiYWNrZ3JvdW5kOiNmZmY7bWFyZ2luOi0xMnB4IDE2cHggMDtwb3NpdGlvbjpyZWxhdGl2ZTt6LWluZGV4OjU7Ym9yZGVyLXJhZGl1czoxNnB4O2JveC1zaGFkb3c6dmFyKC0tc2hhZG93KTtwYWRkaW5nOjE0cHggMTZweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O30KLnNhdmUtYmFubmVyIC5pY3t3aWR0aDo0MnB4O2hlaWdodDo0MnB4O2JvcmRlci1yYWRpdXM6MTJweDtiYWNrZ3JvdW5kOnZhcigtLWdyZWVuLXNvZnQpO2NvbG9yOnZhcigtLWdyZWVuKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZToyMnB4O2ZsZXgtc2hyaW5rOjA7fQouc2F2ZS1iYW5uZXIgaDR7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6ODAwO30KLnNhdmUtYmFubmVyIGg0IGJ7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLnNhdmUtYmFubmVyIHB7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi10b3A6MnB4O30KLnN1YnN7bWFyZ2luOjE2cHggMTZweCAwO30KLnN1YnMgLmxibHtmb250LXNpemU6MTJweDtmb250LXdlaWdodDo4MDA7Y29sb3I6dmFyKC0tbXV0ZWQpO21hcmdpbi1ib3R0b206OHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDt9Ci5zdWItY2hpcHN7ZGlzcGxheTpmbGV4O2dhcDo4cHg7ZmxleC13cmFwOndyYXA7fQouc3ViLWNoaXB7Ym9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjMwcHg7cGFkZGluZzo3cHggMTNweDtmb250LXNpemU6MTEuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtjb2xvcjp2YXIoLS1tdXRlZCk7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O3RyYW5zaXRpb246YWxsIC4xNXM7fQouc3ViLWNoaXAub257YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Ym9yZGVyLWNvbG9yOnZhcigtLWdyZWVuKTtjb2xvcjojZmZmO30KLnN1Yi1jaGlwIC50Z3t3aWR0aDo4cHg7aGVpZ2h0OjhweDtib3JkZXItcmFkaXVzOjUwJTtiYWNrZ3JvdW5kOmN1cnJlbnRDb2xvcjtvcGFjaXR5Oi42O30KLmNtcC1saXN0e3BhZGRpbmc6MTZweDt9Ci5vZmZlcntiYWNrZ3JvdW5kOnZhcigtLWNhcmQpO2JvcmRlci1yYWRpdXM6MThweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxNXB4O21hcmdpbi1ib3R0b206MTNweDtib3JkZXI6MnB4IHNvbGlkIHRyYW5zcGFyZW50O3Bvc2l0aW9uOnJlbGF0aXZlO2N1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246dHJhbnNmb3JtIC4xNXM7fQoub2ZmZXI6YWN0aXZle3RyYW5zZm9ybTpzY2FsZSguOTkpO30KLm9mZmVyLmJlc3R7Ym9yZGVyLWNvbG9yOnZhcigtLWdyZWVuKTtib3gtc2hhZG93OjAgMTRweCAzMHB4IHJnYmEoMjIsMTYzLDc0LC4xOCk7fQoub2ZmZXIgLnJpYmJvbntwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTExcHg7aW5zZXQtaW5saW5lLXN0YXJ0OjE1cHg7YmFja2dyb3VuZDp2YXIoLS1ncmVlbik7Y29sb3I6I2ZmZjtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjRweCAxMXB4O2JvcmRlci1yYWRpdXM6MjBweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo1cHg7fQoub2ZmZXItdG9we2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjExcHg7fQoub2ZmZXIgLmFsb2dve3dpZHRoOjQ0cHg7aGVpZ2h0OjQ0cHg7Ym9yZGVyLXJhZGl1czoxMnB4O2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxMXB4O2NvbG9yOiNmZmY7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS4wNTtmbGV4LXNocmluazowO30KLm9mZmVyIC5hbm17ZmxleDoxO21pbi13aWR0aDowO30KLm9mZmVyIC5hbm0gaDR7Zm9udC1zaXplOjE1cHg7Zm9udC13ZWlnaHQ6ODAwO30KLm9mZmVyIC5hbm0gLnN1Yntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7ZGlzcGxheTpmbGV4O2dhcDo5cHg7ZmxleC13cmFwOndyYXA7fQoub2ZmZXIgLmFubSAuc3ViIC5zdGFye2NvbG9yOnZhcigtLWdvbGQpO2ZvbnQtd2VpZ2h0OjgwMDt9Ci5vZmZlciAudG90e3RleHQtYWxpZ246bGVmdDtmbGV4LXNocmluazowO30KLm9mZmVyIC50b3QgLmJpZ3tmb250LXNpemU6MjBweDtmb250LXdlaWdodDo5MDA7Y29sb3I6dmFyKC0taW5rKTtsaW5lLWhlaWdodDoxO30KLm9mZmVyIC50b3QgLmN1cntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO30KLm9mZmVyLmJlc3QgLnRvdCAuYmlne2NvbG9yOnZhcigtLWdyZWVuKTt9Ci5icmVha2Rvd257bWFyZ2luLXRvcDoxMnB4O2JvcmRlci10b3A6MXB4IGRhc2hlZCB2YXIoLS1saW5lKTtwYWRkaW5nLXRvcDoxMXB4O2Rpc3BsYXk6Z3JpZDtnYXA6NnB4O30KLmJyb3d7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZToxMnB4O30KLmJyb3cgc3Bhbntjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NjAwO30KLmJyb3cgYntmb250LXdlaWdodDo3MDA7fQouYnJvdy5kaXNjIGJ7Y29sb3I6dmFyKC0tZ3JlZW4pO30KLnByb21vLXRhZ3tkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NXB4O2JhY2tncm91bmQ6I0ZFRjNDNztjb2xvcjojOTI0MDBFO2ZvbnQtc2l6ZToxMC41cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6NHB4IDlweDtib3JkZXItcmFkaXVzOjhweDttYXJnaW4tdG9wOjlweDt9Ci5waWNrYnRue21hcmdpbi10b3A6MTJweDt3aWR0aDoxMDAlO2JvcmRlcjowO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjEycHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjEzLjVweDtjdXJzb3I6cG9pbnRlcjtiYWNrZ3JvdW5kOiNFRUYyRkY7Y29sb3I6dmFyKC0tYnJhbmQyKTt9Ci5vZmZlci5iZXN0IC5waWNrYnRue2JhY2tncm91bmQ6dmFyKC0tZ3JlZW4pO2NvbG9yOiNmZmY7fQouZGlzY2xhaW1lcntmb250LXNpemU6MTAuNXB4O2NvbG9yOnZhcigtLW11dGVkKTt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDoxLjc7cGFkZGluZzo0cHggMjRweCAyNHB4O30KLmRpc2NsYWltZXIgYntjb2xvcjojOTRhM2I4O30KLnByb21vLWNhcmR7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXItcmFkaXVzOjE2cHg7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO3BhZGRpbmc6MTRweDttYXJnaW4tYm90dG9tOjEycHg7ZGlzcGxheTpmbGV4O2dhcDoxMnB4O2FsaWduLWl0ZW1zOmNlbnRlcjt9Ci5wcm9tby1jYXJkIC5wbHt3aWR0aDo0NnB4O2hlaWdodDo0NnB4O2JvcmRlci1yYWRpdXM6MTJweDtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2NvbG9yOiNmZmY7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZToxMHB4O3RleHQtYWxpZ246Y2VudGVyO2xpbmUtaGVpZ2h0OjEuMDU7ZmxleC1zaHJpbms6MDt9Ci5wcm9tby1jYXJkIC5wdHtmbGV4OjE7fQoucHJvbW8tY2FyZCAucHQgaDV7Zm9udC1zaXplOjEzLjVweDtmb250LXdlaWdodDo4MDA7fQoucHJvbW8tY2FyZCAucHQgcHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7fQoucHJvbW8tY2FyZCAuY29kZXtib3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWJyYW5kMik7Y29sb3I6dmFyKC0tYnJhbmQyKTtmb250LXNpemU6MTFweDtmb250LXdlaWdodDo4MDA7cGFkZGluZzo2cHggMTBweDtib3JkZXItcmFkaXVzOjlweDtiYWNrZ3JvdW5kOiNFRUYyRkY7fQouYWNjLWNhcmR7YmFja2dyb3VuZDp2YXIoLS1jYXJkKTtib3JkZXItcmFkaXVzOjE2cHg7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO3BhZGRpbmc6MTZweDttYXJnaW4tYm90dG9tOjE0cHg7fQouYWNjLWNhcmQgaDR7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6ODAwO21hcmdpbi1ib3R0b206NHB4O30KLmFjYy1jYXJkIHB7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6MS43O30KLmFjYy1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjEzcHggMDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB2YXIoLS1saW5lKTt9Ci5hY2Mtcm93Omxhc3QtY2hpbGR7Ym9yZGVyLWJvdHRvbTowO30KLmFjYy1yb3cgLmx7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTFweDtmb250LXNpemU6MTMuNXB4O2ZvbnQtd2VpZ2h0OjcwMDt9Ci5hY2Mtcm93IC5pY3t3aWR0aDozNHB4O2hlaWdodDozNHB4O2JvcmRlci1yYWRpdXM6MTBweDtiYWNrZ3JvdW5kOiNFRUYyRkY7ZGlzcGxheTpncmlkO3BsYWNlLWl0ZW1zOmNlbnRlcjtmb250LXNpemU6MTZweDt9Ci5zd2l0Y2h7d2lkdGg6NDJweDtoZWlnaHQ6MjVweDtib3JkZXItcmFkaXVzOjMwcHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKTtwb3NpdGlvbjpyZWxhdGl2ZTtjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOi4ycztmbGV4LXNocmluazowO30KLnN3aXRjaC5vbntiYWNrZ3JvdW5kOnZhcigtLWdyZWVuKTt9Ci5zd2l0Y2ggaXtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6Mi41cHg7aW5zZXQtaW5saW5lLXN0YXJ0OjIuNXB4O3dpZHRoOjIwcHg7aGVpZ2h0OjIwcHg7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDojZmZmO3RyYW5zaXRpb246LjJzO2JveC1zaGFkb3c6MCAxcHggM3B4IHJnYmEoMCwwLDAsLjIpO30KLnN3aXRjaC5vbiBpe2luc2V0LWlubGluZS1zdGFydDoxOS41cHg7fQouYnRuLWxpbmV7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tYnJhbmQyKTtjb2xvcjp2YXIoLS1icmFuZDIpO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxMnB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxM3B4O2N1cnNvcjpwb2ludGVyO21hcmdpbi10b3A6MTBweDt9Ci5idG4tbGluZTpkaXNhYmxlZHtvcGFjaXR5Oi42O2N1cnNvcjpkZWZhdWx0O30KLm5hdntoZWlnaHQ6NjRweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXRvcDoxcHggc29saWQgdmFyKC0tbGluZSk7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYXJvdW5kO2ZsZXgtc2hyaW5rOjA7fQoubmF2IGJ1dHRvbntib3JkZXI6MDtiYWNrZ3JvdW5kOm5vbmU7Zm9udC1mYW1pbHk6aW5oZXJpdDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6M3B4O2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTAuNXB4O2ZvbnQtd2VpZ2h0OjcwMDtjdXJzb3I6cG9pbnRlcjt9Ci5uYXYgYnV0dG9uIC5uaXtmb250LXNpemU6MjBweDt9Ci5uYXYgYnV0dG9uLmFjdGl2ZXtjb2xvcjp2YXIoLS1icmFuZDEpO30KLm1vZGFsLWJne3Bvc2l0aW9uOmZpeGVkO2luc2V0OjA7YmFja2dyb3VuZDpyZ2JhKDE1LDIzLDQyLC41KTt6LWluZGV4OjEwMDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7anVzdGlmeS1jb250ZW50OmNlbnRlcjthbmltYXRpb246ZmFkZSAuMnM7fQpAa2V5ZnJhbWVzIGZhZGV7ZnJvbXtvcGFjaXR5OjA7fXRve29wYWNpdHk6MTt9fQouc2hlZXR7YmFja2dyb3VuZDojZmZmO3dpZHRoOjEwMCU7bWF4LXdpZHRoOjQ4MHB4O2JvcmRlci1yYWRpdXM6MjZweCAyNnB4IDAgMDtwYWRkaW5nOjIycHggMjBweCAyNnB4O2FuaW1hdGlvbjp1cCAuMjhzIGVhc2U7fQpAa2V5ZnJhbWVzIHVwe2Zyb217dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMTAwJSk7fXRve3RyYW5zZm9ybTpub25lO319Ci5zaGVldCAuZ3JpcHt3aWR0aDo0NHB4O2hlaWdodDo1cHg7YmFja2dyb3VuZDp2YXIoLS1saW5lKTtib3JkZXItcmFkaXVzOjEwcHg7bWFyZ2luOjAgYXV0byAxOHB4O30KLnNoZWV0IC5oe2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEycHg7fQouc2hlZXQgLmggLmFsb2dve3dpZHRoOjUwcHg7aGVpZ2h0OjUwcHg7Ym9yZGVyLXJhZGl1czoxNHB4O2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Y29sb3I6I2ZmZjtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjEycHg7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MS4wNTt9Ci5zaGVldCAuaCBoM3tmb250LXNpemU6MTdweDtmb250LXdlaWdodDo5MDA7fQouc2hlZXQgLmggcHtmb250LXNpemU6MTJweDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLXRvcDoycHg7fQouc2hlZXQgLnN1bXtiYWNrZ3JvdW5kOnZhcigtLWJnKTtib3JkZXItcmFkaXVzOjE0cHg7cGFkZGluZzoxNHB4O21hcmdpbjoxNnB4IDA7ZGlzcGxheTpncmlkO2dhcDo4cHg7fQouc2hlZXQgLnN1bSAucntkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC1zaXplOjEyLjVweDt9Ci5zaGVldCAuc3VtIC5yIHNwYW57Y29sb3I6dmFyKC0tbXV0ZWQpO30KLnNoZWV0IC5zdW0gLnIudHR7Ym9yZGVyLXRvcDoxcHggZGFzaGVkIHZhcigtLWxpbmUpO3BhZGRpbmctdG9wOjlweDttYXJnaW4tdG9wOjNweDtmb250LXdlaWdodDo5MDA7Zm9udC1zaXplOjE1cHg7fQouc2hlZXQgLm5vdGV7Zm9udC1zaXplOjExLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7YmFja2dyb3VuZDojRkVGM0M3O2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjExcHggMTNweDtsaW5lLWhlaWdodDoxLjc7fQouc2hlZXQgLm5vdGUgYntjb2xvcjojOTI0MDBFO30KLnNoZWV0IC5jdGF7bWFyZ2luLXRvcDoxNnB4O2Rpc3BsYXk6ZmxleDtnYXA6MTBweDt9Ci5zaGVldCAuY3RhIGJ1dHRvbntmbGV4OjE7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czoxM3B4O3BhZGRpbmc6MTRweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjt9Ci5zaGVldCAuY3RhIC5nb3tiYWNrZ3JvdW5kOnZhcigtLWdyZWVuKTtjb2xvcjojZmZmO30KLnNoZWV0IC5jdGEgLmNhbmNlbHtiYWNrZ3JvdW5kOnZhcigtLWJnKTtjb2xvcjp2YXIoLS1tdXRlZCk7ZmxleDowIDAgOTBweDt9Ci5lbXB0eXt0ZXh0LWFsaWduOmNlbnRlcjtjb2xvcjp2YXIoLS1tdXRlZCk7cGFkZGluZzo2MHB4IDMwcHg7fQouZW1wdHkgLmV7Zm9udC1zaXplOjU0cHg7fQouZW1wdHkgaDN7Zm9udC1zaXplOjE2cHg7bWFyZ2luLXRvcDoxMnB4O2NvbG9yOnZhcigtLWluayk7fQouZW1wdHkgcHtmb250LXNpemU6MTIuNXB4O21hcmdpbi10b3A6NnB4O2xpbmUtaGVpZ2h0OjEuODt9Ci5sb2FkaW5ne2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtoZWlnaHQ6MTAwJTtjb2xvcjp2YXIoLS1tdXRlZCk7Zm9udC13ZWlnaHQ6NzAwO2dhcDoxMHB4O30KLnNwaW57d2lkdGg6MjJweDtoZWlnaHQ6MjJweDtib3JkZXI6M3B4IHNvbGlkIHZhcigtLWxpbmUpO2JvcmRlci10b3AtY29sb3I6dmFyKC0tYnJhbmQxKTtib3JkZXItcmFkaXVzOjUwJTthbmltYXRpb246cm90IDFzIGxpbmVhciBpbmZpbml0ZTt9CkBrZXlmcmFtZXMgcm90e3Rve3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt9fQo=" }, "auth.css": { "type": "text/css; charset=utf-8", "b64": "Lyog2KPZhtmF2KfYtyDYtNin2LTYp9iqINin2YTZhdi12KfYr9mC2KkgKyDYp9mE2YXZhNmBINin2YTYtNiu2LXZiiArINin2YTYotiv2YXZhiAqLwouYXV0aC1oZXJve2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7Y29sb3I6I2ZmZjtwYWRkaW5nOjQ2cHggMjRweCAyOHB4O2JvcmRlci1yYWRpdXM6MCAwIDI4cHggMjhweDt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5hdXRoLWhlcm8gLm1re3dpZHRoOjYwcHg7aGVpZ2h0OjYwcHg7Ym9yZGVyLXJhZGl1czoxOHB4O2JhY2tncm91bmQ6I2ZmZjtjb2xvcjp2YXIoLS1icmFuZDEpO2Rpc3BsYXk6Z3JpZDtwbGFjZS1pdGVtczpjZW50ZXI7Zm9udC13ZWlnaHQ6OTAwO2ZvbnQtc2l6ZTozMHB4O21hcmdpbjowIGF1dG8gMTJweDtib3gtc2hhZG93OjAgOHB4IDIwcHggcmdiYSgwLDAsMCwuMTgpO30KLmF1dGgtaGVybyBoMXtmb250LXNpemU6MjRweDtmb250LXdlaWdodDo5MDA7fQouYXV0aC1oZXJvIHB7b3BhY2l0eTouOTI7Zm9udC1zaXplOjEyLjVweDttYXJnaW4tdG9wOjZweDt9Ci5hdXRoLWJvZHl7cGFkZGluZzoyNHB4O2ZsZXg6MTt9Ci5hdXRoLXRpdGxle2ZvbnQtc2l6ZToxOXB4O2ZvbnQtd2VpZ2h0OjgwMDttYXJnaW4tYm90dG9tOjRweDt9Ci5hdXRoLXN1Yntmb250LXNpemU6MTIuNXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tYm90dG9tOjE4cHg7bGluZS1oZWlnaHQ6MS43O30KLmZpZWxke21hcmdpbi1ib3R0b206MTNweDt9Ci5maWVsZCBsYWJlbHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjp2YXIoLS1tdXRlZCk7bWFyZ2luLWJvdHRvbTo2cHg7fQouZmllbGQgaW5wdXR7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZSk7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTNweCAxNHB4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NjAwO291dGxpbmU6bm9uZTtiYWNrZ3JvdW5kOiNmZmY7Y29sb3I6dmFyKC0taW5rKTt9Ci5maWVsZCBpbnB1dDpmb2N1c3tib3JkZXItY29sb3I6dmFyKC0tYnJhbmQyKTtib3gtc2hhZG93OjAgMCAwIDNweCByZ2JhKDc5LDcwLDIyOSwuMTIpO30KLmJ0bi1wcmltYXJ5e3dpZHRoOjEwMCU7Ym9yZGVyOjA7YmFja2dyb3VuZDp2YXIoLS1icmFuZC1ncmFkKTtjb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6MTNweDtwYWRkaW5nOjE0cHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjE1cHg7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLXRvcDo2cHg7fQouYnRuLXByaW1hcnk6ZGlzYWJsZWR7b3BhY2l0eTouNjtjdXJzb3I6ZGVmYXVsdDt9Ci5hdXRoLW1zZ3tmb250LXNpemU6MTJweDtmb250LXdlaWdodDo3MDA7cGFkZGluZzoxMHB4IDEzcHg7Ym9yZGVyLXJhZGl1czoxMHB4O21hcmdpbi1ib3R0b206MTRweDtsaW5lLWhlaWdodDoxLjY7ZGlzcGxheTpub25lO30KLmF1dGgtbXNnLnNob3d7ZGlzcGxheTpibG9jazt9Ci5hdXRoLW1zZy5lcnJ7YmFja2dyb3VuZDojRkVGMkYyO2NvbG9yOiNCOTFDMUM7fQouYXV0aC1tc2cub2t7YmFja2dyb3VuZDojRUNGREY1O2NvbG9yOiMxNkEzNEE7fQouYXV0aC1saW5rc3ttYXJnaW4tdG9wOjE4cHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjEyLjVweDtjb2xvcjp2YXIoLS1tdXRlZCk7bGluZS1oZWlnaHQ6Mjt9Ci5hdXRoLWxpbmtzIGF7Y29sb3I6dmFyKC0tYnJhbmQyKTtmb250LXdlaWdodDo4MDA7Y3Vyc29yOnBvaW50ZXI7fQouY29kZS1pbnB1dCBpbnB1dHt0ZXh0LWFsaWduOmNlbnRlcjtsZXR0ZXItc3BhY2luZzoxMHB4O2ZvbnQtc2l6ZToyNHB4O2ZvbnQtd2VpZ2h0OjkwMDt9Ci5kZXYtaGludHtiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTtmb250LXNpemU6MTJweDtmb250LXdlaWdodDo3MDA7cGFkZGluZzoxMnB4IDEzcHg7Ym9yZGVyLXJhZGl1czoxMHB4O21hcmdpbi1ib3R0b206MTRweDtsaW5lLWhlaWdodDoxLjg7fQouZGV2LWhpbnQgLmN7Zm9udC1zaXplOjIycHg7Zm9udC13ZWlnaHQ6OTAwO2xldHRlci1zcGFjaW5nOjRweDt9Ci8qINin2YTZhdmB2LbZhNipICovCi5mYXYtaGVhcnR7bWFyZ2luLWlubGluZS1zdGFydDo4cHg7Zm9udC1zaXplOjE5cHg7Y3Vyc29yOnBvaW50ZXI7bGluZS1oZWlnaHQ6MTt1c2VyLXNlbGVjdDpub25lO2ZsZXgtc2hyaW5rOjA7fQovKiDYp9mE2YXZhNmBINin2YTYtNiu2LXZiiAqLwoucHJvZi1oZWFke2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7Y29sb3I6I2ZmZjtwYWRkaW5nOjI4cHggMjBweCAyNHB4O3RleHQtYWxpZ246Y2VudGVyO2JvcmRlci1yYWRpdXM6MCAwIDI2cHggMjZweDt9Ci5wcm9mLWhlYWQgLmF2e3dpZHRoOjcycHg7aGVpZ2h0OjcycHg7Ym9yZGVyLXJhZGl1czo1MCU7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4yKTtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtc2l6ZTozMHB4O2ZvbnQtd2VpZ2h0OjkwMDttYXJnaW46MCBhdXRvIDEwcHg7Ym9yZGVyOjNweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC41KTt9Ci5wcm9mLWhlYWQgaDJ7Zm9udC1zaXplOjE5cHg7Zm9udC13ZWlnaHQ6OTAwO30KLnByb2YtaGVhZCBwe2ZvbnQtc2l6ZToxMnB4O29wYWNpdHk6Ljk7bWFyZ2luLXRvcDozcHg7fQoucHJvZi1oZWFkIC52YmFkZ2V7ZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLXRvcDo4cHg7YmFja2dyb3VuZDpyZ2JhKDIyMCwyNTIsMjMxLC4yNSk7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6NHB4IDEycHg7Ym9yZGVyLXJhZGl1czoyMHB4O30KLmJ0bi1kYW5nZXJ7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgI0ZDQTVBNTtjb2xvcjojQjkxQzFDO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxM3B4O2ZvbnQtZmFtaWx5OmluaGVyaXQ7Zm9udC13ZWlnaHQ6ODAwO2ZvbnQtc2l6ZToxNHB4O2N1cnNvcjpwb2ludGVyO21hcmdpbi10b3A6OHB4O30KLmJ0bi1zb2Z0e3dpZHRoOjEwMCU7Ym9yZGVyOjA7YmFja2dyb3VuZDojRUVGMkZGO2NvbG9yOnZhcigtLWJyYW5kMik7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTNweDtmb250LWZhbWlseTppbmhlcml0O2ZvbnQtd2VpZ2h0OjgwMDtmb250LXNpemU6MTRweDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tdG9wOjhweDt9Ci8qINin2YTYotiv2YXZhiAqLwoudXNlci1yb3d7YmFja2dyb3VuZDojZmZmO2JvcmRlci1yYWRpdXM6MTRweDtib3gtc2hhZG93OnZhcigtLXNoYWRvdyk7cGFkZGluZzoxM3B4O21hcmdpbi1ib3R0b206MTBweDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O30KLnVzZXItcm93IC5hdnt3aWR0aDo0MnB4O2hlaWdodDo0MnB4O2JvcmRlci1yYWRpdXM6NTAlO2JhY2tncm91bmQ6dmFyKC0tYnJhbmQtZ3JhZCk7Y29sb3I6I2ZmZjtkaXNwbGF5OmdyaWQ7cGxhY2UtaXRlbXM6Y2VudGVyO2ZvbnQtd2VpZ2h0OjgwMDtmbGV4LXNocmluazowO30KLnVzZXItcm93IC51aXtmbGV4OjE7bWluLXdpZHRoOjA7fQoudXNlci1yb3cgLnVpIGg1e2ZvbnQtc2l6ZToxMy41cHg7Zm9udC13ZWlnaHQ6ODAwO30KLnVzZXItcm93IC51aSBwe2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLW11dGVkKTttYXJnaW4tdG9wOjJweDt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7fQoudGFncy1yb3d7ZGlzcGxheTpmbGV4O2dhcDo1cHg7bWFyZ2luLXRvcDo1cHg7fQoudGFndntmb250LXNpemU6OS41cHg7Zm9udC13ZWlnaHQ6ODAwO3BhZGRpbmc6MnB4IDdweDtib3JkZXItcmFkaXVzOjIwcHg7fQoudGFndi55e2JhY2tncm91bmQ6I0RDRkNFNztjb2xvcjojMTZBMzRBO30KLnRhZ3YubntiYWNrZ3JvdW5kOiNGRUYzQzc7Y29sb3I6IzkyNDAwRTt9Ci50YWd2LmF7YmFja2dyb3VuZDojRURFOUZFO2NvbG9yOiM2RDI4RDk7fQouZGVse2JvcmRlcjowO2JhY2tncm91bmQ6I0ZFRjJGMjtjb2xvcjojQjkxQzFDO2JvcmRlci1yYWRpdXM6OXB4O3BhZGRpbmc6OHB4IDExcHg7Zm9udC1mYW1pbHk6aW5oZXJpdDtmb250LXdlaWdodDo4MDA7Zm9udC1zaXplOjExcHg7Y3Vyc29yOnBvaW50ZXI7ZmxleC1zaHJpbms6MDt9Ci5zdGF0LXJvd3tkaXNwbGF5OmZsZXg7Z2FwOjEwcHg7bWFyZ2luLWJvdHRvbToxNnB4O30KLnN0YXR7ZmxleDoxO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjE0cHg7Ym94LXNoYWRvdzp2YXIoLS1zaGFkb3cpO3BhZGRpbmc6MTRweDt0ZXh0LWFsaWduOmNlbnRlcjt9Ci5zdGF0IC5ue2ZvbnQtc2l6ZToyMnB4O2ZvbnQtd2VpZ2h0OjkwMDtjb2xvcjp2YXIoLS1icmFuZDEpO30KLnN0YXQgLmx7Zm9udC1zaXplOjExcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMDttYXJnaW4tdG9wOjJweDt9Cg==" }, "app.js": { "type": "text/javascript; charset=utf-8", "b64": "LyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgINiz2YjYqNixINii2Kgg4oCUINmI2KfYrNmH2Kkg2KfZhNmF2YbYtdipICjZhdi12KfYr9mC2KkgKyDYqti32KjZitmCKQogICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8KY29uc3Qgc3RhdGUgPSB7CiAgdXNlcjogbnVsbCwgY2ZnOiBudWxsLCBzdG9yZXM6IFtdLAogIHRhYjogJ2hvbWUnLCBzY3JlZW46ICdob21lJywgbW9kZTogJ2Zvb2QnLAogIHN0b3JlOiBudWxsLCBjYXJ0OiB7fSwgc3Viczoge30sIGNtcDogbnVsbCwgcXVlcnk6ICcnLAogIGF1dGg6IHsgdmlldzogJ2xvZ2luJywgZW1haWw6ICcnLCBkZXZDb2RlOiBudWxsIH0sCiAgYWRtaW46IHsgdXNlcnM6IG51bGwgfSwKfTsKCmNvbnN0ICQgPSBpZCA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7CmNvbnN0IG1vbmV5ID0gbiA9PiAoTWF0aC5yb3VuZChuICogMTAwKSAvIDEwMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KTsKY29uc3QgYXBwcyA9ICgpID0+IHN0YXRlLmNmZy5hcHBzOwpjb25zdCBjYXJ0Q291bnQgPSAoKSA9PiBPYmplY3QudmFsdWVzKHN0YXRlLmNhcnQpLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApOwpjb25zdCBmbGF0ID0gcyA9PiBzLm1lbnUuZmxhdE1hcChnID0+IGcuaXRlbXMpOwpjb25zdCBjYXJ0U3VidG90YWwgPSBzID0+IE9iamVjdC5lbnRyaWVzKHN0YXRlLmNhcnQpLnJlZHVjZSgodCwgW2lkLCBxXSkgPT4geyBjb25zdCBpdCA9IGZsYXQocykuZmluZChpID0+IGkuaWQgPT09IGlkKTsgcmV0dXJuIHQgKyAoaXQgPyBpdC5wICogcSA6IDApOyB9LCAwKTsKY29uc3QgaXNGYXYgPSBpZCA9PiAoc3RhdGUudXNlcj8uZmF2b3JpdGVzIHx8IFtdKS5pbmNsdWRlcyhpZCk7CmNvbnN0IHZhbCA9IGlkID0+ICgkKGlkKSA/ICQoaWQpLnZhbHVlLnRyaW0oKSA6ICcnKTsKCmFzeW5jIGZ1bmN0aW9uIGFwaShwYXRoLCBvcHRzID0ge30sIF90cnkgPSAwKSB7CiAgbGV0IHI7CiAgdHJ5IHsKICAgIHIgPSBhd2FpdCBmZXRjaChwYXRoLCB7IGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwgLi4ub3B0cyB9KTsKICB9IGNhdGNoIChlKSB7CiAgICAvLyDYrti32KMg2LTYqNmD2Kkg4oCUINmC2K8g2YrZg9mI2YYg2KfZhNiu2KfYr9mFINin2YTZhdis2KfZhtmKICLZiti12K3ZiSIg2YXZhiDYp9mE2LPZg9mI2YbYmyDYo9i52K8g2KfZhNmF2K3Yp9mI2YTYqQogICAgaWYgKF90cnkgPCAzKSB7IGF3YWl0IG5ldyBQcm9taXNlKHMgPT4gc2V0VGltZW91dChzLCAxODAwKSk7IHJldHVybiBhcGkocGF0aCwgb3B0cywgX3RyeSArIDEpOyB9CiAgICB0aHJvdyBuZXcgRXJyb3IoJ9iq2LnYsNmR2LEg2KfZhNin2KrYtdin2YQg2KjYp9mE2K7Yp9iv2YXYjCDYrdin2YjZhCDYqNi52K8g2YLZhNmK2YQnKTsKICB9CiAgY29uc3QgY3QgPSByLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSB8fCAnJzsKICBjb25zdCBqID0gY3QuaW5jbHVkZXMoJ2FwcGxpY2F0aW9uL2pzb24nKSA/IGF3YWl0IHIuanNvbigpLmNhdGNoKCgpID0+ICh7fSkpIDoge307CiAgaWYgKCFyLm9rKSB7CiAgICAvLyDYo9iu2LfYp9ihINmF2KTZgtiq2Kkg2KPYq9mG2KfYoSDYpdmK2YLYp9i4INin2YTYrtin2K/ZhSAo2KjZhNinINix2LPYp9mE2KkgSlNPTikg4oCUINij2LnYryDYp9mE2YXYrdin2YjZhNipINio2K/ZhCDYpdi42YfYp9ixINiu2LfYowogICAgaWYgKCFqLmVycm9yICYmIChyLnN0YXR1cyA+PSA1MDAgfHwgci5zdGF0dXMgPT09IDQwNCkgJiYgX3RyeSA8IDMpIHsKICAgICAgYXdhaXQgbmV3IFByb21pc2UocyA9PiBzZXRUaW1lb3V0KHMsIDE4MDApKTsgcmV0dXJuIGFwaShwYXRoLCBvcHRzLCBfdHJ5ICsgMSk7CiAgICB9CiAgICB0aHJvdyBuZXcgRXJyb3Ioai5lcnJvciB8fCAoJ9iu2LfYoyAnICsgci5zdGF0dXMpKTsKICB9CiAgcmV0dXJuIGo7Cn0KCi8qIC0tLS0tLS0tLS0g2KXZgtmE2KfYuSAtLS0tLS0tLS0tICovCmFzeW5jIGZ1bmN0aW9uIGluaXQoKSB7CiAgdHJ5IHsKICAgIGNvbnN0IG1lID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvbWUnKTsKICAgIGlmIChtZS51c2VyKSB7IHN0YXRlLnVzZXIgPSBtZS51c2VyOyBhd2FpdCBsb2FkQXBwKCk7IHJldHVybjsgfQogIH0gY2F0Y2ggKGUpIHsgLyog2KfZhNiu2KfYr9mFINi62YrYsSDZhdiq2KfYrSAqLwogICAgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7imqDvuI88L2Rpdj48aDM+2KrYudiw2ZHYsSDYp9mE2KfYqti12KfZhCDYqNin2YTYrtin2K/ZhTwvaDM+PHA+2LTYutmR2YQg2KfZhNiu2KfYr9mFOiA8Yj5ucG0gc3RhcnQ8L2I+PC9wPjwvZGl2PmA7CiAgICAkKCduYXYnKS5pbm5lckhUTUwgPSAnJzsgcmV0dXJuOwogIH0KICByZW5kZXIoKTsKfQphc3luYyBmdW5jdGlvbiBsb2FkQXBwKCkgewogIGNvbnN0IFtjZmcsIHN0b3JlcywgZmF2XSA9IGF3YWl0IFByb21pc2UuYWxsKFthcGkoJy9hcGkvY29uZmlnJyksIGFwaSgnL2FwaS9zdG9yZXMnKSwgYXBpKCcvYXBpL3Byb2ZpbGUvZmF2b3JpdGVzJyldKTsKICBzdGF0ZS5jZmcgPSBjZmc7IHN0YXRlLnN0b3JlcyA9IHN0b3Jlczsgc3RhdGUudXNlci5mYXZvcml0ZXMgPSBmYXYuZmF2b3JpdGVzOwogIHN0YXRlLnRhYiA9ICdob21lJzsgc3RhdGUuc2NyZWVuID0gJ2hvbWUnOyByZW5kZXIoKTsKfQoKLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiAgINin2YTZhdi12KfYr9mC2KkKICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovCmZ1bmN0aW9uIHZpZXdBdXRoKCkgewogIGNvbnN0IHYgPSBzdGF0ZS5hdXRoLnZpZXc7CiAgY29uc3QgaGVybyA9IGA8ZGl2IGNsYXNzPSJhdXRoLWhlcm8iPjxkaXYgY2xhc3M9Im1rIj5TPC9kaXY+PGgxPtiz2YjYqNixINii2Kg8L2gxPjxwPtmC2KfYsdmGINmI2KfYt9mE2Kgg2YXZhiDZg9mEINiq2LfYqNmK2YLYp9iqINin2YTYqtmI2LXZitmEIOKAlCDYqNij2YHYttmEINiz2LnYsTwvcD48L2Rpdj5gOwogIGNvbnN0IG1zZyA9IGA8ZGl2IGNsYXNzPSJhdXRoLW1zZyBlcnIiIGlkPSJhdXRoRXJyIj48L2Rpdj5gOwogIGNvbnN0IGRldiA9IHN0YXRlLmF1dGguZGV2Q29kZSA/IGA8ZGl2IGNsYXNzPSJkZXYtaGludCI+8J+TpyDZiNi22Lkg2KrYrNix2YrYqNmKICjYqNiv2YjZhiDYqNix2YrYryDYrdmC2YrZgtmKKSDigJQg2LHZhdiy2YMg2YfZiDo8YnI+PHNwYW4gY2xhc3M9ImMiPiR7c3RhdGUuYXV0aC5kZXZDb2RlfTwvc3Bhbj48L2Rpdj5gIDogJyc7CgogIGlmICh2ID09PSAncmVnaXN0ZXInKSByZXR1cm4gaGVybyArIGA8ZGl2IGNsYXNzPSJhdXRoLWJvZHkiPgogICAgPGRpdiBjbGFzcz0iYXV0aC10aXRsZSI+2KXZhti02KfYoSDYrdiz2KfYqDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYXV0aC1zdWIiPtiz2KzZkdmEINmE2YTZiNi12YjZhCDYpdmE2Ykg2KfZhNmF2YbYtdipINmI2YXZgtin2LHZhtipINi32YTYqNin2KrZgy48L2Rpdj4KICAgICR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Yp9mE2KfYs9mFPC9sYWJlbD48aW5wdXQgaWQ9InJOYW1lIiBwbGFjZWhvbGRlcj0i2KfYs9mF2YMiIC8+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJyRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIgLz48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkIj48bGFiZWw+2YPZhNmF2Kkg2KfZhNmF2LHZiNixPC9sYWJlbD48aW5wdXQgaWQ9InJQYXNzIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9ItmoINij2K3YsdmBINi52YTZiSDYp9mE2KPZgtmEIiAvPjwvZGl2PgogICAgPGJ1dHRvbiBjbGFzcz0iYnRuLXByaW1hcnkiIGlkPSJyQnRuIiBvbmNsaWNrPSJkb1JlZ2lzdGVyKCkiPtil2YbYtNin2KEg2K3Ys9in2Kg8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPtmE2K/ZitmDINit2LPYp9io2J8gPGEgb25jbGljaz0iYXV0aFZpZXcoJ2xvZ2luJykiPtiz2KzZkdmEINin2YTYr9iu2YjZhDwvYT48L2Rpdj4KICA8L2Rpdj5gOwoKICBpZiAodiA9PT0gJ3ZlcmlmeScpIHJldHVybiBoZXJvICsgYDxkaXYgY2xhc3M9ImF1dGgtYm9keSI+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7YqtmB2LnZitmEINin2YTYrdiz2KfYqDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYXV0aC1zdWIiPtij2K/YrtmEINin2YTYsdmF2LIg2KfZhNmF2LHYs9mEINil2YTZiSA8Yj4ke3N0YXRlLmF1dGguZW1haWx9PC9iPjwvZGl2PgogICAgJHtkZXZ9JHttc2d9CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCBjb2RlLWlucHV0Ij48aW5wdXQgaWQ9InZDb2RlIiBpbnB1dG1vZGU9Im51bWVyaWMiIG1heGxlbmd0aD0iNiIgcGxhY2Vob2xkZXI9IuKAouKAouKAouKAouKAouKAoiIgLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0idkJ0biIgb25jbGljaz0iZG9WZXJpZnkoKSI+2KrZgdi52YrZhCDZiNiv2K7ZiNmEPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJkb1Jlc2VuZCgpIj7Ypdi52KfYr9ipINil2LHYs9in2YQg2KfZhNix2YXYsjwvYT4gwrcgPGEgb25jbGljaz0iYXV0aFZpZXcoJ2xvZ2luJykiPtix2KzZiNi5PC9hPjwvZGl2PgogIDwvZGl2PmA7CgogIGlmICh2ID09PSAnZm9yZ290JykgcmV0dXJuIGhlcm8gKyBgPGRpdiBjbGFzcz0iYXV0aC1ib2R5Ij4KICAgIDxkaXYgY2xhc3M9ImF1dGgtdGl0bGUiPtmG2LPZitiqINmD2YTZhdipINin2YTZhdix2YjYsTwvZGl2PgogICAgPGRpdiBjbGFzcz0iYXV0aC1zdWIiPtij2K/YrtmEINio2LHZitiv2YMg2YjZhtix2LPZhCDZhNmDINix2YXYsiDYpdi52KfYr9ipINin2YTYqti52YrZitmGLjwvZGl2PgogICAgJHttc2d9CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijwvbGFiZWw+PGlucHV0IGlkPSJmRW1haWwiIHR5cGU9ImVtYWlsIiBwbGFjZWhvbGRlcj0ieW91QGVtYWlsLmNvbSIgLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0iZkJ0biIgb25jbGljaz0iZG9Gb3Jnb3QoKSI+2KXYsdiz2KfZhCDYp9mE2LHZhdiyPC9idXR0b24+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLWxpbmtzIj48YSBvbmNsaWNrPSJhdXRoVmlldygnbG9naW4nKSI+2LHYrNmI2Lkg2YTYqtiz2KzZitmEINin2YTYr9iu2YjZhDwvYT48L2Rpdj4KICA8L2Rpdj5gOwoKICBpZiAodiA9PT0gJ3Jlc2V0JykgcmV0dXJuIGhlcm8gKyBgPGRpdiBjbGFzcz0iYXV0aC1ib2R5Ij4KICAgIDxkaXYgY2xhc3M9ImF1dGgtdGl0bGUiPtiq2LnZitmK2YYg2YPZhNmF2Kkg2YXYsdmI2LEg2KzYr9mK2K/YqTwvZGl2PgogICAgPGRpdiBjbGFzcz0iYXV0aC1zdWIiPtin2YTYsdmF2LIg2KPZj9ix2LPZhCDYpdmE2YkgPGI+JHtzdGF0ZS5hdXRoLmVtYWlsfTwvYj48L2Rpdj4KICAgICR7ZGV2fSR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQgY29kZS1pbnB1dCI+PGlucHV0IGlkPSJzQ29kZSIgaW5wdXRtb2RlPSJudW1lcmljIiBtYXhsZW5ndGg9IjYiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKIiIC8+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtmD2YTZhdipINin2YTZhdix2YjYsSDYp9mE2KzYr9mK2K/YqTwvbGFiZWw+PGlucHV0IGlkPSJzUGFzcyIgdHlwZT0icGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLZqCDYo9it2LHZgSDYudmE2Ykg2KfZhNij2YLZhCIgLz48L2Rpdj4KICAgIDxidXR0b24gY2xhc3M9ImJ0bi1wcmltYXJ5IiBpZD0ic0J0biIgb25jbGljaz0iZG9SZXNldCgpIj7YrdmB2Lgg2YjYp9mE2K/YrtmI2YQ8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPjxhIG9uY2xpY2s9ImF1dGhWaWV3KCdsb2dpbicpIj7Ysdis2YjYuTwvYT48L2Rpdj4KICA8L2Rpdj5gOwoKICAvLyBsb2dpbgogIHJldHVybiBoZXJvICsgYDxkaXYgY2xhc3M9ImF1dGgtYm9keSI+CiAgICA8ZGl2IGNsYXNzPSJhdXRoLXRpdGxlIj7Yqtiz2KzZitmEINin2YTYr9iu2YjZhDwvZGl2PgogICAgPGRpdiBjbGFzcz0iYXV0aC1zdWIiPtij2YfZhNmL2Kcg2KjYudmI2K/YqtmDIPCfkYs8L2Rpdj4KICAgICR7bXNnfQogICAgPGRpdiBjbGFzcz0iZmllbGQiPjxsYWJlbD7Yp9mE2KjYsdmK2K8g2KfZhNil2YTZg9iq2LHZiNmG2Yo8L2xhYmVsPjxpbnB1dCBpZD0ibEVtYWlsIiB0eXBlPSJlbWFpbCIgcGxhY2Vob2xkZXI9InlvdUBlbWFpbC5jb20iIC8+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+PGxhYmVsPtmD2YTZhdipINin2YTZhdix2YjYsTwvbGFiZWw+PGlucHV0IGlkPSJsUGFzcyIgdHlwZT0icGFzc3dvcmQiIHBsYWNlaG9sZGVyPSLigKLigKLigKLigKLigKLigKLigKLigKIiIC8+PC9kaXY+CiAgICA8YnV0dG9uIGNsYXNzPSJidG4tcHJpbWFyeSIgaWQ9ImxCdG4iIG9uY2xpY2s9ImRvTG9naW4oKSI+2K/YrtmI2YQ8L2J1dHRvbj4KICAgIDxkaXYgY2xhc3M9ImF1dGgtbGlua3MiPjxhIG9uY2xpY2s9ImF1dGhWaWV3KCdmb3Jnb3QnKSI+2YbYs9mK2Kog2YPZhNmF2Kkg2KfZhNmF2LHZiNix2J88L2E+PGJyPtmF2Kcg2LnZhtiv2YMg2K3Ys9in2KjYnyA8YSBvbmNsaWNrPSJhdXRoVmlldygncmVnaXN0ZXInKSI+2KPZhti02KYg2K3Ys9in2Kg8L2E+PC9kaXY+CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiBhdXRoVmlldyh2KSB7IHN0YXRlLmF1dGgudmlldyA9IHY7IHN0YXRlLmF1dGguZGV2Q29kZSA9IG51bGw7IHJlbmRlcigpOyB9CmZ1bmN0aW9uIHNldEVycihtKSB7IGNvbnN0IGUgPSAkKCdhdXRoRXJyJyk7IGlmIChlKSB7IGUudGV4dENvbnRlbnQgPSBtOyBlLmNsYXNzTmFtZSA9ICdhdXRoLW1zZyBlcnIgc2hvdyc7IH0gfQpmdW5jdGlvbiBidXN5KGlkLCBvbiwgbGFiZWwpIHsgY29uc3QgYiA9ICQoaWQpOyBpZiAoYikgeyBiLmRpc2FibGVkID0gb247IGlmIChvbikgYi5kYXRhc2V0LnQgPSBiLnRleHRDb250ZW50LCBiLnRleHRDb250ZW50ID0gJ+KPsyAuLi4nOyBlbHNlIGIudGV4dENvbnRlbnQgPSBsYWJlbCB8fCBiLmRhdGFzZXQudDsgfSB9Cgphc3luYyBmdW5jdGlvbiBkb1JlZ2lzdGVyKCkgewogIGNvbnN0IG5hbWUgPSB2YWwoJ3JOYW1lJyksIGVtYWlsID0gdmFsKCdyRW1haWwnKSwgcGFzc3dvcmQgPSAkKCdyUGFzcycpPy52YWx1ZSB8fCAnJzsKICBpZiAoIW5hbWUgfHwgIWVtYWlsIHx8ICFwYXNzd29yZCkgcmV0dXJuIHNldEVycign2KfZhdmE2KMg2YPZhCDYp9mE2K3ZgtmI2YQnKTsKICBidXN5KCdyQnRuJywgdHJ1ZSk7CiAgdHJ5IHsKICAgIGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZWdpc3RlcicsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbmFtZSwgZW1haWwsIHBhc3N3b3JkIH0pIH0pOwogICAgc3RhdGUuYXV0aC5lbWFpbCA9IHIuZW1haWw7IHN0YXRlLmF1dGguZGV2Q29kZSA9IHIuZGV2Q29kZSB8fCBudWxsOyBzdGF0ZS5hdXRoLnZpZXcgPSAndmVyaWZ5JzsgcmVuZGVyKCk7CiAgfSBjYXRjaCAoZSkgeyBidXN5KCdyQnRuJywgZmFsc2UsICfYpdmG2LTYp9ihINit2LPYp9ioJyk7IHNldEVycihlLm1lc3NhZ2UpOyB9Cn0KYXN5bmMgZnVuY3Rpb24gZG9WZXJpZnkoKSB7CiAgY29uc3QgY29kZSA9IHZhbCgndkNvZGUnKTsKICBpZiAoY29kZS5sZW5ndGggPCA0KSByZXR1cm4gc2V0RXJyKCfYo9iv2K7ZhCDYp9mE2LHZhdiyJyk7CiAgYnVzeSgndkJ0bicsIHRydWUpOwogIHRyeSB7CiAgICBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL2F1dGgvdmVyaWZ5JywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbDogc3RhdGUuYXV0aC5lbWFpbCwgY29kZSB9KSB9KTsKICAgIHN0YXRlLnVzZXIgPSByLnVzZXI7IGF3YWl0IGxvYWRBcHAoKTsKICB9IGNhdGNoIChlKSB7IGJ1c3koJ3ZCdG4nLCBmYWxzZSwgJ9iq2YHYudmK2YQg2YjYr9iu2YjZhCcpOyBzZXRFcnIoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGRvUmVzZW5kKCkgewogIHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZXNlbmQnLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBzdGF0ZS5hdXRoLmVtYWlsIH0pIH0pOyBzdGF0ZS5hdXRoLmRldkNvZGUgPSByLmRldkNvZGUgfHwgbnVsbDsgcmVuZGVyKCk7IH0KICBjYXRjaCAoZSkgeyBzZXRFcnIoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIGRvTG9naW4oKSB7CiAgY29uc3QgZW1haWwgPSB2YWwoJ2xFbWFpbCcpLCBwYXNzd29yZCA9ICQoJ2xQYXNzJyk/LnZhbHVlIHx8ICcnOwogIGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSByZXR1cm4gc2V0RXJyKCfYo9iv2K7ZhCDYp9mE2KjYsdmK2K8g2YjZg9mE2YXYqSDYp9mE2YXYsdmI2LEnKTsKICBidXN5KCdsQnRuJywgdHJ1ZSk7CiAgdHJ5IHsKICAgIGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYXV0aC9sb2dpbicsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWwsIHBhc3N3b3JkIH0pIH0pOwogICAgc3RhdGUudXNlciA9IHIudXNlcjsgYXdhaXQgbG9hZEFwcCgpOwogIH0gY2F0Y2ggKGUpIHsKICAgIGJ1c3koJ2xCdG4nLCBmYWxzZSwgJ9iv2K7ZiNmEJyk7CiAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCfZgdi52ZHZhCcpKSB7IHN0YXRlLmF1dGguZW1haWwgPSBlbWFpbDsgc3RhdGUuYXV0aC52aWV3ID0gJ3ZlcmlmeSc7IHJlbmRlcigpOyBzZXRFcnIoJ9mB2LnZkdmEINit2LPYp9io2YMg2KPZiNmE2YvYpycpOyB9CiAgICBlbHNlIHNldEVycihlLm1lc3NhZ2UpOwogIH0KfQphc3luYyBmdW5jdGlvbiBkb0ZvcmdvdCgpIHsKICBjb25zdCBlbWFpbCA9IHZhbCgnZkVtYWlsJyk7IGlmICghZW1haWwpIHJldHVybiBzZXRFcnIoJ9ij2K/YrtmEINio2LHZitiv2YMnKTsKICBidXN5KCdmQnRuJywgdHJ1ZSk7CiAgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL2ZvcmdvdCcsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWwgfSkgfSk7IHN0YXRlLmF1dGguZW1haWwgPSBlbWFpbDsgc3RhdGUuYXV0aC5kZXZDb2RlID0gci5kZXZDb2RlIHx8IG51bGw7IHN0YXRlLmF1dGgudmlldyA9ICdyZXNldCc7IHJlbmRlcigpOyB9CiAgY2F0Y2ggKGUpIHsgYnVzeSgnZkJ0bicsIGZhbHNlLCAn2KXYsdiz2KfZhCDYp9mE2LHZhdiyJyk7IHNldEVycihlLm1lc3NhZ2UpOyB9Cn0KYXN5bmMgZnVuY3Rpb24gZG9SZXNldCgpIHsKICBjb25zdCBjb2RlID0gdmFsKCdzQ29kZScpLCBwYXNzd29yZCA9ICQoJ3NQYXNzJyk/LnZhbHVlIHx8ICcnOwogIGlmIChjb2RlLmxlbmd0aCA8IDQgfHwgIXBhc3N3b3JkKSByZXR1cm4gc2V0RXJyKCfYo9iv2K7ZhCDYp9mE2LHZhdiyINmI2YPZhNmF2Kkg2KfZhNmF2LHZiNixJyk7CiAgYnVzeSgnc0J0bicsIHRydWUpOwogIHRyeSB7CiAgICBhd2FpdCBhcGkoJy9hcGkvYXV0aC9yZXNldCcsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IHN0YXRlLmF1dGguZW1haWwsIGNvZGUsIHBhc3N3b3JkIH0pIH0pOwogICAgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hdXRoL2xvZ2luJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbDogc3RhdGUuYXV0aC5lbWFpbCwgcGFzc3dvcmQgfSkgfSk7CiAgICBzdGF0ZS51c2VyID0gci51c2VyOyBhd2FpdCBsb2FkQXBwKCk7CiAgfSBjYXRjaCAoZSkgeyBidXN5KCdzQnRuJywgZmFsc2UsICfYrdmB2Lgg2YjYp9mE2K/YrtmI2YQnKTsgc2V0RXJyKGUubWVzc2FnZSk7IH0KfQphc3luYyBmdW5jdGlvbiBkb0xvZ291dCgpIHsgdHJ5IHsgYXdhaXQgYXBpKCcvYXBpL2F1dGgvbG9nb3V0JywgeyBtZXRob2Q6ICdQT1NUJyB9KTsgfSBjYXRjaCB7fSBzdGF0ZS51c2VyID0gbnVsbDsgc3RhdGUuYXV0aCA9IHsgdmlldzogJ2xvZ2luJywgZW1haWw6ICcnLCBkZXZDb2RlOiBudWxsIH07IHJlbmRlcigpOyB9CgovKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAg2KfZhNiq2LfYqNmK2YIgKNio2LnYryDYp9mE2K/YrtmI2YQpCiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqLwpmdW5jdGlvbiBtaW5pRG90cyhpZHMpIHsgcmV0dXJuIGlkcy5zbGljZSgwLCA1KS5tYXAoaWQgPT4gYDxpIHN0eWxlPSJiYWNrZ3JvdW5kOiR7YXBwcygpW2lkXS5jb2xvcn0iPjwvaT5gKS5qb2luKCcnKTsgfQpmdW5jdGlvbiBhcHBMb2dvKGlkLCBzaXplKSB7IGNvbnN0IGEgPSBhcHBzKClbaWRdOyByZXR1cm4gYDxkaXYgY2xhc3M9ImFsb2dvIiBzdHlsZT0iYmFja2dyb3VuZDoke2EuY29sb3J9O2NvbG9yOiR7YS50ZXh0fTt3aWR0aDoke3NpemV9cHg7aGVpZ2h0OiR7c2l6ZX1weCI+JHthLnNob3J0fTwvZGl2PmA7IH0KZnVuY3Rpb24gc2hhZGUoaGV4LCBwKSB7IGhleCA9IGhleC5yZXBsYWNlKCcjJywgJycpOyBjb25zdCBuID0gcGFyc2VJbnQoaGV4LCAxNik7IGxldCByID0gKG4gPj4gMTYpICYgMjU1LCBnID0gKG4gPj4gOCkgJiAyNTUsIGIgPSBuICYgMjU1OyByID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByICsgciAqIHAgLyAxMDApKTsgZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgZyArIGcgKiBwIC8gMTAwKSk7IGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIgKyBiICogcCAvIDEwMCkpOyByZXR1cm4gJyMnICsgKCgxIDw8IDI0KSArIChNYXRoLnJvdW5kKHIpIDw8IDE2KSArIChNYXRoLnJvdW5kKGcpIDw8IDgpICsgTWF0aC5yb3VuZChiKSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpOyB9CgpmdW5jdGlvbiB2aWV3SG9tZSgpIHsKICBjb25zdCBmb29kID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gJ2Zvb2QnKTsKICBjb25zdCBncm9jID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gJ2dyb2NlcnknKTsKICBjb25zdCBmYXZzID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IGlzRmF2KHMuaWQpKTsKICBjb25zdCBxID0gc3RhdGUucXVlcnkudHJpbSgpOwogIGNvbnN0IGZpbHRlcmVkID0gcSA/IHN0YXRlLnN0b3Jlcy5maWx0ZXIocyA9PiBzLm5hbWUuaW5jbHVkZXMocSkgfHwgcy5jYXQuaW5jbHVkZXMocSkpIDogbnVsbDsKICByZXR1cm4gYAogIDxkaXYgY2xhc3M9InRvcGJhciI+CiAgICA8ZGl2IGNsYXNzPSJicmFuZHJvdyI+PGRpdiBjbGFzcz0ibG9nbyI+PHNwYW4gY2xhc3M9Im1hcmsiPlM8L3NwYW4+INiz2YjYqNixINii2Kg8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0ibG9jIj48c3BhbiBjbGFzcz0iY2hldiI+JHtzdGF0ZS51c2VyLm5hbWUuc3BsaXQoJyAnKVswXX0g8J+Rizwvc3Bhbj48L2Rpdj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImxvYyIgc3R5bGU9Im1hcmdpbi10b3A6MTJweCI+PHNwYW4gY2xhc3M9InBpbiI+8J+TjTwvc3Bhbj4g2KfZhNiq2YjYtdmK2YQg2KXZhNmJIDxiPiR7c3RhdGUudXNlci5hZGRyZXNzIHx8IHN0YXRlLmNmZy5sb2NhdGlvbn08L2I+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJoZWxsbyI+2YjYtCDYqtio2Yog2KrYt9mE2Kgg2KfZhNmK2YjZhdifPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJzZWFyY2giPjxzcGFuPvCflI08L3NwYW4+PGlucHV0IGlkPSJxIiBwbGFjZWhvbGRlcj0i2KfYqNit2Ksg2LnZhiDZhdi32LnZhSDYo9mIINmF2KrYrNix4oCmIiB2YWx1ZT0iJHtxfSIgb25pbnB1dD0ib25TZWFyY2godGhpcy52YWx1ZSkiIC8+PC9kaXY+CiAgPC9kaXY+CiAgPGRpdiBjbGFzcz0icGFkIj4KICAgICR7ZmlsdGVyZWQgPyBgPGRpdiBjbGFzcz0ic2VjdGlvbi1oIj48aDM+2YbYqtin2KbYrCDYp9mE2KjYrdirICgke2ZpbHRlcmVkLmxlbmd0aH0pPC9oMz48L2Rpdj4ke2ZpbHRlcmVkLmxlbmd0aCA/IGZpbHRlcmVkLm1hcChwbGFjZUNhcmQpLmpvaW4oJycpIDogYDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7wn5SOPC9kaXY+PGgzPtmF2Kcg2YTZgtmK2YbYpyDZhtiq2KfYptisPC9oMz48L2Rpdj5gfWAgOiBgCiAgICAgIDxkaXYgY2xhc3M9ImNhdHMiPgogICAgICAgIDxkaXYgY2xhc3M9ImNhdCBmb29kIiBvbmNsaWNrPSJzZXRNb2RlKCdmb29kJykiPjxoND7Yt9i52KfZhTwvaDQ+PHA+2YXYt9in2LnZhSDZiNmI2KzYqNin2Kog2LPYsdmK2LnYqTwvcD48c3BhbiBjbGFzcz0iZW1vamkiPvCfjZQ8L3NwYW4+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iY2F0IGdyb2NlcnkiIG9uY2xpY2s9InNldE1vZGUoJ2dyb2NlcnknKSI+PGg0PtmF2YLYp9i22Yo8L2g0PjxwPtio2YLYp9mE2Kkg2YjYs9mI2KjYsdmF2KfYsdmD2Ko8L3A+PHNwYW4gY2xhc3M9ImVtb2ppIj7wn5uSPC9zcGFuPjwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgJHtzdGF0ZS5jZmcubGl2ZSA/IGA8ZGl2IGNsYXNzPSJhdmFpbGJhciIgc3R5bGU9Im1hcmdpbjoxNnB4IDAgMDtiYWNrZ3JvdW5kOiNFQ0ZERjU7Y29sb3I6IzE2QTM0QSI+PHNwYW4gc3R5bGU9ImZvbnQtc2l6ZTo5cHgiPuKXjzwvc3Bhbj4g2LHYqNi3INit2Yog2YXYuSAke3N0YXRlLmNmZy5saXZlLnNvdXJjZX0gwrcg2KLYrtixINiq2K3Yr9mK2KsgJHtzdGF0ZS5jZmcubGl2ZS5mZXRjaGVkQXR9PC9kaXY+YCA6ICcnfQogICAgICAke2ZhdnMubGVuZ3RoID8gYDxkaXYgY2xhc3M9InNlY3Rpb24taCI+PGgzPuKdpO+4jyDZhdmB2LbZkdmE2KrZgzwvaDM+PC9kaXY+JHtmYXZzLm1hcChwbGFjZUNhcmQpLmpvaW4oJycpfWAgOiAnJ30KICAgICAgPGRpdiBjbGFzcz0ic2VjdGlvbi1oIj48aDM+8J+NlCDZhdi32KfYudmFPC9oMz48YSBvbmNsaWNrPSJzZXRNb2RlKCdmb29kJykiPtin2YTZg9mEPC9hPjwvZGl2PiR7Zm9vZC5tYXAocGxhY2VDYXJkKS5qb2luKCcnKX0KICAgICAgPGRpdiBjbGFzcz0ic2VjdGlvbi1oIj48aDM+8J+bkiDZhdmC2KfYttmKPC9oMz48YSBvbmNsaWNrPSJzZXRNb2RlKCdncm9jZXJ5JykiPtin2YTZg9mEPC9hPjwvZGl2PiR7Z3JvYy5tYXAocGxhY2VDYXJkKS5qb2luKCcnKX0KICAgIGB9CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3TGlzdCgpIHsKICBjb25zdCBsaXN0ID0gc3RhdGUuc3RvcmVzLmZpbHRlcihzID0+IHMua2luZCA9PT0gc3RhdGUubW9kZSk7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJ0b3BiYXIiPjxkaXYgY2xhc3M9ImJyYW5kcm93Ij48ZGl2IGNsYXNzPSJsb2dvIj48c3BhbiBjbGFzcz0ibWFyayIgb25jbGljaz0iZ29Ib21lKCkiIHN0eWxlPSJjdXJzb3I6cG9pbnRlciI+4oC5PC9zcGFuPiAke3N0YXRlLm1vZGUgPT09ICdmb29kJyA/ICfYt9i52KfZhSDCtyDZhdi32KfYudmFJyA6ICfZhdmC2KfYttmKIMK3INiz2YjYqNix2YXYp9ix2YPYqid9PC9kaXY+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJzZWFyY2giIHN0eWxlPSJtYXJnaW4tdG9wOjE0cHgiPjxzcGFuPvCflI08L3NwYW4+PGlucHV0IGlkPSJxIiBwbGFjZWhvbGRlcj0i2KfYqNit2KvigKYiIG9uaW5wdXQ9Im9uU2VhcmNoKHRoaXMudmFsdWUpIiAvPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0icGFkIj48ZGl2IGNsYXNzPSJzZWN0aW9uLWgiPjxoMz4ke2xpc3QubGVuZ3RofSDZhdiq2KzYsSDZhdiq2KfYrTwvaDM+PC9kaXY+JHtsaXN0Lm1hcChwbGFjZUNhcmQpLmpvaW4oJycpfTwvZGl2PmA7Cn0KZnVuY3Rpb24gcGxhY2VDYXJkKHMpIHsKICByZXR1cm4gYDxkaXYgY2xhc3M9InBsYWNlIj4KICAgIDxkaXYgY2xhc3M9ImF2YSIgc3R5bGU9ImJhY2tncm91bmQ6JHtzLmNvbG9yfSIgb25jbGljaz0ib3BlblN0b3JlKCcke3MuaWR9JykiPiR7cy5sb2dvfTwvZGl2PgogICAgPGRpdiBjbGFzcz0iaW5mbyIgb25jbGljaz0ib3BlblN0b3JlKCcke3MuaWR9JykiPjxoND4ke3MubmFtZX08L2g0PjxwPiR7cy5jYXR9PC9wPgogICAgICA8ZGl2IGNsYXNzPSJtZXRhIj48c3BhbiBjbGFzcz0ic3RhciI+4piFICR7cy5yYXRpbmd9PC9zcGFuPjxzcGFuPuKPsSAke3MuZXRhfTwvc3Bhbj4KICAgICAgICAke3MubGl2ZSA/ICc8c3BhbiBjbGFzcz0iYmFkZ2UtbiI+4pePINmF2KjYp9i02LE8L3NwYW4+JyA6IGA8c3BhbiBjbGFzcz0iYmFkZ2UtbiIgc3R5bGU9ImJhY2tncm91bmQ6I0VFRjJGRjtjb2xvcjojNEY0NkU1Ij4ke3Mub24ubGVuZ3RofSDYqti32KjZitmC2KfYqjwvc3Bhbj5gfTwvZGl2PjwvZGl2PgogICAgPHNwYW4gY2xhc3M9ImZhdi1oZWFydCIgb25jbGljaz0idG9nZ2xlRmF2KCcke3MuaWR9JykiPiR7aXNGYXYocy5pZCkgPyAn4p2k77iPJyA6ICfwn6SNJ308L3NwYW4+CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3U3RvcmUoKSB7CiAgY29uc3QgcyA9IHN0YXRlLnN0b3JlOwogIHJldHVybiBgPGRpdiBjbGFzcz0ic3RvcmUtaGVybyIgc3R5bGU9ImJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywke3MuY29sb3J9LCR7c2hhZGUocy5jb2xvciwgLTI1KX0pIj4KICAgIDxkaXYgY2xhc3M9ImJhY2siIG9uY2xpY2s9ImdvSG9tZSgpIj7igLo8L2Rpdj48aDI+JHtzLm5hbWV9PC9oMj48ZGl2IGNsYXNzPSJ0YWdzIj4ke3MuY2F0fSDCtyDimIUgJHtzLnJhdGluZ308L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNoaXBzIj48c3BhbiBjbGFzcz0iY2hpcCI+4o+xICR7cy5ldGF9PC9zcGFuPjxzcGFuIGNsYXNzPSJjaGlwIj7wn5ONICR7KHN0YXRlLnVzZXIuYWRkcmVzcyB8fCBzdGF0ZS5jZmcubG9jYXRpb24pLnNwbGl0KCfYjCcpWzBdfTwvc3Bhbj4KICAgICAgJHtzLmxpdmUgPyBgPHNwYW4gY2xhc3M9ImNoaXAiIHN0eWxlPSJiYWNrZ3JvdW5kOnJnYmEoMjIwLDI1MiwyMzEsLjIyKSI+4pePINmF2KjYp9i02LEg2YXZhiAke3MubGl2ZVNvdXJjZX08L3NwYW4+YCA6IGA8c3BhbiBjbGFzcz0iY2hpcCI+JHtzLm9uLmxlbmd0aH0g2KrYt9io2YrZgtin2Ko8L3NwYW4+YH08L2Rpdj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImF2YWlsYmFyIj48c3Bhbj7Zhdiq2KfYrSDYudio2LE6PC9zcGFuPjxzcGFuIHN0eWxlPSJkaXNwbGF5OmZsZXgiPiR7cy5vbi5tYXAoaWQgPT4gYDxpIHN0eWxlPSJiYWNrZ3JvdW5kOiR7YXBwcygpW2lkXS5jb2xvcn07d2lkdGg6MjBweDtoZWlnaHQ6MjBweDtib3JkZXItcmFkaXVzOjUwJTtib3JkZXI6MnB4IHNvbGlkICNmZmY7bWFyZ2luLWlubGluZS1zdGFydDotN3B4Ij48L2k+YCkuam9pbignJyl9PC9zcGFuPjwvZGl2PgogICAgPGRpdiBjbGFzcz0icGFkIiBzdHlsZT0icGFkZGluZy1ib3R0b206OTBweCI+CiAgICAgICR7cy5saXZlID8gYDxkaXYgY2xhc3M9ImF2YWlsYmFyIiBzdHlsZT0ibWFyZ2luOjZweCAwIDJweDtiYWNrZ3JvdW5kOiNFQ0ZERjU7Y29sb3I6IzE2QTM0QSI+PHNwYW4gc3R5bGU9ImZvbnQtc2l6ZTo5cHgiPuKXjzwvc3Bhbj4g2KPYs9i52KfYsSDZhdio2KfYtNix2Kkg2YXZhiAke3MubGl2ZVNvdXJjZX0gwrcgJHtzLmxpdmVBdH08L2Rpdj5gIDogJyd9CiAgICAgICR7cy5tZW51Lm1hcChnID0+IGA8ZGl2IGNsYXNzPSJtZW51LWNhdCI+JHtnLmd9PC9kaXY+JHtnLml0ZW1zLm1hcChpdGVtUm93KS5qb2luKCcnKX1gKS5qb2luKCcnKX0KICAgICAgPGRpdiBjbGFzcz0iZGlzY2xhaW1lciIgc3R5bGU9InBhZGRpbmctYm90dG9tOjEwcHgiPiR7cy5saXZlID8gYNij2LPYudin2LEgJHtzLmxpdmVTb3VyY2V9INmF2LPYrdmI2KjYqSDZgdi52YTZitmL2KcgKNix2KjYtyDYrdmKKS5gIDogJ9in2YTYo9iz2LnYp9ixINiq2YjYttmK2K3ZitipINmE2YTZhtmF2YjYsNisLid9PC9kaXY+CiAgICA8L2Rpdj4KICAgICR7Y2FydENvdW50KCkgPyBgPGRpdiBjbGFzcz0iY2FydGJhciIgb25jbGljaz0iZ29Db21wYXJlKCkiPjxkaXYgY2xhc3M9ImMiPjxzcGFuIGNsYXNzPSJxYmFkZ2UiPiR7Y2FydENvdW50KCl9PC9zcGFuPiDYp9mE2LPZhNipIMK3ICR7bW9uZXkoY2FydFN1YnRvdGFsKHMpKX0g2LEu2LM8L2Rpdj48ZGl2IGNsYXNzPSJnbyI+2YLYp9ix2YYg2KfZhNi52LHZiNi2IOKAujwvZGl2PjwvZGl2PmAgOiAnJ31gOwp9CmZ1bmN0aW9uIGl0ZW1Sb3coaXQpIHsKICBjb25zdCBxID0gc3RhdGUuY2FydFtpdC5pZF0gfHwgMDsKICByZXR1cm4gYDxkaXYgY2xhc3M9Iml0ZW0iPjxkaXYgY2xhc3M9InBoIj4ke2l0LmV9PC9kaXY+PGRpdiBjbGFzcz0iZCI+PGg1PiR7aXQubn08L2g1PjxwPiR7aXQuZH08L3A+CiAgICA8ZGl2IGNsYXNzPSJwciI+JHttb25leShpdC5wKX0g2LEu2LMgJHtpdC5saXZlID8gJzxzcGFuIHN0eWxlPSJmb250LXNpemU6OXB4O2NvbG9yOiMxNkEzNEE7Zm9udC13ZWlnaHQ6ODAwO2JhY2tncm91bmQ6I0RDRkNFNztwYWRkaW5nOjJweCA2cHg7Ym9yZGVyLXJhZGl1czo2cHgiPuKXjyDZhdio2KfYtNixPC9zcGFuPicgOiAnJ308L2Rpdj48L2Rpdj4KICAgICR7cSA/IGA8ZGl2IGNsYXNzPSJzdGVwcGVyIj48YnV0dG9uIGNsYXNzPSJtaW51cyIgb25jbGljaz0iZGVjKCcke2l0LmlkfScpIj7iiJI8L2J1dHRvbj48c3BhbiBjbGFzcz0icSI+JHtxfTwvc3Bhbj48YnV0dG9uIG9uY2xpY2s9ImluYygnJHtpdC5pZH0nKSI+KzwvYnV0dG9uPjwvZGl2PmAgOiBgPGJ1dHRvbiBjbGFzcz0iYWRkIiBvbmNsaWNrPSJpbmMoJyR7aXQuaWR9JykiPtil2LbYp9mB2KkgKzwvYnV0dG9uPmB9PC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3Q29tcGFyZSgpIHsKICBjb25zdCBjID0gc3RhdGUuY21wOwogIGlmICghYykgcmV0dXJuIGA8ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYrdiz2KfYqCDYo9mB2LbZhCDYudix2LbigKY8L2Rpdj5gOwogIGNvbnN0IG9mZmVycyA9IGMub2ZmZXJzLCBiZXN0ID0gb2ZmZXJzWzBdLCBzYXZpbmcgPSBjLnNhdmluZzsKICBjb25zdCBzdWJBcHBzID0gYy5zdG9yZS5vbi5maWx0ZXIoaWQgPT4gYXBwcygpW2lkXS5zdWIpOwogIHJldHVybiBgPGRpdiBjbGFzcz0iY21wLWhlYWQiPjxkaXYgY2xhc3M9ImJhY2siIG9uY2xpY2s9Im9wZW5TdG9yZSgnJHtjLnN0b3JlLmlkfScpIj7igLo8L2Rpdj48aDI+2YXZgtin2LHZhtipINin2YTYudix2YjYtjwvaDI+PHA+JHtjLnN0b3JlLm5hbWV9IMK3ICR7Y2FydENvdW50KCl9INi12YbZgSDCtyAke3N0YXRlLnVzZXIuYWRkcmVzcyB8fCBzdGF0ZS5jZmcubG9jYXRpb259PC9wPjwvZGl2PgogICAgPGRpdiBjbGFzcz0ic2F2ZS1iYW5uZXIiPjxkaXYgY2xhc3M9ImljIj7wn5KwPC9kaXY+PGRpdj48aDQ+2KPZgdi22YQg2LnYsdi2INi52KjYsSA8Yj4ke2Jlc3QuYXBwLm5hbWV9PC9iPiDYqNmAICR7bW9uZXkoYmVzdC50b3RhbCl9INixLtizPC9oND48cD4ke3NhdmluZyA+IDAgPyAn2KrZiNmB2ZHYsSA8YiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj4nICsgbW9uZXkoc2F2aW5nKSArICcg2LEu2LM8L2I+INmF2YLYp9ix2YbYqSDYqNij2LrZhNmJINiq2LfYqNmK2YInIDogJ9in2YTYo9iz2LnYp9ixINmF2KrZgtin2LHYqNipJ308L3A+PC9kaXY+PC9kaXY+CiAgICAke2MubGl2ZSA/IGA8ZGl2IHN0eWxlPSJtYXJnaW46MTBweCAxNnB4IDA7Zm9udC1zaXplOjExcHg7Y29sb3I6IzE2QTM0QTtmb250LXdlaWdodDo3MDA7ZGlzcGxheTpmbGV4O2dhcDo2cHg7bGluZS1oZWlnaHQ6MS42Ij48c3BhbiBzdHlsZT0iZm9udC1zaXplOjhweCI+4pePPC9zcGFuPiDYo9iz2LnYp9ixICR7Yy5saXZlLnNvdXJjZX0g2YXYqNin2LTYsdipIOKAlCDYqNin2YLZiiDYp9mE2KrYt9io2YrZgtin2Kog2KrZgtiv2YrYsdmK2Kk8L2Rpdj5gIDogJyd9CiAgICAke3N1YkFwcHMubGVuZ3RoID8gYDxkaXYgY2xhc3M9InN1YnMiPjxkaXYgY2xhc3M9ImxibCI+8J+On++4jyDZgdi52ZHZhCDYp9i02KrYsdin2YPYp9iq2YMgKNiq2YjYtdmK2YQg2YXYrNin2YbZiik6PC9kaXY+PGRpdiBjbGFzcz0ic3ViLWNoaXBzIj4ke3N1YkFwcHMubWFwKGlkID0+IGA8ZGl2IGNsYXNzPSJzdWItY2hpcCAke3N0YXRlLnN1YnNbaWRdID8gJ29uJyA6ICcnfSIgb25jbGljaz0idG9nZ2xlU3ViKCcke2lkfScpIj48c3BhbiBjbGFzcz0idGciPjwvc3Bhbj4ke2FwcHMoKVtpZF0uc3VifTwvZGl2PmApLmpvaW4oJycpfTwvZGl2PjwvZGl2PmAgOiAnJ30KICAgIDxkaXYgY2xhc3M9ImNtcC1saXN0Ij4ke29mZmVycy5tYXAoKG8sIGkpID0+IG9mZmVyQ2FyZChvLCBpID09PSAwLCBzYXZpbmcpKS5qb2luKCcnKX0KICAgICAgPGRpdiBjbGFzcz0iZGlzY2xhaW1lciI+PGI+2KrZhtmI2YrZhzo8L2I+INij2LPYudin2LEgJHtjLmxpdmUgPyBjLmxpdmUuc291cmNlIDogJ9mH2YbZgtix2LPYqtmK2LTZhid9INmF2LPYrdmI2KjYqSDZgdi52YTZitmL2KcuINix2LPZiNmFINin2YTYqtmI2LXZitmEINmI2KfZhNiu2LXZiNmF2KfYqiDZiNij2LPYudin2LEg2KjYp9mC2Yog2KfZhNiq2LfYqNmK2YLYp9iqINiq2YLYr9mK2LHZitipLiDYp9mE2KXZhtiq2KfYrCDYp9mE2YPYp9mF2YQg2YrYqti32YTYqCDYp9iq2YHYp9mC2YrYqSBBUEkuPC9kaXY+PC9kaXY+YDsKfQpmdW5jdGlvbiBvZmZlckNhcmQobywgaXNCZXN0LCBzYXZpbmcpIHsKICBjb25zdCBpc0xpdmUgPSBzdGF0ZS5jbXAubGl2ZSAmJiBvLmFwcElkID09PSBzdGF0ZS5jbXAubGl2ZS5hcHA7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJvZmZlciAke2lzQmVzdCA/ICdiZXN0JyA6ICcnfSIgb25jbGljaz0icGlja09mZmVyKCcke28uYXBwSWR9JykiPgogICAgJHtpc0Jlc3QgPyBgPGRpdiBjbGFzcz0icmliYm9uIj7irZAg2KPZgdi22YQg2LnYsdi2JHtzYXZpbmcgPiAwID8gJyDCtyDZiNmB2ZHYsSAnICsgbW9uZXkoc2F2aW5nKSArICcg2LEu2LMnIDogJyd9PC9kaXY+YCA6ICcnfQogICAgPGRpdiBjbGFzcz0ib2ZmZXItdG9wIj4ke2FwcExvZ28oby5hcHBJZCwgNDQpfTxkaXYgY2xhc3M9ImFubSI+PGg0PiR7by5hcHAubmFtZX08L2g0PgogICAgICA8ZGl2IGNsYXNzPSJzdWIiPjxzcGFuPuKPsSAke28uZXRhfTwvc3Bhbj4ke2lzTGl2ZSA/ICc8c3BhbiBzdHlsZT0iY29sb3I6IzE2QTM0QTtmb250LXdlaWdodDo4MDAiPuKXjyDYs9i52LEg2YXYqNin2LTYsTwvc3Bhbj4nIDogJzxzcGFuIHN0eWxlPSJjb2xvcjojOTRBM0I4Ij7YqtmC2K/Zitix2Yo8L3NwYW4+J30ke28uZnJlZURlbCA/ICc8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pO2ZvbnQtd2VpZ2h0OjgwMCI+2KrZiNi12YrZhCDZhdis2KfZhtmKIOKckzwvc3Bhbj4nIDogJyd9PC9kaXY+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InRvdCI+PGRpdiBjbGFzcz0iYmlnIj4ke21vbmV5KG8udG90YWwpfTwvZGl2PjxkaXYgY2xhc3M9ImN1ciI+2LEu2LM8L2Rpdj48L2Rpdj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImJyZWFrZG93biI+PGRpdiBjbGFzcz0iYnJvdyI+PHNwYW4+2LPYudixINin2YTYo9i12YbYp9mBPC9zcGFuPjxiPiR7bW9uZXkoby5zdWJ0b3RhbCl9INixLtizPC9iPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJicm93Ij48c3Bhbj7Ysdiz2YjZhSDYp9mE2KrZiNi12YrZhDwvc3Bhbj48Yj4ke28uZGVsaXZlcnkgPT09IDAgPyAnPHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWdyZWVuKSI+2YXYrNin2YbZijwvc3Bhbj4nIDogbW9uZXkoby5kZWxpdmVyeSkgKyAnINixLtizJ308L2I+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImJyb3ciPjxzcGFuPtix2LPZiNmFINin2YTYrtiv2YXYqTwvc3Bhbj48Yj4ke21vbmV5KG8uc2VydmljZSl9INixLtizPC9iPjwvZGl2PgogICAgICAke28uZGlzY291bnQgPiAwID8gYDxkaXYgY2xhc3M9ImJyb3cgZGlzYyI+PHNwYW4+2KfZhNiu2LXZhTwvc3Bhbj48Yj7iiJIgJHttb25leShvLmRpc2NvdW50KX0g2LEu2LM8L2I+PC9kaXY+YCA6ICcnfTwvZGl2PgogICAgJHtvLnByb21vTGFiZWwgPyBgPGRpdiBjbGFzcz0icHJvbW8tdGFnIj7wn46f77iPICR7by5wcm9tb0xhYmVsfTwvZGl2PmAgOiAnJ30KICAgIDxidXR0b24gY2xhc3M9InBpY2tidG4iPtin2LfZhNioINi52KjYsSAke28uYXBwLm5hbWV9IMK3ICR7bW9uZXkoby50b3RhbCl9INixLtizPC9idXR0b24+PC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3T2ZmZXJzKCkgewogIGNvbnN0IHJvd3MgPSBPYmplY3QuZW50cmllcyhhcHBzKCkpLmZpbHRlcigoW2lkLCBhXSkgPT4gYS5wcm9tb0xhYmVsKS5tYXAoKFtpZCwgYV0pID0+IGA8ZGl2IGNsYXNzPSJwcm9tby1jYXJkIj48ZGl2IGNsYXNzPSJwbCIgc3R5bGU9ImJhY2tncm91bmQ6JHthLmNvbG9yfTtjb2xvcjoke2EudGV4dH0iPiR7YS5zaG9ydH08L2Rpdj48ZGl2IGNsYXNzPSJwdCI+PGg1PiR7YS5uYW1lfTwvaDU+PHA+JHthLnByb21vTGFiZWx9PC9wPjwvZGl2PjxkaXYgY2xhc3M9ImNvZGUiPlNVUEVSJHthLnNob3J0Lmxlbmd0aH08L2Rpdj48L2Rpdj5gKS5qb2luKCcnKTsKICByZXR1cm4gYDxkaXYgY2xhc3M9InRvcGJhciI+PGRpdiBjbGFzcz0ibG9nbyI+PHNwYW4gY2xhc3M9Im1hcmsiPiU8L3NwYW4+INin2YTYudix2YjYtjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9InBhZCI+JHtyb3dzfTxkaXYgY2xhc3M9ImRpc2NsYWltZXIiPtin2YTYudix2YjYtiDYqtmI2LbZitit2YrYqSDZhNmE2YbZhdmI2LDYrC48L2Rpdj48L2Rpdj5gOwp9CmZ1bmN0aW9uIHZpZXdQcm9maWxlKCkgewogIGNvbnN0IHUgPSBzdGF0ZS51c2VyOwogIGNvbnN0IHN1YlJvd3MgPSBPYmplY3QuZW50cmllcyhhcHBzKCkpLmZpbHRlcigoW2lkLCBhXSkgPT4gYS5zdWIpLm1hcCgoW2lkLCBhXSkgPT4gYDxkaXYgY2xhc3M9ImFjYy1yb3ciPjxkaXYgY2xhc3M9ImwiPjxzcGFuIGNsYXNzPSJpYyI+8J+On++4jzwvc3Bhbj4ke2Euc3VifTwvZGl2PjxkaXYgY2xhc3M9InN3aXRjaCAke3N0YXRlLnN1YnNbaWRdID8gJ29uJyA6ICcnfSIgb25jbGljaz0idG9nZ2xlU3ViKCcke2lkfScpIj48aT48L2k+PC9kaXY+PC9kaXY+YCkuam9pbignJyk7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJwcm9mLWhlYWQiPjxkaXYgY2xhc3M9ImF2Ij4ke3UubmFtZVswXSB8fCAn8J+RpCd9PC9kaXY+PGgyPiR7dS5uYW1lfTwvaDI+PHA+JHt1LmVtYWlsfTwvcD4KICAgIDxzcGFuIGNsYXNzPSJ2YmFkZ2UiPiR7dS52ZXJpZmllZCA/ICfinJMg2K3Ys9in2Kgg2YXZgdi52ZHZhCcgOiAn2LrZitixINmF2YHYudmR2YQnfSR7dS5pc0FkbWluID8gJyDCtyDZhdiv2YrYsScgOiAnJ308L3NwYW4+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJwYWQiPgogICAgICA8ZGl2IGNsYXNzPSJhY2MtY2FyZCI+PGg0IHN0eWxlPSJtYXJnaW4tYm90dG9tOjhweCI+2LnZhtmI2KfZhiDYp9mE2KrZiNi12YrZhDwvaDQ+CiAgICAgICAgPGRpdiBjbGFzcz0iZmllbGQiIHN0eWxlPSJtYXJnaW46MCI+PGlucHV0IGlkPSJwQWRkciIgdmFsdWU9IiR7dS5hZGRyZXNzIHx8ICcnfSIgLz48L2Rpdj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4tc29mdCIgb25jbGljaz0ic2F2ZUFkZHIoKSI+2K3Zgdi4INin2YTYudmG2YjYp9mGPC9idXR0b24+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImFjYy1jYXJkIj48aDQgc3R5bGU9Im1hcmdpbi1ib3R0b206NnB4Ij7Yp9i02KrYsdin2YPYp9iq2Yo8L2g0PjxwIHN0eWxlPSJtYXJnaW4tYm90dG9tOjZweCI+2KrZj9it2KrYs9ioINmB2Yog2KfZhNmF2YLYp9ix2YbYqSAo2KrZiNi12YrZhCDZhdis2KfZhtmKKS48L3A+JHtzdWJSb3dzfTwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJhY2MtY2FyZCI+PGg0IHN0eWxlPSJtYXJnaW4tYm90dG9tOjZweCI+2KfZhNix2KjYtyDYp9mE2K3ZijwvaDQ+PHA+JHtzdGF0ZS5jZmcubGl2ZSA/IGDZhdmB2LnZkdmEINmF2LkgJHtzdGF0ZS5jZmcubGl2ZS5zb3VyY2V9IMK3ICR7c3RhdGUuY2ZnLmxpdmUuZmV0Y2hlZEF0fWAgOiAn2LrZitixINmF2YHYudmR2YQnfTwvcD4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJidG4tc29mdCIgaWQ9InJlZnJlc2hCdG4iIG9uY2xpY2s9InJlZnJlc2hMaXZlKCkiPvCflIQg2KrYrdiv2YrYqyDYp9mE2KPYs9i52KfYsSDYp9mE2K3ZitipPC9idXR0b24+PC9kaXY+CiAgICAgICR7dS5pc0FkbWluID8gYDxidXR0b24gY2xhc3M9ImJ0bi1zb2Z0IiBvbmNsaWNrPSJvcGVuQWRtaW4oKSI+8J+boe+4jyDZhNmI2K3YqSDYp9mE2KrYrdmD2YUgKNin2YTYotiv2YXZhik8L2J1dHRvbj5gIDogJyd9CiAgICAgIDxidXR0b24gY2xhc3M9ImJ0bi1kYW5nZXIiIG9uY2xpY2s9ImRvTG9nb3V0KCkiPtiq2LPYrNmK2YQg2KfZhNiu2LHZiNisPC9idXR0b24+CiAgICAgIDxkaXYgY2xhc3M9ImRpc2NsYWltZXIiIHN0eWxlPSJwYWRkaW5nOjE2cHggNHB4Ij7Ys9mI2KjYsSDYotioIMK3INmF2YbYtdipINmF2YLYp9ix2YbYqSDYp9mE2KrZiNi12YrZhDwvZGl2PgogICAgPC9kaXY+YDsKfQpmdW5jdGlvbiB2aWV3QWRtaW4oKSB7CiAgY29uc3QgdXMgPSBzdGF0ZS5hZG1pbi51c2VyczsKICBjb25zdCB2ZXJpZmllZCA9IHVzID8gdXMuZmlsdGVyKHUgPT4gdS52ZXJpZmllZCkubGVuZ3RoIDogMDsKICByZXR1cm4gYDxkaXYgY2xhc3M9InRvcGJhciI+PGRpdiBjbGFzcz0iYnJhbmRyb3ciPjxkaXYgY2xhc3M9ImxvZ28iPjxzcGFuIGNsYXNzPSJtYXJrIiBvbmNsaWNrPSJzZXRUYWIoJ2FjY291bnQnKSIgc3R5bGU9ImN1cnNvcjpwb2ludGVyIj7igLk8L3NwYW4+INmE2YjYrdipINin2YTYqtit2YPZhTwvZGl2PjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0icGFkIj4KICAgICAgJHt1cyA/IGA8ZGl2IGNsYXNzPSJzdGF0LXJvdyI+PGRpdiBjbGFzcz0ic3RhdCI+PGRpdiBjbGFzcz0ibiI+JHt1cy5sZW5ndGh9PC9kaXY+PGRpdiBjbGFzcz0ibCI+2KXYrNmF2KfZhNmKINin2YTZhdiz2KzZkdmE2YrZhjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9InN0YXQiPjxkaXYgY2xhc3M9Im4iPiR7dmVyaWZpZWR9PC9kaXY+PGRpdiBjbGFzcz0ibCI+2K3Ys9in2KjYp9iqINmF2YHYudmR2YTYqTwvZGl2PjwvZGl2PjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InNlY3Rpb24taCI+PGgzPtin2YTZhdiz2KrYrtiv2YXZiNmGPC9oMz48L2Rpdj4KICAgICAgICAke3VzLm1hcChhZG1pblVzZXJSb3cpLmpvaW4oJycpfWAgOiBgPGRpdiBjbGFzcz0ibG9hZGluZyI+PHNwYW4gY2xhc3M9InNwaW4iPjwvc3Bhbj4g2KzYp9ix2Yog2KfZhNiq2K3ZhdmK2YTigKY8L2Rpdj5gfQogICAgPC9kaXY+YDsKfQpmdW5jdGlvbiBhZG1pblVzZXJSb3codSkgewogIHJldHVybiBgPGRpdiBjbGFzcz0idXNlci1yb3ciPjxkaXYgY2xhc3M9ImF2Ij4ke3UubmFtZVswXSB8fCAnPyd9PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJ1aSI+PGg1PiR7dS5uYW1lfTwvaDU+PHA+JHt1LmVtYWlsfTwvcD4KICAgICAgPGRpdiBjbGFzcz0idGFncy1yb3ciPjxzcGFuIGNsYXNzPSJ0YWd2ICR7dS52ZXJpZmllZCA/ICd5JyA6ICduJ30iPiR7dS52ZXJpZmllZCA/ICfZhdmB2LnZkdmEJyA6ICfYutmK2LEg2YXZgdi52ZHZhCd9PC9zcGFuPiR7dS5pc0FkbWluID8gJzxzcGFuIGNsYXNzPSJ0YWd2IGEiPtmF2K/ZitixPC9zcGFuPicgOiAnJ308L2Rpdj48L2Rpdj4KICAgICR7dS5pZCA9PT0gc3RhdGUudXNlci5pZCA/ICc8c3BhbiBzdHlsZT0iZm9udC1zaXplOjEwcHg7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtd2VpZ2h0OjcwMCI+2KPZhtiqPC9zcGFuPicgOiBgPGJ1dHRvbiBjbGFzcz0iZGVsIiBvbmNsaWNrPSJkZWxVc2VyKCR7dS5pZH0pIj7Yrdiw2YE8L2J1dHRvbj5gfTwvZGl2PmA7Cn0KCi8qIC0tLS0tLS0tLS0g2YXZiNiv2KfZhCDYp9mE2KrYrdmI2YrZhCAtLS0tLS0tLS0tICovCmZ1bmN0aW9uIHNob3dIYW5kb2ZmKGFwcElkKSB7CiAgY29uc3QgbyA9IHN0YXRlLmNtcC5vZmZlcnMuZmluZCh4ID0+IHguYXBwSWQgPT09IGFwcElkKTsKICBjb25zdCBtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IG0uY2xhc3NOYW1lID0gJ21vZGFsLWJnJzsgbS5pZCA9ICdtb2RhbCc7IG0ub25jbGljayA9IGUgPT4geyBpZiAoZS50YXJnZXQgPT09IG0pIGNsb3NlTW9kYWwoKTsgfTsKICBtLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJzaGVldCI+PGRpdiBjbGFzcz0iZ3JpcCI+PC9kaXY+PGRpdiBjbGFzcz0iaCI+JHthcHBMb2dvKGFwcElkLCA1MCl9PGRpdj48aDM+JHtvLmFwcC5uYW1lfTwvaDM+PHA+JHtvLmV0YX0gwrcgJHtzdGF0ZS51c2VyLmFkZHJlc3MgfHwgc3RhdGUuY2ZnLmxvY2F0aW9ufTwvcD48L2Rpdj48L2Rpdj4KICAgIDxkaXYgY2xhc3M9InN1bSI+PGRpdiBjbGFzcz0iciI+PHNwYW4+JHtzdGF0ZS5jbXAuc3RvcmUubmFtZX0gwrcgJHtjYXJ0Q291bnQoKX0g2LXZhtmBPC9zcGFuPjxiPiR7bW9uZXkoby5zdWJ0b3RhbCl9INixLtizPC9iPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJyIj48c3Bhbj7Yp9mE2KrZiNi12YrZhDwvc3Bhbj48Yj4ke28uZGVsaXZlcnkgPT09IDAgPyAn2YXYrNin2YbZiicgOiBtb25leShvLmRlbGl2ZXJ5KSArICcg2LEu2LMnfTwvYj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iciI+PHNwYW4+2KfZhNiu2K/ZhdipPC9zcGFuPjxiPiR7bW9uZXkoby5zZXJ2aWNlKX0g2LEu2LM8L2I+PC9kaXY+CiAgICAgICR7by5kaXNjb3VudCA+IDAgPyBgPGRpdiBjbGFzcz0iciI+PHNwYW4gc3R5bGU9ImNvbG9yOnZhcigtLWdyZWVuKSI+2KfZhNiu2LXZhTwvc3Bhbj48YiBzdHlsZT0iY29sb3I6dmFyKC0tZ3JlZW4pIj7iiJIgJHttb25leShvLmRpc2NvdW50KX0g2LEu2LM8L2I+PC9kaXY+YCA6ICcnfQogICAgICA8ZGl2IGNsYXNzPSJyIHR0Ij48c3Bhbj7Yp9mE2KXYrNmF2KfZhNmKPC9zcGFuPjxzcGFuPiR7bW9uZXkoby50b3RhbCl9INixLtizPC9zcGFuPjwvZGl2PjwvZGl2PgogICAgPGRpdiBjbGFzcz0ibm90ZSI+8J+UkiA8Yj7ZhNmE2KrYo9mD2YrYryDZiNin2YTYr9mB2Lk6PC9iPiDYs9mK2K3ZiNmR2YTZgyDYs9mI2KjYsSDYotioINil2YTZiSAke28uYXBwLm5hbWV9INmE2KXZg9mF2KfZhCDYt9mE2KjZgyDYqNmG2YHYs9mDLiDZhNinINmG2KrZhdmRINin2YTYr9mB2Lkg2YbZitin2KjYqdmLINi52YbZgy48L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImN0YSI+PGJ1dHRvbiBjbGFzcz0iY2FuY2VsIiBvbmNsaWNrPSJjbG9zZU1vZGFsKCkiPtix2KzZiNi5PC9idXR0b24+PGJ1dHRvbiBjbGFzcz0iZ28iIG9uY2xpY2s9ImNsb3NlTW9kYWwoKSI+2KrYrdmI2YrZhCDYpdmE2YkgJHtvLmFwcC5uYW1lfSDigLo8L2J1dHRvbj48L2Rpdj48L2Rpdj5gOwogIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waG9uZScpLmFwcGVuZENoaWxkKG0pOwp9CmZ1bmN0aW9uIGNsb3NlTW9kYWwoKSB7IGNvbnN0IG0gPSAkKCdtb2RhbCcpOyBpZiAobSkgbS5yZW1vdmUoKTsgfQoKLyogLS0tLS0tLS0tLSDYqtmG2YLZkdmEIC0tLS0tLS0tLS0gKi8KZnVuY3Rpb24gdmlld0J5VGFiKCkgewogIGlmIChzdGF0ZS50YWIgPT09ICdvZmZlcnMnKSByZXR1cm4gdmlld09mZmVycygpOwogIGlmIChzdGF0ZS50YWIgPT09ICdhY2NvdW50JykgcmV0dXJuIHN0YXRlLnNjcmVlbiA9PT0gJ2FkbWluJyA/IHZpZXdBZG1pbigpIDogdmlld1Byb2ZpbGUoKTsKICBpZiAoc3RhdGUuc2NyZWVuID09PSAnc3RvcmUnKSByZXR1cm4gdmlld1N0b3JlKCk7CiAgaWYgKHN0YXRlLnNjcmVlbiA9PT0gJ2NvbXBhcmUnKSByZXR1cm4gdmlld0NvbXBhcmUoKTsKICBpZiAoc3RhdGUuc2NyZWVuID09PSAnbGlzdCcpIHJldHVybiB2aWV3TGlzdCgpOwogIHJldHVybiB2aWV3SG9tZSgpOwp9CmZ1bmN0aW9uIG5hdkJhcigpIHsKICByZXR1cm4gW1snaG9tZScsICfwn4+gJywgJ9in2YTYsdim2YrYs9mK2KknXSwgWydvZmZlcnMnLCAnJScsICfYp9mE2LnYsdmI2LYnXSwgWydvcmRlcnMnLCAn8J+nvicsICfYp9mE2LfZhNio2KfYqiddLCBbJ2FjY291bnQnLCAn8J+RpCcsICfYrdiz2KfYqNmKJ11dCiAgICAubWFwKChbaywgaWMsIGxiXSkgPT4gYDxidXR0b24gY2xhc3M9IiR7c3RhdGUudGFiID09PSBrID8gJ2FjdGl2ZScgOiAnJ30iIG9uY2xpY2s9InNldFRhYignJHtrfScpIj48c3BhbiBjbGFzcz0ibmkiPiR7aWN9PC9zcGFuPiR7bGJ9PC9idXR0b24+YCkuam9pbignJyk7Cn0KZnVuY3Rpb24gcmVuZGVyKCkgewogIGlmICghc3RhdGUudXNlcikgeyAkKCdzY3JlZW4nKS5pbm5lckhUTUwgPSB2aWV3QXV0aCgpOyAkKCduYXYnKS5pbm5lckhUTUwgPSAnJzsgJCgnc2NyZWVuJykuc2Nyb2xsVG9wID0gMDsgcmV0dXJuOyB9CiAgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gdmlld0J5VGFiKCk7CiAgJCgnbmF2JykuaW5uZXJIVE1MID0gbmF2QmFyKCk7CiAgJCgnc2NyZWVuJykuc2Nyb2xsVG9wID0gMDsKfQoKLyogLS0tLS0tLS0tLSDYo9it2K/Yp9irIC0tLS0tLS0tLS0gKi8KZnVuY3Rpb24gc2V0VGFiKGspIHsgaWYgKGsgPT09ICdvcmRlcnMnKSB7IGFsZXJ0KCfYtNin2LTYqSDYp9mE2LfZhNio2KfYqiDigJQg2YLYsdmK2KjZi9inLicpOyByZXR1cm47IH0gc3RhdGUudGFiID0gazsgaWYgKGsgPT09ICdob21lJykgeyBzdGF0ZS5zY3JlZW4gPSAnaG9tZSc7IHN0YXRlLnF1ZXJ5ID0gJyc7IH0gZWxzZSBzdGF0ZS5zY3JlZW4gPSBrID09PSAnYWNjb3VudCcgPyAncHJvZmlsZScgOiAnaG9tZSc7IHJlbmRlcigpOyB9CmZ1bmN0aW9uIHNldE1vZGUobSkgeyBzdGF0ZS5tb2RlID0gbTsgc3RhdGUudGFiID0gJ2hvbWUnOyBzdGF0ZS5zY3JlZW4gPSAnbGlzdCc7IHJlbmRlcigpOyB9CmZ1bmN0aW9uIGdvSG9tZSgpIHsgc3RhdGUudGFiID0gJ2hvbWUnOyBzdGF0ZS5zY3JlZW4gPSAnaG9tZSc7IHN0YXRlLnF1ZXJ5ID0gJyc7IHJlbmRlcigpOyB9CmFzeW5jIGZ1bmN0aW9uIG9wZW5TdG9yZShpZCkgewogICQoJ3NjcmVlbicpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPSJsb2FkaW5nIj48c3BhbiBjbGFzcz0ic3BpbiI+PC9zcGFuPiDYrNin2LHZiiDYp9mE2YHYqtit4oCmPC9kaXY+YDsKICB0cnkgeyBzdGF0ZS5zdG9yZSA9IGF3YWl0IGFwaSgnL2FwaS9zdG9yZXMvJyArIGlkKTsgc3RhdGUuY2FydCA9IHt9OyBzdGF0ZS50YWIgPSAnaG9tZSc7IHN0YXRlLnNjcmVlbiA9ICdzdG9yZSc7IHJlbmRlcigpOyB9CiAgY2F0Y2ggKGUpIHsgJCgnc2NyZWVuJykuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9ImVtcHR5Ij48ZGl2IGNsYXNzPSJlIj7imqDvuI88L2Rpdj48aDM+JHtlLm1lc3NhZ2V9PC9oMz48L2Rpdj5gOyB9Cn0KYXN5bmMgZnVuY3Rpb24gZ29Db21wYXJlKCkgeyBzdGF0ZS5zY3JlZW4gPSAnY29tcGFyZSc7IHN0YXRlLmNtcCA9IG51bGw7IHJlbmRlcigpOyBhd2FpdCByZWZyZXNoQ29tcGFyZSgpOyB9CmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDb21wYXJlKCkgewogIHN0YXRlLmNtcCA9IGF3YWl0IGFwaSgnL2FwaS9jb21wYXJlJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdG9yZUlkOiBzdGF0ZS5zdG9yZS5pZCwgY2FydDogc3RhdGUuY2FydCwgc3Viczogc3RhdGUuc3VicyB9KSB9KTsKICBpZiAoc3RhdGUuc2NyZWVuID09PSAnY29tcGFyZScpIHJlbmRlcigpOwp9CmZ1bmN0aW9uIGluYyhpZCkgeyBzdGF0ZS5jYXJ0W2lkXSA9IChzdGF0ZS5jYXJ0W2lkXSB8fCAwKSArIDE7IHJlbmRlcigpOyB9CmZ1bmN0aW9uIGRlYyhpZCkgeyBzdGF0ZS5jYXJ0W2lkXSA9IE1hdGgubWF4KDAsIChzdGF0ZS5jYXJ0W2lkXSB8fCAwKSAtIDEpOyBpZiAoIXN0YXRlLmNhcnRbaWRdKSBkZWxldGUgc3RhdGUuY2FydFtpZF07IHJlbmRlcigpOyB9CmZ1bmN0aW9uIG9uU2VhcmNoKHYpIHsgc3RhdGUucXVlcnkgPSB2OyAkKCdzY3JlZW4nKS5pbm5lckhUTUwgPSB2aWV3QnlUYWIoKTsgY29uc3QgaSA9ICQoJ3EnKTsgaWYgKGkpIHsgaS5mb2N1cygpOyBpLnNldFNlbGVjdGlvblJhbmdlKHYubGVuZ3RoLCB2Lmxlbmd0aCk7IH0gfQphc3luYyBmdW5jdGlvbiB0b2dnbGVTdWIoaWQpIHsgc3RhdGUuc3Vic1tpZF0gPSAhc3RhdGUuc3Vic1tpZF07IGlmIChzdGF0ZS50YWIgPT09ICdhY2NvdW50JykgcmVuZGVyKCk7IGVsc2UgaWYgKHN0YXRlLnNjcmVlbiA9PT0gJ2NvbXBhcmUnKSBhd2FpdCByZWZyZXNoQ29tcGFyZSgpOyBlbHNlIHJlbmRlcigpOyB9CmZ1bmN0aW9uIHBpY2tPZmZlcihpZCkgeyBzaG93SGFuZG9mZihpZCk7IH0KYXN5bmMgZnVuY3Rpb24gdG9nZ2xlRmF2KGlkKSB7CiAgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9wcm9maWxlL2Zhdm9yaXRlcycsIHsgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3RvcmVJZDogaWQgfSkgfSk7IHN0YXRlLnVzZXIuZmF2b3JpdGVzID0gci5mYXZvcml0ZXM7IHJlbmRlcigpOyB9CiAgY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIHNhdmVBZGRyKCkgewogIGNvbnN0IGFkZHJlc3MgPSB2YWwoJ3BBZGRyJyk7IGlmICghYWRkcmVzcykgcmV0dXJuOwogIHRyeSB7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvcHJvZmlsZScsIHsgbWV0aG9kOiAnUFVUJywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZGRyZXNzIH0pIH0pOyBzdGF0ZS51c2VyID0geyAuLi5zdGF0ZS51c2VyLCAuLi5yLnVzZXIgfTsgYWxlcnQoJ+KchSDYqtmFINit2YHYuCDYp9mE2LnZhtmI2KfZhicpOyByZW5kZXIoKTsgfQogIGNhdGNoIChlKSB7IGFsZXJ0KGUubWVzc2FnZSk7IH0KfQphc3luYyBmdW5jdGlvbiByZWZyZXNoTGl2ZSgpIHsKICBjb25zdCBiID0gJCgncmVmcmVzaEJ0bicpOyBpZiAoYikgeyBiLmRpc2FibGVkID0gdHJ1ZTsgYi50ZXh0Q29udGVudCA9ICfij7Mg2KzYp9ix2Yog2KfZhNiz2K3YqOKApic7IH0KICB0cnkgeyBjb25zdCByID0gYXdhaXQgYXBpKCcvYXBpL3JlZnJlc2gtbGl2ZScsIHsgbWV0aG9kOiAnUE9TVCcgfSk7IHN0YXRlLmNmZyA9IGF3YWl0IGFwaSgnL2FwaS9jb25maWcnKTsgc3RhdGUuc3RvcmVzID0gYXdhaXQgYXBpKCcvYXBpL3N0b3JlcycpOyBhbGVydChg4pyFINiq2YUg2KrYrdiv2YrYqyAke3IucHJpY2VzfSDYs9i52LFgKTsgcmVuZGVyKCk7IH0KICBjYXRjaCAoZSkgeyBhbGVydCgn4p2MICcgKyBlLm1lc3NhZ2UgKyAnXG7Yq9io2ZHYqiBQdXBwZXRlZXI6IG5wbSBpIHB1cHBldGVlcicpOyBpZiAoYikgeyBiLmRpc2FibGVkID0gZmFsc2U7IGIudGV4dENvbnRlbnQgPSAn8J+UhCDYqtit2K/ZitirINin2YTYo9iz2LnYp9ixINin2YTYrdmK2KknOyB9IH0KfQphc3luYyBmdW5jdGlvbiBvcGVuQWRtaW4oKSB7IHN0YXRlLnRhYiA9ICdhY2NvdW50Jzsgc3RhdGUuc2NyZWVuID0gJ2FkbWluJzsgc3RhdGUuYWRtaW4udXNlcnMgPSBudWxsOyByZW5kZXIoKTsgdHJ5IHsgY29uc3QgciA9IGF3YWl0IGFwaSgnL2FwaS9hZG1pbi91c2VycycpOyBzdGF0ZS5hZG1pbi51c2VycyA9IHIudXNlcnM7IHJlbmRlcigpOyB9IGNhdGNoIChlKSB7IGFsZXJ0KGUubWVzc2FnZSk7IH0gfQphc3luYyBmdW5jdGlvbiBkZWxVc2VyKGlkKSB7IGlmICghY29uZmlybSgn2K3YsNmBINmH2LDYpyDYp9mE2YXYs9iq2K7Yr9mF2J8nKSkgcmV0dXJuOyB0cnkgeyBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vdXNlcnMvJyArIGlkLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7IGNvbnN0IHIgPSBhd2FpdCBhcGkoJy9hcGkvYWRtaW4vdXNlcnMnKTsgc3RhdGUuYWRtaW4udXNlcnMgPSByLnVzZXJzOyByZW5kZXIoKTsgfSBjYXRjaCAoZSkgeyBhbGVydChlLm1lc3NhZ2UpOyB9IH0KCi8qINiq2LXYr9mK2LEg2YTZhNmG2LfYp9mCINin2YTYudin2YUgKi8KT2JqZWN0LmFzc2lnbih3aW5kb3csIHsgYXV0aFZpZXcsIGRvUmVnaXN0ZXIsIGRvVmVyaWZ5LCBkb1Jlc2VuZCwgZG9Mb2dpbiwgZG9Gb3Jnb3QsIGRvUmVzZXQsIGRvTG9nb3V0LAogIHNldFRhYiwgc2V0TW9kZSwgZ29Ib21lLCBvcGVuU3RvcmUsIGdvQ29tcGFyZSwgaW5jLCBkZWMsIG9uU2VhcmNoLCB0b2dnbGVTdWIsIHBpY2tPZmZlciwgY2xvc2VNb2RhbCwKICB0b2dnbGVGYXYsIHNhdmVBZGRyLCByZWZyZXNoTGl2ZSwgb3BlbkFkbWluLCBkZWxVc2VyIH0pOwoKaW5pdCgpOwo=" } };
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
