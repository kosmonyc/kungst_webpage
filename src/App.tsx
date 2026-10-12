import { useEffect, useState } from "react";
import { api, getToken, setToken, type User } from "./api";
import Auth from "./views/Auth";
import Projects from "./views/Projects";
import ProjectView from "./views/Project";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    if (getToken()) {
      api.me().then(setUser).catch(() => setToken(null)).finally(() => setChecking(false));
    }
    const onLogout = () => setUser(null);
    window.addEventListener("kungst:logout", onLogout);
    return () => window.removeEventListener("kungst:logout", onLogout);
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
    setProjectId(null);
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => setProjectId(null)}>
          kungst<span>.</span>
        </button>
        <span className="faint">zero-shot classification</span>
        <div className="spacer" />
        {user && (
          <>
            <span className="faint">{user.email}</span>
            <button className="btn ghost small" onClick={logout}>Log out</button>
          </>
        )}
      </header>

      {checking ? null : !user ? (
        <Auth onAuthenticated={setUser} />
      ) : projectId === null ? (
        <Projects onOpen={setProjectId} />
      ) : (
        <ProjectView projectId={projectId} onBack={() => setProjectId(null)} />
      )}
    </>
  );
}
