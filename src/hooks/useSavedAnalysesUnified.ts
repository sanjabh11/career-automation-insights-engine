import { useSession } from "@/hooks/useSession";
import { useSavedAnalyses as useRemote } from "@/hooks/useSavedAnalyses";
import { useSavedAnalysesLocal as useLocal, SavedAnalysis as LocalSavedAnalysis } from "@/hooks/useSavedAnalysesLocal";

export function useSavedAnalysesUnified() {
  const { user } = useSession();
  const local = useLocal();
  const remote = useRemote();

  const isGuest = !user;

  const syncLocalToRemote = async () => {
    if (!user) return;
    try {
      // naive sync: push local items that don't exist remotely (by title+code)
      const localMap = new Map(local.savedAnalyses.map(a => [`${a.occupation_code}::${a.occupation_title}`, a] as const));
      const remoteMap = new Set(remote.savedAnalyses.map((a: any) => `${a.occupation_code}::${a.occupation_title}`));
      for (const [key, a] of localMap.entries()) {
        if (!remoteMap.has(key)) {
          remote.saveAnalysis({
            occupation_code: a.occupation_code,
            occupation_title: a.occupation_title,
            analysis_data: a.analysis_data,
            tags: a.tags,
            notes: a.notes,
          } as any);
        }
      }
    } catch (e) {
      // swallow for now; UI can handle errors around this call
      console.error("syncLocalToRemote error", e);
    }
  };

  const syncRemoteToLocal = async () => {
    try {
      // copy remote into local (append-only)
      for (const a of remote.savedAnalyses as any[]) {
        local.saveAnalysis({
          id: a.id,
          occupation_code: a.occupation_code,
          occupation_title: a.occupation_title,
          analysis_data: a.analysis_data,
          tags: a.tags || [],
          notes: a.notes,
          created_at: a.created_at,
          updated_at: a.updated_at,
        } as unknown as LocalSavedAnalysis);
      }
    } catch (e) {
      console.error("syncRemoteToLocal error", e);
    }
  };

  // Standardized mutation wrappers
  const saveAnalysis = (data: any) => {
    if (isGuest) {
      // local expects an object; id optional
      return local.saveAnalysis(data as LocalSavedAnalysis);
    }
    return remote.saveAnalysis(data);
  };

  const updateAnalysis = (data: { id: string; tags?: string[]; notes?: string }) => {
    if (isGuest) {
      return local.updateAnalysis(data.id, { tags: data.tags, notes: data.notes } as Partial<LocalSavedAnalysis>);
    }
    return remote.updateAnalysis(data as any);
  };

  const deleteAnalysis = (id: string) => {
    if (isGuest) return local.deleteAnalysis(id);
    return remote.deleteAnalysis(id);
  };

  return {
    isGuest,
    savedAnalyses: isGuest ? local.savedAnalyses : remote.savedAnalyses,
    isLoading: isGuest ? local.isLoading : remote.isLoading,
    saveAnalysis,
    updateAnalysis,
    deleteAnalysis,
    syncLocalToRemote,
    syncRemoteToLocal,
  };
}
