import { Link } from "react-router-dom";
import { Star, MapPin, Home, ShieldCheck, Award } from "lucide-react";

export default function ProviderCard({ offer, testSlug, badge }) {
  const { provider, price, reportTimeHours, distanceKm } = offer;

  return (
    <div className="group flex flex-col justify-between gap-4 rounded-xl2 border border-mist bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <img
          src={provider.imageUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/providers/${provider.id}`} className="font-display text-base font-medium text-ink hover:text-teal">
              {provider.name}
            </Link>
            {badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-medium text-teal-deep">
                <Award size={12} /> {badge}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-gold text-gold" /> {provider.rating} ({provider.reviewCount})
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {distanceKm} km
            </span>
            {provider.homeCollection && (
              <span className="flex items-center gap-1">
                <Home size={13} /> Home collection
              </span>
            )}
            {provider.verified && (
              <span className="flex items-center gap-1 text-teal">
                <ShieldCheck size={13} /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink/50">Reports in ~{reportTimeHours}h</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-mono text-xl font-medium text-ink">₹{price}</p>
        <Link
          to={`/book/${testSlug}?providerId=${provider.id}`}
          className="rounded-full bg-teal px-5 py-2 text-sm font-medium text-paper transition hover:bg-teal-deep"
        >
          Book slot
        </Link>
      </div>
    </div>
  );
}
