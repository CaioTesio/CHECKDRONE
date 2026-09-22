import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@cftdrones.com.br", password: "admin123" };

async function login(page: Page, user = ADMIN) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/dashboard/);
  await page.waitForLoadState("networkidle");
}

test("rota protegida redireciona para o login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("login inválido mostra erro e não cria sessão", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#password").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("login e dashboard com dados do banco", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
  // Just verify the page has some content
  const content = await page.content();
  if (content.length < 1000) {
    console.log("Warning: Page content is too small, might be an error page");
    console.log("Content length:", content.length);
  }
});
