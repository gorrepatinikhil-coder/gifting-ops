"use client";

import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  Truck, MapPin, Phone, CheckCircle2, XCircle, Upload, FileText,
  Clock, User, Package, ChevronDown, ChevronUp, Camera, RotateCcw,
  AlertTriangle, Calendar, Hash, Car, Search, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatDateTime, generateChallanNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DispatchStatus } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryAddress {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  quantity?: number;
}

interface DispatchRecord {
  id: string;
  challanNumber: string;
  status: DispatchStatus;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  estimatedDelivery: Date | null;
  dispatchedAt: Date;
  deliveredAt: Date | null;
  podReceiverName: string | null;
  podTimestamp: Date | null;
  podNotes: string | null;
  podPhotoName: string | null;
  failureReason: string | null;
  rescheduledTo: Date | null;
  timeline: TimelineEntry[];
}

interface TimelineEntry {
  id: string;
  time: Date;
  event: string;
  detail?: string;
  actor?: string;
}

interface DispatchOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  status: string;
  deliveryDate: Date;
  quantity?: number;
  deliveryAddresses: DeliveryAddress[];
  dispatches: DispatchRecord[];
  expanded: boolean;
}

interface DispatchClientProps {
  orders: Array<{
    id: string;
    orderNumber: string;
    clientName: string;
    status: string;
    deliveryDate: Date;
    deliveryAddresses: Array<{
      id: string; recipientName: string; phone: string;
      addressLine1: string; city: string; state: string; pincode: string;
      addressLine2?: string; quantity?: number;
    }>;
    dispatches: Array<{
      id: string; challanNumber: string; status: DispatchStatus;
      driverName: string | null; vehicleNumber: string | null;
      podReceiverName: string | null; podTimestamp: Date | null;
      dispatchedAt: Date | null; deliveredAt: Date | null;
      dispatchedBy: { name: string } | null;
    }>;
  }>;
  currentUser: { role: string };
}

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  READY:           { label: "Ready",           color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   icon: <Package className="w-3.5 h-3.5" /> },
  OUT_FOR_DELIVERY:{ label: "Out for Delivery", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <Truck className="w-3.5 h-3.5" /> },
  DELIVERED:       { label: "Delivered",        color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  FAILED:          { label: "Failed",           color: "text-red-700",    bg: "bg-red-50 border-red-200",      icon: <XCircle className="w-3.5 h-3.5" /> },
  RESCHEDULED:     { label: "Rescheduled",      color: "text-purple-700", bg: "bg-purple-50 border-purple-200",icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

const tid = () => Math.random().toString(36).slice(2, 10);

// ─── Challan printer ──────────────────────────────────────────────────────────

function printChallan(order: DispatchOrder, dispatch: DispatchRecord) {
  const w = window.open("", "_blank");
  if (!w) return;

  const addrRows = order.deliveryAddresses
    .map((a, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;color:#374151">${i + 1}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">
          <strong>${a.recipientName}</strong><br/>
          <span style="color:#6b7280">${a.phone}</span>
        </td>
        <td style="padding:8px;border:1px solid #e5e7eb">
          ${a.addressLine1}${a.addressLine2 ? ", " + a.addressLine2 : ""}<br/>
          ${a.city}, ${a.state} — ${a.pincode}
        </td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${a.quantity ?? "—"} units</td>
      </tr>`)
    .join("");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Delivery Challan — ${dispatch.challanNumber}</title>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 13px; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111827; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #f59e0b; }
    .challan-title { font-size: 14px; font-weight: 600; color: #6b7280; margin-top: 2px; }
    .confidential { display: inline-block; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; margin-top: 4px; }
    .challan-no { font-size: 20px; font-weight: 800; font-family: monospace; color: #111827; }
    .challan-date { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .meta-box-title { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .meta-row { display: flex; gap: 8px; margin-bottom: 4px; font-size: 12px; }
    .meta-label { color: #6b7280; min-width: 90px; }
    .meta-value { font-weight: 600; color: #111827; }
    .section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 10px 8px; font-size: 11px; font-weight: 700; color: #374151; border: 1px solid #e5e7eb; text-align: left; }
    td { font-size: 12px; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 40px; }
    .sign-box { border-top: 2px solid #111827; padding-top: 8px; font-size: 11px; color: #6b7280; }
    .sign-name { font-weight: 700; color: #111827; margin-bottom: 2px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
    @media print { .page { padding: 20px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">Gifting<span>Ops</span></div>
      <div class="challan-title">Delivery Challan</div>
      <div class="confidential">INTERNAL USE ONLY — NOT A FINANCIAL DOCUMENT</div>
    </div>
    <div style="text-align:right">
      <div class="challan-no">${dispatch.challanNumber}</div>
      <div class="challan-date">Issued: ${formatDateTime(dispatch.dispatchedAt)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-box-title">Order Details</div>
      <div class="meta-row"><span class="meta-label">Order No.</span><span class="meta-value">${order.orderNumber}</span></div>
      <div class="meta-row"><span class="meta-label">Client</span><span class="meta-value">${order.clientName}</span></div>
      <div class="meta-row"><span class="meta-label">Delivery Date</span><span class="meta-value">${formatDate(order.deliveryDate)}</span></div>
      <div class="meta-row"><span class="meta-label">Total Qty</span><span class="meta-value">${order.quantity ?? "—"} units</span></div>
    </div>
    <div class="meta-box">
      <div class="meta-box-title">Driver / Vehicle</div>
      <div class="meta-row"><span class="meta-label">Driver</span><span class="meta-value">${dispatch.driverName}</span></div>
      <div class="meta-row"><span class="meta-label">Phone</span><span class="meta-value">${dispatch.driverPhone}</span></div>
      <div class="meta-row"><span class="meta-label">Vehicle No.</span><span class="meta-value">${dispatch.vehicleNumber}</span></div>
      <div class="meta-row"><span class="meta-label">Est. Delivery</span><span class="meta-value">${dispatch.estimatedDelivery ? formatDateTime(dispatch.estimatedDelivery) : "—"}</span></div>
    </div>
  </div>

  <div class="section-title">Delivery Addresses (${order.deliveryAddresses.length})</div>
  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Recipient</th>
        <th>Address</th>
        <th style="width:80px;text-align:center">Qty</th>
      </tr>
    </thead>
    <tbody>${addrRows}</tbody>
  </table>

  <div class="section-title">Delivery Confirmation</div>
  <table>
    <thead>
      <tr>
        <th>Address #</th>
        <th>Received By (Name &amp; Signature)</th>
        <th>Date &amp; Time</th>
        <th>Condition Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${order.deliveryAddresses.map((_, i) => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;height:40px"></td>
          <td style="padding:8px;border:1px solid #e5e7eb"></td>
          <td style="padding:8px;border:1px solid #e5e7eb"></td>
        </tr>`).join("")}
    </tbody>
  </table>

  <div class="sign-grid">
    <div class="sign-box">
      <div class="sign-name">Dispatch Manager</div>
      <div>Authorized &amp; Released</div>
      <div style="margin-top:4px">Date: ______________</div>
    </div>
    <div class="sign-box">
      <div class="sign-name">Driver</div>
      <div>Goods received in good condition</div>
      <div style="margin-top:4px">Date: ______________</div>
    </div>
    <div class="sign-box">
      <div class="sign-name">Client Representative</div>
      <div>Final delivery acknowledged</div>
      <div style="margin-top:4px">Date: ______________</div>
    </div>
  </div>

  <div class="footer">
    <span>GiftingOps Internal — Challan ${dispatch.challanNumber}</span>
    <span>This document does not constitute a tax invoice or financial record.</span>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`);
  w.document.close();
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DispatchClient({ orders: rawOrders, currentUser }: DispatchClientProps) {
  // Seed local state from props — convert existing dispatches, add expanded flag
  const [orderState, setOrderState] = useState<DispatchOrder[]>(() =>
    rawOrders.map((o) => ({
      ...o,
      expanded: false,
      dispatches: o.dispatches.map((d) => ({
        id: d.id,
        challanNumber: d.challanNumber,
        status: d.status,
        driverName: d.driverName ?? "",
        driverPhone: "",
        vehicleNumber: d.vehicleNumber ?? "",
        estimatedDelivery: null,
        dispatchedAt: d.dispatchedAt ?? new Date(),
        deliveredAt: d.deliveredAt,
        podReceiverName: d.podReceiverName,
        podTimestamp: d.podTimestamp,
        podNotes: null,
        podPhotoName: null,
        failureReason: null,
        rescheduledTo: null,
        timeline: [
          {
            id: tid(), time: d.dispatchedAt ?? new Date(),
            event: "Dispatched",
            detail: `Driver: ${d.driverName ?? "—"} · Vehicle: ${d.vehicleNumber ?? "—"}`,
          },
          ...(d.deliveredAt ? [{ id: tid(), time: d.deliveredAt, event: "Delivered", detail: `Received by ${d.podReceiverName ?? "—"}` }] : []),
        ],
      })),
    }))
  );

  // ── Search / filter state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Ready" | "Out for Delivery" | "Delivered" | "Failed">("All");

  // ── Modal state ──────────────────────────────────────────────────────────
  const [dispatchModal, setDispatchModal] = useState<string | null>(null); // orderId
  const [podModal, setPodModal] = useState<{ orderId: string; dispatchId: string } | null>(null);
  const [challanPreview, setChallanPreview] = useState<{ order: DispatchOrder; dispatch: DispatchRecord } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dispatchForm, setDispatchForm] = useState({
    driverName: "", driverPhone: "", vehicleNumber: "", estimatedDelivery: "",
  });

  const [podForm, setPodForm] = useState<{
    status: DispatchStatus; receiverName: string; notes: string;
    photoName: string | null; failureReason: string; rescheduledTo: string;
  }>({
    status: "DELIVERED", receiverName: "", notes: "",
    photoName: null, failureReason: "", rescheduledTo: "",
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateOrder = (orderId: string, fn: (o: DispatchOrder) => DispatchOrder) =>
    setOrderState((prev) => prev.map((o) => (o.id === orderId ? fn(o) : o)));

  const updateDispatch = (orderId: string, dispatchId: string, fn: (d: DispatchRecord) => DispatchRecord) =>
    updateOrder(orderId, (o) => ({
      ...o,
      dispatches: o.dispatches.map((d) => (d.id === dispatchId ? fn(d) : d)),
    }));

  // ── Actions ───────────────────────────────────────────────────────────────

  const createDispatch = async (orderId: string) => {
    if (!dispatchForm.driverName.trim()) { toast.error("Driver name is required."); return; }
    if (!dispatchForm.vehicleNumber.trim()) { toast.error("Vehicle number is required."); return; }

    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          driverName: dispatchForm.driverName.trim(),
          driverPhone: dispatchForm.driverPhone.trim(),
          vehicleNumber: dispatchForm.vehicleNumber.trim().toUpperCase(),
          estimatedDelivery: dispatchForm.estimatedDelivery || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create dispatch");
      }
      const created = await res.json();
      const now = new Date(created.createdAt ?? Date.now());
      const newDispatch: DispatchRecord = {
        id: created.id,
        challanNumber: created.challanNumber,
        status: "OUT_FOR_DELIVERY",
        driverName: created.driverName ?? dispatchForm.driverName.trim(),
        driverPhone: created.driverPhone ?? dispatchForm.driverPhone.trim(),
        vehicleNumber: created.vehicleNumber ?? dispatchForm.vehicleNumber.trim().toUpperCase(),
        estimatedDelivery: created.estimatedDelivery ? new Date(created.estimatedDelivery) : null,
        dispatchedAt: now,
        deliveredAt: null,
        podReceiverName: null,
        podTimestamp: null,
        podNotes: null,
        podPhotoName: null,
        failureReason: null,
        rescheduledTo: null,
        timeline: [
          {
            id: tid(), time: now, event: "Dispatched",
            detail: `Driver: ${created.driverName} · Vehicle: ${created.vehicleNumber}`,
            actor: currentUser.role,
          },
        ],
      };

      updateOrder(orderId, (o) => ({ ...o, status: "DISPATCHED", dispatches: [...o.dispatches, newDispatch] }));
      toast.success(`Dispatch created — ${created.challanNumber}`);
      setDispatchModal(null);
      setDispatchForm({ driverName: "", driverPhone: "", vehicleNumber: "", estimatedDelivery: "" });

      // Auto-open challan
      const order = orderState.find((o) => o.id === orderId);
      if (order) {
        setTimeout(() => printChallan({ ...order, status: "DISPATCHED", dispatches: [...order.dispatches, newDispatch] }, newDispatch), 300);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create dispatch");
    }
  };

  const submitPOD = async () => {
    if (!podModal) return;
    if (podForm.status === "DELIVERED" && !podForm.receiverName.trim()) {
      toast.error("Receiver name is required for delivery confirmation.");
      return;
    }

    const { orderId, dispatchId } = podModal;
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: podForm.status,
          podReceiverName: podForm.status === "DELIVERED" ? podForm.receiverName : undefined,
          podNotes: podForm.notes || undefined,
          failureReason: podForm.status === "FAILED" ? podForm.failureReason : undefined,
          rescheduledTo: podForm.status === "RESCHEDULED" && podForm.rescheduledTo ? podForm.rescheduledTo : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update delivery status");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update delivery status");
      return;
    }

    const now = new Date();
    updateDispatch(orderId, dispatchId, (d) => {
      const newEntry: TimelineEntry = {
        id: tid(), time: now,
        event: podForm.status === "DELIVERED" ? "Delivered" : podForm.status === "FAILED" ? "Delivery Failed" : "Rescheduled",
        detail: podForm.status === "DELIVERED"
          ? `Received by ${podForm.receiverName}${podForm.photoName ? ` · Photo: ${podForm.photoName}` : ""}`
          : podForm.status === "FAILED"
          ? podForm.failureReason || "No reason specified"
          : `New date: ${podForm.rescheduledTo || "TBD"}`,
        actor: currentUser.role,
      };
      return {
        ...d,
        status: podForm.status,
        podReceiverName: podForm.status === "DELIVERED" ? podForm.receiverName : null,
        podTimestamp: podForm.status === "DELIVERED" ? now : null,
        podNotes: podForm.notes || null,
        podPhotoName: podForm.photoName,
        deliveredAt: podForm.status === "DELIVERED" ? now : null,
        failureReason: podForm.status === "FAILED" ? podForm.failureReason : null,
        rescheduledTo: podForm.status === "RESCHEDULED" && podForm.rescheduledTo ? new Date(podForm.rescheduledTo) : null,
        timeline: [...d.timeline, newEntry],
      };
    });

    if (podForm.status === "DELIVERED") {
      updateOrder(orderId, (o) => ({ ...o, status: "DELIVERED" }));
    }

    toast.success(
      podForm.status === "DELIVERED" ? "Delivery confirmed with POD!" :
      podForm.status === "FAILED" ? "Delivery marked as failed." : "Delivery rescheduled."
    );
    setPodModal(null);
    setPodForm({ status: "DELIVERED", receiverName: "", notes: "", photoName: null, failureReason: "", rescheduledTo: "" });
  };

  const retryDispatch = (orderId: string, dispatchId: string) => {
    const now = new Date();
    updateDispatch(orderId, dispatchId, (d) => ({
      ...d,
      status: "OUT_FOR_DELIVERY",
      timeline: [
        ...d.timeline,
        { id: tid(), time: now, event: "Re-dispatched", detail: "Retry attempt after failure/reschedule", actor: currentUser.role },
      ],
    }));
    toast.success("Dispatch status reset to Out for Delivery.");
  };

  // ── Computed stats ────────────────────────────────────────────────────────

  const allDispatches = orderState.flatMap((o) => o.dispatches);
  const stats = {
    ready: orderState.filter((o) => o.dispatches.length === 0).length,
    outForDelivery: allDispatches.filter((d) => d.status === "OUT_FOR_DELIVERY").length,
    delivered: allDispatches.filter((d) => d.status === "DELIVERED").length,
    failed: allDispatches.filter((d) => d.status === "FAILED").length,
  };

  // Group orders by stage for queue display
  const queue = {
    ready: orderState.filter((o) => o.dispatches.length === 0),
    active: orderState.filter((o) => o.dispatches.some((d) => d.status === "OUT_FOR_DELIVERY")),
    done: orderState.filter((o) => o.dispatches.length > 0 && o.dispatches.every((d) => d.status === "DELIVERED" || d.status === "FAILED" || d.status === "RESCHEDULED")),
  };

  const openPODModal = (orderId: string, dispatchId: string) => {
    setPodForm({ status: "DELIVERED", receiverName: "", notes: "", photoName: null, failureReason: "", rescheduledTo: "" });
    setPodModal({ orderId, dispatchId });
  };

  // ── Filtered queues ───────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return orderState.filter((order) => {
      // Text search across order fields and dispatch records
      if (q) {
        const dispatchMatches = order.dispatches.some(
          (d) =>
            d.challanNumber.toLowerCase().includes(q) ||
            d.driverName.toLowerCase().includes(q)
        );
        const orderMatches =
          order.orderNumber.toLowerCase().includes(q) ||
          order.clientName.toLowerCase().includes(q);
        if (!orderMatches && !dispatchMatches) return false;
      }

      // Status filter
      if (statusFilter !== "All") {
        if (statusFilter === "Ready" && order.dispatches.length !== 0) return false;
        if (statusFilter === "Out for Delivery" && !order.dispatches.some((d) => d.status === "OUT_FOR_DELIVERY")) return false;
        if (statusFilter === "Delivered" && !order.dispatches.some((d) => d.status === "DELIVERED")) return false;
        if (statusFilter === "Failed" && !order.dispatches.some((d) => d.status === "FAILED")) return false;
      }

      return true;
    });
  }, [orderState, searchQuery, statusFilter]);

  const filteredQueue = {
    ready: filteredOrders.filter((o) => o.dispatches.length === 0),
    active: filteredOrders.filter((o) => o.dispatches.some((d) => d.status === "OUT_FOR_DELIVERY")),
    done: filteredOrders.filter((o) => o.dispatches.length > 0 && o.dispatches.every((d) => d.status === "DELIVERED" || d.status === "FAILED" || d.status === "RESCHEDULED")),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispatch & Delivery</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{orderState.length} order{orderState.length !== 1 ? "s" : ""} in dispatch pipeline</p>
      </div>

      {/* ── Dispatch Intelligence Strip ── */}
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border",
        (stats.failed > 0 || stats.ready > 3)
          ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/10"
          : "border-border/60 bg-muted/20"
      )}>
        <button
          onClick={() => setStatusFilter("Ready")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            stats.ready > 0
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 opacity-50"
          )}
        >
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Ready to Ship</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{stats.ready}</span>
          <span className="text-[10px] text-muted-foreground">raise challan now</span>
        </button>
        <button
          onClick={() => setStatusFilter("Out for Delivery")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            stats.outForDelivery > 0
              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40 hover:bg-orange-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 opacity-50"
          )}
        >
          <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">In Transit</span>
          <span className="text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums">{stats.outForDelivery}</span>
          <span className="text-[10px] text-muted-foreground">orders on the road</span>
        </button>
        <button
          onClick={() => setStatusFilter("Delivered")}
          className="flex flex-col items-start p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-border/40 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-700 transition-colors text-left"
        >
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Delivered</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.delivered}</span>
          <span className="text-[10px] text-muted-foreground">PODs confirmed</span>
        </button>
        <button
          onClick={() => setStatusFilter("Failed")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            stats.failed > 0
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 hover:bg-red-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 opacity-50"
          )}
        >
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", stats.failed > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground")}>
            {stats.failed > 0 ? "⚠ Failed / Retry" : "Failed / Retry"}
          </span>
          <span className={cn("text-2xl font-black tabular-nums", stats.failed > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>{stats.failed}</span>
          <span className="text-[10px] text-muted-foreground">need rescheduling</span>
        </button>
      </div>

      {/* ── Search / filter bar ────────────────────────────────────────────── */}
      {orderState.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search by order #, client, challan or driver…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["All", "Ready", "Out for Delivery", "Delivered", "Failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {orderState.length === 0 ? (
        <EmptyState icon={Truck} title="No orders in dispatch" description="QC-approved orders will appear here ready for dispatch." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filter." />
      ) : (
        <div className="space-y-8">
          {/* READY QUEUE */}
          {filteredQueue.ready.length > 0 && (
            <QueueSection title="Ready to Dispatch" count={filteredQueue.ready.length} accent="blue">
              {filteredQueue.ready.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onToggle={() => updateOrder(order.id, (o) => ({ ...o, expanded: !o.expanded }))}
                  actions={
                    <Button size="sm" onClick={() => { setDispatchModal(order.id); }}>
                      <Truck className="w-3.5 h-3.5" />Create Dispatch
                    </Button>
                  }
                />
              ))}
            </QueueSection>
          )}

          {/* ACTIVE (OUT FOR DELIVERY) */}
          {filteredQueue.active.length > 0 && (
            <QueueSection title="Out for Delivery" count={filteredQueue.active.length} accent="orange">
              {filteredQueue.active.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onToggle={() => updateOrder(order.id, (o) => ({ ...o, expanded: !o.expanded }))}
                  actions={null}
                >
                  {order.dispatches.filter((d) => d.status === "OUT_FOR_DELIVERY").map((dispatch) => (
                    <DispatchRow
                      key={dispatch.id}
                      dispatch={dispatch}
                      order={order}
                      onPOD={() => openPODModal(order.id, dispatch.id)}
                      onPrint={() => printChallan(order, dispatch)}
                      onRetry={() => retryDispatch(order.id, dispatch.id)}
                    />
                  ))}
                </OrderCard>
              ))}
            </QueueSection>
          )}

          {/* DONE — delivered and failed orders separated by tint */}
          {filteredQueue.done.length > 0 && (
            <QueueSection title="Completed" count={filteredQueue.done.length} accent="gray">
              {/* Delivered orders first */}
              {filteredQueue.done
                .filter((o) => o.dispatches.every((d) => d.status !== "FAILED"))
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onToggle={() => updateOrder(order.id, (o) => ({ ...o, expanded: !o.expanded }))}
                    actions={null}
                  >
                    {order.dispatches.map((dispatch) => (
                      <DispatchRow
                        key={dispatch.id}
                        dispatch={dispatch}
                        order={order}
                        onPOD={() => openPODModal(order.id, dispatch.id)}
                        onPrint={() => printChallan(order, dispatch)}
                        onRetry={() => retryDispatch(order.id, dispatch.id)}
                      />
                    ))}
                  </OrderCard>
                ))}

              {/* Divider before failed orders */}
              {filteredQueue.done.some((o) => o.dispatches.every((d) => d.status !== "FAILED")) &&
                filteredQueue.done.some((o) => o.dispatches.some((d) => d.status === "FAILED")) && (
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-red-200" />
                    <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide px-1">Failed Deliveries</span>
                    <div className="flex-1 h-px bg-red-200" />
                  </div>
                )}

              {/* Failed orders with red tint */}
              {filteredQueue.done
                .filter((o) => o.dispatches.some((d) => d.status === "FAILED"))
                .map((order) => (
                  <div key={order.id} className="rounded-xl ring-1 ring-red-200 bg-red-50/40">
                    <OrderCard
                      order={order}
                      onToggle={() => updateOrder(order.id, (o) => ({ ...o, expanded: !o.expanded }))}
                      actions={null}
                    >
                      {order.dispatches.map((dispatch) => (
                        <DispatchRow
                          key={dispatch.id}
                          dispatch={dispatch}
                          order={order}
                          onPOD={() => openPODModal(order.id, dispatch.id)}
                          onPrint={() => printChallan(order, dispatch)}
                          onRetry={() => retryDispatch(order.id, dispatch.id)}
                        />
                      ))}
                    </OrderCard>
                  </div>
                ))}
            </QueueSection>
          )}
        </div>
      )}

      {/* ── Create Dispatch Modal ─────────────────────────────────────────── */}
      <Dialog open={!!dispatchModal} onOpenChange={(o) => !o && setDispatchModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4" />Create Dispatch
            </DialogTitle>
          </DialogHeader>
          {dispatchModal && (() => {
            const order = orderState.find((o) => o.id === dispatchModal);
            if (!order) return null;
            return (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 border p-3 text-sm">
                  <p className="font-medium">{order.clientName}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber} · {order.deliveryAddresses.length} address{order.deliveryAddresses.length !== 1 ? "es" : ""}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Driver Name *</Label>
                    <Input
                      value={dispatchForm.driverName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                      placeholder="Ramesh Kumar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Driver Phone</Label>
                    <Input
                      value={dispatchForm.driverPhone}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" />Vehicle Number *</Label>
                    <Input
                      value={dispatchForm.vehicleNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                      placeholder="MH01AB1234"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Expected Delivery</Label>
                    <Input
                      type="datetime-local"
                      value={dispatchForm.estimatedDelivery}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, estimatedDelivery: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">A challan will be auto-generated and printed on dispatch.</p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchModal(null)}>Cancel</Button>
            <Button onClick={() => dispatchModal && createDispatch(dispatchModal)}>
              <Truck className="w-3.5 h-3.5" />Dispatch & Print Challan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── POD Modal ────────────────────────────────────────────────────── */}
      <Dialog open={!!podModal} onOpenChange={(o) => !o && setPodModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4" />Update Delivery Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Status select */}
            <div className="space-y-1.5">
              <Label>Delivery Outcome *</Label>
              <Select
                value={podForm.status}
                onValueChange={(v) => setPodForm({ ...podForm, status: v as DispatchStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELIVERED">✅ Delivered successfully</SelectItem>
                  <SelectItem value="FAILED">❌ Delivery failed</SelectItem>
                  <SelectItem value="RESCHEDULED">🔄 Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DELIVERED fields */}
            {podForm.status === "DELIVERED" && (
              <>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Receiver Name *</Label>
                  <Input
                    value={podForm.receiverName}
                    onChange={(e) => setPodForm({ ...podForm, receiverName: e.target.value })}
                    placeholder="Person who received the delivery"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" />Proof of Delivery Photo</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                      podForm.photoName ? "border-green-400 bg-green-50" : "border-muted-foreground/30 hover:border-primary/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {podForm.photoName ? (
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">{podForm.photoName}</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Click to upload photo evidence</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPodForm({ ...podForm, photoName: file.name });
                    }}
                  />
                  {podForm.photoName && (
                    <Button
                      variant="ghost" size="sm" className="text-xs h-6 px-2"
                      onClick={() => setPodForm({ ...podForm, photoName: null })}
                    >
                      Remove photo
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  POD timestamp will be recorded as: <strong className="text-foreground">{formatDateTime(new Date())}</strong>
                </div>
              </>
            )}

            {/* FAILED fields */}
            {podForm.status === "FAILED" && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Failure Reason</Label>
                <Textarea
                  value={podForm.failureReason}
                  onChange={(e) => setPodForm({ ...podForm, failureReason: e.target.value })}
                  placeholder="Address not found / recipient unavailable / damaged goods..."
                  rows={2}
                />
              </div>
            )}

            {/* RESCHEDULED fields */}
            {podForm.status === "RESCHEDULED" && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />New Delivery Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={podForm.rescheduledTo}
                  onChange={(e) => setPodForm({ ...podForm, rescheduledTo: e.target.value })}
                />
              </div>
            )}

            {/* Common notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={podForm.notes}
                onChange={(e) => setPodForm({ ...podForm, notes: e.target.value })}
                placeholder="Any additional delivery notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPodModal(null)}>Cancel</Button>
            <Button
              onClick={submitPOD}
              disabled={podForm.status === "DELIVERED" && !podForm.receiverName.trim()}
            >
              {podForm.status === "DELIVERED" ? "Confirm Delivery" : podForm.status === "FAILED" ? "Mark Failed" : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QueueSection({
  title, count, accent, children,
}: {
  title: string; count: number; accent: "blue" | "orange" | "green" | "gray";
  children: React.ReactNode;
}) {
  const accentMap = {
    blue:   "border-blue-400 text-blue-700 bg-blue-50",
    orange: "border-orange-400 text-orange-700 bg-orange-50",
    green:  "border-green-400 text-green-700 bg-green-50",
    gray:   "border-gray-300 text-gray-600 bg-gray-50",
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", accentMap[accent])}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OrderCard({
  order, onToggle, actions, children,
}: {
  order: DispatchOrder; onToggle: () => void; actions: React.ReactNode; children?: React.ReactNode;
}) {
  const isOverdue = new Date(order.deliveryDate) < new Date() && order.status !== "DELIVERED";
  return (
    <Card className={cn(isOverdue && "border-red-200")}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
              {isOverdue && (
                <Badge variant="destructive" className="text-xs h-4 px-1.5">Overdue</Badge>
              )}
            </div>
            <p className="font-semibold text-sm">{order.clientName}</p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.deliveryDate)}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.deliveryAddresses.length} address{order.deliveryAddresses.length !== 1 ? "es" : ""}</span>
              {order.quantity && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.quantity} units</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle}>
              {order.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {order.expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Addresses */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Delivery Addresses</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {order.deliveryAddresses.map((addr, i) => (
                <div key={addr.id} className="p-2.5 rounded-lg border text-xs bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{i + 1}. {addr.recipientName}</p>
                      <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />{addr.phone}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}
                      </p>
                    </div>
                    {addr.quantity && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{addr.quantity} units</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatches */}
          {children && <div>{children}</div>}
        </CardContent>
      )}
    </Card>
  );
}

function DispatchRow({
  dispatch, order, onPOD, onPrint, onRetry,
}: {
  dispatch: DispatchRecord; order: DispatchOrder;
  onPOD: () => void; onPrint: () => void; onRetry: () => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);
  const cfg = STATUS_CONFIG[dispatch.status] ?? STATUS_CONFIG.OUT_FOR_DELIVERY;

  return (
    <div className={cn("rounded-lg border p-3 space-y-2", cfg.bg)}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{dispatch.challanNumber}</span>
            <span className={cn("flex items-center gap-1 text-xs font-semibold", cfg.color)}>
              {cfg.icon}{cfg.label}
            </span>
          </div>
          <p className="text-sm font-medium mt-0.5">
            {dispatch.driverName} {dispatch.vehicleNumber && <span className="text-xs text-muted-foreground">· {dispatch.vehicleNumber}</span>}
          </p>
          {dispatch.driverPhone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />{dispatch.driverPhone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onPrint}>
            <FileText className="w-3 h-3" />Challan
          </Button>
          {dispatch.status === "OUT_FOR_DELIVERY" && (
            <Button size="sm" className="h-7 text-xs" onClick={onPOD}>
              <Upload className="w-3 h-3" />Update POD
            </Button>
          )}
          {(dispatch.status === "FAILED" || dispatch.status === "RESCHEDULED") && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRetry}>
              <RotateCcw className="w-3 h-3" />Re-dispatch
            </Button>
          )}
          {(dispatch.status === "DELIVERED" || dispatch.status === "FAILED") && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onPOD}>
              <Upload className="w-3 h-3" />Update
            </Button>
          )}
        </div>
      </div>

      {/* ETA badge for active dispatches */}
      {dispatch.status === "OUT_FOR_DELIVERY" && dispatch.estimatedDelivery && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold">
          <Navigation className="w-3 h-3" />
          ETA: {dispatch.estimatedDelivery.toLocaleDateString("en-IN", { day: "numeric", month: "short" })},{" "}
          {dispatch.estimatedDelivery.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />Dispatched: {formatDateTime(dispatch.dispatchedAt)}
        </span>
        {dispatch.estimatedDelivery && dispatch.status !== "OUT_FOR_DELIVERY" && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />Est: {formatDateTime(dispatch.estimatedDelivery)}
          </span>
        )}
        {dispatch.deliveredAt && (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="w-3 h-3" />Delivered: {formatDateTime(dispatch.deliveredAt)}
          </span>
        )}
      </div>

      {/* POD confirmation */}
      {dispatch.status === "DELIVERED" && dispatch.podReceiverName && (
        <div className="rounded-md bg-green-100 border border-green-200 px-3 py-2 text-xs">
          <p className="font-semibold text-green-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />Delivery Confirmed
          </p>
          <p className="text-green-700 mt-0.5">
            Received by <strong>{dispatch.podReceiverName}</strong> at {dispatch.podTimestamp ? formatDateTime(dispatch.podTimestamp) : "—"}
          </p>
          {dispatch.podPhotoName && (
            <p className="text-green-700 flex items-center gap-1 mt-0.5">
              <Camera className="w-3 h-3" />Photo: {dispatch.podPhotoName}
            </p>
          )}
          {dispatch.podNotes && <p className="text-green-700 mt-0.5 italic">"{dispatch.podNotes}"</p>}
        </div>
      )}

      {/* Failure info */}
      {dispatch.status === "FAILED" && dispatch.failureReason && (
        <div className="rounded-md bg-red-100 border border-red-200 px-3 py-2 text-xs">
          <p className="font-semibold text-red-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />Delivery Failed
          </p>
          <p className="text-red-700 mt-0.5">{dispatch.failureReason}</p>
        </div>
      )}

      {/* Rescheduled info */}
      {dispatch.status === "RESCHEDULED" && dispatch.rescheduledTo && (
        <div className="rounded-md bg-purple-100 border border-purple-200 px-3 py-2 text-xs">
          <p className="font-semibold text-purple-800 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />Rescheduled
          </p>
          <p className="text-purple-700 mt-0.5">New delivery: {formatDateTime(dispatch.rescheduledTo)}</p>
        </div>
      )}

      {/* Activity timeline toggle */}
      {dispatch.timeline.length > 0 && (
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Hash className="w-3 h-3" />
            {showTimeline ? "Hide" : "Show"} timeline ({dispatch.timeline.length} events)
            {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTimeline && (
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-muted ml-1.5">
              {dispatch.timeline.map((entry) => (
                <div key={entry.id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0 -ml-[5px]" />
                    <span className="font-semibold text-foreground">{entry.event}</span>
                    <span className="text-muted-foreground">{formatDateTime(entry.time)}</span>
                  </div>
                  {entry.detail && <p className="text-muted-foreground ml-3">{entry.detail}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
