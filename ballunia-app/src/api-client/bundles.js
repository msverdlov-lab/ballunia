// src/api-client/bundles.js

import { API_BASE } from './config';

export async function getBundleConfig(templateNK) {
  console.log("Fetching bundle config for templateNK:", templateNK);

  //const res = await fetch(`http://localhost:8888/.netlify/functions/get-bundle-config?templateNK=${templateNK}`);
  //const res = await fetch(`${API_BASE}/.netlify/functions/get-bundle-config?templateNK=${templateNK}`);
  const res = await fetch(`${API_BASE}/get-bundle-config?templateNK=${templateNK}`);
  console.log("Fetch Response status:", res.status);
  console.log("Fetch Response ok:", res.ok);

  if (!res.ok) {
    throw new Error(`Failed to load bundle config (${res.status})`);
  }

  const data = await res.json();

  console.log("Raw bundle API response:", data);

  /**
   * ------------------------------------------------------------------
   * Normalize Template
   * ------------------------------------------------------------------
   */

  const t = data.template || {};

  const template = {
    nk: t.nk,
    name: t.name,
    price: t.price,
    allowNumbers: !!t.allowNumbers,
    mixedSizes: !!t.mixedSizes,
    rules: t.rules || {}
  };

  /**
   * ------------------------------------------------------------------
   * Normalize Products
   *
   * API returns:
   * products: {
   *   Main:   [...],
   *   Accent: [...],
   *   Weight: [...]
   * }
   * ------------------------------------------------------------------
   */

  const rawProducts = data.products || {};
  const products = {};

  for (const [section, items] of Object.entries(rawProducts)) {
    products[section] = Array.isArray(items)
      ? items.map(p => ({
          id: p.id,
          nk: p.nk,
          name: p.name,
          price: p.price ?? 0,
          imageUrl: p.imageUrl ?? null,
          bundleCategory: section
        }))
      : [];
  }

  const normalized = { template, products };

  console.log("Bundle config loaded:", normalized);

  return normalized;
}

export async function getBundleTemplates() {
  //const res = await fetch("http://localhost:8888/.netlify/functions/get-bundle-templates");
  //const res = await fetch(`${API_BASE}/.netlify/functions/get-bundle-templates`);
  const res = await fetch(`${API_BASE}/get-bundle-templates`);
  
  if (!res.ok) {
    throw new Error("Failed to load bundle templates");
  }

  return res.json();
}

