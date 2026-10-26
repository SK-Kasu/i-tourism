import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useSearch({ q, checkIn, checkOut }) {
  const hasDates = Boolean(checkIn && checkOut);
  return useQuery({
    queryKey: ["properties", q || "", hasDates ? checkIn : "", hasDates ? checkOut : ""],
    queryFn: async () => {
      const params = { q: q || undefined };
      if (hasDates) Object.assign(params, { checkIn, checkOut });
      const res = await api.get("/properties", { params });
      return res.data;
    },
    enabled: !hasDates || checkOut > checkIn,
  });
}

export function useProperty(id) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => (await api.get(`/properties/${id}`)).data,
    enabled: Boolean(id),
  });
}
