import React, { useState } from 'react';

function Card({ image, title, description, link, badge }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full max-w-sm cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        {badge && (
          <span className="absolute top-3 left-3 bg-[#b01d27] text-white text-xs px-3 py-1 rounded-full shadow font-semibold">{badge}</span>
        )}
        <div className="p-5">
          <h3 className="text-xl font-bold text-green-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{description}</p>
          <button
            className="mt-4 text-sm font-semibold text-[#b01d27] hover:underline"
            onClick={e => { e.stopPropagation(); setShowModal(true); }}
          >
            Read More &rarr;
          </button>
        </div>
      </div>

      {/* Modal for full details */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl"
            >
              &times;
            </button>
            <img src={image} alt={title} className="w-full h-52 object-cover rounded-lg mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-3">{title}</h3>
            <p className="text-gray-700 text-sm mb-5">{description}</p>
            <a
              href={link}
              className="inline-block text-sm text-white bg-[#b01d27] px-4 py-2 rounded-full hover:bg-red-900 transition"
            >
              Visit Festival Page
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default Card;
