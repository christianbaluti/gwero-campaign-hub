import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCostSheetRow,
  defaultCostSheetColumnRules,
  normalizeCostSheetColumnRules,
} from "../src/lib/cost-sheet-formula.ts";

const item = {
  quantity: 2,
  unit_cost: 50,
  markup_percent: 20,
  custom_values: {},
};

test("default cost sheet rules preserve the existing calculations", () => {
  const result = calculateCostSheetRow(item, [], defaultCostSheetColumnRules);
  assert.equal(result.lineCost, 100);
  assert.equal(result.sellPrice, 120);
  assert.equal(result.grossProfit, 20);
  assert.deepEqual(result.errors, {});
});

test("a system Sell Price rule can include a numeric custom column", () => {
  const rules = normalizeCostSheetColumnRules(defaultCostSheetColumnRules);
  rules.sell_price.formulaExpression = "line_cost + delivery_fee";
  const result = calculateCostSheetRow(
    { ...item, custom_values: { delivery_fee: 25 } },
    [
      {
        column_key: "delivery_fee",
        data_type: "number",
        default_value: "0",
        formula_expression: null,
      },
    ],
    rules,
  );
  assert.equal(result.sellPrice, 125);
  assert.equal(result.grossProfit, 25);
});

test("system columns can depend on calculated custom columns", () => {
  const rules = normalizeCostSheetColumnRules(defaultCostSheetColumnRules);
  rules.sell_price.formulaExpression = "line_cost + handling_total";
  const result = calculateCostSheetRow(
    { ...item, custom_values: { handling_rate: 10 } },
    [
      {
        column_key: "handling_rate",
        data_type: "number",
        default_value: "0",
        formula_expression: null,
      },
      {
        column_key: "handling_total",
        data_type: "formula",
        default_value: null,
        formula_expression: "line_cost * handling_rate / 100",
      },
    ],
    rules,
  );
  assert.equal(result.custom["handling_total"], 10);
  assert.equal(result.sellPrice, 110);
});

test("circular rules return formula errors instead of incorrect totals", () => {
  const rules = normalizeCostSheetColumnRules(defaultCostSheetColumnRules);
  rules.line_cost.formulaExpression = "sell_price";
  rules.sell_price.formulaExpression = "line_cost";
  const result = calculateCostSheetRow(item, [], rules);
  assert.match(result.errors["line_cost"] || "", /Circular/);
  assert.match(result.errors["sell_price"] || "", /Circular/);
});

test("partial stored rules retain safe defaults", () => {
  const rules = normalizeCostSheetColumnRules({
    sell_price: { label: "Customer price", formulaExpression: "line_cost + freight" },
  });
  assert.equal(rules.quantity.defaultValue, 1);
  assert.equal(rules.line_cost.formulaExpression, "quantity * unit_cost");
  assert.equal(rules.sell_price.label, "Customer price");
  assert.equal(rules.sell_price.formulaExpression, "line_cost + freight");
});
