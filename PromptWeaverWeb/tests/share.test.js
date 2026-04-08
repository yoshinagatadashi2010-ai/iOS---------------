import test from "node:test";
import assert from "node:assert/strict";

import { buildQrCodeImageUrl, isShareableHttpUrl } from "../src/core/export.js";

test("share url validation accepts http and https", () => {
  assert.equal(isShareableHttpUrl("https://example.com/app"), true);
  assert.equal(isShareableHttpUrl("http://192.168.1.20:4173/"), true);
  assert.equal(isShareableHttpUrl("ftp://example.com"), false);
  assert.equal(isShareableHttpUrl("not-a-url"), false);
});

test("qr code image url encodes share url", () => {
  const qrUrl = buildQrCodeImageUrl("https://example.com/app?mode=mobile");

  assert.match(qrUrl, /^https:\/\/api\.qrserver\.com\/v1\/create-qr-code\//);
  assert.match(qrUrl, /data=https%3A%2F%2Fexample\.com%2Fapp%3Fmode%3Dmobile/);
});
