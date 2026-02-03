/**
 * OAuth 2.0 Token Endpoint
 * Handles client_credentials and authorization_code grants
 * 
 * For static credentials, validates client_id/client_secret and returns a bearer token
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { storeToken } from '@/app/api/mcp/lib/auth';
import { getAuthCode, deleteAuthCode, verifyCodeChallenge } from '@/app/api/mcp/lib/oauth-store';

// Static credentials from environment
const STATIC_CLIENT_ID = process.env.STATIC_CLIENT_ID || process.env.MCP_CLIENT_ID || 'lifedashboard-mcp-client';
const STATIC_CLIENT_SECRET = process.env.STATIC_CLIENT_SECRET || process.env.MCP_CLIENT_SECRET || 'lifedashboard-mcp-secret-2024';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest): Promise<Response> {
  console.log('[OAuth Token] === Token request received ===');
  
  let body: URLSearchParams;
  let rawBody = '';
  
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('[OAuth Token] Content-Type:', contentType);
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      rawBody = await request.text();
      body = new URLSearchParams(rawBody);
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      rawBody = JSON.stringify(json);
      body = new URLSearchParams(json);
    } else {
      rawBody = await request.text();
      body = new URLSearchParams(rawBody);
    }
    
    console.log('[OAuth Token] Body params:', Object.fromEntries(body.entries()));
  } catch (err) {
    console.error('[OAuth Token] Parse error:', err);
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Could not parse request body' },
      { status: 400, headers: corsHeaders }
    );
  }

  const grantType = body.get('grant_type');
  let clientId = body.get('client_id');
  let clientSecret = body.get('client_secret');
  const scope = body.get('scope') || 'mcp:read mcp:write';

  console.log('[OAuth Token] grant_type:', grantType);
  console.log('[OAuth Token] client_id:', clientId);
  console.log('[OAuth Token] client_secret present:', !!clientSecret);

  // Check for Basic auth header if credentials not in body
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [id, secret] = credentials.split(':');
      if (!clientId) clientId = id;
      if (!clientSecret) clientSecret = secret;
      console.log('[OAuth Token] Extracted from Basic auth - client_id:', clientId);
    } catch {
      // Ignore parsing errors
    }
  }

  // Validate grant type
  if (!grantType) {
    console.log('[OAuth Token] ERROR: Missing grant_type');
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
    console.log('[OAuth Token] Processing authorization_code grant');
    
    const code = body.get('code');
    const redirectUri = body.get('redirect_uri');
    const codeVerifier = body.get('code_verifier');

    console.log('[OAuth Token] code:', code?.substring(0, 20) + '...');
    console.log('[OAuth Token] redirect_uri:', redirectUri);
    console.log('[OAuth Token] code_verifier present:', !!codeVerifier);

    if (!code) {
      console.log('[OAuth Token] ERROR: Missing code');
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing code parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate the authorization code using shared store
    const authCode = getAuthCode(code);
    console.log('[OAuth Token] Auth code found:', !!authCode);
    if (authCode) {
      console.log('[OAuth Token] Stored auth code data:', {
        clientId: authCode.clientId,
        redirectUri: authCode.redirectUri,
        scope: authCode.scope,
        hasPKCE: !!authCode.codeChallenge,
        codeChallengeMethod: authCode.codeChallengeMethod,
      });
    }
    
    if (!authCode) {
      console.log('[OAuth Token] ERROR: Invalid or expired code');
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify PKCE code_verifier if code_challenge was provided
    if (authCode.codeChallenge) {
      console.log('[OAuth Token] Verifying PKCE...');
      if (!codeVerifier) {
        console.log('[OAuth Token] ERROR: Missing code_verifier for PKCE');
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing code_verifier for PKCE' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      const pkceValid = verifyCodeChallenge(codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod);
      console.log('[OAuth Token] PKCE verification result:', pkceValid);
      
      if (!pkceValid) {
        console.log('[OAuth Token] ERROR: Invalid code_verifier');
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid code_verifier' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Verify redirect URI matches
    if (redirectUri && authCode.redirectUri !== redirectUri) {
      console.log('[OAuth Token] ERROR: Redirect URI mismatch');
      console.log('[OAuth Token] Expected:', authCode.redirectUri);
      console.log('[OAuth Token] Got:', redirectUri);
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify client ID matches (client_id is optional for public clients with PKCE)
    if (clientId && clientId !== authCode.clientId) {
      console.log('[OAuth Token] ERROR: Client ID mismatch');
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Client ID mismatch' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Delete the used code
    deleteAuthCode(code);
    console.log('[OAuth Token] Code deleted, generating token...');

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
