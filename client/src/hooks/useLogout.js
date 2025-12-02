import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Force set authUser to null immediately
      queryClient.setQueryData(["authUser"], null);
      // Clear all queries
      queryClient.clear();
      // Force a hard redirect to login page
      window.location.href = "/login";
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;