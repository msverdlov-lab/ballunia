// src/hooks/useProducts.js
import { useEffect, useState } from "react";
import { fetchProducts } from "../api-client/products";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const items = await fetchProducts();
        if (active) {
          setProducts(items);
          setLoading(false);
        }
      } catch (err) {
        console.error("Product fetch failed:", err);
        setError(err);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error };
}
