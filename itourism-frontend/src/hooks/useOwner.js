import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export function useMyProperties() {
  return useQuery({
    queryKey: ["my-properties"],
    queryFn: async () => (await api.get("/properties/mine")).data,
  });
}

export function useOwnerBookings() {
  return useQuery({
    queryKey: ["owner-bookings"],
    queryFn: async () => (await api.get("/bookings/owner")).data,
  });
}

export function useRoomCalendar(roomId, month) {
  return useQuery({
    queryKey: ["calendar", roomId, month],
    queryFn: async () => (await api.get(`/rooms/${roomId}/calendar`, { params: { month } })).data,
    enabled: Boolean(roomId),
    staleTime: 0,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post("/properties", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-properties"] }),
    onError: (err) => toast.error(err.message || "Could not save the property."),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, ...body }) => (await api.post(`/rooms/${propertyId}/rooms`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-properties"] }),
    onError: (err) => toast.error(err.message || "Could not save the room."),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, ...body }) => (await api.put(`/rooms/${roomId}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-properties"] }),
    onError: (err) => toast.error(err.message || "Could not update the room."),
  });
}

export function useSetBlocked(roomId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dates, blocked }) => (await api.put(`/rooms/${roomId}/availability`, { dates, blocked })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar", roomId] }),
    onError: (err) => toast.error(err.message || "Could not update the calendar."),
  });
}
