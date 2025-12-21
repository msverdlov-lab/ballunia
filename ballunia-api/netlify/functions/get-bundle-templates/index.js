// netlify/functions/get-bundle-templates.js
const Airtable = require("airtable");

exports.handler = async () => {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );

    const records = await base("Bundle Templates")
      .select({
        fields: ["Bundle Template NK", "Name", "Price"],
        sort: [{ field: "Name", direction: "asc" }],
      })
      .all();

    const templates = records.map((r) => ({
      nk: r.fields["Bundle Template NK"],
      name: r.fields["Name"],
      price: r.fields["Price"],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ templates }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (err) {
    console.error("get-bundle-templates error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};
