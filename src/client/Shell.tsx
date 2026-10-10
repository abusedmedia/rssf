import { Link } from "react-router-dom";
import { useAppearance } from "./appearance";
import { useAuth } from "./auth";
import { SiteFooter } from "./SiteFooter";
import type { ReactNode } from "react";

export function Shell({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  const { user, logout } = useAuth();
  const { appearance, toggle } = useAppearance();

  return (
    <div className="shell">
      <header className="topbar">
        <Link to={user ? "/app" : "/"} className="brand">
          <span className="brand-mark">RF</span>
          <span>RSSF</span>
        </Link>
        <div className="row">
          <button
            className="btn secondary"
            type="button"
            onClick={toggle}
            aria-label={appearance === "dark" ? "Use light theme" : "Use dark theme"}
          >
            {appearance === "dark" ? "Light" : "Dark"}
          </button>
          {!bare && user ? (
            <>
              <div className="user-chip">
                {user.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <span className="muted">{user.name || user.email}</span>
              </div>
              <button className="btn secondary" type="button" onClick={() => logout()}>
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>
      <main className="shell-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
