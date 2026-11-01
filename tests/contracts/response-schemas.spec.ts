import Ajv, { type AnySchema } from 'ajv';
import { getApiBaseURL } from '../config/environments';
import { expect, test } from '../fixtures/api';
import { responseSchemas } from '../schemas/contracts';

const ajv = new Ajv({ allErrors: true });
const dummyJsonBaseURL = getApiBaseURL('dummyjson');
const petstoreBaseURL = getApiBaseURL('petstore');

interface SchemaCase {
  name: string;
  url: string;
  status: number;
  schema: AnySchema;
}

function expectSchema(data: unknown, schema: AnySchema, caseName: string): void {
  const validate = ajv.compile(schema);
  const isValid = validate(data);
  expect(isValid, `${caseName}: ${ajv.errorsText(validate.errors)}`).toBe(true);
}

const parameterizedCases: SchemaCase[] = [
  {
    name: 'DummyJSON GET product validates product schema',
    url: `${dummyJsonBaseURL}/products/1`,
    status: 200,
    schema: responseSchemas.product,
  },
  {
    name: 'DummyJSON GET products validates list schema',
    url: `${dummyJsonBaseURL}/products?limit=1`,
    status: 200,
    schema: responseSchemas.productList,
  },
  {
    name: 'DummyJSON search validates list schema',
    url: `${dummyJsonBaseURL}/products/search?q=phone`,
    status: 200,
    schema: responseSchemas.productList,
  },
  {
    name: 'DummyJSON category products validate list schema',
    url: `${dummyJsonBaseURL}/products/category/smartphones`,
    status: 200,
    schema: responseSchemas.productList,
  },
  {
    name: 'DummyJSON category list validates string array schema',
    url: `${dummyJsonBaseURL}/products/category-list`,
    status: 200,
    schema: responseSchemas.productCategories,
  },
  {
    name: 'DummyJSON zero-limit products validate list schema',
    url: `${dummyJsonBaseURL}/products?limit=0`,
    status: 200,
    schema: responseSchemas.productList,
  },
  {
    name: 'DummyJSON missing-product error validates error schema',
    url: `${dummyJsonBaseURL}/products/0`,
    status: 404,
    schema: responseSchemas.dummyJsonError,
  },
  {
    name: 'Petstore inventory validates integer-map schema',
    url: `${petstoreBaseURL}/store/inventory`,
    status: 200,
    schema: responseSchemas.storeInventory,
  },
  {
    name: 'Petstore available pets validate pet-array schema',
    url: `${petstoreBaseURL}/pet/findByStatus?status=available`,
    status: 200,
    schema: responseSchemas.petArray,
  },
  {
    name: 'Petstore missing-pet error validates error schema',
    url: `${petstoreBaseURL}/pet/9007199254740990`,
    status: 404,
    schema: responseSchemas.petstoreError,
  },
];

test.describe('Data-driven endpoint schema checks', () => {
  for (const schemaCase of parameterizedCases) {
    test(schemaCase.name, async ({ request }) => {
      const response = await request.get(schemaCase.url);
      expect(response.status()).toBe(schemaCase.status);
      expect(response.headers()['content-type']).toContain('application/json');
      expectSchema(await response.json(), schemaCase.schema, schemaCase.name);
    });
  }
});

test.describe('Critical resource schemas', () => {
  test('Reqres GET user response validates user schema', async ({ userService }) => {
    test.skip(!process.env.REQRES_API_KEY, 'Reqres requires an API key.');
    const response = await userService.getUser(2);
    expectSchema(response, responseSchemas.reqresUserResponse, 'Reqres user');
  });

  test('Restful Booker GET booking validates booking schema', async ({
    bookingService,
    seededBooking,
  }) => {
    const response = await bookingService.getBooking(seededBooking.id);
    expectSchema(response, responseSchemas.booking, 'Restful Booker booking');
  });

  test('Petstore GET pet validates pet schema', async ({
    petService,
    seededPet,
  }) => {
    const response = await petService.getPet(seededPet.id);
    expectSchema(response, responseSchemas.pet, 'Petstore pet');
  });

  test('Petstore GET order validates order schema', async ({
    seededOrder,
    storeService,
  }) => {
    const response = await storeService.getOrder(seededOrder.id);
    expectSchema(response, responseSchemas.storeOrder, 'Petstore order');
  });
});