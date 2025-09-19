import { useSession } from "@/hooks/useSession";
import { useSearchHistory as useRemote } from "@/hooks/useSearchHistory";
import { useSearchHistoryLocal as useLocal } from "@/hooks/useSearchHistoryLocal";

export function useSearchHistoryUnified() {
  const { user } = useSession();
  const local = useLocal();
  const remote = useRemote();

  // If authenticated, prefer remote; otherwise local
  if (user) {
    return remote;
  }
  return local;
}
