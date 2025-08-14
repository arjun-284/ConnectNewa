import React from "react";

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <select
        className="border rounded px-2 py-1"
        value={filters.year}
        onChange={e => onChange({ ...filters, year: e.target.value })}
      >
        <option value="">All Years</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
        {/* Add dynamic years as needed */}
      </select>
      <select
        className="border rounded px-2 py-1"
        value={filters.popularity}
        onChange={e => onChange({ ...filters, popularity: e.target.value })}
      >
        <option value="">Popularity</option>
        <option value="most">Most Popular</option>
        <option value="least">Least Popular</option>
      </select>
      <select
        className="border rounded px-2 py-1"
        value={filters.type}
        onChange={e => onChange({ ...filters, type: e.target.value })}
      >
        <option value="">All Types</option>
        <option value="article">Article</option>
        <option value="video">Video</option>
        <option value="photo">Photo</option>
      </select>
    </div>
  );
}

export default FilterBar;
