import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "ballunia_cart_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadInitialCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeItem(item) {
  // Minimal validation + defaults
  const qty = Number(item.quantity ?? 1);
  return {
    id: item.id ?? crypto.randomUUID(),
    type: item.type, // "product" | "bundle"
    name: item.name ?? "Item",
    price: Number(item.price ?? 0),
    quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
    imageUrl: item.imageUrl ?? null,
    product: item.product ?? null,
    bundle: item.bundle ?? null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const incoming = normalizeItem(action.payload);

      // Merge logic:
      // - product: merge by sku if provided, else by name+price
      // - bundle: never auto-merge unless bundleId matches
      const matchIndex = state.findIndex((x) => {
        if (incoming.type !== x.type) return false;

        if (incoming.type === "product") {
          const aSku = incoming.product?.sku;
          const bSku = x.product?.sku;
          if (aSku && bSku) return aSku === bSku;
          return incoming.name === x.name && incoming.price === x.price;
        }

        if (incoming.type === "bundle") {
          const aId = incoming.bundle?.bundleId;
          const bId = x.bundle?.bundleId;
          return aId && bId && aId === bId;
        }

        return false;
      });

      if (matchIndex >= 0) {
        const next = [...state];
        next[matchIndex] = {
          ...next[matchIndex],
          quantity: next[matchIndex].quantity + incoming.quantity,
        };
        return next;
      }

      return [...state, incoming];
    }

    case "REMOVE_ITEM":
      return state.filter((x) => x.id !== action.payload);

    case "SET_QTY": {
      const { id, quantity } = action.payload;
      const q = Number(quantity);
      if (!Number.isFinite(q)) return state;

      if (q <= 0) return state.filter((x) => x.id !== id);

      return state.map((x) => (x.id === id ? { ...x, quantity: q } : x));
    }

    case "CLEAR":
      return [];

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitialCart);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, x) => sum + x.price * x.quantity, 0);
  }, [items]);

  const totalQty = useMemo(() => {
    return items.reduce((sum, x) => sum + x.quantity, 0);
  }, [items]);

  const api = useMemo(
    () => ({
      items,
      subtotal,
      totalQty,
      addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
      removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: id }),
      setQty: (id, quantity) => dispatch({ type: "SET_QTY", payload: { id, quantity } }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [items, subtotal, totalQty]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
