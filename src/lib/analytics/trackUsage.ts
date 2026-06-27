/**
 * Lightweight client-side usage tracker.
 *
 * Writes to `feature_usage_logs` (insert-only, RLS enforces user_id = auth.uid()).
 *
 * Design rules:
 *  - Never log PII (no amounts, no descriptions, no names).
 *  - Buffer events client-side and flush every 5s or when the page hides.
 *  - One persistent session_id per browser tab (sessionStorage). The duration of a
 *    session is derived server-side from MIN/MAX(created_at) per session_id.
 *  - All failures are silent — telemetry must never break the app.
 */
import { supabase } from '@/integrations/supabase/client';

type Event = {
  user_id: string;
  feature_name: string;
  page_path: string | null;
  action_type: string;
  metadata: Record<string, unknown> | null;
  session_id: string;
};

const SESSION_KEY = 'evofinz_session_id';
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER = 25;

let buffer: Event[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'no-storage';
  }
}

async function ensureUserId(): Promise<string | null> {
  if (currentUserId) return currentUserId;
  try {
    const { data } = await supabase.auth.getUser();
    currentUserId = data.user?.id ?? null;
  } catch {
    currentUserId = null;
  }
  return currentUserId;
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  try {
    await supabase.from('feature_usage_logs').insert(batch);
  } catch {
    // swallow — telemetry must never break the app
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function push(event: Omit<Event, 'user_id' | 'session_id'>) {
  const uid = await ensureUserId();
  if (!uid) return; // anonymous users not tracked
  buffer.push({
    ...event,
    user_id: uid,
    session_id: getSessionId(),
  });
  if (buffer.length >= MAX_BUFFER) {
    void flush();
  } else {
    scheduleFlush();
  }
}

/** Track a route change. Call from Layout on location.pathname change. */
export function trackPageView(path: string) {
  void push({
    feature_name: 'page_view',
    page_path: path,
    action_type: 'navigate',
    metadata: null,
  });
}

/** Track a discrete feature usage (voice, ocr, export, etc.). */
export function trackFeature(
  featureName: string,
  actionType: string = 'use',
  metadata?: Record<string, unknown>,
) {
  void push({
    feature_name: featureName,
    page_path: typeof window !== 'undefined' ? window.location.pathname : null,
    action_type: actionType,
    metadata: metadata ?? null,
  });
}

/** Reset the cached user id (call on sign out / sign in). */
export function resetTrackingUser() {
  currentUserId = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

// Flush before tab hides / unloads
if (typeof window !== 'undefined') {
  const handleHide = () => {
    if (buffer.length === 0) return;
    // Best-effort: fire-and-forget through Supabase (no sendBeacon support).
    void flush();
  };
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleHide();
  });
  window.addEventListener('pagehide', handleHide);
}
