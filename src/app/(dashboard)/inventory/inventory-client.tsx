"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, AlertTriangle, TrendingDown, TrendingUp, Warehouse, Search, ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { InventoryTxType } from "@/lib/mock-data";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  reorderPoint: number;
  costPerUnit: number;
  location: string | null;
  transactions: { id: string; type: string; quantity: number; createdAt: Date; performedBy: { name: string } }[];
}

interface InventoryClientProps {
  items: InventoryItem[];
  currentUser: { role: string };
}

const CATEGORIES = ["Raw Material", "Packaging", "Ribbon", "Sticker", "Box", "Insert", "Branded", "Dry Fruit", "Chocolate", "Other"];

function stockColor(item: InventoryItem): "red" | "amber" | "green" {
  if (item.currentStock <= item.minStockLevel) return "red";
  if (item.reorderPoint > 0 && item.currentStock <= item.reorderPoint) return "amber";
  return "green";
}

function StockBadge({ item }: { item: InventoryItem }) {
  const color = stockColor(item);
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
      color === "red" && "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
      color === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      color === "green" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    )}>
      {item.currentStock} {item.unit}
    </span>
  );
}

export function InventoryClient({ items, currentUser }: InventoryClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [showTxn, setShowTxn] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "", sku: "", category: "Raw Material", unit: "kg",
    currentStock: "0", minStockLevel: "0", reorderPoint: "0",
    costPerUnit: "0", location: "",
  });

  const [txn, setTxn] = useState({ type: "IN" as InventoryTxType, quantity: "", notes: "" });

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku?.includes(search) ?? false);
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStockItems = items.filter((i) => i.currentStock <= i.minStockLevel);

  // Derive which categories have items (for pill filter)
  const activeCategories = CATEGORIES.filter((c) => items.some((i) => i.category === c));

  const handleCreateItem = async () => {
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    if (res.ok) {
      toast.success("Item added to inventory.");
      setShowNew(false);
      router.refresh();
    } else toast.error("Failed to add item.");
    setSaving(false);
  };

  const handleTxn = async () => {
    if (!showTxn) return;
    setSaving(true);
    const res = await fetch(`/api/inventory/${showTxn}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txn),
    });
    if (res.ok) {
      toast.success("Stock updated.");
      setShowTxn(null);
      setTxn({ type: "IN", quantity: "", notes: "" });
      router.refresh();
    } else toast.error("Failed.");
    setSaving(false);
  };

  const handleReorder = (item: InventoryItem) => {
    toast.info(`Reorder triggered for "${item.name}" — contact supplier to top up.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store & Inventory</h1>
          <p className="text-muted-foreground text-sm">{items.length} items · {lowStockItems.length} low stock</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}</strong> below minimum stock level:{" "}
            {lowStockItems.slice(0, 3).map((i) => i.name).join(", ")}
            {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
          </p>
        </div>
      )}

      {/* Filters — search + category pills */}
      <div className="space-y-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search items or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCatFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              catFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            All
          </button>
          {activeCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                catFilter === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setCatFilter(catFilter === "__low__" ? "all" : "__low__")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              catFilter === "__low__"
                ? "bg-red-600 text-white border-red-600"
                : "bg-background border-red-300 text-red-600 hover:bg-red-50"
            )}
          >
            Low Stock ({lowStockItems.length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No items found"
          description="Add items to track raw materials, packaging, and supplies."
          action={{ label: "Add Item", onClick: () => setShowNew(true) }}
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(catFilter === "__low__" ? lowStockItems : filtered).map((item) => {
                const color = stockColor(item);
                const isLow = color === "red";
                const pct = item.reorderPoint > 0 ? Math.min(100, (item.currentStock / item.reorderPoint) * 100) : 100;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 relative",
                      isLow && "bg-red-50/40 dark:bg-red-950/10"
                    )}
                  >
                    {/* Color-coded left border via a pseudo-element using an inset div */}
                    <td className="px-4 py-3 relative">
                      <span
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm",
                          color === "red" && "bg-red-500",
                          color === "amber" && "bg-amber-400",
                          color === "green" && "bg-emerald-500",
                        )}
                      />
                      <p className="font-medium pl-1">{item.name}</p>
                      {item.sku && <p className="text-xs font-mono text-muted-foreground pl-1">{item.sku}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge item={item} />
                      <div className="mt-1.5 w-24">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              color === "red" && "bg-red-500",
                              color === "amber" && "bg-amber-400",
                              color === "green" && "bg-emerald-500",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          min {item.minStockLevel} {item.unit}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{item.location ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isLow && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50 px-2"
                            onClick={() => handleReorder(item)}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />Reorder
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                          title="Stock In"
                          onClick={() => { setShowTxn(item.id); setTxn({ ...txn, type: "IN" }); }}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          title="Stock Out"
                          onClick={() => { setShowTxn(item.id); setTxn({ ...txn, type: "OUT" }); }}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Dry Fruit Mix" />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} placeholder="DFM-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit <span className="text-red-500">*</span></Label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "litre", "ml", "pcs", "boxes", "rolls", "sheets", "packets"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Current Stock</Label>
                <Input type="number" value={newItem.currentStock} onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Min Stock</Label>
                <Input type="number" value={newItem.minStockLevel} onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Reorder At</Label>
                <Input type="number" value={newItem.reorderPoint} onChange={(e) => setNewItem({ ...newItem, reorderPoint: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cost/Unit (₹)</Label>
                <Input type="number" value={newItem.costPerUnit} onChange={(e) => setNewItem({ ...newItem, costPerUnit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} placeholder="Shelf A3" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreateItem} disabled={saving || !newItem.name}>{saving ? "Adding…" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transaction Dialog */}
      <Dialog open={!!showTxn} onOpenChange={(o) => !o && setShowTxn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{txn.type === "IN" ? "Add Stock (IN)" : "Remove Stock (OUT)"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Transaction Type</Label>
              <Select value={txn.type} onValueChange={(v) => setTxn({ ...txn, type: v as InventoryTxType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock In (Received)</SelectItem>
                  <SelectItem value="OUT">Stock Out (Issued)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity <span className="text-red-500">*</span></Label>
              <Input type="number" value={txn.quantity} onChange={(e) => setTxn({ ...txn, quantity: e.target.value })} placeholder="Enter quantity" min={0.01} step={0.01} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={txn.notes} onChange={(e) => setTxn({ ...txn, notes: e.target.value })} placeholder="Reference order, PO number, etc." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTxn(null)}>Cancel</Button>
            <Button onClick={handleTxn} disabled={saving || !txn.quantity}>{saving ? "Saving…" : "Update Stock"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
