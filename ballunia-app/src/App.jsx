import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Shop from "./pages/Shop.jsx";
import Bundle from "./pages/Bundle.jsx";
import Cart from "./pages/Cart.jsx";

import { Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";

export default function App() {
  const { totalQty } = useCart();
  
  return (
    <BrowserRouter>
      <nav style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1000, padding: "1rem", borderBottom: "1px solid #ddd" }}>
        <Link to="/" style={{ marginRight: "1rem" }}>Shop</Link>
        <Link to="/bundle" style={{ marginRight: "1rem" }}>Bundle Builder</Link>
        <Link to="/cart">Cart ({totalQty})</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/bundle" element={<Bundle />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  );
}

