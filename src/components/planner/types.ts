// Shared types for AIImpactPlanner and its sub-components

export interface Occupation {
  code: string;
  title: string;
  description?: string;
}

const asRecord = (input: unknown): Record<string, unknown> => {
  return input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
};

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
};

export const normalizeOccupation = (input: unknown): Occupation => {
  const record = asRecord(input);
  return {
    code: firstString(record.code, record.occupation_code) || '',
    title: firstString(record.title, record.occupation_title) || '',
    description:
      firstString(
        record.description,
        record.summary,
        record.occupation_description,
        record.short_description
      ) ||
      undefined,
  };
};

export interface Task {
  id: string;
  description: string;
  category: 'Automate' | 'Augment' | 'Human-only';
  explanation?: string;
  confidence?: number;
  isCustom?: boolean;
}

export interface Skill {
  name: string;
  explanation: string;
  inProgress?: boolean;
}

export interface Resource {
  title: string;
  url: string;
  provider: string;
  skillArea: string;
  costType?: string;
}

export interface LearningPathMilestone {
  id: string;
  title: string;
  skills: string[];
  duration_weeks?: number;
  resources?: unknown[];
  cost_estimate?: number;
  priority?: string;
}

export interface LearningPathData {
  learningPath: {
    name: string;
    description: string;
    estimatedDuration: string;
    milestones: LearningPathMilestone[];
  };
  financials: {
    totalCost: number;
    currentSalary?: number;
    targetSalary?: number;
    salaryIncrease: number;
    roiMonths: number | null;
    lifetimeEarningIncrease: number;
    breakEvenYears: string | null;
  };
  metadata: {
    skillGapsAddressed: number;
    estimatedWeeksToComplete: number;
  };
}

export interface CIPProgram {
  code: string;
  title: string;
  type?: string;
}

export interface CourseResult {
  id: string;
  title: string;
  provider: string;
  url: string;
  duration: string;
  level: string;
  price: string;
  rating?: number;
}

export interface UserPreferences {
  occupation?: Occupation;
  recentTasks?: Task[];
  skillProgress?: Record<string, boolean>;
  lastVisited?: string;
}

export interface FeedbackData {
  taskId: string;
  isAccurate: boolean;
  comment?: string;
}
