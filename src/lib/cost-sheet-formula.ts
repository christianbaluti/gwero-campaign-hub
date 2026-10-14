export type FormulaContext = Record<string, number>;

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
