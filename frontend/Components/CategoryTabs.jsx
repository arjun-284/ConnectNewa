// src/Components/CategoryTabs.jsx
import React from "react";

const categories = [
  "Festivals",
  "Food",
  "Music & Dance",
  "Language",
  "Arts & Architecture"
];

function CategoryTabs({ selected, onSelect }) {
  return (
    <div className="flex space-x-2 mb-4">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`px-4 py-1 rounded-full border transition ${
            selected === cat
              ? "bg-red-800 text-white border-red-800"
              : "bg-white border-gray-300 text-gray-700"
          }`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;
