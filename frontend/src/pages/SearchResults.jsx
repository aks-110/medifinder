import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client.js";
import SearchBar from "../components/SearchBar.jsx";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["tests", q, category],
    queryFn: async () =>
      (await client.get("/tests", { params: { q, category: category || undefined } })).data.results,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <SearchBar initialQuery={q} />

      <h1 className="mt-10 font-display text-2xl font-medium text-ink">
        {isLoading ? "Searching…" : `${data?.length || 0} results${q ? ` for "${q}"` : ""}`}
      </h1>

      <div className="mt-6 space-y-4">
        {(data || []).map((test) => (
          <Link
            key={test.id}
            to={`/tests/${test.slug}`}
            className="block rounded-xl2 border border-mist bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg text-ink">{test.name}</p>
                <p className="mt-1 text-sm capitalize text-ink/50">{test.category}</p>
              </div>
              <span className="rounded-full bg-teal-light px-4 py-1.5 text-sm font-medium text-teal-deep">
                Compare prices
              </span>
            </div>
          </Link>
        ))}

        {!isLoading && data?.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-mist p-8 text-center text-ink/50">
            No tests matched "{q}". Try "X-Ray", "MRI", or "CBC".
          </p>
        )}
      </div>
    </div>
  );
}
