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

  assert.match(qrUrl, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.doesNotMatch(qrUrl, /api\.qrserver\.com/);

  const svg = decodeURIComponent(qrUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
  assert.match(svg, /<svg\b/);
  assert.match(svg, /viewBox=/);
});
