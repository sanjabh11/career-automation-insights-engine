import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

const testUser = {
  id: '00000000-0000-4000-8000-0000000000c3',
  email: 'phase-c-smoke@example.com',
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
  ci: { low: 34, high: 50 },
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
    analysis_version: 'phase-c-smoke',
    calculation_method: 'mocked_playwright_smoke',
    timestamp: '2026-05-31T00:00:00.000Z',
  },
};

type MockState = {
  checkoutRequests: Array<{ headers: Record<string, string>; body: unknown }>;
};

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  };
}

async function fulfillMockSupabase(route: Route, state: MockState) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();

  if (path.endsWith('/auth/v1/token')) {
    await route.fulfill(json({
      access_token: 'phase-c-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'phase-c-refresh-token',
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

  if (path.endsWith('/functions/v1/crosswalk')) {
    await route.fulfill(json({
      start: 1,
      end: 1,
      total: 1,
      match: [
        {
          code: '11B',
          title: 'Infantryman (Army)',
          occupation: [
            { code: '33-3051.00', title: 'Police and Sheriff Patrol Officers' },
            { code: '33-1091.00', title: 'First-Line Supervisors of Security Workers' },
          ],
        },
      ],
    }));
    return;
  }

  if (path.endsWith('/functions/v1/create-checkout-session')) {
    state.checkoutRequests.push({
      headers: request.headers(),
      body: request.postDataJSON(),
    });
    await route.fulfill(json({
      sessionId: 'cs_test_phase_c_smoke',
      url: '/checkout-test-success?session_id=cs_test_phase_c_smoke',
    }));
    return;
  }

  if (path.endsWith('/functions/v1/generate-counselor-report')) {
    await route.fulfill(json({
      success: true,
      report_id: 'phase-c-report',
      html: '<!doctype html><html><body><h1>Phase C Coaching</h1><p>White-label client report for Pat Client.</p></body></html>',
    }));
    return;
  }

  if (path.endsWith('/rest/v1/rpc/deduct_report_credit')) {
    await route.fulfill(json(true));
    return;
  }

  if (path.endsWith('/rest/v1/rpc/track_feature_usage')) {
    await route.fulfill(json({ ok: true }));
    return;
  }

  if (path.endsWith('/rest/v1/white_label_configs')) {
    await route.fulfill(json({
      company_name: 'Phase C Coaching',
      primary_color: '#2563eb',
      secondary_color: '#0f766e',
      include_apo_branding: true,
    }));
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

async function installMocks(page: Page, state: MockState) {
  await page.addInitScript(() => {
    window.localStorage.setItem('wizard:status', 'done');
    window.localStorage.setItem('tour:home:v1', 'done');
    window.localStorage.setItem('tour:dashboard:v1', 'done');
    window.localStorage.setItem('apo_onboarding_completed', 'true');
  });
  await page.route('**/mock-supabase/**', (route) => fulfillMockSupabase(route, state));
}

async function signIn(page: Page) {
  await page.goto('/auth');
  await page.getByPlaceholder('Email').fill(testUser.email);
  await page.getByPlaceholder('Password').fill('phase-c-password');
  await page.getByRole('button', { name: /^Sign In$/ }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function clickOptional(locator: Locator, timeout = 2500) {
  try {
    await locator.first().click({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function dismissIntroOverlays(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const closedWelcome = await clickOptional(page.getByRole('button', { name: 'Close' }));
    const dismissedTour = await clickOptional(page.getByRole('button', { name: /Dismiss onboarding tour|Got it/i }));
    if (!closedWelcome && !dismissedTour) break;
  }
}

test.describe('Phase C runtime smoke', () => {
  test('auth smoke signs in with mocked Supabase Auth', async ({ page }) => {
    const state: MockState = { checkoutRequests: [] };
    await installMocks(page, state);

    await signIn(page);

    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  });

  test('APO run smoke searches and renders decision-support estimate', async ({ page }) => {
    const state: MockState = { checkoutRequests: [] };
    await installMocks(page, state);
    await signIn(page);
    await dismissIntroOverlays(page);

    await expect(page.getByRole('heading', { name: /Career Search/i })).toBeVisible();
    await page.getByRole('textbox', { name: /^Search Occupation$/i }).fill('software developer');
    await page.getByRole('button', { name: /^Search$/ }).click();
    await page.getByRole('button', { name: /Analyze automation for Software Developers/i }).click();

    await expect(page.getByText('Decision-support estimate').first()).toBeVisible();
    await expect(page.getByText('Software Developers').first()).toBeVisible();
  });

  test('Veterans crosswalk smoke returns civilian matches without 404', async ({ page }) => {
    const state: MockState = { checkoutRequests: [] };
    await installMocks(page, state);

    await page.goto('/veterans');
    await page.getByLabel(/Military Occupation Code/i).fill('11B');
    await page.getByRole('button', { name: /Find Civilian Careers/i }).click();

    await expect(page.getByText(/Civilian Career Matches/i)).toBeVisible();
    await expect(page.getByText('Police and Sheriff Patrol Officers')).toBeVisible();
  });

  test('Stripe test-mode checkout smoke posts authenticated checkout and follows test URL', async ({ page }) => {
    const state: MockState = { checkoutRequests: [] };
    await installMocks(page, state);
    await signIn(page);

    await page.goto('/pricing');
    await page.getByRole('button', { name: /Select Defender/i }).click();

    await expect(page).toHaveURL(/checkout-test-success\?session_id=cs_test_phase_c_smoke/);
    expect(state.checkoutRequests).toHaveLength(1);
    expect(state.checkoutRequests[0].headers.authorization).toContain('Bearer phase-c-access-token');
    expect(JSON.stringify(state.checkoutRequests[0].body)).toContain('price_');
  });

  test('white-label report export smoke downloads generated HTML report', async ({ page }) => {
    const state: MockState = { checkoutRequests: [] };
    await installMocks(page, state);
    await signIn(page);

    await page.goto('/tools/counselor-reports');
    await page.getByLabel('Company Name').fill('Phase C Coaching');
    await page.getByLabel('Client Name').fill('Pat Client');
    await page.getByRole('button', { name: 'Software Developers' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Generate Report/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Pat_Client_Career_Report.html');
    await expect(page.getByText('Report Preview')).toBeVisible();
    await expect(page.getByText('Phase C Coaching').first()).toBeVisible();
  });
});
