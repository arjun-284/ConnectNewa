import React, { useState, useEffect } from "react";
import Navigation from "../../Components/Navigation";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

function Exploreadmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "", desc: "", category: "Festivals", year: "", popularity: "", type: ""
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const res = await axios.get("/api/explore");
    setItems(res.data);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = e => {
    const file = e.target.files[0];
    setFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.desc) return toast.error("Title and Description required.");
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append("image", file);

    try {
      if (editId) {
        await axios.put(`/api/explore/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Content updated successfully!");
        setEditId(null);
      } else {
        await axios.post("/api/explore", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Content added successfully!");
      }
      setForm({ title: "", desc: "", category: "Festivals", year: "", popularity: "", type: "" });
      setFile(null);
      setPreview(null);
      fetchData();
    } catch (err) {
      toast.error("An error occurred. Try again.");
    }
  };

  const handleEdit = item => {
    setEditId(item._id);
    setForm({
      title: item.title,
      desc: item.desc,
      category: item.category,
      year: item.year,
      popularity: item.popularity,
      type: item.type
    });
    setPreview(item.image ? (item.image.startsWith('/uploads') ? `http://localhost:5000${item.image}` : item.image) : null);
    setFile(null);
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`/api/explore/${id}`);
      toast.success("Content deleted successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete.");
    }
  };

  const categories = ["Festivals", "Food", "History", "Culture", "Art & Architecture", "Music & Dance", "Language"];

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.desc.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
     
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-rose-700">📌 Explore Admin Panel</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border p-3 rounded-lg shadow-sm" required />
          <input name="year" value={form.year} onChange={handleChange} placeholder="Year" className="border p-3 rounded-lg shadow-sm" />
          <textarea name="desc" value={form.desc} onChange={handleChange} placeholder="Description" className="col-span-full border p-3 rounded-lg shadow-sm" rows="3" required />
          <input type="file" accept="image/*" onChange={handleFile} className="col-span-full" />
          {preview && <img src={preview} alt="preview" className="w-40 h-28 object-cover rounded-md border shadow mx-auto" />}
          <select name="category" value={form.category} onChange={handleChange} className="border p-3 rounded-lg shadow-sm">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select name="popularity" value={form.popularity} onChange={handleChange} className="border p-3 rounded-lg shadow-sm">
            <option value="">Popularity</option>
            <option value="most">Most</option>
            <option value="trending">Trending</option>
            <option value="classic">Classic</option>
          </select>
          <select name="type" value={form.type} onChange={handleChange} className="border p-3 rounded-lg shadow-sm">
            <option value="">Type</option>
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="photo">Photo</option>
          </select>
          <div className="flex gap-3 mt-4 col-span-full justify-center">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl transition duration-300">
              {editId ? "Update" : "Add"} Content
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm({ title: "", desc: "", category: "Festivals", year: "", popularity: "", type: "" }); setFile(null); setPreview(null); }}
                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-xl transition duration-300">
                Cancel
              </button>
            )}
          </div>
        </form>

        <input type="text" placeholder="Search title or description..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full p-3 border mb-6 rounded-lg shadow-sm" />

        <div className="grid gap-6">
          {paginatedItems.map(item => (
            <div key={item._id} className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center gap-5">
              <img
                src={item.image && item.image.startsWith('/uploads') ? `http://localhost:5000${item.image}` : item.image}
                alt={item.title}
                className="w-40 h-28 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-rose-800">{item.title}</h2>
                <p className="text-sm text-gray-700">{item.desc}</p>
                <p className="text-xs text-gray-500 mt-1">
                  📂 {item.category} &nbsp; 📅 {item.year} &nbsp; 🎞 {item.type}
                </p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10 gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${page === i + 1 ? "bg-rose-600 text-white" : "bg-gray-200"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Exploreadmin;
