#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const withGithubApi = shouldWrite || args.includes('--with-github-api');
const approvedGithubDescription =
  'Decision-support APO dashboard for career automation exposure, proof-pack review, CI regression gates, and source-labeled workforce data pipelines.';
const repoSlug = 'sanjabh11/career-automation-insights-engine';
const repoApiUrl = `https://api.github.com/repos/${repoSlug}`;
const auditJsonPath = 'docs/commercialization/github-repo-presentation-latest.json';
const auditMarkdownPath = 'docs/commercialization/github-repo-presentation-latest.md';

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function getArgValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1];
  }
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  return prefixed ? prefixed.slice(name.length + 1) : fallback;
}

function getCurrentBranch() {
  const envBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (envBranch) {
    return envBranch;
  }

  const headPath = path.join(root, '.git', 'HEAD');
  try {
    const head = fs.readFileSync(headPath, 'utf8').trim();
    const match = head.match(/^ref: refs\/heads\/(.+)$/);
    return match?.[1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function fetchGitHubJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'apo-dashboard-repo-presentation-verifier',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  const body = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { message: body.slice(0, 200) };
  }

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}) for ${url}: ${parsed?.message || 'unknown error'}`);
  }

  return parsed;
}

function renderAuditMarkdown(audit) {
  const rows = [
    [
      'Repository description',
      audit.github.descriptionMatches ? 'pass' : 'fail',
      audit.github.description || 'missing',
      'Use as scope framing, not adoption proof.',
    ],
    [
      'License visibility',
      audit.github.licenseStatus,
      audit.github.defaultBranchLicense || 'null',
      audit.github.branchLicensePresent
        ? 'MIT license file is present on the checked branch; GitHub default-branch API visibility updates after merge.'
        : 'MIT license file was not visible on the checked branch.',
    ],
    [
      'Stars',
      'not_adoption_evidence',
      String(audit.github.stargazersCount),
      'Do not cite stars as maturity, popularity, or traction proof.',
    ],
    [
      'Reviewer framing',
      audit.local.maintainerBurdenCopy ? 'pass' : 'fail',
      'PR review, CI triage, regression tests, and data-pipeline maintenance',
      'Keep application copy operational and maintainer-burden oriented.',
    ],
  ];

  return `# GitHub Repo Presentation Audit

As of ${audit.checkedAt}, this audit records repository-presentation evidence for ${audit.repository}.

API source: ${audit.github.repoApiUrl}
Checked branch: \`${audit.branch}\`

| Area | Status | Evidence | Boundary |
| --- | --- | --- | --- |
${rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}

This artifact does not prove adoption, commercial traction, external scientific validation, or reviewer acceptance. It only records repository metadata and wording boundaries that can be checked before the next PR commit.
`;
}

function writeAuditArtifacts(audit) {
  const jsonTarget = path.join(root, auditJsonPath);
  const markdownTarget = path.join(root, auditMarkdownPath);
  fs.mkdirSync(path.dirname(jsonTarget), { recursive: true });
  fs.writeFileSync(jsonTarget, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(markdownTarget, renderAuditMarkdown(audit));
}

const checks = [
  {
    id: 'mit-license-file',
    file: 'LICENSE',
    test: (source) => /MIT License/.test(source) && /Permission is hereby granted/.test(source),
  },
  {
    id: 'package-license-metadata',
    file: 'package.json',
    test: (source) => JSON.parse(source).license === 'MIT',
  },
  {
    id: 'readme-repo-description-framing',
    file: 'README.md',
    test: (source) =>
      source.includes(approvedGithubDescription) &&
      source.includes('CI regression gates') &&
      source.includes('source-labeled workforce data pipelines'),
  },
  {
    id: 'readme-github-api-license-boundary',
    file: 'README.md',
    test: (source) =>
      source.includes('GitHub derives the API `license` field from the default branch') &&
      source.includes('default branch includes `LICENSE`'),
  },
  {
    id: 'readme-stars-not-adoption',
    file: 'README.md',
    test: (source) =>
      source.includes('Stars are not used as evidence of maturity or adoption') &&
      source.includes('active maintenance, PR review, CI checks, regression tests'),
  },
  {
    id: 'contributing-maintainer-burden-copy',
    file: 'CONTRIBUTING.md',
    test: (source) =>
      source.includes('PR review, CI triage, regression-test coverage') &&
      source.includes('review, CI, regression, and data-pipeline workload') &&
      source.includes('does not use stars, popularity, commercial traction, or broad adoption as proof of maturity'),
  },
  {
    id: 'repo-presentation-audit-artifact',
    file: auditMarkdownPath,
    test: (source) =>
      source.includes('GitHub Repo Presentation Audit') &&
      source.includes('not_adoption_evidence') &&
      source.includes('GitHub default-branch API visibility updates after merge'),
  },
];

const failures = [];

for (const check of checks) {
  if (check.id === 'repo-presentation-audit-artifact' && shouldWrite) {
    continue;
  }

  let source = '';
  try {
    source = readText(check.file);
  } catch (error) {
    failures.push({
      id: check.id,
      file: check.file,
      reason: `Unable to read file: ${error.message}`,
    });
    continue;
  }

  if (!check.test(source)) {
    failures.push({
      id: check.id,
      file: check.file,
      reason: 'Expected repository-presentation wording was not found.',
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  const result = {
    ok: true,
    checks: checks.map((check) => check.id),
  };

  if (withGithubApi) {
    const branch = getArgValue('--branch', getCurrentBranch());
    const [repo, branchLicense] = await Promise.all([
      fetchGitHubJson(repoApiUrl),
      fetchGitHubJson(`${repoApiUrl}/contents/LICENSE?ref=${encodeURIComponent(branch)}`).catch((error) => ({
        ok: false,
        error: error.message,
      })),
    ]);
    const defaultBranchLicense = repo.license?.spdx_id || null;
    const branchLicensePresent = Boolean(branchLicense?.name === 'LICENSE' && branchLicense?.size > 0);
    const licenseStatus =
      defaultBranchLicense === 'MIT'
        ? 'visible_on_default_branch'
        : branchLicensePresent
          ? 'default_branch_pending'
          : 'missing_on_checked_branch';
    const audit = {
      checkedAt: new Date().toISOString(),
      repository: repoSlug,
      branch,
      local: {
        licenseFilePresent: true,
        packageLicense: 'MIT',
        maintainerBurdenCopy: true,
      },
      github: {
        repoApiUrl,
        htmlUrl: repo.html_url,
        description: repo.description,
        descriptionMatches: repo.description === approvedGithubDescription,
        defaultBranch: repo.default_branch,
        defaultBranchLicense,
        branchLicensePresent,
        branchLicensePath: branchLicensePresent ? branchLicense.path : null,
        branchLicenseSize: branchLicensePresent ? branchLicense.size : 0,
        licenseStatus,
        stargazersCount: repo.stargazers_count,
      },
      boundaries: [
        'Repository description is scope framing, not adoption proof.',
        'GitHub API license metadata follows the default branch and may remain null until this branch is merged.',
        'Stars are not used as maturity, popularity, or commercial traction evidence.',
        'Reviewer-facing copy should focus on maintainer burden, PR review, CI triage, regression coverage, and source-labeled data-pipeline maintenance.',
      ],
    };

    const githubFailures = [];
    if (!audit.github.descriptionMatches) {
      githubFailures.push({
        id: 'github-api-description',
        reason: `Expected repository description to equal approved framing. Got: ${audit.github.description || 'missing'}`,
      });
    }
    if (licenseStatus === 'missing_on_checked_branch') {
      githubFailures.push({
        id: 'github-branch-license',
        reason: `LICENSE was not visible through the GitHub contents API for branch ${branch}.`,
      });
    }

    if (shouldWrite) {
      writeAuditArtifacts(audit);
    }

    result.githubApi = audit.github;
    result.artifacts = shouldWrite ? [auditJsonPath, auditMarkdownPath] : [];

    if (githubFailures.length > 0) {
      console.error(JSON.stringify({ ok: false, failures: githubFailures, githubApi: audit.github }, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
