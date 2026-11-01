export const baseURL = (
  process.env.RESTFUL_BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com'
).replace(/\/+$/, '');

export const userData = {
  username: 'admin',
  password: 'password123',
};