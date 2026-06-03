import { useSession } from "@/hooks/useSession";
import { useSavedAnalyses as useRemote } from "@/hooks/useSavedAnalyses";
import { useSavedAnalysesLocal as useLocal, SavedAnalysis as LocalSavedAnalysis } from "@/hooks/useSavedAnalysesLocal";

type SaveAnalysisInput = Omit<LocalSavedAnalysis, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type UpdateAnalysisInput = {
  id: string;
  tags?: string[];
  notes?: string;
};

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
      const remoteMap = new Set(remote.savedAnalyses.map((a) => `${a.occupation_code}::${a.occupation_title}`));
      for (const [key, a] of localMap.entries()) {
        if (!remoteMap.has(key)) {
          remote.saveAnalysis({
            occupation_code: a.occupation_code,
            occupation_title: a.occupation_title,
            analysis_data: a.analysis_data,
            tags: a.tags,
            notes: a.notes,
          });
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
      for (const a of remote.savedAnalyses) {
        const localAnalysis: LocalSavedAnalysis = {
          id: a.id,
          occupation_code: a.occupation_code,
          occupation_title: a.occupation_title,
          analysis_data: a.analysis_data,
          tags: a.tags || [],
          notes: a.notes,
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
        local.saveAnalysis(localAnalysis);
      }
    } catch (e) {
      console.error("syncRemoteToLocal error", e);
    }
  };

  // Standardized mutation wrappers
  const saveAnalysis = (data: SaveAnalysisInput) => {
    if (isGuest) {
      // local expects an object; id optional
      return local.saveAnalysis(data);
    }
    return remote.saveAnalysis(data);
  };

  const updateAnalysis = (data: UpdateAnalysisInput) => {
    if (isGuest) {
      return local.updateAnalysis(data.id, { tags: data.tags, notes: data.notes } as Partial<LocalSavedAnalysis>);
    }
    return remote.updateAnalysis(data);
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
