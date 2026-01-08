/**
 * NextGen API Authentication and Client Library
 *
 * Handles GSA OAuth2 authentication and provides methods for interacting
 * with the NextGen Enterprise API for both Production and Test environments.
 */

export type NextGenEnvironment = 'prod' | 'test';

export interface NextGenConfig {
  clientId: string;
  clientSecret: string;
  siteId: string;
  practiceId: string;
  enterpriseId: string;
  environment: NextGenEnvironment;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PersonLookupParams {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  city?: string;
  zip?: string;
  sex?: string;
  emailAddress?: string;
  excludeExpired?: boolean;
  searchPatientsOnly?: boolean;
  quickSearchId?: 'PersonNumber' | 'MedicalRecordNumber' | 'OtherIdNumber' | 'SocialSecurityNumber' | 'PhoneNumber';
  quickSearchInput?: string;
}

export interface PersonSearchParams {
  patientsOnly?: boolean;
  $top?: number;
  $filter?: string;
  $orderby?: string;
  $skip?: number;
  $count?: boolean;
}

export interface CreatePersonParams {
  LastName: string;
  FirstName: string;
  DateOfBirth: string;
  Sex: 'M' | 'F' | 'U';
  MiddleName?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  State?: string;
  Zip?: string;
  HomePhone?: string;
  CellPhone?: string;
  EmailAddress?: string;
  SocialSecurityNumber?: string;
  OtherIdNumber?: string;
  IgnoreDuplicatePersons?: boolean;
}

export interface PersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  sex: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  homePhone?: string;
  cellPhone?: string;
  emailAddress?: string;
  personNumber?: string;
  medicalRecordNumber?: string;
  isPatient?: boolean;
  _links?: Array<{
    href: string;
    method: string;
    rel: string;
    description: string;
  }>;
}

export interface ChartBalancesResponse {
  totalAmountDue?: number;
  badDebtAmount?: number;
  amountDueInsurance?: number;
  availableCredit?: number;
  accountCredit?: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Token cache per environment
const tokenCache: Map<string, CachedToken> = new Map();

// Session ID cache (these don't expire)
const sessionIdCache: Map<string, string> = new Map();

/**
 * Get environment variables for the specified NextGen environment
 */
export function getNextGenConfig(environment: NextGenEnvironment): NextGenConfig {
  const envPrefix = environment === 'prod' ? 'NEXTGEN_PROD' : 'NEXTGEN_TEST';

  const clientId = process.env[`${envPrefix}_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_CLIENT_SECRET`];
  const siteId = process.env[`${envPrefix}_SITE_ID`];
  const practiceId = process.env[`${envPrefix}_PRACTICE_ID`];
  const enterpriseId = process.env[`${envPrefix}_ENTERPRISE_ID`];

  if (!clientId || !clientSecret || !siteId || !practiceId || !enterpriseId) {
    throw new Error(`Missing NextGen API configuration for ${environment} environment. Required: ${envPrefix}_CLIENT_ID, ${envPrefix}_CLIENT_SECRET, ${envPrefix}_SITE_ID, ${envPrefix}_PRACTICE_ID, ${envPrefix}_ENTERPRISE_ID`);
  }

  return {
    clientId,
    clientSecret,
    siteId,
    practiceId,
    enterpriseId,
    environment,
  };
}

/**
 * NextGen API Client
 *
 * Handles authentication and provides methods for interacting with the NextGen API.
 */
export class NextGenApiClient {
  private config: NextGenConfig;
  private baseUrl: string;
  private tokenUrl: string;

  constructor(environment: NextGenEnvironment) {
    this.config = getNextGenConfig(environment);
    this.baseUrl = 'https://nativeapi.nextgen.com/nge/prod/nge-api/api';
    this.tokenUrl = 'https://nativeapi.nextgen.com/nge/prod/nge-oauth/token';
  }

  /**
   * Get a valid access token, using cache if available
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `${this.config.environment}-${this.config.siteId}`;
    const cached = tokenCache.get(cacheKey);

    // Return cached token if still valid (with 5-minute buffer)
    if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cached.token;
    }

    // Fetch new token
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        site_id: this.config.siteId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to obtain access token: ${response.status} ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    // Cache the token
    tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
  }

  /**
   * Get or create the X-NG-SessionId for the configured practice/enterprise
   */
  async getSessionId(): Promise<string> {
    const cacheKey = `${this.config.environment}-${this.config.practiceId}-${this.config.enterpriseId}`;
    const cached = sessionIdCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const token = await this.getAccessToken();

    // Call PUT /users/me/login-defaults to get the session ID
    const response = await fetch(`${this.baseUrl}/users/me/login-defaults`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        practiceId: this.config.practiceId,
        enterpriseId: this.config.enterpriseId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set login defaults: ${response.status} ${errorText}`);
    }

    // The X-NG-SessionId is returned in the response headers
    const sessionId = response.headers.get('x-ng-sessionid');

    if (!sessionId) {
      throw new Error('No X-NG-SessionId returned from login-defaults');
    }

    // Cache the session ID (they don't expire)
    sessionIdCache.set(cacheKey, sessionId);

    return sessionId;
  }

  /**
   * Make an authenticated request to the NextGen API
   */
  async request<T>(
    method: string,
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined>;
      body?: unknown;
    }
  ): Promise<T> {
    const token = await this.getAccessToken();
    const sessionId = await this.getSessionId();

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'x-ng-sessionid': sessionId,
    };

    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `NextGen API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new NextGenApiError(errorMessage, response.status);
    }

    // Some endpoints return empty body
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  /**
   * Lookup persons by various criteria
   * GET /persons/lookup
   */
  async lookupPersons(params: PersonLookupParams): Promise<PersonResponse[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName,
      dateOfBirth: params.dateOfBirth,
      addressLine1: params.addressLine1,
      city: params.city,
      zip: params.zip,
      sex: params.sex,
      emailAddress: params.emailAddress,
      excludeExpired: params.excludeExpired,
      searchPatientsOnly: params.searchPatientsOnly,
      quickSearchId: params.quickSearchId,
      quickSearchInput: params.quickSearchInput,
    };

    return this.request<PersonResponse[]>('GET', '/persons/lookup', { params: queryParams });
  }

  /**
   * Search persons with OData filtering
   * GET /persons
   */
  async searchPersons(params?: PersonSearchParams): Promise<{ Items: PersonResponse[]; Count?: number; NextPageLink?: string }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      patientsOnly: params?.patientsOnly,
      $top: params?.$top,
      $filter: params?.$filter,
      $orderby: params?.$orderby,
      $skip: params?.$skip,
      $count: params?.$count,
    };

    return this.request('GET', '/persons', { params: queryParams });
  }

  /**
   * Get a person by ID
   * GET /persons/{personId}
   */
  async getPersonById(personId: string, expand?: string): Promise<PersonResponse> {
    const params: Record<string, string | undefined> = {};
    if (expand) {
      params.$expand = expand;
    }
    return this.request<PersonResponse>('GET', `/persons/${personId}`, { params });
  }

  /**
   * Create a new person
   * POST /persons
   */
  async createPerson(person: CreatePersonParams): Promise<PersonResponse> {
    return this.request<PersonResponse>('POST', '/persons', { body: person });
  }

  /**
   * Update a person
   * PATCH /persons/{personId}
   */
  async updatePerson(personId: string, updates: Partial<CreatePersonParams>): Promise<PersonResponse> {
    return this.request<PersonResponse>('PATCH', `/persons/${personId}`, { body: updates });
  }

  /**
   * Get chart balances for a person
   * GET /persons/{personId}/chart/balances
   */
  async getChartBalances(personId: string): Promise<ChartBalancesResponse> {
    return this.request<ChartBalancesResponse>('GET', `/persons/${personId}/chart/balances`);
  }

  /**
   * Clear token cache (useful for testing or after token invalidation)
   */
  static clearTokenCache(): void {
    tokenCache.clear();
  }

  /**
   * Clear session ID cache
   */
  static clearSessionCache(): void {
    sessionIdCache.clear();
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    tokenCache.clear();
    sessionIdCache.clear();
  }
}

/**
 * Custom error class for NextGen API errors
 */
export class NextGenApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'NextGenApiError';
  }
}

/**
 * Factory function to create a NextGen API client
 */
export function createNextGenClient(environment: NextGenEnvironment): NextGenApiClient {
  return new NextGenApiClient(environment);
}
