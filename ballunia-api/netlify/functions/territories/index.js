// netlify/functions/territories/index.js
// This function fetches records from an Airtable base (Territories table from env variable) and returns them as JSON.

export default async (req) => {
  try {
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID} = process.env;
    const AIRTABLE_TABLE_NAME = "Territories";

    // --- START UNIVERSAL CORS LOGIC ---
    // Add '|| {}' to prevent crashing if headers are missing
    // Add '?.origin' to safely check for the property
    const origin = (req.headers || {})['origin'] || req.headers?.origin;
    
    const allowedOrigins = [
      "https://shop.ballunia.com",
      "http://localhost:5173",
      "http://localhost:8888"
    ];
    
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "https://shop.ballunia.com";

    const CORS_HEADERS = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Vary": "Origin"
    };

    // Handle Preflight immediately
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    // --- END UNIVERSAL CORS LOGIC ---

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return new Response(JSON.stringify({ error: "Missing Airtable credentials" }), {
        status: 500,
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      });
    }

    // Example: limit to 10 records
    const apiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      AIRTABLE_TABLE_NAME
    )}?maxRecords=10`;

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!res.ok) {
      const msg = await res.text();
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data.records), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }
};
