// netlify/functions/get-bundle-templates.js
const Airtable = require("airtable");

exports.handler = async (event) => {
  // --- 1. UNIVERSAL CORS LOGIC ---
  // Add '|| {}' to prevent crashing if headers are missing
  // Add '?.origin' to safely check for the property
  const origin = (event.headers || {})['origin'] || event.headers?.origin;
  
  const allowedOrigins = [
    "https://shop.ballunia.com",
    "http://localhost:5173",
    "http://localhost:8888"
  ];

  // Match the origin or default to production
  const corsOrigin = allowedOrigins.includes(origin) ? origin : "https://shop.ballunia.com";

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };

  // Handle Preflight (OPTIONS) immediately
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }
  // --- END UNIVERSAL CORS LOGIC ---
  
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
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
      headers, // Use the shared dynamic headers
      body: JSON.stringify({ templates }),
    };
  } catch (err) {
    console.error(`❌ Error in get-bundle-templates:`, err.message);
    return {
      statusCode: 500,
      headers, // Use the shared dynamic headers
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};
