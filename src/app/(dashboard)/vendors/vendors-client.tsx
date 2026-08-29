"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, Phone, Mail, AlertTriangle, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, daysUntil, formatCurrency, generatePONumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { VendorOrderStatus } from "@/lib/mock-data";

interface Vendor {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string;
  category: string | null;
  rating: number;
  _count: { purchaseOrders: number };
  purchaseOrders: Array<{ id: string; poNumber: string; status: VendorOrderStatus; expectedDate: Date; totalAmount: number }>;
}

interface PendingPO {
  id: string;
  poNumber: string;
  status: VendorOrderStatus;
  expectedDate: Date;
  totalAmount: number;
  vendor: { name: string };
  items: Array<{ itemName: string; quantity: number; unit: string }>;
}

interface VendorsClientProps {
  vendors: Vendor[];
  pendingPOs: PendingPO[];
  currentUser: { role: string };
}

export function VendorsClient({ vendors, pendingPOs, currentUser }: VendorsClientProps) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showPO, setShowPO] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [vendorForm, setVendorForm] = useState({
    name: "", companyName: "", email: "", phone: "", category: "", address: "", gstNumber: "",
  });

  const [poForm, setPoForm] = useState({
    vendorId: "", expectedDate: "", notes: "",
    items: [{ itemName: "", quantity: "", unit: "pcs", unitPrice: "" }],
  });

  const handleCreateVendor = async () => {
    setSaving(true);
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendorForm),
    });
    if (res.ok) { toast.success("Vendor added."); setShowNew(false); router.refresh(); }
    else toast.error("Failed to add vendor.");
    setSaving(false);
  };

  const createPO = async () => {
    setSaving(true);
    const res = await fetch("/api/vendors/po", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...poForm, poNumber: generatePONumber() }),
    });
    if (res.ok) { toast.success("Purchase order created."); setShowPO(null); router.refresh(); }
    else toast.error("Failed to create PO.");
    setSaving(false);
  };

  const updatePOStatus = async (poId: string, status: VendorOrderStatus) => {
    const res = await fetch(`/api/vendors/po/${poId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("PO status updated."); router.refresh(); }
    else toast.error("Failed to update.");
  };

  const delayedPOs = pendingPOs.filter((po) => daysUntil(po.expectedDate) < 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors & Procurement</h1>
          <p className="text-muted-foreground text-sm">{vendors.length} active vendor{vendors.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPO("new")}>
            <Package className="w-4 h-4" />New PO
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" />Add Vendor
          </Button>
        </div>
      </div>

      {delayedPOs.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>{delayedPOs.length} PO{delayedPOs.length > 1 ? "s" : ""}</strong> past expected delivery date
          </p>
        </div>
      )}

      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="pos">
            Purchase Orders
            {pendingPOs.length > 0 && <Badge variant="warning" className="ml-1 text-[10px] h-4 px-1">{pendingPOs.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          {vendors.length === 0 ? (
            <EmptyState icon={Building2} title="No vendors" description="Add vendors to manage packaging suppliers, dry fruit traders, confectionery makers, and print partners." action={{ label: "Add Vendor", onClick: () => setShowNew(true) }} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{vendor.name}</p>
                        {vendor.companyName && <p className="text-xs text-muted-foreground">{vendor.companyName}</p>}
                      </div>
                      {vendor.category && <Badge variant="outline" className="text-xs">{vendor.category}</Badge>}
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{vendor.phone}
                      </div>
                      {vendor.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />{vendor.email}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={cn("text-sm", i < vendor.rating ? "text-yellow-400" : "text-muted")}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{vendor._count.purchaseOrders} POs</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3 h-7 text-xs"
                      onClick={() => setShowPO(vendor.id)}>
                      Create PO
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pos">
          {pendingPOs.length === 0 ? (
            <EmptyState icon={Package} title="No pending purchase orders" description="Create a PO to order materials or custom items from vendors." />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">PO Number</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="w-32" />
                  </tr>
                </thead>
                <tbody>
                  {pendingPOs.map((po) => {
                    const days = daysUntil(po.expectedDate);
                    return (
                      <tr key={po.id} className={cn("border-b last:border-0 hover:bg-muted/30", days < 0 && "bg-red-50/30")}>
                        <td className="px-4 py-3 font-mono text-xs">{po.poNumber}</td>
                        <td className="px-4 py-3 font-medium">{po.vendor.name}</td>
                        <td className="px-4 py-3">
                          <p className={cn(days < 0 ? "text-red-600 font-semibold" : "")}>{formatDate(po.expectedDate)}</p>
                          {days < 0 && <p className="text-xs text-red-500">{Math.abs(days)}d late</p>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(po.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <Select value={po.status} onValueChange={(v) => updatePOStatus(po.id, v as VendorOrderStatus)}>
                            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PLACED">Placed</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                              <SelectItem value="PARTIAL_RECEIVED">Partial</SelectItem>
                              <SelectItem value="RECEIVED">Received</SelectItem>
                              <SelectItem value="DELAYED">Delayed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Vendor Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Vendor Name *</Label><Input value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Company Name</Label><Input value={vendorForm.companyName} onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone *</Label><Input value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Input value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} placeholder="Boxes / Labels / Printing" /></div>
              <div className="space-y-1.5"><Label>GST Number</Label><Input value={vendorForm.gstNumber} onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreateVendor} disabled={saving}>{saving ? "Adding..." : "Add Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
