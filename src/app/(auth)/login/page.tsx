"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Gift, Eye, EyeOff, Loader2, ArrowRight,
  Package, Users, BarChart3, Truck, Sparkles, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: "Admin",    desc: "Full access",  email: "admin@giftingops.in",    password: "admin1234",   color: "from-violet-500 to-purple-600" },
  { label: "Sales",    desc: "CRM & leads",  email: "sales@giftingops.in",    password: "sales1234",   color: "from-blue-500 to-cyan-600" },
  { label: "Ops Head", desc: "Production",   email: "chef@giftingops.in",     password: "chef1234",    color: "from-orange-500 to-amber-600" },
  { label: "Accounts", desc: "Finance",      email: "accounts@giftingops.in", password: "acc01234",    color: "from-emerald-500 to-green-600" },
];

const FEATURES = [
  { icon: Package,  label: "End-to-end order tracking" },
  { icon: Users,    label: "10 role-based access levels" },
  { icon: BarChart3,label: "Real-time operations dashboard" },
  { icon: Truck,    label: "Dispatch & delivery management" },
];

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const doSignIn = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return "Invalid email or password. Please try again.";
    }
    return null;
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setAuthError(null);
    const error = await doSignIn(data.email, data.password);
    if (error) {
      setAuthError(error);
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleDemoLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setDemoEmail(acc.email);
    setAuthError(null);
    setValue("email", acc.email);
    setValue("password", acc.password);

    const error = await doSignIn(acc.email, acc.password);
    if (error) {
      setAuthError("Demo login failed. Run `npm run db:seed` to create demo accounts.");
      setDemoEmail(null);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-[560px] relative overflow-hidden bg-[#06090f]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_100%,rgba(139,92,246,0.12),transparent)]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">GiftingOps</p>
              <p className="text-white/30 text-[11px] mt-0.5 tracking-wider uppercase">Operations Hub</p>
            </div>
          </div>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 w-fit mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-medium text-brand-300">Internal Operations Platform</span>
            </div>

            <h1 className="text-[42px] font-bold text-white leading-[1.15] tracking-tight mb-5">
              Your gifting ops,<br />
              <span className="bg-gradient-to-r from-brand-400 to-orange-300 bg-clip-text text-transparent">
                finally unified.
              </span>
            </h1>

            <p className="text-white/50 text-base leading-relaxed max-w-[360px] mb-10">
              Replace WhatsApp chaos, scattered spreadsheets, and missed follow-ups with one
              central system for your entire team.
            </p>

            <div className="space-y-2.5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <p className="text-sm text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-xs">© 2026 GiftingOps · Internal use only</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">GiftingOps</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
            <p className="text-muted-foreground text-sm mt-1">Access your operations dashboard</p>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Sign-in form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@giftingops.in"
                autoComplete="email"
                className="h-10"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-10 font-medium" disabled={loading || demoEmail !== null}>
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Continue</span><ArrowRight className="w-4 h-4 ml-1" /></>
              }
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Or sign in with demo account</span>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => handleDemoLogin(acc)}
                disabled={demoEmail !== null || loading}
                className="group relative flex flex-col items-start p-3.5 rounded-xl border border-border bg-card hover:border-brand-200 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {demoEmail === acc.email && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  </div>
                )}
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${acc.color} mb-2 flex items-center justify-center`}>
                  <span className="text-white text-[10px] font-bold">{acc.label[0]}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-none">{acc.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{acc.desc}</p>
              </button>
            ))}
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Demo accounts require a seeded database · Run <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">npm run db:seed</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
