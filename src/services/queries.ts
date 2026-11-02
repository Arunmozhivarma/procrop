import { useQuery } from "@tanstack/react-query";
import { fetchLiveCoimbatoreWeather, fetchRecentPredictions } from "@/services/api";

export function useRecentPredictions(limit: number) {
  return useQuery({
    queryKey: ["predictions", "recent", limit],
    queryFn: () => fetchRecentPredictions(limit),
  });
}

export function useLiveWeather() {
  return useQuery({
    queryKey: ["weather", "coimbatore"],
    queryFn: fetchLiveCoimbatoreWeather,
    staleTime: 5 * 60 * 1000,
  });
}
