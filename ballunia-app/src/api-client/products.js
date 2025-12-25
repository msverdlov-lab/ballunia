// src/api-client/products.js

import { API_BASE } from './config';

export async function fetchProducts() {
  //const url = "/.netlify/functions/get-products";
  //const response = await fetch("http://localhost:8888/.netlify/functions/get-products");
  //const response = await fetch(`${API_BASE}/.netlify/functions/get-products`);
  const response = await fetch(`${API_BASE}/get-products`);
  if (!response.ok) throw new Error("Failed to load products");
  return await response.json();

  //const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const data = await response.json();

  // Normalize Airtable format (records → usable array)
  return data.records?.map(rec => ({
    id: rec.id,
    sku: rec.fields["BX SKU"],
    name: rec.fields["Product Name"],
    price: rec.fields["Retail Price"],
    category: rec.fields["Category"],
    subcategory: rec.fields["Subcategory"],
    image:
      rec.fields["Image (Attachment)"]?.[0]?.url ??
      rec.fields["Image"] ??
      null,
    bundleEligible: rec.fields["Bundle Eligible"] === true,
    bundleCategory: rec.fields["Bundle Category"] || null
  })) || [];
}
