import { occupationRiskData } from "@/data/occupationRiskData";
import { occupationDefaults } from "@/content/templates/occupationDefaults";

export interface SocSuggestion {
  code: string;
  title: string;
  confidence: number;
  reason: string;
  source: string;
}

interface SocCandidate {
  code: string;
  title: string;
  aliases: string[];
  source: string;
}

const STOP_WORDS = new Set([
  "and",
  "or",
  "of",
  "the",
  "a",
  "an",
  "for",
  "to",
  "in",
  "with",
  "senior",
  "junior",
  "lead",
  "staff",
  "team",
  "department",
  "assistant",
  "coordinator",
]);

const WORKFORCE_AUDIT_SOC_SEEDS: SocCandidate[] = [
  {
    code: "43-4051.00",
    title: "Customer Service Representatives",
    aliases: ["customer support representative", "customer operations representative", "call center representative"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-3031.00",
    title: "Bookkeeping, Accounting, and Auditing Clerks",
    aliases: ["bookkeeper", "accounting clerk", "auditing clerk", "finance clerk"],
    source: "commercial workforce audit seed",
  },
  {
    code: "49-9051.00",
    title: "Electrical Power-Line Installers and Repairers",
    aliases: ["line worker", "lineman", "power line installer", "field line repairer"],
    source: "commercial workforce audit seed",
  },
  {
    code: "51-8012.00",
    title: "Power Distributors and Dispatchers",
    aliases: ["grid dispatcher", "control center dispatcher", "power dispatcher"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1041.07",
    title: "Regulatory Affairs Specialists",
    aliases: ["regulatory specialist", "compliance specialist", "rate case analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1212.00",
    title: "Information Security Analysts",
    aliases: ["cybersecurity analyst", "security analyst", "ot security analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "17-3023.00",
    title: "Electrical and Electronic Engineering Technologists and Technicians",
    aliases: ["electrical technician", "electronics technician", "substation technician", "relay technician"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1111.00",
    title: "Management Analysts",
    aliases: ["business analyst", "operations analyst", "process analyst", "transformation analyst", "strategy analyst"],
    source: "local occupation defaults",
  },
  {
    code: "15-1252.00",
    title: "Software Developers",
    aliases: ["software engineer", "application developer", "web developer"],
    source: "local occupation defaults",
  },
  {
    code: "15-2051.00",
    title: "Data Scientists",
    aliases: ["machine learning scientist", "data science analyst", "analytics scientist", "ai analyst"],
    source: "local occupation defaults",
  },
  {
    code: "29-1141.00",
    title: "Registered Nurses",
    aliases: ["rn", "clinical nurse", "staff nurse"],
    source: "local occupation defaults",
  },
  {
    code: "11-2021.00",
    title: "Marketing Managers",
    aliases: ["digital marketing manager", "content marketing manager", "growth marketing manager"],
    source: "local occupation defaults",
  },
  {
    code: "13-2011.00",
    title: "Accountants and Auditors",
    aliases: ["accountant", "auditor", "staff accountant", "senior accountant", "internal auditor", "financial accountant"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-3021.00",
    title: "Billing and Posting Clerks",
    aliases: ["billing clerk", "billing specialist", "accounts receivable clerk", "ar clerk", "invoice specialist"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-3051.00",
    title: "Payroll and Timekeeping Clerks",
    aliases: ["payroll clerk", "payroll specialist", "timekeeping clerk", "time and attendance clerk"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-3061.00",
    title: "Procurement Clerks",
    aliases: ["procurement clerk", "purchasing clerk", "buying clerk", "vendor setup clerk"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-6011.00",
    title: "Executive Secretaries and Executive Administrative Assistants",
    aliases: ["executive assistant", "ea", "executive admin assistant", "chief of staff assistant"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-6014.00",
    title: "Secretaries and Administrative Assistants, Except Legal, Medical, and Executive",
    aliases: ["administrative assistant", "admin assistant", "office coordinator", "department assistant", "office administrator"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-9021.00",
    title: "Data Entry Keyers",
    aliases: ["data entry clerk", "data entry specialist", "records entry clerk", "data processor"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-4151.00",
    title: "Order Clerks",
    aliases: ["order clerk", "order entry specialist", "sales order specialist", "order processing clerk"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1071.00",
    title: "Human Resources Specialists",
    aliases: ["hr specialist", "human resources generalist", "recruiter", "talent acquisition specialist", "hris analyst", "hr business partner", "benefits specialist"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-4161.00",
    title: "Human Resources Assistants, Except Payroll and Timekeeping",
    aliases: ["hr assistant", "human resources assistant", "hr coordinator", "people operations coordinator", "people ops coordinator"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1151.00",
    title: "Training and Development Specialists",
    aliases: ["learning specialist", "l&d specialist", "training coordinator", "instructional designer"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-2051.00",
    title: "Financial and Investment Analysts",
    aliases: ["financial analyst", "fp&a analyst", "finance analyst", "investment analyst", "portfolio analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1161.00",
    title: "Market Research Analysts and Marketing Specialists",
    aliases: ["market research analyst", "marketing analyst", "seo analyst", "campaign analyst", "growth analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1082.00",
    title: "Project Management Specialists",
    aliases: ["project manager", "program manager", "project coordinator", "pmo analyst", "scrum master"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1081.00",
    title: "Logisticians",
    aliases: ["logistics analyst", "supply chain analyst", "transportation planner", "inventory planner"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1028.00",
    title: "Buyers and Purchasing Agents",
    aliases: ["buyer", "purchasing agent", "procurement specialist", "sourcing specialist", "vendor manager"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-5061.00",
    title: "Production, Planning, and Expediting Clerks",
    aliases: ["production planner", "materials planner", "planning clerk", "expeditor", "scheduler"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-5071.00",
    title: "Shipping, Receiving, and Inventory Clerks",
    aliases: ["inventory clerk", "warehouse clerk", "shipping clerk", "receiving clerk", "stockroom clerk"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1232.00",
    title: "Computer User Support Specialists",
    aliases: ["help desk analyst", "it support specialist", "desktop support technician", "service desk analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1244.00",
    title: "Network and Computer Systems Administrators",
    aliases: ["systems administrator", "network administrator", "cloud administrator", "infrastructure engineer"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1231.00",
    title: "Computer Network Support Specialists",
    aliases: ["network support specialist", "network support analyst", "noc analyst", "network technician"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1242.00",
    title: "Database Administrators",
    aliases: ["database administrator", "dba", "database analyst", "data warehouse administrator"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-1253.00",
    title: "Software Quality Assurance Analysts and Testers",
    aliases: ["qa analyst", "quality assurance analyst", "software tester", "test automation engineer"],
    source: "commercial workforce audit seed",
  },
  {
    code: "15-2031.00",
    title: "Operations Research Analysts",
    aliases: ["operations research analyst", "optimization analyst", "workforce analytics analyst", "planning analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "11-1021.00",
    title: "General and Operations Managers",
    aliases: ["operations manager", "general manager", "business operations manager", "site manager"],
    source: "commercial workforce audit seed",
  },
  {
    code: "11-3031.00",
    title: "Financial Managers",
    aliases: ["finance manager", "controller", "accounting manager", "treasury manager"],
    source: "commercial workforce audit seed",
  },
  {
    code: "11-3121.00",
    title: "Human Resources Managers",
    aliases: ["hr manager", "people operations manager", "talent manager", "compensation manager"],
    source: "commercial workforce audit seed",
  },
  {
    code: "11-3021.00",
    title: "Computer and Information Systems Managers",
    aliases: ["it manager", "technology manager", "information systems manager", "engineering manager", "infrastructure manager"],
    source: "commercial workforce audit seed",
  },
  {
    code: "43-1011.00",
    title: "First-Line Supervisors of Office and Administrative Support Workers",
    aliases: ["office supervisor", "administrative supervisor", "admin supervisor", "customer service supervisor", "support team lead"],
    source: "commercial workforce audit seed",
  },
  {
    code: "41-3091.00",
    title: "Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel",
    aliases: ["sales representative", "account executive", "business development representative", "sales development representative", "inside sales representative"],
    source: "commercial workforce audit seed",
  },
  {
    code: "41-1012.00",
    title: "First-Line Supervisors of Non-Retail Sales Workers",
    aliases: ["sales supervisor", "sales team lead", "sales manager", "inside sales manager", "account manager supervisor"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1041.00",
    title: "Compliance Officers",
    aliases: ["compliance officer", "compliance analyst", "risk compliance analyst", "policy compliance specialist"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-2041.00",
    title: "Credit Analysts",
    aliases: ["credit analyst", "commercial credit analyst", "loan credit analyst", "risk analyst"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-2072.00",
    title: "Loan Officers",
    aliases: ["loan officer", "mortgage loan officer", "lending specialist", "commercial loan officer"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-1031.00",
    title: "Claims Adjusters, Examiners, and Investigators",
    aliases: ["claims adjuster", "claims examiner", "insurance claims analyst", "claims investigator"],
    source: "commercial workforce audit seed",
  },
  {
    code: "13-2053.00",
    title: "Insurance Underwriters",
    aliases: ["underwriter", "insurance underwriter", "credit underwriter", "risk underwriter"],
    source: "commercial workforce audit seed",
  },
];

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bcsr\b/g, " customer service representative ")
    .replace(/\bcx\b/g, " customer experience ")
    .replace(/\bhris\b/g, " human resources information systems ")
    .replace(/\bit\b/g, " information technology ")
    .replace(/\bdba\b/g, " database administrator ")
    .replace(/\bnoc\b/g, " network operations center ")
    .replace(/\bqa\b/g, " quality assurance ")
    .replace(/\bap\b/g, " accounts payable ")
    .replace(/\bar\b/g, " accounts receivable ")
    .replace(/\bfp\s*&?\s*a\b/g, " financial planning analysis ")
    .replace(/\bl\s*&?\s*d\b/g, " learning development ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bclerks\b/g, "clerk")
    .replace(/\brepresentatives\b/g, "representative")
    .replace(/\bspecialists\b/g, "specialist")
    .replace(/\banalysts\b/g, "analyst")
    .replace(/\bdevelopers\b/g, "developer")
    .replace(/\btechnicians\b/g, "technician")
    .replace(/\bdispatchers\b/g, "dispatcher")
    .replace(/\brepairers\b/g, "repairer")
    .replace(/\binstallers\b/g, "installer")
    .trim();
}

function titleTokens(value: string): Set<string> {
  return new Set(
    normalizeTitle(value)
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function formatSixDigitCode(code: string): string {
  const match = code.match(/^(\d{2}-\d{4})(?:\.(\d{2}))?/);
  if (!match) return code;
  return `${match[1]}.${match[2] || "00"}`;
}

function mergeCandidates(): SocCandidate[] {
  const merged = new Map<string, SocCandidate>();

  const addCandidate = (candidate: SocCandidate) => {
    const code = formatSixDigitCode(candidate.code);
    const existing = merged.get(code);
    if (!existing) {
      merged.set(code, { ...candidate, code });
      return;
    }

    existing.aliases = Array.from(new Set([...existing.aliases, ...candidate.aliases, candidate.title]));
    if (!existing.source.includes(candidate.source)) {
      existing.source = `${existing.source}; ${candidate.source}`;
    }
  };

  Object.values(occupationRiskData).forEach((occupation) => {
    addCandidate({
      code: occupation.code,
      title: occupation.title,
      aliases: [occupation.title, occupation.bridgeRole],
      source: "local SEO occupation risk data",
    });
  });

  Object.values(occupationDefaults).forEach((occupation) => {
    addCandidate({
      code: occupation.code,
      title: occupation.title,
      aliases: [occupation.title],
      source: "local occupation defaults",
    });
  });

  WORKFORCE_AUDIT_SOC_SEEDS.forEach(addCandidate);
  return Array.from(merged.values());
}

const SOC_CANDIDATES = mergeCandidates();

export function getSocSuggestionCatalogStats() {
  const sourceCounts = SOC_CANDIDATES.reduce<Record<string, number>>((counts, candidate) => {
    candidate.source.split(";").map((source) => source.trim()).forEach((source) => {
      counts[source] = (counts[source] || 0) + 1;
    });
    return counts;
  }, {});
  const sources = Object.keys(sourceCounts).sort();

  return {
    candidateCount: SOC_CANDIDATES.length,
    occupationCount: SOC_CANDIDATES.length,
    sourceCounts,
    sourceCount: sources.length,
    sources,
  };
}

function scoreCandidate(role: string, department: string, candidate: SocCandidate) {
  const normalizedRole = normalizeTitle(role);
  const roleTokens = titleTokens(role);
  const departmentTokens = titleTokens(department);
  const titles = [candidate.title, ...candidate.aliases];

  let bestScore = 0;
  let bestReason = "Token overlap with local occupation title.";

  titles.forEach((title) => {
    const normalizedCandidate = normalizeTitle(title);
    const candidateTokens = titleTokens(title);
    const overlap = Array.from(roleTokens).filter((token) => candidateTokens.has(token)).length;
    const coverage = roleTokens.size ? overlap / roleTokens.size : 0;
    const precision = candidateTokens.size ? overlap / candidateTokens.size : 0;
    let score = coverage * 0.62 + precision * 0.23;

    if (normalizedRole === normalizedCandidate) {
      score = 1;
      bestReason = "Exact normalized title match.";
    } else if (normalizedRole.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedRole)) {
      score = Math.max(score, 0.86);
      bestReason = "Role title contains the local occupation title or alias.";
    } else if (coverage >= 0.75) {
      bestReason = "Most role-title tokens match a local occupation title or alias.";
    }

    const departmentOverlap = Array.from(departmentTokens).some((token) => candidateTokens.has(token));
    if (departmentOverlap) score += 0.04;

    if (score > bestScore) {
      bestScore = score;
    }
  });

  return {
    score: Math.min(bestScore, 1),
    reason: bestReason,
  };
}

export function suggestSocCodes(input: {
  role: string;
  department?: string;
  limit?: number;
}): SocSuggestion[] {
  const role = input.role.trim();
  if (!role) return [];

  const suggestions = SOC_CANDIDATES.map((candidate) => {
    const scored = scoreCandidate(role, input.department || "", candidate);
    return {
      code: candidate.code,
      title: candidate.title,
      confidence: Math.round(scored.score * 100),
      reason: scored.reason,
      source: candidate.source,
    };
  })
    .filter((suggestion) => suggestion.confidence >= 32)
    .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title));

  return suggestions.slice(0, input.limit ?? 3);
}
