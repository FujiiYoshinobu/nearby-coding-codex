import clsx from "clsx";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AvatarSprite from "./AvatarSprite";
import { AVATAR_OPTIONS, AvatarType } from "../api/mockApi";
import "../styles/setup.css";

interface AvatarSetupProps {
  initialName: string;
  initialMessage: string;
  initialAvatar: AvatarType;
  unlocked: AvatarType[];
  level: number;
  progress: {
    currentIntoLevel: number;
    neededForNext: number;
  };
  onSubmit: (payload: { name: string; message: string; avatarType: AvatarType }) => Promise<void> | void;
  loading?: boolean;
}

function formatProgress(current: number, needed: number) {
  if (needed === 0) return "MAX";
  const ratio = Math.min(current / needed, 1);
  return `${Math.round(ratio * 100)}%`;
}

const AvatarSetup = ({
  initialName,
  initialMessage,
  initialAvatar,
  unlocked,
  level,
  progress,
  onSubmit,
  loading = false
}: AvatarSetupProps) => {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState(initialMessage);
  const [avatarType, setAvatarType] = useState<AvatarType>(initialAvatar);
  const [previewWalk, setPreviewWalk] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  useEffect(() => {
    setAvatarType(initialAvatar);
  }, [initialAvatar]);

  useEffect(() => {
    const timer = setInterval(() => setPreviewWalk((value) => !value), 2000);
    return () => clearInterval(timer);
  }, []);

  const progressText = useMemo(
    () => formatProgress(progress.currentIntoLevel, progress.neededForNext),
    [progress]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({ name: name.trim(), message: message.trim(), avatarType });
  };

  return (
    <div className="setup-wrapper">
      <div className="setup-card">
        <header className="setup-header">
          <h1>nearby coding</h1>
          <p>出社準備をして、仲間の広場へ飛び出そう！</p>
        </header>
        <div className="setup-body">
          <div className="preview-pane">
            <div className="avatar-preview">
              <AvatarSprite avatarType={avatarType} bounce walk={previewWalk} size={140} />
            </div>
            <div className="level-info">
              <span className="level-badge">Lv.{level}</span>
              {progress.neededForNext > 0 ? (
                <>
                  <span className="progress-bar">
                    <span
                      className="fill"
                      style={{ width: `${Math.min(1, progress.currentIntoLevel / progress.neededForNext) * 100}%` }}
                    />
                  </span>
                  <span className="progress-text">次のレベルまで {progress.neededForNext - progress.currentIntoLevel} XP</span>
                </>
              ) : (
                <span className="progress-text">最高レベル到達！</span>
              )}
              {progress.neededForNext > 0 && <span className="progress-percent">{progressText}</span>}
            </div>
          </div>
          <form className="setup-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>名前</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ドット コーダー"
                maxLength={20}
                required
              />
            </label>
            <label className="field">
              <span>一言コメント</span>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="よろしくお願いします！"
                maxLength={40}
              />
            </label>
            <fieldset className="field avatars">
              <legend>スキン選択</legend>
              <div className="avatar-grid">
                {AVATAR_OPTIONS.map((option) => {
                  const isUnlocked = unlocked.includes(option.id);
                  const isSelected = avatarType === option.id;
                  return (
                    <label
                      key={option.id}
                      className={clsx("avatar-option", isSelected && "selected", !isUnlocked && "locked")}
                    >
                      <input
                        type="radio"
                        name="avatar"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => isUnlocked && setAvatarType(option.id)}
                        disabled={!isUnlocked}
                      />
                      <AvatarSprite avatarType={option.id} size={80} bounce={isSelected} />
                      <span className="avatar-label">{option.label}</span>
                      {!isUnlocked && <span className="lock-text">Lv.{option.unlockLevel}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <button className="start-button" type="submit" disabled={loading}>
              {loading ? "広場へ接続中..." : "スタート"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvatarSetup;
