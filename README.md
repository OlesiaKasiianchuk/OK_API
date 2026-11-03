# OK_API

API tests written with [Playwright Test](https://playwright.dev/docs/api-testing). Each API under test is wrapped in a typed client layer, so specs call service methods instead of building HTTP requests by hand.

## Running the tests

```powershell
npm install
npx playwright test                    # all suites
npx playwright test tests/petstore     # one folder
npx --yes -p typescript@5 tsc -p tsconfig.json   # type-check only
```

## Environment variables

`API_ENV` selects the environment: `test` (default) or `staging`.

| Variable | Purpose |
| --- | --- |
| `API_ENV` | `test` or `staging` |
| `<SERVICE>_BASE_URL` | Overrides a service URL in `test`, e.g. `PETSTORE_BASE_URL` |
| `STAGING_<SERVICE>_BASE_URL` | Required for each service when `API_ENV=staging` |
| `REQRES_API_KEY` | Reqres API key. Without it the anonymous limit is 40 requests/day per IP |
| `RESTFUL_BOOKER_USERNAME`, `RESTFUL_BOOKER_PASSWORD` | Restful Booker login (`STAGING_` prefix for staging). `test` falls back to the public demo login |

In CI, set these as GitHub secrets and pass them through `env:` in [.github/workflows/playwright.yml](.github/workflows/playwright.yml).

## Project structure

```
tests/
  api-client.ts         BaseApiClient: base URL, headers/auth, response parsing, ApiError
  config/
    environments.ts     Base URLs and credentials per environment
  models/
    resources.ts        Request/response types
  schemas/
    contracts.ts       Runtime JSON Schemas for API responses
  factories/            Test data builders with defaults, e.g. buildPet(overrides)
  services/             One class per API resource, wrapping BaseApiClient
  contracts/
    response-schemas.spec.ts
                        Ten data-driven schema cases and critical resource checks
  fixtures/
    api.ts              Playwright fixtures: clients, services, seeded data with cleanup
  <api-name>/           Spec files, grouped by API
```

A spec only needs the fixtures:

```ts
import { expect, test } from '../fixtures/api';

test('GET /pet/:id returns the created pet', async ({ petService, seededPet }) => {
  expect(await petService.getPet(seededPet.id)).toMatchObject(seededPet);
});
```

## Adding a new service

The example below adds a hypothetical `inventory` API with an `Item` resource. Replace the names, paths and fields with your own.

### 1. Register the API in the environment config

In [tests/config/environments.ts](tests/config/environments.ts), add the name to `ApiServiceName` and fill in both maps. TypeScript reports an error until both maps have an entry.

```ts
export type ApiServiceName = 'reqres' | 'restful-booker' | 'petstore' | 'inventory';

const testBaseURLs: Record<ApiServiceName, string> = {
  // ...
  inventory: 'https://inventory.example.com/api',
};

const environmentVariableNames: Record<ApiServiceName, string> = {
  // ...
  inventory: 'INVENTORY_BASE_URL',
};
```

`getApiBaseURL('inventory')` now returns the `test` URL, honours `INVENTORY_BASE_URL`, and requires `STAGING_INVENTORY_BASE_URL` when `API_ENV=staging`.

If the API needs credentials, add a getter next to `getRestfulBookerCredentials()` that reads them from environment variables. Never commit real secrets; only public demo credentials may be hardcoded, and only for `test`.

### 2. Add the resource types

In [tests/models/resources.ts](tests/models/resources.ts):

```ts
export type Item = {
  id: number;
  name: string;
  quantity: number;
};
```

Use `type` aliases rather than `interface` for anything you pass to `toMatchObject`. With `strict` on, `toMatchObject` only accepts types with an index signature, and interfaces don't have one.

### 3. Add a factory (optional)

Create `tests/factories/inventory.ts`. Give every field a default and generate unique IDs, so parallel tests don't collide:

```ts
import type { Item } from '../models/resources';

export function buildItem(overrides: Partial<Item> = {}): Item {
  const id = overrides.id ?? Date.now() * 1000 + Math.floor(Math.random() * 1000);
  return { id, name: `test-item-${id}`, quantity: 1, ...overrides };
}
```

### 4. Create the service class

Create `tests/services/item-service.ts`. A service maps methods to endpoints and nothing else; the client handles URLs, headers and parsing.

```ts
import type { BaseApiClient } from '../api-client';
import type { Item } from '../models/resources';

export class ItemService {
  constructor(private readonly client: BaseApiClient) {}

  createItem(item: Item): Promise<Item> {
    return this.client.post('/items', item, { expectedStatus: 201 });
  }

  getItem(id: number): Promise<Item> {
    return this.client.get(`/items/${id}`);
  }

  deleteItem(id: number, expectedStatus: number | number[] = 204): Promise<void> {
    return this.client.delete(`/items/${id}`, { expectedStatus });
  }
}
```

How the client treats status codes:
- Without `expectedStatus`, any 2xx is accepted. Pass `expectedStatus` when the API returns a specific code, such as `201` or `204`.
- Any other status throws an `ApiError` that includes `status` and `responseBody`. To test an error response, assert on the rejection:
  ```ts
  await expect(itemService.getItem(id)).rejects.toMatchObject({ status: 404 });
  ```
- Allowing extra codes, as in `deleteItem(id, [204, 404])`, is useful for cleanup when the test may already have deleted the resource.

### 5. Add fixtures

In [tests/fixtures/api.ts](tests/fixtures/api.ts), add the new fixtures to the `ApiFixtures` interface and implement them in `base.extend`:

```ts
interface ApiFixtures {
  // ...
  inventoryClient: BaseApiClient;
  itemService: ItemService;
  createItem: (overrides?: Partial<Item>) => Promise<Item>;
  seededItem: Item;
}

  inventoryClient: async ({ request }, use) => {
    const apiKey = process.env.INVENTORY_API_KEY;
    await use(
      new BaseApiClient({
        request,
        baseURL: getApiBaseURL('inventory'),
        authHeaders: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      }),
    );
  },

  itemService: async ({ inventoryClient }, use) => {
    await use(new ItemService(inventoryClient));
  },

  createItem: async ({ itemService }, use) => {
    const createdIds: number[] = [];

    await use(async (overrides) => {
      const item = buildItem(overrides);
      createdIds.push(item.id);
      return itemService.createItem(item);
    });

    for (const id of createdIds) {
      await itemService.deleteItem(id, [204, 404]);
    }
  },

  seededItem: async ({ createItem }, use) => {
    await use(await createItem());
  },
```

Fixture conventions:
- **Auth belongs to the client fixture.** Static keys go in `authHeaders`. For token logins, call the auth endpoint with an unauthenticated client first, as `authenticatedBookingClient` does.
- **Cleanup goes after `use()`.** It runs even when the test fails, so specs never need `try/finally` or `afterEach` for data they create through fixtures.
- **A `createX` fixture records what it creates** and deletes it afterwards. Use it when a test needs custom data or more than one record.
- **A `seededX` fixture provides one ready-made record.** Build it on `createX` so cleanup lives in one place.

### 6. Write the spec

Create `tests/inventory/items.spec.ts` and import `test` and `expect` from the fixtures, not from `@playwright/test`:

```ts
import { expect, test } from '../fixtures/api';

test.describe('Inventory items', () => {
  test('GET /items/:id returns the item', async ({ itemService, seededItem }) => {
    expect(await itemService.getItem(seededItem.id)).toMatchObject(seededItem);
  });

  test('DELETE /items/:id removes the item', async ({ itemService, seededItem }) => {
    await itemService.deleteItem(seededItem.id);

    await expect(itemService.getItem(seededItem.id)).rejects.toMatchObject({ status: 404 });
  });
});
```

For multi-step flows, wrap each stage in `test.step` and let fixtures do the setup. See [tests/petstore/order-lifecycle.spec.ts](tests/petstore/order-lifecycle.spec.ts).

### 7. Configure CI

If the service needs secrets, add them as GitHub repository secrets and pass them to the test step in [.github/workflows/playwright.yml](.github/workflows/playwright.yml):

```yaml
      env:
        REQRES_API_KEY: ${{ secrets.REQRES_API_KEY }}
        INVENTORY_API_KEY: ${{ secrets.INVENTORY_API_KEY }}
```

### 8. Verify

```powershell
npx --yes -p typescript@5 tsc -p tsconfig.json
npx playwright test tests/inventory
```

## Response schemas and review

Runtime response schemas live in [tests/schemas/contracts.ts](tests/schemas/contracts.ts). The data-driven endpoint matrix and fixture-backed critical-resource checks live in [response-schemas.spec.ts](tests/contracts/response-schemas.spec.ts); they validate products, users, bookings, pets, store orders, inventory maps, and error responses. The parameterized matrix currently has 10 cases.

When an API's response schema is intentionally changing, review it as a contract change:

1. Link the authoritative OpenAPI/API documentation or versioned contract in the change description. Include representative response payloads when the live behavior differs from the docs.
2. Update the JSON Schema in `tests/schemas/contracts.ts` and the corresponding TypeScript type in `tests/models/resources.ts` together. Explain changed required fields, types, enums, formats, and additional-property policy.
3. Add or update a positive response case and, where relevant, a negative or boundary case that demonstrates the changed rule. Do not loosen a schema just to make a failing test pass; confirm the behavior with the API owner or authoritative contract first.
4. Review the diff for compatibility: removing a required field, narrowing an enum, or changing a value type can break consumers. Identify affected services and tests, and record any intentional breaking change and migration/versioning decision in the PR.
5. Run `npx --yes -p typescript@5 tsc -p tsconfig.json` and `npx playwright test tests/contracts/response-schemas.spec.ts`. The Reqres resource-schema check is skipped when `REQRES_API_KEY` is unavailable.

Some public demo APIs contain legacy or inconsistent records. For example, Petstore's `findByStatus` results may omit `category`; the response schema keeps that property optional based on the observed API behavior, while still validating it when present. Changes to such exceptions should include fresh response evidence and explicit reviewer approval.
