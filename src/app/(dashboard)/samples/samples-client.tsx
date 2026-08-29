"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FlaskConical, ChefHat, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SampleStatus } from "@/lib/mock-data";

interface Sample {
  id: string;
  clientName: string;
  requirements: string;
  quantity: number;
  status: SampleStatus;
  clientFeedback: string | null;
  rating: number | null;
  kitchenNotes: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  requestedBy: { name: string };
  lead: { companyName: string } | null;
  items: { id: string; productName: string; quantity: number }[];
}

const STATUSES: SampleStatus[] = ["REQUESTED", "IN_KITCHEN", "READY", "DELIVERED", "APPROVED", "NEEDS_CHANGES", "CLOSED"];

export function SamplesClient({ samples, currentUser }: { samples: Sample[]; currentUser: { role: string } }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({ clientName: "", requirements: "", quantity: "1" });
  const [feedback, setFeedback] = useState({ rating: "5", clientFeedback: "", status: "APPROVED" as SampleStatus });

  const filtered = filterStatus === "all" ? samples : samples.filter((s) => s.status === filterStatus);

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch("/api/samples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Sample request created.");
      setShowNew(false);
      router.refresh();
    } else toast.error("Failed to create sample.");
    setSaving(false);
  };

  const handleStatusChange = async (sampleId: string, status: SampleStatus) => {
    const res = await fetch(`/api/samples/${sampleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status updated."); router.refresh(); }
    else toast.error("Failed to update.");
  };

  const handleFeedback = async () => {
    if (!showFeedback) return;
    setSaving(true);
    const res = await fetch(`/api/samples/${showFeedback}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: feedback.status,
        clientFeedback: feedback.clientFeedback,
        rating: parseInt(feedback.rating),
      }),
    });
    if (res.ok) {
      toast.success("Feedback recorded.");
      setShowFeedback(null);
      router.refresh();
    } else toast.error("Failed.");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sample & Tasting Requests</h1>
          <p className="text-muted-foreground text-sm">{samples.length} sample{samples.length !== 1 ? "s" : ""} in workflow</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Request Sample</Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            filterStatus === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:border-foreground/40"
          )}
        >
          All ({samples.length})
        </button>
        {STATUSES.map((s) => {
          const count = samples.filter((x) => x.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                filterStatus === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40"
              )}
            >
              {s.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No samples found"
          description="Request a sample kit to kick off the tasting, client approval, and bulk order confirmation workflow."
          action={{ label: "Request Sample", onClick: () => setShowNew(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sample) => {
            const accentColor =
              sample.status === "APPROVED" ? "border-t-emerald-500" :
              sample.status === "DELIVERED" ? "border-t-blue-500" :
              sample.status === "NEEDS_CHANGES" ? "border-t-amber-500" :
              sample.status === "CLOSED" ? "border-t-muted-foreground/30" :
              sample.status === "IN_KITCHEN" ? "border-t-purple-500" :
              sample.status === "READY" ? "border-t-teal-500" :
              "border-t-border";
            return (
            <Card key={sample.id} className={cn("hover:shadow-md transition-shadow border-t-2", accentColor)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{sample.clientName}</p>
                    {sample.lead && <p className="text-xs text-muted-foreground">{sample.lead.companyName}</p>}
                  </div>
                  <StatusBadge status={sample.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sample.requirements}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 flex-wrap gap-1">
                  <span>Qty: {sample.quantity}</span>
                  <span>By: {sample.requestedBy.name}</span>
                  {(() => {
                    if (sample.deliveredAt && sample.status === "DELIVERED") {
                      return <span>Delivered {formatDate(sample.deliveredAt)}</span>;
                    }
                    const days = Math.floor((Date.now() - new Date(sample.createdAt).getTime()) / 864e5);
                    if (days > 2 && !["APPROVED","CLOSED","DELIVERED"].includes(sample.status)) {
                      return <span className="text-amber-600 font-medium">{days}d in progress</span>;
                    }
                    return <span>{formatDate(sample.createdAt)}</span>;
                  })()}
                </div>
                {sample.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < sample.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{sample.rating}/5</span>
                  </div>
                )}
                {sample.clientFeedback && (
                  <p className="text-xs italic text-muted-foreground mb-3">"{sample.clientFeedback}"</p>
                )}
                <div className="flex items-center gap-2">
                  <Select value={sample.status} onValueChange={(v) => handleStatusChange(sample.id, v as SampleStatus)}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {sample.status === "DELIVERED" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowFeedback(sample.id)}>
                      Feedback
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* New Sample Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Sample</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client / Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Requirements *</Label>
              <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="Describe what the client wants to taste / see..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Sample Quantity</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={!!showFeedback} onOpenChange={(o) => !o && setShowFeedback(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Capture Client Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating (1–5)</Label>
              <Select value={feedback.rating} onValueChange={(v) => setFeedback({ ...feedback, rating: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((r) => <SelectItem key={r} value={r}>{r} ⭐</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client Feedback</Label>
              <Textarea value={feedback.clientFeedback} onChange={(e) => setFeedback({ ...feedback, clientFeedback: e.target.value })}
                placeholder="What did the client say?" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Decision</Label>
              <Select value={feedback.status} onValueChange={(v) => setFeedback({ ...feedback, status: v as SampleStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approved ✓</SelectItem>
                  <SelectItem value="NEEDS_CHANGES">Needs Changes</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedback(null)}>Cancel</Button>
            <Button onClick={handleFeedback} disabled={saving}>{saving ? "Saving..." : "Save Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
