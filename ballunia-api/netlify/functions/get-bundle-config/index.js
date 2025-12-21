// netlify/functions/get-bundle-config.js
const Airtable = require("airtable");

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters;
    const templateNK = params?.templateNK;

    if (!templateNK) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing templateNK parameter" }),
      };
    }

    // Airtable connection
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );

    // 1. Load the Bundle Template by NK
    const templateRecords = await base("Bundle Templates")
      .select({
        filterByFormula: `{Bundle Template NK} = "${templateNK}"`,
        maxRecords: 1,
      })
      .firstPage();

    if (templateRecords.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Bundle Template not found" }),
      };
    }

    const template = templateRecords[0].fields;

    // Extract rules
    const rules = {
      main: {
        min: template["Main Balloon Min"] || 0,
        max: template["Main Balloon Max"] || 0,
      },
      accent: {
        count: template["Accent Balloon Count"] || 0,
      },
      latex: {
        count: template["Latex Balloon Count"] || 0,
      },
      weight: {
        count: template["Weight Count"] || 0,
      },
      allowNumbers: template["Allow Numbers"] || false,
      mixedAllowed: template["Mixed Allowed"] || false,
    };

    // 2. Load bundle-eligible Products
    const productRecords = await base("Product")
      .select({
        filterByFormula: `{Bundle Eligible} = TRUE()`
      })
      .all();

    // Helper to fetch image URL
    const fetchImageUrl = async (imageRefs) => {
      if (!imageRefs || imageRefs.length === 0) return null;

      const imageRecordId = imageRefs[0]; // Only one image needed
      const imageRecord = await base("Product Images").find(imageRecordId);

      const attachment = imageRecord.fields["Image (Attachment)"]?.[0];
      let imageUrl = attachment?.url || null; // Use a mutable variable

      // 🚀 ADD THIS CHECK: If the URL exists and is HTTP, change it to HTTPS.
      if (imageUrl && imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }

      return imageUrl; // Return the now-HTTPS URL
      ////const attachment = imageRecord.fields["Image"]?.[0];
      //const attachment = imageRecord.fields["Image (Attachment)"]?.[0];
      //return attachment?.url || null;
    };

    const main = [];
    const accent = [];
    const latex = [];
    const weight = [];

    // 3. Process Products
    for (const record of productRecords) {
      const f = record.fields;

      const category = f["Bundle Category"];
      const variantId = f["SQ Variant ID"]; // <-- Correct field name
      const imageRefs = f["Product Images"];

      const imageUrl = await fetchImageUrl(imageRefs);

      const productObj = {
        id: record.id,
        nk: f["BX SKU"] || null,
        name: f["Product Name"],
        variantId: variantId || null,
        category,
        imageUrl,
      };

      switch (category) {
        case "Main":
          main.push(productObj);
          break;
        case "Accent":
          accent.push(productObj);
          break;
        case "Latex":
          latex.push(productObj);
          break;
        case "Weight":
          weight.push(productObj);
          break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        template: {
          nk: template["Bundle Template NK"],
          name: template["Name"],
          price: Number(template["Price"]),
          rules,
        },
        products: {
          main,
          accent,
          latex,
          weight,
        },
      }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (err) {
    console.error("get-bundle-config error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};