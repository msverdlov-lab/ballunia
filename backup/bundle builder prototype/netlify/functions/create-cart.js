const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    const apiKey = process.env.SQS_API_KEY;
    const siteId = process.env.SQS_SITE_ID;

    if (!apiKey || !siteId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Squarespace API credentials" })
      };
    }

    const url = "https://api.squarespace.com/1.0/commerce/carts";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Site-Id": siteId,
        "User-Agent": "Ballunia Bundle Builder (Netlify Function)",
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}) // important — must not be empty
    });

    const text = await response.text(); // read raw text first

    let data = null;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Squarespace returned non-JSON response",
          raw: text
        })
      };
    }

    if (!data.cart || !data.cart.id) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Squarespace did not return a cart ID",
          response: data
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ cartId: data.cart.id })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
