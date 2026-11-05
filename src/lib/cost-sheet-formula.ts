export type FormulaContext = Record<string, number>;

export const costSheetSystemColumnKeys = [
  "quantity",
  "unit_cost",
  "markup_percent",
  "line_cost",
  "sell_price",
  "gross_profit",
] as const;

export type CostSheetSystemColumnKey = (typeof costSheetSystemColumnKeys)[number];
export type CostSheetSystemColumnRule = {
  label: string;
  defaultValue?: number;
  formulaExpression?: string;
};
export type CostSheetSystemColumnRules = Record<
  CostSheetSystemColumnKey,
  CostSheetSystemColumnRule
>;

export const defaultCostSheetColumnRules: CostSheetSystemColumnRules = {
  quantity: { label: "Qty", defaultValue: 1 },
  unit_cost: { label: "Unit cost", defaultValue: 0 },
  markup_percent: { label: "Markup", defaultValue: 0 },
  line_cost: { label: "Line cost", formulaExpression: "quantity * unit_cost" },
  sell_price: {
    label: "Sell price",
    formulaExpression: "line_cost * (1 + markup_percent / 100)",
  },
  gross_profit: { label: "Gross profit", formulaExpression: "sell_price - line_cost" },
};

export function normalizeCostSheetColumnRules(value: unknown): CostSheetSystemColumnRules {
  let source: Record<string, unknown> = {};
  if (typeof value === "string" && value.trim()) {
    try {
      source = JSON.parse(value) as Record<string, unknown>;
    } catch {
      source = {};
    }
  } else if (value && typeof value === "object") source = value as Record<string, unknown>;

  return Object.fromEntries(
    costSheetSystemColumnKeys.map((key) => {
      const fallback = defaultCostSheetColumnRules[key];
      const candidate =
        source[key] && typeof source[key] === "object"
          ? (source[key] as Record<string, unknown>)
          : {};
      const label =
        typeof candidate["label"] === "string" && candidate["label"].trim()
          ? candidate["label"].trim()
          : fallback.label;
      if ("defaultValue" in fallback) {
        const defaultValue = Number(candidate["defaultValue"] ?? fallback.defaultValue);
        return [
          key,
          {
            label,
            defaultValue: Number.isFinite(defaultValue) ? defaultValue : fallback.defaultValue,
          },
        ];
      }
      const formulaExpression =
        typeof candidate["formulaExpression"] === "string" && candidate["formulaExpression"].trim()
          ? candidate["formulaExpression"].trim().toLowerCase()
          : fallback.formulaExpression;
      return [key, { label, formulaExpression }];
    }),
  ) as CostSheetSystemColumnRules;
}

type CalculableColumn = {
  column_key: string;
  data_type: "text" | "number" | "formula";
  default_value: string | null;
  formula_expression: string | null;
};

type CalculableItem = {
  quantity: number;
  unit_cost: number;
  markup_percent: number;
  custom_values: Record<string, string | number>;
};

export type CostSheetRowCalculation = {
  lineCost: number;
  sellPrice: number;
  grossProfit: number;
  custom: Record<string, string | number>;
  errors: Record<string, string>;
};

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "left" }
  | { type: "right" };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < expression.length) {
    const rest = expression.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ type: "identifier", value: identifier[0].toLowerCase() });
      index += identifier[0].length;
      continue;
    }
    const character = expression[index]!;
    if (character === "(") tokens.push({ type: "left" });
    else if (character === ")") tokens.push({ type: "right" });
    else if (["+", "-", "*", "/", "^"].includes(character))
      tokens.push({ type: "operator", value: character as "+" | "-" | "*" | "/" | "^" });
    else throw new Error(`Unsupported character "${character}".`);
    index += 1;
  }
  if (!tokens.length) throw new Error("Enter a formula.");
  return tokens;
}

class FormulaParser {
  private index = 0;
  private readonly tokens: Token[];
  private readonly context: FormulaContext;

  constructor(tokens: Token[], context: FormulaContext) {
    this.tokens = tokens;
    this.context = context;
  }

  parse() {
    const result = this.addSubtract();
    if (this.index !== this.tokens.length) throw new Error("Check the formula syntax.");
    if (!Number.isFinite(result)) throw new Error("The formula result is not a finite number.");
    return result;
  }

  private addSubtract(): number {
    let value = this.multiplyDivide();
    while (this.operator("+") || this.operator("-")) {
      const operator = (this.tokens[this.index - 1] as Extract<Token, { type: "operator" }>).value;
      const right = this.multiplyDivide();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  private multiplyDivide(): number {
    let value = this.power();
    while (this.operator("*") || this.operator("/")) {
      const operator = (this.tokens[this.index - 1] as Extract<Token, { type: "operator" }>).value;
      const right = this.power();
      if (operator === "/" && right === 0) throw new Error("Division by zero.");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  private power(): number {
    const value = this.unary();
    if (this.operator("^")) return value ** this.power();
    return value;
  }

  private unary(): number {
    if (this.operator("+")) return this.unary();
    if (this.operator("-")) return -this.unary();
    return this.primary();
  }

  private primary(): number {
    const token = this.tokens[this.index];
    if (!token) throw new Error("The formula ends unexpectedly.");
    if (token.type === "number") {
      this.index += 1;
      return token.value;
    }
    if (token.type === "identifier") {
      this.index += 1;
      if (!(token.value in this.context)) throw new Error(`Unknown column "${token.value}".`);
      const value = Number(this.context[token.value]);
      if (!Number.isFinite(value)) throw new Error(`Column "${token.value}" is not a number.`);
      return value;
    }
    if (token.type === "left") {
      this.index += 1;
      const value = this.addSubtract();
      if (this.tokens[this.index]?.type !== "right")
        throw new Error("A closing bracket is missing.");
      this.index += 1;
      return value;
    }
    throw new Error("A number, column key or opening bracket was expected.");
  }

  private operator(value: Extract<Token, { type: "operator" }>["value"]) {
    const token = this.tokens[this.index];
    if (token?.type !== "operator" || token.value !== value) return false;
    this.index += 1;
    return true;
  }
}

export function evaluateCostSheetFormula(expression: string, context: FormulaContext) {
  return new FormulaParser(tokenize(expression), context).parse();
}

export function formulaIdentifiers(expression: string) {
  return [
    ...new Set(
      tokenize(expression)
        .filter(
          (token): token is Extract<Token, { type: "identifier" }> => token.type === "identifier",
        )
        .map((token) => token.value),
    ),
  ];
}

export function columnKey(value: string) {
  const result = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return /^[a-z_]/.test(result) ? result : result ? `column_${result}` : "";
}

export function calculateCostSheetRow(
  item: CalculableItem,
  columns: CalculableColumn[],
  rulesInput: unknown,
): CostSheetRowCalculation {
  const rules = normalizeCostSheetColumnRules(rulesInput);
  const context: FormulaContext = {
    quantity: Number(item.quantity || 0),
    unit_cost: Number(item.unit_cost || 0),
    markup_percent: Number(item.markup_percent || 0),
  };
  const custom: Record<string, string | number> = {};
  const errors: Record<string, string> = {};
  for (const column of columns) {
    const stored = item.custom_values?.[column.column_key];
    const value = stored === undefined || stored === "" ? column.default_value || "" : stored;
    if (column.data_type === "text") custom[column.column_key] = String(value);
    if (column.data_type === "number") {
      const number = Number(value || 0);
      custom[column.column_key] = Number.isFinite(number) ? number : 0;
      context[column.column_key] = Number.isFinite(number) ? number : 0;
    }
  }

  const formulas = new Map<string, string>([
    ["line_cost", rules.line_cost.formulaExpression || ""],
    ["sell_price", rules.sell_price.formulaExpression || ""],
    ["gross_profit", rules.gross_profit.formulaExpression || ""],
    ...columns
      .filter((column) => column.data_type === "formula")
      .map((column): [string, string] => [column.column_key, column.formula_expression || ""]),
  ]);
  const evaluating = new Set<string>();
  const evaluate = (key: string): number => {
    if (key in context) return context[key]!;
    if (evaluating.has(key)) throw new Error("Circular formula reference.");
    const expression = formulas.get(key);
    if (expression === undefined) throw new Error(`Unknown column "${key}".`);
    evaluating.add(key);
    try {
      for (const identifier of formulaIdentifiers(expression))
        if (formulas.has(identifier) && !(identifier in context))
          context[identifier] = evaluate(identifier);
      const result = evaluateCostSheetFormula(expression, context);
      context[key] = result;
      return result;
    } finally {
      evaluating.delete(key);
    }
  };

  for (const key of formulas.keys()) {
    try {
      const value = evaluate(key);
      if (!costSheetSystemColumnKeys.includes(key as CostSheetSystemColumnKey)) custom[key] = value;
    } catch (error) {
      errors[key] = error instanceof Error ? error.message : "Formula error";
      if (!costSheetSystemColumnKeys.includes(key as CostSheetSystemColumnKey))
        custom[key] = "#ERROR";
    }
  }
  return {
    lineCost: context["line_cost"] ?? 0,
    sellPrice: context["sell_price"] ?? 0,
    grossProfit: context["gross_profit"] ?? 0,
    custom,
    errors,
  };
}
