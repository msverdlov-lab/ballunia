import React from "react";
import { useRef } from "react";

import { useProducts } from "../hooks/useProducts";
import { useCart } from "../cart/CartContext";

export default function Shop() {
  const { products, loading, error } = useProducts();
  const { addItem } = useCart();
  const addLocks = useRef({});

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>Error loading products.</p>;

  {/* Lock add to cart buttom after click to avoid double-cart add*/}
  const handleAddToCart = (product) => {
  const key = product.sku || product.id;

  // If locked, ignore click
  if (addLocks.current[key]) return;

  // Lock immediately
  addLocks.current[key] = true;

  addItem({
    type: "product",
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    product: {
      sku: product.sku,
    },
  });

  // Unlock after short delay
  setTimeout(() => {
    addLocks.current[key] = false;
  }, 300);
};


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Shop Balloons</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginTop: "1rem",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  background: "#fafafa"
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  background: "#fafafa",
                  fontSize: "0.9rem",
                  color: "#888",
                }}
              >
                No Image
              </div>
            )}

            {/* PRODUCT NAME */}
            <h3 style={{ marginTop: "1rem" }}>{product.name}</h3>

            {/* PRICE */}
            <p>${product.price}</p>

            {/* ADD TO CART BUTTON - uses lock delay to avoid double-cart add*/}
            <button onClick={() => handleAddToCart(product)}>
              Add to Cart
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
