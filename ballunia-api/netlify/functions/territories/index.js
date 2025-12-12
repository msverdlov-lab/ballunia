// netlify/functions/territories/index.js
// This function fetches records from an Airtable base (Territories table from env variable) and returns them as JSON.

export default async () => {
  try {
    const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return new Response(JSON.stringify({ error: "Missing Airtable credentials" }), {
        status: 500,
        headers: { "content-type": "application/json" },
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
        headers: { "content-type": "application/json" },
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data.records), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
