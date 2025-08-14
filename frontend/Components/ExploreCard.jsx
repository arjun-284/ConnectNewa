// ExploreCard.jsx
function ExploreCard({ image, title, desc, ...rest }) {
  // If image is a server path (starts with '/uploads'), prefix backend URL
  const imgSrc = image && image.startsWith('/uploads')
    ? `http://localhost:5000${image}`
    : image;

  return (
    <div className="bg-white rounded-xl p-6 shadow flex flex-col items-center">
      <img
        src={imgSrc}
        alt={title}
        className="w-full h-40 object-cover rounded mb-3"
        style={{ objectFit: "cover" }}
        onError={e => (e.target.style.display = "none")}
      />
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <div className="text-gray-600">{desc}</div>
      {/* ...rest of your card */}
    </div>
  );
}

export default ExploreCard;
