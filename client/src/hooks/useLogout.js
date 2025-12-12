import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import { disconnectSocket } from "../lib/socket";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      console.log('[useLogout] Logout successful');
      
      // Clear localStorage first
      try {
        localStorage.removeItem("authUser");
        console.log('[useLogout] Cleared authUser from localStorage');
      } catch (error) {
        console.error("Failed to clear auth cache:", error);
      }
      
      // Clear React Query
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();
      
      // Disconnect socket - this sends presence:offline to other clients
      console.log('[useLogout] Disconnecting socket');
      disconnectSocket();
      
      // Small delay to ensure disconnect event is sent before redirect
      setTimeout(() => {
        console.log('[useLogout] Redirecting to landing page');
        window.location.href = "/";
      }, 100);
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;