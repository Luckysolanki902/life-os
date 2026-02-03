/**
 * Static MCP Authentication
 * Uses a simple client_id + client_secret pair for authentication
 * Also supports OAuth bearer tokens from the token endpoint
 */

import fs from 'fs';
import path from 'path';

// Static credentials - in production, use environment variables
const STATIC_CLIENT_ID = process.env.STATIC_CLIENT_ID || process.env.MCP_CLIENT_ID || 'lifedashboard-mcp-client';
const STATIC_CLIENT_SECRET = process.env.STATIC_CLIENT_SECRET || process.env.MCP_CLIENT_SECRET || 'lifedashboard-mcp-secret-2024';

// File-based token store for cross-process sharing
const TOKEN_STORE_FILE = path.join('/tmp', 'oauth-tokens.json');

interface TokenData {
  clientId: string;
  expiresAt: number;
  scope: string;
}

interface TokenStoreData {
  [token: string]: TokenData;
}

function readTokenStore(): TokenStoreData {
  try {
    if (fs.existsSync(TOKEN_STORE_FILE)) {
      const data = fs.readFileSync(TOKEN_STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('[Token Store] Error reading store:', e);
  }
  return {};
}

function writeTokenStore(data: TokenStoreData): void {
  try {
    fs.writeFileSync(TOKEN_STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('[Token Store] Error writing store:', e);
  }
}

// Export for token endpoint to store tokens
export function storeToken(token: string, data: TokenData): void {
  console.log('[Token Store] Storing token:', token.substring(0, 20) + '...');
  const store = readTokenStore();
  store[token] = data;
  writeTokenStore(store);
  console.log('[Token Store] Token stored to file');
}

// Export for token cleanup
export function removeToken(token: string): void {
  const store = readTokenStore();
  delete store[token];
  writeTokenStore(store);
}

function getToken(token: string): TokenData | undefined {
  const store = readTokenStore();
  return store[token];
}

export interface AuthResult {
  valid: boolean;
  error?: string;
  clientId?: string;
}

/**
 * Validates the Authorization header for MCP requests
 * Supports: Basic auth, Bearer token (OAuth), or Bearer client_id:client_secret
 */
export function validateAuth(request: Request): AuthResult {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }
  
  // Support both Basic and Bearer auth
  if (authHeader.startsWith('Basic ')) {
    return validateBasicAuth(authHeader);
  } else if (authHeader.startsWith('Bearer ')) {
    return validateBearerAuth(authHeader);
  }
  
  return { valid: false, error: 'Invalid Authorization scheme. Use Basic or Bearer.' };
}

function validateBasicAuth(authHeader: string): AuthResult {
  try {
    const base64Credentials = authHeader.slice(6); // Remove 'Basic '
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [clientId, clientSecret] = credentials.split(':');
    
    if (clientId === STATIC_CLIENT_ID && clientSecret === STATIC_CLIENT_SECRET) {
      return { valid: true, clientId };
    }
    
    return { valid: false, error: 'Invalid client credentials' };
  } catch {
    return { valid: false, error: 'Invalid Basic auth encoding' };
  }
}

function validateBearerAuth(authHeader: string): AuthResult {
  const token = authHeader.slice(7); // Remove 'Bearer '
  
  console.log('[Auth] Validating bearer token:', token.substring(0, 20) + '...');
  
  // First, check if it's an OAuth token from the token store
  const tokenData = getToken(token);
  console.log('[Auth] Token found in store:', !!tokenData);
  
  if (tokenData) {
    if (tokenData.expiresAt < Date.now()) {
      console.log('[Auth] Token expired');
      removeToken(token);
      return { valid: false, error: 'Token expired' };
    }
    console.log('[Auth] Token valid for client:', tokenData.clientId);
    return { valid: true, clientId: tokenData.clientId };
  }
  
  // Fall back to checking if it's client_id:client_secret format
  try {
    const [clientId, clientSecret] = token.split(':');
    
    if (clientId === STATIC_CLIENT_ID && clientSecret === STATIC_CLIENT_SECRET) {
      return { valid: true, clientId };
    }
    
    console.log('[Auth] Token not found and not client_id:secret format');
    return { valid: false, error: 'Invalid bearer token' };
  } catch {
    return { valid: false, error: 'Invalid Bearer token format' };
  }
}

/**
 * Creates the Basic auth header value for client usage
 */
export function createAuthHeader(): string {
  const credentials = `${STATIC_CLIENT_ID}:${STATIC_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Gets the static credentials for documentation
 */
export function getCredentials() {
  return {
    clientId: STATIC_CLIENT_ID,
    clientSecret: STATIC_CLIENT_SECRET,
  };
}
