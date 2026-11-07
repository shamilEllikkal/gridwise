import type {
  Appliance,
  ApplianceWithStats,
  DashboardStats,
  HourlyReading,
  SimulationConfig,
  SimulationResult,
  HourlyDemand,
} from "@/types";
import {
  TARIFF_SLABS,
  PEAK_HOURS,
  SOLAR_HOURS,
  CO2_PER_KWH,
  DAYS_IN_MONTH,
} from "@/constants";

// ─── Basic Energy Calculations ───────────────────────────────

/**
 * Calculate daily energy consumption for an appliance
 * E = P × t × n / 1000
 */
export function calcDailyKwh(
  power_w: number,
  daily_hours: number,
  quantity: number = 1
): number {
  return (power_w * daily_hours * quantity) / 1000;
}

/**
 * Calculate monthly energy consumption
 */
export function calcMonthlyKwh(daily_kwh: number, days = DAYS_IN_MONTH): number {
  return daily_kwh * days;
}

/**
 * Calculate electricity bill using tiered tariff slabs
 */
export function calcElectricityBill(monthly_kwh: number): number {
  let total = 0;
  let remaining = monthly_kwh;

  for (let i = 0; i < TARIFF_SLABS.length; i++) {
    const slab = TARIFF_SLABS[i];
    const prevMax = i > 0 ? TARIFF_SLABS[i - 1].max_units : 0;
    const slabSize =
      slab.max_units === Infinity ? remaining : Math.min(slab.max_units - prevMax, remaining);

    if (remaining <= 0) break;
    total += slabSize * slab.rate;
    remaining -= slabSize;
  }

  // Add fixed charge based on consumption level
  const fixedCharge = TARIFF_SLABS.find((s) => monthly_kwh <= s.max_units)?.fixed_charge ?? 100;
  return total + fixedCharge;
}

/**
 * Calculate CO2 savings compared to grid average
 */
export function calcCo2Saved(solar_kwh: number): number {
  return solar_kwh * CO2_PER_KWH;
}

// ─── Appliance Statistics ────────────────────────────────────

/**
 * Enrich appliances with computed statistics
 */
export function enrichAppliancesWithStats(
  appliances: Appliance[],
  tariff_rate: number
): ApplianceWithStats[] {
  const totalDailyKwh = appliances
    .filter((a) => a.is_active)
    .reduce(
      (sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity),
      0
    );

  return appliances.map((appliance) => {
    const daily_kwh = calcDailyKwh(
      appliance.rated_power_w,
      appliance.daily_hours,
      appliance.quantity
    );
    const monthly_kwh = calcMonthlyKwh(daily_kwh);
    const monthly_cost = monthly_kwh * tariff_rate;
    const percentage_of_total =
      totalDailyKwh > 0 ? (daily_kwh / totalDailyKwh) * 100 : 0;

    return {
      ...appliance,
      daily_kwh,
      monthly_kwh,
      monthly_cost,
      percentage_of_total,
    };
  });
}

// ─── Dashboard Stats Calculation ─────────────────────────────

export function calcDashboardStats(
  appliances: Appliance[],
  tariff_rate: number,
  solarGenerationKwh: number = 0
): DashboardStats {
  const activeAppliances = appliances.filter((a) => a.is_active && a.status === "on");
  const allActiveAppliances = appliances.filter((a) => a.is_active);

  // Current power (sum of active appliances)
  const current_power_w = activeAppliances.reduce(
    (sum, a) => sum + a.rated_power_w * a.quantity,
    0
  );

  // Daily consumption (all active appliances × their hours)
  const total_today_kwh = allActiveAppliances.reduce(
    (sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity),
    0
  );

  const total_month_kwh = calcMonthlyKwh(total_today_kwh);
  const estimated_month_bill = calcElectricityBill(total_month_kwh);
  const avg_daily_kwh = total_today_kwh;

  // Peak hour (highest simulated consumption hour)
  const peak_hour = 19; // 7 PM — typical evening peak

  // Flexible load (non-essential appliances)
  const flexibleKwh = allActiveAppliances
    .filter((a) => a.schedule_type === "flexible")
    .reduce((sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity), 0);

  const potential_savings_kwh = flexibleKwh * 0.3; // 30% potential off-peak shift

  const co2_saved_kg = calcCo2Saved(solarGenerationKwh);
  const grid_import_today_kwh = Math.max(0, total_today_kwh - solarGenerationKwh);

  return {
    total_today_kwh: Math.round(total_today_kwh * 100) / 100,
    total_month_kwh: Math.round(total_month_kwh * 10) / 10,
    estimated_month_bill: Math.round(estimated_month_bill),
    current_power_w: Math.round(current_power_w),
    active_appliances: activeAppliances.length,
    total_appliances: appliances.filter((a) => a.is_active).length,
    peak_hour,
    avg_daily_kwh: Math.round(avg_daily_kwh * 100) / 100,
    potential_savings_kwh: Math.round(potential_savings_kwh * 100) / 100,
    solar_generation_today_kwh: solarGenerationKwh,
    grid_import_today_kwh: Math.round(grid_import_today_kwh * 100) / 100,
    co2_saved_kg: Math.round(co2_saved_kg * 100) / 100,
  };
}

// ─── Hourly Consumption Generation ───────────────────────────

/**
 * Generate realistic 24-hour consumption pattern for a household
 * Based on typical Kerala household usage patterns
 */
export function generateHourlyReadings(
  appliances: Appliance[],
  date: Date = new Date()
): HourlyReading[] {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Base load multiplier per hour (typical household pattern)
  const hourlyMultiplier = [
    0.3, 0.25, 0.2, 0.2, 0.25, 0.4, // 00–05: night
    0.7, 0.9, 0.8, 0.6, 0.5, 0.5,   // 06–11: morning
    0.5, 0.45, 0.4, 0.4, 0.5, 0.65, // 12–17: afternoon
    0.9, 1.0, 0.95, 0.85, 0.7, 0.5, // 18–23: evening peak
  ];

  const weekendBoost = isWeekend ? 1.15 : 1.0;

  return Array.from({ length: 24 }, (_, hour) => {
    const baseMultiplier = hourlyMultiplier[hour] * weekendBoost;

    // Calculate which appliances are running this hour
    let hourPowerW = 0;
    for (const appliance of appliances) {
      if (!appliance.is_active) continue;

      let isRunning = false;
      if (appliance.schedule_start && appliance.schedule_end) {
        const startH = parseInt(appliance.schedule_start.split(":")[0]);
        const endH = parseInt(appliance.schedule_end.split(":")[0]);
        if (startH <= endH) {
          isRunning = hour >= startH && hour < endH;
        } else {
          // Overnight (e.g., 21:00–07:00)
          isRunning = hour >= startH || hour < endH;
        }
      } else {
        // No fixed schedule — distribute by usage pattern
        isRunning = Math.random() < baseMultiplier * (appliance.daily_hours / 24);
      }

      if (isRunning) {
        hourPowerW += appliance.rated_power_w * appliance.quantity;
      }
    }

    // Add some variance
    const variance = 0.9 + Math.random() * 0.2;
    const finalPowerW = hourPowerW * variance;
    const energy_kwh = finalPowerW / 1000; // 1 hour = 1 kWh for that power

    return {
      hour,
      energy_kwh: Math.round(energy_kwh * 100) / 100,
      power_w: Math.round(finalPowerW),
      is_peak: PEAK_HOURS.includes(hour),
    };
  });
}

/**
 * Generate deterministic hourly readings (no randomness — for consistent charts)
 */
export function generateDeterministicHourlyReadings(
  appliances: Appliance[]
): HourlyReading[] {
  const hourlyMultiplier = [
    0.28, 0.22, 0.18, 0.18, 0.22, 0.42,
    0.72, 0.88, 0.78, 0.58, 0.48, 0.48,
    0.48, 0.44, 0.42, 0.42, 0.52, 0.68,
    0.92, 1.00, 0.95, 0.82, 0.68, 0.48,
  ];

  const totalDailyKwh = appliances
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity), 0);

  const totalMultiplier = hourlyMultiplier.reduce((s, m) => s + m, 0);

  return Array.from({ length: 24 }, (_, hour) => {
    const fraction = hourlyMultiplier[hour] / totalMultiplier;
    const energy_kwh = totalDailyKwh * fraction;
    const power_w = energy_kwh * 1000;

    return {
      hour,
      energy_kwh: Math.round(energy_kwh * 1000) / 1000,
      power_w: Math.round(power_w),
      is_peak: PEAK_HOURS.includes(hour),
    };
  });
}

/**
 * Generate weekly data (last 7 days)
 */
export function generateWeeklyData(
  appliances: Appliance[]
): { day: string; kwh: number; cost: number; is_today: boolean }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const dailyBase = appliances
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity), 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dayName = days[date.getDay()];
    const isToday = i === 6;

    // Realistic daily variation
    const variations = [0.88, 0.95, 1.02, 0.91, 1.08, 1.15, 1.05];
    const kwh = dailyBase * variations[i];
    const tariffRate = 6.5;
    const cost = kwh * tariffRate;

    return {
      day: dayName,
      kwh: Math.round(kwh * 100) / 100,
      cost: Math.round(cost),
      is_today: isToday,
    };
  });
}

/**
 * Generate monthly data (last 6 months)
 */
export function generateMonthlyData(
  appliances: Appliance[]
): { month: string; kwh: number; cost: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const monthlyBase = appliances
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + calcDailyKwh(a.rated_power_w, a.daily_hours, a.quantity) * 30, 0);

  // Kerala seasonal variation (more AC usage in summer)
  const seasonalVariations = [0.85, 0.82, 0.95, 1.1, 1.2, 1.15, 1.05, 1.08, 1.0, 0.95, 0.9, 0.88];

  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(today);
    date.setMonth(today.getMonth() - (5 - i));
    const monthName = months[date.getMonth()];
    const seasonal = seasonalVariations[date.getMonth()];
    const kwh = monthlyBase * seasonal;
    const cost = calcElectricityBill(kwh);

    return {
      month: monthName,
      kwh: Math.round(kwh),
      cost: Math.round(cost),
    };
  });
}

// ─── Solar Calculations ───────────────────────────────────────

/**
 * Calculate solar generation for a given day
 */
export function calcSolarGeneration(
  panel_capacity_kw: number,
  panel_efficiency: number,
  date: Date = new Date()
): number {
  // Kerala peak sun hours (varies by season)
  const month = date.getMonth();
  const peakSunHours = [5.5, 6.0, 6.5, 7.0, 6.5, 5.5, 4.5, 4.5, 5.0, 5.5, 5.5, 5.0][month];
  return panel_capacity_kw * panel_efficiency * peakSunHours;
}

/**
 * Generate hourly solar generation curve
 */
export function generateHourlySolar(
  daily_kwh: number
): { hour: number; solar_kw: number }[] {
  // Solar generation curve (bell curve around noon)
  const solarPattern = [
    0, 0, 0, 0, 0, 0,          // 00–05: no generation
    0, 0.05, 0.2, 0.5, 0.8, 1, // 06–11: rising
    1, 0.95, 0.85, 0.65, 0.3, 0.05, // 12–17: declining
    0, 0, 0, 0, 0, 0,          // 18–23: no generation
  ];

  const totalPattern = solarPattern.reduce((s, v) => s + v, 0);

  return solarPattern.map((fraction, hour) => ({
    hour,
    solar_kw: fraction > 0 ? Math.round((daily_kwh * (fraction / totalPattern)) * 100) / 100 : 0,
  }));
}

// ─── Peak Demand Simulation ───────────────────────────────────

/**
 * Run a full peak demand simulation
 */
export function runPeakSimulation(config: SimulationConfig): SimulationResult {
  const {
    num_households,
    num_ac_units,
    ac_power_w,
    num_ev_chargers,
    ev_power_w,
    num_water_pumps,
    pump_power_w,
    num_washing_machines,
    washing_power_w,
    base_load_w,
    flexible_shift_percent,
    peak_start_hour,
    peak_end_hour,
  } = config;

  const shiftFraction = flexible_shift_percent / 100;

  // Per-household loads
  const acKwTotal = (num_ac_units * ac_power_w * num_households) / 1000;
  const evKwTotal = (num_ev_chargers * ev_power_w * num_households) / 1000;
  const pumpKwTotal = (num_water_pumps * pump_power_w * num_households) / 1000;
  const washingKwTotal = (num_washing_machines * washing_power_w * num_households) / 1000;
  const baseKwTotal = (base_load_w * num_households) / 1000;

  // Flexible loads that can be shifted
  const flexibleKw = evKwTotal + washingKwTotal + pumpKwTotal * 0.5; // Pumps are semi-flexible
  const essentialKw = baseKwTotal + pumpKwTotal * 0.5;

  const hourlyData: HourlyDemand[] = Array.from({ length: 24 }, (_, hour) => {
    // Determine if AC runs this hour (heat-driven usage pattern)
    const tempMultiplier = hour >= 12 && hour <= 16 ? 1.0 : hour >= 20 && hour <= 24 ? 0.9 : 0.4;
    const acKw = acKwTotal * tempMultiplier;

    // EV charging pattern (mostly evening without optimisation)
    const isEveningPeak = hour >= peak_start_hour && hour < peak_end_hour;
    const isSolarPeak = SOLAR_HOURS.includes(hour);

    // Original: EVs charge in evening
    const evKwOriginal = isEveningPeak ? evKwTotal * 0.8 : evKwTotal * 0.1;
    // Optimised: EVs charge during solar / off-peak
    const evKwOptimised = isSolarPeak ? evKwTotal * 0.7 : isEveningPeak ? evKwTotal * 0.1 * (1 - shiftFraction) : evKwTotal * 0.1;

    // Washing machines
    const washingOriginal = isEveningPeak ? washingKwTotal * 0.7 : washingKwTotal * 0.15;
    const washingOptimised = isSolarPeak ? washingKwTotal * 0.6 * shiftFraction : isEveningPeak ? washingKwTotal * 0.7 * (1 - shiftFraction) : washingKwTotal * 0.15;

    // Pumps
    const pumpOriginal = hour === 6 || hour === 7 || isEveningPeak ? pumpKwTotal * 0.6 : pumpKwTotal * 0.1;
    const pumpOptimised = isSolarPeak ? pumpKwTotal * 0.5 * shiftFraction : pumpOriginal * (1 - shiftFraction * 0.4);

    const original_kw = acKw + evKwOriginal + washingOriginal + pumpOriginal + essentialKw;
    const optimised_kw = acKw + evKwOptimised + washingOptimised + pumpOptimised + essentialKw;

    return {
      hour,
      original_kw: Math.round(original_kw * 100) / 100,
      optimised_kw: Math.round(Math.max(optimised_kw, essentialKw) * 100) / 100,
      flexible_kw: Math.round(flexibleKw * 100) / 100,
      essential_kw: Math.round(essentialKw * 100) / 100,
    };
  });

  const original_peak_kw = Math.max(...hourlyData.map((h) => h.original_kw));
  const optimised_peak_kw = Math.max(...hourlyData.map((h) => h.optimised_kw));
  const peak_reduction_kw = original_peak_kw - optimised_peak_kw;
  const peak_reduction_percent = (peak_reduction_kw / original_peak_kw) * 100;
  const total_flexible_kwh = flexibleKw * config.flexible_shift_percent * 0.1; // Rough estimate

  return {
    original_peak_kw: Math.round(original_peak_kw * 100) / 100,
    optimised_peak_kw: Math.round(optimised_peak_kw * 100) / 100,
    peak_reduction_kw: Math.round(peak_reduction_kw * 100) / 100,
    peak_reduction_percent: Math.round(peak_reduction_percent * 10) / 10,
    total_flexible_kwh: Math.round(total_flexible_kwh * 100) / 100,
    hourly_original: hourlyData,
    hourly_optimised: hourlyData,
  };
}

// ─── Formatting Utilities ─────────────────────────────────────

export function formatKwh(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
  if (kwh < 0.1) return `${Math.round(kwh * 1000)} Wh`;
  return `${kwh.toFixed(2)} kWh`;
}

export function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  return `${Math.round(watts)} W`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function isPeakHour(hour: number): boolean {
  return PEAK_HOURS.includes(hour);
}

export function isSolarHour(hour: number): boolean {
  return SOLAR_HOURS.includes(hour);
}
