import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const categories = [
  {
    name: "Government & Public Sector",
    description:
      "Government ministries, departments, councils, constitutional bodies and public regulators.",
    offerings:
      "Digital transformation, procurement support, communications, research, training and operational services.",
  },
  {
    name: "State-Owned Enterprises & Public Utilities",
    description:
      "Government-owned commercial organisations, utilities and public infrastructure operators.",
    offerings:
      "Enterprise systems, customer engagement, infrastructure support, communications and workforce services.",
  },
  {
    name: "NGOs, Development & Humanitarian",
    description:
      "Nonprofits, foundations, missions and international development or humanitarian organisations.",
    offerings:
      "Programme communications, monitoring systems, research, recruitment, logistics and project support.",
  },
  {
    name: "Healthcare & Medical Services",
    description:
      "Hospitals, clinics, medical associations and public-health service organisations.",
    offerings:
      "Health communications, data systems, procurement, staffing and operational support.",
  },
  {
    name: "Education, Research & Training",
    description: "Universities, colleges, training authorities and research institutions.",
    offerings:
      "Learning systems, research support, communications, recruitment and digital services.",
  },
  {
    name: "Banking, Insurance & Financial Services",
    description:
      "Banks, insurers, investment, accounting, finance and financial-inclusion organisations.",
    offerings:
      "Customer acquisition, digital campaigns, technology, research and professional services.",
  },
  {
    name: "Agriculture, Food & Tobacco",
    description: "Agriculture, irrigation, food security, sugar and tobacco organisations.",
    offerings: "Supply-chain support, research, communications, procurement and field operations.",
  },
  {
    name: "Energy, Mining & Natural Resources",
    description: "Energy, fuel, mining and natural-resource organisations.",
    offerings:
      "Stakeholder communications, procurement, project support, technology and recruitment.",
  },
  {
    name: "Telecommunications, Technology & Media",
    description: "Telecommunications, connectivity, digital technology and media organisations.",
    offerings: "Digital platforms, campaigns, customer growth, technology and managed services.",
  },
  {
    name: "Construction, Infrastructure & Transport",
    description:
      "Construction, roads, transport, aviation, water infrastructure and logistics organisations.",
    offerings:
      "Tender support, project management, procurement, communications and workforce services.",
  },
  {
    name: "Hospitality, Tourism & Travel",
    description: "Hotels, tourism, catering and travel-related organisations.",
    offerings:
      "Marketing, customer engagement, recruitment, digital services and operational support.",
  },
  {
    name: "Manufacturing & Consumer Goods",
    description: "Manufacturers, industrial producers, beverages and consumer-goods businesses.",
    offerings: "Trade marketing, supply-chain support, recruitment, technology and communications.",
  },
  {
    name: "Professional, Regulatory & Business Services",
    description:
      "Professional bodies, standards organisations and specialist business-service providers.",
    offerings: "Research, member engagement, digital systems, events, training and communications.",
  },
  {
    name: "Other Private Enterprise",
    description: "Private commercial organisations not covered by a more specific industry group.",
    offerings:
      "Business development, marketing, digital systems, recruitment and operational services.",
  },
  {
    name: "Individual / Organisation Not Supplied",
    description: "Records where the source did not identify a usable organisation.",
    offerings: "Qualification and organisation-detail verification before outreach.",
  },
];

function categoryFor(company) {
  const name = String(company || "").toLowerCase();
  const is = (pattern) => pattern.test(name);
  if (is(/not applicable|individual|organisation not supplied/))
    return "Individual / Organisation Not Supplied";
  if (
    is(
      /escom|egenco|water\s*board|water supply|roads authority|roads fund|housing corporation|national oil|air cargo|sffrfm|food reserve|mipatamanga|mpatamanga/,
    )
  )
    return "State-Owned Enterprises & Public Utilities";
  if (
    is(
      /ministry|department|\bdept\b|directorate|administrator general|district council|civil service|anti-corruption|parliament|office of|government|electoral commission|revenue authority|national audit|national intelligence|\bnis\b|ombudsman|public procurement|public private partnership|registration bureau|human rights commission|gaming and lotteries|regulatory authority|competition and fair trading|construction industry regulatory|tobacco commission|ngo regulatory|planning commission|independent complaints commission|national youth council|regional climate resilience|investment and trade centre/,
    )
  )
    return "Government & Public Sector";
  if (
    is(
      /care international|amref|evidence action|giz|global fund|habitat|mary'?s meals|norwegian church aid|save the children|welthungerhilfe|one acre fund|plan international|people first foundation|stephanos|\bmission\b|visionfund|vision fund|partners in hope|partners in health|clinton health|malawi against physical disabilities|nca - dca|lighthouse trust/,
    )
  )
    return "NGOs, Development & Humanitarian";
  if (
    is(
      /hospital|health|medical|medi clinics|clinic|aids commission|christian health association|baylor|family health|cham|lion trust/,
    )
  )
    return "Healthcare & Medical Services";
  if (
    is(
      /university|college|school|education|training authority|teveta|examinations board|students'? loans|research programme|research and extension|library service|science and technology|luanar|unima|kuhes/,
    )
  )
    return "Education, Research & Training";
  if (is(/bank|financial|finance|old mutual|export development fund|\bfdh\b|\bicam\b|visionfund/))
    return "Banking, Insurance & Financial Services";
  if (is(/agri|farm|irrigation|sugar|tobacco|jti|pyxus|food reserve|sustainable agriculture|pride/))
    return "Agriculture, Food & Tobacco";
  if (is(/energy|mining|hydro|puma|ethanol|natural resources|oil company/))
    return "Energy, Mining & Natural Resources";
  if (
    is(
      /airtel|\btnm\b|telekom|communications regulatory|open connect|e-government|\bsicpa\b|copyright society/,
    )
  )
    return "Telecommunications, Technology & Media";
  if (is(/construction|road|transport|air cargo|handling company|infrastructure|water|mips/))
    return "Construction, Infrastructure & Transport";
  if (is(/hotel|sunbird|tourism|catering|travel/)) return "Hospitality, Tourism & Travel";
  if (
    is(
      /illovo|castel|alliance one|ethanol|manufactur|industrial|malawi bureau of standards|central medical stores/,
    )
  )
    return "Manufacturing & Consumer Goods";
  if (
    is(/institute|authority|commission|bureau|legal aid|sovereign services|standards|professional/)
  )
    return "Professional, Regulatory & Business Services";
  return "Other Private Enterprise";
}

const connection = await mysql.createConnection({
  database: process.env.DB_NAME || "gwero_crm",
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : { host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306) }),
});

try {
  await connection.beginTransaction();
  const ids = new Map();
  for (const category of categories) {
    const [matches] = await connection.execute(
      "SELECT id FROM prospect_categories WHERE name = ? LIMIT 1",
      [category.name],
    );
    const id = matches[0]?.id || randomUUID();
    if (matches[0]?.id) {
      await connection.execute(
        "UPDATE prospect_categories SET description = ?, offerings = ? WHERE id = ?",
        [category.description, category.offerings, id],
      );
    } else {
      await connection.execute(
        "INSERT INTO prospect_categories (id, name, description, offerings) VALUES (?, ?, ?, ?)",
        [id, category.name, category.description, category.offerings],
      );
    }
    ids.set(category.name, id);
  }
  const [prospects] = await connection.execute("SELECT id, company FROM prospects");
  const distribution = {};
  for (const prospect of prospects) {
    const category = categoryFor(prospect.company);
    await connection.execute("UPDATE prospects SET category_id = ? WHERE id = ?", [
      ids.get(category),
      prospect.id,
    ]);
    distribution[category] = (distribution[category] || 0) + 1;
  }
  await connection.commit();
  console.log(
    JSON.stringify({ prospects: prospects.length, uncategorised: 0, distribution }, null, 2),
  );
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
