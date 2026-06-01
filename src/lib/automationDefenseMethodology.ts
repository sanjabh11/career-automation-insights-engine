export type MethodologySourceId =
  | 'ilo-genai-jobs-2025'
  | 'openai-eloundou-gpts-are-gpts'
  | 'anthropic-economic-index-2026'
  | 'wef-foj-2025'
  | 'nist-ai-rmf'
  | 'onet'
  | 'bls-ai-mlr-2025';

export type MethodologyConstructId =
  | 'task_exposure_not_job_loss'
  | 'automation_augmentation_split'
  | 'decision_support_estimate'
  | 'uncertainty_and_review'
  | 'non_employment_decision_boundary'
  | 'career_insurance_internal_positioning';

export interface AutomationDefenseConstruct {
  id: MethodologyConstructId;
  label: string;
  publicSummary: string;
  sourceIds: MethodologySourceId[];
  allowedPublicClaim: string;
  prohibitedClaim: string;
  evidenceRequiredToUpgrade: string;
}

export interface BuyerJourneyBoundary {
  journey: 'coach_white_label_audit' | 'prosumer_resilience_plan';
  publicName: string;
  positioning: string;
  allowedCopy: string[];
  blockedCopy: string[];
  proofRequiredBeforeExpansion: string;
}

export const PART_II_METHODOLOGY_AS_OF = '2026-06-01';

export const automationDefenseMethodologyConstructs: AutomationDefenseConstruct[] = [
  {
    id: 'task_exposure_not_job_loss',
    label: 'Task exposure is not job loss',
    publicSummary:
      'APO estimates which occupation-level tasks may be exposed to AI assistance or automation pressure; it does not forecast that a person will lose a job.',
    sourceIds: ['ilo-genai-jobs-2025', 'openai-eloundou-gpts-are-gpts', 'onet', 'bls-ai-mlr-2025'],
    allowedPublicClaim:
      'This is a decision-support task-exposure estimate using source-labeled occupation data as of the cited source dates.',
    prohibitedClaim:
      'Do not say AI will replace a worker, that a job is safe, or that a score predicts displacement.',
    evidenceRequiredToUpgrade:
      'Expert-labeled calibration, employer task-mix validation, and longitudinal outcome evidence tied to the specific use case.',
  },
  {
    id: 'automation_augmentation_split',
    label: 'Automation and augmentation must be separated',
    publicSummary:
      'Reports distinguish tasks AI may perform directly from tasks where AI may assist a worker, because the labor-market implications differ.',
    sourceIds: ['anthropic-economic-index-2026', 'ilo-genai-jobs-2025', 'wef-foj-2025'],
    allowedPublicClaim:
      'The report separates likely automation pressure from augmentation and workflow-redesign opportunities.',
    prohibitedClaim:
      'Do not collapse AI use into a single job-loss or job-safety label.',
    evidenceRequiredToUpgrade:
      'Observed task usage data, reviewed customer workflow evidence, and current source snapshots per occupation.',
  },
  {
    id: 'decision_support_estimate',
    label: 'Decision-support estimate',
    publicSummary:
      'The score is a planning aid for coaching and reskilling conversations, not a validated employment-selection procedure.',
    sourceIds: ['nist-ai-rmf', 'bls-ai-mlr-2025', 'onet'],
    allowedPublicClaim:
      'Use the estimate to prioritize review, skill planning, and questions for a human advisor.',
    prohibitedClaim:
      'Do not use scores for hiring, firing, promotion, compensation, eligibility, or screening decisions.',
    evidenceRequiredToUpgrade:
      'A formal validated employment-selection program with legal, adverse-impact, accommodation, and dispute controls.',
  },
  {
    id: 'uncertainty_and_review',
    label: 'Uncertainty and review state',
    publicSummary:
      'Every commercial artifact should expose source IDs, source dates, reviewer status, and what the evidence does not prove.',
    sourceIds: ['nist-ai-rmf', 'wef-foj-2025', 'anthropic-economic-index-2026'],
    allowedPublicClaim:
      'The artifact is source-labeled and review-state-labeled for planning use.',
    prohibitedClaim:
      'Do not say validated, certified, production-proven, or accuracy-proven unless current proof artifacts support the exact claim.',
    evidenceRequiredToUpgrade:
      'Current calibration report, live source refresh evidence, human review attestation, and owner-held proof records.',
  },
  {
    id: 'non_employment_decision_boundary',
    label: 'Planning-only employment boundary',
    publicSummary:
      'The product can support career planning and workforce discussion, but it must not be presented as an employment decision system.',
    sourceIds: ['nist-ai-rmf', 'bls-ai-mlr-2025'],
    allowedPublicClaim:
      'For coaching, planning, and internal learning discussions only.',
    prohibitedClaim:
      'Do not furnish individual scores to employers for employment purposes without a separate legal and validation program.',
    evidenceRequiredToUpgrade:
      'Buyer legal approval, documented accommodation process, model governance, and validated job-relatedness evidence.',
  },
  {
    id: 'career_insurance_internal_positioning',
    label: 'Internal career-insurance positioning boundary',
    publicSummary:
      'The phrase career insurance is an internal funnel metaphor only until legal and claim-boundary review approves exact public language.',
    sourceIds: ['nist-ai-rmf'],
    allowedPublicClaim:
      'Use career resilience plan, automation-defense planning, or decision-support audit in product UI.',
    prohibitedClaim:
      'Do not publicly promise career insurance, guaranteed protection, safe roles, or protected outcomes.',
    evidenceRequiredToUpgrade:
      'Legal review, claim-boundary verifier update, approved public copy, and clear non-guarantee disclaimer.',
  },
];

export const buyerJourneyBoundaries: BuyerJourneyBoundary[] = [
  {
    journey: 'coach_white_label_audit',
    publicName: 'White-label Automation Defense Audit',
    positioning:
      'A source-labeled client review workflow for coaches who need faster task-exposure, bridge-role, and skill-planning discussions.',
    allowedCopy: [
      'white-label automation defense audit',
      'source-labeled client planning artifact',
      'decision-support estimate with reviewer caveats',
    ],
    blockedCopy: ['future-proof client report', 'safe job audit', 'validated assessment', 'guaranteed ROI'],
    proofRequiredBeforeExpansion:
      'Three committed design partners, one permissioned outcome, live checkout evidence, and owner-approved case-study language.',
  },
  {
    journey: 'prosumer_resilience_plan',
    publicName: 'Career Resilience Plan',
    positioning:
      'A prosumer planning flow that converts occupation-level exposure into skill, bridge-role, and question prompts for human review.',
    allowedCopy: [
      'career resilience plan',
      'automation-defense planning',
      'decision-support exposure estimate',
    ],
    blockedCopy: ['career insurance', 'AI-proof career', 'will not be replaced', 'guaranteed transition'],
    proofRequiredBeforeExpansion:
      'Legal/claim-boundary review and longitudinal outcome evidence before stronger protection language is used publicly.',
  },
];

export function getMethodologySourceIds(): MethodologySourceId[] {
  return Array.from(new Set(automationDefenseMethodologyConstructs.flatMap((construct) => construct.sourceIds)));
}

export function getAllowedPublicMethodologyClaims(): string[] {
  return automationDefenseMethodologyConstructs.map((construct) => construct.allowedPublicClaim);
}
