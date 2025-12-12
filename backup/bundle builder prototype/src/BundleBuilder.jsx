import React, { useEffect, useState, useMemo } from "react";

const CATEGORY_KEYS = ["main", "accent", "latex", "weight"];

const CATEGORY_LABELS = {
  main: "Main Balloons",
  accent: "Accent Balloons",
  latex: "Latex Balloons",
  weight: "Weights",
};

function BundleBuilder({ templateNK }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState(null);
  const [activeCategory, setActiveCategory] = useState("main");

  const [selections, setSelections] = useState({
    main: new Set(),
    accent: new Set(),
    latex: new Set(),
    weight: new Set(),
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ templateNK });
        const res = await fetch(
          `/.netlify/functions/get-bundle-config?${params.toString()}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setTemplate(data.template);
        setProducts(data.products);
      } catch (err) {
        console.error("Error loading bundle config:", err);
        setError(err.message || "Failed to load bundle config");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [templateNK]);

  const rules = useMemo(() => {
    if (!template) return null;
    const r = template.rules || {};
    return {
      main: { min: r.main?.min ?? 0, max: r.main?.max ?? 0 },
      accent: { count: r.accent?.count ?? 0 },
      latex: { count: r.latex?.count ?? 0 },
      weight: { count: r.weight?.count ?? 0 },
      allowNumbers: !!r.allowNumbers,
      mixedAllowed: !!r.mixedAllowed,
    };
  }, [template]);

  const counts = useMemo(() => {
    const result = {};
    CATEGORY_KEYS.forEach((key) => {
      result[key] = selections[key].size;
    });
    return result;
  }, [selections]);

  const validation = useMemo(() => {
    if (!rules) return { valid: false, messages: [] };

    const messages = [];

    const mainMin = rules.main.min;
    const mainMax = rules.main.max;
    if (mainMin || mainMax) {
      if (counts.main < mainMin) {
        messages.push(`Select at least ${mainMin} main balloon${mainMin > 1 ? "s" : ""}.`);
      }
      if (mainMax && counts.main > mainMax) {
        messages.push(`You can select at most ${mainMax} main balloons.`);
      }
    }

    const accentRequired = rules.accent.count;
    if (accentRequired && counts.accent !== accentRequired) {
      messages.push(`Select exactly ${accentRequired} accent balloon${accentRequired > 1 ? "s" : ""}.`);
    }

    const latexRequired = rules.latex.count;
    if (latexRequired && counts.latex !== latexRequired) {
      messages.push(`Select exactly ${latexRequired} latex balloon${latexRequired > 1 ? "s" : ""}.`);
    }

    const weightRequired = rules.weight.count;
    if (weightRequired && counts.weight !== weightRequired) {
      messages.push(`Select exactly ${weightRequired} weight${weightRequired > 1 ? "s" : ""}.`);
    }

    return {
      valid: messages.length === 0,
      messages,
    };
  }, [rules, counts]);

  const handleToggle = (categoryKey, productId) => {
    setSelections((prev) => {
      const next = { ...prev };
      const setCopy = new Set(prev[categoryKey]);

      if (setCopy.has(productId)) {
        setCopy.delete(productId);
        next[categoryKey] = setCopy;
        return next;
      }

      if (categoryKey === "main") {
        const max = rules?.main?.max;
        if (max && setCopy.size >= max) {
          return prev;
        }
      }

      if (categoryKey === "weight") {
        const required = rules?.weight?.count ?? 0;
        if (required === 1) {
          const newSet = new Set();
          newSet.add(productId);
          next[categoryKey] = newSet;
          return next;
        }
      }

      setCopy.add(productId);
      next[categoryKey] = setCopy;
      return next;
    });
  };

  const handleAddToCart = () => {
  if (!products) return;

  const selectedItems = [];

  CATEGORY_KEYS.forEach((key) => {
    const list = products[key] || [];
    const set = selections[key];

    list.forEach((p) => {
      if (set.has(p.id) && p.variantId) {
        selectedItems.push({
          name: p.name,
          variantId: p.variantId,
        });
      }
    });
  });

  if (selectedItems.length === 0) {
    alert("No items selected.");
    return;
  }

  // Build Squarespace cart URL
  const addString = selectedItems
    .map((item) => `${item.variantId}:1`)
    .join(",");

  // CHANGE THIS to your real domain
  const baseUrl = "https://ballunia.com";  // or whatever your store hostname is

  const url = `${baseUrl}/cart?add=${encodeURIComponent(addString)}`;

  console.log("Redirecting to cart URL:", url);

  // Redirect user
  window.location.href = url;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading bundle template...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2>Bundle Builder</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  if (!template || !products) {
    return (
      <div style={styles.container}>
        <h2>Bundle Builder</h2>
        <p>Missing configuration.</p>
      </div>
    );
  }

  const currentList = products[activeCategory] || [];
  const currentCount = counts[activeCategory] ?? 0;

  const categoryRuleText = (() => {
    if (!rules) return "";
    if (activeCategory === "main") {
      const { min, max } = rules.main;
      if (!min && !max) return "Optional.";
      if (min && max) return `Select between ${min} and ${max}.`;
      if (min) return `Select at least ${min}.`;
      if (max) return `Select up to ${max}.`;
    }
    if (activeCategory === "accent") {
      const required = rules.accent.count;
      if (required) return `Select exactly ${required}.`;
    }
    if (activeCategory === "latex") {
      const required = rules.latex.count;
      if (required) return `Select exactly ${required}.`;
    }
    if (activeCategory === "weight") {
      const required = rules.weight.count;
      if (required) return `Select exactly ${required}.`;
    }
    return "";
  })();

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{template.name}</h2>
      <p style={styles.subheading}>
        Template ID: <code>{template.nk}</code>
      </p>

      <div style={styles.tabs}>
        {CATEGORY_KEYS.map((key) => {
          const label = CATEGORY_LABELS[key];
          const isActive = key === activeCategory;
          const count = counts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
            >
              {label}{" "}
              <span style={styles.tabCount}>
                ({count}
                {key === "main" && rules.main.max
                  ? ` / ${rules.main.max}`
                  : ""}
                {key === "accent" && rules.accent.count
                  ? ` / ${rules.accent.count}`
                  : ""}
                {key === "latex" && rules.latex.count
                  ? ` / ${rules.latex.count}`
                  : ""}
                {key === "weight" && rules.weight.count
                  ? ` / ${rules.weight.count}`
                  : ""}
                )
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.categoryInfo}>
        <strong>{CATEGORY_LABELS[activeCategory]}</strong>
        <span style={{ marginLeft: 8, fontSize: 14, color: "#555" }}>
          {categoryRuleText}
        </span>
      </div>

      {currentList.length === 0 ? (
        <p style={{ marginTop: 16 }}>No products available for this category.</p>
      ) : (
        <div style={styles.grid}>
          {currentList.map((product) => {
            const selected = selections[activeCategory].has(product.id);
            return (
              <div
                key={product.id}
                style={{
                  ...styles.card,
                  ...(selected ? styles.cardSelected : {}),
                }}
                onClick={() => handleToggle(activeCategory, product.id)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={styles.cardImage}
                  />
                ) : (
                  <div style={styles.cardImagePlaceholder}>
                    No Image
                  </div>
                )}
                <div style={styles.cardBody}>
                  <div style={styles.cardName}>{product.name}</div>
                  <div style={styles.cardMeta}>
                    SKU: {product.nk}
                    {product.variantId
                      ? ` · Variant: ${product.variantId.slice(0, 8)}…`
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.validation}>
          {!validation.valid && (
            <ul style={styles.validationList}>
              {validation.messages.map((msg, idx) => (
                <li key={idx} style={styles.validationItem}>
                  {msg}
                </li>
              ))}
            </ul>
          )}
          {validation.valid && (
            <p style={{ color: "green", margin: 0 }}>
              Bundle looks good. You’re ready to add to cart.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!validation.valid}
          style={{
            ...styles.addButton,
            ...(validation.valid ? {} : styles.addButtonDisabled),
          }}
        >
          Add Bundle to Cart
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: "24px auto",
    padding: "16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  heading: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
  },
  subheading: {
    margin: "4px 0 16px",
    fontSize: 14,
    color: "#555",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tab: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #ccc",
    background: "#f9f9f9",
    cursor: "pointer",
    fontSize: 14,
  },
  tabActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },
  tabCount: {
    fontSize: 12,
    opacity: 0.8,
    marginLeft: 4,
  },
  categoryInfo: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow 0.15s ease, border-color 0.15s ease",
  },
  cardSelected: {
    borderColor: "#111",
    boxShadow: "0 0 0 2px #111",
  },
  cardImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "contain",
    background: "#f8f8f8",
  },
  cardImagePlaceholder: {
    width: "100%",
    aspectRatio: "1 / 1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f1f1",
    color: "#888",
    fontSize: 12,
  },
  cardBody: {
    padding: "8px 10px 10px",
  },
  cardName: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: "#666",
  },
  footer: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  validation: {
    flex: 1,
    minWidth: 260,
  },
  validationList: {
    margin: 0,
    paddingLeft: 18,
    color: "#c0392b",
    fontSize: 13,
  },
  validationItem: {
    marginBottom: 4,
  },
  addButton: {
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  addButtonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
};

export default BundleBuilder;
