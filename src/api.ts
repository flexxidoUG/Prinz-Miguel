export type Fact = { label: string; value: string };
export type Member = { key: string; title: string; name: string; motto: string; text: string; facts: Fact[] };
export type Content = {
  site: { title: string; sessionLabel: string; allowIndexing: boolean; photoConsentConfirmed: boolean };
  media: { group: string; miguel: string; laura: string; louisa: string; scepterRef: string; audio: string; scepterModel: string };
  hero: {
    lines: string[]; welcome: string; autoplay: boolean; playOncePerVisit: boolean;
    cues: { miguel: number; paginnen: number; laura: number; louisa: number; konfetti: number; dreimal: number; alaaf: number };
  };
  team: Member[];
  scepter: {
    intro: string;
    motto: { kicker: string; text: string };
    session: { kicker: string; title: string; text: string; items: Fact[] };
    team: { kicker: string; text: string };
  };
  finale: { kicker: string; text: string };
  legal: { impressum: string; datenschutz: string };
};
export type EventItem = { id: number; date: string; title: string; location: string; description: string; link: string };
export type Greeting = { id: number; name: string; message: string; created_at: string; status?: string };
export type PublicData = { content: Content; events: EventItem[]; guestbook: Greeting[] };

export async function api<T>(url: string, opts: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = opts;
  const res = await fetch(url, {
    ...rest,
    credentials: 'same-origin',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), 'X-CSRF': '1', ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Fehler ${res.status}`), { status: res.status });
  return data as T;
}

export const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
export const parseLocal = (s: string) => {
  const [d, tm] = s.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = (tm || '0:0').split(':').map(Number);
  return new Date(y, mo - 1, da, h, mi);
};
