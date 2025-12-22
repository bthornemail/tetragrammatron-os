export async function fetchJsonl<T = any>(url: string): Promise<T[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const text = await res.text();
    const lines = text.split(/\r?/).map(l => l.trim()).filter(Boolean);
    const out: T[] = [];
    for (const line of lines) {
      try { out.push(JSON.parse(line)); } catch { /* skip */ }
    }
    return out;
  }