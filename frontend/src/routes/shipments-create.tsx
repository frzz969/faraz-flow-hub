import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Send } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData, useLookups } from "@/lib/farazz/store";

export const Route = createFileRoute("/shipments-create")({
  head: () => ({
    meta: [
      { title: "Create Shipment — FARAZZ FLOW" },
      { name: "description", content: "Create a new shipment in the FARAZZ FLOW network." },
    ],
  }),
  component: CreateShipmentPage,
});

interface ShipmentForm {
  // Sender
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  // Receiver
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  // Package
  packageName: string;
  category: string;
  weight: string;
  quantity: string;
  dimensions: string;
  description: string;
  // Delivery
  origin: string;
  destination: string;
  serviceType: string;
  deliveryDate: string;
  driverId: string;
  // Payment
  shippingCost: string;
  paymentMethod: string;
}

const INITIAL: ShipmentForm = {
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  packageName: "",
  category: "",
  weight: "",
  quantity: "1",
  dimensions: "",
  description: "",
  origin: "",
  destination: "",
  serviceType: "",
  deliveryDate: "",
  driverId: "",
  shippingCost: "",
  paymentMethod: "bank_transfer",
};

const CITIES = ["Jakarta", "Semarang", "Surakarta", "Surabaya", "Bandung", "Yogyakarta", "Malang", "Cirebon", "Makassar", "Bekasi"];

function CreateShipmentPage() {
  const navigate = useNavigate();
  const { db, create } = useData();
  const look = useLookups();
  const [form, setForm] = useState<ShipmentForm>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof ShipmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.senderName.trim()) e["senderName"] = "Sender name is required";
    if (!form.senderPhone.trim()) e["senderPhone"] = "Sender phone is required";
    if (!form.senderAddress.trim()) e["senderAddress"] = "Sender address is required";
    if (!form.receiverName.trim()) e["receiverName"] = "Receiver name is required";
    if (!form.receiverPhone.trim()) e["receiverPhone"] = "Receiver phone is required";
    if (!form.receiverAddress.trim()) e["receiverAddress"] = "Receiver address is required";
    if (!form.packageName.trim()) e["packageName"] = "Package name is required";
    if (!form.weight || Number(form.weight) <= 0) e["weight"] = "Weight must be greater than 0";
    if (!form.quantity || Number(form.quantity) <= 0) e["quantity"] = "Quantity must be at least 1";
    if (!form.origin) e["origin"] = "Origin is required";
    if (!form.destination) e["destination"] = "Destination is required";
    if (!form.serviceType) e["serviceType"] = "Service type is required";
    if (!form.deliveryDate) e["deliveryDate"] = "Delivery date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = (asDraft = false) => {
    if (!validate()) {
      toast.error("Please fix the errors below.");
      return;
    }
    const weight = Number(form.weight);
    const svc = look.service[form.serviceType];
    const charge = svc ? Math.round((svc.baseRate + weight * svc.perKg) / 1000) * 1000 : Number(form.shippingCost) || 0;
    const now = new Date();
    const tracking = `NX-${928200 + db.shipments.length}`;
    const orderId = `ord-${db.orders.length + 1}`;
    const orderCode = `ORD-2026-${1200 + db.orders.length}`;

    const newShipment = {
      tracking,
      customerId: db.customers[0]?.id ?? "cus-1",
      origin: form.origin,
      destination: form.destination,
      serviceId: form.serviceType,
      weight,
      pieces: Number(form.quantity),
      contents: form.packageName,
      currentLocation: `${form.origin} Hub`,
      warehouseId: db.warehouses[0]?.id ?? "wh-jkt",
      status: asDraft ? "created" : "created",
      eta: form.deliveryDate,
      updatedAt: now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·"),
      routeId: db.routes[0]?.id ?? "rt-1",
      vehicleId: form.driverId ? (db.vehicles.find((v) => v.driverId === form.driverId)?.id ?? "veh-3") : "veh-3",
      driverId: form.driverId || (db.drivers[0]?.id ?? "drv-1"),
      charge,
      events: [
        {
          status: "created",
          label: "Shipment Created",
          location: form.origin,
          timestamp: now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·"),
          operator: "Customer Service",
        },
      ],
    };

    create("shipments", newShipment, tracking);

    // Also create order
    create("orders", {
      code: orderCode,
      customerId: db.customers[0]?.id ?? "cus-1",
      items: Number(form.quantity),
      packages: Number(form.quantity),
      origin: form.origin,
      destination: form.destination,
      serviceId: form.serviceType,
      amount: charge * 2,
      status: asDraft ? "created" : "confirmed",
      payment: form.paymentMethod === "cod" ? "unpaid" : "paid",
      date: now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      shipment: tracking,
    }, orderCode);

    toast.success(asDraft ? "Shipment saved as draft." : `Shipment ${tracking} created successfully.`);
    navigate({ to: "/shipments" });
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="mt-1 text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <div className="mx-auto max-w-[64rem] space-y-5">
      <PageHeader
        title="Create Shipment"
        description="Fill in the details to create a new shipment."
        crumbs={[
          { label: "Operations", to: "/shipments" },
          { label: "Shipments", to: "/shipments" },
          { label: "Create" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/shipments" })} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        }
      />

      {/* Sender */}
      <SectionCard title="Sender Information" subtitle="Who is sending this package?">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="senderName">Name *</Label>
            <Input id="senderName" value={form.senderName} onChange={(e) => set("senderName", e.target.value)} placeholder="PT Maju Bersama" />
            <FieldError field="senderName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senderPhone">Phone *</Label>
            <Input id="senderPhone" value={form.senderPhone} onChange={(e) => set("senderPhone", e.target.value)} placeholder="0812-1100-2281" />
            <FieldError field="senderPhone" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="senderAddress">Address *</Label>
            <Input id="senderAddress" value={form.senderAddress} onChange={(e) => set("senderAddress", e.target.value)} placeholder="Jl. Gatot Subroto Kav. 21, Jakarta Selatan 12930" />
            <FieldError field="senderAddress" />
          </div>
        </div>
      </SectionCard>

      {/* Receiver */}
      <SectionCard title="Receiver Information" subtitle="Who will receive this package?">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiverName">Name *</Label>
            <Input id="receiverName" value={form.receiverName} onChange={(e) => set("receiverName", e.target.value)} placeholder="PT Nusantara Retail" />
            <FieldError field="receiverName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiverPhone">Phone *</Label>
            <Input id="receiverPhone" value={form.receiverPhone} onChange={(e) => set("receiverPhone", e.target.value)} placeholder="0813-8822-4410" />
            <FieldError field="receiverPhone" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="receiverAddress">Address *</Label>
            <Input id="receiverAddress" value={form.receiverAddress} onChange={(e) => set("receiverAddress", e.target.value)} placeholder="Jl. Pemuda No. 118, Semarang 50132" />
            <FieldError field="receiverAddress" />
          </div>
        </div>
      </SectionCard>

      {/* Package */}
      <SectionCard title="Package Details" subtitle="What are you shipping?">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="packageName">Package Name *</Label>
            <Input id="packageName" value={form.packageName} onChange={(e) => set("packageName", e.target.value)} placeholder="Laptop ASUS Vivobook" />
            <FieldError field="packageName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {db.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input id="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="12.4" />
            <FieldError field="weight" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="1" />
            <FieldError field="quantity" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dimensions">Dimensions (LxWxH cm)</Label>
            <Input id="dimensions" value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="45x35x12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Fragile electronics" />
          </div>
        </div>
      </SectionCard>

      {/* Delivery */}
      <SectionCard title="Delivery Details" subtitle="Where and how should it be delivered?">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Origin *</Label>
            <Select value={form.origin} onValueChange={(v) => set("origin", v)}>
              <SelectTrigger><SelectValue placeholder="Select origin city" /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError field="origin" />
          </div>
          <div className="space-y-1.5">
            <Label>Destination *</Label>
            <Select value={form.destination} onValueChange={(v) => set("destination", v)}>
              <SelectTrigger><SelectValue placeholder="Select destination city" /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError field="destination" />
          </div>
          <div className="space-y-1.5">
            <Label>Service Type *</Label>
            <Select value={form.serviceType} onValueChange={(v) => set("serviceType", v)}>
              <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>
                {db.serviceTypes.filter((s) => s.active).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.slaHours}h SLA</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError field="serviceType" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deliveryDate">Expected Delivery Date *</Label>
            <Input id="deliveryDate" type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
            <FieldError field="deliveryDate" />
          </div>
          <div className="space-y-1.5">
            <Label>Assigned Driver</Label>
            <Select value={form.driverId} onValueChange={(v) => set("driverId", v)}>
              <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
              <SelectContent>
                {db.drivers.filter((d) => d.active).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Payment */}
      <SectionCard title="Payment" subtitle="Shipping cost and payment method">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="shippingCost">Shipping Cost (IDR)</Label>
            <Input id="shippingCost" type="number" min="0" step="1000" value={form.shippingCost} onChange={(e) => set("shippingCost", e.target.value)} placeholder="Auto-calculated from service type" />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="virtual_account">Virtual Account</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
        <Button variant="outline" onClick={() => navigate({ to: "/shipments" })}>Cancel</Button>
        <Button variant="outline" onClick={() => handleCreate(true)} className="gap-1.5">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={() => handleCreate(false)} className="gap-1.5">
          <Send className="h-4 w-4" /> Create Shipment
        </Button>
      </div>
    </div>
  );
}
