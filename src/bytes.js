export function toUint8Array(input, label = "Input") {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error(`${label} must be an ArrayBuffer or Uint8Array`);
}
