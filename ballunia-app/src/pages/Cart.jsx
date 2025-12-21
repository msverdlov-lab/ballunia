import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";

/* ----------------------------------
   Quantity input (PRODUCTS ONLY)
---------------------------------- */
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

/* ----------------------------------
   Cart Page
---------------------------------- */
export default function Cart() {
  const {
    items,
    subtotal,
    totalQty,
    removeItem,
    setQty,
    clear,
  } = useCart();

  const navigate = useNavigate();

  // 🆕 Track expanded bundle rows
  const [openBundles, setOpenBundles] = React.useState(new Set());

  function toggleBundle(id) {
    setOpenBundles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
        {items.map((item) => {
          const isBundle = item.type === "bundle";
          const isOpen = openBundles.has(item.id);

          return (
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

                {/* Bundle Metadata */}
                {isBundle && item.bundle && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                    Bundle · Template: {item.bundle.templateNK}
                  </div>
                )}

                {/* Product Metadata */}
                {!isBundle && item.product?.sku && (
                  <div style={{ fontSize: 12, color: "#666" }}>
                    SKU: {item.product.sku}
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  ${item.price.toFixed(2)}
                </div>

                {/* 🆕 Bundle Actions */}
                {isBundle && item.bundle && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => toggleBundle(item.id)}
                      style={linkButton}
                    >
                      {isOpen
                        ? "Hide bundle details"
                        : "View bundle details"}
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/bundle/${item.bundle.templateNK}`, {
                          state: { bundleId: item.bundle.bundleId },
                        })
                      }
                      style={linkButton}
                    >
                      Edit bundle
                    </button>

                    {/* 🆕 Expandable Summary */}
                    {isOpen && (
                      <div style={{ marginTop: 8 }}>
                        <ul
                          style={{
                            paddingLeft: 18,
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                        >
                          {item.bundle.summary.map((name, idx) => (
                            <li key={idx}>{name}</li>
                          ))}
                        </ul>

                        {/* 🆕 Bundle Notes */}
                        {item.bundle.notes && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#444",
                              marginTop: 6,
                            }}
                          >
                            <strong>Notes:</strong> {item.bundle.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity / Remove */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                {<QtyInput item={item} setQty={setQty} />}

                {(<button
                    onClick={() => removeItem(item.id)}
                    style={removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          );
        })}
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

/* ----------------------------------
   Shared styles
---------------------------------- */
const linkButton = {
  background: "none",
  border: "none",
  padding: 0,
  marginRight: 12,
  fontSize: 12,
  color: "#0070f3",
  cursor: "pointer",
};

const removeButton = {
  background: "none",
  border: "none",
  color: "#c00",
  cursor: "pointer",
  padding: 0,
  fontSize: 12,
};
