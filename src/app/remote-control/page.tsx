"use client";

import { useState } from "react";
import { Home, Lightbulb, Power, Radio, Tv, WashingMachine, Wind, Zap } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { cn } from "@/lib/utils";

const applianceIcons: Record<string, typeof Lightbulb> = {
  lighting: Lightbulb,
  cooling: Wind,
  entertainment: Tv,
  laundry: WashingMachine,
};

export default function RemoteControlPage() {
  const { state } = useApp();
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const appliances = state.appliances.filter((appliance) => appliance.is_active);

  function toggleSwitch(applianceId: string, name: string, currentState: boolean) {
    const nextState = !currentState;
    setSwitchStates((current) => ({ ...current, [applianceId]: nextState }));
    setMessage(`${name} switched ${nextState ? "on" : "off"}.`);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">GRIDWISE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Control your home</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">See how you could switch lights and appliances from your phone, even when you are away.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Radio className="h-4 w-4" /> Remote controls</span>
      </header>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5" aria-label="How remote control works">
        <div className="flex items-start gap-3"><Home className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-sm font-semibold">Your phone → your home switches</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Tap a switch below to see how you could control appliances while away from home.</p></div></div>
        <div className="mt-4 grid gap-2 text-center sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <FlowStep icon={Radio} label="Your phone" />
          <span className="text-primary" aria-hidden="true">→</span>
          <FlowStep icon={Zap} label="Wi-Fi" />
          <span className="text-primary" aria-hidden="true">→</span>
          <FlowStep icon={Power} label="Home switch" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-lg font-bold">Your appliances</h2><p className="text-sm text-muted-foreground">Tap a button to see how remote switching could look.</p></div>
          <span className="text-xs text-muted-foreground">{appliances.length} {appliances.length === 1 ? "appliance" : "appliances"}</span>
        </div>
        {appliances.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {appliances.map((appliance) => {
            const isOn = switchStates[appliance.id] ?? appliance.status === "on";
            const Icon = applianceIcons[appliance.category] ?? Power;
            return <article key={appliance.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", isOn ? "bg-primary" : "bg-muted-foreground/50")} />{isOn ? "On" : "Off"}</span>
              </div>
              <h3 className="mt-4 truncate font-semibold">{appliance.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{appliance.rated_power_w} W · {appliance.category}</p>
              <button type="button" onClick={() => toggleSwitch(appliance.id, appliance.name, isOn)} aria-pressed={isOn} className={cn("mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors", isOn ? "border border-border hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90")}><Power className="h-4 w-4" />Turn {isOn ? "off" : "on"}</button>
            </article>;
          })}
        </div> : <div className="rounded-2xl border border-dashed border-border p-8 text-center"><Power className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No appliances added yet</h3><p className="mt-1 text-sm text-muted-foreground">Add appliances first to see them here.</p></div>}
      </section>

      {message && <p role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{message}</p>}
    </main>
  );
}

function FlowStep({ icon: Icon, label }: { icon: typeof Radio; label: string }) {
  return <div className="flex items-center justify-center gap-2 rounded-xl bg-card px-3 py-2.5 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{label}</div>;
}
