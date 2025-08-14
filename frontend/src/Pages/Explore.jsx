import React, { useEffect, useState } from "react";
import Navigation from "../../Components/Navigation";
import CategoryTabs from '../../Components/CategoryTabs';
import FilterBar from '../../Components/FilterBar';
import ExploreCard from '../../Components/ExploreCard';

function Explore() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Festivals");
  const [filters, setFilters] = useState({ year: "", popularity: "", type: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/explore")
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const filtered = items.filter(item =>
    item.category === selectedCategory &&
    (!filters.year || item.year === filters.year) &&
    (!filters.popularity || item.popularity === filters.popularity) &&
    (!filters.type || item.type === filters.type) &&
    (item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4 text-red-800">Explore Newari Culture</h1>
        <input
          className="w-full border px-3 py-2 rounded mb-4"
          placeholder="Search festivals, recipes, stories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />
        <FilterBar filters={filters} onChange={setFilters} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {filtered.length === 0 ? (
            <p>No items found.</p>
          ) : (
            filtered.map((item, i) => (
              <ExploreCard key={i} {...item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;
