// netlify/functions/airtable/lib/mappers/territories.js
// This code is currently not used in the main function but is kept for potential future use.

/**
 * mapTerritory(record)
 * Converts a raw Airtable record into a simple JSON object
 * optimized for Squarespace usage.
 */
export function mapTerritory(record) {
  return {
    zip: record.fields["Zip Code"] || null,
    territory: record.fields["Territory Name"] || null,
    // driver intentionally omitted for public API
  };
}
