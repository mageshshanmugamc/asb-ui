import React from "react";

const Content: React.FC = () => {
  return (
    <main className="content">
      <h1>Main Content</h1>
      <p>This section scrolls independently while header and sidebar remain fixed.</p>
      <p>Try adding more content here to see the scroll effect.</p>
    </main>
  );
};

export default Content;
