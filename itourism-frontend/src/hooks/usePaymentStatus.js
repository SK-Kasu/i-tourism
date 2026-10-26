import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Polls the payment status every 4s while the traveler answers the M-Pesa
 * prompt. Stops on a final state (HELD = paid, FAILED). The page enforces
 * the overall ~90s timeout (coding roadmap Section 3.4).
 */
export function usePaymentStatus(bookingId, active) {
  return useQuery({
    queryKey: ["payment-status", bookingId],
    queryFn: async () => (await api.get(`/payments/status/${bookingId}`)).data,
    enabled: Boolean(bookingId) && active,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "HELD" || s === "FAILED" ? false : 4000;
    },
    staleTime: 0,
  });
}
