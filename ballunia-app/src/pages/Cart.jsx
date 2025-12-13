import React from "react";
import { useCart } from "../cart/CartContext";

function QtyInput({ item, setQty }) {
  const [draft, setDraft] = React.useState(String(item.quantity));

  // Keep input in sync if quantity changes elsewhere
  React.useEffect(() => {
    setDraft(String(item.quantity));
  }, [item.quantity]);

  function commit() {
    const num = Number(draft);

    if (Number.isFinite(num) && num > 0) {
      setQty(item.id, num);
    } else {
      // Restore last valid quantity
      setDraft(String(item.quantity));
    }
  }

  return (
    <input
      type="number"
      min={1}
      value={draft}
      style={{ width: 60 }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export default function Cart() {
  const {
    items,
    subtotal,
    totalQty,
    removeItem,
    setQty,
    clear,
  } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Your Cart</h2>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>Your Cart</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: "flex",
              gap: 16,
              padding: "16px 0",
              borderBottom: "1px solid #e5e5e5",
            }}
          >
            {/* Image */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "contain",
                  borderRadius: 6,
                }}
              />
            )}

            {/* Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>

              {/* Optional metadata */}
              {item.type === "bundle" && item.bundle?.bundleId && (
                <div style={{ fontSize: 12, color: "#666" }}>
                  Bundle ID: {item.bundle.bundleId}
                </div>
              )}

              {item.type === "product" && item.product?.sku && (
                <div style={{ fontSize: 12, color: "#666" }}>
                  SKU: {item.product.sku}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                ${item.price.toFixed(2)}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QtyInput item={item} setQty={setQty} />
              
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#c00",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Summary */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid #000",
          paddingTop: 16,
        }}
      >
        <div>
          <div>Total items: {totalQty}</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            Subtotal: ${subtotal.toFixed(2)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={clear}>Clear Cart</button>
          <button
            style={{
              background: "#000",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 6,
            }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
