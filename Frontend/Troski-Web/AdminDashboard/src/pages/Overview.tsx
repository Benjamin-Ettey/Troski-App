import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CirclePause,
  ClipboardList,
  MessageSquareWarning,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import useAuth from "../hooks/useAuth";
import { formatDate } from "../lib/format";
import { getApplications, getStats } from "../services/driverService";
import type { DashboardStats, DriverApplication } from "../types/driver";

interface StatCardProps {
  label: string;
  value?: number;
  icon: LucideIcon;
  highlight?: boolean;
}

const StatCard = ({ label, value, icon: Icon, highlight }: StatCardProps) => (
  <div className="rounded-2xl border border-ink/10 bg-white p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          highlight ? "bg-brand" : "bg-ink/5"
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </div>

    {value === undefined ? (
      <div className="mt-4 h-9 w-16 animate-pulse rounded-md bg-ink/5" />
    ) : (
      <p className="mt-3 text-4xl font-bold tracking-tight">{value}</p>
    )}
  </div>
);

const Overview = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<DriverApplication[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getStats(), getApplications()])
      .then(([nextStats, nextApplications]) => {
        if (cancelled) return;
        setStats(nextStats);
        setApplications(nextApplications);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recent = applications ? applications.slice(0, 5) : null;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
        Welcome back, {session?.admin.name}
      </h2>
      <p className="mt-1 text-sm text-ink/60 md:text-base">
        Here's what's happening with driver applications.
      </p>

      {hasError && (
        <div
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          We couldn't load the dashboard. Please refresh the page and try again.
        </div>
      )}

      {stats && stats.pending > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-brand/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {stats.pending}{" "}
            {stats.pending === 1 ? "application is" : "applications are"}{" "}
            waiting for review.
          </p>
          <Link
            to="/applications"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-hover"
          >
            Review now
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending review" value={stats?.pending} icon={ClipboardList} highlight />
        <StatCard label="Needs corrections" value={stats?.needsCorrections} icon={MessageSquareWarning} />
        <StatCard label="Approved drivers" value={stats?.approved} icon={BadgeCheck} />
        <StatCard label="Suspended" value={stats?.suspended} icon={CirclePause} />
      </div>

      {/* Recent applications */}
      <section className="mt-8 rounded-2xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between px-5 py-4 md:px-6">
          <h3 className="text-base font-semibold">Recent applications</h3>
          <Link
            to="/applications"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="hidden grid-cols-[2fr_1.2fr_1fr_9rem] gap-4 border-y border-ink/10 bg-surface px-6 py-2.5 text-xs font-medium uppercase tracking-wide text-ink/50 md:grid">
          <span>Applicant</span>
          <span>Vehicle</span>
          <span>Submitted</span>
          <span>Status</span>
        </div>

        <ul className="divide-y divide-ink/10 border-t border-ink/10 md:border-t-0">
          {recent === null &&
            !hasError &&
            Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="px-5 py-4 md:px-6">
                <div className="h-10 animate-pulse rounded-md bg-ink/5" />
              </li>
            ))}

          {recent?.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-ink/50">
              No applications yet.
            </li>
          )}

          {recent?.map((app) => (
            <li
              key={app.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[2fr_1.2fr_1fr_9rem] md:px-6"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{app.fullName}</p>
                <p className="truncate text-sm text-ink/50 md:hidden">
                  {app.vehicleRegistration} · {formatDate(app.submittedAt)}
                </p>
                <p className="hidden truncate text-sm text-ink/50 md:block">
                  {app.phone}
                </p>
              </div>
              <p className="hidden text-sm md:block">{app.vehicleRegistration}</p>
              <p className="hidden text-sm text-ink/60 md:block">
                {formatDate(app.submittedAt)}
              </p>
              <div>
                <StatusBadge status={app.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Overview;