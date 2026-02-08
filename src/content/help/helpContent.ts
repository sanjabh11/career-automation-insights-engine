export type HelpEntry = {
  key: string;
  title: string;
  short: string;
  medium?: string;
};

export const helpContent: Record<string, HelpEntry> = {
  apo_score: {
    key: 'apo_score',
    title: 'APO Score',
    short: 'Automation Potential (0–100). Lower = less automation risk.',
    medium: 'APO aggregates several category scores to estimate automation risk. Lower scores indicate lower risk.',
  },
  confidence: {
    key: 'confidence',
    title: 'Confidence',
    short: 'Evidence strength for this estimate.',
    medium: 'Derived from quality and agreement of underlying signals. High = strong evidence across sources; Low = limited or conflicting evidence.'
  },
  timeline: {
    key: 'timeline',
    title: 'Timeline',
    short: 'Estimated period when automation impact is likely.',
    medium: 'Rough window for expected automation effects based on adoption curves and sector dynamics (immediate, short-, medium-, long-term).'
  },
  roi_months: {
    key: 'roi_months',
    title: 'ROI (months)',
    short: 'Months to break even on investment.',
    medium: 'Breakeven point for an upskilling or automation investment. Lower is better; combines direct costs and opportunity cost assumptions.'
  },
  bls_trend: {
    key: 'bls_trend',
    title: 'BLS Trend',
    short: 'Latest employment trend for the occupation.',
    medium: 'Signals whether employment is growing or shrinking based on BLS series. Used to calibrate risk and economic viability.'
  },
  skill_half_life: {
    key: 'skill_half_life',
    title: 'Skill Half-Life',
    short: 'Time for a skill’s value to drop by 50%.',
    medium: 'Models depreciation of skill relevance using exponential decay. Guides refresh cadence and maintenance hours per month.'
  },
  sharpe_ratio: {
    key: 'sharpe_ratio',
    title: 'Sharpe Ratio',
    short: 'Return per unit of risk. Higher = better efficiency.',
    medium: 'Risk-adjusted efficiency of your skill portfolio. Higher values indicate better expected outcomes for the same risk level.'
  },
};
