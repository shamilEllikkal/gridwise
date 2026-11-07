"use client";

import { Bell, Sun, Moon, Menu, Home, ChevronDown, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useApp } from "@/components/providers/AppProvider";
import { NAV_ITEMS } from "@/constants";
import { toast } from "sonner";

interface TopNavProps {
  onMenuClick: () => void;
  sidebarExpanded: boolean;
}

export function TopNav({ onMenuClick, sidebarExpanded }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { state, resetDemo } = useApp();
  const pathname = usePathname();

  const currentPage = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  const handleReset = () => {
    resetDemo();
    toast.success("Demo data reset to defaults", {
      description: "All appliances and settings have been restored.",
    });
  };

  return (
    <motion.header
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ "--desktop-sidebar-width": sidebarExpanded ? "260px" : "72px" } as React.CSSProperties}
      className="fixed top-0 right-0 h-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 md:px-6 gap-4 left-0 transition-[left] duration-300 md:left-[var(--desktop-sidebar-width)]"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2 flex-1">
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            {currentPage?.label ?? "GRIDWISE"}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {state.household.name} · {state.household.location}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Household selector */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground hover:bg-secondary/80 transition-colors">
          <Home className="w-3.5 h-3.5 text-primary" />
          <span className="max-w-[120px] truncate">{state.household.name}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Reset demo */}
        <motion.button
          onClick={handleReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset demo data"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </motion.button>


      </div>
    </motion.header>
  );
}
