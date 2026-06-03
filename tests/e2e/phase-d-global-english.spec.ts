import { expect, test, type Page, type Route } from '@playwright/test';

const testUser = {
  id: '00000000-0000-4000-8000-0000000000d4',
  email: 'phase-d-global@example.com',
};

const mockOccupation = {
  code: '15-1252.00',
  title: 'Software Developers',
  description: 'Develop and maintain software applications.',
};

const mockApoResult = {
  code: mockOccupation.code,
  title: mockOccupation.title,
  description: mockOccupation.description,
  overallAPO: 42,
  confidence: 'medium',
  timeline: '12-24 months',
  ci: { lower: 34, upper: 50 },
  tasks: [{ description: 'Write unit tests', apo: 38, factors: ['Structured workflow'], timeline: '12-24 months' }],
  knowledge: [{ description: 'Software engineering', apo: 30, factors: ['Human review needed'], timeline: '24+ months' }],
  skills: [{ description: 'Critical thinking', apo: 22, factors: ['Context dependent'], timeline: '24+ months' }],
  abilities: [{ description: 'Problem sensitivity', apo: 18, factors: ['Judgment-led'], timeline: '24+ months' }],
  technologies: [{ description: 'Developer tools', apo: 64, factors: ['AI-assisted coding'], timeline: '0-12 months' }],
  categoryBreakdown: {
    tasks: { apo: 38, confidence: 'medium' },
    knowledge: { apo: 30, confidence: 'medium' },
    skills: { apo: 22, confidence: 'medium' },
    abilities: { apo: 18, confidence: 'medium' },
    technologies: { apo: 64, confidence: 'medium' },
  },
  insights: {
    primary_opportunities: ['Use AI for code review support'],
    main_challenges: ['Maintain architecture judgment'],
    automation_drivers: ['Code generation and test automation'],
    barriers: ['Business context and safety review'],
  },
  metadata: {
    analysis_version: 'phase-d-smoke',
    calculation_method: 'mocked_playwright_smoke',
    timestamp: '2026-05-31T00:00:00.000Z',
  },
};

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  };
}

async function fulfillMockSupabase(route: Route) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();

  if (path.endsWith('/auth/v1/token')) {
    await route.fulfill(json({
      access_token: 'phase-d-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'phase-d-refresh-token',
      user: {
        id: testUser.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: testUser.email,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        created_at: '2026-05-31T00:00:00.000Z',
        updated_at: '2026-05-31T00:00:00.000Z',
      },
    }));
    return;
  }

  if (path.endsWith('/auth/v1/user')) {
    await route.fulfill(json({
      id: testUser.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: testUser.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-05-31T00:00:00.000Z',
      updated_at: '2026-05-31T00:00:00.000Z',
    }));
    return;
  }

  if (path.endsWith('/functions/v1/search-occupations')) {
    await route.fulfill(json({ occupations: [mockOccupation] }));
    return;
  }

  if (path.endsWith('/functions/v1/calculate-apo')) {
    await route.fulfill(json(mockApoResult));
    return;
  }

  if (path.endsWith('/rest/v1/rpc/track_feature_usage')) {
    await route.fulfill(json({ ok: true }));
    return;
  }

  if (path.startsWith('/mock-supabase/rest/v1/')) {
    if (method === 'HEAD') {
      await route.fulfill({
        status: 200,
        headers: { 'content-range': '0-0/0' },
        body: '',
      });
      return;
    }
    await route.fulfill(json(method === 'GET' ? [] : { ok: true }, method === 'POST' ? 201 : 200));
    return;
  }

  await route.fulfill(json({ ok: true }));
}

async function installMocks(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('wizard:status', 'done');
    window.localStorage.setItem('tour:home:v1', 'done');
    window.localStorage.setItem('tour:dashboard:v1', 'done');
    window.localStorage.setItem('apo_onboarding_completed', 'true');
  });
  await page.route('**/mock-supabase/**', (route) => fulfillMockSupabase(route));
}

async function signIn(page: Page) {
  await page.goto('/auth');
  await page.getByPlaceholder('Email').fill(testUser.email);
  await page.getByPlaceholder('Password').fill('phase-d-password');
  await page.getByRole('button', { name: /^Sign In$/ }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Phase D global-English disclosure', () => {
  test.use({ locale: 'en-GB' });

  test('shows UK U.S.-basis disclosure for non-US labor-market context', async ({ page }) => {
    await installMocks(page);
    await signIn(page);

    await page.getByRole('textbox', { name: /^Search Occupation$/i }).fill('software developer');
    await page.getByRole('button', { name: /^Search$/ }).click();
    await page.getByRole('button', { name: /Analyze automation for Software Developers/i }).click();

    await expect(page.getByRole('note', { name: /Regional labor-market disclosure/i })).toBeVisible();
    await expect(page.getByText('United Kingdom labor-market basis')).toBeVisible();
    await expect(page.getByText(/U\.S\. O\*NET\/BLS basis/)).toBeVisible();
    await expect(page.getByText('2134', { exact: true }).first()).toBeVisible();
  });
});
