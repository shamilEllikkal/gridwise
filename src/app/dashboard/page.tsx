"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingDown,
  AlertTriangle,
  Sun,
  Activity,
  ArrowRight,
  ShieldAlert,
  Power,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "@/components/providers/AppProvider";
import { SessionsPanel } from "@/components/SessionsPanel";
import { EnergyFlowDiagram } from "@/components/EnergyFlowDiagram";
import {
  generateDeterministicHourlyReadings,
  generateHourlySolar,
} from "@/lib/calculations/energy";
import {
  APPLIANCE_CATEGORIES,
  CHART_COLORS,
  PEAK_HOURS,
  TARIFF_SLABS,
} from "@/constants";
import { formatCurrency, formatKwh, formatPower, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ApplianceCategory, ApplianceWithStats } from "@/types";

export default function DashboardPage() {
  const { state, stats, enrichedAppliances, toggleAppliance } = useApp();

  // Hourly readings for chart
  const hourlyData = generateDeterministicHourlyReadings(state.appliances);
  const solarHourly = generateHourlySolar(state.solar.panel_capacity_kw * 4.5);

  const combinedHourly = hourlyData.map((reading) => {
    const solarVal = solarHourly.find((s) => s.hour === reading.hour)?.solar_kw ?? 0;
    const solarW = Math.round(solarVal * 1000);
    return {
      hour: `${reading.hour.toString().padStart(2, "0")}:00`,
      hourNum: reading.hour,
      householdPower: reading.power_w,
      solarPower: solarW,
      netGridPower: Math.max(0, reading.power_w - solarW),
      isPeak: PEAK_HOURS.includes(reading.hour),
    };
  });

  // Category breakdown for Donut Chart
  const categoryMap = new Map<ApplianceCategory, number>();
  enrichedAppliances
    .filter((a: ApplianceWithStats) => a.is_active)
    .forEach((a: ApplianceWithStats) => {
      const current = categoryMap.get(a.category) ?? 0;
      categoryMap.set(a.category, current + a.daily_kwh);
    });

  const categoryData = Array.from(categoryMap.entries()).map(([cat, kwh]) => ({
    name: APPLIANCE_CATEGORIES[cat]?.label ?? cat,
    categoryKey: cat,
    value: Math.round(kwh * 100) / 100,
    color: APPLIANCE_CATEGORIES[cat]?.color ?? "#10b981",
  }));

  // Determine current tariff slab
  const currentMonthlyKwh = stats.total_month_kwh;
  const currentSlabIndex = TARIFF_SLABS.findIndex((s) => currentMonthlyKwh <= s.max_units);
  const currentSlab = TARIFF_SLABS[currentSlabIndex] ?? TARIFF_SLABS[TARIFF_SLABS.length - 1];
  const nextSlab = currentSlabIndex < TARIFF_SLABS.length - 1 ? TARIFF_SLABS[currentSlabIndex + 1] : null;
  const unitsToNextSlab = nextSlab ? Math.max(0, Math.round(currentSlab.max_units - currentMonthlyKwh)) : 0;

  // Real-time peak status
  const currentHour = new Date().getHours();
  const isCurrentPeak = PEAK_HOURS.includes(currentHour);

  // Quick toggle handler
  const handleToggle = (id: string, name: string, willTurnOn: boolean) => {
    toggleAppliance(id);
    toast.success(
      willTurnOn ? `${name} switched ON` : `${name} switched OFF`,
      {
        description: willTurnOn
          ? "Appliance turned on."
          : "Appliance turned off.",
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / System Health Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs",
              isCurrentPeak ? "bg-amber-500 animate-pulse" : "bg-primary"
            )}
          >
            {isCurrentPeak ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {isCurrentPeak ? "Busy electricity hours" : "Less busy hours"}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 text-[11px] font-medium rounded-full",
                  isCurrentPeak
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                )}
              >
                {isCurrentPeak ? "Busy time" : "Usual time"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bill estimate uses ₹{state.household.tariff_rate} per unit · Home power limit: {state.household.connected_load_kw} kW
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/scheduler"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs font-medium transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Smart Schedule</span>
          </Link>
          <Link
            href="/simulator"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Try a different schedule</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Current Power */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold tracking-wide">Power being used now</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {formatPower(stats.current_power_w)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Using about {Math.round((stats.current_power_w / (state.household.connected_load_kw * 1000)) * 100)}% of your {state.household.connected_load_kw} kW home limit
            </span>
            <span className="text-primary font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              Now
            </span>
          </div>
        </motion.div>

        {/* Stat 2: Today's Consumption */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold tracking-wide">Electricity used today</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {formatKwh(stats.total_today_kwh)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Cost: {formatCurrency(stats.total_today_kwh * state.household.tariff_rate)}</span>
            <span className="text-emerald-500 font-medium flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              estimate vs usual
            </span>
          </div>
        </motion.div>

        {/* Stat 3: Month Projected Bill */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold tracking-wide">Estimated monthly bill</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {formatCurrency(stats.estimated_month_bill)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Estimated price: ₹{currentSlab.rate} per unit</span>
            <span className="font-medium text-amber-500">
              {unitsToNextSlab > 0 ? `About ${unitsToNextSlab} units before your per-unit price may rise` : "At the highest per-unit price"}
            </span>
          </div>
        </motion.div>

        {/* Stat 4: Active Appliances & Solar Offset */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold tracking-wide">Appliances switched on</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Power className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {stats.active_appliances}
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              / {stats.total_appliances} total
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <Sun className="w-3.5 h-3.5" />
              {state.solar.panel_capacity_kw} kW solar system
            </span>
            <span>About {stats.co2_saved_kg} kg CO₂ avoided</span>
          </div>
        </motion.div>
      </div>

      {/* Energy Flow Diagram */}
      {(() => {
        // Use midday solar output for the illustrative energy flow.
        const peakSolarKw = solarHourly.find((s) => s.hour === 12)?.solar_kw ?? 0;
        const currentSolarW = Math.round(peakSolarKw * 1000);
        // Use an EV appliance if present, otherwise show a typical charger example.
        const evAppliance = state.appliances.find((a) => a.category === "ev");
        const evW = evAppliance
          ? evAppliance.rated_power_w * evAppliance.quantity
          : 3300; // sample 3.3 kW EV charger
        const batteryChargeW = currentSolarW > stats.current_power_w
          ? Math.min(500, currentSolarW - stats.current_power_w) : 0;
        const gridW = Math.max(0, stats.current_power_w - currentSolarW);
        return (
          <EnergyFlowDiagram
            solarW={currentSolarW}
            homeW={stats.current_power_w}
            batteryW={batteryChargeW}
            batteryPercent={state.solar.battery_level}
            gridW={gridW}
            evW={evW}
          />
        );
      })()}

      {/* Slab Breach Warning Bar if close */}
      {unitsToNextSlab > 0 && unitsToNextSlab <= 40 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              <strong className="font-semibold">Your estimated rate may go up:</strong> You have used {stats.total_month_kwh} units this month. About {unitsToNextSlab} more units may move your estimate from ₹{currentSlab.rate} to ₹{nextSlab?.rate} per unit.
            </p>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-semibold underline underline-offset-4 flex-shrink-0 hover:text-amber-400"
          >
            See how the estimate is worked out
          </Link>
        </div>
      )}

      {/* Main Charts Row: 24-Hour Electricity Profile + Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24-Hour Profile (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold">Electricity Use Through the Day</h2>
                <p className="text-xs text-muted-foreground">
                  Estimated electricity use and solar power through the day. Busy hours are usually morning and evening.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Home use (W)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Solar (W)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  Busy hours
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={combinedHourly}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    unit="W"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(20, 31, 24, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      `${Number(value || 0).toLocaleString()} W`,
                      name === "householdPower" ? "Home use" : "Solar power",
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="householdPower"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#loadGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="solarPower"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#solarGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Highest estimated home use: <strong>{formatPower(Math.max(...combinedHourly.map((d) => d.householdPower)))}</strong> around 8 PM</span>
            <span className="text-emerald-500 font-medium">Highest estimated solar power: {formatPower(Math.max(...combinedHourly.map((d) => d.solarPower)))} around noon</span>
          </div>
        </div>

        {/* Appliance Breakdown Donut (1 column) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Daily Use by Appliance Type</h2>
              <Link
                href="/appliances"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                All Appliances <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(20, 31, 24, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value} units/day`, "Daily use"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Total */}
              <div className="absolute text-center pointer-events-none">
                <span className="text-xl font-bold tabular-nums">
                  {`${stats.total_today_kwh.toLocaleString("en-IN", { maximumFractionDigits: 1 })} units`}
                </span>
                  <span className="block text-[10px] text-muted-foreground">Estimated today</span>
              </div>
            </div>

            {/* Category Legend list */}
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
              {categoryData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="tabular-nums text-muted-foreground font-mono">
                    {item.value} units ({Math.round((item.value / stats.total_today_kwh) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Appliance Controls + Saving Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Appliance Controls (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Switch Appliances On or Off</h2>
              <p className="text-xs text-muted-foreground">
                These switches update the appliance status shown in GRIDWISE.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
              {stats.active_appliances} switched on
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enrichedAppliances
              .filter((a: ApplianceWithStats) => a.is_active)
              .slice(0, 6)
              .map((appliance: ApplianceWithStats) => {
                const isOn = appliance.status === "on";
                const totalWatts = appliance.rated_power_w * appliance.quantity;

                return (
                  <div
                    key={appliance.id}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3",
                      isOn
                        ? "bg-secondary/40 border-primary/30"
                        : "bg-muted/30 border-border/60 opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold",
                          isOn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Power className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate">{appliance.name}</h4>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{formatPower(totalWatts)}</span>
                          <span>·</span>
                          <span className="capitalize">{appliance.category}</span>
                          {appliance.schedule_type === "flexible" && (
                            <span className="text-[10px] text-amber-500 font-medium">(Can wait)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(appliance.id, appliance.name, !isOn)}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                        isOn ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          isOn ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Power used by appliances that are on:{" "}
              <strong>
                {formatPower(
                  enrichedAppliances
                    .filter((a: ApplianceWithStats) => a.is_active && a.status === "on")
                    .reduce((sum: number, a: ApplianceWithStats) => sum + a.rated_power_w * a.quantity, 0)
                )}
              </strong>
            </span>
            <Link href="/appliances" className="text-primary font-medium hover:underline">
              Manage appliances &rarr;
            </Link>
          </div>
        </div>

        {/* Saving suggestions (1 column) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold">Small changes for a lighter bill</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              In Kerala, sunny hours can help run appliances like the washing machine. Savings depend on your home.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                <div className="font-semibold text-primary mb-1">Let the sun help with laundry</div>
                <p className="text-muted-foreground">
                  If your solar panels are producing power, running the washing machine between 11 AM and 2 PM may use more solar electricity.
                </p>
                <div className="mt-2 text-emerald-500 font-medium">Possible saving varies by home</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="font-semibold text-amber-500 mb-1">Get ahead of the afternoon heat</div>
                <p className="text-muted-foreground">
                  If you use an AC, cooling the room before evening may help avoid running it as hard later.
                </p>
                <div className="mt-2 text-amber-500 font-medium">Possible saving varies by home</div>
              </div>
            </div>
          </div>

          <Link
            href="/scheduler"
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-secondary/80 transition-colors"
          >
            View appliance timings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Live Session Tracker */}
      <SessionsPanel
        applianceNames={Object.fromEntries(
          enrichedAppliances.map((a: ApplianceWithStats) => [a.id, a.name])
        )}
      />
    </div>
  );
}
