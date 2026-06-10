function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  if (typeof input === "string") return new TextEncoder().encode(input);
  throw new Error("SHA-256 input must be an ArrayBuffer or Uint8Array");
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input) {
  const bytes = toBytes(input);
  if (globalThis.crypto?.subtle) {
    return hex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)));
  }

  if (typeof process !== "undefined") {
    const { createHash } = await Function("return import('node:crypto')")();
    return createHash("sha256").update(bytes).digest("hex");
  }

  throw new Error("Web Crypto SHA-256 is unavailable");
}
