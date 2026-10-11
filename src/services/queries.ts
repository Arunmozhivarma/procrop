import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ApiError,
  type AuthResponse,
  autoPredictFromPhotoAndWeather,
  fetchCurrentUser,
  fetchDatasetSummary,
  fetchLatestPrediction,
  fetchLiveCoimbatoreWeather,
  fetchPreviousWeekData,
  fetchRecentPredictions,
  loginUser,
  type PredictionResponse,
  registerUser,
  runLatestObservationPrediction,
  runUnifiedPrediction,
  updateProfile,
} from "@/services/api";
import { setToken, useAuthToken } from "@/services/auth";

// Live weather and the signed-in user change rarely; database rows are always refetched.
const SLOW_CHANGING_STALE_MS = 5 * 60 * 1000;

export const queryKeys = {
  datasetSummary: ["dataset", "summary"],
  latestObservation: ["dataset", "latest-observation"],
  predictions: ["predictions"],
  recentPredictions: (limit: number) => ["predictions", "recent", limit],
  latestPrediction: ["predictions", "latest"],
  weather: ["weather", "coimbatore"],
  currentUser: ["auth", "me"],
} as const;

/** Row counts, columns and latest rows of weekly_observations. */
export function useDatasetSummary() {
  return useQuery({ queryKey: queryKeys.datasetSummary, queryFn: fetchDatasetSummary });
}

/** Latest weekly_observations row; `data` is null when the table is empty. */
export function useLatestObservation() {
  return useQuery({ queryKey: queryKeys.latestObservation, queryFn: fetchPreviousWeekData });
}

export function useRecentPredictions(limit: number) {
  return useQuery({
    queryKey: queryKeys.recentPredictions(limit),
    queryFn: () => fetchRecentPredictions(limit),
  });
}

/** Most recently saved prediction; `data` is null when the predictions table is empty. */
export function useLatestPrediction() {
  return useQuery({ queryKey: queryKeys.latestPrediction, queryFn: fetchLatestPrediction });
}

export function useLiveWeather() {
  return useQuery({
    queryKey: queryKeys.weather,
    queryFn: fetchLiveCoimbatoreWeather,
    staleTime: SLOW_CHANGING_STALE_MS,
  });
}

/** Every prediction endpoint inserts a predictions row, so saved-prediction queries are refreshed. */
function usePredictionMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.predictions }),
  });
}

export function useUnifiedPrediction() {
  return usePredictionMutation(runUnifiedPrediction);
}

export function useLatestObservationPrediction() {
  return usePredictionMutation<void, PredictionResponse>(() => runLatestObservationPrediction());
}

export function useLeafPhotoPrediction() {
  return usePredictionMutation((file: File) => autoPredictFromPhotoAndWeather(file));
}

/** The signed-in user's row of the users table. Signed out when there is no valid token. */
export function useCurrentUser() {
  const token = useAuthToken();
  const query = useQuery({
    queryKey: [...queryKeys.currentUser, token],
    queryFn: fetchCurrentUser,
    enabled: token !== null,
    staleTime: SLOW_CHANGING_STALE_MS,
  });

  const sessionRejected = query.error instanceof ApiError && query.error.status === 401;
  useEffect(() => {
    if (sessionRejected) setToken(null);
  }, [sessionRejected]);

  return {
    user: token !== null ? (query.data ?? null) : null,
    isSignedIn: token !== null,
    isLoading: token !== null && query.isPending,
    error: token !== null && !sessionRejected ? query.error : null,
    refetch: query.refetch,
  };
}

function useSessionMutation<TInput>(mutationFn: (input: TInput) => Promise<AuthResponse>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: ({ token, user }) => {
      setToken(token);
      queryClient.setQueryData([...queryKeys.currentUser, token], user);
    },
  });
}

export function useLogin() {
  return useSessionMutation(loginUser);
}

export function useRegister() {
  return useSessionMutation(registerUser);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    // The API returns the updated users row, so every view of the account shows it at once.
    onSuccess: (user) => queryClient.setQueriesData({ queryKey: queryKeys.currentUser }, user),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return () => {
    setToken(null);
    queryClient.removeQueries({ queryKey: queryKeys.currentUser });
  };
}
