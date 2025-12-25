export default async (req, context) => {
  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Delivery Windows";

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

  const url = new URL(req.url);
  const zip = url.searchParams.get("zip"); // we'll use ?zip=07039 instead of ?territory=Livingston

  // Build Airtable filter formula
  // Use your real field names
  let filterFormula = "AND({API Include}=1, IS_AFTER({Delivery Window Date}, TODAY()))";

  // If a ZIP is provided, filter by Territories field (linked to Territories table)
  // Airtable lets you use FIND() to match text inside a linked field list
  if (zip) {
    filterFormula = `AND({API Include}=1, IS_AFTER({Delivery Window Date}, TODAY()), {Territory Text}='${zip}')`;
  }

  try {
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Delivery%20Window%20Date&sort[0][direction]=asc`;

    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map to clean frontend-ready JSON
    const windows = data.records.map((record) => {
      const f = record.fields;
      const date = f["Delivery Window Date"];
      const startTime = f["Start Time"];
      const value = date && startTime ? `${date}T${startTime}` : date;

      return {
        id: record.id,
        label: f["Label"],
        value,
        zip: zip || null,
        available: f["Available"] || false,
      };
    });

    return new Response(JSON.stringify(windows), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS, // Apply dynamic headers here
      },
    });

  } catch (error) {
    console.error("❌ Delivery windows API error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch delivery windows", details: error.message }),
      { 
        status: 500, 
        headers: { 
          "content-type": "application/json",
        ...CORS_HEADERS // Ensure errors also return CORS headers 
        }
      }
    );
  }
};
