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
  osca2024?: RegionalOccupationMapping;
}

export interface RegionalLaborMarketDisclosure {
  region: GlobalEnglishRegion;
  shouldShow: boolean;
  heading: string;
  message: string;
  classification?: RegionalOccupationMapping;
  wageStatus: 'us_basis' | 'localized_value_available' | 'source_registered_adapter_pending' | 'not_integrated_disclosure_required';
  adapter?: RegionalWageOutlookAdapter;
  localValueStatus?: RegionalWageOutlookFallback;
  localValue?: RegionalLocalizedLaborMarketValue;
  sourceIds: string[];
}

export type RegionalValueAvailability =
  | 'localized_value_available'
  | 'unavailable_source_join_pending'
  | 'suppressed_or_quality_limited';

export interface RegionalWageOutlookFallback {
  status: RegionalValueAvailability;
  wageLabel: string;
  outlookLabel: string;
  reason: string;
  displayBoundary: string;
}

export interface RegionalWageOutlookAdapter {
  region: Exclude<GlobalEnglishRegion, 'US'>;
  label: string;
  valueStatus: 'source_registered_adapter_pending';
  wageSourceIds: string[];
  outlookSourceIds: string[];
  classificationField: 'ukSoc2020' | 'noc2021' | 'anzsco2022';
  forwardClassificationField?: 'osca2024';
  joinLevel: string;
  requiredFields: string[];
  releaseMetadataRequired: string[];
  displayBoundary: string;
  suppressionBoundary: string;
}

export type RegionalLocalValueSuppressionState =
  | 'published'
  | 'published_parent_group_value'
  | 'geography_required'
  | 'not_published_by_source'
  | 'suppressed_or_not_produced';

export interface RegionalLocalWageValue {
  label: string;
  currency: 'GBP' | 'CAD' | 'AUD';
  unit: 'annual' | 'hourly' | 'weekly';
  median?: number;
  mean?: number;
  low?: number;
  high?: number;
  sourcePeriod: string;
  sourceDate: string;
  sourceIds: string[];
  sourceUrl: string;
  suppressionState: RegionalLocalValueSuppressionState;
  qualityNote: string;
}

export interface RegionalLocalOutlookValue {
  label: string;
  value?: string | number;
  unit?: string;
  sourcePeriod: string;
  sourceDate: string;
  sourceIds: string[];
  sourceUrl: string;
  suppressionState: RegionalLocalValueSuppressionState;
  qualityNote: string;
}

export interface RegionalLocalizedLaborMarketValue {
  region: Exclude<GlobalEnglishRegion, 'US'>;
  classificationCode: string;
  classificationTitle: string;
  classificationLevel: string;
  wage: RegionalLocalWageValue;
  outlook: RegionalLocalOutlookValue;
  sourceDate: string;
  sourceIds: string[];
  displayBoundary: string;
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
  'ons-ashe-2025-provisional-table-2': {
    id: 'ons-ashe-2025-provisional-table-2',
    name: 'ONS ASHE Table 2 2025 provisional',
    url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2/2025provisional',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use only as UK SOC two-digit annual gross-pay context; it is not a four-digit occupation-specific wage and affected corrected/suppressed estimates must remain flagged.',
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
  'jobbank-wage-open-data-2025': {
    id: 'jobbank-wage-open-data-2025',
    name: 'Canada Job Bank 2025 Wages open data',
    url: 'https://open.canada.ca/data/dataset/adad580f-76b0-4502-bd05-20c125de9116',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for Canada national wage rows when NOC, geography, low/median/high wage, revision date, annual-wage flag, and wage comments are preserved.',
  },
  'jobbank-outlooks-methodology': {
    id: 'jobbank-outlooks-methodology',
    name: 'Canada Job Bank 3-year employment outlook methodology',
    url: 'https://www.jobbank.gc.ca/trend-analysis/search-job-outlooks/outlooks-methodology',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use only for Canada outlook displays after joining NOC, geography, outlook period, and undetermined/suppression status.',
  },
  'jobbank-outlook-open-data-2025-2027': {
    id: 'jobbank-outlook-open-data-2025-2027',
    name: 'Canada Job Bank 2025-2027 Employment Outlooks open data',
    url: 'https://open.canada.ca/data/dataset/b0e112e9-cf53-4e79-8838-23cd98debe5b',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use for Canada outlook rows only with explicit province/economic-region geography; do not collapse regional outlooks into a national rating.',
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
  'jsa-occupation-profiles-february-2026': {
    id: 'jsa-occupation-profiles-february-2026',
    name: 'Jobs and Skills Australia occupation profiles data February 2026',
    url: 'https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use as ANZSCO 4-digit occupation-profile context with the OSCA transition note; N/A or high-error earnings rows must remain unavailable.',
  },
  'abs-osca-2024': {
    id: 'abs-osca-2024',
    name: 'ABS OSCA 2024',
    url: 'https://www.abs.gov.au/about/key-priorities/about-osca/osca-2024',
    asOf: GLOBAL_ENGLISH_SOURCE_DATE,
    claimBoundary: 'Use as Australia forward-classification context; local values still need a source table that declares OSCA or an explicit ANZSCO transition basis.',
  },
};

export const REGIONAL_WAGE_OUTLOOK_ADAPTERS: Record<
  Exclude<GlobalEnglishRegion, 'US'>,
  RegionalWageOutlookAdapter
> = {
  UK: {
    region: 'UK',
    label: 'ONS ASHE wage adapter',
    valueStatus: 'source_registered_adapter_pending',
    wageSourceIds: ['ons-ashe-table-2'],
    outlookSourceIds: [],
    classificationField: 'ukSoc2020',
    joinLevel: 'UK SOC two-digit wage table; four-digit occupation mappings must be aggregated or separately sourced before display.',
    requiredFields: ['soc_2_digit', 'earnings_measure', 'sex', 'work_pattern', 'estimate', 'unit', 'suppression_or_quality_flag'],
    releaseMetadataRequired: ['edition', 'release_date', 'correction_notice', 'next_release'],
    displayBoundary: 'Do not display UK wage or outlook values until ASHE rows are joined with edition metadata and quality/suppression notes.',
    suppressionBoundary: 'ONS ASHE Table 2 includes corrections and suppressed estimates; suppressed or corrected rows must not be silently imputed.',
  },
  CA: {
    region: 'CA',
    label: 'Canada Job Bank wage and outlook adapter',
    valueStatus: 'source_registered_adapter_pending',
    wageSourceIds: ['jobbank-wage-methodology'],
    outlookSourceIds: ['jobbank-outlooks-methodology'],
    classificationField: 'noc2021',
    joinLevel: 'NOC 2021 occupation with national, province, territory, or economic-region geography.',
    requiredFields: ['noc_2021', 'geography', 'low_wage', 'median_wage', 'high_wage', 'wage_period', 'outlook_rating', 'outlook_period'],
    releaseMetadataRequired: ['date_modified', 'reference_period', 'methodology_url', 'undetermined_or_suppressed_status'],
    displayBoundary: 'Do not display Canada wage or outlook values until Job Bank rows preserve geography, low/median/high wage, outlook period, and undetermined status.',
    suppressionBoundary: 'Job Bank wages and outlooks can be approximate, suppressed, or undetermined when local data is limited; the UI must show that status.',
  },
  AU: {
    region: 'AU',
    label: 'JSA occupation profile adapter with OSCA transition boundary',
    valueStatus: 'source_registered_adapter_pending',
    wageSourceIds: ['jsa-occupation-profiles', 'abs-osca-2024'],
    outlookSourceIds: ['jsa-occupation-profiles', 'abs-osca-2024'],
    classificationField: 'anzsco2022',
    forwardClassificationField: 'osca2024',
    joinLevel: 'JSA occupation profile with declared ANZSCO basis, plus OSCA 2024 transition note when the Australian source has not yet migrated.',
    requiredFields: ['anzsco_or_osca', 'classification_basis', 'employed', 'median_weekly_earnings', 'annual_employment_growth', 'source_basis', 'not_applicable_or_suppressed_status'],
    releaseMetadataRequired: ['source_period', 'profile_url', 'classification_basis', 'osca_transition_note'],
    displayBoundary: 'Do not display Australia wage or outlook values until JSA rows preserve ANZSCO level, N/A values, suppression, and OSCA transition notes.',
    suppressionBoundary: 'JSA notes that ANZSCO-based occupation pages will stop receiving updates and some 6-digit or high-error estimates are not produced.',
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
  UK: ['ons-soc-2020', 'ons-ashe-table-2', 'ons-ashe-2025-provisional-table-2'],
  CA: ['statcan-noc-2021', 'jobbank-wage-methodology', 'jobbank-wage-open-data-2025', 'jobbank-outlooks-methodology', 'jobbank-outlook-open-data-2025-2027'],
  AU: ['abs-anzsco-2022', 'abs-osca-2024', 'jsa-occupation-profiles', 'jsa-occupation-profiles-february-2026'],
};

const UK_ASHE_SOC_2_DIGIT_LOCAL_VALUES: Record<
  string,
  {
    description: string;
    jobsThousand: number;
    medianAnnualGbp: number;
    meanAnnualGbp: number;
    medianCvPercent: number;
  }
> = {
  '11': { description: 'Corporate managers and directors', jobsThousand: 2268, medianAnnualGbp: 57745, meanAnnualGbp: 79627, medianCvPercent: 1.1 },
  '21': { description: 'Science, research, engineering and technology professionals', jobsThousand: 1711, medianAnnualGbp: 51148, meanAnnualGbp: 57062, medianCvPercent: 1.0 },
  '22': { description: 'Health professionals', jobsThousand: 1816, medianAnnualGbp: 40294, meanAnnualGbp: 44761, medianCvPercent: 0.9 },
  '23': { description: 'Teaching and other educational professionals', jobsThousand: 1447, medianAnnualGbp: 43119, meanAnnualGbp: 42893, medianCvPercent: 0.9 },
  '24': { description: 'Business, media and public service professionals', jobsThousand: 2057, medianAnnualGbp: 46925, meanAnnualGbp: 55781, medianCvPercent: 1.0 },
  '35': { description: 'Business and public service associate professionals', jobsThousand: 1883, medianAnnualGbp: 38760, meanAnnualGbp: 47971, medianCvPercent: 1.0 },
};

const CANADA_JOB_BANK_NATIONAL_WAGE_VALUES: Record<
  string,
  {
    noc2021: string;
    title: string;
    lowHourlyCad: number;
    medianHourlyCad: number;
    highHourlyCad: number;
    annualWageFlag: boolean;
    dataSource: string;
    referencePeriod: string;
    jobbankWageSourceDate: string;
    wageComment?: string;
  }
> = {
  '21232': { noc2021: '21232', title: 'Software developers and programmers', lowHourlyCad: 30, medianHourlyCad: 48.08, highHourlyCad: 76.92, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21221': { noc2021: '21221', title: 'Business systems specialists', lowHourlyCad: 30.67, medianHourlyCad: 45.13, highHourlyCad: 62.5, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21220': { noc2021: '21220', title: 'Cybersecurity specialists', lowHourlyCad: 30, medianHourlyCad: 49.52, highHourlyCad: 72.12, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21234': { noc2021: '21234', title: 'Web developers and programmers', lowHourlyCad: 21.48, medianHourlyCad: 38.46, highHourlyCad: 57.16, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '31301': { noc2021: '31301', title: 'Registered nurses and registered psychiatric nurses', lowHourlyCad: 30, medianHourlyCad: 43.27, highHourlyCad: 54.37, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '11100': { noc2021: '11100', title: 'Financial auditors and accountants', lowHourlyCad: 25, medianHourlyCad: 40.36, highHourlyCad: 71.43, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '11101': { noc2021: '11101', title: 'Financial and investment analysts', lowHourlyCad: 28.21, medianHourlyCad: 43.27, highHourlyCad: 72.36, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '11200': { noc2021: '11200', title: 'Human resources professionals', lowHourlyCad: 26, medianHourlyCad: 40.87, highHourlyCad: 59.77, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '10022': { noc2021: '10022', title: 'Advertising, marketing and public relations managers', lowHourlyCad: 34.62, medianHourlyCad: 55.29, highHourlyCad: 89.74, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '41221': { noc2021: '41221', title: 'Elementary school and kindergarten teachers', lowHourlyCad: 26.67, medianHourlyCad: 43.27, highHourlyCad: 56.59, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '41220': { noc2021: '41220', title: 'Secondary school teachers', lowHourlyCad: 28.85, medianHourlyCad: 45.67, highHourlyCad: 59.76, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '41101': { noc2021: '41101', title: 'Lawyers and Quebec notaries', lowHourlyCad: 30.22, medianHourlyCad: 59.76, highHourlyCad: 107.14, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '42200': { noc2021: '42200', title: 'Paralegals and related occupations', lowHourlyCad: 21.63, medianHourlyCad: 33.05, highHourlyCad: 52.19, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21300': { noc2021: '21300', title: 'Civil engineers', lowHourlyCad: 32, medianHourlyCad: 48.56, highHourlyCad: 72.12, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21301': { noc2021: '21301', title: 'Mechanical engineers', lowHourlyCad: 30, medianHourlyCad: 45.67, highHourlyCad: 72.49, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21310': { noc2021: '21310', title: 'Electrical and electronics engineers', lowHourlyCad: 33.65, medianHourlyCad: 50.67, highHourlyCad: 79.23, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '21200': { noc2021: '21200', title: 'Architects', lowHourlyCad: 26.44, medianHourlyCad: 38.94, highHourlyCad: 74.52, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
  '31102': { noc2021: '31102', title: 'General practitioners and family physicians', lowHourlyCad: 90826, medianHourlyCad: 232227, highHourlyCad: 435240, annualWageFlag: true, dataSource: 'Canadian Institute for Health Information and Canadian Medical Association - custom tabulation', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19', wageComment: 'Wages are presented at an annual rate to better represent earnings for this occupation.' },
  '31110': { noc2021: '31110', title: 'Dentists', lowHourlyCad: 32867, medianHourlyCad: 110000, highHourlyCad: 228000, annualWageFlag: true, dataSource: '2021 Census', referencePeriod: '2021', jobbankWageSourceDate: '2025-11-19', wageComment: 'Large self-employed share; wages are presented at an annual rate to better represent earnings for this occupation.' },
  '31120': { noc2021: '31120', title: 'Pharmacists', lowHourlyCad: 40, medianHourlyCad: 55.49, highHourlyCad: 67, annualWageFlag: false, dataSource: 'Labour Force Survey', referencePeriod: '2023-2024', jobbankWageSourceDate: '2025-11-19' },
};

const AUSTRALIA_JSA_PARENT_LOCAL_VALUES: Record<
  string,
  {
    anzscoParent: string;
    title: string;
    employed: number;
    medianWeeklyAud: number;
    medianHourlyAud: number;
    annualEmploymentGrowth: number;
  }
> = {
  '2613': { anzscoParent: '2613', title: 'Software and Applications Programmers', employed: 203200, medianWeeklyAud: 2537, medianHourlyAud: 67, annualEmploymentGrowth: 13700 },
  '2611': { anzscoParent: '2611', title: 'ICT Business and Systems Analysts', employed: 51000, medianWeeklyAud: 2697, medianHourlyAud: 72, annualEmploymentGrowth: 800 },
  '2621': { anzscoParent: '2621', title: 'Database and Systems Administrators, and ICT Security Specialists', employed: 72600, medianWeeklyAud: 2461, medianHourlyAud: 66, annualEmploymentGrowth: 3300 },
  '2612': { anzscoParent: '2612', title: 'Multimedia Specialists and Web Developers', employed: 12400, medianWeeklyAud: 2476, medianHourlyAud: 66, annualEmploymentGrowth: -600 },
  '2544': { anzscoParent: '2544', title: 'Registered Nurses', employed: 366200, medianWeeklyAud: 2192, medianHourlyAud: 57, annualEmploymentGrowth: 12600 },
  '2211': { anzscoParent: '2211', title: 'Accountants', employed: 215500, medianWeeklyAud: 2003, medianHourlyAud: 53, annualEmploymentGrowth: 5800 },
  '2223': { anzscoParent: '2223', title: 'Financial Investment Advisers and Managers', employed: 63400, medianWeeklyAud: 2582, medianHourlyAud: 66, annualEmploymentGrowth: 900 },
  '2231': { anzscoParent: '2231', title: 'Human Resource Professionals', employed: 84700, medianWeeklyAud: 1970, medianHourlyAud: 53, annualEmploymentGrowth: -200 },
  '1311': { anzscoParent: '1311', title: 'Advertising, Public Relations and Sales Manager', employed: 167100, medianWeeklyAud: 2677, medianHourlyAud: 70, annualEmploymentGrowth: 2400 },
  '2412': { anzscoParent: '2412', title: 'Primary School Teachers', employed: 165900, medianWeeklyAud: 2226, medianHourlyAud: 60, annualEmploymentGrowth: 1600 },
  '2414': { anzscoParent: '2414', title: 'Secondary School Teachers', employed: 161400, medianWeeklyAud: 2322, medianHourlyAud: 64, annualEmploymentGrowth: 6400 },
  '2713': { anzscoParent: '2713', title: 'Solicitors', employed: 106100, medianWeeklyAud: 2070, medianHourlyAud: 56, annualEmploymentGrowth: 5400 },
  '5991': { anzscoParent: '5991', title: 'Conveyancers and Legal Executives', employed: 16800, medianWeeklyAud: 1575, medianHourlyAud: 42, annualEmploymentGrowth: -600 },
  '2332': { anzscoParent: '2332', title: 'Civil Engineering Professionals', employed: 76800, medianWeeklyAud: 2217, medianHourlyAud: 59, annualEmploymentGrowth: 1700 },
  '2335': { anzscoParent: '2335', title: 'Industrial, Mechanical and Production Engineers', employed: 42500, medianWeeklyAud: 2614, medianHourlyAud: 67, annualEmploymentGrowth: 1300 },
  '2333': { anzscoParent: '2333', title: 'Electrical Engineers', employed: 33100, medianWeeklyAud: 2553, medianHourlyAud: 67, annualEmploymentGrowth: 2100 },
  '2321': { anzscoParent: '2321', title: 'Architects and Landscape Architects', employed: 35800, medianWeeklyAud: 2308, medianHourlyAud: 61, annualEmploymentGrowth: 1000 },
  '2531': { anzscoParent: '2531', title: 'General Practitioners and Resident Medical Officers', employed: 97300, medianWeeklyAud: 2446, medianHourlyAud: 60, annualEmploymentGrowth: 7000 },
  '2523': { anzscoParent: '2523', title: 'Dental Practitioners', employed: 25800, medianWeeklyAud: 3232, medianHourlyAud: 85, annualEmploymentGrowth: 2300 },
  '2515': { anzscoParent: '2515', title: 'Pharmacists', employed: 46300, medianWeeklyAud: 1956, medianHourlyAud: 52, annualEmploymentGrowth: 2900 },
};

export const REGIONAL_WAGE_OUTLOOK_FALLBACKS: Record<
  Exclude<GlobalEnglishRegion, 'US'>,
  RegionalWageOutlookFallback
> = {
  UK: {
    status: 'unavailable_source_join_pending',
    wageLabel: 'UK wage unavailable',
    outlookLabel: 'UK outlook unavailable',
    reason: 'ONS ASHE Table 2 is registered, but source-dated rows have not been joined to this occupation in the app.',
    displayBoundary: 'Show U.S.-basis values only with disclosure until an ASHE edition, quality flag, and SOC join are attached.',
  },
  CA: {
    status: 'unavailable_source_join_pending',
    wageLabel: 'Canada wage unavailable',
    outlookLabel: 'Canada outlook unavailable',
    reason: 'Job Bank wage and 3-year outlook methods are registered, but NOC/geography rows have not been joined to this occupation.',
    displayBoundary: 'Show unavailable or undetermined status rather than imputing Canada wages or outlooks from U.S. values.',
  },
  AU: {
    status: 'suppressed_or_quality_limited',
    wageLabel: 'Australia wage unavailable',
    outlookLabel: 'Australia outlook unavailable',
    reason: 'JSA occupation profiles and ABS OSCA 2024 are registered, but the current app has no source row proving the classification basis for this occupation.',
    displayBoundary: 'Show ANZSCO/OSCA transition context and do not infer Australian wage or outlook values from U.S. or stale ANZSCO rows.',
  },
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

export function getAustraliaOscaTransitionMapping(socCode: string): RegionalOccupationMapping | undefined {
  const crosswalk = resolveGlobalEnglishCrosswalk(socCode);
  if (!crosswalk) return undefined;
  return crosswalk.osca2024 ?? {
    code: 'OSCA review pending',
    title: `${crosswalk.title} requires OSCA 2024 transition review before Australian local values display`,
    sourceId: 'abs-osca-2024',
    quality: 'manual_review_required',
  };
}

export function getRegionalWageOutlookAdapter(
  region: GlobalEnglishRegion,
): RegionalWageOutlookAdapter | undefined {
  if (region === 'US') return undefined;
  return REGIONAL_WAGE_OUTLOOK_ADAPTERS[region];
}

export function getRegionalLocalizedLaborMarketValue(
  socCode: string,
  region: GlobalEnglishRegion,
): RegionalLocalizedLaborMarketValue | undefined {
  const crosswalk = resolveGlobalEnglishCrosswalk(socCode);
  if (!crosswalk || region === 'US') return undefined;

  if (region === 'UK') {
    const soc2 = crosswalk.ukSoc2020.code.slice(0, 2);
    const row = UK_ASHE_SOC_2_DIGIT_LOCAL_VALUES[soc2];
    if (!row) return undefined;
    return {
      region,
      classificationCode: soc2,
      classificationTitle: row.description,
      classificationLevel: 'UK SOC 2020 two-digit group joined from mapped four-digit occupation',
      wage: {
        label: `Median annual gross pay GBP ${row.medianAnnualGbp.toLocaleString('en-GB')}`,
        currency: 'GBP',
        unit: 'annual',
        median: row.medianAnnualGbp,
        mean: row.meanAnnualGbp,
        sourcePeriod: '2025 provisional',
        sourceDate: '2025-12-19',
        sourceIds: ['ons-ashe-2025-provisional-table-2'],
        sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['ons-ashe-2025-provisional-table-2'].url,
        suppressionState: 'published_parent_group_value',
        qualityNote: `ASHE Table 2.7a/2.7b, all employees, UK. Two-digit group value; median coefficient of variation ${row.medianCvPercent}%.`,
      },
      outlook: {
        label: 'UK outlook not published by ASHE Table 2',
        sourcePeriod: '2025 provisional',
        sourceDate: '2025-12-19',
        sourceIds: ['ons-ashe-2025-provisional-table-2'],
        sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['ons-ashe-2025-provisional-table-2'].url,
        suppressionState: 'not_published_by_source',
        qualityNote: 'ONS ASHE Table 2 is an earnings source and does not publish an occupation outlook rating.',
      },
      sourceDate: '2025-12-19',
      sourceIds: ['ons-soc-2020', 'ons-ashe-2025-provisional-table-2'],
      displayBoundary: 'UK pay is shown at SOC two-digit group level only; do not present it as a four-digit occupation-specific wage.',
    };
  }

  if (region === 'CA') {
    const row = CANADA_JOB_BANK_NATIONAL_WAGE_VALUES[crosswalk.noc2021.code];
    if (!row) return undefined;
    const wageUnit = row.annualWageFlag ? 'annual' : 'hourly';
    const wageLabel = row.annualWageFlag
      ? `Median annual wage CAD ${row.medianHourlyCad.toLocaleString('en-CA')}`
      : `Median hourly wage CAD ${row.medianHourlyCad.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return {
      region,
      classificationCode: row.noc2021,
      classificationTitle: row.title,
      classificationLevel: 'Canada NOC 2021 national wage row',
      wage: {
        label: wageLabel,
        currency: 'CAD',
        unit: wageUnit,
        low: row.lowHourlyCad,
        median: row.medianHourlyCad,
        high: row.highHourlyCad,
        sourcePeriod: row.referencePeriod,
        sourceDate: row.jobbankWageSourceDate,
        sourceIds: ['jobbank-wage-open-data-2025'],
        sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['jobbank-wage-open-data-2025'].url,
        suppressionState: 'published',
        qualityNote: `${row.dataSource}. ${row.wageComment ?? 'National low, median, and high wage row preserved from Job Bank open data.'}`,
      },
      outlook: {
        label: 'Canada outlook requires province or economic-region selection',
        sourcePeriod: '2025-2027',
        sourceDate: '2025-12-15',
        sourceIds: ['jobbank-outlook-open-data-2025-2027'],
        sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['jobbank-outlook-open-data-2025-2027'].url,
        suppressionState: 'geography_required',
        qualityNote: 'Job Bank outlooks are published by province, territory, and economic region; no national rating is inferred.',
      },
      sourceDate: row.jobbankWageSourceDate,
      sourceIds: ['statcan-noc-2021', 'jobbank-wage-open-data-2025', 'jobbank-outlook-open-data-2025-2027'],
      displayBoundary: 'Canada wage values are national rows; outlook remains geography-required until the user selects a province, territory, or economic region.',
    };
  }

  const parentCode = crosswalk.anzsco2022.code.slice(0, 4);
  const row = AUSTRALIA_JSA_PARENT_LOCAL_VALUES[parentCode];
  if (!row) return undefined;
  return {
    region,
    classificationCode: row.anzscoParent,
    classificationTitle: row.title,
    classificationLevel: 'Australia ANZSCO 4-digit parent group with OSCA transition boundary',
    wage: {
      label: `Median weekly full-time earnings AUD ${row.medianWeeklyAud.toLocaleString('en-AU')}`,
      currency: 'AUD',
      unit: 'weekly',
      median: row.medianWeeklyAud,
      sourcePeriod: 'February 2026 occupation profiles',
      sourceDate: '2026-04-02',
      sourceIds: ['jsa-occupation-profiles-february-2026'],
      sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['jsa-occupation-profiles-february-2026'].url,
      suppressionState: 'published_parent_group_value',
      qualityNote: `JSA Table 1/Table 4 ANZSCO parent value; median hourly earnings AUD ${row.medianHourlyAud}.`,
    },
    outlook: {
      label: `Annual employment growth ${row.annualEmploymentGrowth.toLocaleString('en-AU')}`,
      value: row.annualEmploymentGrowth,
      unit: 'jobs',
      sourcePeriod: 'February 2026 occupation profiles',
      sourceDate: '2026-04-02',
      sourceIds: ['jsa-occupation-profiles-february-2026', 'abs-osca-2024'],
      sourceUrl: GLOBAL_ENGLISH_OFFICIAL_SOURCES['jsa-occupation-profiles-february-2026'].url,
      suppressionState: 'published_parent_group_value',
      qualityNote: 'ANZSCO-based profile remains available but will no longer receive updates; OSCA-based profiles are the forward source boundary.',
    },
    sourceDate: '2026-04-02',
    sourceIds: ['abs-anzsco-2022', 'abs-osca-2024', 'jsa-occupation-profiles-february-2026'],
    displayBoundary: 'Australia values are ANZSCO 4-digit parent-group rows and must carry the OSCA 2024 transition note.',
  };
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
  const adapter = getRegionalWageOutlookAdapter(region);
  const sourceIds = REGION_CLASSIFICATION_SOURCE_IDS[region];
  const localLabel = REGION_LABELS[region];
  const localValue = getRegionalLocalizedLaborMarketValue(socCode, region);
  const fallbackStatus = REGIONAL_WAGE_OUTLOOK_FALLBACKS[region];
  const localValueStatus: RegionalWageOutlookFallback = localValue
    ? {
      status: 'localized_value_available',
      wageLabel: localValue.wage.label,
      outlookLabel: localValue.outlook.label,
      reason: `${localValue.classificationLevel}; ${localValue.displayBoundary}`,
      displayBoundary: localValue.displayBoundary,
    }
    : fallbackStatus;
  const oscaText = region === 'AU'
    ? ' OSCA 2024 is treated as the forward Australian classification boundary; ANZSCO rows remain transition context only.'
    : '';
  const mappingText = classification
    ? `A ${localLabel} classification mapping is available as ${classification.code} (${classification.title}).`
    : `No reviewed ${localLabel} classification mapping is available for this O*NET occupation yet.`;
  const adapterText = adapter
    ? localValue
      ? `${adapter.label} has a source-dated local value row for this mapped occupation.`
      : `${adapter.label} is registered, but local wage/outlook rows are not joined yet.`
    : `No ${localLabel} wage/outlook adapter is registered yet.`;

  return {
    region,
    shouldShow: true,
    heading: `${localLabel} labor-market basis`,
    message: `${mappingText} ${adapterText}${oscaText} APO exposure estimates remain U.S. O*NET/BLS basis; regional rows provide classification, wage, or outlook context only. Current local value status: ${localValueStatus.wageLabel}; ${localValueStatus.outlookLabel}. ${localValue ? localValue.displayBoundary : 'Wage and outlook figures shown in this dashboard remain U.S. O*NET/BLS basis until source-dated local values pass adapter validation.'}`,
    classification,
    wageStatus: localValue ? 'localized_value_available' : adapter?.valueStatus ?? 'not_integrated_disclosure_required',
    adapter,
    localValueStatus,
    localValue,
    sourceIds: Array.from(new Set([...sourceIds, ...(localValue?.sourceIds ?? [])])),
  };
}

export function getOfficialSources(sourceIds: string[]): OfficialSource[] {
  return sourceIds
    .map((sourceId) => GLOBAL_ENGLISH_OFFICIAL_SOURCES[sourceId])
    .filter((source): source is OfficialSource => Boolean(source));
}
