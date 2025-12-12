const Airtable = require("airtable");

exports.handler = async () => {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
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
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
