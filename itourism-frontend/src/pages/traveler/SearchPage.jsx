import { useSearchParams } from "react-router-dom";
import TopNav from "../../components/layout/TopNav.jsx";
import SearchBar from "../../components/search/SearchBar.jsx";
import PropertyCard from "../../components/search/PropertyCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useSearch } from "../../hooks/useSearch.js";

export default function SearchPage() {
  // Search state lives in the URL so results can be shared and survive refresh.
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get("q") || "",
    checkIn: params.get("checkIn") || "",
    checkOut: params.get("checkOut") || "",
  };

  const { data, isLoading, isError, error } = useSearch(filters);

  function onSearch(next) {
    const p = {};
    Object.entries(next).forEach(([k, v]) => v && (p[k] = v));
    setParams(p);
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-heading-lg text-ink-900 mb-4">Find your stay</h1>
        <SearchBar key={params.toString()} initial={filters} onSearch={onSearch} />

        <section className="mt-6" aria-live="polite">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size={32} />
            </div>
          )}

          {isError && (
            <p className="text-danger-500 text-body py-8 text-center">
              {error?.message || "Could not load properties."}
            </p>
          )}

          {data && data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-heading-md text-ink-900">No stays found</p>
              <p className="text-body text-ink-600 mt-1">
                Try another destination or different dates.
              </p>
            </div>
          )}

          {data && data.length > 0 && (
            <>
              <p className="text-body text-ink-600 mb-3">
                {data.length} propert{data.length === 1 ? "y" : "ies"} found
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((p) => (
                  <PropertyCard key={p.id} property={p} checkIn={filters.checkIn} checkOut={filters.checkOut} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
