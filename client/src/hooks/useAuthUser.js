import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (previously cacheTime)
  });

  // Handle both response formats: { user: {...} } and direct user object
  const userData = authUser.data?.user || authUser.data;
  
  return { isLoading: authUser.isLoading, authUser: userData };
};
export default useAuthUser;