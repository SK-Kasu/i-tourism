import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // matches the backend's 60s search cache; avoids redundant refetches
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
