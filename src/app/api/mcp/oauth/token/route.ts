/**
 * OAuth 2.0 Token Endpoint
 * Handles client_credentials and authorization_code grants
 * 
 * For static credentials, validates client_id/client_secret and returns a bearer token
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { storeToken } from '@/app/api/mcp/lib/auth';

// Static credentials from environment
const STATIC_CLIENT_ID = process.env.STATIC_CLIENT_ID || process.env.MCP_CLIENT_ID || 'lifedashboard-mcp-client';
const STATIC_CLIENT_SECRET = process.env.STATIC_CLIENT_SECRET || process.env.MCP_CLIENT_SECRET || 'lifedashboard-mcp-secret-2024';

// Authorization code store for authorization_code grant
const authCodeStore = new Map<string, { clientId: string; redirectUri: string; scope: string; expiresAt: number }>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: URLSearchParams;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = new URLSearchParams(text);
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      body = new URLSearchParams(json);
    } else {
      // Try to parse as form data
      const text = await request.text();
      body = new URLSearchParams(text);
    }
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Could not parse request body' },
      { status: 400, headers: corsHeaders }
    );
  }

  const grantType = body.get('grant_type');
  let clientId = body.get('client_id');
  let clientSecret = body.get('client_secret');
  const scope = body.get('scope') || 'mcp:read mcp:write';

  // Check for Basic auth header if credentials not in body
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [id, secret] = credentials.split(':');
      if (!clientId) clientId = id;
      if (!clientSecret) clientSecret = secret;
    } catch {
      // Ignore parsing errors
    }
  }

  // Validate grant type
  if (!grantType) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing grant_type parameter' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (grantType === 'client_credentials') {
    // Validate client credentials
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing client credentials' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (clientId !== STATIC_CLIENT_ID || clientSecret !== STATIC_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate access token
    const accessToken = generateToken();
    const expiresIn = 3600; // 1 hour
    const expiresAt = Date.now() + expiresIn * 1000;

    // Store the token in the shared auth store
    storeToken(accessToken, { clientId, expiresAt, scope });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope,
      },
      { status: 200, headers: corsHeaders }
    );
  } else if (grantType === 'authorization_code') {
    const code = body.get('code');
    const redirectUri = body.get('redirect_uri');

    if (!code) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing code parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate the authorization code
    const authCode = authCodeStore.get(code);
    if (!authCode || authCode.expiresAt < Date.now()) {
      authCodeStore.delete(code);
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify redirect URI matches
    if (redirectUri && authCode.redirectUri !== redirectUri) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify client credentials
    if (clientId !== authCode.clientId) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Client ID mismatch' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Delete the used code
    authCodeStore.delete(code);

    // Generate access token
    const accessToken = generateToken();
    const expiresIn = 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    storeToken(accessToken, { clientId: authCode.clientId, expiresAt, scope: authCode.scope });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: authCode.scope,
      },
      { status: 200, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type', error_description: `Grant type '${grantType}' is not supported` },
    { status: 400, headers: corsHeaders }
  );
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Export for authorization endpoint
export function storeAuthCode(code: string, data: { clientId: string; redirectUri: string; scope: string }): void {
  authCodeStore.set(code, { ...data, expiresAt: Date.now() + 600000 }); // 10 min expiry
}
