import type { DriverStatus } from "../types/driver";

const config: Record<DriverStatus, { label: string; className: string }> = {
  pending: { label: "Pending review", className: "bg-brand/25 text-amber-900" },
  needs_corrections: { label: "Needs corrections", className: "bg-orange-100 text-orange-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  suspended: { label: "Suspended", className: "bg-slate-200 text-slate-700" },
  deactivated: { label: "Deactivated", className: "bg-neutral-100 text-neutral-500" },
};

const StatusBadge = ({ status }: { status: DriverStatus }) => {
  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default StatusBadge;