"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { AppProvider } from "@/components/providers/AppProvider";

interface AppShellProps {
  children: React.ReactNode;
}

function ShellInner({ children }: AppShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <motion.div
        animate={{
          marginLeft: sidebarExpanded ? "260px" : "72px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col min-h-screen md:ml-[72px]"
      >
        {/* Top navigation */}
        <TopNav onMenuClick={() => setMobileOpen(true)} sidebarExpanded={sidebarExpanded} />

        {/* Page content */}
        <main className="flex-1 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AppProvider>
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  );
}
