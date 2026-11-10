import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { STORAGE_KEY } from "./constants";
import { emptyUserData, loadUserData, saveUserData } from "./storage";
import type { ActivityKind, PracticeMark, UserData } from "../types";

interface UserApi {
  data: UserData;
  setPractice: (questionId: string, mark: PracticeMark) => void;
  addManual: (questionId: string) => void;
  removeFromMistakes: (questionId: string) => void;
  setNote: (questionId: string, note: string) => void;
  setMastered: (questionId: string, mastered: boolean) => void;
  replaceAll: (data: UserData) => void;
  reset: () => void;
}

const UserContext = createContext<UserApi | null>(null);

function withActivity(data: UserData, questionId: string, kind: ActivityKind): UserData {
  return {
    ...data,
    activity: [{ questionId, at: new Date().toISOString(), kind }, ...data.activity].slice(0, 200),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserData>(() => loadUserData());

  useEffect(() => {
    saveUserData(data);
  }, [data]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) setData(loadUserData());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const api = useMemo<UserApi>(() => {
    return {
      data,
      setPractice(questionId, mark) {
        setData((current) => {
          const mastered = { ...current.mastered };
          if (mark === "不会") delete mastered[questionId];
          return withActivity(
            { ...current, practice: { ...current.practice, [questionId]: mark }, mastered },
            questionId,
            mark,
          );
        });
      },
      addManual(questionId) {
        setData((current) => {
          if (current.manual.includes(questionId)) return current;
          const mastered = { ...current.mastered };
          delete mastered[questionId];
          return withActivity(
            { ...current, manual: [...current.manual, questionId], mastered },
            questionId,
            "加入错题",
          );
        });
      },
      removeFromMistakes(questionId) {
        setData((current) => {
          const practice = { ...current.practice };
          if (practice[questionId] === "不会") delete practice[questionId];
          return withActivity(
            { ...current, practice, manual: current.manual.filter((id) => id !== questionId) },
            questionId,
            "移出错题",
          );
        });
      },
      setNote(questionId, note) {
        setData((current) => {
          const notes = { ...current.notes };
          const trimmed = note.slice(0, 2000);
          if (trimmed.trim()) notes[questionId] = trimmed;
          else delete notes[questionId];
          if (notes[questionId] === current.notes[questionId]) return current;
          return { ...current, notes };
        });
      },
      setMastered(questionId, masteredFlag) {
        setData((current) => {
          const mastered = { ...current.mastered };
          if (masteredFlag) mastered[questionId] = true;
          else delete mastered[questionId];
          return withActivity({ ...current, mastered }, questionId, masteredFlag ? "掌握" : "取消掌握");
        });
      },
      replaceAll(next) {
        setData(next);
      },
      reset() {
        setData(emptyUserData());
      },
    };
  }, [data]);

  return <UserContext.Provider value={api}>{children}</UserContext.Provider>;
}

export function useUser(): UserApi {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUser 必须放在 UserProvider 里");
  return value;
}
