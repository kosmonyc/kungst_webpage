import { useEffect, useRef, useState } from "react";
import type { User } from "../api";

export function displayName(user: User): string {
  return user.name || user.email.split("@")[0];
}

export function initials(user: User): string {
  const source = user.name?.trim() || user.email.split("@")[0];
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(user)}
    </span>
  );
}

interface Props {
  user: User;
  onProfile: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onProfile, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="usermenu" ref={root}>
      <button className="usermenu-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="usermenu-name">{displayName(user)}</span>
        <Avatar user={user} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <Avatar user={user} size={44} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{displayName(user)}</div>
              <div className="faint ellipsis">{user.email}</div>
            </div>
          </div>
          <button role="menuitem" className="menu-item" onClick={pick(onProfile)}>Profile</button>
          <button role="menuitem" className="menu-item danger" onClick={pick(onLogout)}>Log out</button>
        </div>
      )}
    </div>
  );
}
