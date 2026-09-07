import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../src/routes/v1/import-export.js";

test("parseCsv: parses simple rows", () => {
  const rows = parseCsv("a,b,c\n1,2,3\n");
  assert.deepEqual(rows, [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ]);
});

test("parseCsv: handles quoted fields with commas and escaped quotes", () => {
  const rows = parseCsv('name,notes\n"Smith, John","said ""hi"""\n');
  assert.deepEqual(rows, [
    ["name", "notes"],
    ["Smith, John", 'said "hi"'],
  ]);
});

test("parseCsv: skips blank lines and trailing empty lines", () => {
  const rows = parseCsv("a,b\n\n\n1,2\n\n");
  assert.deepEqual(rows, [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsv: strips BOM", () => {
  const rows = parseCsv("\uFEFFa,b\n1,2\n");
  assert.equal(rows[0]?.[0], "a");
});

test("parseCsv: handles CRLF line endings and final line without newline", () => {
  const rows = parseCsv("a,b\r\n1,2\r\n3,4");
  assert.deepEqual(rows, [
    ["a", "b"],
    ["1", "2"],
    ["3", "4"],
  ]);
});

test("parseCsv: handles multiline quoted field", () => {
  const rows = parseCsv('a\n"line1\nline2"\n');
  assert.deepEqual(rows, [["a"], ["line1\nline2"]]);
});