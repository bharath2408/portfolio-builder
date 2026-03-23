"use client";

import {
  ArrowLeft,
  BarChart3,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { SvgLineChart } from "@/components/common/svg-line-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  total: number;
  period: { views: number; range: string };
  daily: Array<{ date: string; views: number }>;
  referrers: Array<{ source: string; count: number }>;
  devices: Record<string, number>;
}

type Range = 7 | 30 | 90;

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<AnalyticsData>(`/portfolios/${id}/analytics?range=${range}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, range]);

  const dailyAvg =
    data && data.daily.length > 0
      ? Math.round(
          data.daily.reduce((sum, d) => sum + d.views, 0) / data.daily.length,
        )
      : 0;

  const topSource =
    data && data.referrers.length > 0 ? (data.referrers[0]?.source ?? "N/A") : "N/A";

  const maxReferrerCount =
    data && data.referrers.length > 0
      ? Math.max(...data.referrers.map((r) => r.count))
      : 1;

  const totalDevices = data
    ? Object.values(data.devices).reduce((sum, c) => sum + c, 0)
    : 0;

  const deviceIcons: Record<string, typeof Monitor> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  const rangeOptions: { label: string; value: Range }[] = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/portfolios"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Track views, referrers, and device breakdowns
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card p-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                range === opt.value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Views"
              value={data?.total ?? 0}
              icon={Eye}
              iconClassName="bg-teal-500/10 text-teal-600 dark:text-teal-400"
            />
            <StatCard
              label="Period Views"
              value={data?.period.views ?? 0}
              icon={BarChart3}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Daily Average"
              value={dailyAvg}
              icon={TrendingUp}
              iconClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
            />
            <StatCard
              label="Top Source"
              value={topSource}
              icon={Globe}
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="mb-4 text-[14px] font-semibold text-foreground">
          Views Over Time
        </h2>
        {loading ? (
          <Skeleton className="h-[200px] rounded-xl" />
        ) : (
          <SvgLineChart
            data={
              data?.daily.map((d) => ({
                label: new Date(d.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                value: d.views,
              })) ?? []
            }
          />
        )}
      </div>

      {/* Referrers & Devices */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Top Referrers */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-[14px] font-semibold text-foreground">
            Top Referrers
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 rounded" />
              ))}
            </div>
          ) : data && data.referrers.length > 0 ? (
            <div className="space-y-3">
              {data.referrers.map((ref) => (
                <div key={ref.source} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate font-medium text-foreground">
                      {ref.source}
                    </span>
                    <span className="ml-2 flex-shrink-0 text-muted-foreground">
                      {ref.count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-teal-500/60 transition-all"
                      style={{
                        width: `${(ref.count / maxReferrerCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/50">
              No referrer data yet
            </p>
          )}
        </div>

        {/* Devices */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-[14px] font-semibold text-foreground">
            Devices
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 rounded" />
              ))}
            </div>
          ) : data && totalDevices > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.devices).map(([device, count]) => {
                const Icon = deviceIcons[device.toLowerCase()] ?? Monitor;
                const pct =
                  totalDevices > 0
                    ? Math.round((count / totalDevices) * 100)
                    : 0;
                return (
                  <div key={device} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {device.charAt(0).toUpperCase() + device.slice(1)}
                      </span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/50">
              No device data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: number | string;
  icon: typeof Eye;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div
        className={cn(
          "mb-3 flex h-8 w-8 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[22px] font-bold tracking-tight text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
