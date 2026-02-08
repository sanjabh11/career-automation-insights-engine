export function getDeviceId(): string {
  const KEY = 'device_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Fallback: non-persistent
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
