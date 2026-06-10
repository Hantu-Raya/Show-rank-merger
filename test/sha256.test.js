import test from "node:test";
import assert from "node:assert/strict";

import { sha256Hex } from "../src/sha256.js";

test("sha256Hex hashes abc", async () => {
  assert.equal(await sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
