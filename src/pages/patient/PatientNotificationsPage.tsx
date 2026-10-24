import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Check,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { Button, PageHeader, StatusBadge } from '../../components/ui';
import { useNotifications, type NotificationTriggerType } from '../../services/liveStore';

export function PatientNotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [permissionState, setPermissionState] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleRequestPush = async () => {
    const res = await requestPermission();
    setPermissionState(res);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationTriggerType) => {
    switch (type) {
      case 'turn_soon':
        return <BellRing size={22} className="text-blue-600 animate-bounce" />;
      case 'completed':
        return <CheckCircle2 size={22} className="text-emerald-600" />;
      case 'report_ready':
        return <FileText size={22} className="text-indigo-600" />;
      case 'emergency':
        return <AlertTriangle size={22} className="text-red-600 animate-pulse" />;
      default:
        return <Sparkles size={22} className="text-[var(--color-primary-600)]" />;
    }
  };

  const getBorderColor = (type: NotificationTriggerType, isUnread: boolean) => {
    if (!isUnread) return 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-85';
    switch (type) {
      case 'turn_soon':
        return 'border-2 border-blue-400 bg-blue-50/70 shadow-xs';
      case 'completed':
        return 'border-2 border-emerald-400 bg-emerald-50/70 shadow-xs';
      case 'report_ready':
        return 'border-2 border-indigo-400 bg-indigo-50/70 shadow-xs';
      case 'emergency':
        return 'border-2 border-red-500 bg-red-50 shadow-xs';
      default:
        return 'border-2 border-[var(--color-primary-400)] bg-[var(--color-primary-50)] shadow-xs';
    }
  };

  return (
    <BaseLayout showHome={true} headerTitle="Notifications">
      <div className="page-container gap-4 sm:gap-6">
        {/* Header */}
        <PageHeader
          title="Notifications"
          subtitle="Real-time queue announcements, doctor calls, and lab results"
          showBack={true}
          onBack={() => navigate(-1)}
          actions={
            unreadCount > 0 ? (
              <StatusBadge
                variant="info"
                label={`${unreadCount} New`}
                icon={<BellRing size={14} />}
              />
            ) : undefined
          }
        />

        {/* ══════════════════════════════════════════════════════════════════
            BROWSER PUSH NOTIFICATION PERMISSION CARD
            ══════════════════════════════════════════════════════════════════ */}
        {permissionState !== 'granted' && permissionState !== 'unsupported' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-primary-50)] border-2 border-[var(--color-primary-200)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white text-[var(--color-primary-600)] shadow-2xs shrink-0 mt-0.5">
                <BellRing size={20} />
              </div>
              <div>
                <span className="font-black text-sm sm:text-base text-[var(--color-primary-950)] block">
                  Enable Browser Push Alerts
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-primary-800)] mt-0.5 block leading-relaxed">
                  Get notified on your lock screen or other tabs when your token is called or your turn arrives.
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestPush}
              className="shrink-0 self-start sm:self-center font-bold"
            >
              Enable Alerts
            </Button>
          </div>
        ) : permissionState === 'granted' ? (
          <div className="p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>Browser notification permission is active. You will receive live alerts.</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-black uppercase text-[10px]">
              Enabled
            </span>
          </div>
        ) : null}

        {/* ══════════════════════════════════════════════════════════════════
            FILTERS & BULK ACTIONS
            ══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={[
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                filter === 'all'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary-600)] shadow-2xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={[
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                filter === 'unread'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary-600)] shadow-2xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<CheckCheck size={16} />}
                onClick={() => markAllAsRead()}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} />}
                onClick={() => clearAll()}
                className="text-xs text-[var(--color-text-muted)] hover:text-red-600"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            NOTIFICATION LIST
            ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)]">
                <Check size={22} />
              </div>
              <h3 className="font-extrabold text-base text-[var(--color-text)]">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
                You will receive alerts here when your turn approaches, doctor calls your token, or lab reports are published.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/patient/slip')}
                className="mt-2 font-bold"
              >
                <span>Return to My Slip</span>
              </Button>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  className={[
                    'p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 transition-all relative overflow-hidden',
                    getBorderColor(notif.type, isUnread),
                  ].join(' ')}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <span
                      className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"
                      title="Unread"
                      aria-label="Unread"
                    />
                  )}

                  {/* Icon */}
                  <div className="p-2.5 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm sm:text-base text-[var(--color-text)] leading-snug">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] font-mono font-semibold text-[var(--color-text-muted)]">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-muted)] mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {notif.actionUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(notif.actionUrl!);
                          }}
                          className="btn btn-sm btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{notif.actionLabel || 'View Details'}</span>
                          <ArrowRight size={14} />
                        </button>
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
