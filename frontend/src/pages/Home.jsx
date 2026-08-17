import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bone, Brain, Scan, Droplet, Waves, ClipboardList, Star, MapPin } from "lucide-react";
import SearchBar from "../components/SearchBar.jsx";
import client from "../api/client.js";

const CATEGORIES = [
  { label: "X-Ray", icon: Bone, q: "X-Ray" },
  { label: "MRI", icon: Brain, q: "MRI" },
  { label: "CT Scan", icon: Scan, q: "CT Scan" },
  { label: "Blood Tests", icon: Droplet, q: "Blood" },
  { label: "Ultrasound", icon: Waves, q: "Ultrasound" },
  { label: "Health Packages", icon: ClipboardList, q: "Package", category: "package" },
];

const STEPS = [
  { n: "01", title: "Search a test", body: "Tell us what you need — an X-ray, a lab panel, or a full checkup." },
  { n: "02", title: "Compare providers", body: "See real prices, ratings, and slot availability side by side." },
  { n: "03", title: "Book instantly", body: "Pick a slot, pay online, and get your confirmation on the spot." },
];

export default function Home() {
  const { data } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => (await client.get("/providers")).data.results,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative mx-auto mb-8 flex h-16 w-16 items-center justify-center">
            <span className="absolute inline-block h-16 w-16 rounded-full border border-teal/40 animate-scanRing" />
            <span className="absolute inline-block h-16 w-16 rounded-full border border-teal/40 animate-scanRing [animation-delay:0.8s]" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-teal text-paper">
              <Scan size={18} />
            </span>
          </div>

          <h1 className="text-balance font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
            Find the best healthcare tests near you
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-ink/60">
            Compare prices across hospitals and labs, check real-time availability, and book instantly.
          </p>

          <div className="mt-10">
            <SearchBar />
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map(({ label, icon: Icon, q, category }) => (
            <Link
              key={label}
              to={`/search?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ""}`}
              className="flex flex-col items-center gap-2 rounded-xl2 border border-mist bg-surface p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-teal hover:shadow-card"
            >
              <Icon size={20} className="text-teal" />
              <span className="text-xs font-medium text-ink/70">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular providers */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-medium text-ink">Popular nearby providers</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(data || []).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl2 border border-mist bg-surface shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
              <img src={p.imageUrl} alt="" className="h-32 w-full object-cover" />
              <div className="p-4">
                <p className="font-display text-sm font-medium text-ink">{p.name}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-ink/60">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="fill-gold text-gold" /> {p.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {p.address.split(",")[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-2xl font-medium text-ink">How it works</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="font-mono text-sm text-teal">{s.n}</p>
                <p className="mt-2 font-display text-lg text-ink">{s.title}</p>
                <p className="mt-1.5 text-sm text-ink/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending packages CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl2 bg-teal px-8 py-10 text-paper sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-2xl font-medium">Full Body Checkup, from ₹2,400</h3>
            <p className="mt-1 text-paper/80">Compare every lab near you before you book.</p>
          </div>
          <Link
            to="/search?q=Full+Body+Checkup&category=package"
            className="shrink-0 rounded-full bg-coral px-6 py-3 font-medium text-paper transition hover:bg-coral-deep"
          >
            Compare packages
          </Link>
        </div>
      </section>
    </div>
  );
}

