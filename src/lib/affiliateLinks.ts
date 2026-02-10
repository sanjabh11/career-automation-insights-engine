/**
 * Affiliate Course Links
 * 
 * Maps skill keywords to Coursera/Udemy course URLs with UTM tracking.
 * Revenue: ~$10-$50 per conversion via affiliate programs.
 * 
 * To activate: Sign up for Coursera Affiliate (Impact) and Udemy Affiliate (Rakuten).
 * Replace placeholder affiliate IDs below with real ones.
 */

const AFFILIATE_ID_COURSERA = 'automationinsights'; // TODO: Replace with real Coursera affiliate ID
const AFFILIATE_ID_UDEMY = 'automationinsights';    // TODO: Replace with real Udemy affiliate ID

const UTM_PARAMS = 'utm_source=automationinsights&utm_medium=referral&utm_campaign=reskilling';

interface CourseLink {
  title: string;
  provider: 'coursera' | 'udemy' | 'other';
  url: string;
  estimatedTime: string;
}

/**
 * Skill-to-course mapping. Keys are lowercase skill keywords.
 * Returns the best course match for a given skill.
 */
const SKILL_COURSE_MAP: Record<string, CourseLink> = {
  // Programming & Data
  'python': {
    title: 'Python for Everybody Specialization',
    provider: 'coursera',
    url: `https://www.coursera.org/specializations/python?${UTM_PARAMS}`,
    estimatedTime: '8 months',
  },
  'data analytics': {
    title: 'Google Data Analytics Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-data-analytics?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },
  'data analysis': {
    title: 'Google Data Analytics Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-data-analytics?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },
  'machine learning': {
    title: 'Machine Learning Specialization',
    provider: 'coursera',
    url: `https://www.coursera.org/specializations/machine-learning-introduction?${UTM_PARAMS}`,
    estimatedTime: '3 months',
  },
  'sql': {
    title: 'SQL for Data Science',
    provider: 'coursera',
    url: `https://www.coursera.org/learn/sql-for-data-science?${UTM_PARAMS}`,
    estimatedTime: '4 weeks',
  },
  'database administration': {
    title: 'Meta Database Engineer Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/meta-database-engineer?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },

  // Cloud & DevOps
  'cloud computing': {
    title: 'Google Cloud Digital Leader Training',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-cloud-digital-leader-training?${UTM_PARAMS}`,
    estimatedTime: '2 months',
  },
  'aws': {
    title: 'AWS Cloud Practitioner Essentials',
    provider: 'coursera',
    url: `https://www.coursera.org/learn/aws-cloud-practitioner-essentials?${UTM_PARAMS}`,
    estimatedTime: '4 weeks',
  },

  // Project Management & Business
  'project management': {
    title: 'Google Project Management Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-project-management?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },
  'pmp': {
    title: 'Google Project Management Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-project-management?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },
  'business analysis': {
    title: 'Business Analysis & Process Management',
    provider: 'coursera',
    url: `https://www.coursera.org/specializations/business-analysis-process-management?${UTM_PARAMS}`,
    estimatedTime: '4 months',
  },

  // AI & Automation
  'prompt engineering': {
    title: 'Prompt Engineering for ChatGPT',
    provider: 'coursera',
    url: `https://www.coursera.org/learn/prompt-engineering?${UTM_PARAMS}`,
    estimatedTime: '3 weeks',
  },
  'ai': {
    title: 'AI For Everyone',
    provider: 'coursera',
    url: `https://www.coursera.org/learn/ai-for-everyone?${UTM_PARAMS}`,
    estimatedTime: '4 weeks',
  },
  'rpa': {
    title: 'Robotic Process Automation (RPA)',
    provider: 'udemy',
    url: `https://www.udemy.com/course/robotic-process-automation/?${UTM_PARAMS}`,
    estimatedTime: '6 weeks',
  },

  // Design & UX
  'ux design': {
    title: 'Google UX Design Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-ux-design?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },

  // Cybersecurity
  'cybersecurity': {
    title: 'Google Cybersecurity Professional Certificate',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-cybersecurity?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },

  // Digital Marketing
  'digital marketing': {
    title: 'Google Digital Marketing & E-commerce',
    provider: 'coursera',
    url: `https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce?${UTM_PARAMS}`,
    estimatedTime: '6 months',
  },
};

/**
 * Find a matching course link for a given skill string.
 * Performs fuzzy matching by checking if any map key is contained in the skill.
 */
export function getCourseLink(skill: string): CourseLink | null {
  const lower = skill.toLowerCase().trim();

  // Exact match first
  if (SKILL_COURSE_MAP[lower]) return SKILL_COURSE_MAP[lower];

  // Partial match — check if any key is contained in the skill string
  for (const [key, course] of Object.entries(SKILL_COURSE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return course;
    }
  }

  return null;
}

/**
 * Generate a generic Coursera search URL for skills without a direct mapping.
 */
export function getGenericCourseSearchUrl(skill: string): string {
  return `https://www.coursera.org/search?query=${encodeURIComponent(skill)}&${UTM_PARAMS}`;
}
