
export type ExperimentVariant = "control" | "treatment";

export interface ExperimentConfig {
  featureId: string;
  enabled: boolean;
  trafficAllocation: number; // 0.0 to 1.0 (e.g., 0.5 for 50%)
}

export interface ExperimentResult {
  variant: ExperimentVariant;
  version: string;
  isExperimentActive: boolean;
}

export class ABTestManager {
  private static experiments: Record<string, ExperimentConfig> = {
    "calculate-apo": { enabled: true, trafficAllocation: 0.5 },
    "ai-career-coach": { enabled: true, trafficAllocation: 0.5 },
    "market-intelligence": { enabled: true, trafficAllocation: 0.5 },
    "task-assessment": { enabled: true, trafficAllocation: 0.5 },
    "skill-gap": { enabled: true, trafficAllocation: 0.5 },
    "skill-recommendations": { enabled: true, trafficAllocation: 0.5 },
  };

  /**
   * Determines which variant to serve for a given feature and user.
   * Uses deterministic hashing if userId is provided, otherwise random.
   */
  static getVariant(featureId: string, userId?: string | null): ExperimentResult {
    const config = this.experiments[featureId];

    // Default to control if experiment not configured or disabled
    if (!config || !config.enabled) {
      return {
        variant: "control",
        version: "1.0",
        isExperimentActive: false,
      };
    }

    let bucket: number;

    if (userId) {
      // Deterministic hash for sticky sessions
      // Simple hash function for string to 0-1 range
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      bucket = (Math.abs(hash) % 100) / 100;
    } else {
      // Random assignment for anonymous users
      bucket = Math.random();
    }

    const isTreatment = bucket < config.trafficAllocation;

    return {
      variant: isTreatment ? "treatment" : "control",
      version: isTreatment ? "2.0" : "1.0",
      isExperimentActive: true,
    };
  }

  /**
   * Returns metadata to be logged for analysis
   */
  static getLogMetadata(result: ExperimentResult) {
    return {
      experiment_group: result.variant,
      prompt_version: result.version,
      is_ab_test: result.isExperimentActive
    };
  }
}
