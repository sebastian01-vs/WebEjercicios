import { test, expect } from "@playwright/test";

test("guest can select a day, view technique and retain completion after reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bienvenido, atleta." })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Lunes,/ })).toBeVisible();
  await page.getByRole("button", { name: /^Lunes,/ }).click();
  await expect(page.getByRole("heading", { name: "Pecho y tríceps", exact: true })).toBeVisible();
  await expect(page.locator(".workout-row")).toHaveCount(4);
  await page.getByRole("button", { name: "Press de banca con barra", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cómo realizarlo" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Completar Press de banca con barra", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Desmarcar Press de banca con barra", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.getByRole("button", { name: /^Lunes,/ }).click();
  await expect(
    page.getByRole("button", { name: "Desmarcar Press de banca con barra", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("calendar filters, add, reorder, edit, remove and save persist together", async ({ page }) => {
  await page.goto("/calendar/edit?day=4");
  await expect(page.getByLabel("Enfoque del día")).toHaveValue("Descanso");
  await page.getByLabel("Enfoque del día").fill("Pierna técnica");
  await page.getByRole("button", { name: "Agregar ejercicio", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Grupo muscular" }).selectOption("upper legs");
  await dialog.getByRole("combobox", { name: "Equipamiento" }).selectOption("barbell");
  await dialog.getByRole("textbox", { name: "Buscar ejercicio" }).fill("sentadilla");
  await expect(dialog.locator(".catalog-card")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Añadir al día", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Añadido al día" })).toBeDisabled();
  await dialog.getByRole("combobox", { name: "Equipamiento" }).selectOption("dumbbell");
  await dialog.getByRole("textbox", { name: "Buscar ejercicio" }).fill("zancadas");
  await expect(dialog.getByRole("heading", { name: "Zancadas con mancuernas" })).toBeVisible();
  await dialog.getByRole("button", { name: "Añadir al día", exact: true }).click();
  await dialog.getByRole("button", { name: "Listo", exact: true }).click();
  await page.getByLabel("Series de Sentadilla con barra", { exact: true }).fill("4");
  await page.getByLabel("Repeticiones de Sentadilla con barra", { exact: true }).fill("6-8");
  await page.getByRole("button", { name: "Subir Zancadas con mancuernas", exact: true }).click();
  await expect(page.locator(".editable-name").first()).toContainText("Zancadas");
  await page.getByRole("button", { name: "Eliminar Zancadas con mancuernas", exact: true }).click();
  await page.getByRole("button", { name: "Guardar plan", exact: true }).first().click();
  await expect(page.getByRole("status")).toContainText("Plan guardado");
  await page.getByRole("link", { name: "Volver a mi rutina" }).click();
  await expect(page).toHaveURL("/");
  await page.reload();
  await page.getByRole("button", { name: /^Jueves,/ }).click();
  await expect(page.getByRole("heading", { name: "Pierna técnica", exact: true })).toBeVisible();
  await expect(page.locator(".workout-row")).toHaveCount(1);
  await expect(page.locator(".exercise-prescription")).toContainText("4");
  await expect(page.locator(".exercise-prescription")).toContainText("6-8");
});

test("unsaved calendar changes are protected and invalid sets do not save", async ({ page }) => {
  await page.goto("/calendar/edit");
  await page.getByLabel("Enfoque del día").fill("Sin guardar");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Volver a mi rutina" }).click();
  await expect(page).toHaveURL(/\/calendar\/edit/);
  await page.getByLabel("Series de Press de banca con barra", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Guardar plan", exact: true }).first().click();
  await expect(page.locator(".inline-error[role=alert]")).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("pulso:plan:v1")!)[0].muscle_focus),
  ).toBe("Pecho y tríceps");
});

test("mobile navigation, library and day selector work without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bienvenido, atleta." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("link", { name: "Ejercicios", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tu biblioteca de ejercicios." })).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar ejercicio" }).fill("plancha");
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Añadir al día", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Añadir y guardar en").selectOption("3");
  await page.getByRole("button", { name: "Añadir y guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Plan guardado");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("auth and API report their real availability", async ({ page, request }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Empieza tu camino." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear mi cuenta" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Ir a mi rutina" })).toBeVisible();
  const response = await request.get("/api/exercises?bodyPart=chest&equipment=barbell&limit=1");
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.source).toBe("sample");
  expect(json.exercises).toHaveLength(1);
  expect((await request.get("/api/exercises?limit=99999")).status()).toBe(400);
  expect((await request.get("/api/routines")).status()).toBe(503);
});
