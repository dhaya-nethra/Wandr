/**
 * NATPAC End-to-End Encryption Module
 *
 * Architecture:
 * - Each participant's data is encrypted with AES-256-GCM
 * - Encryption key is derived via PBKDF2 from the government master key + participantId
 * - Only the government master key holder (NATPAC admin) can decrypt all participants' data
 * - Participants can only ever see & decrypt their own data
 *
 * In production, the master key would be stored in a Hardware Security Module (HSM)
 * on a government-controlled server, never exposed client-side.
 * This demo simulates that key being required at admin login time.
 */

const PBKDF2_ITERATIONS = 100_000;
const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/** Derive a per-participant AES-256 key from the master key + participant ID */
async function deriveKey(masterKey: string, participantId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`natpac-salt-${participantId}`),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: KEY_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using the participant's derived key.
 * Returns a base64-encoded string: [12-byte IV][ciphertext].
 */
export async function encryptData(
  data: unknown,
  participantId: string,
  masterKey: string
): Promise<string> {
  const key = await deriveKey(masterKey, participantId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: KEY_ALGORITHM, iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), IV_LENGTH);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded encrypted string.
 * Throws if decryption fails (wrong key or tampered data).
 */
export async function decryptData(
  encryptedStr: string,
  participantId: string,
  masterKey: string
): Promise<unknown> {
  const key = await deriveKey(masterKey, participantId);
  const combined = Uint8Array.from(atob(encryptedStr), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: KEY_ALGORITHM, iv },
    key,
    ciphertext
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Hash a string with SHA-256 and return hex.
 * Used to anonymise participant IDs in audit logs.
 */
export async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password/PIN with PBKDF2 for storage comparison.
 */
export async function hashCredential(credential: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(credential),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 200_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

/**
 * Verify a government master key by attempting to derive a known test value.
 * This lets the admin login without storing the key anywhere.
 */
export async function verifyMasterKey(candidateKey: string): Promise<boolean> {
  // We test by encrypting a known sentinel and checking decryption succeeds
  const SENTINEL_ID = '__natpac_key_test__';
  const SENTINEL_DATA = { valid: true, timestamp: '2024-01-01' };
  const STORED_KEY = 'natpac_key_sentinel';

  try {
    const stored = localStorage.getItem(STORED_KEY);
    if (!stored) {
      // First time: encrypt and store sentinel
      const enc = await encryptData(SENTINEL_DATA, SENTINEL_ID, candidateKey);
      localStorage.setItem(STORED_KEY, enc);
      return true;
    }

    // Try to decrypt with candidate key
    const result = await decryptData(stored, SENTINEL_ID, candidateKey) as typeof SENTINEL_DATA;
    return result?.valid === true;
  } catch {
    return false;
  }
}
