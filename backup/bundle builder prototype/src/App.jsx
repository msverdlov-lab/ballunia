import React from "react";
import BundleBuilder from "./BundleBuilder";

function App() {
  // For now we hard-code the template NK.
  // Later you can make this dynamic (URL param, dropdown, etc.).
  return <BundleBuilder templateNK="BLT-4ACC" />;
}

export default App;
