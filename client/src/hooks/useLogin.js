import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login } from "../lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: async () => {
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