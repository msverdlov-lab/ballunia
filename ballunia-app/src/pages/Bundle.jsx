import React, { useEffect, useState, useMemo } from "react";
// Import the API client to fetch the configuration
import { getBundleConfig, getBundleTemplates } from "../api-client/bundles";
import { useCart } from "../cart/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";

const CATEGORY_KEYS = ["main", "accent", "latex", "weight"];

const CATEGORY_LABELS = {
  main: "Main Balloons",
  accent: "Accent Balloons",
  latex: "Latex Balloons",
  weight: "Weights",
};

// Assuming this component receives the template key via props or context
//export default function Bundle({ templateNK = "BLT-4ACC" }) {
export default function Bundle() {
  // Note: I'm setting a default templateNK for testing. 
  // You would typically get this from the route params or a parent component.

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState(null); // The normalized product list
  const [activeCategory, setActiveCategory] = useState("main");
  //const { addItem } = useCart();
  const {items, addItem, updateItem} = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  // 🆕 Used when editing an existing bundle
  const editingBundleId = location.state?.bundleId ?? null;
  const [bundleTemplates, setBundleTemplates] = useState([]);
  const { templateNK } = useParams();

  // Selections state uses Sets for efficient add/delete/check operations
  const [selections, setSelections] = useState({
    main: new Set(),
    accent: new Set(),
    latex: new Set(),
    weight: new Set(),
  });

  /* ----------------------------------
     Load bundle template options using API client
  ---------------------------------- */
  useEffect(() => {
  getBundleTemplates()
    .then((data) => {
      setBundleTemplates(data.templates || []);
    })
    .catch((err) => {
      console.error("Failed to load bundle templates", err);
    });
  }, []);

  /* ----------------------------------
     1. Load bundle config using API client
  ---------------------------------- */
  useEffect(() => {
  // No template selected yet — do nothing
  if (!templateNK) {
    setTemplate(null);
    setProducts(null);
    setLoading(false);
    return;
  }

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching bundle config for templateNK:", templateNK);

      const data = await getBundleConfig(templateNK);

      setTemplate(data.template);
      setProducts(data.products);

      // Reset selections when switching templates
      setSelections({
        main: new Set(),
        accent: new Set(),
        latex: new Set(),
        weight: new Set(),
      });
    } catch (err) {
      console.error("Error loading bundle config:", err);
      setError(err.message || "Failed to load bundle config");
    } finally {
      setLoading(false);
    }
  };

  fetchConfig();
  }, [templateNK]);

/* ----------------------------------
   1b. Load existing bundle selections (EDIT MODE)
   Runs AFTER products load, BEFORE derived state
---------------------------------- */
  useEffect(() => {
  // If not editing an existing bundle, do nothing
  if (!location?.state?.bundleId) return;
  if (!products) return;
  // If template changed via dropdown, do NOT rehydrate
  if (template?.nk !== templateNK) return;

  // Read cart directly from storage (single source of truth)
  const raw = localStorage.getItem("ballunia_cart_v1");
  if (!raw) return;

  let cartItems;
  try {
    cartItems = JSON.parse(raw);
  } catch {
    return;
  }

  // Find the bundle being edited
  const bundleItem = cartItems.find(
    (x) =>
      x.type === "bundle" &&
      x.bundle?.bundleId === location.state.bundleId
  );

  if (!bundleItem) return;

  // Rehydrate selections from the saved bundle
  const nextSelections = {
    main: new Set(),
    accent: new Set(),
    latex: new Set(),
    weight: new Set(),
  };

  bundleItem.bundle.items.forEach((item) => {
    nextSelections[item.category].add(item.id);
  });

  setSelections(nextSelections);
}, [products, location?.state?.bundleId]);

  /* ----------------------------------
     2. Derived State (Rules, Counts, Validation)
  ---------------------------------- */
  
  // Rules are pulled directly from the normalized template data
  const rules = useMemo(() => {
    if (!template) return null;
    const r = template.rules || {};
    // Template normalization in bundles.js ensures r.main, r.accent, etc. exist 
    // and match the structure of the front-end logic.
    return {
      main: { min: r.main?.min ?? 0, max: r.main?.max ?? 0 },
      accent: { count: r.accent?.count ?? 0 },
      latex: { count: r.latex?.count ?? 0 },
      weight: { count: r.weight?.count ?? 0 },
      allowNumbers: !!template.allowNumbers,
      mixedAllowed: !!template.mixedSizes, // Using mixedSizes from your client's template
    };
  }, [template]);

  // Human-readable rule text for the active category
  const categoryRuleText = useMemo(() => {
  if (!rules) return "";

  switch (activeCategory) {
    case "main": {
      const { min, max } = rules.main;
      if (min && max) return `Select between ${min} and ${max} balloons`;
      if (min) return `Select at least ${min} balloon${min > 1 ? "s" : ""}`;
      if (max) return `Select up to ${max} balloons`;
      return "Select main balloons";
    }

    case "accent": {
      const count = rules.accent.count;
      return count
        ? `Select exactly ${count} accent balloon${count > 1 ? "s" : ""}`
        : "Select accent balloons";
    }

    case "latex": {
      const count = rules.latex.count;
      return count
        ? `Select exactly ${count} latex balloon${count > 1 ? "s" : ""}`
        : "Select latex balloons";
    }

    case "weight": {
      const count = rules.weight.count;
      return count
        ? `Select exactly ${count} weight${count > 1 ? "s" : ""}`
        : "Select a weight";
    }

    default:
      return "";
  }
  }, [activeCategory, rules]);

  // Products for the currently active category
  const currentList = useMemo(() => {
    if (!products) return [];
    return products[activeCategory] || [];
  }, [products, activeCategory]);


  // Current count of selected items per category
  const counts = useMemo(() => {
    const result = {};
    CATEGORY_KEYS.forEach((key) => {
      result[key] = selections[key].size;
    });
    return result;
  }, [selections]);

  // Validation logic based on rules and current counts
  const validation = useMemo(() => {
    if (!rules) return { valid: false, messages: [] };

    const messages = [];

    // --- Main Balloon Rules ---
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

    // --- Exact Count Rules ---
    const checkExactCount = (key, label) => {
        const required = rules[key].count;
        if (required && counts[key] !== required) {
             messages.push(`Select exactly ${required} ${label}${required > 1 ? "s" : ""}.`);
        }
    };

    checkExactCount("accent", "accent balloon");
    checkExactCount("latex", "latex balloon");
    checkExactCount("weight", "weight");

    return {
      valid: messages.length === 0,
      messages,
    };
  }, [rules, counts]);

  /* ----------------------------------
     3. Handlers
  ---------------------------------- */

  const handleToggle = (categoryKey, productId) => {
    setSelections((prev) => {
      const next = { ...prev };
      const setCopy = new Set(prev[categoryKey]);

      // Deselect
      if (setCopy.has(productId)) {
        setCopy.delete(productId);
        next[categoryKey] = setCopy;
        return next;
      }

      // Max limit rule for 'main' category (prevent selection if max reached)
      if (categoryKey === "main") {
        const max = rules?.main?.max;
        if (max && setCopy.size >= max) {
          return prev; 
        }
      }

      // Single select rule for 'weight' (replace existing selection if count is 1)
      if (categoryKey === "weight") {
        const required = rules?.weight?.count ?? 0;
        if (required === 1) {
          const newSet = new Set();
          newSet.add(productId);
          next[categoryKey] = newSet;
          return next;
        }
      }

      // Default: Add the new product
      setCopy.add(productId);
      next[categoryKey] = setCopy;
      return next;
    });
  };

/* ----------------------------------
   Add / Update Bundle in Cart
---------------------------------- */
const handleAddToCart = () => {
  if (!validation.valid) return;

  const bundleItems = [];
  const summary = [];

  CATEGORY_KEYS.forEach((key) => {
    (products[key] || []).forEach((p) => {
      if (selections[key].has(p.id)) {
        bundleItems.push({
          id: p.id,
          nk: p.nk,
          name: p.name,
          category: key,
        });
        summary.push(p.name);
      }
    });
  });

  const bundleId = editingBundleId ?? crypto.randomUUID();

  // 🔁 EDIT MODE — update existing cart item via CartContext
  if (editingBundleId) {
    const existing = items.find(
      (x) =>
        x.type === "bundle" &&
        x.bundle?.bundleId === editingBundleId
    );

    if (!existing) {
      console.error("Editing bundle not found", editingBundleId);
      return;
    }

    updateItem(existing.id, {
      bundle: {
        ...existing.bundle,
        items: bundleItems, // ✅ selections
        summary,            // ✅ cart display (THIS fixes your bug)
      },
    });

    navigate("/cart");
    return;
  } 

  // ➕ NEW BUNDLE
  else {
    addItem({
      type: "bundle",
      name: template.name,
      price: template.price,
      //price:
      //  typeof template.price === "number"
      //    ? template.price
      //    : 79, // TEMP fallback
      quantity: 1,
      bundle: {
        bundleId,
        templateNK: template.nk,
        summary,
        items: bundleItems,
        notes: "",
      },
    });
  }

  navigate("/cart");
  };

/* ----------------------------------
   Render guards
---------------------------------- */

// 🟡 No template selected yet
if (!templateNK) {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Bundle Builder</h2>
      <p style={styles.subheading}>
        Choose a bundle to get started
      </p>

      {bundleTemplates.length > 0 && (
        <select
          onChange={(e) => {
            const nk = e.target.value;
            if (nk) navigate(`/bundle/${nk}`);
          }}
          style={{ padding: 8, fontSize: 14 }}
        >
          <option value="">Select a bundle…</option>
          {bundleTemplates.map((t) => (
            <option key={t.nk} value={t.nk}>
              {t.name} — ${t.price}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ⏳ Loading OR template not yet set
if (loading || !template || !products) {
  return (
    <div style={styles.container}>
      <p>Loading bundle…</p>
    </div>
  );
}

// 🔴 Error state
if (error) {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Bundle Builder</h2>
      <p style={{ color: "red" }}>{error}</p>
    </div>
  );
}




  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {template.name}
        {Number.isFinite(template.price) && (
          <span style={{ fontWeight: 400 }}>
            {" "}
            — ${template.price}
          </span>
        )}

      </h2>
      <p style={styles.subheading}>
        Template ID: <code>{template.nk}</code>
      </p>

      {editingBundleId && (
        <button
          type="button"
          onClick={() => navigate(`/bundle/${template.nk}`)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: 12,
            color: "#0070f3",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 13,
          }}
        >
          Cancel edit
        </button>
      )}


      {/* Bundle Selector */}
      {bundleTemplates.length > 0 && template && (
        <div style={{ margin: "12px 0 16px" }}>
          <label style={{ fontSize: 14, marginRight: 8 }}>
            Choose a bundle:
          </label>

          <select
            value={template.nk}
            disabled={!!editingBundleId}
            onChange={(e) => {
              const nk = e.target.value;
              if (!nk || nk === template.nk) return;
              navigate(`/bundle/${nk}`);
            }}
            style={{
              padding: "6px 10px",
              fontSize: 14,
              borderRadius: 6,
              opacity: editingBundleId ? 0.6 : 1,
              cursor: editingBundleId ? "not-allowed" : "pointer",
            }}
          >
            {bundleTemplates.map((t) => (
              <option key={t.nk} value={t.nk}>
                {t.name} — ${t.price}
              </option>
            ))}
          </select>
        </div>
      )}

    
      {/* Category Tabs */}
      <div style={styles.tabs}>
        {CATEGORY_KEYS.map((key) => {
          const label = CATEGORY_LABELS[key];
          const isActive = key === activeCategory;
          const count = counts[key] ?? 0;
          const ruleLimit = rules?.[key]?.max || rules?.[key]?.count;

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
                {ruleLimit ? ` / ${ruleLimit}` : ""}
                )
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Info */}
      <div style={styles.categoryInfo}>
        <strong>{CATEGORY_LABELS[activeCategory]}</strong>
        <span style={{ marginLeft: 8, fontSize: 14, color: "#555" }}>
          {categoryRuleText}
        </span>
      </div>

      {/* Product Grid */}
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
                {/* Product Image */}
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
                {/* Product Details */}
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

      {/* Footer, Validation, and Add to Cart */}
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
    // Keeping styles here for completeness, 
    // but in a real app, these would be in a separate CSS file or a style library.
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
    border: "1px solid #111",
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
    border: "1px solid #111",
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