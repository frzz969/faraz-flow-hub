/**
 * NEXORA FLOW — mock master data + operational data.
 * Structured exactly as an API payload would be, so every collection can
 * later be swapped for a real endpoint without touching components.
 */

export type ID = string;
export type Status = string;

export interface Warehouse {
  id: ID;
  code: string;
  name: string;
  city: string;
  region: string;
  capacity: number;
  used: number;
  inbound: number;
  sorting: number;
  outbound: number;
  waiting: number;
  delayed: number;
  status: "operational" | "congested" | "critical";
  active: boolean;
}

export interface Customer {
  id: ID;
  code: string;
  name: string;
  contact: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  billingAddress: string;
  city: string;
  locations: string[];
  monthlySpend: number;
  performance: number;
  active: boolean;
}

export interface Supplier {
  id: ID;
  code: string;
  name: string;
  contact: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  taxId: string;
  bank: string;
  services: string;
  reliability: number;
  responseHours: number;
  transactions: number;
  contracts: number;
  active: boolean;
}

export interface ServiceType {
  id: ID;
  code: string;
  name: string;
  slaHours: number;
  baseRate: number;
  perKg: number;
  active: boolean;
}

export interface Vehicle {
  id: ID;
  code: string;
  model: string;
  plate: string;
  type: string;
  driverId: ID | null;
  routeId: ID | null;
  status: "on_route" | "idle" | "workshop" | "available";
  fuel: number;
  nextServiceKm: number;
  active: boolean;
}

export interface Driver {
  id: ID;
  code: string;
  name: string;
  phone: string;
  license: string;
  baseWarehouseId: ID;
  status: "on_route" | "available" | "idle";
  rating: number;
  deliveries: number;
  active: boolean;
}

export interface RouteRec {
  id: ID;
  code: string;
  name: string;
  stops: string[];
  distanceKm: number;
  estHours: number;
  actualHours: number;
  onTimeRate: number;
  vehicles: number;
  activeShipments: number;
  active: boolean;
}

export interface Category {
  id: ID;
  code: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: ID;
  sku: string;
  name: string;
  categoryId: ID;
  brand: string;
  unit: string;
  warehouseId: ID;
  total: number;
  available: number;
  reserved: number;
  processing: number;
  inTransit: number;
  damaged: number;
  returned: number;
  minStock: number;
  active: boolean;
}

export interface StockMovement {
  id: ID;
  productId: ID;
  date: string;
  type: "received" | "shipment" | "damaged" | "adjustment" | "return";
  qty: number;
  reference: string;
  user: string;
  warehouseId: ID;
}

export interface TrackingEvent {
  status: Status;
  label: string;
  location: string;
  timestamp: string;
  operator: string;
}

export interface Shipment {
  id: ID;
  tracking: string;
  customerId: ID;
  origin: string;
  destination: string;
  serviceId: ID;
  weight: number;
  pieces: number;
  contents: string;
  currentLocation: string;
  warehouseId: ID;
  status: Status;
  eta: string;
  updatedAt: string;
  routeId: ID;
  vehicleId: ID;
  driverId: ID;
  charge: number;
  events: TrackingEvent[];
}

export interface Order {
  id: ID;
  code: string;
  customerId: ID;
  items: number;
  packages: number;
  origin: string;
  destination: string;
  serviceId: ID;
  amount: number;
  status: Status;
  payment: "paid" | "unpaid" | "partially_paid";
  date: string;
  shipment: string;
}

export interface Delivery {
  id: ID;
  code: string;
  shipment: string;
  customerId: ID;
  address: string;
  driverId: ID;
  vehicleId: ID;
  routeId: ID;
  packages: number;
  attempts: number;
  status: Status;
  window: string;
  pod: string;
}

export interface ExceptionRec {
  id: ID;
  code: string;
  shipment: string;
  category: string;
  severity: "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  owner: string;
  expected: string;
  current: string;
  reason: string;
  action: string;
  vehicle: string;
  notes: string;
}

export interface ReturnRec {
  id: ID;
  code: string;
  shipment: string;
  customerId: ID;
  reason: string;
  condition: string;
  resolution: string;
  status: Status;
  date: string;
}

export interface InboundRec {
  id: ID;
  code: string;
  supplierId: ID;
  reference: string;
  warehouseId: ID;
  qty: number;
  expected: string;
  arrived: string;
  inspection: string;
  status: Status;
}

export interface SortingRec {
  id: ID;
  code: string;
  shipment: string;
  warehouseId: ID;
  zone: string;
  destination: string;
  nextHub: string;
  priority: "high" | "medium" | "low";
  status: Status;
}

export interface OutboundRec {
  id: ID;
  code: string;
  warehouseId: ID;
  shipments: number;
  packages: number;
  destination: string;
  vehicleId: ID;
  driverId: ID;
  dispatchTime: string;
  status: Status;
}

export interface Invoice {
  id: ID;
  code: string;
  customerId: ID;
  issued: string;
  due: string;
  base: number;
  weightCharge: number;
  distanceCharge: number;
  insurance: number;
  additional: number;
  tax: number;
  total: number;
  status: "paid" | "partially_paid" | "unpaid" | "overdue";
}

export interface Payment {
  id: ID;
  code: string;
  invoice: string;
  customerId: ID;
  method: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed";
}

export interface CodRec {
  id: ID;
  code: string;
  shipment: string;
  customerId: ID;
  amount: number;
  collected: string;
  driverId: ID;
  status: "pending" | "collected" | "remitted";
}

export interface UserRec {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  lastActive: string;
  created: string;
  active: boolean;
}

export interface Approval {
  id: ID;
  code: string;
  title: string;
  requester: string;
  module: string;
  amount: number;
  stage: string;
  status: Status;
  date: string;
}

export interface TaskRec {
  id: ID;
  code: string;
  title: string;
  assignee: string;
  module: string;
  due: string;
  priority: "high" | "medium" | "low";
  status: Status;
}

export interface DocumentRec {
  id: ID;
  code: string;
  name: string;
  type: string;
  linked: string;
  owner: string;
  size: string;
  date: string;
}

export interface ActivityRec {
  id: ID;
  time: string;
  user: string;
  action: string;
  module: string;
  record: string;
  before: string;
  after: string;
}

export interface ContractRec {
  id: ID;
  code: string;
  customerId: ID;
  serviceId: ID;
  start: string;
  end: string;
  value: number;
  status: Status;
  active: boolean;
}

export interface PricingRule {
  id: ID;
  code: string;
  name: string;
  serviceId: ID;
  zone: string;
  minKg: number;
  maxKg: number;
  rate: number;
  active: boolean;
}

export interface CompanyProfile {
  name: string;
  companyId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

const wh = (
  id: string,
  code: string,
  name: string,
  city: string,
  region: string,
  capacity: number,
  used: number,
  inbound: number,
  sorting: number,
  outbound: number,
  waiting: number,
  delayed: number,
  status: Warehouse["status"],
): Warehouse => ({
  id,
  code,
  name,
  city,
  region,
  capacity,
  used,
  inbound,
  sorting,
  outbound,
  waiting,
  delayed,
  status,
  active: true,
});

export const warehouses: Warehouse[] = [
  wh("wh-jkt", "WH-JKT-01", "Jakarta Central Hub", "Jakarta", "Jabodetabek", 15000, 13050, 2421, 4823, 3912, 1686, 208, "congested"),
  wh("wh-smg", "WH-SMG-01", "Semarang Hub", "Semarang", "Jawa Tengah", 9000, 6120, 1180, 2340, 1890, 710, 96, "operational"),
  wh("wh-slo", "WH-SLO-01", "Surakarta Hub", "Surakarta", "Jawa Tengah", 6000, 3480, 640, 1320, 1040, 480, 41, "operational"),
  wh("wh-sby", "WH-SBY-01", "Surabaya Hub", "Surabaya", "Jawa Timur", 12000, 10800, 1980, 3960, 3120, 1740, 187, "critical"),
  wh("wh-bdg", "WH-BDG-01", "Bandung Hub", "Bandung", "Jawa Barat", 8000, 4640, 890, 1720, 1380, 650, 54, "operational"),
  wh("wh-mks", "WH-MKS-01", "Makassar Hub", "Makassar", "Sulawesi Selatan", 5000, 2950, 520, 1080, 860, 490, 33, "operational"),
];

export const customers: Customer[] = [
  {
    id: "cus-1",
    code: "CUS-000281",
    name: "PT Maju Bersama",
    contact: "Andi Prasetyo",
    position: "Purchasing",
    phone: "0812-1100-2281",
    whatsapp: "0812-1100-2281",
    email: "logistics@majubersama.example.com",
    billingAddress: "Jl. Gatot Subroto Kav. 21, Jakarta Selatan 12930",
    city: "Jakarta",
    locations: ["Jakarta Warehouse", "Surakarta Warehouse", "Surabaya Warehouse"],
    monthlySpend: 482500000,
    performance: 97.1,
    active: true,
  },
  {
    id: "cus-2",
    code: "CUS-000317",
    name: "PT Nusantara Retail",
    contact: "Siti Rahmawati",
    position: "Supply Chain Lead",
    phone: "0813-8822-4410",
    whatsapp: "0813-8822-4410",
    email: "scm@nusantararetail.example.com",
    billingAddress: "Jl. Pemuda No. 118, Semarang 50132",
    city: "Semarang",
    locations: ["Semarang DC", "Yogyakarta Store Hub"],
    monthlySpend: 316800000,
    performance: 94.6,
    active: true,
  },
  {
    id: "cus-3",
    code: "CUS-000352",
    name: "PT Sumber Elektronik",
    contact: "Rudi Hartono",
    position: "Operations Manager",
    phone: "0811-2299-7712",
    whatsapp: "0811-2299-7712",
    email: "ops@sumberelektronik.example.com",
    billingAddress: "Jl. Rungkut Industri III No. 9, Surabaya 60293",
    city: "Surabaya",
    locations: ["Surabaya Plant", "Malang Distribution"],
    monthlySpend: 275400000,
    performance: 91.8,
    active: true,
  },
  {
    id: "cus-4",
    code: "CUS-000398",
    name: "PT Global Distribusi",
    contact: "Maya Kusuma",
    position: "Logistics Coordinator",
    phone: "0812-4477-9931",
    whatsapp: "0812-4477-9931",
    email: "logistik@globaldistribusi.example.com",
    billingAddress: "Jl. Soekarno Hatta No. 402, Bandung 40254",
    city: "Bandung",
    locations: ["Bandung Hub", "Cirebon Depot"],
    monthlySpend: 198200000,
    performance: 96.3,
    active: true,
  },
  {
    id: "cus-5",
    code: "CUS-000441",
    name: "PT Andalan Industri",
    contact: "Bayu Nugroho",
    position: "Procurement",
    phone: "0857-3311-8820",
    whatsapp: "0857-3311-8820",
    email: "procurement@andalanindustri.example.com",
    billingAddress: "Kawasan Industri Jababeka Blok C-12, Bekasi 17530",
    city: "Bekasi",
    locations: ["Bekasi Plant"],
    monthlySpend: 143900000,
    performance: 89.4,
    active: true,
  },
];

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    code: "SUP-00112",
    name: "PT Teknologi Prima",
    contact: "Dewi Anggraini",
    position: "Sales Manager",
    phone: "0811-9922-3311",
    whatsapp: "0811-9922-3311",
    email: "sales@teknologiprima.example.com",
    address: "Jl. Mangga Dua Raya No. 55",
    city: "Jakarta",
    taxId: "01.234.567.8-011.000",
    bank: "Bank Mandiri · 1220••••4471",
    services: "Consumer electronics, IT hardware",
    reliability: 96.4,
    responseHours: 3.2,
    transactions: 412,
    contracts: 3,
    active: true,
  },
  {
    id: "sup-2",
    code: "SUP-00128",
    name: "CV Sinar Komponen",
    contact: "Hendra Wijaya",
    position: "Director",
    phone: "0812-6633-1190",
    whatsapp: "0812-6633-1190",
    email: "hendra@sinarkomponen.example.com",
    address: "Jl. Industri Raya No. 12",
    city: "Semarang",
    taxId: "02.881.220.4-503.000",
    bank: "BCA · 8810••••2093",
    services: "Industrial components",
    reliability: 91.2,
    responseHours: 6.5,
    transactions: 238,
    contracts: 2,
    active: true,
  },
  {
    id: "sup-3",
    code: "SUP-00144",
    name: "PT Kemasan Nusantara",
    contact: "Ratna Sari",
    position: "Account Executive",
    phone: "0813-2200-6654",
    whatsapp: "0813-2200-6654",
    email: "ratna@kemasannusantara.example.com",
    address: "Jl. Raya Bekasi KM 21",
    city: "Bekasi",
    taxId: "03.112.900.1-402.000",
    bank: "BNI · 3390••••1145",
    services: "Packaging materials",
    reliability: 88.7,
    responseHours: 9.1,
    transactions: 176,
    contracts: 1,
    active: true,
  },
  {
    id: "sup-4",
    code: "SUP-00159",
    name: "PT Armada Sejahtera",
    contact: "Yoga Pratama",
    position: "Fleet Partner Manager",
    phone: "0878-4411-2288",
    whatsapp: "0878-4411-2288",
    email: "partner@armadasejahtera.example.com",
    address: "Jl. Ahmad Yani No. 88",
    city: "Surabaya",
    taxId: "04.556.331.9-601.000",
    bank: "BRI · 2201••••7788",
    services: "Fleet leasing, maintenance",
    reliability: 93.9,
    responseHours: 4.4,
    transactions: 98,
    contracts: 4,
    active: true,
  },
];

export const serviceTypes: ServiceType[] = [
  { id: "svc-exp", code: "EXP", name: "Express", slaHours: 24, baseRate: 45000, perKg: 9500, active: true },
  { id: "svc-reg", code: "REG", name: "Regular", slaHours: 72, baseRate: 22000, perKg: 5200, active: true },
  { id: "svc-eco", code: "ECO", name: "Economy Cargo", slaHours: 120, baseRate: 15000, perKg: 3100, active: true },
  { id: "svc-sd", code: "SDS", name: "Same Day Sameday", slaHours: 12, baseRate: 68000, perKg: 12000, active: true },
  { id: "svc-cld", code: "CLD", name: "Cold Chain", slaHours: 48, baseRate: 95000, perKg: 16500, active: true },
];

export const drivers: Driver[] = [
  { id: "drv-1", code: "DRV-0142", name: "Budi Santoso", phone: "0812-3344-1100", license: "SIM B2 Umum", baseWarehouseId: "wh-smg", status: "on_route", rating: 4.8, deliveries: 1284, active: true },
  { id: "drv-2", code: "DRV-0158", name: "Agus Setiawan", phone: "0813-7788-4422", license: "SIM B1 Umum", baseWarehouseId: "wh-jkt", status: "on_route", rating: 4.6, deliveries: 1102, active: true },
  { id: "drv-3", code: "DRV-0163", name: "Slamet Riyadi", phone: "0857-2211-9933", license: "SIM B2 Umum", baseWarehouseId: "wh-sby", status: "available", rating: 4.9, deliveries: 1461, active: true },
  { id: "drv-4", code: "DRV-0171", name: "Eko Purnomo", phone: "0821-9911-5544", license: "SIM B1 Umum", baseWarehouseId: "wh-bdg", status: "on_route", rating: 4.4, deliveries: 872, active: true },
  { id: "drv-5", code: "DRV-0184", name: "Rizky Ramadhan", phone: "0819-6622-7711", license: "SIM B2 Umum", baseWarehouseId: "wh-slo", status: "idle", rating: 4.7, deliveries: 654, active: true },
  { id: "drv-6", code: "DRV-0190", name: "Wahyu Kurniawan", phone: "0838-4455-3322", license: "SIM B1 Umum", baseWarehouseId: "wh-mks", status: "available", rating: 4.5, deliveries: 512, active: true },
];

export const routes: RouteRec[] = [
  { id: "rt-1", code: "RT-JKT-SLO", name: "Jakarta → Surakarta Trunk", stops: ["Jakarta", "Cirebon", "Semarang", "Surakarta"], distanceKm: 561, estHours: 11.5, actualHours: 12.4, onTimeRate: 93.2, vehicles: 8, activeShipments: 412, active: true },
  { id: "rt-2", code: "RT-SMG-SLO", name: "Semarang → Surakarta Shuttle", stops: ["Semarang", "Salatiga", "Surakarta"], distanceKm: 108, estHours: 2.6, actualHours: 2.8, onTimeRate: 97.4, vehicles: 6, activeShipments: 218, active: true },
  { id: "rt-3", code: "RT-JKT-BDG", name: "Jakarta → Bandung Express", stops: ["Jakarta", "Bekasi", "Purwakarta", "Bandung"], distanceKm: 151, estHours: 3.2, actualHours: 3.6, onTimeRate: 95.1, vehicles: 7, activeShipments: 306, active: true },
  { id: "rt-4", code: "RT-SBY-MLG", name: "Surabaya → Malang Line", stops: ["Surabaya", "Sidoarjo", "Malang"], distanceKm: 94, estHours: 2.4, actualHours: 3.1, onTimeRate: 88.6, vehicles: 5, activeShipments: 174, active: true },
  { id: "rt-5", code: "RT-SLO-YOG", name: "Surakarta → Yogyakarta Feeder", stops: ["Surakarta", "Klaten", "Yogyakarta"], distanceKm: 65, estHours: 1.8, actualHours: 1.9, onTimeRate: 98.1, vehicles: 4, activeShipments: 121, active: true },
];

export const vehicles: Vehicle[] = [
  { id: "veh-1", code: "TRK-0281", model: "Mitsubishi Fuso Canter", plate: "AD 1234 XX", type: "Box Truck 8T", driverId: "drv-1", routeId: "rt-2", status: "on_route", fuel: 68, nextServiceKm: 1240, active: true },
  { id: "veh-2", code: "TRK-0294", model: "Hino Dutro 130 HD", plate: "B 9082 KYZ", type: "Box Truck 6T", driverId: "drv-2", routeId: "rt-1", status: "on_route", fuel: 44, nextServiceKm: 480, active: true },
  { id: "veh-3", code: "TRK-0303", model: "Isuzu Elf NMR", plate: "L 7741 QN", type: "Box Truck 5T", driverId: "drv-3", routeId: "rt-4", status: "available", fuel: 91, nextServiceKm: 3120, active: true },
  { id: "veh-4", code: "VAN-0117", model: "Daihatsu Gran Max", plate: "D 5520 ATB", type: "Van 1.5T", driverId: "drv-4", routeId: "rt-3", status: "on_route", fuel: 57, nextServiceKm: 860, active: true },
  { id: "veh-5", code: "TRK-0318", model: "Mitsubishi Fuso Fighter", plate: "AD 8890 RC", type: "Box Truck 10T", driverId: "drv-5", routeId: "rt-5", status: "workshop", fuel: 22, nextServiceKm: 0, active: true },
  { id: "veh-6", code: "VAN-0132", model: "Suzuki Carry", plate: "DD 3312 KL", type: "Van 1T", driverId: "drv-6", routeId: null, status: "idle", fuel: 78, nextServiceKm: 2050, active: true },
];

export const categories: Category[] = [
  { id: "cat-1", code: "CAT-LAP", name: "Laptop", active: true },
  { id: "cat-2", code: "CAT-MON", name: "Monitor", active: true },
  { id: "cat-3", code: "CAT-NET", name: "Network Equipment", active: true },
  { id: "cat-4", code: "CAT-CEL", name: "Consumer Electronics", active: true },
  { id: "cat-5", code: "CAT-IND", name: "Industrial Components", active: true },
  { id: "cat-6", code: "CAT-GEN", name: "General Cargo", active: true },
];

export const products: Product[] = [
  { id: "prd-1", sku: "LP-AS-001", name: "ASUS Vivobook 15", categoryId: "cat-1", brand: "ASUS", unit: "Unit", warehouseId: "wh-jkt", total: 100, available: 62, reserved: 15, processing: 8, inTransit: 5, damaged: 3, returned: 2, minStock: 10, active: true },
  { id: "prd-2", sku: "LP-LN-014", name: "Lenovo ThinkPad E14", categoryId: "cat-1", brand: "Lenovo", unit: "Unit", warehouseId: "wh-jkt", total: 84, available: 51, reserved: 12, processing: 9, inTransit: 7, damaged: 2, returned: 3, minStock: 12, active: true },
  { id: "prd-3", sku: "MN-DL-024", name: "Dell P2422H 24\" Monitor", categoryId: "cat-2", brand: "Dell", unit: "Unit", warehouseId: "wh-smg", total: 156, available: 118, reserved: 20, processing: 6, inTransit: 8, damaged: 3, returned: 1, minStock: 20, active: true },
  { id: "prd-4", sku: "NE-MK-008", name: "MikroTik hEX RB750Gr3", categoryId: "cat-3", brand: "MikroTik", unit: "Unit", warehouseId: "wh-sby", total: 320, available: 244, reserved: 41, processing: 14, inTransit: 16, damaged: 3, returned: 2, minStock: 40, active: true },
  { id: "prd-5", sku: "CE-SM-102", name: "Samsung Smart TV 43\"", categoryId: "cat-4", brand: "Samsung", unit: "Unit", warehouseId: "wh-bdg", total: 72, available: 40, reserved: 14, processing: 7, inTransit: 6, damaged: 4, returned: 1, minStock: 10, active: true },
  { id: "prd-6", sku: "IC-BR-330", name: "Industrial Bearing Set 6205", categoryId: "cat-5", brand: "Nachi", unit: "Box", warehouseId: "wh-slo", total: 540, available: 402, reserved: 68, processing: 24, inTransit: 32, damaged: 9, returned: 5, minStock: 60, active: true },
  { id: "prd-7", sku: "GC-PL-500", name: "Pallet Wrap Film 500mm", categoryId: "cat-6", brand: "NusaPack", unit: "Roll", warehouseId: "wh-mks", total: 880, available: 712, reserved: 90, processing: 30, inTransit: 34, damaged: 8, returned: 6, minStock: 100, active: true },
  { id: "prd-8", sku: "NE-TP-045", name: "TP-Link Omada EAP225", categoryId: "cat-3", brand: "TP-Link", unit: "Unit", warehouseId: "wh-jkt", total: 210, available: 128, reserved: 44, processing: 12, inTransit: 18, damaged: 5, returned: 3, minStock: 30, active: true },
];

export const stockMovements: StockMovement[] = [
  { id: "sm-1", productId: "prd-1", date: "2026-08-09 08:12", type: "received", qty: 50, reference: "PO-2026-0812", user: "Warehouse Staff · Jakarta", warehouseId: "wh-jkt" },
  { id: "sm-2", productId: "prd-1", date: "2026-08-09 11:40", type: "shipment", qty: -10, reference: "NX-928173", user: "System", warehouseId: "wh-jkt" },
  { id: "sm-3", productId: "prd-1", date: "2026-08-09 15:02", type: "damaged", qty: -2, reference: "INS-4412", user: "QC · Jakarta", warehouseId: "wh-jkt" },
  { id: "sm-4", productId: "prd-1", date: "2026-08-10 09:20", type: "adjustment", qty: 1, reference: "ADJ-0091", user: "Warehouse Manager", warehouseId: "wh-jkt" },
  { id: "sm-5", productId: "prd-3", date: "2026-08-08 13:55", type: "received", qty: 80, reference: "PO-2026-0788", user: "Warehouse Staff · Semarang", warehouseId: "wh-smg" },
  { id: "sm-6", productId: "prd-3", date: "2026-08-09 10:15", type: "shipment", qty: -24, reference: "NX-928190", user: "System", warehouseId: "wh-smg" },
  { id: "sm-7", productId: "prd-4", date: "2026-08-09 16:31", type: "return", qty: 2, reference: "RET-00214", user: "Customer Service", warehouseId: "wh-sby" },
  { id: "sm-8", productId: "prd-6", date: "2026-08-10 07:48", type: "received", qty: 120, reference: "PO-2026-0834", user: "Warehouse Staff · Surakarta", warehouseId: "wh-slo" },
];

const cities = ["Jakarta", "Semarang", "Surakarta", "Surabaya", "Bandung", "Yogyakarta", "Malang", "Cirebon", "Makassar", "Bekasi"];
const hubs = ["Jakarta Hub", "Semarang Hub", "Surakarta Hub", "Surabaya Hub", "Bandung Hub", "Makassar Hub"];
const contents = ["Laptop", "Monitor", "Network Equipment", "Consumer Electronics", "Industrial Components", "General Cargo"];
const shipmentStatuses = [
  "created", "picked_up", "at_origin_hub", "sorting", "dispatched", "in_transit",
  "at_destination_hub", "out_for_delivery", "delivered", "delayed", "exception", "returned",
];

const eventLabels: Record<string, string> = {
  created: "Shipment Created",
  picked_up: "Picked Up",
  at_origin_hub: "Arrived at Origin Hub",
  sorting: "Sorting Completed",
  dispatched: "Departed Origin Hub",
  in_transit: "In Transit",
  at_destination_hub: "Arrived at Destination Hub",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delayed: "Delay Reported",
  exception: "Exception Raised",
  returned: "Returned to Origin",
};

/** Deterministic pseudo-random so data is stable between renders and SSR. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function buildShipments(): Shipment[] {
  const rand = rng(4711);
  const list: Shipment[] = [];
  for (let i = 0; i < 84; i++) {
    const status = shipmentStatuses[Math.floor(rand() * shipmentStatuses.length)];
    const origin = cities[Math.floor(rand() * cities.length)];
    let destination = cities[Math.floor(rand() * cities.length)];
    if (destination === origin) destination = cities[(cities.indexOf(origin) + 3) % cities.length];
    const customer = customers[Math.floor(rand() * customers.length)];
    const service = serviceTypes[Math.floor(rand() * serviceTypes.length)];
    const warehouse = warehouses[Math.floor(rand() * warehouses.length)];
    const route = routes[Math.floor(rand() * routes.length)];
    const vehicle = vehicles[Math.floor(rand() * vehicles.length)];
    const driver = drivers[Math.floor(rand() * drivers.length)];
    const weight = Math.round((1 + rand() * 240) * 10) / 10;
    const day = 8 + Math.floor(rand() * 6);
    const hour = 7 + Math.floor(rand() * 12);
    const idx = shipmentStatuses.indexOf(status);
    const flow = ["created", "picked_up", "at_origin_hub", "sorting", "dispatched", "in_transit", "at_destination_hub", "out_for_delivery", "delivered"];
    const upto = idx <= 8 ? idx : 6;
    const events: TrackingEvent[] = flow.slice(0, upto + 1).map((s, n) => ({
      status: s,
      label: eventLabels[s],
      location: n < 2 ? origin : n < 5 ? `${origin} Hub` : n < 7 ? hubs[Math.floor(rand() * hubs.length)] : destination,
      timestamp: `0${Math.min(9, 8 + Math.floor(n / 4))} Aug 2026 · ${String(6 + n * 2).padStart(2, "0")}:${String(10 + n * 7).slice(0, 2)}`,
      operator: n === 0 ? "Customer Service" : n < 5 ? "Warehouse Operations" : n < 8 ? "Line Haul" : "Last Mile",
    }));
    if (idx > 8) {
      events.push({
        status,
        label: eventLabels[status],
        location: warehouse.city,
        timestamp: `10 Aug 2026 · 1${Math.floor(rand() * 9)}:${String(10 + Math.floor(rand() * 45)).slice(0, 2)}`,
        operator: "Exception Desk",
      });
    }
    list.push({
      id: `shp-${i + 1}`,
      tracking: `NX-9281${String(70 + i).padStart(2, "0")}`,
      customerId: customer.id,
      origin,
      destination,
      serviceId: service.id,
      weight,
      pieces: 1 + Math.floor(rand() * 8),
      contents: contents[Math.floor(rand() * contents.length)],
      currentLocation: `${hubs[Math.floor(rand() * hubs.length)]}`,
      warehouseId: warehouse.id,
      status,
      eta: `${day} Aug 2026`,
      updatedAt: `10 Aug 2026 · ${String(hour).padStart(2, "0")}:${String(10 + Math.floor(rand() * 48)).slice(0, 2)}`,
      routeId: route.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      charge: Math.round((service.baseRate + weight * service.perKg) / 1000) * 1000,
      events,
    });
  }
  // Anchor record from the specification.
  list[3] = {
    ...list[3],
    tracking: "NX-928173",
    customerId: "cus-1",
    origin: "Jakarta",
    destination: "Surakarta",
    serviceId: "svc-exp",
    weight: 12.4,
    pieces: 3,
    contents: "Laptop",
    currentLocation: "Semarang Hub",
    warehouseId: "wh-smg",
    status: "in_transit",
    eta: "11 Aug 2026",
    routeId: "rt-1",
    vehicleId: "veh-1",
    driverId: "drv-1",
    charge: 162800,
    events: [
      { status: "created", label: "Shipment Created", location: "Jakarta", timestamp: "09 Aug 2026 · 08:14", operator: "Customer Service" },
      { status: "picked_up", label: "Picked Up", location: "Jakarta Selatan", timestamp: "09 Aug 2026 · 10:42", operator: "Pickup Courier" },
      { status: "at_origin_hub", label: "Arrived at Jakarta Hub", location: "Jakarta Central Hub", timestamp: "09 Aug 2026 · 14:05", operator: "Inbound Operations" },
      { status: "sorting", label: "Sorting Completed", location: "Jakarta Central Hub · Zone B", timestamp: "09 Aug 2026 · 17:38", operator: "Sorting Operations" },
      { status: "dispatched", label: "Departed Jakarta Hub", location: "Jakarta Central Hub", timestamp: "09 Aug 2026 · 21:10", operator: "Outbound Operations" },
      { status: "in_transit", label: "Arrived at Semarang Hub", location: "Semarang Hub", timestamp: "10 Aug 2026 · 06:24", operator: "Line Haul" },
    ],
  };
  return list;
}

export const shipments: Shipment[] = buildShipments();

export const orders: Order[] = shipments.slice(0, 34).map((s, i) => ({
  id: `ord-${i + 1}`,
  code: `ORD-2026-${String(1180 + i)}`,
  customerId: s.customerId,
  items: 1 + (i % 9),
  packages: s.pieces,
  origin: s.origin,
  destination: s.destination,
  serviceId: s.serviceId,
  amount: s.charge * (1 + (i % 4)),
  status: ["created", "confirmed", "processing", "ready", "dispatched", "completed", "cancelled"][i % 7],
  payment: (["paid", "unpaid", "partially_paid"] as const)[i % 3],
  date: `0${(i % 9) + 1} Aug 2026`,
  shipment: s.tracking,
}));

export const deliveries: Delivery[] = shipments.slice(10, 42).map((s, i) => ({
  id: `dlv-${i + 1}`,
  code: `DO-2026-${String(4410 + i)}`,
  shipment: s.tracking,
  customerId: s.customerId,
  address: `Jl. ${["Merdeka", "Diponegoro", "Sudirman", "Ahmad Yani", "Gajah Mada"][i % 5]} No. ${12 + i}, ${s.destination}`,
  driverId: s.driverId,
  vehicleId: s.vehicleId,
  routeId: s.routeId,
  packages: s.pieces,
  attempts: 1 + (i % 3),
  status: ["assigned", "out_for_delivery", "delivered", "failed", "returned"][i % 5],
  window: `${9 + (i % 8)}:00 – ${11 + (i % 8)}:00`,
  pod: i % 5 === 2 ? "Signature captured" : "—",
}));

export const exceptions: ExceptionRec[] = [
  { id: "exc-1", code: "EXC-1041", shipment: "NX-928175", category: "Delayed", severity: "high", status: "open", owner: "Dispatch · Semarang", expected: "10 Aug 2026 14:00", current: "10 Aug 2026 18:32", reason: "Vehicle breakdown", action: "Transfer to replacement vehicle", vehicle: "TRK-0294", notes: "Replacement TRK-0303 staged at Semarang Hub, ETA recovery 3h.", },
  { id: "exc-2", code: "EXC-1042", shipment: "NX-928182", category: "Failed Delivery", severity: "medium", status: "investigating", owner: "Customer Service", expected: "10 Aug 2026 11:00", current: "10 Aug 2026 12:40", reason: "Recipient unavailable", action: "Reschedule delivery attempt", vehicle: "VAN-0117", notes: "Second attempt scheduled tomorrow morning window." },
  { id: "exc-3", code: "EXC-1043", shipment: "NX-928190", category: "Wrong Address", severity: "medium", status: "open", owner: "Customer Service", expected: "09 Aug 2026 16:00", current: "10 Aug 2026 09:10", reason: "Incomplete address detail", action: "Confirm address with customer contact", vehicle: "VAN-0132", notes: "Awaiting confirmation from PT Nusantara Retail." },
  { id: "exc-4", code: "EXC-1044", shipment: "NX-928201", category: "Damaged", severity: "high", status: "investigating", owner: "Warehouse · Surabaya", expected: "09 Aug 2026 10:00", current: "09 Aug 2026 15:22", reason: "Packaging damage detected at sorting", action: "Repack and file damage report", vehicle: "TRK-0303", notes: "Insurance claim reference INS-4412 opened." },
  { id: "exc-5", code: "EXC-1045", shipment: "NX-928214", category: "Lost / Investigation", severity: "high", status: "investigating", owner: "Operations Manager", expected: "08 Aug 2026 18:00", current: "—", reason: "Scan missing after Semarang outbound", action: "Full hub audit and CCTV review", vehicle: "TRK-0281", notes: "Escalated to regional operations." },
  { id: "exc-6", code: "EXC-1046", shipment: "—", category: "Capacity Issue", severity: "high", status: "open", owner: "Warehouse · Surabaya", expected: "10 Aug 2026 08:00", current: "10 Aug 2026 08:00", reason: "Hub utilization above 90%", action: "Divert inbound volume to Malang staging", vehicle: "—", notes: "Surabaya Hub at 90% capacity for 2 consecutive days." },
  { id: "exc-7", code: "EXC-1047", shipment: "—", category: "Vehicle Issue", severity: "medium", status: "resolved", owner: "Fleet Manager", expected: "09 Aug 2026 06:00", current: "09 Aug 2026 13:30", reason: "Brake service overdue", action: "Vehicle moved to workshop", vehicle: "TRK-0318", notes: "Completed, returning to service 11 Aug." },
];

export const returns: ReturnRec[] = [
  { id: "ret-1", code: "RET-00214", shipment: "NX-928182", customerId: "cus-2", reason: "Recipient refused", condition: "Sealed, undamaged", resolution: "Refund", status: "inspection", date: "10 Aug 2026" },
  { id: "ret-2", code: "RET-00215", shipment: "NX-928201", customerId: "cus-3", reason: "Damaged in transit", condition: "Outer box crushed", resolution: "Replacement", status: "approved", date: "09 Aug 2026" },
  { id: "ret-3", code: "RET-00216", shipment: "NX-928196", customerId: "cus-1", reason: "Wrong item shipped", condition: "Unopened", resolution: "Replacement", status: "requested", date: "10 Aug 2026" },
  { id: "ret-4", code: "RET-00217", shipment: "NX-928177", customerId: "cus-4", reason: "Delivery beyond SLA", condition: "Good", resolution: "Refund", status: "completed", date: "07 Aug 2026" },
  { id: "ret-5", code: "RET-00218", shipment: "NX-928188", customerId: "cus-5", reason: "Order duplicated", condition: "Sealed", resolution: "Refund", status: "received", date: "08 Aug 2026" },
];

export const inbound: InboundRec[] = suppliers.flatMap((s, i) =>
  warehouses.slice(0, 3).map((w, j) => ({
    id: `inb-${i}-${j}`,
    code: `INB-2026-${String(3300 + i * 3 + j)}`,
    supplierId: s.id,
    reference: `PO-2026-0${800 + i * 7 + j}`,
    warehouseId: w.id,
    qty: 40 + ((i * 7 + j * 13) % 220),
    expected: `${8 + ((i + j) % 4)} Aug 2026 · 0${7 + (j % 3)}:00`,
    arrived: (i + j) % 4 === 0 ? "—" : `${8 + ((i + j) % 4)} Aug 2026 · 0${8 + (j % 3)}:20`,
    inspection: ["Pending", "Passed", "Passed with notes", "Failed"][(i + j) % 4],
    status: ["expected", "arrived", "scanning", "inspection", "received", "put_away"][(i * 3 + j) % 6],
  })),
);

export const sorting: SortingRec[] = shipments.slice(0, 28).map((s, i) => ({
  id: `srt-${i + 1}`,
  code: `SRT-${String(7710 + i)}`,
  shipment: s.tracking,
  warehouseId: s.warehouseId,
  zone: `Zone ${["A", "B", "C", "D"][i % 4]}-${String(1 + (i % 12)).padStart(2, "0")}`,
  destination: s.destination,
  nextHub: hubs[i % hubs.length],
  priority: (["high", "medium", "low"] as const)[i % 3],
  status: ["scanning", "sorting", "dispatched"][i % 3],
}));

export const outbound: OutboundRec[] = warehouses.flatMap((w, i) =>
  [0, 1].map((j) => ({
    id: `out-${i}-${j}`,
    code: `OUT-2026-${String(5510 + i * 2 + j)}`,
    warehouseId: w.id,
    shipments: 40 + ((i * 11 + j * 23) % 180),
    packages: 90 + ((i * 31 + j * 17) % 420),
    destination: hubs[(i + j + 1) % hubs.length],
    vehicleId: vehicles[(i + j) % vehicles.length].id,
    driverId: drivers[(i + j) % drivers.length].id,
    dispatchTime: `${String(6 + ((i + j) % 12)).padStart(2, "0")}:${["00", "30"][j]}`,
    status: ["picking", "packing", "loaded", "dispatched"][(i + j) % 4],
  })),
);

export const invoices: Invoice[] = customers.flatMap((c, i) =>
  [0, 1, 2].map((j) => {
    const base = 2_400_000 + i * 380_000 + j * 190_000;
    const weightCharge = Math.round(base * 0.42);
    const distanceCharge = Math.round(base * 0.31);
    const insurance = Math.round(base * 0.05);
    const additional = 150_000 * (j + 1);
    const sub = base + weightCharge + distanceCharge + insurance + additional;
    const tax = Math.round(sub * 0.11);
    return {
      id: `inv-${i}-${j}`,
      code: `INV-00${880 + i * 3 + j}`,
      customerId: c.id,
      issued: `0${1 + j} Aug 2026`,
      due: `${15 + j} Aug 2026`,
      base,
      weightCharge,
      distanceCharge,
      insurance,
      additional,
      tax,
      total: sub + tax,
      status: (["paid", "partially_paid", "unpaid", "overdue"] as const)[(i + j) % 4],
    };
  }),
);

export const payments: Payment[] = invoices.slice(0, 10).map((inv, i) => ({
  id: `pay-${i + 1}`,
  code: `PAY-2026-${String(2210 + i)}`,
  invoice: inv.code,
  customerId: inv.customerId,
  method: ["Bank Transfer", "Virtual Account", "Corporate Card", "COD Remittance"][i % 4],
  amount: i % 3 === 1 ? Math.round(inv.total / 2) : inv.total,
  date: `0${(i % 9) + 1} Aug 2026`,
  status: (["paid", "pending", "failed"] as const)[i % 3],
}));

export const cods: CodRec[] = shipments.slice(20, 32).map((s, i) => ({
  id: `cod-${i + 1}`,
  code: `COD-2026-${String(9910 + i)}`,
  shipment: s.tracking,
  customerId: s.customerId,
  amount: s.charge * 4,
  collected: i % 3 === 0 ? "—" : `0${(i % 9) + 1} Aug 2026`,
  driverId: s.driverId,
  status: (["pending", "collected", "remitted"] as const)[i % 3],
}));

export const ROLES = [
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

export const PERMISSION_MODULES = [
  "Dashboard",
  "Shipments",
  "Orders",
  "Warehouse",
  "Inventory",
  "Fleet",
  "Delivery",
  "Customers",
  "Suppliers",
  "Finance",
  "Analytics",
  "Settings",
] as const;

export const PERMISSION_LEVELS = ["View", "Create", "Edit", "Approve", "Delete"] as const;

export type PermissionMatrix = Record<string, Record<string, string[]>>;

function defaultMatrix(): PermissionMatrix {
  const m: PermissionMatrix = {};
  for (const role of ROLES) {
    m[role] = {};
    for (const mod of PERMISSION_MODULES) {
      if (role === "Super Admin") m[role][mod] = [...PERMISSION_LEVELS];
      else if (role === "Operations Manager")
        m[role][mod] = mod === "Settings" ? ["View"] : ["View", "Create", "Edit", "Approve"];
      else if (role === "Warehouse Manager")
        m[role][mod] = ["Warehouse", "Inventory", "Dashboard", "Shipments"].includes(mod)
          ? ["View", "Create", "Edit", "Approve"]
          : mod === "Finance" || mod === "Settings"
            ? []
            : ["View"];
      else if (role === "Fleet Manager")
        m[role][mod] = ["Fleet", "Delivery", "Dashboard"].includes(mod)
          ? ["View", "Create", "Edit", "Approve"]
          : mod === "Finance" || mod === "Settings"
            ? []
            : ["View"];
      else if (role === "Finance")
        m[role][mod] = ["Finance", "Dashboard", "Analytics", "Customers"].includes(mod)
          ? ["View", "Create", "Edit", "Approve"]
          : mod === "Settings"
            ? []
            : ["View"];
      else if (role === "Customer Service")
        m[role][mod] = ["Shipments", "Orders", "Delivery", "Customers", "Dashboard"].includes(mod)
          ? ["View", "Create", "Edit"]
          : [];
      else if (role === "Dispatcher")
        m[role][mod] = ["Fleet", "Delivery", "Shipments", "Dashboard"].includes(mod)
          ? ["View", "Create", "Edit"]
          : [];
      else if (role === "Warehouse Staff")
        m[role][mod] = ["Warehouse", "Inventory"].includes(mod) ? ["View", "Create"] : mod === "Dashboard" ? ["View"] : [];
      else m[role][mod] = ["Delivery", "Dashboard"].includes(mod) ? ["View"] : [];
    }
  }
  return m;
}

export const permissionMatrix: PermissionMatrix = defaultMatrix();

export const users: UserRec[] = [
  { id: "usr-1", name: "Dimas Prakoso", email: "dimas.prakoso@nexoraflow.example.com", phone: "0812-1000-2200", role: "Super Admin", department: "IT & Systems", status: "active", lastActive: "10 Aug 2026 · 10:42", created: "02 Jan 2025", active: true },
  { id: "usr-2", name: "Andi Prasetyo", email: "andi.prasetyo@nexoraflow.example.com", phone: "0812-3300-1122", role: "Operations Manager", department: "Operations", status: "active", lastActive: "10 Aug 2026 · 10:31", created: "14 Mar 2025", active: true },
  { id: "usr-3", name: "Sri Wahyuni", email: "sri.wahyuni@nexoraflow.example.com", phone: "0813-4400-8811", role: "Warehouse Manager", department: "Warehouse · Jakarta", status: "active", lastActive: "10 Aug 2026 · 09:58", created: "20 Mar 2025", active: true },
  { id: "usr-4", name: "Fajar Nugraha", email: "fajar.nugraha@nexoraflow.example.com", phone: "0857-8800-4411", role: "Fleet Manager", department: "Fleet", status: "active", lastActive: "10 Aug 2026 · 08:12", created: "05 Apr 2025", active: true },
  { id: "usr-5", name: "Lina Marlina", email: "lina.marlina@nexoraflow.example.com", phone: "0811-5500-3322", role: "Finance", department: "Finance", status: "active", lastActive: "09 Aug 2026 · 17:45", created: "11 May 2025", active: true },
  { id: "usr-6", name: "Rendi Saputra", email: "rendi.saputra@nexoraflow.example.com", phone: "0819-2200-7744", role: "Dispatcher", department: "Operations · Semarang", status: "active", lastActive: "10 Aug 2026 · 10:39", created: "18 Jun 2025", active: true },
  { id: "usr-7", name: "Nadia Puspita", email: "nadia.puspita@nexoraflow.example.com", phone: "0838-6600-9911", role: "Customer Service", department: "Customer Care", status: "active", lastActive: "10 Aug 2026 · 10:05", created: "01 Jul 2025", active: true },
  { id: "usr-8", name: "Budi Santoso", email: "budi.santoso@nexoraflow.example.com", phone: "0812-3344-1100", role: "Driver", department: "Fleet · Semarang", status: "active", lastActive: "10 Aug 2026 · 06:24", created: "09 Aug 2025", active: true },
  { id: "usr-9", name: "Tono Wibowo", email: "tono.wibowo@nexoraflow.example.com", phone: "0821-7700-2255", role: "Warehouse Staff", department: "Warehouse · Surabaya", status: "inactive", lastActive: "22 Jul 2026 · 14:11", created: "12 Sep 2025", active: false },
];

export const approvals: Approval[] = [
  { id: "apr-1", code: "APR-2026-0331", title: "Replacement vehicle rental — Semarang line haul", requester: "Rendi Saputra", module: "Fleet", amount: 12500000, stage: "Pending Manager", status: "pending", date: "10 Aug 2026" },
  { id: "apr-2", code: "APR-2026-0332", title: "Stock adjustment — LP-AS-001 damaged units", requester: "Sri Wahyuni", module: "Inventory", amount: 0, stage: "Pending Manager", status: "pending", date: "10 Aug 2026" },
  { id: "apr-3", code: "APR-2026-0333", title: "Additional packaging purchase order", requester: "Sri Wahyuni", module: "Procurement", amount: 34800000, stage: "Pending Finance", status: "pending", date: "09 Aug 2026" },
  { id: "apr-4", code: "APR-2026-0334", title: "Contract renewal — PT Maju Bersama", requester: "Lina Marlina", module: "Business", amount: 1_240_000_000, stage: "Approved", status: "approved", date: "08 Aug 2026" },
  { id: "apr-5", code: "APR-2026-0335", title: "Overtime request — Surabaya sorting shift", requester: "Tono Wibowo", module: "Warehouse", amount: 6400000, stage: "Rejected", status: "rejected", date: "07 Aug 2026" },
];

export const tasks: TaskRec[] = [
  { id: "tsk-1", code: "TSK-4412", title: "Confirm delivery address for NX-928190", assignee: "Nadia Puspita", module: "Delivery", due: "10 Aug 2026", priority: "high", status: "open" },
  { id: "tsk-2", code: "TSK-4413", title: "Audit Semarang outbound scan gap", assignee: "Andi Prasetyo", module: "Warehouse", due: "11 Aug 2026", priority: "high", status: "processing" },
  { id: "tsk-3", code: "TSK-4414", title: "Reconcile COD remittance batch 09 Aug", assignee: "Lina Marlina", module: "Finance", due: "11 Aug 2026", priority: "medium", status: "open" },
  { id: "tsk-4", code: "TSK-4415", title: "Schedule TRK-0294 brake inspection", assignee: "Fajar Nugraha", module: "Fleet", due: "12 Aug 2026", priority: "medium", status: "processing" },
  { id: "tsk-5", code: "TSK-4416", title: "Update pricing rules for Cold Chain zone 3", assignee: "Lina Marlina", module: "Pricing", due: "14 Aug 2026", priority: "low", status: "completed" },
];

export const documents: DocumentRec[] = [
  { id: "doc-1", code: "DOC-8811", name: "Delivery Note NX-928173.pdf", type: "Delivery Note", linked: "NX-928173", owner: "Operations", size: "182 KB", date: "09 Aug 2026" },
  { id: "doc-2", code: "DOC-8812", name: "Invoice INV-00891.pdf", type: "Invoice", linked: "INV-00891", owner: "Finance", size: "96 KB", date: "01 Aug 2026" },
  { id: "doc-3", code: "DOC-8813", name: "Damage Report INS-4412.pdf", type: "Report", linked: "EXC-1044", owner: "Warehouse", size: "1.2 MB", date: "09 Aug 2026" },
  { id: "doc-4", code: "DOC-8814", name: "Service Agreement PT Maju Bersama.pdf", type: "Contract", linked: "CTR-0091", owner: "Business", size: "640 KB", date: "12 Jan 2026" },
  { id: "doc-5", code: "DOC-8815", name: "Fleet Maintenance Log Q3.xlsx", type: "Log", linked: "Fleet", owner: "Fleet", size: "310 KB", date: "05 Aug 2026" },
];

export const activity: ActivityRec[] = [
  { id: "act-1", time: "10 Aug 2026 · 10:42", user: "Andi Prasetyo", action: "Updated shipment", module: "Shipments", record: "NX-928173", before: "At Origin Hub", after: "In Transit" },
  { id: "act-2", time: "10 Aug 2026 · 10:39", user: "Rendi Saputra", action: "Assigned vehicle", module: "Fleet", record: "TRK-0281", before: "Unassigned", after: "RT-SMG-SLO" },
  { id: "act-3", time: "10 Aug 2026 · 10:31", user: "System", action: "Detected delivery delay", module: "Exceptions", record: "NX-928175", before: "On schedule", after: "Delayed 4h 32m" },
  { id: "act-4", time: "10 Aug 2026 · 09:58", user: "Sri Wahyuni", action: "Adjusted inventory", module: "Inventory", record: "LP-AS-001", before: "61", after: "62" },
  { id: "act-5", time: "10 Aug 2026 · 09:12", user: "Nadia Puspita", action: "Created return request", module: "Returns", record: "RET-00216", before: "—", after: "Requested" },
  { id: "act-6", time: "10 Aug 2026 · 08:47", user: "Lina Marlina", action: "Recorded payment", module: "Finance", record: "PAY-2026-2213", before: "Unpaid", after: "Paid" },
];

export const auditLog: ActivityRec[] = [
  { id: "aud-1", time: "10 Aug 2026 · 14:32", user: "Dimas Prakoso", action: "Updated warehouse capacity", module: "Warehouses", record: "WH-JKT-01", before: "14,000", after: "15,000" },
  { id: "aud-2", time: "10 Aug 2026 · 14:18", user: "Andi Prasetyo", action: "Added shipment service", module: "Service Types", record: "SDS", before: "—", after: "Same Day Sameday" },
  { id: "aud-3", time: "10 Aug 2026 · 13:52", user: "Sri Wahyuni", action: "Adjusted inventory", module: "Inventory", record: "LP-AS-001", before: "61", after: "62" },
  { id: "aud-4", time: "09 Aug 2026 · 16:04", user: "Fajar Nugraha", action: "Deactivated vehicle", module: "Vehicles", record: "TRK-0318", before: "Available", after: "In Workshop" },
  { id: "aud-5", time: "09 Aug 2026 · 11:20", user: "Lina Marlina", action: "Updated pricing rule", module: "Pricing", record: "PR-0042", before: "Rp 8.900/kg", after: "Rp 9.500/kg" },
];

export const contracts: ContractRec[] = customers.map((c, i) => ({
  id: `ctr-${i + 1}`,
  code: `CTR-00${91 + i}`,
  customerId: c.id,
  serviceId: serviceTypes[i % serviceTypes.length].id,
  start: `01 Jan 2026`,
  end: `31 Dec 2026`,
  value: 640_000_000 + i * 180_000_000,
  status: i === 4 ? "pending" : "active",
  active: true,
}));

export const pricingRules: PricingRule[] = serviceTypes.flatMap((s, i) =>
  [0, 1].map((j) => ({
    id: `pr-${i}-${j}`,
    code: `PR-00${40 + i * 2 + j}`,
    name: `${s.name} · Zone ${j + 1}`,
    serviceId: s.id,
    zone: `Zone ${j + 1}`,
    minKg: j === 0 ? 0 : 30,
    maxKg: j === 0 ? 30 : 500,
    rate: s.perKg + j * 1200,
    active: true,
  })),
);

export const companyProfile: CompanyProfile = {
  name: "NEXORA FLOW Logistics Indonesia",
  companyId: "NXF-ID-0001",
  address: "Menara Nexora, Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan 12190",
  phone: "+62 21 5099 8800",
  email: "operations@nexoraflow.example.com",
  website: "www.nexoraflow.example.com",
  taxId: "09.812.334.5-011.000",
  currency: "IDR",
  timezone: "Asia/Jakarta (GMT+7)",
  dateFormat: "DD MMM YYYY",
};

export const shipmentTrend = Array.from({ length: 14 }, (_, i) => {
  const day = 28 + i;
  const label = day > 31 ? `${day - 31} Aug` : `${day} Jul`;
  const created = 820 + Math.round(Math.sin(i / 2) * 90) + i * 14;
  return { day: label, created, delivered: created - 40 - ((i * 13) % 60) };
});

export const hubPerformance = warehouses.map((w, i) => ({
  hub: w.city,
  onTime: [96.4, 94.1, 97.8, 88.2, 95.3, 92.6][i],
  volume: [4820, 2410, 1380, 3960, 1720, 980][i],
}));

export const transitTrend = Array.from({ length: 12 }, (_, i) => ({
  month: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][i],
  transit: Math.round((32 - i * 0.4 + Math.sin(i) * 1.6) * 10) / 10,
  cost: 38200 - i * 320 + (i % 3) * 480,
  utilization: 71 + ((i * 7) % 14),
}));
