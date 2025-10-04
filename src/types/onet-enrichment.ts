/**
 * O*NET Enrichment Type Definitions
 * 
 * Types for Bright Outlook, Employment Data, Career Clusters,
 * Job Zones, and Related Occupations
 */

export interface OnetEnrichmentData {
  id?: string;
  occupation_code: string;
  occupation_title: string;
  
  // Bright Outlook
  bright_outlook: boolean;
  bright_outlook_category?: 'Rapid Growth' | 'Numerous Openings' | 'New & Emerging' | string;
  
  // Employment & Outlook
  employment_current?: number;
  employment_projected?: number;
  employment_change_number?: number;
  employment_change_percent?: number;
  job_openings_annual?: number;
  growth_rate?: string;
  outlook_category?: 'Bright' | 'Good' | 'Fair' | 'Limited' | string;
  
  // Wages
  median_wage_annual?: number;
  median_wage_hourly?: number;
  wage_range_low?: number;
  wage_range_high?: number;
  
  // Education & Experience
  education_level?: string;
  experience_required?: string;
  on_job_training?: string;
  
  // Classification
  career_cluster?: string;
  career_cluster_id?: string;
  job_zone?: 1 | 2 | 3 | 4 | 5;
  job_zone_description?: string;
  is_stem?: boolean;
  is_green?: boolean;
  is_apprenticeship?: boolean;
  
  // Cache metadata
  data_source?: string;
  last_updated?: string;
  cache_expires_at?: string;
  fetch_error?: string;
  created_at?: string;
  
  // Additional data from API response
  relatedOccupations?: RelatedOccupation[];
  cached?: boolean;
  fetchedAt?: string;
  apoScore?: number;
}

export interface RelatedOccupation {
  code: string;
  title: string;
  similarity_score?: number;
  relationship_type?: 'similar' | 'related' | 'alternate';
}

export interface CareerCluster {
  id?: string;
  cluster_id: string;
  cluster_name: string;
  description?: string;
  icon_name?: string;
  sort_order?: number;
  occupationCount?: number;
  created_at?: string;
}

export interface JobZone {
  id?: string;
  zone_number: 1 | 2 | 3 | 4 | 5;
  zone_name: string;
  education?: string;
  experience?: string;
  training?: string;
  examples?: string;
  occupationCount?: number;
  created_at?: string;
}

export interface SearchFilters {
  brightOutlook?: boolean;
  stem?: boolean;
  green?: boolean;
  careerCluster?: string;
  jobZone?: 1 | 2 | 3 | 4 | 5;
  minWage?: number;
  maxWage?: number;
}

export interface SearchOccupationsRequest {
  keyword?: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchOccupationsResponse {
  occupations: OnetEnrichmentData[];
  total: number;
  limit: number;
  offset: number;
  filters: SearchFilters;
  hasMore: boolean;
}

export interface BrowseCareerClustersResponse {
  clusters: CareerCluster[];
  totalClusters: number;
}

export interface BrowseCareerClusterResponse {
  cluster: CareerCluster;
  occupations: OnetEnrichmentData[];
  occupationCount: number;
}

export interface BrowseJobZonesResponse {
  zones: JobZone[];
  totalZones: number;
}

export interface BrowseJobZoneResponse {
  zone: JobZone;
  occupations: OnetEnrichmentData[];
  occupationCount: number;
}

/**
 * Helper type guards
 */
export function isBrightOutlook(data: OnetEnrichmentData): boolean {
  return data.bright_outlook === true;
}

export function isStem(data: OnetEnrichmentData): boolean {
  return data.is_stem === true;
}

export function isGreen(data: OnetEnrichmentData): boolean {
  return data.is_green === true;
}

export function hasGoodOutlook(data: OnetEnrichmentData): boolean {
  return data.bright_outlook || 
         (data.growth_rate?.toLowerCase().includes('faster than average') ?? false) ||
         (data.outlook_category === 'Bright' || data.outlook_category === 'Good');
}

/**
 * Formatting helpers
 */
export function formatWage(wage?: number): string {
  if (!wage) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(wage);
}

export function formatEmploymentChange(percent?: number): string {
  if (percent === undefined || percent === null) return 'N/A';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

export function getJobZoneName(zone?: number): string {
  const zoneNames: Record<number, string> = {
    1: 'Little or No Preparation',
    2: 'Some Preparation',
    3: 'Medium Preparation',
    4: 'Considerable Preparation',
    5: 'Extensive Preparation',
  };
  return zone ? zoneNames[zone] || 'Unknown' : 'Unknown';
}

export function getBrightOutlookBadgeColor(category?: string): string {
  const colors: Record<string, string> = {
    'Rapid Growth': 'bg-green-100 text-green-800 border-green-300',
    'Numerous Openings': 'bg-blue-100 text-blue-800 border-blue-300',
    'New & Emerging': 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return category ? colors[category] || 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-800 border-gray-300';
}

export function getOutlookCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    'Bright': 'text-green-600',
    'Good': 'text-blue-600',
    'Fair': 'text-yellow-600',
    'Limited': 'text-red-600',
  };
  return category ? colors[category] || 'text-gray-600' : 'text-gray-600';
}
