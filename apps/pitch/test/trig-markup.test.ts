import test from "node:test";
import assert from "node:assert/strict";
import {trigMarkup} from "../src/trig-markup.ts";

test("TriG highlighting preserves text and escapes authored markup", () => {
  const source = ':Gerrit schema:name "<script>:Name</script>" ; # :Comment\n :worksFor :UDE .';
  const markup = trigMarkup(source);
  assert.match(markup, /<strong[^>]+>Gerrit<\/strong>/);
  assert.doesNotMatch(markup, /<script>|<strong[^>]+>Name|<strong[^>]+>Comment/);
  const text = markup.replace(/<[^>]*>/g, "").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
  assert.equal(text, source);
});
