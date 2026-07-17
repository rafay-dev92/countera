import PropTypes from "prop-types";

const STATUS_STYLES = {
  PAID: { label: "Paid", classes: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
  PARTIALLY_PAID: { label: "Partially paid", classes: "bg-amber-50 text-amber-700", dot: "bg-amber-600" },
  UNPAID: { label: "Unpaid", classes: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  VOIDED: { label: "Voided", classes: "bg-red-50 text-red-700", dot: "bg-red-600" },
  REFUNDED: { label: "Refunded", classes: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  PENDING: { label: "Pending", classes: "bg-amber-50 text-amber-700", dot: "bg-amber-600" },
  FINISHED: { label: "Finished", classes: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
};

export function StatusChip({ status }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    classes: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${style.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
};

StatusChip.displayName = "/src/widgets/status-chip.jsx";

export default StatusChip;
