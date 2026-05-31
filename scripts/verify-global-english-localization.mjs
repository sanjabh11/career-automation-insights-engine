#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src/lib/globalEnglishLocalization.ts');
const analysisPath = path.join(root, 'src/components/OccupationAnalysis.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const analysis = fs.readFileSync(analysisPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(pattern) {
  return [...source.matchAll(pattern)].length;
}

const socCount = count(/soc: '\d{2}-\d{4}\.00'/g);
const escoCount = count(/esco: \{ searchTerm: '[^']+', sourceId: 'esco-api'/g);
const ukCount = count(/ukSoc2020: \{ code: '[^']+'/g);
const caCount = count(/noc2021: \{ code: '[^']+'/g);
const auCount = count(/anzsco2022: \{ code: '[^']+'/g);
const adapterCount = count(/valueStatus: 'source_registered_adapter_pending',/g);

assert(source.includes("GLOBAL_ENGLISH_SOURCE_DATE = '2026-05-31'"), 'global-English source date must be explicit');
assert(source.includes('https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-api'), 'ESCO API source is required');
assert(source.includes('https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2'), 'ONS ASHE source is required');
assert(source.includes('https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1'), 'Statistics Canada NOC source is required');
assert(source.includes('https://www.jobbank.gc.ca/trend-analysis/search-wages/wage-methodology'), 'Canada Job Bank wage methodology source is required');
assert(source.includes('https://www.jobbank.gc.ca/trend-analysis/search-job-outlooks/outlooks-methodology'), 'Canada Job Bank outlook methodology source is required');
assert(source.includes('https://www.abs.gov.au/statistics/classifications/anzsco-australian-and-new-zealand-standard-classification-occupations/2022'), 'ABS ANZSCO source is required');
assert(source.includes('https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations'), 'JSA occupation profiles source is required');
assert(socCount >= 20, `expected at least 20 sample O*NET occupations, found ${socCount}`);
assert(escoCount >= 20, `expected at least 20 ESCO bridge rows, found ${escoCount}`);
assert(ukCount >= 20, `expected at least 20 UK SOC sample mappings, found ${ukCount}`);
assert(caCount >= 20, `expected at least 20 Canada NOC sample mappings, found ${caCount}`);
assert(auCount >= 20, `expected at least 20 Australia ANZSCO sample mappings, found ${auCount}`);
assert(adapterCount >= 3, `expected at least 3 regional wage/outlook adapters, found ${adapterCount}`);
assert(source.includes('REGIONAL_WAGE_OUTLOOK_ADAPTERS'), 'regional wage/outlook adapter registry is required');
assert(source.includes("wageStatus: adapter?.valueStatus ?? 'not_integrated_disclosure_required'"), 'non-US wage/outlook status must expose adapter pending state until localized values are joined');
assert(source.includes('suppressionBoundary'), 'regional adapters must preserve suppression and quality boundaries');
assert(source.includes('releaseMetadataRequired'), 'regional adapters must require release metadata before local values display');
assert(source.includes('OSCA transition notes'), 'Australia adapter must preserve the ANZSCO-to-OSCA transition boundary');
assert(analysis.includes('Regional labor-market disclosure'), 'OccupationAnalysis must render a regional labor-market disclosure note');
assert(analysis.includes('getRegionalLaborMarketDisclosure'), 'OccupationAnalysis must use the global-English disclosure helper');
assert(analysis.includes('Adapter:'), 'OccupationAnalysis must show regional adapter status');
assert(analysis.includes('Join requirement:'), 'OccupationAnalysis must show regional adapter join requirements');

console.log(JSON.stringify({
  ok: true,
  sourceDate: '2026-05-31',
  sampleOccupations: socCount,
  escoBridgeRows: escoCount,
  ukMappings: ukCount,
  caMappings: caCount,
  auMappings: auCount,
  wageOutlookAdapters: adapterCount,
  wageOutlookStatus: 'non-US displayed as U.S.-basis with source-registered local adapters pending validated joins',
}, null, 2));
