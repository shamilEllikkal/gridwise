"use client";

import { useRef, useMemo } from "react";
import {
  Printer,
  Download,
  Zap,
  Leaf,
  Layers,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { TARIFF_SLABS, CO2_PER_KWH } from "@/constants";
import { formatCurrency, formatPower } from "@/lib/utils";
import type { ApplianceWithStats } from "@/types";
import { toast } from "sonner";

export default function ReportsPage() {
  const { state, stats, enrichedAppliances } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const monthlyKwh = stats.total_month_kwh;
  const tariffRate = state.household.tariff_rate;

  // Calculate detailed slab lines
  const slabBreakdown = useMemo(() => {
    let remaining = monthlyKwh;
    const items = [];
    for (let i = 0; i < TARIFF_SLABS.length; i++) {
      const slab = TARIFF_SLABS[i];
      const prevMax = i > 0 ? TARIFF_SLABS[i - 1].max_units : 0;
      const slabCapacity =
        slab.max_units === Infinity ? remaining : slab.max_units - prevMax;
      const unitsInSlab = Math.max(0, Math.min(slabCapacity, remaining));
      remaining -= unitsInSlab;
      const cost = unitsInSlab * slab.rate;
      if (unitsInSlab > 0) {
        items.push({
          slabIndex: i + 1,
          range: `${prevMax + 1} – ${slab.max_units === Infinity ? "Above" : slab.max_units} units`,
          rate: slab.rate,
          units: Math.round(unitsInSlab * 10) / 10,
          cost: Math.round(cost),
        });
      }
    }
    return items;
  }, [monthlyKwh]);

  const energyCharges = slabBreakdown.reduce((sum, s) => sum + s.cost, 0);
  const fixedCharge = 65;
  const duty = Math.round(energyCharges * 0.1); // 10% duty
  const grossPayable = energyCharges + fixedCharge + duty;
  const solarCredit = Math.round(state.solar.panel_capacity_kw * 4.5 * 30 * tariffRate * 0.8);
  const netPayable = Math.max(0, grossPayable - solarCredit);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = "Appliance,Category,Watts,Quantity,Daily Hours,Units per month (kWh),Monthly Cost (INR)\n";
    const rows = enrichedAppliances
      .map(
        (a: ApplianceWithStats) =>
          `"${a.name}","${a.category}",${a.rated_power_w},${a.quantity},${a.daily_hours},${Math.round(a.monthly_kwh)},${Math.round(a.monthly_cost)}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gridwise-energy-audit-${state.household.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Audit Exported Successfully");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly Electricity Report</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            A summary of your estimated electricity use and bill. Your KSEB bill may differ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download table (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print or save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div
        ref={printRef}
        className="p-8 sm:p-10 rounded-2xl bg-card border border-border/80 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8"
      >
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                GRID<span className="text-primary">WISE</span> MONTHLY REPORT
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated electricity use and bill
            </p>
          </div>

          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <div className="font-semibold text-foreground">Billing Period: Nov 2026</div>
            <div>Consumer: {state.household.name}</div>
            <div>Location: {state.household.location}</div>
            <div>Connected Load: {state.household.connected_load_kw} kW</div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">
              Total Consumption
            </span>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {monthlyKwh} kWh
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              30-day billing cycle
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">
              Gross Tariff Cost
            </span>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(grossPayable)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Including duties & fixed charges
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">
              Solar Credit
            </span>
            <div className="text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
              -{formatCurrency(solarCredit)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Net metering offset
            </span>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-[11px] text-primary uppercase font-bold">
              Net Payable
            </span>
            <div className="text-2xl font-bold text-primary mt-1 tabular-nums">
              {formatCurrency(netPayable)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Due by 25th of month
            </span>
          </div>
        </div>

        {/* Telescopic Tariff Ledger Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Estimated electricity cost by units
          </h3>

          <div className="border border-border/80 rounded-xl overflow-x-auto text-xs">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Rate range</th>
                  <th className="py-2.5 px-4">Units in range</th>
                  <th className="py-2.5 px-4 text-right">Units counted</th>
                  <th className="py-2.5 px-4 text-right">Cost per unit</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {slabBreakdown.map((s) => (
                  <tr key={s.slabIndex} className="hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-medium">Slab {s.slabIndex}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{s.range}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-mono">{s.units} u</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-mono">₹{s.rate.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold font-mono">
                      {formatCurrency(s.cost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/20">
                  <td colSpan={4} className="py-2 px-4 text-muted-foreground">Fixed Charges</td>
                  <td className="py-2 px-4 text-right tabular-nums font-mono">{formatCurrency(fixedCharge)}</td>
                </tr>
                <tr className="bg-muted/20">
                  <td colSpan={4} className="py-2 px-4 text-muted-foreground">Electricity duty (estimated)</td>
                  <td className="py-2 px-4 text-right tabular-nums font-mono">{formatCurrency(duty)}</td>
                </tr>
                <tr className="bg-primary/5 font-bold border-t border-border">
                  <td colSpan={4} className="py-3 px-4 text-foreground">Estimated total before solar credit</td>
                  <td className="py-3 px-4 text-right text-foreground font-mono text-sm">
                    {formatCurrency(grossPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Appliance Level Audit Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Estimated use by appliance
          </h3>

          <div className="border border-border/80 rounded-xl overflow-x-auto text-xs">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Appliance</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Power</th>
                  <th className="py-2.5 px-4 text-right">Hours per day</th>
                  <th className="py-2.5 px-4 text-right">Units per month</th>
                  <th className="py-2.5 px-4 text-right">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {enrichedAppliances
                  .filter((a: ApplianceWithStats) => a.is_active)
                  .map((app: ApplianceWithStats) => (
                    <tr key={app.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{app.name}</td>
                      <td className="py-2.5 px-4 text-muted-foreground capitalize">{app.category}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono">
                        {formatPower(app.rated_power_w * app.quantity)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono">{app.daily_hours} hrs</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono">
                        {Math.round(app.monthly_kwh)} u
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono font-medium">
                        {formatCurrency(app.monthly_cost)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environmental estimate */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="font-semibold text-foreground">Environmental estimate:</span>
              <p className="text-[11px]">
                Clean energy generation avoided {Math.round(stats.total_month_kwh * CO2_PER_KWH * 0.4)} kg of CO2 equivalent this period.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] font-mono">
            Calculated from the information entered in GRIDWISE
          </div>
        </div>
      </div>
    </div>
  );
}
