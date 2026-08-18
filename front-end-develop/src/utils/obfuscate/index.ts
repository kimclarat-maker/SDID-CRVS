// Using the Web Crypto API for better security
export async function encryptData(data: any, secretKey: any) {
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM" },
    secretKey,
    encoded
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptData(encryptedData: any, secretKey: any) {
  const encryptedArray = Uint8Array.from(atob(encryptedData), (c) =>
    c.charCodeAt(0)
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM" },
    secretKey,
    encryptedArray
  );
  return new TextDecoder().decode(decrypted);
}
