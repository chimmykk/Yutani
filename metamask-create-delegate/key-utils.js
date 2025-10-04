import 'dotenv/config';

export function getPrivateKeyHex() {
  const raw = process.env.PRIVATE_KEY;
  if (!raw) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  let pk = String(raw).trim();

  if ((pk.startsWith('"') && pk.endsWith('"')) || (pk.startsWith('\'') && pk.endsWith('\''))) {
    pk = pk.slice(1, -1).trim();
  }

  if (!pk.startsWith('0x') && !pk.startsWith('0X')) {
    pk = '0x' + pk;
  }

  const hexRegex = /^0x[0-9a-fA-F]+$/;
  if (!hexRegex.test(pk)) {
    throw new Error('PRIVATE_KEY must be a hex string (0x-prefixed).');
  }

  const byteLen = (pk.length - 2) / 2;
  if (byteLen !== 32) {
    throw new Error(`PRIVATE_KEY must be 32 bytes, got ${byteLen} bytes.`);
  }

  return pk;
}


