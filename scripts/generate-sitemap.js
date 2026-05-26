#!/usr/bin/env node
/**
 * Generate sitemap.xml for SEO landing pages
 * Run: node scripts/generate-sitemap.js
 * Output: public/sitemap.xml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.SITE_URL || 'https://automationinsights.app';
const TODAY = new Date().toISOString().split('T')[0];

// All 50 SEO occupation slugs from occupationRiskData.ts
const occupationSlugs = [
  'data-entry-clerk', 'telemarketer', 'bookkeeper', 'cashier', 'bank-teller',
  'insurance-underwriter', 'tax-preparer', 'paralegal', 'proofreader',
  'medical-transcriptionist', 'file-clerk', 'mail-sorter', 'loan-officer',
  'credit-analyst', 'payroll-clerk', 'accountant', 'financial-analyst',
  'market-research-analyst', 'technical-writer', 'web-developer',
  'computer-programmer', 'radiologic-technologist', 'pharmacy-technician',
  'medical-coder', 'supply-chain-analyst', 'hr-specialist', 'real-estate-agent',
  'insurance-agent', 'customer-service-rep', 'graphic-designer',
  'executive-assistant', 'project-manager', 'marketing-manager',
  'registered-nurse', 'physical-therapist', 'occupational-therapist',
  'social-worker', 'teacher', 'psychologist', 'physician', 'surgeon',
  'dentist', 'veterinarian', 'software-engineer', 'cybersecurity-analyst',
  'ux-designer', 'product-manager', 'management-consultant', 'lawyer',
  'data-scientist'
];

// Static pages with priorities
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/for-coaches', priority: '0.9', changefreq: 'monthly' },
  { path: '/ai-impact-planner', priority: '0.8', changefreq: 'weekly' },
  { path: '/veterans', priority: '0.8', changefreq: 'monthly' },
  { path: '/browse/bright-outlook', priority: '0.7', changefreq: 'weekly' },
  { path: '/browse/stem', priority: '0.7', changefreq: 'weekly' },
  { path: '/browse/job-zones', priority: '0.7', changefreq: 'weekly' },
  { path: '/tech-skills', priority: '0.7', changefreq: 'weekly' },
  { path: '/skills-builder', priority: '0.7', changefreq: 'monthly' },
  { path: '/help', priority: '0.5', changefreq: 'monthly' },
  { path: '/responsible-ai', priority: '0.5', changefreq: 'monthly' },
  { path: '/trust-center', priority: '0.6', changefreq: 'monthly' },
  { path: '/validation/methods', priority: '0.5', changefreq: 'monthly' },
  { path: '/quality', priority: '0.5', changefreq: 'monthly' },
];

function generateSitemap() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // SEO occupation landing pages (high priority for search)
  for (const slug of occupationSlugs) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/automation-risk/${slug}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += '</urlset>\n';

  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`✅ Sitemap generated: ${outputPath} (${staticPages.length + occupationSlugs.length} URLs)`);
}

generateSitemap();
