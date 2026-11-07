"use client";

import { useState } from "react";
import {
  Home,
  Sun,
  RotateCcw,
  Moon,
  SunMedium,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { toast } from "sonner";

export default function SettingsPage() {
  const { state, setHousehold, setSolar, resetDemo } = useApp();
  const { theme, toggleTheme } = useTheme();

  // Local state for household
  const [householdForm, setHouseholdForm] = useState({
    name: state.household.name,
    location: state.household.location,
    area_sqft: state.household.area_sqft,
    occupants: state.household.occupants,
    connected_load_kw: state.household.connected_load_kw,
    tariff_rate: state.household.tariff_rate,
  });

  // Local state for solar
  const [solarForm, setSolarForm] = useState({
    panel_capacity_kw: state.solar.panel_capacity_kw,
    panel_count: state.solar.panel_count,
    battery_capacity_kwh: state.solar.battery_capacity_kwh,
    battery_level: state.solar.battery_level,
  });

  const handleSaveHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    setHousehold({
      ...state.household,
      ...householdForm,
      updated_at: new Date().toISOString(),
    });
    toast.success("Household parameters updated successfully");
  };

  const handleSaveSolar = (e: React.FormEvent) => {
    e.preventDefault();
    setSolar({
      ...state.solar,
      ...solarForm,
    });
    toast.success("Solar configuration updated successfully");
  };

  const handleReset = () => {
    if (confirm("Reset all appliances, schedules, and settings to original defaults?")) {
      resetDemo();
      setHouseholdForm({
        name: "Shamil Residence",
        location: "Thrissur, Kerala",
        area_sqft: 1800,
        occupants: 4,
        connected_load_kw: 8,
        tariff_rate: 6.5,
      });
      setSolarForm({
        panel_capacity_kw: 3,
        panel_count: 10,
        battery_capacity_kwh: 5,
        battery_level: 65,
      });
      toast.info("Demo data reset to factory defaults");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Household Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your home details, solar setup and how the app looks.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Household Profile Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Home Details</h2>
            <p className="text-xs text-muted-foreground">
              Your home information and electricity rate.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveHousehold} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Household Name
              </label>
              <input
                type="text"
                required
                value={householdForm.name}
                onChange={(e) =>
                  setHouseholdForm({ ...householdForm, name: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={householdForm.location}
                onChange={(e) =>
                  setHouseholdForm({ ...householdForm, location: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Area (Sq Ft)
              </label>
              <input
                type="number"
                min={100}
                value={householdForm.area_sqft}
                onChange={(e) =>
                  setHouseholdForm({
                    ...householdForm,
                    area_sqft: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Occupants
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={householdForm.occupants}
                onChange={(e) =>
                  setHouseholdForm({
                    ...householdForm,
                    occupants: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Sanctioned Load (kW)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={householdForm.connected_load_kw}
                onChange={(e) =>
                  setHouseholdForm({
                    ...householdForm,
                    connected_load_kw: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Base Tariff (₹/kWh)
              </label>
              <input
                type="number"
                step={0.1}
                min={1}
                value={householdForm.tariff_rate}
                onChange={(e) =>
                  setHouseholdForm({
                    ...householdForm,
                    tariff_rate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors shadow-xs"
            >
              Update Household
            </button>
          </div>
        </form>
      </div>

      {/* Solar Plant Settings Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Solar Setup</h2>
            <p className="text-xs text-muted-foreground">
              PV generator capacity and battery energy storage limits
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSolar} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Capacity (kWp)
              </label>
              <input
                type="number"
                step={0.5}
                min={0}
                max={50}
                value={solarForm.panel_capacity_kw}
                onChange={(e) =>
                  setSolarForm({
                    ...solarForm,
                    panel_capacity_kw: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Panel Count
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={solarForm.panel_count}
                onChange={(e) =>
                  setSolarForm({
                    ...solarForm,
                    panel_count: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Battery Capacity (kWh)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={solarForm.battery_capacity_kwh}
                onChange={(e) =>
                  setSolarForm({
                    ...solarForm,
                    battery_capacity_kwh: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Battery Level (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={solarForm.battery_level}
                onChange={(e) =>
                  setSolarForm({
                    ...solarForm,
                    battery_level: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors shadow-xs"
            >
              Update Solar
            </button>
          </div>
        </form>
      </div>

      {/* Appearance & Preferences */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Display Theme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toggle between Dark Mode (deep forest palette) and Clean Light Mode
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
        >
          {theme === "dark" ? (
            <>
              <SunMedium className="w-4 h-4 text-amber-400" />
              <span>Switch to Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-primary" />
              <span>Switch to Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
