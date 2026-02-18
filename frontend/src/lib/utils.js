import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    interview: 'bg-purple-50 text-purple-700 border-purple-200',
    offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    ghosted: 'bg-amber-50 text-amber-700 border-amber-200'
  };
  return colors[status] || colors.pending;
}

export function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    applied: '📤',
    interview: '💼',
    offer: '🎉',
    rejected: '❌',
    ghosted: '👻'
  };
  return icons[status] || '📝';
}