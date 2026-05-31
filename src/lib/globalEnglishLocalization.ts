export type GlobalEnglishRegion = 'US' | 'UK' | 'CA' | 'AU';

export type MappingQuality =
  | 'official_code_system'
  | 'title_isco_bridge'
  | 'manual_review_required';

export interface OfficialSource {
  id: string;
  name: string;
  url: string;
  asOf: string;
  claimBoundary: string;
}

export interface RegionalOccupationMapping {
  code: string;
  title: string;
  sourceId: string;
  quality: MappingQuality;
}

export interface GlobalOccupationCrosswalk {
  soc: string;
  title: string;
  isco08: string;
  esco: {
    searchTerm: string;
    sourceId: 'esco-api';
    quality: MappingQuality;
  };
  ukSoc2020: RegionalOccupationMapping;
  noc2021: RegionalOccupationMapping;
  anzsco2022: RegionalOccupationMapping;
}

export interface RegionalLaborMarketDisclosure {
  region: GlobalEnglishRegion;
  shouldShow: boolean;
  heading: string;
  message: string;
  classification?: RegionalOccupationMapping;
  wageStatus: 'us_basis' | 'not_integrated_disclosure_required';
  sourceIds: string[];
}

export const GLOBAL_ENGLISH_SOURCE_DATE = '2026-05-31';

export const GLOBAL_ENGLISH_OFFICIAL_SOURCES: Record<string, OfficialSource> = {
  'esco-api': {
    id: 'esco-api',
    name: 'European Commission ESCO API',
    url: 'https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-api',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for ESCO occupation discovery and URI-backed concepts, not as proof of UK, Canada, or Australia wages.',
  },
  'ons-soc-2020': {
    id: 'ons-soc-2020',
    name: 'ONS Standard Occupational Classification 2020',
    url: 'https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for UK occupation classification and coding index references.',
  },
  'ons-ashe-table-2': {
    id: 'ons-ashe-table-2',
    name: 'ONS ASHE Table 2',
    url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use only after a UK SOC adapter joins the appropriate ASHE table and preserves release/correction notes.',
  },
  'statcan-noc-2021': {
    id: 'statcan-noc-2021',
    name: 'Statistics Canada NOC 2021 Version 1.0',
    url: 'https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for Canadian NOC classification; wage figures require Job Bank or Statistics Canada wage-source joins.',
  },
  'jobbank-wage-methodology': {
    id: 'jobbank-wage-methodology',
    name: 'Canada Job Bank wage methodology',
    url: 'https://www.jobbank.gc.ca/trend-analysis/search-wages/wage-methodology',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use only for Canada wage displays after joining NOC-specific low, median, and high wage records with source period.',
  },
  'abs-anzsco-2022': {
    id: 'abs-anzsco-2022',
    name: 'ABS ANZSCO 2022 Australian Update',
    url: 'https://www.abs.gov.au/statistics/classifications/anzsco-australian-and-new-zealand-standard-classification-occupations/2022',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for Australian ANZSCO classification while OSCA transition is pending.',
  },
  'jsa-occupation-profiles': {
    id: 'jsa-occupation-profiles',
    name: 'Jobs and Skills Australia Occupation and Industry Profiles',
    url: 'https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use only after joining ANZSCO-level profile data and preserving JSA suppression and update notes.',
  },
};

export const GLOBAL_ENGLISH_OCCUPATION_CROSSWALKS: GlobalOccupationCrosswalk[] = [
  {
    soc: '15-1252.00',
    title: 'Software Developers',
    isco08: '2512',
    esco: { searchTerm: 'software developer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2134', title: 'Programmers and software development professionals', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21232', title: 'Software developers and programmers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '261312', title: 'Developer Programmer', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '15-1211.00',
    title: 'Computer Systems Analysts',
    isco08: '2511',
    esco: { searchTerm: 'systems analyst', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2133', title: 'IT business analysts, architects and systems designers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21221', title: 'Business systems specialists', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '261112', title: 'Systems Analyst', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '15-1212.00',
    title: 'Information Security Analysts',
    isco08: '2529',
    esco: { searchTerm: 'ICT security specialist', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2139', title: 'Information technology professionals n.e.c.', sourceId: 'ons-soc-2020', quality: 'manual_review_required' },
    noc2021: { code: '21220', title: 'Cybersecurity specialists', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '262112', title: 'ICT Security Specialist', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '15-1254.00',
    title: 'Web Developers',
    isco08: '2513',
    esco: { searchTerm: 'web developer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2137', title: 'Web design and development professionals', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21234', title: 'Web developers and programmers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '261212', title: 'Web Developer', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '29-1141.00',
    title: 'Registered Nurses',
    isco08: '2221',
    esco: { searchTerm: 'nursing professional', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2231', title: 'Nurses', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '31301', title: 'Registered nurses and registered psychiatric nurses', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '254499', title: 'Registered Nurses nec', sourceId: 'abs-anzsco-2022', quality: 'manual_review_required' },
  },
  {
    soc: '13-2011.00',
    title: 'Accountants and Auditors',
    isco08: '2411',
    esco: { searchTerm: 'accountant', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2421', title: 'Chartered and certified accountants', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '11100', title: 'Financial auditors and accountants', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '221111', title: 'Accountant (General)', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '13-2051.00',
    title: 'Financial Analysts',
    isco08: '2413',
    esco: { searchTerm: 'financial analyst', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '3534', title: 'Finance and investment analysts and advisers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '11101', title: 'Financial and investment analysts', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '222311', title: 'Financial Investment Adviser', sourceId: 'abs-anzsco-2022', quality: 'manual_review_required' },
  },
  {
    soc: '13-1071.00',
    title: 'Human Resources Specialists',
    isco08: '2423',
    esco: { searchTerm: 'human resources officer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '3562', title: 'Human resources and industrial relations officers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '11200', title: 'Human resources professionals', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '223111', title: 'Human Resource Adviser', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '11-2021.00',
    title: 'Marketing Managers',
    isco08: '1221',
    esco: { searchTerm: 'marketing manager', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '1132', title: 'Marketing, sales and advertising directors', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '10022', title: 'Advertising, marketing and public relations managers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '131112', title: 'Sales and Marketing Manager', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '25-2021.00',
    title: 'Elementary School Teachers',
    isco08: '2341',
    esco: { searchTerm: 'primary school teacher', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2315', title: 'Primary and nursery education teaching professionals', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '41221', title: 'Elementary school and kindergarten teachers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '241213', title: 'Primary School Teacher', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '25-2031.00',
    title: 'Secondary School Teachers',
    isco08: '2330',
    esco: { searchTerm: 'secondary school teacher', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2314', title: 'Secondary education teaching professionals', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '41220', title: 'Secondary school teachers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '241411', title: 'Secondary School Teacher', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '23-1011.00',
    title: 'Lawyers',
    isco08: '2611',
    esco: { searchTerm: 'lawyer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2413', title: 'Solicitors', sourceId: 'ons-soc-2020', quality: 'manual_review_required' },
    noc2021: { code: '41101', title: 'Lawyers and Quebec notaries', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '271311', title: 'Solicitor', sourceId: 'abs-anzsco-2022', quality: 'manual_review_required' },
  },
  {
    soc: '23-2011.00',
    title: 'Paralegals and Legal Assistants',
    isco08: '3411',
    esco: { searchTerm: 'legal assistant', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '3520', title: 'Legal associate professionals', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '42200', title: 'Paralegals and related occupations', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '599112', title: 'Legal Executive', sourceId: 'abs-anzsco-2022', quality: 'manual_review_required' },
  },
  {
    soc: '17-2051.00',
    title: 'Civil Engineers',
    isco08: '2142',
    esco: { searchTerm: 'civil engineer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2121', title: 'Civil engineers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21300', title: 'Civil engineers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '233211', title: 'Civil Engineer', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '17-2141.00',
    title: 'Mechanical Engineers',
    isco08: '2144',
    esco: { searchTerm: 'mechanical engineer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2122', title: 'Mechanical engineers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21301', title: 'Mechanical engineers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '233512', title: 'Mechanical Engineer', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '17-2071.00',
    title: 'Electrical Engineers',
    isco08: '2151',
    esco: { searchTerm: 'electrical engineer', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2123', title: 'Electrical engineers', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21310', title: 'Electrical and electronics engineers', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '233311', title: 'Electrical Engineer', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '17-1011.00',
    title: 'Architects',
    isco08: '2161',
    esco: { searchTerm: 'architect', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2431', title: 'Architects', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '21200', title: 'Architects', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '232111', title: 'Architect', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '29-1215.00',
    title: 'Family Medicine Physicians',
    isco08: '2211',
    esco: { searchTerm: 'general practitioner', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2211', title: 'Generalist medical practitioners', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '31102', title: 'General practitioners and family physicians', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '253111', title: 'General Practitioner', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '29-1021.00',
    title: 'Dentists',
    isco08: '2261',
    esco: { searchTerm: 'dentist', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2253', title: 'Dental practitioners', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '31110', title: 'Dentists', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '252312', title: 'Dentist', sourceId: 'abs-anzsco-2022', quality: 'title_isco_bridge' },
  },
  {
    soc: '29-1051.00',
    title: 'Pharmacists',
    isco08: '2262',
    esco: { searchTerm: 'pharmacist', sourceId: 'esco-api', quality: 'title_isco_bridge' },
    ukSoc2020: { code: '2251', title: 'Pharmacists', sourceId: 'ons-soc-2020', quality: 'title_isco_bridge' },
    noc2021: { code: '31120', title: 'Pharmacists', sourceId: 'statcan-noc-2021', quality: 'title_isco_bridge' },
    anzsco2022: { code: '251513', title: 'Retail Pharmacist', sourceId: 'abs-anzsco-2022', quality: 'manual_review_required' },
  },
];

const REGION_LABELS: Record<GlobalEnglishRegion, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
};

const REGION_CLASSIFICATION_SOURCE_IDS: Record<Exclude<GlobalEnglishRegion, 'US'>, string[]> = {
  UK: ['ons-soc-2020', 'ons-ashe-table-2'],
  CA: ['statcan-noc-2021', 'jobbank-wage-methodology'],
  AU: ['abs-anzsco-2022', 'jsa-occupation-profiles'],
};

export function normalizeSocCode(code: string): string {
  const trimmed = code.trim();
  if (/^\d{2}-\d{4}$/.test(trimmed)) return `${trimmed}.00`;
  return trimmed;
}

export function inferGlobalEnglishRegion(locale?: string): GlobalEnglishRegion {
  const normalized = (locale || (typeof navigator !== 'undefined' ? navigator.language : '') || '').toLowerCase();
  if (normalized.includes('-gb') || normalized.includes('-uk')) return 'UK';
  if (normalized.includes('-ca')) return 'CA';
  if (normalized.includes('-au')) return 'AU';
  return 'US';
}

export function getBrowserGlobalEnglishRegion(): GlobalEnglishRegion {
  if (typeof navigator === 'undefined') return 'US';
  const locales = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];
  return inferGlobalEnglishRegion(locales.find(Boolean));
}

export function resolveGlobalEnglishCrosswalk(socCode: string): GlobalOccupationCrosswalk | undefined {
  const normalized = normalizeSocCode(socCode);
  return GLOBAL_ENGLISH_OCCUPATION_CROSSWALKS.find((row) => row.soc === normalized);
}

export function getRegionalOccupationMapping(
  socCode: string,
  region: GlobalEnglishRegion,
): RegionalOccupationMapping | undefined {
  const crosswalk = resolveGlobalEnglishCrosswalk(socCode);
  if (!crosswalk || region === 'US') return undefined;
  if (region === 'UK') return crosswalk.ukSoc2020;
  if (region === 'CA') return crosswalk.noc2021;
  return crosswalk.anzsco2022;
}

export function getRegionalLaborMarketDisclosure(
  region: GlobalEnglishRegion,
  socCode: string,
): RegionalLaborMarketDisclosure {
  if (region === 'US') {
    return {
      region,
      shouldShow: false,
      heading: 'U.S. labor-market basis',
      message: 'This occupation uses the U.S. O*NET/BLS evidence backbone.',
      wageStatus: 'us_basis',
      sourceIds: [],
    };
  }

  const classification = getRegionalOccupationMapping(socCode, region);
  const sourceIds = REGION_CLASSIFICATION_SOURCE_IDS[region];
  const localLabel = REGION_LABELS[region];
  const mappingText = classification
    ? `A ${localLabel} classification mapping is available as ${classification.code} (${classification.title}).`
    : `No reviewed ${localLabel} classification mapping is available for this O*NET occupation yet.`;

  return {
    region,
    shouldShow: true,
    heading: `${localLabel} labor-market basis`,
    message: `${mappingText} Wage and outlook figures shown in this dashboard remain U.S. O*NET/BLS basis until the ${localLabel} wage/outlook adapter supplies source-dated local values.`,
    classification,
    wageStatus: 'not_integrated_disclosure_required',
    sourceIds,
  };
}

export function getOfficialSources(sourceIds: string[]): OfficialSource[] {
  return sourceIds
    .map((sourceId) => GLOBAL_ENGLISH_OFFICIAL_SOURCES[sourceId])
    .filter((source): source is OfficialSource => Boolean(source));
}
