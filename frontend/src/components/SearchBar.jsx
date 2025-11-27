import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";

const SUGGESTIONS = ["Chest X-Ray", "MRI - Brain", "CT Scan - Abdomen", "Complete Blood Count (CBC)", "Full Body Checkup"];

export default function SearchBar({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState("Panipat, Haryana");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={submit} className="w-full rounded-xl2 border border-mist bg-surface p-2 shadow-card md:flex md:items-stretch">
      <div className="flex flex-1 items-center gap-3 border-b border-mist px-4 py-3 md:border-b-0 md:border-r">
        <Search size={18} className="shrink-0 text-ink/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          list="test-suggestions"
          placeholder="Search a test — e.g. Chest X-Ray"
          className="w-full bg-transparent font-body text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
        />
        <datalist id="test-suggestions">
          {SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-1 items-center gap-3 px-4 py-3">
        <MapPin size={18} className="shrink-0 text-ink/40" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="w-full bg-transparent font-body text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="mt-2 w-full shrink-0 rounded-xl bg-coral px-6 py-3 font-medium text-paper transition hover:bg-coral-deep md:mt-0 md:w-auto"
      >
        Compare prices
      </button>
    </form>
  );
}
