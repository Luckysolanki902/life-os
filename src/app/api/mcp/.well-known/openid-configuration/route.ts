/**
 * OpenID Connect Discovery
 * Used by some clients (like ChatGPT) to discover OAuth/OIDC endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  // Check for forwarded headers from proxy/tunnel
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Fallback to request URL
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const baseUrl = getBaseUrl(request);
  
  const configuration = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/mcp/oauth/userinfo`,
    jwks_uri: `${baseUrl}/api/mcp/.well-known/jwks.json`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register`,
    scopes_supported: ['openid', 'profile', 'mcp:read', 'mcp:write', 'mcp:admin'],
    response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'HS256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'name', 'email'],
    code_challenge_methods_supported: ['S256', 'plain'],
  };

  return NextResponse.json(configuration, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
