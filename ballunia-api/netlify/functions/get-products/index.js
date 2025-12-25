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
    console.log("📦 Fetching full product list from Airtable");
    
    const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
      .base(process.env.AIRTABLE_BASE_ID);

    // Step 1: Fetch all products
    const productRecords = await base("Product").select().all();

    const results = [];

    for (const record of productRecords) {
      const fields = record.fields;

      let images = [];

      // Step 2: If product has linked images, fetch them
      if (fields["Product Images"]) {
        const imageRecordIds = fields["Product Images"];

        const imageRecords = await base("Product Images")
          .select({
            filterByFormula: `OR(${imageRecordIds
              .map(id => `RECORD_ID()='${id}'`)
              .join(",")})`
          })
          .all();

        // Step 3: Extract URLs from "Image (Attachment)" field
        images = imageRecords.flatMap(imgRec =>
          (imgRec.fields["Image (Attachment)"] || []).map(att => att.url)
        );
      }

      results.push({
        id: record.id,
        name: fields["Product Name"],
        price: fields["Retail Price"],
        sku: fields["BX SKU"],
        images
      });
    }

    return {
      statusCode: 200,
      headers, // Use shared headers
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error("❌ Error in get-products:", err.message);
    return {
      statusCode: 500,
      headers, // Use shared headers
      body: JSON.stringify({ error: err.message })
    };
  }
};
