"use client";

import {
  Sun,
  BatteryCharging,
  Zap,
  Leaf,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useApp } from "@/components/providers/AppProvider";
import {
  generateDeterministicHourlyReadings,
  generateHourlySolar,
  calcCo2Saved,
} from "@/lib/calculations/energy";
import { formatCurrency, formatPower } from "@/lib/utils";

export default function SolarPage() {
  const { state, stats } = useApp();
  const solar = state.solar;

  // Daily solar estimate: capacity * 4.5 peak sun hours * efficiency factor
  const dailySolarKwh = Math.round(solar.panel_capacity_kw * 4.5 * 10) / 10;
  const monthlySolarKwh = Math.round(dailySolarKwh * 30);
  const monthlySolarSavings = Math.round(monthlySolarKwh * state.household.tariff_rate);
  const co2SavedMonthKg = Math.round(calcCo2Saved(monthlySolarKwh));

  // Hourly curves
  const hourlyData = generateDeterministicHourlyReadings(state.appliances);
  const solarHourly = generateHourlySolar(dailySolarKwh);

  const chartData = hourlyData.map((d) => {
    const s = solarHourly.find((sh) => sh.hour === d.hour)?.solar_kw ?? 0;
    const solarW = Math.round(s * 1000);
    return {
      hour: `${d.hour.toString().padStart(2, "0")}:00`,
      solarW,
      loadW: d.power_w,
      gridImportW: Math.max(0, d.power_w - solarW),
      gridExportW: Math.max(0, solarW - d.power_w),
    };
  });

  // Current real-time solar generation estimate at midday (or scale by current hour)
  const currentHour = new Date().getHours();
  const currentSolarFraction =
    solarHourly.find((s) => s.hour === currentHour)?.solar_kw ?? 0;
  const currentSolarW = Math.round(currentSolarFraction * 1000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Solar Power</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimated solar power, battery charge and possible electricity bill savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            {solar.panel_capacity_kw} kW rooftop solar
          </span>
        </div>
      </div>

      {/* 4 Solar KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Today's Generation */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Estimated power from your panels today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-amber-500">
            {dailySolarKwh} kWh
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Could be worth about {formatCurrency(dailySolarKwh * state.household.tariff_rate)} today
          </div>
        </div>

        {/* Card 2: Battery Storage Status */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Battery Charge</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {solar.battery_level}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({((solar.battery_capacity_kwh * solar.battery_level) / 100).toFixed(1)} / {solar.battery_capacity_kwh} kWh)
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Stored for later use (estimate)
          </div>
        </div>

        {/* Card 3: Monthly Net Savings */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Possible monthly bill reduction</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-foreground">
            {formatCurrency(monthlySolarSavings)}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            About {monthlySolarKwh} units from solar in a month (estimate)
          </div>
        </div>

        {/* Card 4: CO2 Footprint Reduction */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Less pollution from grid power</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-emerald-500">
            {co2SavedMonthKg} kg
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Approximate estimate from solar electricity
          </div>
        </div>
      </div>

      {/* Energy Flow Telemetry Widget */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <h2 className="text-base font-semibold mb-1">Where solar power goes</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Estimated split between your home, battery and electricity grid.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flow 1: Direct Consumption */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              Used at home
            </span>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {formatPower(Math.min(currentSolarW, stats.current_power_w))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solar power used by appliances in this estimate.
            </p>
          </div>

          {/* Flow 2: Battery Charging */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              Going to battery
            </span>
            <div className="text-2xl font-bold text-purple-400 mt-1 tabular-nums">
              {formatPower(currentSolarW > 500 ? 450 : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated power stored in the battery.
            </p>
          </div>

          {/* Flow 3: Net Metering Export */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              Extra power to grid
            </span>
            <div className="text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
              {formatPower(Math.max(0, currentSolarW - stats.current_power_w - 450))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated extra power sent to KSEB. Export needs an approved net meter.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="text-sm font-semibold text-foreground">Can extra solar lower your bill or earn a credit?</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            With an approved net meter, extra units sent to KSEB are usually adjusted against electricity you draw from the grid. If units are still left after the applicable settlement period, KSEB may settle them under the current KSERC rules. The rate and payment method depend on your connection and the rules in effect; this estimate does not calculate a KSEB credit or cash payment.
          </p>
        </div>
      </div>

      {/* Estimated solar power and home use */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold">Estimated Solar Power and Home Use</h2>
            <p className="text-xs text-muted-foreground">
              See how estimated solar power changes through the day, alongside home use.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Solar power (W)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Home use (W)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" W" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20, 31, 24, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val, name) => [
                  `${val} W`,
                  name === "solarW" ? "Solar power" : "Home use",
                ]}
              />
              <Area
                type="monotone"
                dataKey="solarW"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#solarGenGrad)"
              />
              <Area
                type="monotone"
                dataKey="loadW"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#demandGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PV System Hardware Specifications Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <h2 className="text-base font-semibold mb-3">Your Solar Setup</h2>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Solar system size</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.panel_capacity_kw} kWp
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Number of panels</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.panel_count} Panels
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Panel type</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {(solar.panel_efficiency * 100).toFixed(0)}% Monocrystalline
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Direction and tilt</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block capitalize">
              {solar.facing} ({solar.tilt_angle}°)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Battery size</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.battery_capacity_kwh} kWh Li-Ion
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Installed</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              June 2023
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
