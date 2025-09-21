import clsx from "clsx";
import { memo } from "react";
import { AvatarType } from "../api/mockApi";
import "../styles/avatar.css";

interface AvatarSpriteProps {
  avatarType: AvatarType;
  size?: number;
  bounce?: boolean;
  walk?: boolean;
  flip?: boolean;
  className?: string;
}

const AvatarSprite = memo(function AvatarSprite({
  avatarType,
  size = 96,
  bounce = false,
  walk = false,
  flip = false,
  className
}: AvatarSpriteProps) {
  return (
    <div
      className={clsx("avatar-sprite", bounce && "bounce", walk && "walk", flip && "flip", className)}
      style={{ ["--sprite-size" as string]: `${size}px` }}
      data-type={avatarType}
    >
      <div className="sprite-head" />
      <div className="sprite-body" />
      <div className="sprite-feet">
        <span />
        <span />
      </div>
    </div>
  );
});

export default AvatarSprite;
