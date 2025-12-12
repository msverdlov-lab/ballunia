import React from "react";
import { useProducts } from "../hooks/useProducts";

export default function Shop() {
  const { products, loading, error } = useProducts();

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>Error loading products.</p>;

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

            {/* ADD TO CART BUTTON — will wire up soon */}
            <button>Add to Cart</button>

          </div>
        ))}
      </div>
    </div>
  );
}
