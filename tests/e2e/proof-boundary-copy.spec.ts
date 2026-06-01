import { expect, test, type Route } from '@playwright/test';

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  };
}

function legacyTextPattern(parts: string[]) {
  return new RegExp(parts.join('\\s*'), 'i');
}

async function fulfillTelemetryMock(route: Route) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();

  if (path.startsWith('/mock-supabase/rest/v1/')) {
    if (method === 'HEAD') {
      await route.fulfill({
        status: 200,
        headers: { 'content-range': '0-0/0' },
        body: '',
      });
      return;
    }

    await route.fulfill(json([], 200));
    return;
  }

  await route.fulfill(json({ ok: true }));
}

test.describe('Proof-boundary copy', () => {
  test('impact and outcomes routes do not render unsupported outcome claims', async ({ page }) => {
    await page.route('**/mock-supabase/**', fulfillTelemetryMock);

    await page.goto('/impact');
    await expect(page.getByRole('heading', { name: /Impact Evidence Dashboard/i })).toBeVisible();
    await expect(page.getByText(/does not claim wage gains, placement outcomes, or live revenue/i)).toBeVisible();
    await expect(page.getByText(legacyTextPattern(['Measured outcomes', 'and growth metrics', 'from real users']))).toHaveCount(0);
    await expect(page.getByText(legacyTextPattern(['Avg Wage', 'Increase']))).toHaveCount(0);
    await expect(page.getByText(legacyTextPattern(['Skill Match', 'Accuracy']))).toHaveCount(0);
    await expect(page.getByText(legacyTextPattern(['Decision', 'Speed-up']))).toHaveCount(0);

    await page.goto('/outcomes');
    await expect(page.getByRole('heading', { name: /Market Signals & KPIs/i })).toBeVisible();
    await expect(page.getByText(/not placement, wage, or public outcome reporting/i)).toBeVisible();
    await expect(page.getByText(/Outcome claims are not yet proven/i)).toBeVisible();
    await expect(page.getByText(legacyTextPattern(['Correlations computed', 'over rolling', '24-month windows']))).toHaveCount(0);
    await expect(page.getByText(legacyTextPattern(['APO', 'Median Salary']))).toHaveCount(0);
    await expect(page.getByText(legacyTextPattern(['Learning Path Completion', 'Wage Growth']))).toHaveCount(0);
  });
});
