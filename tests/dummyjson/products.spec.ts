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

test('GET /products returns consistent pagination metadata', async ({
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