// netlify/functions/service-area-check/index.js
export default async (req) => {
  // Log the method immediately
  console.log(`🚀 Incoming Request: ${req.method} to Service Area`);
  
  try {
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;
    const TABLE_NAME = "Territories"; // ← adjust if yours is different

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

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      return new Response(JSON.stringify({ error: "Missing Airtable credentials" }), {
        status: 500,
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      });
    }

    // 1️⃣ Parse ZIP from URL or POST body
    let zip;
    if (req.method === "POST") {
      const body = await req.json();
      zip = body.zip;
    } else {
      const url = new URL(req.url);
      zip = url.searchParams.get("zip");
    }

    if (!zip) {
      return new Response(JSON.stringify({ error: "Missing zip parameter" }), {
        status: 400,
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      });
    }

    console.log(`🔍 Checking Service Area for ZIP: ${zip}`);

    // 2️⃣ Query Airtable: find any record where {Zip Code} = zip
    const apiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}?filterByFormula={Zip Code}='${zip}'`;

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

    // 3️⃣ If any record exists, it's in service
    const found = data.records.length > 0;
    const record = found ? data.records[0] : null;

    // 4️⃣ Build a clean response
    const result = {
      zip,
      inService: found,
      territory: record?.fields["Territory Name"] || null,
      //driver: record?.fields["Driver Name (from Assigned Driver)"]?.[0] || null,
    };

    return new Response(JSON.stringify(result), {
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
