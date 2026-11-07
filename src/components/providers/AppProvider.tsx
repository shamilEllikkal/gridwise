"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { Appliance, ApplianceWithStats, DashboardStats, Household, SolarProfile } from "@/types";
import { DEMO_APPLIANCES, DEMO_HOUSEHOLD, DEMO_SOLAR } from "@/data/seed";
import { calcDashboardStats, enrichAppliancesWithStats } from "@/lib/calculations/energy";
import {
  getHousehold,
  getAppliances,
  upsertAppliance,
  deleteApplianceDb,
  upsertHousehold,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";

// ─── State ───────────────────────────────────────────────────

interface AppState {
  household: Household;
  appliances: Appliance[];
  solar: SolarProfile;
  isLoading: boolean;
  lastUpdated: string;
  dbLoaded: boolean;
}

type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DB_LOADED" }
  | { type: "SET_HOUSEHOLD"; payload: Household }
  | { type: "SET_APPLIANCES"; payload: Appliance[] }
  | { type: "ADD_APPLIANCE"; payload: Appliance }
  | { type: "UPDATE_APPLIANCE"; payload: Appliance }
  | { type: "DELETE_APPLIANCE"; payload: string }
  | { type: "TOGGLE_APPLIANCE"; payload: string }
  | { type: "SET_SOLAR"; payload: SolarProfile }
  | { type: "RESET_DEMO" };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DB_LOADED":
      return { ...state, dbLoaded: true, isLoading: false };
    case "SET_HOUSEHOLD":
      return { ...state, household: action.payload, lastUpdated: new Date().toISOString() };
    case "SET_APPLIANCES":
      return { ...state, appliances: action.payload, lastUpdated: new Date().toISOString() };
    case "ADD_APPLIANCE":
      return { ...state, appliances: [...state.appliances, action.payload], lastUpdated: new Date().toISOString() };
    case "UPDATE_APPLIANCE":
      return {
        ...state,
        appliances: state.appliances.map((a) => a.id === action.payload.id ? action.payload : a),
        lastUpdated: new Date().toISOString(),
      };
    case "DELETE_APPLIANCE":
      return { ...state, appliances: state.appliances.filter((a) => a.id !== action.payload), lastUpdated: new Date().toISOString() };
    case "TOGGLE_APPLIANCE":
      return {
        ...state,
        appliances: state.appliances.map((a) =>
          a.id === action.payload
            ? { ...a, status: a.status === "on" ? "off" : "on", updated_at: new Date().toISOString() }
            : a
        ),
        lastUpdated: new Date().toISOString(),
      };
    case "SET_SOLAR":
      return { ...state, solar: action.payload, lastUpdated: new Date().toISOString() };
    case "RESET_DEMO":
      return { ...initialState, appliances: DEMO_APPLIANCES.map((a) => ({ ...a })), lastUpdated: new Date().toISOString() };
    default:
      return state;
  }
}

const initialState: AppState = {
  household: DEMO_HOUSEHOLD,
  appliances: DEMO_APPLIANCES,
  solar: DEMO_SOLAR,
  isLoading: true,
  lastUpdated: new Date().toISOString(),
  dbLoaded: false,
};

// ─── Context ─────────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  stats: DashboardStats;
  enrichedAppliances: ApplianceWithStats[];
  toggleAppliance: (id: string) => void;
  addAppliance: (appliance: Appliance) => void;
  updateAppliance: (appliance: Appliance | ApplianceWithStats) => void;
  deleteAppliance: (id: string) => void;
  setHousehold: (household: Household) => void;
  setSolar: (solar: SolarProfile) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadFromDb() {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const [household, appliances] = await Promise.all([
          getHousehold(),
          getAppliances(),
        ]);
        if (household) dispatch({ type: "SET_HOUSEHOLD", payload: household });
        if (appliances.length > 0) dispatch({ type: "SET_APPLIANCES", payload: appliances });
      } catch (e) {
        console.error("DB load error:", e);
      } finally {
        dispatch({ type: "SET_DB_LOADED" });
      }
    }
    loadFromDb();
  }, []);

  // Realtime subscription — appliance status updates from sensor
  useEffect(() => {
    const channel = supabase
      .channel("appliance-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appliances" },
        (payload) => {
          dispatch({ type: "UPDATE_APPLIANCE", payload: payload.new as Appliance });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appliances" },
        (payload) => {
          dispatch({ type: "ADD_APPLIANCE", payload: payload.new as Appliance });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "appliances" },
        (payload) => {
          dispatch({ type: "DELETE_APPLIANCE", payload: payload.old.id });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    return calcDashboardStats(
      state.appliances,
      state.household.tariff_rate,
      state.solar.panel_capacity_kw * 4.5
    );
  }, [state.appliances, state.household.tariff_rate, state.solar.panel_capacity_kw]);

  const enrichedAppliances = useMemo(() => {
    return enrichAppliancesWithStats(state.appliances, state.household.tariff_rate);
  }, [state.appliances, state.household.tariff_rate]);

  const toggleAppliance = useCallback(async (id: string) => {
    const appliance = state.appliances.find((a) => a.id === id);
    if (!appliance) return;

    const newStatus = appliance.status === "on" ? "off" : "on";

    // Optimistic UI update
    dispatch({ type: "TOGGLE_APPLIANCE", payload: id });

    try {
      // Fire sensor event → API handles DB + session management
      await fetch("/api/sensor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliance_id: id, event_type: newStatus, source: "manual" }),
      });
    } catch (e) {
      // Revert on failure
      dispatch({ type: "TOGGLE_APPLIANCE", payload: id });
      console.error("Toggle failed:", e);
    }
  }, [state.appliances]);

  const addAppliance = useCallback(async (appliance: Appliance) => {
    dispatch({ type: "ADD_APPLIANCE", payload: appliance });
    try { await upsertAppliance(appliance); } catch (e) { console.error(e); }
  }, []);

  const updateAppliance = useCallback(async (appliance: Appliance | ApplianceWithStats) => {
    const updated = { ...appliance, updated_at: new Date().toISOString() };
    dispatch({ type: "UPDATE_APPLIANCE", payload: updated as Appliance });
    try { await upsertAppliance(updated as Appliance); } catch (e) { console.error(e); }
  }, []);

  const deleteAppliance = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_APPLIANCE", payload: id });
    try { await deleteApplianceDb(id); } catch (e) { console.error(e); }
  }, []);

  const setHousehold = useCallback(async (household: Household) => {
    dispatch({ type: "SET_HOUSEHOLD", payload: household });
    try { await upsertHousehold(household); } catch (e) { console.error(e); }
  }, []);

  const setSolar = useCallback((solar: SolarProfile) => {
    dispatch({ type: "SET_SOLAR", payload: solar });
  }, []);

  const resetDemo = useCallback(() => {
    dispatch({ type: "RESET_DEMO" });
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch, stats, enrichedAppliances,
      toggleAppliance, addAppliance, updateAppliance,
      deleteAppliance, setHousehold, setSolar, resetDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}
