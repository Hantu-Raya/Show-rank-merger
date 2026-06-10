import { crc32 } from "./crc32.js";

const HEADER_SIZE = 16;
const BLOCK_ENTRY_SIZE = 12;
const DATA_ALIGNMENT = 16;

function align(value, boundary) {
  return Math.ceil(value / boundary) * boundary;
}

function writeFourCc(bytes, offset, value) {
  for (let i = 0; i < 4; i += 1) {
    bytes[offset + i] = value.charCodeAt(i);
  }
}

function createResourceBytes(payloadSize, dataOffset, resourceVersion = 0) {
  const fileSize = dataOffset + payloadSize;
  const bytes = new Uint8Array(fileSize);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, fileSize, true);
  view.setUint16(4, 12, true);
  view.setUint16(6, resourceVersion, true);
  view.setUint32(8, 8, true);
  view.setUint32(12, 1, true);

  writeFourCc(bytes, 16, "DATA");
  view.setUint32(20, dataOffset - 20, true);
  view.setUint32(24, payloadSize, true);

  return { bytes, view };
}

export function compileTextResource(sourceText, { resourceVersion = 0 } = {}) {
  const sourceBytes = new TextEncoder().encode(String(sourceText ?? ""));
  const dataOffset = align(HEADER_SIZE + BLOCK_ENTRY_SIZE, DATA_ALIGNMENT);
  const { bytes } = createResourceBytes(sourceBytes.byteLength, dataOffset, resourceVersion);
  bytes.set(sourceBytes, dataOffset);

  return bytes;
}

function compilePanoramaResource(sourceText) {
  const sourceBytes = new TextEncoder().encode(String(sourceText ?? ""));
  const payloadSize = 4 + 2 + sourceBytes.byteLength;
  const dataOffset = align(HEADER_SIZE + BLOCK_ENTRY_SIZE, DATA_ALIGNMENT);
  const { bytes, view } = createResourceBytes(payloadSize, dataOffset);

  view.setUint32(dataOffset, crc32(sourceBytes), true);
  view.setUint16(dataOffset + 4, 0, true);
  bytes.set(sourceBytes, dataOffset + 6);

  return bytes;
}

export function compilePanoramaLayoutResource(sourceText) {
  return compilePanoramaResource(sourceText);
}

export function compilePanoramaStyleResource(sourceText) {
  return compilePanoramaResource(sourceText);
}
