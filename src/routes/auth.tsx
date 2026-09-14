import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Belépés és regisztráció | NovaScripts" },
      {
        name: "description",
        content: "Lépj be a NovaScripts fiókodba a megvásárolt FiveM scriptek letöltéséhez és licenckulcsaid kezeléséhez.",
      },
      { property: "og:title", content: "Belépés | NovaScripts" },
      { property: "og:description", content: "Fiók a megvásárolt FiveM scriptek és licenckulcsok kezeléséhez." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Nem sikerült a belépés", { description: error.message });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Nem sikerült a regisztráció", { description: error.message });
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard" });
      return;
    }
    toast.success("Kész! Nézd meg az e-mailjeidet", {
      description: "Küldtünk egy megerősítő linket a fiók aktiválásához.",
    });
  };

  const googleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("A Google belépés nem sikerült");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Fiók</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Belépés után látod a megrendeléseidet, licenckulcsaidat és letöltéseidet.
      </p>

      <div className="panel mt-8 p-6">
        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Belépés
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Regisztráció
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-in">E-mail</Label>
              <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-in">Jelszó</Label>
              <Input id="pw-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={signIn} disabled={busy}>
              Belépés
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-up">Név vagy szerver neve</Label>
              <Input id="name-up" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-up">E-mail</Label>
              <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-up">Jelszó</Label>
              <Input id="pw-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={signUp} disabled={busy}>
              Regisztráció
            </Button>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> vagy <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={googleSignIn}>
          Folytatás Google-lel
        </Button>
      </div>
    </main>
  );
}
