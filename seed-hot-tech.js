// Apply hot technologies seed via Supabase client
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const serviceRoleKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const technologies = [
  { technology_name: 'Excel', category: 'Analytics', description: 'Spreadsheet analysis and reporting', related_occupations_count: 0, trending_score: 0.70 },
  { technology_name: 'Python', category: 'Programming', description: 'General-purpose programming language', related_occupations_count: 0, trending_score: 0.85 },
  { technology_name: 'Salesforce', category: 'CRM', description: 'Customer relationship management platform', related_occupations_count: 0, trending_score: 0.65 },
  { technology_name: 'AWS', category: 'Cloud', description: 'Amazon Web Services cloud platform', related_occupations_count: 0, trending_score: 0.80 },
  { technology_name: 'Tableau', category: 'BI', description: 'Business intelligence and data visualization', related_occupations_count: 0, trending_score: 0.68 },
  { technology_name: 'React', category: 'Frontend', description: 'JavaScript library for building UIs', related_occupations_count: 0, trending_score: 0.72 },
];

async function seedTechnologies() {
  console.log('Seeding hot technologies...');
  
  for (const tech of technologies) {
    const { data, error } = await supabase
      .from('onet_hot_technologies_master')
      .upsert(tech, { onConflict: 'technology_name', ignoreDuplicates: true });
    
    if (error) {
      console.error(`Error seeding ${tech.technology_name}:`, error.message);
    } else {
      console.log(`✓ Seeded ${tech.technology_name}`);
    }
  }
  
  console.log('\nSeed complete!');
}

seedTechnologies().catch(console.error);
