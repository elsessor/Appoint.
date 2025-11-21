import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
  });

  // Handle both response formats: { user: {...} } and direct user object
  const userData = authUser.data?.user || authUser.data;
  
  return { isLoading: authUser.isLoading, authUser: userData };
};
export default useAuthUser;