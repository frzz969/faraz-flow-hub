import { test } from "node:test";
import assert from "node:assert/strict";
import { inferAlias } from "../src/services/crud.js";

test("inferAlias: bare table (no alias)", () => {
  assert.equal(inferAlias("customers", "FROM customers"), "customers");
});

test("inferAlias: aliased join", () => {
  assert.equal(inferAlias("shipments", "FROM shipments s LEFT JOIN customers c ON c.id = s.customer_id"), "s");
});

test("inferAlias: multi-word join", () => {
  assert.equal(
    inferAlias(
      "dispatches",
      "FROM dispatches dp LEFT JOIN routes r ON r.id = dp.route_id LEFT JOIN shipments s ON s.id = dp.shipment_id"
    ),
    "dp"
  );
});

test("inferAlias: backtick-quoted table with alias", () => {
  assert.equal(inferAlias("orders", "FROM `orders` o LEFT JOIN customers c ON c.id = o.customer_id"), "o");
});