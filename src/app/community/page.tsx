"use client";

import { useState } from "react";
import {
  Users,
  Zap,
  Trophy,
  Target,
  CheckCircle2,
} from "lucide-react";
import { DEMO_COMMUNITIES } from "@/data/seed";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeaderboardMember {
  rank: number;
  name: string;
  isCurrentUser: boolean;
  score: number; // 0-100
  peakReduction: number; // %
  monthlyKwh: number;
  badge: string;
}

const LEADERBOARD: LeaderboardMember[] = [
  {
    rank: 1,
    name: "Menon Residence (Flat 402)",
    isCurrentUser: false,
    score: 96,
    peakReduction: 68,
    monthlyKwh: 142,
    badge: "Daytime Solar User",
  },
  {
    rank: 2,
    name: "Shamil Residence (Flat 204)",
    isCurrentUser: true,
    score: 92,
    peakReduction: 54,
    monthlyKwh: 184,
    badge: "Evening Use Moved",
  },
  {
    rank: 3,
    name: "Varghese Villa (Flat 101)",
    isCurrentUser: false,
    score: 89,
    peakReduction: 48,
    monthlyKwh: 198,
    badge: "Steady Saver",
  },
  {
    rank: 4,
    name: "Nair Residence (Flat 303)",
    isCurrentUser: false,
    score: 84,
    peakReduction: 41,
    monthlyKwh: 220,
    badge: "Lower Evening Use",
  },
  {
    rank: 5,
    name: "Joseph & Family (Flat 502)",
    isCurrentUser: false,
    score: 79,
    peakReduction: 33,
    monthlyKwh: 265,
    badge: "Regular User",
  },
  {
    rank: 6,
    name: "Pillai Residence (Flat 105)",
    isCurrentUser: false,
    score: 74,
    peakReduction: 25,
    monthlyKwh: 290,
    badge: "Making Changes",
  },
];

export default function CommunityPage() {
  const [pledged, setPledged] = useState(false);

  const community = DEMO_COMMUNITIES[0];
  const transformerCapacityKw = 250;
  const currentCommunityLoadKw = 142.5;
  const loadPercentage = Math.round((currentCommunityLoadKw / transformerCapacityKw) * 100);

  const handlePledge = () => {
    setPledged((prev) => !prev);
    if (!pledged) {
      toast.success("You joined the example challenge", {
        description: "This sample pledge suggests keeping the AC at 24°C and running laundry outside 6–8 PM.",
      });
    } else {
      toast.info("Example pledge removed.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neighbourhood Electricity Use</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sample figures showing how homes in a neighbourhood might use electricity together.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {community.name} ({community.total_households} Homes)
          </span>
        </div>
      </div>

      {/* Community Feeder Health & Transformer Gauge */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Neighbourhood Electricity Supply</h2>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Safe Margin
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Example transformer capacity · {community.location}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {currentCommunityLoadKw} kW
            </span>
            <span className="text-xs text-muted-foreground block">
              of {transformerCapacityKw} kW Max Capacity ({loadPercentage}%)
            </span>
          </div>
        </div>

        {/* Feeder Load Bar */}
        <div className="h-3.5 w-full rounded-full bg-muted overflow-hidden relative">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${loadPercentage}%` }}
          />
          {/* 80% stress threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
            style={{ left: "80%" }}
            title="Warning Threshold (80%)"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span>0 kW</span>
          <span className="text-amber-500">80% Peak Threshold (200 kW)</span>
          <span>250 kW Limit</span>
        </div>
      </div>

      {/* Collective Peak Reduction Challenge */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-primary/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Evening Electricity Saving Challenge</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Goal: Use 40 kW less between 6–8 PM
          </h3>
          <p className="text-xs text-muted-foreground">
            Sample challenge figures for demonstration. Actual neighbourhood participation and savings are not connected.
          </p>

          <div className="pt-2">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Community Progress</span>
              <span className="text-primary">31.2 kW / 40 kW (78%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "78%" }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePledge}
          className={cn(
            "flex-shrink-0 px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-2",
            pledged
              ? "bg-secondary text-secondary-foreground border border-primary/40"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {pledged ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Pledged: 1.5 kW Shift</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
            <span>Join example challenge</span>
            </>
          )}
        </button>
      </div>

      {/* Neighbourhood Leaderboard */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold">Example Neighbourhood Results</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample households ranked by estimated electricity use moved away from evening hours.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Example data
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {LEADERBOARD.map((member) => (
            <div
              key={member.rank}
              className={cn(
                "py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors",
                member.isCurrentUser
                  ? "bg-primary/10 border border-primary/30 font-semibold"
                  : "hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                    member.rank === 1
                      ? "bg-amber-400 text-amber-950"
                      : member.rank === 2
                      ? "bg-slate-300 text-slate-900"
                      : member.rank === 3
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  #{member.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{member.name}</span>
                    {member.isCurrentUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                        Your home (example)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="text-primary font-medium">{member.badge}</span>
                    <span>·</span>
                    <span>{member.monthlyKwh} kWh this month</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right self-start sm:self-auto text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase">Evening use moved</div>
                  <div className="font-bold text-emerald-500 tabular-nums">
                    {member.peakReduction}%
                  </div>
                </div>

                <div className="w-16">
                  <div className="text-muted-foreground text-[10px] uppercase">Score</div>
                  <div className="font-bold text-base text-foreground tabular-nums">
                    {member.score}/100
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
