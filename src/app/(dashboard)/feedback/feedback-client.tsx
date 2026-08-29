"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, MessageSquare, ThumbsUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  overallRating: number;
  tasteRating: number | null;
  packagingRating: number | null;
  deliveryRating: number | null;
  comments: string | null;
  // Support both shapes: nested order object OR flat fields from mock data
  repeatInterest?: boolean;
  wouldRepeatOrder?: boolean;
  createdAt?: Date;
  collectedAt?: Date;
  order?: { orderNumber: string; clientName: string; eventType: string };
  // Flat mock fields
  orderNumber?: string;
  clientName?: string;
  companyName?: string;
  collectedBy: { name: string };
}

interface FeedbackClientProps {
  feedback: Feedback[];
  pendingFeedback: Array<{ id: string; orderNumber: string; clientName: string; deliveryDate: Date }>;
  currentUser: { role: string };
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(
          size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5",
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted"
        )} />
      ))}
    </div>
  );
}

export function FeedbackClient({ feedback, pendingFeedback, currentUser }: FeedbackClientProps) {
  const router = useRouter();
  const [showCollect, setShowCollect] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    overallRating: "5", tasteRating: "5", packagingRating: "5", deliveryRating: "5",
    comments: "", repeatInterest: false,
  });

  const submitFeedback = async () => {
    if (!showCollect) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Feedback saved! Thank you.");
    setShowCollect(null);
    setSaving(false);
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.overallRating, 0) / feedback.length).toFixed(1)
    : "—";

  const repeatIntCount = feedback.filter((f) => f.repeatInterest || f.wouldRepeatOrder).length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Client Feedback</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Average Rating</p>
          <p className="text-2xl font-bold">{avgRating} ⭐</p>
          <p className="text-xs text-muted-foreground">{feedback.length} responses</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Repeat Interest</p>
          <p className="text-2xl font-bold text-green-600">{repeatIntCount}</p>
          <p className="text-xs text-muted-foreground">of {feedback.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Pending Feedback</p>
          <p className="text-2xl font-bold text-orange-600">{pendingFeedback.length}</p>
          <p className="text-xs text-muted-foreground">delivered, not collected</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">5-Star Ratings</p>
          <p className="text-2xl font-bold text-yellow-500">{feedback.filter((f) => f.overallRating === 5).length}</p>
          <p className="text-xs text-muted-foreground">excellent</p>
        </CardContent></Card>
      </div>

      {/* Pending feedback */}
      {pendingFeedback.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Collect Feedback</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingFeedback.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                      <p className="font-medium text-sm">{order.clientName}</p>
                      <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">Delivered: {formatDate(order.deliveryDate)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => setShowCollect(order.id)}>
                    Collect Feedback
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" description="Collect feedback from clients after delivery to track satisfaction." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {feedback.map((f) => {
            const clientName = f.order?.clientName ?? f.clientName ?? "—";
            const orderNumber = f.order?.orderNumber ?? f.orderNumber ?? "—";
            const eventType = f.order?.eventType ?? "";
            const feedbackDate = f.createdAt ?? f.collectedAt;
            const isRepeat = f.repeatInterest || f.wouldRepeatOrder;
            return (
            <Card key={f.id} className={cn(
              "transition-colors",
              f.overallRating >= 5
                ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10"
                : f.overallRating >= 4
                ? "border-blue-200/80 dark:border-blue-800/40"
                : f.overallRating >= 3
                ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10"
                : "border-red-200 dark:border-red-800/50 bg-red-50/20 dark:bg-red-950/10"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{orderNumber}{eventType ? ` • ${eventType}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <StarRating rating={f.overallRating} size="md" />
                    <p className="text-xs text-muted-foreground mt-0.5">{feedbackDate ? formatDate(feedbackDate) : ""}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  {f.tasteRating && (
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Product Quality</p>
                      <StarRating rating={f.tasteRating} />
                    </div>
                  )}
                  {f.packagingRating && (
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Presentation</p>
                      <StarRating rating={f.packagingRating} />
                    </div>
                  )}
                  {f.deliveryRating && (
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Delivery</p>
                      <StarRating rating={f.deliveryRating} />
                    </div>
                  )}
                </div>
                {f.comments && <p className="text-sm italic text-muted-foreground mb-2">"{f.comments}"</p>}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">By {f.collectedBy.name}</span>
                  <div className="flex items-center gap-2">
                    {f.overallRating <= 3 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                        onClick={() => toast.info(`Follow-up queued for ${clientName}`)}
                      >
                        <MessageSquare className="w-2.5 h-2.5 mr-0.5" />Follow Up
                      </Button>
                    )}
                    {isRepeat && (
                      <Badge variant="success" className="text-[10px]">
                        <ThumbsUp className="w-2.5 h-2.5 mr-0.5" />Repeat Interest
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Collect Feedback Dialog */}
      <Dialog open={!!showCollect} onOpenChange={(o) => !o && setShowCollect(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Client Feedback</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { key: "overallRating", label: "Overall Rating" },
              { key: "tasteRating", label: "Taste / Product Quality" },
              { key: "packagingRating", label: "Packaging & Presentation" },
              { key: "deliveryRating", label: "Delivery Experience" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Select value={(form as unknown as Record<string, string>)[key]} onValueChange={(v) => setForm({ ...form, [key]: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["5", "4", "3", "2", "1"].map((r) => (
                      <SelectItem key={r} value={r}>{r} {"⭐".repeat(parseInt(r))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Comments</Label>
              <Textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} placeholder="Client's feedback..." rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="repeat"
                checked={form.repeatInterest}
                onCheckedChange={(v) => setForm({ ...form, repeatInterest: !!v })}
              />
              <label htmlFor="repeat" className="text-sm cursor-pointer">Client expressed interest in repeat orders</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollect(null)}>Cancel</Button>
            <Button onClick={submitFeedback} disabled={saving}>{saving ? "Saving..." : "Save Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
