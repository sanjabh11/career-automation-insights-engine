export type OccupationTemplate = {
  code: string;
  title: string;
  typicalSkills: Array<{ name: string; proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'; acquisitionYear?: number }>;
  portfolio: Array<{ category: string; percent: number }>;
};

export const occupationDefaults: Record<string, OccupationTemplate> = {
  "15-1252": {
    code: "15-1252",
    title: "Software Developers",
    typicalSkills: [
      { name: "JavaScript", proficiency: "Advanced", acquisitionYear: 2020 },
      { name: "TypeScript", proficiency: "Advanced", acquisitionYear: 2021 },
      { name: "React", proficiency: "Advanced", acquisitionYear: 2021 },
      { name: "Node.js", proficiency: "Intermediate", acquisitionYear: 2019 },
      { name: "SQL", proficiency: "Intermediate", acquisitionYear: 2018 },
    ],
    portfolio: [
      { category: "Web", percent: 40 },
      { category: "Backend", percent: 30 },
      { category: "Cloud/DevOps", percent: 15 },
      { category: "Data/ML", percent: 15 },
    ],
  },
  "11-2021": {
    code: "11-2021",
    title: "Marketing Managers",
    typicalSkills: [
      { name: "Digital Marketing", proficiency: "Expert", acquisitionYear: 2020 },
      { name: "Content Strategy", proficiency: "Advanced", acquisitionYear: 2019 },
      { name: "SEO", proficiency: "Advanced", acquisitionYear: 2020 },
      { name: "Data Analytics", proficiency: "Intermediate", acquisitionYear: 2022 },
      { name: "Project Management", proficiency: "Expert", acquisitionYear: 2018 },
    ],
    portfolio: [
      { category: "Marketing", percent: 60 },
      { category: "Business", percent: 25 },
      { category: "Data", percent: 15 },
    ],
  },
  "13-1111": {
    code: "13-1111",
    title: "Management Analysts",
    typicalSkills: [
      { name: "Business Analysis", proficiency: "Advanced", acquisitionYear: 2019 },
      { name: "Excel/Sheets", proficiency: "Advanced", acquisitionYear: 2018 },
      { name: "SQL", proficiency: "Intermediate", acquisitionYear: 2021 },
      { name: "Data Visualization", proficiency: "Intermediate", acquisitionYear: 2021 },
      { name: "Stakeholder Management", proficiency: "Advanced", acquisitionYear: 2019 },
    ],
    portfolio: [
      { category: "Business", percent: 50 },
      { category: "Data", percent: 30 },
      { category: "Ops", percent: 20 },
    ],
  },
  "15-2051": {
    code: "15-2051",
    title: "Data Scientists",
    typicalSkills: [
      { name: "Python", proficiency: "Advanced", acquisitionYear: 2020 },
      { name: "SQL", proficiency: "Advanced", acquisitionYear: 2019 },
      { name: "Statistics", proficiency: "Advanced", acquisitionYear: 2019 },
      { name: "Machine Learning", proficiency: "Intermediate", acquisitionYear: 2021 },
      { name: "Data Visualization", proficiency: "Advanced", acquisitionYear: 2021 },
    ],
    portfolio: [
      { category: "ML/AI", percent: 40 },
      { category: "Data", percent: 40 },
      { category: "Domain", percent: 20 },
    ],
  },
  "29-1141": {
    code: "29-1141",
    title: "Registered Nurses",
    typicalSkills: [
      { name: "Clinical Procedures", proficiency: "Advanced", acquisitionYear: 2018 },
      { name: "Patient Care", proficiency: "Expert", acquisitionYear: 2017 },
      { name: "Healthcare IT", proficiency: "Intermediate", acquisitionYear: 2021 },
      { name: "Medication Management", proficiency: "Advanced", acquisitionYear: 2019 },
      { name: "Documentation", proficiency: "Advanced", acquisitionYear: 2018 },
    ],
    portfolio: [
      { category: "Clinical", percent: 60 },
      { category: "Ops/IT", percent: 20 },
      { category: "Admin", percent: 20 },
    ],
  },
};

export function getDefaultsByCode(code: string) {
  const six = code?.match(/^(\d{2}-\d{4})/)?.[1];
  if (occupationDefaults[code]) return occupationDefaults[code];
  if (six && occupationDefaults[six]) return occupationDefaults[six];
  return undefined;
}
