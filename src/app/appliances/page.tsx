"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import {
  APPLIANCE_CATEGORIES,
  APPLIANCE_DEFAULTS,
} from "@/constants";
import { formatCurrency, formatKwh, formatPower, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Appliance, ApplianceCategory, ApplianceWithStats, ScheduleType } from "@/types";

export default function AppliancesPage() {
  const { state, enrichedAppliances, toggleAppliance, addAppliance, updateAppliance, deleteAppliance } =
    useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "on" | "off">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  // Form state for add/edit modal
  const [formData, setFormData] = useState<{
    name: string;
    category: ApplianceCategory;
    rated_power_w: number;
    quantity: number;
    daily_hours: number;
    schedule_type: ScheduleType;
    schedule_start: string;
    schedule_end: string;
  }>({
    name: "",
    category: "cooling",
    rated_power_w: 1000,
    quantity: 1,
    daily_hours: 8,
    schedule_type: "flexible",
    schedule_start: "18:00",
    schedule_end: "22:00",
  });

  // Filtered appliances
  const filteredAppliances = enrichedAppliances.filter((a: ApplianceWithStats) => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "on" && a.status === "on") ||
      (selectedStatus === "off" && a.status === "off");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingAppliance(null);
    setFormData({
      name: "",
      category: "cooling",
      rated_power_w: 1200,
      quantity: 1,
      daily_hours: 8,
      schedule_type: "flexible",
      schedule_start: "18:00",
      schedule_end: "22:00",
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (app: Appliance) => {
    setEditingAppliance(app);
    setFormData({
      name: app.name,
      category: app.category,
      rated_power_w: app.rated_power_w,
      quantity: app.quantity,
      daily_hours: app.daily_hours,
      schedule_type: app.schedule_type,
      schedule_start: app.schedule_start ?? "18:00",
      schedule_end: app.schedule_end ?? "22:00",
    });
    setIsModalOpen(true);
  };

  // Handle Preset selection
  const handleSelectPreset = (presetName: string) => {
    const preset = APPLIANCE_DEFAULTS[presetName];
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        name: presetName,
        category: preset.category,
        rated_power_w: preset.power_w,
        daily_hours: preset.daily_hours,
      }));
    }
  };

  // Save appliance (create or update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please provide an appliance name");
      return;
    }

    if (editingAppliance) {
      const updated: Appliance = {
        ...editingAppliance,
        ...formData,
        updated_at: new Date().toISOString(),
      };
      updateAppliance(updated);
      toast.success(`Updated ${formData.name}`);
    } else {
      const created: Appliance = {
        id: `app-${Date.now()}`,
        household_id: state.household.id,
        ...formData,
        status: "on",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addAppliance(created);
      toast.success(`Added ${formData.name} to inventory`);
    }

    setIsModalOpen(false);
  };

  // Delete appliance
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from appliance inventory?`)) {
      deleteAppliance(id);
      toast.info(`Removed ${name}`);
    }
  };

  const totalConnectedWatts = enrichedAppliances
    .filter((a: ApplianceWithStats) => a.is_active)
    .reduce((sum: number, a: ApplianceWithStats) => sum + a.rated_power_w * a.quantity, 0);

  const totalDailyKwh = enrichedAppliances
    .filter((a: ApplianceWithStats) => a.is_active)
    .reduce((sum: number, a: ApplianceWithStats) => sum + a.daily_kwh, 0);

  const totalMonthlyCost = totalDailyKwh * 30 * state.household.tariff_rate;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Appliances</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add appliances and enter how much power they use and how long they run.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add an appliance</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-medium">Power if all are on</span>
          <div className="text-2xl font-bold tabular-nums mt-1 text-foreground">
            {formatPower(totalConnectedWatts)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {enrichedAppliances.length} registered appliances
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-medium">Estimated daily use</span>
          <div className="text-2xl font-bold tabular-nums mt-1 text-emerald-500">
            {formatKwh(totalDailyKwh)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on scheduled run hours
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-medium">Estimated monthly cost</span>
          <div className="text-2xl font-bold tabular-nums mt-1 text-foreground">
            {formatCurrency(totalMonthlyCost)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            At ₹{state.household.tariff_rate}/kWh base rate
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 min-w-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your appliances..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80 self-start md:self-auto max-w-full">
          {(["all", "on", "off"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                selectedStatus === status
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status === "all" ? "All Status" : status === "on" ? "Online" : "Offline"}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All Categories ({enrichedAppliances.length})
        </button>
        {Object.entries(APPLIANCE_CATEGORIES).map(([catKey, info]) => {
          const count = enrichedAppliances.filter((a: ApplianceWithStats) => a.category === catKey).length;
          if (count === 0) return null;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                selectedCategory === catKey
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: info.color }}
              />
              <span>{info.label}</span>
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Appliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppliances.map((appliance: ApplianceWithStats) => {
          const isOn = appliance.status === "on";
          const catInfo = APPLIANCE_CATEGORIES[appliance.category as ApplianceCategory] ?? {
            label: appliance.category,
            color: "#10b981",
          };

          return (
            <motion.div
              key={appliance.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={cn(
                "p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-xs",
                isOn
                  ? "bg-card border-border/80"
                  : "bg-muted/20 border-border/50 opacity-75"
              )}
            >
              <div>
                {/* Header row: Category & Toggle */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: `${catInfo.color}15`,
                      color: catInfo.color,
                      borderColor: `${catInfo.color}30`,
                      borderWidth: 1,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    {catInfo.label}
                  </span>

                  <button
                    onClick={() =>
                      toggleAppliance(appliance.id)
                    }
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

                {/* Name & Details */}
                <h3 className="text-base font-semibold text-foreground truncate">
                  {appliance.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{appliance.quantity > 1 ? `${appliance.quantity}x ` : ""}{formatPower(appliance.rated_power_w)}</span>
                  <span>·</span>
                  <span>{appliance.daily_hours} hrs/day</span>
                  <span>·</span>
                  <span className="capitalize">{appliance.schedule_type}</span>
                </div>

                {/* Schedule badge */}
                {appliance.schedule_start && appliance.schedule_end && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 px-2 py-1 rounded-md bg-muted/50 w-fit">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>
                      {appliance.schedule_start} – {appliance.schedule_end}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats & Actions Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Monthly Consumption</div>
                  <div className="text-sm font-bold tabular-nums text-foreground">
                    {Math.round(appliance.monthly_kwh)} kWh (
                    {formatCurrency(appliance.monthly_cost)})
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(appliance)}
                    title="Edit appliance"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(appliance.id, appliance.name)}
                    title="Delete appliance"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAppliances.length === 0 && (
        <div className="text-center py-12 p-6 rounded-2xl bg-card border border-border/60">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold">No appliances found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search query or category filters, or add a new appliance to your inventory.
          </p>
        </div>
      )}

      {/* Add / Edit Appliance Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <h3 className="text-lg font-bold">
                  {editingAppliance ? "Edit Appliance" : "Add New Appliance"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets Picker (if creating new) */}
              {!editingAppliance && (
                <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Quick Autofill from Presets</span>
                  </div>
                  <select
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border/80 text-xs focus:outline-hidden"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose standard home appliance...
                    </option>
                    {Object.keys(APPLIANCE_DEFAULTS).map((preset) => (
                      <option key={preset} value={preset}>
                        {preset} ({APPLIANCE_DEFAULTS[preset].power_w}W, {APPLIANCE_DEFAULTS[preset].daily_hours}h/day)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Appliance Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Master Bedroom Inverter AC"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as ApplianceCategory,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    >
                      {Object.entries(APPLIANCE_CATEGORIES).map(([catKey, info]) => (
                        <option key={catKey} value={catKey}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">
                      Schedule Flexibility
                    </label>
                    <select
                      value={formData.schedule_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule_type: e.target.value as ScheduleType,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    >
                      <option value="flexible">Flexible (timing can change)</option>
                      <option value="essential">Essential (keep this timing)</option>
                      <option value="scheduled">Set timing (fixed)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">
                      Power Rating (W)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.rated_power_w}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rated_power_w: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">
                      Run Hours / Day
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      max={24}
                      step={0.5}
                      required
                      value={formData.daily_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daily_hours: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Optional Schedule Range */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">
                      Usual Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule_start}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule_start: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">
                      Usual End Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule_end}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule_end: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-primary/20 text-xs">
                  <span className="font-semibold text-secondary-foreground">Calculated Consumption:</span>
                  <div className="mt-1 text-muted-foreground">
                    Daily:{" "}
                    <strong className="text-foreground">
                      {((formData.rated_power_w * formData.quantity * formData.daily_hours) / 1000).toFixed(2)} kWh
                    </strong>{" "}
                    · Monthly:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(
                        ((formData.rated_power_w * formData.quantity * formData.daily_hours * 30) / 1000) *
                          state.household.tariff_rate
                      )}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
                  >
                    {editingAppliance ? "Save changes" : "Add appliance"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
