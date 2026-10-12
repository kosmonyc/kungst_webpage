import { useEffect, useState, type FormEvent } from "react";
import { api, type Project } from "../api";
import { Empty, ErrorBox, Spinner, errorText } from "../components/ui";

export default function Projects({ onOpen }: { onOpen: (id: number) => void }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.projects().then(setProjects).catch((e) => setError(errorText(e)));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const project = await api.createProject(name.trim(), description.trim() || null);
      onOpen(project.id);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <main className="page stack" style={{ gap: 32 }}>
      <div className="row between">
        <div>
          <h1>Projects</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>Each project is one classifier with versioned structures.</p>
        </div>
        {!creating && (
          <button className="btn primary" onClick={() => setCreating(true)}>New project</button>
        )}
      </div>

      <ErrorBox error={error} />

      {creating && (
        <form className="card stack" onSubmit={create}>
          <h2>New project</h2>
          <label className="field">
            <span>Name</span>
            <input className="input" required autoFocus value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Support tickets" />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input className="input" value={description}
              onChange={(e) => setDescription(e.target.value)} placeholder="Route inbound messages by intent and urgency" />
          </label>
          <div className="row">
            <button className="btn primary">Create</button>
            <button type="button" className="btn text" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      {projects === null && !error ? (
        <Spinner />
      ) : projects && projects.length === 0 && !creating ? (
        <Empty title="No projects yet">
          <p className="muted" style={{ margin: 0 }}>Create one, paste a structure, and start classifying.</p>
          <button className="btn blue" onClick={() => setCreating(true)}>Create your first project</button>
        </Empty>
      ) : (
        <div className="grid">
          {projects?.map((p) => (
            <button key={p.id} className="card link stack" style={{ gap: 10 }} onClick={() => onOpen(p.id)}>
              <div className="row between">
                <h2>{p.name}</h2>
                {p.latest_version ? (
                  <span className="chip blue">v{p.latest_version}</span>
                ) : (
                  <span className="chip outline">no structure</span>
                )}
              </div>
              <span className="muted">{p.description || "No description"}</span>
              <span className="faint">Created {new Date(p.created_at).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
