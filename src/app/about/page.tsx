import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BatteryCharging,
  Check,
  Cpu,
  Database,
  Home,
  Plug,
  Radio,
  Sun,
  Wifi,
  Zap,
} from "lucide-react";

const flow = [
  { icon: Plug, title: "Appliance", note: "Switch or sensor event" },
  { icon: Activity, title: "GRIDWISE API", note: "Records ON / OFF" },
  { icon: Database, title: "Supabase", note: "Saves events and sessions" },
  { icon: Home, title: "Your dashboard", note: "Shows updates and estimates" },
];

const setupSteps = [
  ["1", "Create a Supabase project", "Create the database, then run supabase-schema.sql in the Supabase SQL Editor."],
  ["2", "Add the connection details", "Put the two Supabase values shown below in .env.local."],
  ["3", "Add your home and appliances", "Enter appliance power and usual daily hours. GRIDWISE uses these to estimate electricity use."],
  ["4", "Connect real sensors (optional)", "Set up an ESP32 or similar device to send appliance ON / OFF events to the sensor API."],
  ["5", "Run or publish the app", "Run pnpm install, then pnpm dev. For Vercel, add the same two values in Project Settings → Environment Variables."],
];

const requirements = [
  { icon: Cpu, title: "App", note: "Node.js and this GRIDWISE project." },
  { icon: Database, title: "Database", note: "A Supabase project with the provided schema installed." },
  { icon: Wifi, title: "Connection", note: "Internet access for the app to reach Supabase." },
  { icon: Plug, title: "Sensors (optional)", note: "ESP32 or similar hardware, plus a sensor or relay for each appliance you want to monitor." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">About GRIDWISE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your home&apos;s electricity, made easier to understand.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          GRIDWISE helps households in Kerala see which appliances use electricity, follow estimated costs, and make better use of rooftop solar.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="What GRIDWISE helps with">
        {[
          { icon: Zap, title: "See your use", text: "Track appliances and estimate daily and monthly units." },
          { icon: Sun, title: "Use daylight well", text: "Plan flexible jobs for sunny hours when your panels can help." },
          { icon: BatteryCharging, title: "Understand the bill", text: "View a KSEB-style estimate based on the settings and use entered." },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-bold">How it works</h2>
          <p className="mt-1 text-sm text-muted-foreground">From an appliance change to an updated view in GRIDWISE.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
          {flow.map(({ icon: Icon, title, note }, index) => (
            <div key={title} className="contents">
              <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/60 p-3 sm:flex-col sm:items-start sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{note}</p></div>
              </div>
              {index < flow.length - 1 && <><ArrowRight className="mx-auto hidden h-4 w-4 text-muted-foreground sm:block" /><ArrowDown className="mx-auto h-4 w-4 text-muted-foreground sm:hidden" /></>}
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
          Without sensors, appliance state and electricity use are based on information entered in the app. Solar, bill, and savings numbers are estimates.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-7">
          <h2 className="text-xl font-bold">What you need</h2>
          <ul className="mt-5 space-y-4">
            {requirements.map(({ icon: Icon, title, note }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong className="text-sm">{title}</strong><span className="mt-0.5 block text-sm text-muted-foreground">{note}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border/70 pt-4">
            <h3 className="text-sm font-semibold">Supabase settings in .env.local</h3>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#101a16] p-3 text-xs leading-5 text-emerald-100"><code>{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}</code></pre>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-7">
          <h2 className="text-xl font-bold">Connect a sensor</h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">Send an event when an appliance turns on or off. Use its ID from the database.</p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#101a16] p-4 text-xs leading-5 text-emerald-100"><code>{`POST /api/sensor
Content-Type: application/json

{
  "appliance_id": "your-appliance-id",
  "event_type": "on",
  "source": "sensor"
}`}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Send <code className="rounded bg-muted px-1 py-0.5">event_type: &quot;off&quot;</code> when it turns off. GRIDWISE records the event and updates the appliance session.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-7">
        <div className="flex items-start gap-3">
          <Radio className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold">Remote control</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Forgot to turn off a light after leaving home, or want to switch one on before you arrive? Remote control lets you manage connected home appliances from your phone, wherever you are. The controls here show how it could work.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Choose", "Pick a light or appliance in the app."],
            ["Switch from anywhere", "For example, turn off a light you left on, or turn one on before you get home."],
            ["See the change", "The app shows whether the appliance is on or off."],
          ].map(([title, note]) => <div key={title} className="rounded-xl bg-muted/50 p-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p></div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Try the controls in the <Link href="/remote-control" className="font-semibold text-primary hover:underline">Remote Control</Link> tab.</p>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-7">
        <h2 className="text-xl font-bold">Set it up</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {setupSteps.map(([number, title, note]) => (
            <li key={number} className="rounded-xl bg-muted/50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</span>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/appliances" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Add appliances <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/settings" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Open settings</Link>
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />KSEB-style amounts and solar savings are estimates. Check your current tariff and actual KSEB bill for the payable amount.</p>
    </main>
  );
}
