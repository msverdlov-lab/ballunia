const Airtable = require("airtable");

exports.handler = async () => {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );

    const records = await base("Product").select({ maxRecords: 5 }).firstPage();

    const output = records.map((r) => ({
      id: r.id,
      fields: r.fields
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(output, null, 2),
      headers: { "Content-Type": "application/json" }
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() })
    };
  }
};
