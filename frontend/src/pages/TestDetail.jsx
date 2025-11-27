import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed } from "lucide-react";
import client from "../api/client.js";
import ProviderCard from "../components/ProviderCard.jsx";
import { useGeolocation } from "../hooks/useGeolocation.js";

const SORTS = [
  { key: "price", label: "Price: low to high" },
  { key: "rating", label: "Highest rated" },
  { key: "distance", label: "Nearest" },
];

export default function TestDetail() {
  const { slug } = useParams();
  const [sort, setSort] = useState("price");
  const [filters, setFilters] = useState({ homeCollection: false, insuranceAccepted: false, openNow: false });
  const { coords, status: geoStatus } = useGeolocation();

  const { data, isLoading } = useQuery({
    queryKey: ["test", slug, sort, filters, coords],
    queryFn: async () =>
      (
        await client.get(`/tests/${slug}`, {
          params: {
            sort,
            homeCollection: filters.homeCollection || undefined,
            insuranceAccepted: filters.insuranceAccepted || undefined,
            openNow: filters.openNow || undefined,
            lat: coords?.lat,
            lng: coords?.lng,
          },
        })
      ).data,
  });

  const badgeFor = (providerId) => {
    if (!data) return null;
    if (providerId === data.highlights.cheapestProviderId) return "Cheapest";
    if (providerId === data.highlights.bestRatedProviderId) return "Top rated";
    if (providerId === data.highlights.fastestProviderId) return "Fastest reports";
    return null;
  };

  if (isLoading || !data) {
    return <div className="py-24 text-center text-ink/40">Loading…</div>;
  }

  const { test, offers } = data;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-wide text-teal">{test.category}</p>
      <h1 className="mt-1 font-display text-3xl font-medium text-ink">{test.name}</h1>
      <p className="mt-3 max-w-2xl text-ink/60">{test.description}</p>

      <div className="mt-6 grid gap-4 rounded-xl2 border border-mist bg-surface p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Preparation</p>
          <p className="mt-1 text-sm text-ink/70">{test.preparation}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Typical report time</p>
          <p className="mt-1 text-sm text-ink/70">Within {test.reportTimeHours} hours</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-medium text-ink">{offers.length} providers near you</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/40">
            <LocateFixed size={12} />
            {data.usingRealLocation
              ? "Using your device location"
              : geoStatus === "denied"
              ? "Location denied — showing approximate distances"
              : "Approximate distances — enable location for accuracy"}
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-mist bg-surface px-4 py-2 text-sm text-ink/70 focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { key: "homeCollection", label: "Home collection" },
          { key: "insuranceAccepted", label: "Insurance accepted" },
          { key: "openNow", label: "Open now" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilters((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              filters[f.key] ? "border-teal bg-teal-light text-teal-deep" : "border-mist text-ink/60 hover:border-teal"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {offers.map((offer) => (
          <ProviderCard key={offer.provider.id} offer={offer} testSlug={slug} badge={badgeFor(offer.provider.id)} />
        ))}
        {offers.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-mist p-8 text-center text-ink/50">
            No providers match these filters. Try clearing one.
          </p>
        )}
      </div>
    </div>
  );
}
