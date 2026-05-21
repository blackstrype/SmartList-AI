import { Sparkles, X } from 'lucide-react';

export default function NotificationCenter({ notifications, dismissNotification }) {
  return (
    <div className="fixed top-12 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className={`bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-3 text-xs border border-slate-700 cursor-default ${
            n.exiting ? 'notification-exit' : 'notification-enter'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{n.msg}</span>
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-all cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
