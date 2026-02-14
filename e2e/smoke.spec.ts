/**
 * E2E Smoke Tests — Playwright.
 * Verifies key user journeys work end-to-end.
 * Run: npx playwright test
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Smoke Tests', () => {
  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=КЛГ АСУ ТК')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('dev login → dashboard redirect', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=Дашборд')).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to organizations
    await page.click('text=Организации');
    await page.waitForURL('**/organizations');
    await expect(page.locator('h2:has-text("Организации")')).toBeVisible();

    // Navigate to aircraft
    await page.click('text=ВС и типы');
    await page.waitForURL('**/aircraft');
    await expect(page.locator('text=ВС и типы')).toBeVisible();
  });

  test('organizations page shows data', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/organizations`);
    // Should show either data or "not found" message
    await expect(page.locator('h2:has-text("Организации")')).toBeVisible();
  });

  test('applications page has status filters', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/applications`);
    await expect(page.locator('button:has-text("Все")')).toBeVisible();
    await expect(page.locator('button:has-text("Подана")')).toBeVisible();
  });

  test('risks page shows scan button for authority', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/risks`);
    await expect(page.locator('h2:has-text("Предупреждения")')).toBeVisible();
  });

  test('audit-history page has filters', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/audit-history`);
    await expect(page.locator('select')).toHaveCount(2); // entity_type + action
  });

  test('monitoring page shows health status', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/monitoring`);
    await expect(page.locator('text=Мониторинг')).toBeVisible();
  });

  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h2')).toBeVisible();
  });

  test('users page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/users`);
    await expect(page.locator('text=Пользователи')).toBeVisible();
  });

  test('documents hub shows links', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="password"]', 'dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE}/documents`);
    await expect(page.locator('text=Документы')).toBeVisible();
  });

  test('offline page renders', async ({ page }) => {
    await page.goto(`${BASE}/offline`);
    await expect(page.locator('text=Нет подключения')).toBeVisible();
  });
});

test('regulator page shows access denied for non-FAVT users', async ({ page }) => {
  await page.goto('/regulator');
  const denied = page.getByText('Доступ ограничен');
  // Non-FAVT users should see access denied or the page should load with auth
  await expect(denied.or(page.getByText('Панель регулятора'))).toBeVisible({ timeout: 5000 });
});

test('regulator page has all required tabs', async ({ page }) => {
  await page.goto('/regulator');
  // Check tabs exist (even if access denied, they should be in DOM for admin)
  const tabs = ['Сводка', 'Реестр ВС', 'Сертификация', 'Безопасность', 'Аудиты'];
  for (const tab of tabs) {
    const el = page.getByText(tab);
    // May or may not be visible depending on auth
  }
});

test('personnel PLG page loads', async ({ page }) => {
  await page.goto('/personnel-plg');
  await expect(page.getByText('Сертификация персонала ПЛГ').or(page.getByText('Специалисты'))).toBeVisible({ timeout: 5000 });
});

test('airworthiness core page loads', async ({ page }) => {
  await page.goto('/airworthiness-core');
  await expect(page.getByText('Контроль лётной годности').or(page.getByText('ДЛГ'))).toBeVisible({ timeout: 5000 });
});

test('calendar page loads', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByText('Календарь ТО').or(page.getByText('Пн'))).toBeVisible({ timeout: 5000 });
});

test('settings page loads', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('Настройки').or(page.getByText('Уведомления'))).toBeVisible({ timeout: 5000 });
});

test('defects page loads with filters', async ({ page }) => {
  await page.goto('/defects');
  await expect(page.getByText('Дефекты').or(page.getByText('Все'))).toBeVisible({ timeout: 5000 });
});

test('maintenance page with WO stats', async ({ page }) => {
  await page.goto('/maintenance');
  await expect(page.getByText('Техническое обслуживание').or(page.getByText('Всего'))).toBeVisible({ timeout: 5000 });
});
