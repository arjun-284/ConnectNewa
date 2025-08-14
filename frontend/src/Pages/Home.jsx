import React, { useEffect, useMemo, useState } from "react";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";
import firstImage from "../../Images/first.jpg";
import secondImage from "../../Images/second.jpeg";
import thirdImage from "../../Images/third.jpg";

/* -------------------- Data -------------------- */
const festivals = [
  {
    image: "/Images/Indra.jpg",
    title: "Indra Jatra Festival",
    description:
      "A major street festival in Kathmandu honoring Lord Indra, featuring masked dances and the living goddess Kumari chariot.",
    link: "/festivals/indra-jatra",
    badge: "Autumn",
    category: "Autumn",
  },
  {
    image: "/Images/Biska.jpg",
    title: "Biska Jatra",
    description:
      "Bhaktapur’s New Year festival with dramatic chariot pulls, tug-of-war, and age-old rituals through the old city.",
    link: "/festivals/biska-jatra",
    badge: "Spring",
    category: "Spring",
  },
  {
    image: "/Images/Gunla.jpg",
    title: "Gunla Bajan Month",
    description:
      "A sacred month of Buddhist music processions—monks and devotees playing traditional instruments at dawn.",
    link: "/festivals/gunla",
    badge: "Monsoon",
    category: "Monsoon",
  },
  {
    image: "/Images/Yomari.jpg",
    title: "Yomari Punhi",
    description:
      "Harvest thanksgiving with yomari (sweet dumplings) offered to deities and shared among families.",
    link: "/festivals/yomari-punhi",
    badge: "Winter",
    category: "Winter",
  },
];

const blogPosts = [
  {
    image: "/Images/yomari.jpg",
    title: "Why Yomari Is More Than Just a Sweet",
    snippet:
      "Yomari is not just a delicacy, but a symbol of gratitude and harvest in Newa households...",
    link: "/blog/yomari-sweet-symbol",
    date: "2025-07-01",
  },
  {
    image: "/Images/Gunla.jpg",
    title: "Preserving Gunla Bajan Traditions",
    snippet:
      "Gunla music month keeps the Buddhist tradition alive in the city. Here’s how locals celebrate...",
    link: "/blog/gunla-preservation",
    date: "2025-06-27",
  },
  {
    image: "/Images/Indra.jpg",
    title: "Street Photography at Indra Jatra",
    snippet:
      "Capture masks, colors, and culture — a photo-essay from the alleys of Kathmandu.",
    link: "/blog/indra-jatra-photography",
    date: "2025-06-19",
  },
  {
    image: "/Images/Indra.jpg",
    title: "Street Photography at Indra Jatra",
    snippet:
      "Capture masks, colors, and culture — a photo-essay from the alleys of Kathmandu.",
    link: "/blog/indra-jatra-photography",
    date: "2025-06-19",
  },
];

/* -------------------- Small UI Bits -------------------- */
const SectionHeading = ({ eyebrow, title, sub }) => (
  <div className="text-center mb-8">
    {eyebrow ? (
      <div className="inline-block mb-2 text-xs tracking-widest uppercase bg-[#0f172a] text-white px-3 py-1 rounded-full">
        {eyebrow}
      </div>
    ) : null}
    <h2 className="text-2xl md:text-4xl font-extrabold text-[#0f172a]">{title}</h2>
    {sub ? <p className="text-gray-600 mt-2">{sub}</p> : null}
  </div>
);

const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-semibold transition ${
      active
        ? "bg-[#0f172a] text-white border-[#0f172a] shadow"
        : "bg-white text-[#0f172a] border-[#0f172a] hover:bg-[#0f172a] hover:text-white"
    }`}
  >
    {children}
  </button>
);

/* -------------------- Home -------------------- */
export default function Home() {
  const heroImages = useMemo(() => [firstImage, secondImage, thirdImage], []);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 4200);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(festivals.map((f) => f.category)))],
    []
  );
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFestivals =
    activeCategory === "All"
      ? festivals
      : festivals.filter((f) => f.category === activeCategory);

  return (
    <div className="bg-[#f7f7fb] min-h-screen text-[#0f172a]">
      <Navigation />

      {/* ================== Hero (split layout) ================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left: Headline & CTAs */}
          <div className="bg-white rounded-3xl p-7 md:p-10 shadow-md border border-gray-100 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0f172a]/5 rounded-full" />
            <div className="absolute -bottom-14 -left-12 w-56 h-56 bg-[#0f172a]/5 rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-3">
                <span className="px-2 py-0.5 bg-[#0f172a] text-white rounded-full">Newa</span>
                <span className="text-[#0f172a]/70">Culture • Festivals • Food</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Dive into the living heritage of the{" "}
                <span className="bg-gradient-to-r from-[#0f172a] to-[#475569] bg-clip-text text-transparent">
                  Kathmandu Valley
                </span>
              </h1>
              <p className="mt-4 text-gray-600">
                Festivals, music, crafts and stories—curated for explorers and locals. Plan
                your cultural calendar and learn the meaning behind every celebration.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#lineup"
                  className="px-5 py-3 rounded-xl bg-[#0f172a] text-white font-semibold hover:bg-[#111827] transition"
                >
                  See Festival Lineup
                </a>
                <a
                  href="/blog"
                  className="px-5 py-3 rounded-xl bg-white border border-[#0f172a] text-[#0f172a] font-semibold hover:bg-gray-50 transition"
                >
                  Read Stories
                </a>
              </div>

              {/* quick stats */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-extrabold">4</div>
                  <div className="text-xs text-gray-500">Seasons</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-extrabold">{festivals.length}</div>
                  <div className="text-xs text-gray-500">Festivals</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-extrabold">100%</div>
                  <div className="text-xs text-gray-500">Local Heritage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image collage with auto-rotate */}
          <div className="grid grid-rows-6 gap-4">
            <div className="row-span-4 rounded-3xl overflow-hidden shadow-lg border border-white/50">
              <img
                key={heroIndex}
                src={heroImages[heroIndex]}
                alt="Hero collage"
                className="w-full h-full object-cover transition-all duration-700 ease-out"
              />
            </div>
            <div className="row-span-2 grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow border border-white/50">
                <img src={secondImage} alt="Newa" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow border border-white/50">
                <img src={thirdImage} alt="Culture" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* slim marquee strip */}
        <div className="mt-6 bg-white rounded-full shadow-sm border border-gray-100 overflow-hidden">
          <div className="whitespace-nowrap animate-[marquee_14s_linear_infinite] py-2 text-sm">
            <span className="mx-6">🏮 Indra Jatra •</span>
            <span className="mx-6">🛕 Biska Jatra •</span>
            <span className="mx-6">🥁 Gunla Bajan •</span>
            <span className="mx-6">🍯 Yomari Punhi •</span>
            <span className="mx-6">🏮 Indra Jatra •</span>
            <span className="mx-6">🛕 Biska Jatra •</span>
            <span className="mx-6">🥁 Gunla Bajan •</span>
            <span className="mx-6">🍯 Yomari Punhi •</span>
          </div>
        </div>
      </section>

      {/* ================== Culture Bites (icon cards) ================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="text-3xl">🍲</div>
            <h3 className="font-bold mt-2">Food & Feasts</h3>
            <p className="text-gray-600 text-sm mt-1">
              Yomari, chhyang, aila, and more—heritage flavors from festive kitchens.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="text-3xl">🥁</div>
            <h3 className="font-bold mt-2">Music & Processions</h3>
            <p className="text-gray-600 text-sm mt-1">
              Dawn processions, bajan ensembles, and masked-dance rhythms.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="text-3xl">🧵</div>
            <h3 className="font-bold mt-2">Crafts & Rituals</h3>
            <p className="text-gray-600 text-sm mt-1">
              Paubha art, metalwork, and sacred rites carried across generations.
            </p>
          </div>
        </div>
      </section>

      {/* ================== Festival Lineup (chips + featured + list) ================== */}
      <section id="lineup" className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <SectionHeading
          eyebrow="Calendar"
          title="Festival Lineup"
          sub="Filter by season and plan what to see next."
        />

        {/* Category chips scroller */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {categories.map((cat) => {
            const count =
              cat === "All"
                ? festivals.length
                : festivals.filter((f) => f.category === cat).length;
          return (
              <Chip
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              >
                {cat} <span className="opacity-70 ml-1">({count})</span>
              </Chip>
            );
          })}
        </div>

        {/* Featured first festival */}
        {filteredFestivals[0] && (
          <a
            href={filteredFestivals[0].link}
            className="group grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-md"
          >
            <div className="md:col-span-1 rounded-2xl overflow-hidden">
              <img
                src={filteredFestivals[0].image}
                alt={filteredFestivals[0].title}
                className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="md:col-span-2 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#0f172a] text-white">
                  Featured
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {filteredFestivals[0].badge}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold mt-2">{filteredFestivals[0].title}</h3>
              <p className="text-gray-600 mt-2">{filteredFestivals[0].description}</p>
              <div className="mt-4">
                <span className="text-[#0f172a] font-semibold group-hover:underline">
                  Learn more →
                </span>
              </div>
            </div>
          </a>
        )}

        {/* Compact list for the rest */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFestivals.slice(1).map((f) => (
            <a
              key={f.title}
              href={f.link}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                    {f.badge}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{f.category}</span>
                </div>
                <h4 className="font-bold text-lg mt-1">{f.title}</h4>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{f.description}</p>
                <div className="mt-3 font-semibold text-[#0f172a]">Explore →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ================== Stories (horizontal scroll) ================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <SectionHeading
          eyebrow="Stories"
          title="Latest from the Blog"
          sub="Essays, guides, and photo-stories from the valley."
        />
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {blogPosts.map((post) => (
            <a
              key={post.title}
              href={post.link}
              className="min-w-[280px] max-w-xs bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500">
                  {new Date(post.date).toLocaleDateString()}
                </div>
                <div className="font-bold text-[#0f172a] mt-1 line-clamp-2">
                  {post.title}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {post.snippet}
                </div>
                <div className="mt-3 text-sm font-semibold text-[#0f172a]">Read →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ================== FAQ (accordion) ================== */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 mt-16">
        <SectionHeading eyebrow="Help" title="Frequently Asked Questions" />
        <div className="space-y-3">
          <details className="bg-white rounded-xl border border-gray-100 p-4">
            <summary className="cursor-pointer font-semibold">What is the best time to visit?</summary>
            <p className="mt-2 text-gray-600">
              Autumn (Indra Jatra) and Spring (Biska Jatra) are vibrant. Winter offers intimate
              rituals like Yomari Punhi, while Monsoon brings Gunla music.
            </p>
          </details>
          <details className="bg-white rounded-xl border border-gray-100 p-4">
            <summary className="cursor-pointer font-semibold">Are these festivals free?</summary>
            <p className="mt-2 text-gray-600">
              Most street processions are free to witness; support local communities by shopping
              crafts and eating at neighborhood kitchens.
            </p>
          </details>
          <details className="bg-white rounded-xl border border-gray-100 p-4">
            <summary className="cursor-pointer font-semibold">Can I photograph the events?</summary>
            <p className="mt-2 text-gray-600">
              Generally yes—be respectful, avoid blocking processions, and ask permission for
              close portraits, especially during rituals.
            </p>
          </details>
        </div>
      </section>

      {/* ================== Newsletter CTA (different style) ================== */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-16 mb-16">
        <div className="rounded-3xl bg-white border border-gray-100 p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold">
              Get festival alerts & insider notes
            </h3>
            <p className="text-gray-600 mt-1">
              Monthly email with upcoming events and cultural context—no spam.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Subscribed! 🎉");
            }}
            className="w-full md:w-auto flex gap-2"
          >
            <input
              type="email"
              required
              placeholder="Your email"
              className="flex-1 md:w-80 px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0f172a]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#0f172a] text-white font-semibold hover:bg-[#111827] transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />

      {/* marquee keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
