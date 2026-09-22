import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@cftdrones.com.br", password: "admin123" };

async function login(page: Page, user = ADMIN) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
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
  await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
  await expect(page.getByText("Últimas Ordens de Serviço")).toBeVisible();
  await expect(page.getByRole("link", { name: /^OS-\d{4}-\d{6}$/ }).first()).toBeVisible();
});
