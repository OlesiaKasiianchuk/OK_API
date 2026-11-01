export type ApiEnvironment = 'test' | 'staging';
export type ApiServiceName =
  | 'reqres'
  | 'restful-booker'
  | 'petstore'
  | 'dummyjson';

const testBaseURLs: Record<ApiServiceName, string> = {
  reqres: 'https://reqres.in',
  'restful-booker': 'https://restful-booker.herokuapp.com',
  petstore: 'https://petstore.swagger.io/v2',
  dummyjson: 'https://dummyjson.com',
};

const environmentValue = process.env.API_ENV ?? 'test';

if (environmentValue !== 'test' && environmentValue !== 'staging') {
  throw new Error(`Unsupported API_ENV "${environmentValue}". Use test or staging.`);
}

export const apiEnvironment: ApiEnvironment = environmentValue;

const environmentVariableNames: Record<ApiServiceName, string> = {
  reqres: 'REQRES_BASE_URL',
  'restful-booker': 'RESTFUL_BOOKER_BASE_URL',
  petstore: 'PETSTORE_BASE_URL',
  dummyjson: 'DUMMYJSON_BASE_URL',
};

/**
 * Returns the base URL for the specified API service, considering the current environment.
 */
export function getApiBaseURL(service: ApiServiceName): string {
  const variableName = environmentVariableNames[service];
  const environmentPrefix = apiEnvironment === 'staging' ? 'STAGING_' : '';
  const configuredURL = process.env[`${environmentPrefix}${variableName}`];
  const baseURL =
    configuredURL ??
    (apiEnvironment === 'test' ? testBaseURLs[service] : undefined);

  if (!baseURL) {
    throw new Error(
      `Set ${environmentPrefix}${variableName} when API_ENV=staging.`,
    );
  }

  return baseURL.replace(/\/+$/, '');
}

/**
 * 
 * @returns credentials for RestfulBooker API.
 */
export function getRestfulBookerCredentials(): {
  username: string;
  password: string;
} {
  const environmentPrefix = apiEnvironment === 'staging' ? 'STAGING_' : '';
  const usernameVariable = `${environmentPrefix}RESTFUL_BOOKER_USERNAME`;
  const passwordVariable = `${environmentPrefix}RESTFUL_BOOKER_PASSWORD`;
  const username = process.env[usernameVariable];
  const password = process.env[passwordVariable];

  if (username && password) {
    return { username, password };
  }

  if (apiEnvironment === 'test') {
    // Public demo credentials published by restful-booker.herokuapp.com.
    return { username: 'admin', password: 'password123' };
  }

  throw new Error(
    `Set ${usernameVariable} and ${passwordVariable} when API_ENV=staging.`,
  );
}