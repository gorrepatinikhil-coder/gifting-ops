"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Shield, Plus, Key, Camera } from "lucide-react";
import type { MockUser, Role } from "@/lib/mock-data";

interface Props {
  currentUser: MockUser;
  users: MockUser[];
  userRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  OWNER: "Owner",
  SALES: "Sales",
  CHEF_OPS: "Chef / Ops Head",
  PRODUCTION: "Production",
  PACKING: "Packing",
  QC: "Quality Control",
  DISPATCH: "Dispatch",
  ACCOUNTS: "Accounts",
  STORE: "Store",
  VENDOR: "Vendor",
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  OWNER: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  SALES: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CHEF_OPS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  ACCOUNTS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  PRODUCTION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const ALL_ROLES: Role[] = [
  "ADMIN", "OWNER", "SALES", "CHEF_OPS", "PRODUCTION",
  "PACKING", "QC", "DISPATCH", "ACCOUNTS", "STORE", "VENDOR",
];

export function SettingsClient({ currentUser, users: initialUsers, userRole }: Props) {
  const [users, setUsers] = useState<MockUser[]>(initialUsers);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: currentUser.name,
    phone: currentUser.phone ?? "",
  });

  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "SALES" as Role, phone: "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "", newPassword: "", confirm: "",
  });

  const isAdmin = ["ADMIN", "OWNER"].includes(userRole);

  const handleProfileSave = async () => {
    if (!profile.name) return toast.error("Name is required");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success("Profile updated successfully");
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords do not match");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success("Password changed successfully");
    setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    setSaving(false);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      return toast.error("Name, email, and password are required");
    }
    if (newUser.password.length < 8) return toast.error("Password must be at least 8 characters");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const created: MockUser = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, created]);
    setAddOpen(false);
    setNewUser({ name: "", email: "", password: "", role: "SALES", phone: "" });
    toast.success("User created successfully");
    setSaving(false);
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive } : u));
    toast.success(isActive ? "User activated" : "User deactivated");
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: role as Role } : u));
    toast.success("Role updated");
  };

  const avatarBg = "bg-gradient-to-br from-brand-400 to-brand-600";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, security, and team</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="h-9 mb-6">
          <TabsTrigger value="profile" className="gap-1.5 text-xs h-7">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs h-7">
            <Key className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-1.5 text-xs h-7">
              <Shield className="h-3.5 w-3.5" /> Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription className="text-sm">Update your display name and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar row */}
              <div className="flex items-center gap-4">
                <div className={`relative h-16 w-16 rounded-2xl ${avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-white text-2xl font-bold">{currentUser.name.charAt(0)}</span>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
                    <Camera className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-base">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium mt-1 ${ROLE_BADGE[currentUser.role] ?? "bg-muted text-muted-foreground"}`}>
                    {ROLE_LABELS[currentUser.role] ?? currentUser.role}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email (read-only)</Label>
                  <Input value={currentUser.email} disabled className="bg-muted/50 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role (read-only)</Label>
                  <Input
                    value={ROLE_LABELS[currentUser.role] ?? currentUser.role}
                    disabled
                    className="bg-muted/50 text-muted-foreground"
                  />
                </div>
              </div>
              <Button onClick={handleProfileSave} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription className="text-sm">
                Keep your account secure with a strong, unique password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Current Password</Label>
                <Input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">New Password</Label>
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Confirm New Password</Label>
                <Input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={saving} size="sm">
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">{users.length} users · {users.filter((u) => u.isActive).length} active</p>
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3.5 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Full Name *</Label>
                      <Input value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} placeholder="Priya Sharma" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email *</Label>
                      <Input type="email" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} placeholder="priya@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Phone</Label>
                      <Input value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))} placeholder="+91 98765 43210" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Role *</Label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser((u) => ({ ...u, role: v as Role }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Temporary Password *</Label>
                      <Input type="password" value={newUser.password} onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))} placeholder="Min 8 characters" />
                    </div>
                    <Button onClick={handleAddUser} disabled={saving} className="w-full" size="sm">
                      {saving ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <Card key={u.id} className={`border-border/60 transition-opacity ${!u.isActive ? "opacity-50" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[13px] truncate">{u.name}</p>
                        {u.id === currentUser.id && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {u.id !== currentUser.id ? (
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="w-36 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r] ?? r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${ROLE_BADGE[u.role] ?? "bg-muted text-muted-foreground"}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      )}
                      {u.id !== currentUser.id && (
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={(val) => toggleActive(u.id, val)}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
