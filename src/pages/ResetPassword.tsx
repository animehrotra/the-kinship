import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Heart, Check, X } from "lucide-react";
import { getPasswordErrors, type PasswordCheck } from "@/lib/passwordValidation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  const checks = getPasswordErrors(password);
  const allPassed = checks.every((c) => c.passed);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allPassed) {
      toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <img src="/favicon.png" alt="Kinship logo" className="w-12 h-12 mb-2 rounded-2xl mx-auto" />
          <p className="text-muted-foreground">Verifying your reset link…</p>
          <p className="text-xs text-muted-foreground">If nothing happens, the link may have expired. <a href="/auth" className="text-primary hover:underline">Go back to sign in</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <img src="/favicon.png" alt="Kinship logo" className="w-12 h-12 mb-2 rounded-2xl mx-auto" />
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Set new password</h1>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">New password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <PasswordChecklist checks={checks} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !allPassed}>
                {submitting ? "Please wait..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PasswordChecklist({ checks }: { checks: PasswordCheck[] }) {
  return (
    <ul className="space-y-1 mt-2">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-2 text-xs">
          {c.passed ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className={c.passed ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}
