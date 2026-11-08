"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plug,
  BarChart3,
  CalendarClock,
  Users,
  Activity,
  Sun,
  FileText,
  BookOpen,
  Settings,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  LayoutDashboard,
  Plug,
  BarChart3,
  CalendarClock,
  Users,
  Activity,
  Sun,
  FileText,
  BookOpen,
  Settings,
  Zap,
};

interface NavContentProps {
  expanded: boolean;
  mobileOpen?: boolean;
  pathname: string;
  onMobileClose?: () => void;
  onToggle: () => void;
}

function NavContent({
  expanded,
  mobileOpen,
  pathname,
  onMobileClose,
  onToggle,
}: NavContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 mb-2">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-green-sm">
            <Zap className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-xl border border-primary/40 animate-ping opacity-30" />
        </div>
        <AnimatePresence>
          {(expanded || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-lg font-bold tracking-tight text-foreground">
                GRID<span className="text-primary">WISE</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                Energy Monitor
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? Plug;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href} onClick={onMobileClose}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                <AnimatePresence>
                  {(expanded || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed desktop */}
                {!expanded && !mobileOpen && (
                  <div className="hidden md:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-medium text-foreground whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden md:block p-2 border-t border-border/50">
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-xs font-medium"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </motion.div>
          {expanded && <span>Collapse sidebar</span>}
        </motion.button>
      </div>
    </div>
  );
}

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ expanded, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: expanded ? 260 : 72 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-card border-r border-border/50 overflow-hidden"
      >
        <NavContent
          expanded={expanded}
          mobileOpen={mobileOpen}
          pathname={pathname}
          onMobileClose={onMobileClose}
          onToggle={onToggle}
        />
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-card border-r border-border/50 md:hidden"
            >
              {/* Mobile close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <NavContent
                expanded={expanded}
                mobileOpen={mobileOpen}
                pathname={pathname}
                onMobileClose={onMobileClose}
                onToggle={onToggle}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
