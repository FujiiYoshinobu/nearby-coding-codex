import { useCallback, useEffect, useMemo, useState } from "react";
import AvatarSetup from "./components/AvatarSetup";
import Plaza, { PopupMessage } from "./components/Plaza";
import {
  AvatarType,
  PublicUser,
  encounter,
  fetchTodayUsers,
  getProgress,
  getUnlockedAvatars,
  login,
  subscribeToLogins
} from "./api/mockApi";

interface StoredProfile {
  userId: string;
  name: string;
  message: string;
  avatarType: AvatarType;
}

interface ProfileFormState {
  name: string;
  message: string;
  avatarType: AvatarType;
}

const STORAGE_KEY = "nearby-coding-profile";

const defaultProfile: ProfileFormState = {
  name: "",
  message: "",
  avatarType: "human"
};

function loadStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredProfile) : null;
  } catch (error) {
    console.warn("Failed to parse stored profile", error);
    return null;
  }
}

function saveProfile(profile: StoredProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

let generatedId: string | null = null;

function ensureUserId(existingId?: string | null) {
  if (existingId) return existingId;
  if (generatedId) return generatedId;
  if (typeof window !== "undefined" && "crypto" in window && window.crypto.randomUUID) {
    generatedId = window.crypto.randomUUID();
  } else {
    generatedId = Math.random().toString(36).slice(2);
  }
  return generatedId;
}

function App() {
  const [screen, setScreen] = useState<"setup" | "plaza">("setup");
  const [profile, setProfile] = useState<ProfileFormState>(defaultProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [visitors, setVisitors] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [unlocked, setUnlocked] = useState<AvatarType[]>(["human"]);

  useEffect(() => {
    const stored = loadStoredProfile();
    if (stored) {
      setProfile({ name: stored.name, message: stored.message, avatarType: stored.avatarType });
      setUserId(stored.userId);
    } else {
      const generated = ensureUserId();
      setUserId(generated);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToLogins((user) => {
      if (user.userId === currentUser.userId) return;
      setVisitors((prev) => {
        const exists = prev.some((visitor) => visitor.userId === user.userId);
        if (exists) {
          return prev.map((visitor) => (visitor.userId === user.userId ? user : visitor));
        }
        return [...prev, user];
      });
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchTodayUsers().then((users) => {
      setVisitors(users);
    });
  }, [currentUser]);

  const progress = useMemo(() => getProgress(currentUser?.xp ?? 0), [currentUser?.xp]);

  const pushPopup = useCallback((popup: { text: string; tone?: "xp" | "level" }) => {
    setPopups((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: popup.text,
        tone: popup.tone ?? "xp"
      }
    ]);
  }, []);

  const handleLogin = useCallback(
    async (values: ProfileFormState) => {
      if (!userId) {
        const generated = ensureUserId();
        setUserId(generated);
      }
      const finalId = userId ?? ensureUserId();
      setLoading(true);
      try {
        const response = await login({
          userId: finalId,
          name: values.name,
          message: values.message,
          avatarType: values.avatarType
        });
        setCurrentUser(response.user);
        setVisitors(response.users);
        setUnlocked(getUnlockedAvatars(response.level));
        setProfile(values);
        saveProfile({ ...values, userId: finalId });
        setScreen("plaza");
        if (response.xpGained > 0) {
          pushPopup({
            text: `+${response.xpGained} XP (出社ボーナス)`
          });
        }
        if (response.leveledUp) {
          pushPopup({ text: "LEVEL UP! 新しいアバターが解放されたよ", tone: "level" });
          setUnlocked(getUnlockedAvatars(response.level));
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, pushPopup]
  );

  const handleEncounter = useCallback(
    async (other: PublicUser) => {
      if (!currentUser) return { xpGained: 0, leveledUp: false };
      const result = await encounter(currentUser.userId, other.userId);
      setCurrentUser(result.user);
      setVisitors((prev) =>
        prev.map((visitor) => (visitor.userId === result.user.userId ? result.user : visitor))
      );
      if (result.xpGained > 0) {
        pushPopup({ text: `+${result.xpGained} XP (${other.name} と遭遇！)` });
      }
      if (result.leveledUp) {
        pushPopup({ text: "LEVEL UP! 新アバター解放🎉", tone: "level" });
        setUnlocked(getUnlockedAvatars(result.level));
      }
      return { xpGained: result.xpGained, leveledUp: result.leveledUp };
    },
    [currentUser, pushPopup]
  );

  const handleDismissPopup = useCallback((id: string) => {
    setPopups((current) => current.filter((popup) => popup.id !== id));
  }, []);

  const handleEdit = useCallback(() => {
    setScreen("setup");
  }, []);

  return screen === "setup" ? (
    <AvatarSetup
      initialName={profile.name}
      initialMessage={profile.message}
      initialAvatar={profile.avatarType}
      unlocked={unlocked}
      level={progress.level}
      progress={{ currentIntoLevel: progress.currentIntoLevel, neededForNext: progress.neededForNext }}
      onSubmit={handleLogin}
      loading={loading}
    />
  ) : currentUser ? (
    <Plaza
      currentUser={currentUser}
      visitors={visitors}
      onEncounter={handleEncounter}
      onEditProfile={handleEdit}
      popups={popups}
      onDismissPopup={handleDismissPopup}
    />
  ) : null;
}

export default App;
