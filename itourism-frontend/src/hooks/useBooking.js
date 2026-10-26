import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export function useRoom(roomId) {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await api.get(`/rooms/${roomId}`)).data,
    enabled: Boolean(roomId),
  });
}

export function useBookingById(id) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => (await api.get(`/bookings/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get("/bookings/my")).data,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (payload) => (await api.post("/bookings", payload)).data,
    onError: (err) => {
      // 409 ROOM_UNAVAILABLE is the double-booking protection answering.
      if (err.code === "ROOM_UNAVAILABLE") {
        toast.error("This room was just booked by someone else. Try different dates.");
      } else {
        toast.error(err.message || "Could not create booking.");
      }
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.put(`/bookings/${id}/cancel`)).data,
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => toast.error(err.message || "Could not cancel booking."),
  });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: async ({ bookingId, phoneNumber }) =>
      (await api.post("/payments/initiate", { bookingId, phoneNumber })).data,
    onError: (err) => toast.error(err.message || "Could not start payment."),
  });
}
