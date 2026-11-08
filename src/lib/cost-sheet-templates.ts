import {
  defaultCostSheetColumnRules,
  normalizeCostSheetColumnRules,
  type CostSheetSystemColumnRules,
} from "./cost-sheet-formula.ts";

export type CostSheetTemplateColumn = {
  name: string;
  column_key: string;
  data_type: "text" | "number" | "formula";
  default_value: string | null;
  formula_expression: string | null;
  display_order: number;
};

export type CostSheetTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  currency: string;
  column_rules: CostSheetSystemColumnRules;
  columns: CostSheetTemplateColumn[];
  is_system: boolean;
};

const column = (
  name: string,
  key: string,
  dataType: CostSheetTemplateColumn["data_type"],
  order: number,
  value: string | null,
): CostSheetTemplateColumn => ({
  name,
  column_key: key,
  data_type: dataType,
  default_value: dataType === "formula" ? null : value,
  formula_expression: dataType === "formula" ? value : null,
  display_order: order,
});

function rules(overrides: Partial<CostSheetSystemColumnRules> = {}): CostSheetSystemColumnRules {
  return normalizeCostSheetColumnRules({ ...defaultCostSheetColumnRules, ...overrides });
}

export const systemCostSheetTemplates: CostSheetTemplateDefinition[] = [
  {
    id: "system-tax-free",
    name: "Tax-free / exempt",
    description:
      "A clean commercial sheet without VAT or statutory levies. Add only the charges that apply.",
    currency: "MWK",
    column_rules: rules({
      sell_price: {
        label: "Sell price",
        enabled: true,
        formulaExpression: "line_cost * (1 + markup_percent / 100) * (1 - discount_percent / 100)",
      },
    }),
    columns: [
      column("Unit", "unit", "text", 0, "each"),
      column("Discount %", "discount_percent", "number", 1, "0"),
    ],
    is_system: true,
  },
  {
    id: "system-malawi-commercial",
    name: "Malawi commercial · VAT optional",
    description:
      "Uses the current 17.5% standard VAT rate. Change it to 0, hide it, or remove the VAT columns for exempt and zero-rated supplies.",
    currency: "MWK",
    column_rules: rules({
      sell_price: {
        label: "Sell price excl. tax",
        enabled: true,
        formulaExpression: "line_cost * (1 + markup_percent / 100) * (1 - discount_percent / 100)",
      },
    }),
    columns: [
      column("Unit", "unit", "text", 0, "each"),
      column("Discount %", "discount_percent", "number", 1, "0"),
      column("VAT %", "vat_percent", "number", 2, "17.5"),
      column("VAT amount", "vat_amount", "formula", 3, "sell_price * vat_percent / 100"),
      column("Total incl. VAT", "total_including_vat", "formula", 4, "sell_price + vat_amount"),
    ],
    is_system: true,
  },
  {
    id: "system-malawi-public-procurement",
    name: "Malawi public procurement",
    description:
      "VAT, the 1% PPDA procurement levy on the pre-tax subtotal, optional withholding and retention for public-sector bids. Remove the levy where an exemption applies.",
    currency: "MWK",
    column_rules: rules({
      sell_price: {
        label: "Subtotal excl. tax",
        enabled: true,
        formulaExpression: "line_cost * (1 + markup_percent / 100) * (1 - discount_percent / 100)",
      },
    }),
    columns: [
      column("Unit", "unit", "text", 0, "each"),
      column("Discount %", "discount_percent", "number", 1, "0"),
      column("VAT %", "vat_percent", "number", 2, "17.5"),
      column("VAT amount", "vat_amount", "formula", 3, "sell_price * vat_percent / 100"),
      column("PPDA levy %", "ppda_levy_percent", "number", 4, "1"),
      column("PPDA levy", "ppda_levy", "formula", 5, "sell_price * ppda_levy_percent / 100"),
      column(
        "Contract total",
        "contract_total",
        "formula",
        6,
        "sell_price + vat_amount + ppda_levy",
      ),
      column("Withholding %", "withholding_percent", "number", 7, "0"),
      column(
        "Withholding amount",
        "withholding_amount",
        "formula",
        8,
        "contract_total * withholding_percent / 100",
      ),
      column("Retention %", "retention_percent", "number", 9, "0"),
      column(
        "Retention amount",
        "retention_amount",
        "formula",
        10,
        "contract_total * retention_percent / 100",
      ),
      column(
        "Expected net receipt",
        "net_receivable",
        "formula",
        11,
        "contract_total - withholding_amount - retention_amount",
      ),
    ],
    is_system: true,
  },
  {
    id: "system-import-landed-cost",
    name: "Import / landed cost",
    description:
      "Models freight, insurance, editable import duty and excise before markup. Rates vary by tariff classification.",
    currency: "MWK",
    column_rules: rules({
      sell_price: {
        label: "Sell price excl. tax",
        enabled: true,
        formulaExpression: "landed_cost * (1 + markup_percent / 100)",
      },
      gross_profit: {
        label: "Gross profit",
        enabled: true,
        formulaExpression: "sell_price - landed_cost",
      },
    }),
    columns: [
      column("Unit", "unit", "text", 0, "each"),
      column("Freight", "freight", "number", 1, "0"),
      column("Insurance", "insurance", "number", 2, "0"),
      column("Import duty %", "import_duty_percent", "number", 3, "0"),
      column(
        "Import duty",
        "import_duty",
        "formula",
        4,
        "(line_cost + freight + insurance) * import_duty_percent / 100",
      ),
      column("Excise %", "excise_percent", "number", 5, "0"),
      column(
        "Excise",
        "excise",
        "formula",
        6,
        "(line_cost + freight + insurance + import_duty) * excise_percent / 100",
      ),
      column(
        "Landed cost",
        "landed_cost",
        "formula",
        7,
        "line_cost + freight + insurance + import_duty + excise",
      ),
      column("VAT %", "vat_percent", "number", 8, "17.5"),
      column("VAT amount", "vat_amount", "formula", 9, "sell_price * vat_percent / 100"),
      column("Total incl. VAT", "total_including_vat", "formula", 10, "sell_price + vat_amount"),
    ],
    is_system: true,
  },
];
