/**
 * Shared OAuth stores for authorization codes and PKCE
 * Uses file-based storage to work across Next.js API route processes
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Use /tmp for cross-process storage
const STORE_FILE = path.join('/tmp', 'oauth-codes.json');

// Authorization code store
export interface AuthCodeData {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: number;
}

interface StoreData {
  [code: string]: AuthCodeData;
}

function readStore(): StoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('[OAuth Store] Error reading store:', e);
  }
  return {};
}

function writeStore(data: StoreData): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('[OAuth Store] Error writing store:', e);
  }
}

export function storeAuthCode(code: string, data: Omit<AuthCodeData, 'expiresAt'>): void {
  console.log('[OAuth Store] Storing code:', code.substring(0, 20) + '...');
  const store = readStore();
  console.log('[OAuth Store] Store size before:', Object.keys(store).length);
  
  store[code] = { 
    ...data, 
    expiresAt: Date.now() + 600000 // 10 min expiry
  };
  
  writeStore(store);
  console.log('[OAuth Store] Store size after:', Object.keys(store).length);
  console.log('[OAuth Store] Stored to file:', STORE_FILE);
}

export function getAuthCode(code: string): AuthCodeData | undefined {
  console.log('[OAuth Store] Getting code:', code.substring(0, 20) + '...');
  const store = readStore();
  console.log('[OAuth Store] Store size:', Object.keys(store).length);
  console.log('[OAuth Store] All keys:', Object.keys(store).map(k => k.substring(0, 20) + '...'));
  
  const data = store[code];
  console.log('[OAuth Store] Found data:', !!data);
  
  if (data && data.expiresAt < Date.now()) {
    console.log('[OAuth Store] Code expired, deleting');
    delete store[code];
    writeStore(store);
    return undefined;
  }
  return data;
}

export function deleteAuthCode(code: string): void {
  const store = readStore();
  delete store[code];
  writeStore(store);
}

/**
 * PKCE code verifier validation
 * Supports S256 and plain methods
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string = 'S256'
): boolean {
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }
  
  if (method === 'S256') {
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return hash === codeChallenge;
  }
  
  return false;
}
