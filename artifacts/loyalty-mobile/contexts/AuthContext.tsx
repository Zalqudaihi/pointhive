import { useAuth as useClerkAuth, useClerk } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export type AuthContextValue = {
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthContextValue {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();
  const queryClient = useQueryClient();

  const signOut = useCallback(async () => {
    await clerkSignOut();
    queryClient.clear();
  }, [clerkSignOut, queryClient]);

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    signOut,
  };
}
