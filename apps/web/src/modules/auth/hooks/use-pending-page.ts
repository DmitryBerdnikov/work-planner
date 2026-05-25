import { useRouter } from "@tanstack/react-router";
import { authClient } from "@shared/auth/auth-client";

export const usePendingPage = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    await router.navigate({ to: "/auth" });
  };

  return { handleSignOut };
};
