import mysql from "mysql2/promise";

const aliases = [
  ["Amref", "Amref Health Africa - Malawi"],
  ["Bwb", "Blantyre Water Board"],
  ["Baylor College Of Medicine", "Baylor Children's Foundation Malawi"],
  ["Care", "CARE International in Malawi"],
  ["Central Medical Stores", "Central Medical Stores Trust (CMST)"],
  ["Cfao", "Cfao Mobility"],
  ["Firstmark", "Firstmark Group Of Companies"],
  ["General Alliance", "General Alliance Insurance"],
  ["Hesigb", "Higher Education Students' Loans and Grants Board (HESLGB)"],
  ["Lilongwe Waterboard", "Lilongwe Water Board"],
  ["Lion Hospital", "Lilongwe Institute Of Orthopaedics & Neurosurgery (Lion Hospital))"],
  ["Malawi Police", "Malawi Police Service"],
  ["Min Of Health", "Ministry of Health and Sanitation"],
  ["Ministry Of Education", "Ministry Of Education, Science And Technology"],
  ["Ministry Of Finance", "Ministry Of Finance, Economic Planning And Decentralisation"],
  ["Northern Region Waterboard", "Northern Region Water Board"],
  ["Office Of The President And Cabinet", "Office of the President and Cabinet (OPC)"],
  ["Rbm", "Reserve Bank Of Malawi"],
  ["Tree Business", "Tree Business Suppliers Mw Ltd"],
  ["Tree Business Suppliers Mwltd", "Tree Business Suppliers Mw Ltd"],
];

const connection = await mysql.createConnection({
  database: process.env.DB_NAME || "gwero_crm",
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : { host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306) }),
});

let merged = 0;
try {
  await connection.beginTransaction();
  for (const [duplicateName, canonicalName] of aliases) {
    const [duplicates] = await connection.execute(
      "SELECT * FROM prospects WHERE company = ? ORDER BY created_at LIMIT 1",
      [duplicateName],
    );
    const [canonicals] = await connection.execute(
      "SELECT * FROM prospects WHERE company = ? ORDER BY created_at LIMIT 1",
      [canonicalName],
    );
    const duplicate = duplicates[0];
    const canonical = canonicals[0];
    if (!duplicate || !canonical || duplicate.id === canonical.id) continue;

    await connection.execute("UPDATE prospect_contacts SET prospect_id = ? WHERE prospect_id = ?", [
      canonical.id,
      duplicate.id,
    ]);
    await connection.execute(
      "UPDATE prospect_interactions SET prospect_id = ? WHERE prospect_id = ?",
      [canonical.id, duplicate.id],
    );
    await connection.execute("UPDATE replies SET prospect_id = ? WHERE prospect_id = ?", [
      canonical.id,
      duplicate.id,
    ]);
    await connection.execute(
      "UPDATE IGNORE campaign_recipients SET prospect_id = ? WHERE prospect_id = ?",
      [canonical.id, duplicate.id],
    );
    await connection.execute("DELETE FROM campaign_recipients WHERE prospect_id = ?", [
      duplicate.id,
    ]);
    await connection.execute("UPDATE deals SET prospect_id = ? WHERE prospect_id = ?", [
      canonical.id,
      duplicate.id,
    ]);
    await connection.execute("UPDATE IGNORE clients SET prospect_id = ? WHERE prospect_id = ?", [
      canonical.id,
      duplicate.id,
    ]);
    await connection.execute("UPDATE clients SET prospect_id = NULL WHERE prospect_id = ?", [
      duplicate.id,
    ]);
    await connection.execute(
      `UPDATE prospects SET
        email = IF(email LIKE '%@prospect.local', ?, email),
        phone = COALESCE(phone, ?), website = COALESCE(website, ?),
        logo_path = COALESCE(logo_path, ?), notes = COALESCE(notes, ?)
       WHERE id = ?`,
      [
        duplicate.email,
        duplicate.phone,
        duplicate.website,
        duplicate.logo_path,
        duplicate.notes,
        canonical.id,
      ],
    );
    await connection.execute("DELETE FROM prospects WHERE id = ?", [duplicate.id]);
    merged += 1;
  }
  await connection.commit();
  console.log(JSON.stringify({ merged }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
