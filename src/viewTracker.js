const COUNTER_API_URL = 'https://api.counterapi.dev/v1/7even-kingdoms-portfolio/visits/up';
const COUNTER_START_VALUE = 8065; // lol

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_VISITS_TABLE = import.meta.env.VITE_SUPABASE_VISITS_TABLE || 'website_views';
const FALLBACK_COUNT_KEY = 'view_count_fallback';

function getOrCreateVisitorId() {
  const storageKey = 'visitor_id';
  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      visitorId = crypto.randomUUID();
    } else {
      visitorId = `visitor_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    }
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

async function incrementAnalyticsCount() {
  const response = await fetch(COUNTER_API_URL, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to update analytics counter');
  }

  const data = await response.json();
  return data.count ?? 0;
}

function mapToDisplayCount(rawCount) {
  return COUNTER_START_VALUE + Math.max(rawCount - 1, 0);
}

function incrementFallbackCount() {
  const previous = Number(localStorage.getItem(FALLBACK_COUNT_KEY) || COUNTER_START_VALUE - 1);
  const next = previous + 1;
  localStorage.setItem(FALLBACK_COUNT_KEY, String(next));
  return next;
}

async function saveViewToDatabase(viewCount) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return;
  }

  const payload = {
    visitor_id: getOrCreateVisitorId(),
    page_path: window.location.pathname,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    view_count: viewCount,
    viewed_at: new Date().toISOString()
  };

  await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_VISITS_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
}

export async function trackWebsiteVisit() {
  let viewCount = COUNTER_START_VALUE;
  try {
    const rawCount = await incrementAnalyticsCount();
    viewCount = mapToDisplayCount(rawCount);
    localStorage.setItem(FALLBACK_COUNT_KEY, String(viewCount));
  } catch {
    viewCount = incrementFallbackCount();
  }

  try {
    await saveViewToDatabase(viewCount);
  } catch (error) {
    console.warn('Visit tracking database write failed', error);
  }

  return viewCount;
}
