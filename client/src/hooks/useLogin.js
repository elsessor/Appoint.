import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login } from "../lib/api";
import { toast } from "react-hot-toast";

const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      // If login cancelled a scheduled deletion, show a message
      if (data?.deletionCancellation?.cancelled) {
        toast.success(
          data.deletionCancellation.message ||
            "You have prevented the deletion of your account. Your account is active again."
        );
      }

      // Invalidate the query to refetch user data
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      // Refresh user data
      await queryClient.refetchQueries({ queryKey: ["authUser"] });
      // Navigate to home
      navigate("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
    }
  });

  return { error, isPending, loginMutation: mutate };
};

export default useLogin;