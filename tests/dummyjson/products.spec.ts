import { expect, test } from '@playwright/test';

const baseURL = (
  process.env.DUMMYJSON_BASE_URL ?? 'https://dummyjson.com'
).replace(/\/+$/, '');

type ProductsResponse = {
  products: Array<{ id: number }>;
  total: number;
  skip: number;
  limit: number;
};

test.describe('GET /products returns consistent pagination metadata', () => {
  test('should return consistent pagination metadata', async ({
    request,
  }) => {
  const itemsPerPage = 10;
  const firstPageResponse = await request.get(
    `${baseURL}/products?limit=${itemsPerPage}&skip=0`,
  );

  expect(firstPageResponse.status()).toBe(200);
  const firstPage: ProductsResponse = await firstPageResponse.json();
  expect(firstPage.total).toBeGreaterThan(0);
  expect(firstPage.skip).toBe(0);
  expect(firstPage.limit).toBe(itemsPerPage);
  expect(firstPage.products).toHaveLength(
    Math.min(itemsPerPage, firstPage.total),
  );

  const pageCount = Math.ceil(firstPage.total / firstPage.limit);
  const lastPageSkip = (pageCount - 1) * itemsPerPage;
  const lastPageResponse = await request.get(
    `${baseURL}/products?limit=${itemsPerPage}&skip=${lastPageSkip}`,
  );

  expect(lastPageResponse.status()).toBe(200);
  const lastPage: ProductsResponse = await lastPageResponse.json();
  const lastPageItemCount = firstPage.total - lastPageSkip;
  expect(lastPage.total).toBe(firstPage.total);
  expect(lastPage.skip).toBe(lastPageSkip);
  expect(lastPage.limit).toBe(lastPageItemCount);
  expect(lastPage.products).toHaveLength(lastPageItemCount);
  });

  test.describe('handles pagination boundary values', () => {
    test('handles pagination boundary values', async ({ request }) => {
    const firstItemResponse = await request.get(
      `${baseURL}/products?limit=1&skip=0`,
    );
    expect(firstItemResponse.status()).toBe(200);
    const firstItemPage: ProductsResponse = await firstItemResponse.json();
    const total = firstItemPage.total;

    expect(firstItemPage.limit).toBe(1);
    expect(firstItemPage.products).toHaveLength(1);

    const zeroLimitResponse = await request.get(
      `${baseURL}/products?limit=0&skip=0`,
    );
    expect(zeroLimitResponse.status()).toBe(200);
    const zeroLimitPage: ProductsResponse = await zeroLimitResponse.json();
    expect(zeroLimitPage.limit).toBe(total);
    expect(zeroLimitPage.products).toHaveLength(total);

    const maximumUsefulLimitResponse = await request.get(
      `${baseURL}/products?limit=${total}&skip=0`,
    );
    expect(maximumUsefulLimitResponse.status()).toBe(200);
    const maximumUsefulLimitPage: ProductsResponse =
      await maximumUsefulLimitResponse.json();
    expect(maximumUsefulLimitPage.limit).toBe(total);
    expect(maximumUsefulLimitPage.products).toHaveLength(total);

    const lastItemResponse = await request.get(
      `${baseURL}/products?limit=10&skip=${total - 1}`,
    );
    expect(lastItemResponse.status()).toBe(200);
    const lastItemPage: ProductsResponse = await lastItemResponse.json();
    expect(lastItemPage.products).toHaveLength(1);

    const pastEndResponse = await request.get(
      `${baseURL}/products?limit=10&skip=${total}`,
    );
    expect(pastEndResponse.status()).toBe(200);
    const pastEndPage: ProductsResponse = await pastEndResponse.json();
    expect(pastEndPage.products).toHaveLength(0);

    const negativeSkipResponse = await request.get(
      `${baseURL}/products?limit=10&skip=-1`,
    );
    expect(negativeSkipResponse.status()).toBe(400);
  });
  });
});