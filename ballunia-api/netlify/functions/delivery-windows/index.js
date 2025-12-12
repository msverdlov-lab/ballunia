export default async (req, context) => {
  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Delivery Windows";

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

    console.log("🔗 Airtable URL:", airtableUrl);

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
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ Delivery windows API error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch delivery windows", details: error.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
