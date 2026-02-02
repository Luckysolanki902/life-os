/**
 * OAuth 2.0 Authorization Server Metadata
 * RFC 8414 - Used by ChatGPT/OpenAI to discover OAuth endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  // Get the base URL from the request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const metadata = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['client_credentials', 'authorization_code'],
    response_types_supported: ['code', 'token'],
    scopes_supported: ['mcp:read', 'mcp:write', 'mcp:admin'],
    service_documentation: `${baseUrl}/api/mcp/info`,
    code_challenge_methods_supported: ['S256', 'plain'],
  };

  return NextResponse.json(metadata, {
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
