import type { AnySchema } from 'ajv';

const productSchema = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'category',
    'price',
    'discountPercentage',
    'rating',
    'stock',
    'tags',
    'sku',
    'weight',
    'dimensions',
    'warrantyInformation',
    'shippingInformation',
    'availabilityStatus',
    'reviews',
    'returnPolicy',
    'minimumOrderQuantity',
    'meta',
    'images',
    'thumbnail',
  ],
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    price: { type: 'number' },
    discountPercentage: { type: 'number' },
    rating: { type: 'number' },
    stock: { type: 'integer' },
    tags: { type: 'array', items: { type: 'string' } },
    sku: { type: 'string' },
    weight: { type: 'number' },
    dimensions: {
      type: 'object',
      required: ['width', 'height', 'depth'],
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
        depth: { type: 'number' },
      },
      additionalProperties: true,
    },
    warrantyInformation: { type: 'string' },
    shippingInformation: { type: 'string' },
    availabilityStatus: { type: 'string' },
    reviews: {
      type: 'array',
      items: {
        type: 'object',
        required: ['rating', 'comment', 'date', 'reviewerName', 'reviewerEmail'],
        properties: {
          rating: { type: 'integer' },
          comment: { type: 'string' },
          date: { type: 'string' },
          reviewerName: { type: 'string' },
          reviewerEmail: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
    returnPolicy: { type: 'string' },
    minimumOrderQuantity: { type: 'integer' },
    meta: {
      type: 'object',
      required: ['createdAt', 'updatedAt', 'barcode', 'qrCode'],
      properties: {
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        barcode: { type: 'string' },
        qrCode: { type: 'string' },
      },
      additionalProperties: true,
    },
    images: { type: 'array', items: { type: 'string' } },
    thumbnail: { type: 'string' },
  },
  additionalProperties: true,
} satisfies AnySchema;

const petSchema = {
  type: 'object',
  required: ['id', 'name', 'photoUrls', 'tags', 'status'],
  properties: {
    id: { type: 'integer' },
    category: {
      type: 'object',
      required: ['id', 'name'],
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      additionalProperties: true,
    },
    name: { type: 'string' },
    photoUrls: { type: 'array', items: { type: 'string' } },
    tags: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'integer' }, name: { type: 'string' } },
        additionalProperties: true,
      },
    },
    status: { type: 'string', enum: ['available', 'pending', 'sold'] },
  },
  additionalProperties: true,
} satisfies AnySchema;

const bookingSchema = {
  type: 'object',
  required: ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'],
  properties: {
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    totalprice: { type: 'integer' },
    depositpaid: { type: 'boolean' },
    bookingdates: {
      type: 'object',
      required: ['checkin', 'checkout'],
      properties: { checkin: { type: 'string' }, checkout: { type: 'string' } },
      additionalProperties: true,
    },
    additionalneeds: { type: 'string' },
  },
  additionalProperties: true,
} satisfies AnySchema;

const storeOrderSchema = {
  type: 'object',
  required: ['id', 'petId', 'quantity', 'shipDate', 'status', 'complete'],
  properties: {
    id: { type: 'integer' },
    petId: { type: 'integer' },
    quantity: { type: 'integer' },
    shipDate: { type: 'string' },
    status: { type: 'string', enum: ['placed', 'approved', 'delivered'] },
    complete: { type: 'boolean' },
  },
  additionalProperties: true,
} satisfies AnySchema;

const productListSchema = {
  type: 'object',
  required: ['products', 'total', 'skip', 'limit'],
  properties: {
    products: { type: 'array', items: productSchema },
    total: { type: 'integer' },
    skip: { type: 'integer' },
    limit: { type: 'integer' },
  },
  additionalProperties: true,
} satisfies AnySchema;

const userSchema = {
  type: 'object',
  required: ['id', 'email', 'first_name', 'last_name', 'avatar'],
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    avatar: { type: 'string' },
  },
  additionalProperties: true,
} satisfies AnySchema;

export const responseSchemas = {
  booking: bookingSchema,
  dummyJsonError: {
    type: 'object',
    required: ['message'],
    properties: { message: { type: 'string' } },
    additionalProperties: true,
  } satisfies AnySchema,
  pet: petSchema,
  petArray: { type: 'array', items: petSchema } satisfies AnySchema,
  petstoreError: {
    type: 'object',
    required: ['code', 'type', 'message'],
    properties: {
      code: { type: 'integer' },
      type: { type: 'string' },
      message: { type: 'string' },
    },
    additionalProperties: true,
  } satisfies AnySchema,
  product: productSchema,
  productCategories: { type: 'array', items: { type: 'string' } } satisfies AnySchema,
  productList: productListSchema,
  reqresUserResponse: {
    type: 'object',
    required: ['data'],
    properties: { data: userSchema },
    additionalProperties: true,
  } satisfies AnySchema,
  storeInventory: {
    type: 'object',
    additionalProperties: { type: 'integer' },
  } satisfies AnySchema,
  storeOrder: storeOrderSchema,
};

export { bookingSchema, petSchema, productSchema, storeOrderSchema, userSchema };