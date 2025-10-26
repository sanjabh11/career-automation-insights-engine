type Milestone = { id: string; title: string; targetMinutes?: number; completedMinutes?: number; done?: boolean };

type ProgressState = {
  goals: string[];
  milestones: Milestone[];
  streakCount: number;
  lastLogDate?: string; // YYYY-MM-DD
  totalMinutes?: number;
};

const KEY = 'progress:v1';

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { goals: [], milestones: [], streakCount: 0, totalMinutes: 0 };
    const parsed = JSON.parse(raw) as ProgressState;
    return { goals: [], milestones: [], streakCount: 0, totalMinutes: 0, ...parsed };
  } catch {
    return { goals: [], milestones: [], streakCount: 0, totalMinutes: 0 };
  }
}

function save(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

export function useProgress() {
  const state = load();

  const addGoal = (goal: string) => {
    if (!goal.trim()) return load();
    const s = load();
    if (!s.goals.includes(goal)) s.goals.push(goal);
    save(s);
    return s;
  };

  const addMilestone = (title: string, targetMinutes?: number) => {
    const s = load();
    s.milestones.push({ id: `m-${Date.now()}`, title, targetMinutes, completedMinutes: 0, done: false });
    save(s);
    return s;
  };

  const completeMilestone = (id: string) => {
    const s = load();
    s.milestones = s.milestones.map(m => m.id === id ? { ...m, done: true, completedMinutes: m.targetMinutes ?? m.completedMinutes } : m);
    save(s);
    return s;
  };

  const logMinutes = (minutes: number) => {
    const s = load();
    s.totalMinutes = (s.totalMinutes ?? 0) + Math.max(0, minutes);
    const today = todayStr();
    if (s.lastLogDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0,10);
      s.streakCount = s.lastLogDate === yStr ? (s.streakCount + 1) : 1;
      s.lastLogDate = today;
    }
    save(s);
    return s;
  };

  const getState = () => load();

  const overall = () => {
    const s = load();
    const targets = s.milestones.reduce((acc, m) => acc + (m.targetMinutes ?? 0), 0);
    const completed = s.milestones.reduce((acc, m) => acc + (m.completedMinutes ?? 0), 0);
    const pct = targets > 0 ? Math.min(100, Math.round((completed / targets) * 100)) : 0;
    return { pct, streak: s.streakCount, totalMinutes: s.totalMinutes ?? 0, count: s.milestones.length };
  };

  return { addGoal, addMilestone, completeMilestone, logMinutes, getState, overall };
}
