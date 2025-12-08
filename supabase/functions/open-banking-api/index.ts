import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-fapi-auth-date, x-fapi-customer-ip-address, x-fapi-interaction-id, x-tpp-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'x-fapi-interaction-id',
};

// OpenAPI 3.1 Specification for PSD2/PSD3 compliant API
const openAPISpec = {
  openapi: "3.1.0",
  info: {
    title: "Open Banking API - PSD2/PSD3 Compliant",
    version: "2.0.0",
    description: "API estándar para integración con terceros según normativa europea PSD2/PSD3. Incluye gestión de TPPs, consentimientos persistentes, rate limiting y auditoría completa.",
    contact: {
      name: "API Support",
      email: "api@creand.ad"
    },
    license: {
      name: "Proprietary",
      url: "https://creand.ad/api-license"
    }
  },
  servers: [
    {
      url: "https://avaugfnqvvqcilhiudlf.supabase.co/functions/v1/open-banking-api",
      description: "Production server"
    }
  ],
  security: [
    { OAuth2: ["accounts", "payments", "fundsconfirmation"] }
  ],
  paths: {
    "/tpps": {
      post: {
        summary: "Register TPP",
        operationId: "registerTPP",
        tags: ["TPP Management"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TPPRegistration" }
            }
          }
        },
        responses: {
          "201": {
            description: "TPP registered successfully"
          }
        }
      }
    },
    "/accounts": {
      get: {
        summary: "Get accounts list",
        operationId: "getAccounts",
        tags: ["Accounts"],
        security: [{ OAuth2: ["accounts"] }],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccountsResponse" }
              }
            }
          }
        }
      }
    },
    "/accounts/{accountId}": {
      get: {
        summary: "Get account details",
        operationId: "getAccountById",
        tags: ["Accounts"],
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Account" }
              }
            }
          }
        }
      }
    },
    "/accounts/{accountId}/transactions": {
      get: {
        summary: "Get account transactions",
        operationId: "getTransactions",
        tags: ["Transactions"],
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "fromDate",
            in: "query",
            schema: { type: "string", format: "date" }
          },
          {
            name: "toDate",
            in: "query",
            schema: { type: "string", format: "date" }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TransactionsResponse" }
              }
            }
          }
        }
      }
    },
    "/accounts/{accountId}/balances": {
      get: {
        summary: "Get account balances",
        operationId: "getBalances",
        tags: ["Balances"],
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BalancesResponse" }
              }
            }
          }
        }
      }
    },
    "/payments": {
      post: {
        summary: "Initiate payment",
        operationId: "initiatePayment",
        tags: ["Payments"],
        security: [{ OAuth2: ["payments"] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentInitiation" }
            }
          }
        },
        responses: {
          "201": {
            description: "Payment initiated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentResponse" }
              }
            }
          }
        }
      }
    },
    "/funds-confirmation": {
      post: {
        summary: "Confirm funds availability",
        operationId: "confirmFunds",
        tags: ["Funds Confirmation"],
        security: [{ OAuth2: ["fundsconfirmation"] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FundsConfirmationRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Funds confirmation response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FundsConfirmationResponse" }
              }
            }
          }
        }
      }
    },
    "/consents": {
      post: {
        summary: "Create consent",
        operationId: "createConsent",
        tags: ["Consents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConsentRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Consent created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsentResponse" }
              }
            }
          }
        }
      }
    },
    "/consents/{consentId}": {
      get: {
        summary: "Get consent status",
        operationId: "getConsent",
        tags: ["Consents"],
        parameters: [
          {
            name: "consentId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Consent details"
          }
        }
      },
      delete: {
        summary: "Revoke consent",
        operationId: "revokeConsent",
        tags: ["Consents"],
        parameters: [
          {
            name: "consentId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "204": {
            description: "Consent revoked"
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      OAuth2: {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: "/oauth/authorize",
            tokenUrl: "/oauth/token",
            scopes: {
              accounts: "Access account information",
              payments: "Initiate payments",
              fundsconfirmation: "Confirm funds availability"
            }
          }
        }
      }
    },
    schemas: {
      TPPRegistration: {
        type: "object",
        required: ["tppId", "tppName", "services", "redirectUris"],
        properties: {
          tppId: { type: "string" },
          tppName: { type: "string" },
          organizationId: { type: "string" },
          registrationNumber: { type: "string" },
          services: { type: "array", items: { type: "string" } },
          redirectUris: { type: "array", items: { type: "string" } },
          contactEmail: { type: "string" },
          countryCode: { type: "string" },
          regulatoryAuthority: { type: "string" },
          qwacCertificate: { type: "string" },
          qsealcCertificate: { type: "string" }
        }
      },
      AccountsResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Account" }
          }
        }
      },
      Account: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", const: "accounts" },
          attributes: {
            type: "object",
            properties: {
              iban: { type: "string" },
              currency: { type: "string" },
              name: { type: "string" },
              product: { type: "string" },
              status: { type: "string" },
              cashAccountType: { type: "string" }
            }
          }
        }
      },
      TransactionsResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Transaction" }
          }
        }
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", const: "transactions" },
          attributes: {
            type: "object",
            properties: {
              bookingDate: { type: "string", format: "date" },
              valueDate: { type: "string", format: "date" },
              transactionAmount: {
                type: "object",
                properties: {
                  amount: { type: "string" },
                  currency: { type: "string" }
                }
              },
              creditorName: { type: "string" },
              remittanceInformationUnstructured: { type: "string" }
            }
          }
        }
      },
      BalancesResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Balance" }
          }
        }
      },
      Balance: {
        type: "object",
        properties: {
          balanceType: { type: "string" },
          balanceAmount: {
            type: "object",
            properties: {
              amount: { type: "string" },
              currency: { type: "string" }
            }
          },
          referenceDate: { type: "string", format: "date" }
        }
      },
      PaymentInitiation: {
        type: "object",
        required: ["debtorAccount", "creditorAccount", "creditorName", "instructedAmount"],
        properties: {
          debtorAccount: {
            type: "object",
            properties: {
              iban: { type: "string" }
            }
          },
          creditorAccount: {
            type: "object",
            properties: {
              iban: { type: "string" }
            }
          },
          creditorName: { type: "string" },
          instructedAmount: {
            type: "object",
            properties: {
              amount: { type: "string" },
              currency: { type: "string" }
            }
          },
          remittanceInformationUnstructured: { type: "string" }
        }
      },
      PaymentResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", const: "payments" },
              attributes: {
                type: "object",
                properties: {
                  transactionStatus: { type: "string" },
                  paymentId: { type: "string" }
                }
              }
            }
          }
        }
      },
      FundsConfirmationRequest: {
        type: "object",
        required: ["account", "instructedAmount"],
        properties: {
          account: {
            type: "object",
            properties: {
              iban: { type: "string" }
            }
          },
          instructedAmount: {
            type: "object",
            properties: {
              amount: { type: "string" },
              currency: { type: "string" }
            }
          }
        }
      },
      FundsConfirmationResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              fundsAvailable: { type: "boolean" }
            }
          }
        }
      },
      ConsentRequest: {
        type: "object",
        required: ["access", "validUntil", "frequencyPerDay"],
        properties: {
          access: {
            type: "object",
            properties: {
              accounts: { type: "array", items: { type: "object" } },
              balances: { type: "array", items: { type: "object" } },
              transactions: { type: "array", items: { type: "object" } }
            }
          },
          recurringIndicator: { type: "boolean" },
          validUntil: { type: "string", format: "date" },
          frequencyPerDay: { type: "integer" }
        }
      },
      ConsentResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", const: "consents" },
              attributes: {
                type: "object",
                properties: {
                  consentId: { type: "string" },
                  consentStatus: { type: "string" },
                  validUntil: { type: "string" },
                  frequencyPerDay: { type: "integer" }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Generate unique interaction ID for FAPI compliance
function generateInteractionId(): string {
  return crypto.randomUUID();
}

// Validate TPP and check rate limit
async function validateTPP(tppId: string | null, supabase: any, endpoint: string): Promise<{ valid: boolean; tpp?: any; error?: string }> {
  if (!tppId) {
    return { valid: false, error: 'x-tpp-id header required' };
  }

  // Get TPP from database
  const { data: tpp, error } = await supabase
    .from('registered_tpps')
    .select('*')
    .eq('tpp_id', tppId)
    .single();

  if (error || !tpp) {
    return { valid: false, error: 'TPP not found or not registered' };
  }

  if (tpp.authorization_status !== 'authorized') {
    return { valid: false, error: `TPP status: ${tpp.authorization_status}` };
  }

  // Check expiration
  if (tpp.expires_at && new Date(tpp.expires_at) < new Date()) {
    return { valid: false, error: 'TPP authorization expired' };
  }

  // Check rate limit
  const { data: rateLimitData } = await supabase
    .from('tpp_rate_limits')
    .select('request_count')
    .eq('tpp_id', tppId)
    .gte('window_start', new Date(Date.now() - 3600000).toISOString());

  const currentCount = rateLimitData?.reduce((sum: number, r: any) => sum + r.request_count, 0) || 0;

  if (currentCount >= tpp.rate_limit_per_hour) {
    return { valid: false, error: 'Rate limit exceeded' };
  }

  // Record this request
  await supabase.from('tpp_rate_limits').insert({
    tpp_id: tppId,
    endpoint,
    request_count: 1
  });

  return { valid: true, tpp };
}

// Validate OAuth 2.0 token and extract scopes
async function validateToken(authHeader: string | null, supabase: any): Promise<{ valid: boolean; userId?: string; scopes?: string[] }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: user.id,
      scopes: ['accounts', 'payments', 'fundsconfirmation']
    };
  } catch {
    return { valid: false };
  }
}

// Validate consent for request
async function validateConsent(tppId: string, userId: string, requiredPermission: string, supabase: any): Promise<{ valid: boolean; consent?: any; error?: string }> {
  const { data: consent, error } = await supabase
    .from('open_banking_consents')
    .select('*')
    .eq('tpp_id', tppId)
    .eq('user_id', userId)
    .eq('status', 'authorized')
    .contains('permissions', [requiredPermission])
    .gt('expiration_date', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !consent) {
    return { valid: false, error: 'No valid consent found for this operation' };
  }

  // Update last action date
  await supabase
    .from('open_banking_consents')
    .update({ last_action_date: new Date().toISOString() })
    .eq('id', consent.id);

  return { valid: true, consent };
}

// Audit log helper
async function logAudit(supabase: any, data: {
  tppId: string;
  userId?: string;
  consentId?: string;
  endpoint: string;
  method: string;
  requestHeaders?: any;
  requestBody?: any;
  responseStatus: number;
  responseBody?: any;
  interactionId: string;
  ipAddress?: string;
}) {
  try {
    await supabase.from('open_banking_audit_log').insert({
      tpp_id: data.tppId,
      user_id: data.userId,
      consent_id: data.consentId,
      endpoint: data.endpoint,
      method: data.method,
      request_headers: data.requestHeaders,
      request_body: data.requestBody,
      response_status: data.responseStatus,
      response_body: data.responseBody,
      interaction_id: data.interactionId,
      ip_address: data.ipAddress
    });
  } catch (e) {
    console.error('[Open Banking API] Audit log error:', e);
  }
}

// JSON:API formatted response helper
function jsonApiResponse(data: any, status: number, interactionId: string): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.api+json',
        'x-fapi-interaction-id': interactionId,
      }
    }
  );
}

// JSON:API error response
function jsonApiError(title: string, detail: string, status: number, interactionId: string): Response {
  return jsonApiResponse({
    errors: [{
      status: status.toString(),
      title,
      detail
    }]
  }, status, interactionId);
}

serve(async (req) => {
  const interactionId = req.headers.get('x-fapi-interaction-id') || generateInteractionId();
  const tppId = req.headers.get('x-tpp-id');
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'x-fapi-interaction-id': interactionId
      }
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/open-banking-api', '');

  console.log(`[Open Banking API] ${req.method} ${path} - Interaction: ${interactionId} - TPP: ${tppId || 'none'}`);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Public endpoints (no TPP validation)
  if (path === '/openapi.json' || path === '/spec') {
    return jsonApiResponse(openAPISpec, 200, interactionId);
  }

  // POST /tpps - Register new TPP
  if (path === '/tpps' && req.method === 'POST') {
    const body = await req.json();
    const { tppId: newTppId, tppName, organizationId, registrationNumber, services, redirectUris, contactEmail, countryCode, regulatoryAuthority, qwacCertificate, qsealcCertificate } = body;

    if (!newTppId || !tppName || !services || !redirectUris) {
      return jsonApiError('Bad Request', 'Missing required TPP registration fields', 400, interactionId);
    }

    // Check if TPP already exists
    const { data: existingTpp } = await supabase
      .from('registered_tpps')
      .select('tpp_id')
      .eq('tpp_id', newTppId)
      .single();

    if (existingTpp) {
      return jsonApiError('Conflict', 'TPP already registered', 409, interactionId);
    }

    // Register TPP
    const { data: newTpp, error } = await supabase
      .from('registered_tpps')
      .insert({
        tpp_id: newTppId,
        tpp_name: tppName,
        organization_id: organizationId,
        registration_number: registrationNumber,
        services,
        redirect_uris: redirectUris,
        contact_email: contactEmail,
        country_code: countryCode,
        regulatory_authority: regulatoryAuthority,
        qwac_certificate: qwacCertificate,
        qsealc_certificate: qsealcCertificate,
        authorization_status: 'pending',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      })
      .select()
      .single();

    if (error) {
      console.error('[Open Banking API] TPP registration error:', error);
      return jsonApiError('Internal Error', 'Failed to register TPP', 500, interactionId);
    }

    await logAudit(supabase, {
      tppId: newTppId,
      endpoint: '/tpps',
      method: 'POST',
      requestBody: body,
      responseStatus: 201,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        id: newTpp.id,
        type: 'tpps',
        attributes: {
          tppId: newTpp.tpp_id,
          tppName: newTpp.tpp_name,
          authorizationStatus: newTpp.authorization_status,
          message: 'TPP registration received. Pending authorization review.'
        }
      }
    }, 201, interactionId);
  }

  // OAuth endpoints
  if (path === '/oauth/authorize') {
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const scope = url.searchParams.get('scope');
    const state = url.searchParams.get('state');
    const responseType = url.searchParams.get('response_type');

    if (responseType !== 'code') {
      return jsonApiError('Invalid Request', 'response_type must be "code"', 400, interactionId);
    }

    // Validate TPP for OAuth
    if (clientId) {
      const tppValidation = await validateTPP(clientId, supabase, '/oauth/authorize');
      if (!tppValidation.valid) {
        return jsonApiError('Unauthorized', tppValidation.error || 'TPP validation failed', 401, interactionId);
      }
    }

    const authCode = crypto.randomUUID();

    return jsonApiResponse({
      data: {
        type: 'authorization',
        attributes: {
          code: authCode,
          state,
          redirect_uri: redirectUri,
          message: 'In production, this would redirect to consent screen'
        }
      }
    }, 200, interactionId);
  }

  if (path === '/oauth/token' && req.method === 'POST') {
    const body = await req.json();
    const { grant_type, code, refresh_token, client_id, client_secret } = body;

    if (!['authorization_code', 'refresh_token'].includes(grant_type)) {
      return jsonApiError('Invalid Grant', 'Unsupported grant_type', 400, interactionId);
    }

    // Validate TPP
    if (client_id) {
      const tppValidation = await validateTPP(client_id, supabase, '/oauth/token');
      if (!tppValidation.valid) {
        return jsonApiError('Unauthorized', tppValidation.error || 'TPP validation failed', 401, interactionId);
      }
    }

    const accessToken = crypto.randomUUID();
    const newRefreshToken = crypto.randomUUID();

    return jsonApiResponse({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: 'accounts payments fundsconfirmation'
    }, 200, interactionId);
  }

  // Protected endpoints - require TPP validation
  const publicPaths = ['/openapi.json', '/spec', '/oauth/authorize', '/oauth/token', '/tpps'];
  if (!publicPaths.includes(path) && !path.startsWith('/tpps')) {
    // Validate TPP
    if (tppId) {
      const tppValidation = await validateTPP(tppId, supabase, path);
      if (!tppValidation.valid) {
        await logAudit(supabase, {
          tppId: tppId || 'unknown',
          endpoint: path,
          method: req.method,
          responseStatus: 401,
          interactionId,
          ipAddress
        });
        return jsonApiError('Unauthorized', tppValidation.error || 'TPP validation failed', 401, interactionId);
      }
    }
  }

  // Validate authentication for protected endpoints
  const authResult = await validateToken(req.headers.get('authorization'), supabase);

  if (!authResult.valid && !publicPaths.includes(path) && !path.startsWith('/tpps')) {
    return jsonApiError('Unauthorized', 'Valid OAuth 2.0 token required', 401, interactionId);
  }

  // GET /accounts - List accounts
  if (path === '/accounts' && req.method === 'GET') {
    if (!authResult.scopes?.includes('accounts')) {
      return jsonApiError('Forbidden', 'accounts scope required', 403, interactionId);
    }

    // Validate consent
    if (tppId && authResult.userId) {
      const consentValidation = await validateConsent(tppId, authResult.userId, 'accounts', supabase);
      if (!consentValidation.valid) {
        return jsonApiError('Forbidden', consentValidation.error || 'No valid consent', 403, interactionId);
      }
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, bp, tax_id, facturacion_anual')
      .eq('gestor_id', authResult.userId)
      .limit(50);

    if (error) {
      console.error('[Open Banking API] Error fetching accounts:', error);
      return jsonApiError('Internal Error', 'Failed to fetch accounts', 500, interactionId);
    }

    const accounts = (companies || []).map(company => ({
      id: company.id,
      type: 'accounts',
      attributes: {
        iban: company.bp || `AD00 0001 0000 ${company.id.substring(0, 12).toUpperCase()}`,
        currency: 'EUR',
        name: company.name,
        product: 'Business Account',
        status: 'enabled',
        cashAccountType: 'CACC'
      }
    }));

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'GET',
      responseStatus: 200,
      responseBody: { count: accounts.length },
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: accounts,
      links: {
        self: `${url.origin}${url.pathname}`
      },
      meta: {
        totalRecords: accounts.length
      }
    }, 200, interactionId);
  }

  // GET /accounts/:accountId - Account details
  const accountMatch = path.match(/^\/accounts\/([^\/]+)$/);
  if (accountMatch && req.method === 'GET') {
    if (!authResult.scopes?.includes('accounts')) {
      return jsonApiError('Forbidden', 'accounts scope required', 403, interactionId);
    }

    const accountId = accountMatch[1];

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !company) {
      return jsonApiError('Not Found', 'Account not found', 404, interactionId);
    }

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'GET',
      responseStatus: 200,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        id: company.id,
        type: 'accounts',
        attributes: {
          iban: company.bp || `AD00 0001 0000 ${company.id.substring(0, 12).toUpperCase()}`,
          currency: 'EUR',
          name: company.name,
          product: 'Business Account',
          status: 'enabled',
          cashAccountType: 'CACC',
          ownerName: company.name
        }
      }
    }, 200, interactionId);
  }

  // GET /accounts/:accountId/transactions
  const transactionsMatch = path.match(/^\/accounts\/([^\/]+)\/transactions$/);
  if (transactionsMatch && req.method === 'GET') {
    if (!authResult.scopes?.includes('accounts')) {
      return jsonApiError('Forbidden', 'accounts scope required', 403, interactionId);
    }

    const accountId = transactionsMatch[1];
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    let query = supabase
      .from('visits')
      .select('id, visit_date, result, notes, companies(name)')
      .eq('company_id', accountId)
      .order('visit_date', { ascending: false })
      .limit(100);

    if (fromDate) {
      query = query.gte('visit_date', fromDate);
    }
    if (toDate) {
      query = query.lte('visit_date', toDate);
    }

    const { data: visits, error } = await query;

    if (error) {
      console.error('[Open Banking API] Error fetching transactions:', error);
      return jsonApiError('Internal Error', 'Failed to fetch transactions', 500, interactionId);
    }

    const transactions = (visits || []).map((visit: any) => ({
      id: visit.id,
      type: 'transactions',
      attributes: {
        bookingDate: visit.visit_date,
        valueDate: visit.visit_date,
        transactionAmount: {
          amount: (Math.random() * 10000).toFixed(2),
          currency: 'EUR'
        },
        creditorName: visit.companies?.name || 'Unknown',
        remittanceInformationUnstructured: visit.notes || visit.result || 'Transaction'
      }
    }));

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'GET',
      responseStatus: 200,
      responseBody: { count: transactions.length },
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: transactions,
      links: {
        self: `${url.origin}${url.pathname}`
      },
      meta: {
        totalRecords: transactions.length
      }
    }, 200, interactionId);
  }

  // GET /accounts/:accountId/balances
  const balancesMatch = path.match(/^\/accounts\/([^\/]+)\/balances$/);
  if (balancesMatch && req.method === 'GET') {
    if (!authResult.scopes?.includes('accounts')) {
      return jsonApiError('Forbidden', 'accounts scope required', 403, interactionId);
    }

    const accountId = balancesMatch[1];

    const { data: company } = await supabase
      .from('companies')
      .select('facturacion_anual, ingresos_creand')
      .eq('id', accountId)
      .single();

    const balance = company?.facturacion_anual || 0;

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'GET',
      responseStatus: 200,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: [
        {
          balanceType: 'closingBooked',
          balanceAmount: {
            amount: balance.toFixed(2),
            currency: 'EUR'
          },
          referenceDate: new Date().toISOString().split('T')[0]
        },
        {
          balanceType: 'interimAvailable',
          balanceAmount: {
            amount: (balance * 0.9).toFixed(2),
            currency: 'EUR'
          },
          referenceDate: new Date().toISOString().split('T')[0]
        }
      ]
    }, 200, interactionId);
  }

  // POST /payments - Initiate payment
  if (path === '/payments' && req.method === 'POST') {
    if (!authResult.scopes?.includes('payments')) {
      return jsonApiError('Forbidden', 'payments scope required', 403, interactionId);
    }

    // Validate consent for payments
    if (tppId && authResult.userId) {
      const consentValidation = await validateConsent(tppId, authResult.userId, 'payments', supabase);
      if (!consentValidation.valid) {
        return jsonApiError('Forbidden', consentValidation.error || 'No valid consent for payments', 403, interactionId);
      }
    }

    const body = await req.json();
    const { debtorAccount, creditorAccount, creditorName, instructedAmount, remittanceInformationUnstructured } = body;

    if (!debtorAccount?.iban || !creditorAccount?.iban || !instructedAmount?.amount) {
      return jsonApiError('Bad Request', 'Missing required payment fields', 400, interactionId);
    }

    const paymentId = crypto.randomUUID();

    console.log(`[Open Banking API] Payment initiated: ${paymentId} - ${instructedAmount.amount} ${instructedAmount.currency}`);

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'POST',
      requestBody: body,
      responseStatus: 201,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        id: paymentId,
        type: 'payments',
        attributes: {
          transactionStatus: 'RCVD',
          paymentId,
          debtorAccount,
          creditorAccount,
          creditorName,
          instructedAmount,
          remittanceInformationUnstructured
        },
        links: {
          scaRedirect: `${url.origin}/sca/${paymentId}`,
          self: `${url.origin}/payments/${paymentId}`,
          status: `${url.origin}/payments/${paymentId}/status`
        }
      }
    }, 201, interactionId);
  }

  // POST /funds-confirmation
  if (path === '/funds-confirmation' && req.method === 'POST') {
    if (!authResult.scopes?.includes('fundsconfirmation')) {
      return jsonApiError('Forbidden', 'fundsconfirmation scope required', 403, interactionId);
    }

    const body = await req.json();
    const { account, instructedAmount } = body;

    if (!account?.iban || !instructedAmount?.amount) {
      return jsonApiError('Bad Request', 'Missing required fields', 400, interactionId);
    }

    const { data: company } = await supabase
      .from('companies')
      .select('facturacion_anual')
      .eq('bp', account.iban)
      .single();

    const availableFunds = company?.facturacion_anual || 0;
    const requestedAmount = parseFloat(instructedAmount.amount);
    const fundsAvailable = availableFunds >= requestedAmount;

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      endpoint: path,
      method: 'POST',
      requestBody: body,
      responseStatus: 200,
      responseBody: { fundsAvailable },
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        fundsAvailable
      }
    }, 200, interactionId);
  }

  // POST /consents - Create consent (PERSISTENT)
  if (path === '/consents' && req.method === 'POST') {
    if (!tppId) {
      return jsonApiError('Bad Request', 'x-tpp-id header required for consent creation', 400, interactionId);
    }

    if (!authResult.valid || !authResult.userId) {
      return jsonApiError('Unauthorized', 'User authentication required for consent', 401, interactionId);
    }

    const body = await req.json();
    const { access, recurringIndicator, validUntil, frequencyPerDay } = body;

    if (!access || !validUntil || frequencyPerDay === undefined) {
      return jsonApiError('Bad Request', 'Missing required consent fields', 400, interactionId);
    }

    const consentId = crypto.randomUUID();

    // Extract permissions from access object
    const permissions: string[] = [];
    if (access.accounts) permissions.push('accounts');
    if (access.balances) permissions.push('balances');
    if (access.transactions) permissions.push('transactions');
    if (access.payments) permissions.push('payments');

    // Store consent in database
    const { data: newConsent, error } = await supabase
      .from('open_banking_consents')
      .insert({
        consent_id: consentId,
        tpp_id: tppId,
        user_id: authResult.userId,
        status: 'pending',
        permissions,
        expiration_date: new Date(validUntil).toISOString(),
        frequency_per_day: frequencyPerDay,
        recurring_indicator: recurringIndicator || false,
        valid_until: validUntil,
        sca_status: 'required'
      })
      .select()
      .single();

    if (error) {
      console.error('[Open Banking API] Consent creation error:', error);
      return jsonApiError('Internal Error', 'Failed to create consent', 500, interactionId);
    }

    await logAudit(supabase, {
      tppId,
      userId: authResult.userId,
      consentId,
      endpoint: path,
      method: 'POST',
      requestBody: body,
      responseStatus: 201,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        id: consentId,
        type: 'consents',
        attributes: {
          consentId,
          consentStatus: 'received',
          access,
          recurringIndicator: recurringIndicator || false,
          validUntil,
          frequencyPerDay,
          _links: {
            scaRedirect: `${url.origin}/sca/consent/${consentId}`,
            scaStatus: `${url.origin}/consents/${consentId}/authorisations`,
            self: `${url.origin}/consents/${consentId}`,
            status: `${url.origin}/consents/${consentId}/status`
          }
        }
      }
    }, 201, interactionId);
  }

  // GET /consents/:consentId - Get consent status
  const consentGetMatch = path.match(/^\/consents\/([^\/]+)$/);
  if (consentGetMatch && req.method === 'GET') {
    const consentId = consentGetMatch[1];

    const { data: consent, error } = await supabase
      .from('open_banking_consents')
      .select('*')
      .eq('consent_id', consentId)
      .single();

    if (error || !consent) {
      return jsonApiError('Not Found', 'Consent not found', 404, interactionId);
    }

    return jsonApiResponse({
      data: {
        id: consent.consent_id,
        type: 'consents',
        attributes: {
          consentId: consent.consent_id,
          consentStatus: consent.status,
          permissions: consent.permissions,
          validUntil: consent.valid_until,
          frequencyPerDay: consent.frequency_per_day,
          recurringIndicator: consent.recurring_indicator,
          scaStatus: consent.sca_status,
          lastActionDate: consent.last_action_date
        }
      }
    }, 200, interactionId);
  }

  // DELETE /consents/:consentId - Revoke consent
  const consentDeleteMatch = path.match(/^\/consents\/([^\/]+)$/);
  if (consentDeleteMatch && req.method === 'DELETE') {
    const consentId = consentDeleteMatch[1];

    const { error } = await supabase
      .from('open_banking_consents')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('consent_id', consentId);

    if (error) {
      console.error('[Open Banking API] Consent revocation error:', error);
      return jsonApiError('Internal Error', 'Failed to revoke consent', 500, interactionId);
    }

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      consentId,
      endpoint: path,
      method: 'DELETE',
      responseStatus: 204,
      interactionId,
      ipAddress
    });

    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'x-fapi-interaction-id': interactionId
      }
    });
  }

  // POST /consents/:consentId/authorise - Authorize consent (after SCA)
  const consentAuthoriseMatch = path.match(/^\/consents\/([^\/]+)\/authorise$/);
  if (consentAuthoriseMatch && req.method === 'POST') {
    const consentId = consentAuthoriseMatch[1];

    const { error } = await supabase
      .from('open_banking_consents')
      .update({ 
        status: 'authorized',
        authorized_at: new Date().toISOString(),
        sca_status: 'finalised'
      })
      .eq('consent_id', consentId);

    if (error) {
      console.error('[Open Banking API] Consent authorization error:', error);
      return jsonApiError('Internal Error', 'Failed to authorize consent', 500, interactionId);
    }

    await logAudit(supabase, {
      tppId: tppId || 'direct',
      userId: authResult.userId,
      consentId,
      endpoint: path,
      method: 'POST',
      responseStatus: 200,
      interactionId,
      ipAddress
    });

    return jsonApiResponse({
      data: {
        consentId,
        consentStatus: 'authorized',
        scaStatus: 'finalised'
      }
    }, 200, interactionId);
  }

  // Not found
  return jsonApiError('Not Found', `Endpoint ${path} not found`, 404, interactionId);
});
