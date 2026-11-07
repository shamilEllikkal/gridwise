"use client";

import Image from "next/image";
import { formatPower } from "@/lib/utils";

interface Props {
  solarW: number;
  homeW: number;
  batteryW: number;
  batteryPercent: number;
  gridW: number;
  evW: number;
}

function DataLabel({
  value,
  label,
  valueColor,
  align = "left",
  active = true,
}: {
  value: string;
  label: string;
  valueColor: string;
  align?: "left" | "center" | "right";
  active?: boolean;
}) {
  const alignClass =
    align === "center"
      ? "items-center text-center"
      : align === "right"
      ? "items-end text-right"
      : "items-start text-left";

  return (
    <div
      className={`flex flex-col ${alignClass} px-3 py-2 rounded-xl`}
    >
      <span
        className="text-lg sm:text-2xl font-bold tabular-nums tracking-tight"
        style={{ color: active ? valueColor : "rgba(255,255,255,0.3)" }}
      >
        {value}
      </span>
      <span className="text-[11px] sm:text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
    </div>
  );
}

export function EnergyFlowDiagram({
  solarW,
  homeW,
  batteryW,
  batteryPercent,
  gridW,
  evW,
}: Props) {
  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl" style={{ background: "#000" }}>
      {/* Background image */}
      <Image
        src="/house.png"
        alt="Energy flow diagram"
        width={1008}
        height={756}
        className="w-full h-auto object-contain"
        style={{ opacity: 0.9 }}
        priority
      />

      {/* Top overlay — Grid | Solar | Home */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-3 sm:px-6 pt-3 sm:pt-5 gap-2">
        <DataLabel
          value={formatPower(gridW)}
          label="Grid"
          valueColor="#60a5fa"
          active={gridW > 0}
          align="left"
        />
        <DataLabel
          value={formatPower(solarW)}
          label="Solar"
          valueColor="#f59e0b"
          active={solarW > 0}
          align="center"
        />
        <DataLabel
          value={formatPower(homeW)}
          label="Home"
          valueColor="#22c55e"
          active={homeW > 0}
          align="right"
        />
      </div>

      {/* Bottom overlay — Battery (center) + EV (right) */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 sm:px-6 pb-3 sm:pb-5">
        {/* spacer left */}
        <div className="flex-1" />

        {/* Battery center */}
        <div className="flex flex-col items-center px-3 py-2 rounded-xl">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: "#a78bfa" }}>
              {formatPower(batteryW)}
            </span>
            <span className="text-xs font-medium" style={{ color: "rgba(167,139,250,0.7)" }}>
              {batteryPercent}%
            </span>
          </div>
          {/* Battery SoC bar */}
          <div className="mt-1 w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${batteryPercent}%`,
                background: batteryPercent > 50 ? "#22c55e" : batteryPercent > 20 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="text-[11px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            Battery
          </span>
        </div>

        {/* EV right */}
        <div className="flex-1 flex justify-end">
          <DataLabel
            value={formatPower(evW)}
            label="EV"
            valueColor="#22c55e"
            active={evW > 0}
            align="right"
          />
        </div>
      </div>
    </div>
  );
}
