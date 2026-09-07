import "dotenv/config";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// ─── scrypt password hashing (shared format with backend/lib/security.ts) ───
const SCRYPT_N = 16384, SCRYPT_R = 8, SCRYPT_P = 1, KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, , , , saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, "base64");
  const expected = Buffer.from(hashB64!, "base64");
  const actual = scryptSync(password, salt, expected.length, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return timingSafeEqual(actual, expected);
}

// ─── Roles & permission matrix (mirrors frontend src/lib/farazz/data.ts) ───
const ROLES = [
  "Super Admin",
  "Operations Manager",
  "Warehouse Manager",
  "Fleet Manager",
  "Finance",
  "Customer Service",
  "Dispatcher",
  "Warehouse Staff",
  "Driver",
] as const;

const MODULES = [
  "Dashboard", "Shipments", "Orders", "Warehouse", "Inventory",
  "Fleet", "Delivery", "Customers", "Suppliers", "Finance",
  "Analytics", "Settings",
] as const;

const LEVELS = ["view", "create", "edit", "approve", "delete"] as const;

/** Copy of the frontend defaultMatrix() logic, kept in sync manually. */
function levelFor(role: string, mod: string): { view: string[] } | null {
  if (role === "Super Admin") return { view: [...LEVELS] };
  if (role === "Operations Manager")
    return { view: mod === "Settings" ? ["view"] : ["view", "create", "edit", "approve"] };
  if (role === "Warehouse Manager")
    return {
      view: ["Warehouse", "Inventory", "Dashboard", "Shipments"].includes(mod)
        ? ["view", "create", "edit", "approve"]
        : mod === "Finance" || mod === "Settings" ? [] : ["view"],
    };
  if (role === "Fleet Manager")
    return {
      view: ["Fleet", "Delivery", "Dashboard"].includes(mod)
        ? ["view", "create", "edit", "approve"]
        : mod === "Finance" || mod === "Settings" ? [] : ["view"],
    };
  if (role === "Finance")
    return {
      view: ["Finance", "Dashboard", "Analytics", "Customers"].includes(mod)
        ? ["view", "create", "edit", "approve"]
        : mod === "Settings" ? [] : ["view"],
    };
  if (role === "Customer Service")
    return {
      view: ["Shipments", "Orders", "Delivery", "Customers", "Dashboard"].includes(mod)
        ? ["view", "create", "edit"] : [],
    };
  if (role === "Dispatcher")
    return {
      view: ["Fleet", "Delivery", "Shipments", "Dashboard"].includes(mod)
        ? ["view", "create", "edit"] : [],
    };
  if (role === "Warehouse Staff")
    return {
      view: ["Warehouse", "Inventory"].includes(mod) ? ["view", "create"] : mod === "Dashboard" ? ["view"] : [],
    };
  // Driver
  return { view: ["Delivery", "Dashboard"].includes(mod) ? ["view"] : [] };
}

// ─── Users (dev accounts, scrypt-hashed) ───
const USERS: { name: string; email: string; phone: string; role: string; department: string; status: "active" | "inactive" }[] = [
  { name: "Faraz", email: "faraz@farazzflow.example.com", phone: "0812-1000-2200", role: "Super Admin", department: "IT & Systems", status: "active" },
  { name: "Andi Prasetyo", email: "andi.prasetyo@farazzflow.example.com", phone: "0812-3300-1122", role: "Operations Manager", department: "Operations", status: "active" },
  { name: "Sri Wahyuni", email: "sri.wahyuni@farazzflow.example.com", phone: "0813-4400-8811", role: "Warehouse Manager", department: "Warehouse · Jakarta", status: "active" },
  { name: "Fajar Nugraha", email: "fajar.nugraha@farazzflow.example.com", phone: "0857-8800-4411", role: "Fleet Manager", department: "Fleet", status: "active" },
  { name: "Lina Marlina", email: "lina.marlina@farazzflow.example.com", phone: "0811-5500-3322", role: "Finance", department: "Finance", status: "active" },
  { name: "Rendi Saputra", email: "rendi.saputra@farazzflow.example.com", phone: "0819-2200-7744", role: "Dispatcher", department: "Operations · Semarang", status: "active" },
  { name: "Nadia Puspita", email: "nadia.puspita@farazzflow.example.com", phone: "0838-6600-9911", role: "Customer Service", department: "Customer Care", status: "active" },
  { name: "Budi Santoso", email: "budi.santoso@farazzflow.example.com", phone: "0812-3344-1100", role: "Driver", department: "Fleet · Semarang", status: "active" },
  { name: "Tono Wibowo", email: "tono.wibowo@farazzflow.example.com", phone: "0821-7700-2255", role: "Warehouse Staff", department: "Warehouse · Surabaya", status: "inactive" },
  // Test accounts across roles
  { name: "Test Ops", email: "test.ops@farazzflow.example.com", phone: "0800-0000-0001", role: "Operations Manager", department: "Testing", status: "active" },
  { name: "Test Warehouse", email: "test.warehouse@farazzflow.example.com", phone: "0800-0000-0002", role: "Warehouse Staff", department: "Testing", status: "active" },
  { name: "Test Fleet", email: "test.fleet@farazzflow.example.com", phone: "0800-0000-0003", role: "Fleet Manager", department: "Testing", status: "active" },
  { name: "Test Finance", email: "test.finance@farazzflow.example.com", phone: "0800-0000-0004", role: "Finance", department: "Testing", status: "active" },
  { name: "Test Dispatcher", email: "test.dispatcher@farazzflow.example.com", phone: "0800-0000-0005", role: "Dispatcher", department: "Testing", status: "active" },
  { name: "Test CS", email: "test.cs@farazzflow.example.com", phone: "0800-0000-0006", role: "Customer Service", department: "Testing", status: "active" },
  { name: "Test Driver", email: "test.driver@farazzflow.example.com", phone: "0800-0000-0007", role: "Driver", department: "Testing", status: "active" },
];

const DEV_PASSWORD = "Admin123!";

async function main() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "farazz_flow",
  });

  try {
    // 1. Roles (idempotent via code)
    const roleIds = new Map<string, number>();
    for (const role of ROLES) {
      await conn.execute(
        `INSERT INTO roles (code, name, description, is_system) VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [role.toLowerCase().replace(/[^a-z0-9]+/g, "_"), role, `${role} — system role`]
      );
      const [rows] = await conn.query<mysql2Row[]>("SELECT id FROM roles WHERE code = ?", [
        role.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      ]);
      roleIds.set(role, Number(rows[0]!.id));
    }

    // 2. Permissions (module.action) idempotent via code
    const permissionIds = new Map<string, number>();
    for (const mod of MODULES) {
      for (const level of LEVELS) {
        const code = `${mod.toLowerCase()}.${level}`;
        await conn.execute(
          `INSERT IGNORE INTO permissions (code, module, action, name) VALUES (?, ?, ?, ?)`,
          [code, mod, level, `${mod} — ${level}`]
        );
        const [rows] = await conn.query<mysql2Row[]>("SELECT id FROM permissions WHERE code = ?", [code]);
        permissionIds.set(code, Number(rows[0]!.id));
      }
    }

    // 3. role_permissions from the frontend matrix
    let rolePermCount = 0;
    for (const role of ROLES) {
      const roleId = roleIds.get(role)!;
      for (const mod of MODULES) {
        const levels = levelFor(role, mod)?.view ?? [];
        for (const level of levels) {
          const permId = permissionIds.get(`${mod.toLowerCase()}.${level}`)!;
          await conn.execute(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [roleId, permId]
          );
          rolePermCount++;
        }
      }
    }

    // 4. Users (upsert by email)
    for (const u of USERS) {
      await conn.execute(
        `INSERT INTO users (name, email, phone, role_id, department, password_hash, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), phone = VALUES(phone), role_id = VALUES(role_id),
           department = VALUES(department), password_hash = VALUES(password_hash), status = VALUES(status)`,
        [u.name, u.email, u.phone, roleIds.get(u.role)!, u.department, hashPassword(DEV_PASSWORD), u.status]
      );
    }

    // 5. System settings
    await conn.execute(
      `INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [
        "company_profile",
        JSON.stringify({
          name: "FARAZZ FLOW Logistics Indonesia",
          companyId: "FZF-ID-0001",
          address: "Menara Farazz, Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan 12190",
          phone: "+62 21 5099 8800",
          email: "operations@farazzflow.example.com",
          website: "www.farazzflow.example.com",
          taxId: "09.812.334.5-011.000",
          currency: "IDR",
          timezone: "Asia/Jakarta (GMT+7)",
          dateFormat: "DD MMM YYYY",
        }),
        "Company profile shown in Settings",
      ]
    );

    // 6. Service types
    const services: { code: string; name: string; description: string }[] = [
      { code: "EXP", name: "Express", description: "24h delivery" },
      { code: "REG", name: "Regular", description: "72h delivery" },
      { code: "ECO", name: "Economy Cargo", description: "120h delivery" },
      { code: "SDS", name: "Same Day Sameday", description: "12h delivery" },
      { code: "CLD", name: "Cold Chain", description: "48h temperature-controlled" },
    ];
    await conn.execute("DELETE FROM service_types");
    for (const s of services) {
      await conn.execute(
        `INSERT INTO service_types (code, name, description, status) VALUES (?, ?, ?, 'active')`,
        [s.code, s.name, s.description]
      );
    }

    // 7. Warehouses
    const warehouses: { code: string; name: string; city: string; capacity: number }[] = [
      { code: "WH-JKT-01", name: "Jakarta Central Hub", city: "Jakarta", capacity: 15000 },
      { code: "WH-SMG-01", name: "Semarang Hub", city: "Semarang", capacity: 9000 },
      { code: "WH-SLO-01", name: "Surakarta Hub", city: "Surakarta", capacity: 6000 },
      { code: "WH-SBY-01", name: "Surabaya Hub", city: "Surabaya", capacity: 12000 },
      { code: "WH-BDG-01", name: "Bandung Hub", city: "Bandung", capacity: 8000 },
      { code: "WH-MKS-01", name: "Makassar Hub", city: "Makassar", capacity: 5000 },
    ];
    await conn.execute("DELETE FROM warehouse_zones");
    await conn.execute("DELETE FROM warehouses");
    for (const w of warehouses) {
      await conn.execute(
        `INSERT INTO warehouses (code, name, city, capacity, used_capacity, status)
         VALUES (?, ?, ?, ?, 0, 'active')`,
        [w.code, w.name, w.city, w.capacity]
      );
    }

    // 8. Routes
    const routes: { code: string; name: string; origin: string; destination: string; distance_km: number }[] = [
      { code: "RT-JKT-SLO", name: "Jakarta → Surakarta Trunk", origin: "Jakarta", destination: "Surakarta", distance_km: 561 },
      { code: "RT-SMG-SLO", name: "Semarang → Surakarta Shuttle", origin: "Semarang", destination: "Surakarta", distance_km: 108 },
      { code: "RT-JKT-BDG", name: "Jakarta → Bandung Express", origin: "Jakarta", destination: "Bandung", distance_km: 151 },
      { code: "RT-SBY-MLG", name: "Surabaya → Malang Line", origin: "Surabaya", destination: "Malang", distance_km: 94 },
      { code: "RT-SLO-YOG", name: "Surakarta → Yogyakarta Feeder", origin: "Surakarta", destination: "Yogyakarta", distance_km: 65 },
    ];
    await conn.execute("DELETE FROM routes");
    for (const r of routes) {
      await conn.execute(
        `INSERT INTO routes (route_code, name, origin, destination, distance_km, estimated_min, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [r.code, r.name, r.origin, r.destination, r.distance_km, Math.round(r.distance_km * 60 / 45)]
      );
    }

    // 9. Customers (main ones from frontend)
    const customers: { code: string; name: string; city: string; type: string }[] = [
      { code: "CUS-000281", name: "PT Maju Bersama", city: "Jakarta", type: "both" },
      { code: "CUS-000317", name: "PT Nusantara Retail", city: "Semarang", type: "both" },
      { code: "CUS-000352", name: "PT Sumber Elektronik", city: "Surabaya", type: "shipper" },
      { code: "CUS-000398", name: "PT Global Distribusi", city: "Bandung", type: "shipper" },
    ];
    for (const c of customers) {
      await conn.execute(
        `INSERT IGNORE INTO customers (code, name, city, type, status) VALUES (?, ?, ?, ?, 'active')`,
        [c.code, c.name, c.city, c.type]
      );
    }

    const [counts] = await conn.query<mysql2Row[]>(`
      SELECT (SELECT COUNT(*) FROM users) users,
             (SELECT COUNT(*) FROM roles) roles,
             (SELECT COUNT(*) FROM permissions) permissions,
             (SELECT COUNT(*) FROM role_permissions) role_permissions,
             (SELECT COUNT(*) FROM warehouses) warehouses,
             (SELECT COUNT(*) FROM routes) routes,
             (SELECT COUNT(*) FROM service_types) service_types,
             (SELECT COUNT(*) FROM customers) customers
    `);

    const row = counts[0]!;
    console.log("\nSeed complete.");
    console.log("  users          :", row.users);
    console.log("  roles          :", row.roles);
    console.log("  permissions    :", row.permissions);
    console.log("  role_perms     :", row.role_permissions);
    console.log("  warehouses     :", row.warehouses);
    console.log("  routes         :", row.routes);
    console.log("  service_types  :", row.service_types);
    console.log("  customers      :", row.customers);
    console.log(`\nDev password for all accounts: ${DEV_PASSWORD}`);
    console.log("Super admin login:", USERS[0]!.email.toLowerCase(), "\n");

    // Self-check: verify hash round-trips
    const h = hashPassword("Admin123!");
    if (!verifyPassword("Admin123!", h)) throw new Error("Password hash round-trip failed!");
    console.log("scrypt hash round-trip: OK");
  } finally {
    await conn.end();
  }
}

interface mysql2Row extends RowDataPacket {
  id?: unknown;
  users?: unknown;
  roles?: unknown;
  permissions?: unknown;
  role_permissions?: unknown;
  warehouses?: unknown;
  routes?: unknown;
  service_types?: unknown;
  customers?: unknown;
}

main().catch((err) => {
  console.error("Seed failed:", err?.message ?? err);
  process.exit(1);
});