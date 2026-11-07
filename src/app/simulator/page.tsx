"use client";

import { useState, useMemo } from "react";
import {
  TrendingDown,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { runPeakSimulation } from "@/lib/calculations/energy";
import { SIMULATION_PRESETS } from "@/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { SimulationConfig, HourlyDemand } from "@/types";

export default function SimulatorPage() {
  const [selectedPreset, setSelectedPreset] = useState("normal");

  const [config, setConfig] = useState<SimulationConfig>({
    num_households: 50,
    num_ac_units: 1,
    ac_power_w: 1200,
    num_ev_chargers: 0,
    ev_power_w: 7400,
    num_water_pumps: 1,
    pump_power_w: 500,
    num_washing_machines: 1,
    washing_power_w: 500,
    base_load_w: 300,
    flexible_shift_percent: 40,
    peak_start_hour: 18,
    peak_end_hour: 22,
  });

  // Calculate simulation result dynamically
  const result = useMemo(() => {
    return runPeakSimulation(config);
  }, [config]);

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setConfig({ ...preset.config });
    }
  };

  // Prepare chart data
  const chartData = (result.hourly_optimised || []).map((d: HourlyDemand) => ({
    hour: `${d.hour.toString().padStart(2, "0")}:00`,
    uncoordinated_kw: Math.round(d.original_kw * 10) / 10,
    coordinated_kw: Math.round(d.optimised_kw * 10) / 10,
  }));

  const estimatedMonthlySavings = Math.round(
    result.peak_reduction_kw * 2 * 30 * 6.5 * (config.flexible_shift_percent / 100)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peak Demand Simulator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model community-scale load shifting, peak shaving, and transformer stress relief
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SIMULATION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                selectedPreset === p.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Peak Demand Reduction */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Peak Load Shaved
          </span>
          <div className="text-3xl font-bold tabular-nums text-emerald-500 mt-1">
            {result.peak_reduction_kw.toFixed(1)} kW
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              <strong>{result.peak_reduction_percent.toFixed(1)}% reduction</strong> vs uncoordinated
            </span>
          </div>
        </div>

        {/* Stat 2: Peak Demand (Before vs After) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Peak Demand
          </span>
          <div className="text-3xl font-bold tabular-nums text-foreground mt-1">
            {result.optimised_peak_kw.toFixed(1)} kW
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Down from{" "}
            <span className="line-through text-red-400">
              {result.original_peak_kw.toFixed(1)} kW
            </span>
          </div>
        </div>

        {/* Stat 3: Grid Stress Index */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Shaved Energy
          </span>
          <div className="text-3xl font-bold tabular-nums text-foreground mt-1">
            {result.total_flexible_kwh.toFixed(1)} kWh
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Shifted to off-peak / solar generation hours
          </div>
        </div>

        {/* Stat 4: Estimated Community Savings */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Estimated Community Savings
          </span>
          <div className="text-3xl font-bold tabular-nums text-foreground mt-1">
            {formatCurrency(estimatedMonthlySavings)}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            For {config.num_households} connected households
          </div>
        </div>
      </div>

      {/* Main Simulation Chart */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold">Community Demand Profile Comparison</h2>
            <p className="text-xs text-muted-foreground">
              Uncoordinated Baseline (Red) vs Smart Coordinated Load Shifting (Green)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Uncoordinated (kW)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Coordinated (kW)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uncoordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="coordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20, 31, 24, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val, name) => [
                  `${val} kW`,
                  name === "uncoordinated_kw" ? "Baseline Peak" : "Coordinated Load",
                ]}
              />
              <Area
                type="monotone"
                dataKey="uncoordinated_kw"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#uncoordGrad)"
              />
              <Area
                type="monotone"
                dataKey="coordinated_kw"
                stroke="#22c55e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#coordGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator Sliders & Controls */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Simulation Parameters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Households */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>Community Households</span>
              <span className="text-primary font-mono">{config.num_households} homes</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={5}
              value={config.num_households}
              onChange={(e) =>
                setConfig({ ...config, num_households: Number(e.target.value) })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 2: Flexible Load Shift % */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>Flexible Load Shift (%)</span>
              <span className="text-emerald-500 font-mono">
                {config.flexible_shift_percent}% shifted
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.flexible_shift_percent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  flexible_shift_percent: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Slider 3: AC Units per Home */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>Air Conditioners / Home</span>
              <span className="text-primary font-mono">{config.num_ac_units} units</span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={config.num_ac_units}
              onChange={(e) =>
                setConfig({ ...config, num_ac_units: Number(e.target.value) })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 4: EV Chargers per Home */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>EV Chargers / Home</span>
              <span className="text-primary font-mono">{config.num_ev_chargers} chargers</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={config.num_ev_chargers}
              onChange={(e) =>
                setConfig({
                  ...config,
                  num_ev_chargers: Number(e.target.value),
                })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 5: Water Pumps per Home */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>Water Pumps / Home</span>
              <span className="text-primary font-mono">{config.num_water_pumps} pumps</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={config.num_water_pumps}
              onChange={(e) =>
                setConfig({
                  ...config,
                  num_water_pumps: Number(e.target.value),
                })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Slider 6: Washing Machines */}
          <div>
            <div className="flex justify-between font-semibold mb-2">
              <span>Washing Machines / Home</span>
              <span className="text-primary font-mono">{config.num_washing_machines} units</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={config.num_washing_machines}
              onChange={(e) =>
                setConfig({
                  ...config,
                  num_washing_machines: Number(e.target.value),
                })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
