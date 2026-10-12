import { useEffect, useState } from "react";
import { api, getToken, setToken, type User } from "./api";
import UserMenu from "./components/UserMenu";
import Auth from "./views/Auth";
import Profile from "./views/Profile";
import Projects from "./views/Projects";
import ProjectView from "./views/Project";

type View = { kind: "projects" } | { kind: "project"; id: number } | { kind: "profile" };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [view, setView] = useState<View>({ kind: "projects" });

  useEffect(() => {
    if (getToken()) {
      api.me().then(setUser).catch(() => setToken(null)).finally(() => setChecking(false));
    }
    const onLogout = () => setUser(null);
    window.addEventListener("kungst:logout", onLogout);
    return () => window.removeEventListener("kungst:logout", onLogout);
  }, []);

  const home = () => setView({ kind: "projects" });
  const logout = () => {
    setToken(null);
    setUser(null);
    home();
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={home}>
          kungst<span>.</span>
        </button>
        <span className="faint tagline">zero-shot classification</span>
        <div className="spacer" />
        {user && <UserMenu user={user} onProfile={() => setView({ kind: "profile" })} onLogout={logout} />}
      </header>

      {checking ? null : !user ? (
        <Auth onAuthenticated={setUser} />
      ) : view.kind === "profile" ? (
        <Profile user={user} onUpdated={setUser} onBack={home} onLogout={logout} />
      ) : view.kind === "project" ? (
        <ProjectView projectId={view.id} onBack={home} />
      ) : (
        <Projects onOpen={(id) => setView({ kind: "project", id })} />
      )}
    </>
  );
}
