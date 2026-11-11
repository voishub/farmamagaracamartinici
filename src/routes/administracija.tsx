import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/donkey-logo.png";

export const Route = createFileRoute("/administracija")({
  head: () => ({
    meta: [
      { title: "Prijava za admina — Farma Magarica" },
      { name: "description", content: "Prijava za uređivanje sajta farme magarica." },
      { property: "og:title", content: "Prijava za admina — Farma Magarica" },
      { property: "og:description", content: "Prijava za uređivanje sajta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/" });
        else toast.success("Provjerite email i potvrdite nalog.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-xl">
        <div className="text-center">
          <img src={logo} alt="" width={64} height={64} className="mx-auto size-16" />
          <h1 className="mt-3 text-2xl font-semibold">{mode === "in" ? "Prijava" : "Registracija"}</h1>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Lozinka</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {mode === "in" ? "Prijavi se" : "Registruj se"}
        </Button>
        <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Nemate nalog? Registracija" : "Imate nalog? Prijava"}
        </button>
        {mode === "in" && (
          <button type="button" className="w-full text-sm text-primary" onClick={async () => {
            if (!email) { toast.error("Upišite email iznad."); return; }
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
            if (error) toast.error(error.message); else toast.success("Poslali smo vam email sa linkom za novu lozinku.");
          }}>Zaboravljena lozinka?</button>
        )}
        <a href="/" className="block text-center text-sm text-primary">← Nazad na sajt</a>
      </form>
    </div>
  );
}
