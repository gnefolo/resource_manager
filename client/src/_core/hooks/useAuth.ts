import { useCallback, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { getLoginUrl } from "../../const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options: UseAuthOptions = {}) {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && options.redirectOnUnauthenticated) {
      try {
        window.location.href = getLoginUrl();
      } catch (e) {
        console.error("Failed to redirect to login:", e);
      }
    }
  }, [isLoading, isAuthenticated, options.redirectOnUnauthenticated]);

  const trpcUtils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await trpcUtils.auth.me.invalidate();
      await trpcUtils.invalidate(); // Invalidate everything to be safe
      window.location.href = "/";
    },
  });

  const logout = useCallback(async () => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    loading: isLoading,
    error,
    isAuthenticated,
    refresh: refetch,
    logout,
  };
}
