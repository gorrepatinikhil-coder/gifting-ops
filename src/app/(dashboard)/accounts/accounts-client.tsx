"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { DollarSign, AlertTriangle, CheckCircle2, FileText, Plus, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PaymentType } from "@/lib/mock-data";

interface AccountsClientProps {
  orders: Array<{
    id: string;
    orderNumber: string;
    clientName: string;
    totalAmount: number;
    balanceAmount: number;
    advanceAmount: number;
    paymentStatus: string;
    deliveryDate: Date;
    lead: { companyName: string } | null;
    payments: Array<{ id: string; amount: number; type: string; createdAt: Date }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    type: string;
    createdAt: Date;
    transactionId: string | null;
    verifiedAt: Date | null;
    order: { orderNumber: string; clientName: string };
    verifiedBy: { name: string } | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    order: { orderNumber: string; clientName: string };
  }>;
  monthlyRevenue: number;
  totalPending: number;
  currentUser: { role: string };
}

export function AccountsClient({ orders, payments, invoices, monthlyRevenue, totalPending, currentUser }: AccountsClientProps) {
  const router = useRouter();
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: "BALANCE" as PaymentType,
    amount: "",
    transactionId: "",
    notes: "",
  });

  const recordPayment = async () => {
    if (!showPayment) return;
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: showPayment, ...paymentForm }),
    });
    if (res.ok) {
      toast.success("Payment recorded.");
      setShowPayment(null);
      router.refresh();
    } else toast.error("Failed to record payment.");
    setSaving(false);
  };

  const verifyPayment = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}/verify`, { method: "POST" });
    if (res.ok) { toast.success("Payment verified."); router.refresh(); }
    else toast.error("Failed.");
  };

  const unverifiedCount = payments.filter((p) => !p.verifiedAt).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Accounts &amp; Billing</h1>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Outstanding:
            </span>
            <span className="text-base font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalPending)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Revenue This Month" value={formatCurrency(monthlyRevenue)} icon={DollarSign} iconColor="text-green-600" />
        <StatCard title="Outstanding Collections" value={formatCurrency(totalPending)} icon={AlertTriangle} iconColor="text-orange-600" />
        <StatCard title="Payments to Verify" value={unverifiedCount} icon={CheckCircle2} iconColor="text-blue-600" />
        <StatCard title="Invoices Raised" value={invoices.length} icon={FileText} iconColor="text-purple-600" />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Collections ({orders.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments This Month ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">All payments collected! 🎉</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Delivery</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance Due</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.clientName}</p>
                        <p className="text-xs text-muted-foreground">{order.lead?.companyName}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{formatDate(order.deliveryDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-red-600">{formatCurrency(order.balanceAmount)}</p>
                        <p className="text-xs text-muted-foreground">of {formatCurrency(order.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowPayment(order.id)}>
                          Record
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No payments this month</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                      <span className="font-semibold">{formatCurrency(p.amount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.order.clientName} • {p.order.orderNumber}
                      {p.transactionId && ` • TXN: ${p.transactionId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {p.verifiedAt ? (
                      <div>
                        <Badge variant="success" className="text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Verified
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">by {p.verifiedBy?.name}</p>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => verifyPayment(p.id)}>
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No invoices yet</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                    <th className="w-36" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isOverdue = inv.status === "OVERDUE" ||
                      (inv.balanceAmount > 0 && inv.dueDate != null && new Date(inv.dueDate) < new Date());
                    return (
                      <tr key={inv.id} className={cn(
                        "border-b last:border-0 hover:bg-muted/30 transition-colors",
                        isOverdue && "bg-red-50/50 dark:bg-red-950/15"
                      )}>
                        <td className={cn(
                          "px-4 py-3 font-mono text-xs",
                          isOverdue && "border-l-4 border-l-red-500"
                        )}>{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{inv.order.clientName}</p>
                          <p className="text-xs text-muted-foreground">{inv.order.orderNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td className={cn("px-4 py-3 text-right font-bold", inv.balanceAmount > 0 ? "text-red-600" : "text-green-600")}>
                          {formatCurrency(inv.balanceAmount)}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              onClick={() => toast.info(`Reminder sent to ${inv.order.clientName}`)}
                            >
                              <Bell className="w-3 h-3" /> Remind
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                              <Link href={`/orders/${inv.id}`}>
                                <ExternalLink className="w-3 h-3" /> Order
                              </Link>
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
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={!!showPayment} onOpenChange={(o) => !o && setShowPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={paymentForm.type} onValueChange={(v) => setPaymentForm({ ...paymentForm, type: v as PaymentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVANCE">Advance</SelectItem>
                  <SelectItem value="BALANCE">Balance</SelectItem>
                  <SelectItem value="FULL">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.00" min={0.01} step={0.01} />
            </div>
            <div className="space-y-1.5">
              <Label>Transaction ID / Reference</Label>
              <Input value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} placeholder="UPI / NEFT / Cheque number" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(null)}>Cancel</Button>
            <Button onClick={recordPayment} disabled={saving || !paymentForm.amount}>
              {saving ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
