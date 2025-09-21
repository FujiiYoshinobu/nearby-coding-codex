import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AvatarSprite from "./AvatarSprite";
import {
  PublicUser,
  AvatarType,
  getProgress,
  AVATAR_OPTIONS
} from "../api/mockApi";
import "../styles/plaza.css";

export interface PopupMessage {
  id: string;
  text: string;
  tone: "xp" | "level";
}

interface EncounterResult {
  xpGained: number;
  leveledUp: boolean;
}

interface PlazaProps {
  currentUser: PublicUser;
  visitors: PublicUser[];
  onEncounter: (user: PublicUser) => Promise<EncounterResult>;
  onEditProfile: () => void;
  popups: PopupMessage[];
  onDismissPopup: (id: string) => void;
}

const ENCOUNTER_DURATION = 6000;

function getAvatarLabel(type: AvatarType) {
  return AVATAR_OPTIONS.find((option) => option.id === type)?.label ?? type;
}

const Plaza = ({
  currentUser,
  visitors,
  onEncounter,
  onEditProfile,
  popups,
  onDismissPopup
}: PlazaProps) => {
  const [queue, setQueue] = useState<PublicUser[]>([]);
  const [activeVisitor, setActiveVisitor] = useState<PublicUser | null>(null);
  const [encounterResult, setEncounterResult] = useState<EncounterResult | null>(null);
  const displayedIdsRef = useRef(new Set<string>());
  const encounterLockRef = useRef<string | null>(null);

  useEffect(() => {
    visitors
      .filter((user) => user.userId !== currentUser.userId)
      .forEach((user) => {
        if (!displayedIdsRef.current.has(user.userId)) {
          displayedIdsRef.current.add(user.userId);
          setQueue((prev) => [...prev, user]);
        }
      });
  }, [visitors, currentUser.userId]);

  useEffect(() => {
    if (!activeVisitor && queue.length > 0) {
      const [next, ...rest] = queue;
      setActiveVisitor(next);
      setQueue(rest);
    }
  }, [queue, activeVisitor]);

  useEffect(() => {
    if (!activeVisitor) return;
    encounterLockRef.current = activeVisitor.userId;
    onEncounter(activeVisitor).then((result) => setEncounterResult(result));
    const timeout = setTimeout(() => {
      if (encounterLockRef.current === activeVisitor.userId) {
        encounterLockRef.current = null;
      }
      setEncounterResult(null);
      setActiveVisitor(null);
    }, ENCOUNTER_DURATION);
    return () => {
      clearTimeout(timeout);
    };
  }, [activeVisitor, onEncounter]);

  const progress = useMemo(() => getProgress(currentUser.xp), [currentUser.xp]);

  const xpToNext = progress.neededForNext - progress.currentIntoLevel;

  const xpSummary = xpToNext > 0 ? `次のレベルまで ${xpToNext} XP` : "レベルMAX";

  const handlePopupAnimationEnd = useCallback(
    (id: string) => {
      onDismissPopup(id);
    },
    [onDismissPopup]
  );

  return (
    <div className="plaza-screen">
      <header className="plaza-topbar">
        <div className="user-meta">
          <AvatarSprite avatarType={currentUser.avatarType} size={72} bounce walk />
          <div>
            <h2>{currentUser.name}</h2>
            <span className="user-message">{currentUser.message || "よろしくお願いします！"}</span>
          </div>
        </div>
        <div className="level-panel">
          <div className="level-row">
            <span className="level-tag">Lv.{progress.level}</span>
            <span className="xp-text">累計XP {currentUser.xp}</span>
          </div>
          <div className="progress-shell">
            <span
              className="progress-fill"
              style={{
                width:
                  progress.neededForNext === 0
                    ? "100%"
                    : `${Math.min(1, progress.currentIntoLevel / progress.neededForNext) * 100}%`
              }}
            />
          </div>
          <span className="xp-remaining">{xpSummary}</span>
        </div>
        <button className="edit-button" type="button" onClick={onEditProfile}>
          アバター設定に戻る
        </button>
      </header>
      <main className="plaza-stage">
        <div className="plaza-bg">
          <div className="plaza-ground" />
          <div className="plaza-lights" />
        </div>
        <div className="plaza-center">
          <AvatarSprite avatarType={currentUser.avatarType} size={140} bounce walk className="self-avatar" />
          <div className="self-shadow" />
        </div>
        {activeVisitor && (
          <div className="visitor-row">
            <div className="visitor-entry">
              <AvatarSprite avatarType={activeVisitor.avatarType} size={120} walk bounce className="visitor-avatar" />
              <div className="speech-bubble">
                <span className="visitor-name">{activeVisitor.name}</span>
                <span className="visitor-message">{activeVisitor.message || "おはよう！"}</span>
                <span className="visitor-meta">Lv.{activeVisitor.level} / {getAvatarLabel(activeVisitor.avatarType)}</span>
              </div>
            </div>
            {encounterResult && encounterResult.xpGained > 0 && (
              <div className="xp-popup">+{encounterResult.xpGained} XP</div>
            )}
          </div>
        )}
      </main>
      <aside className="popup-layer">
        {popups.map((popup) => (
          <div
            key={popup.id}
            className={`popup ${popup.tone}`}
            onAnimationEnd={() => handlePopupAnimationEnd(popup.id)}
          >
            {popup.text}
          </div>
        ))}
      </aside>
    </div>
  );
};

export default Plaza;
