export async function digestMessage(message: string) {
  if (message == null) {
    return null;
  }
  if (typeof crypto !== 'object') {
    const crypto = require('crypto');
    return (crypto as any)
      .createHash('sha256', '')
      .update(message)
      .digest('hex')
      .toString();
  } else {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return Promise.resolve(hashHex);
  }
}
