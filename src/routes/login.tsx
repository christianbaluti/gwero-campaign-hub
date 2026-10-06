import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { bootstrapAdministrator, getAuthStatus, login } from "@/lib/auth.functions";
import { getPublicBranding } from "@/lib/settings.functions";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  loader: () => getPublicBranding(),
  head: ({ loaderData }) => ({
    meta: [{ title: `${String(loaderData?.["system_name"] || "Gwero OS")} · Sign in` }],
    links: loaderData?.["icon_url"] ? [{ rel: "icon", href: String(loaderData["icon_url"]) }] : [],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => getAuthStatus(),
  });
  const branding = Route.useLoaderData();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const systemName = String(branding["system_name"] || "Gwero OS");
  const logo = String(branding["logo_url"] || "");
  const icon = String(branding["icon_url"] || logo || "/favicon.ico");
  useEffect(() => {
    document.title = `${systemName} · Sign in`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = icon;
  }, [icon, systemName]);
  const submit = async () => {
    setErrorMessage("");
    setBusy(true);
    try {
      if (data?.bootstrapRequired) await bootstrapAdministrator({ data: form });
      else await login({ data: { email: form.email, password: form.password } });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setErrorMessage(message);
      toast.error(message);
      setBusy(false);
    }
  };
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/40 p-4 sm:p-8"
      style={
        {
          "--primary": String(branding["primary_color"] || "#00665a"),
          "--accent": String(branding["accent_color"] || "#dfecea"),
          fontFamily: String(branding["font_family"] || "Roboto"),
        } as CSSProperties
      }
    >
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border bg-background shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
          <div>
            {logo ? (
              <img
                src={logo}
                alt={systemName}
                className="h-14 max-w-60 object-contain object-left"
              />
            ) : (
              <p className="text-2xl font-black">{systemName}</p>
            )}
          </div>
          <div className="max-w-lg">
            <p className="text-4xl font-bold leading-tight">
              Your relationships, conversations and opportunities in one place.
            </p>
            <div className="mt-8 grid gap-4 text-sm text-primary-foreground/85">
              <p className="flex items-center gap-3">
                <CheckCircle2 className="size-5" /> One shared view of every prospect and contact
              </p>
              <p className="flex items-center gap-3">
                <Mail className="size-5" /> Email conversations connected to the right person
              </p>
              <p className="flex items-center gap-3">
                <ShieldCheck className="size-5" /> Role-based access for your whole team
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/60">Secure access to {systemName}</p>
        </section>
        <div className="grid place-items-center p-5 sm:p-12">
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardHeader className="space-y-3">
              {logo ? (
                <img
                  src={logo}
                  alt={systemName}
                  className="h-14 max-w-56 object-contain object-left lg:hidden"
                />
              ) : (
                <div className="grid size-12 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
                  {systemName.charAt(0)}
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">
                  {data?.bootstrapRequired
                    ? `Set up ${systemName}`
                    : `Welcome back to ${systemName}`}
                </CardTitle>
                <CardDescription className="mt-2">
                  {data?.bootstrapRequired
                    ? "Create the first administrator account. Future users are managed in Settings."
                    : "Use your system account to access company and contact information."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}
              {data?.bootstrapRequired ? (
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => setForm((old) => ({ ...old, fullName: e.target.value }))}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((old) => ({ ...old, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={data?.bootstrapRequired ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => setForm((old) => ({ ...old, password: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submit();
                  }}
                />
                {data?.bootstrapRequired ? (
                  <p className="text-xs text-muted-foreground">Use at least 10 characters.</p>
                ) : null}
              </div>
              <Button
                className="w-full"
                disabled={
                  busy ||
                  isLoading ||
                  !form.email ||
                  !form.password ||
                  (data?.bootstrapRequired && !form.fullName)
                }
                onClick={() => void submit()}
              >
                {busy
                  ? "Please wait…"
                  : data?.bootstrapRequired
                    ? "Create administrator"
                    : "Sign in"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
