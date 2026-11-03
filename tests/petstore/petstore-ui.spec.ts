import { apiEnvironment, getApiBaseURL } from '../config/environments';
import { expect, test } from '../fixtures/api';

test('API-created pet is visible in the Petstore Swagger UI', async ({
  createPet,
  page,
}) => {
  test.skip(
    apiEnvironment !== 'test' || process.env.PETSTORE_BASE_URL !== undefined,
    'The public Swagger UI targets the public Petstore API.',
  );

  const pet = await test.step('Create a pet through the API', () => createPet());

  await test.step('Verify the pet through the Swagger UI', async () => {
    await page.goto(new URL('/', getApiBaseURL('petstore')).toString());

    const cookieConsentButton = page.getByRole('button', {
      name: 'Allow all cookies',
    });
    if (await cookieConsentButton.isVisible()) {
      await cookieConsentButton.click();
    }

    const getPetOperation = page
      .locator('.opblock-get')
      .filter({ hasText: 'Find pet by ID' });
    await getPetOperation
      .getByRole('button', { name: 'GET /pet/{petId} Find pet by ID' })
      .click();
    await getPetOperation.getByRole('button', { name: 'Try it out' }).click();
    await getPetOperation
      .getByRole('textbox', { name: 'petId' })
      .fill(String(pet.id));
    await getPetOperation.getByRole('button', { name: 'Execute' }).click();

    const response = getPetOperation.locator('.live-responses-table');
    await expect(response).toContainText('200');
    await expect(response).toContainText(String(pet.id));
    await expect(response).toContainText(pet.name);
    await expect(response).toContainText('playwright');
  });
});
