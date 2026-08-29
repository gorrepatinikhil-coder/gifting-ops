"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Zap } from "lucide-react";

interface OrderItem {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  packaging: string;
  branding: string;
}

const defaultItem: OrderItem = {
  productName: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  packaging: "",
  branding: "",
};

const EVENT_TYPES = ["DIWALI", "CHRISTMAS", "CORPORATE", "WEDDING", "BIRTHDAY", "CUSTOM"];

export function NewOrderClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRush, setIsRush] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([{ ...defaultItem }]);

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientCompany: "",
    eventType: "",
    deliveryDate: "",
    advanceAmount: 0,
    advanceRequired: 0,
    notes: "",
    specialInstructions: "",
    // Delivery address
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    contactName: "",
    contactPhone: "",
  });

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  }

  const totalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0);
  const balance = totalAmount - form.advanceAmount;

  async function handleSubmit() {
    if (!form.clientName) return toast.error("Client name is required");
    if (!form.deliveryDate) return toast.error("Delivery date is required");
    if (items.some((i) => !i.productName || i.unitPrice <= 0)) {
      return toast.error("All items need a product name and unit price");
    }
    if (!form.address || !form.city || !form.pincode) {
      return toast.error("Delivery address is required");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          clientEmail: form.clientEmail,
          clientCompany: form.clientCompany,
          eventType: form.eventType || undefined,
          deliveryDate: form.deliveryDate,
          advanceAmount: form.advanceAmount,
          advanceRequired: form.advanceRequired,
          isRush,
          notes: form.notes,
          specialInstructions: form.specialInstructions,
          items: items.map((i) => ({
            productName: i.productName,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            packaging: i.packaging,
            branding: i.branding,
          })),
          deliveryAddress: {
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            landmark: form.landmark,
            contactName: form.contactName || form.clientName,
            contactPhone: form.contactPhone || form.clientPhone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      toast.success(`Order ${data.orderNumber} created!`);
      router.push(`/orders/${data.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Order</h1>
          <p className="text-sm text-muted-foreground">Fill in all details to confirm the order</p>
        </div>
      </div>

      {/* Rush Toggle */}
      <Card className={isRush ? "border-red-400 dark:border-red-600" : ""}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Zap className={`h-4 w-4 ${isRush ? "text-red-500" : "text-muted-foreground"}`} />
              Rush Order
            </p>
            <p className="text-sm text-muted-foreground">Marks order as priority, notifies ops team immediately</p>
          </div>
          <Switch checked={isRush} onCheckedChange={setIsRush} />
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Client Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Client Name *</Label>
            <Input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={form.clientCompany} onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} />
          </div>
          <div>
            <Label>Event Type</Label>
            <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Delivery Date *</Label>
            <Input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Order Items</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setItems((prev) => [...prev, { ...defaultItem }])}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Item {idx + 1}</span>
                {items.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Product Name *</Label>
                  <Input
                    placeholder="e.g. Premium Diwali Hamper"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, "productName", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Contents, special requirements..."
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Price (₹) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Packaging</Label>
                  <Input
                    placeholder="Box type, size..."
                    value={item.packaging}
                    onChange={(e) => updateItem(idx, "packaging", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Branding</Label>
                  <Input
                    placeholder="Logo, ribbon, card..."
                    value={item.branding}
                    onChange={(e) => updateItem(idx, "branding", e.target.value)}
                  />
                </div>
              </div>
              {item.totalPrice > 0 && (
                <div className="text-right text-sm font-semibold text-primary">
                  Line Total: {formatCurrency(item.totalPrice)}
                </div>
              )}
            </div>
          ))}

          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Order Total</span>
              <span className="text-primary font-bold text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Advance Received (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.advanceAmount}
              onChange={(e) => setForm((f) => ({ ...f, advanceAmount: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label>Advance Required (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.advanceRequired}
              onChange={(e) => setForm((f) => ({ ...f, advanceRequired: Number(e.target.value) }))}
              placeholder="Expected advance amount"
            />
          </div>
          {totalAmount > 0 && (
            <div className="col-span-2 rounded-lg bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span>Total</span><span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Advance Paid</span><span className="font-medium text-green-600">{formatCurrency(form.advanceAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t">
                <span>Balance Due</span>
                <span className={balance > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(balance)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Street Address *</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={2}
              placeholder="Building, street, area..."
            />
          </div>
          <div>
            <Label>City *</Label>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </div>
          <div>
            <Label>Pincode *</Label>
            <Input value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} />
          </div>
          <div>
            <Label>Landmark</Label>
            <Input value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} />
          </div>
          <div>
            <Label>Contact Name</Label>
            <Input
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              placeholder="Defaults to client name"
            />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="Defaults to client phone"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notes & Instructions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Internal Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Team-only notes..."
            />
          </div>
          <div>
            <Label>Special Instructions</Label>
            <Textarea
              value={form.specialInstructions}
              onChange={(e) => setForm((f) => ({ ...f, specialInstructions: e.target.value }))}
              rows={3}
              placeholder="Client-specific requirements..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-8">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? "Creating Order..." : "Confirm Order"}
        </Button>
      </div>
    </div>
  );
}
