import { useCallback, useEffect, useState } from "react";
import { api, type Project, type StructureVersion } from "../api";
import { ErrorBox, Spinner, errorText } from "../components/ui";
import ClassifyTab from "./tabs/ClassifyTab";
import EvaluateTab from "./tabs/EvaluateTab";
import ExamplesTab from "./tabs/ExamplesTab";
import StructureTab from "./tabs/StructureTab";

const TABS = ["Classify", "Structure", "Examples", "Evaluate"] as const;
type Tab = (typeof TABS)[number];

export default function ProjectView({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<StructureVersion[]>([]);
  const [tab, setTab] = useState<Tab>("Classify");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([api.project(projectId), api.structures(projectId)]);
      setProject(p);
      setVersions(v);
      return v;
    } catch (e) {
      setError(errorText(e));
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    reload().then((v) => v.length === 0 && setTab("Structure"));
  }, [reload]);

  async function remove() {
    if (!project) return;
    try {
      await api.deleteProject(project.id);
      onBack();
    } catch (e) {
      setError(errorText(e));
    }
  }

  if (!project) {
    return <main className="page">{error ? <ErrorBox error={error} /> : <Spinner />}</main>;
  }
  const latest = versions.at(-1) ?? null;

  return (
    <main className="page">
      <button className="btn text small" style={{ paddingLeft: 0 }} onClick={onBack}>← All projects</button>
      <div className="row between" style={{ marginTop: 12 }}>
        <div>
          <div className="row">
            <h1>{project.name}</h1>
            {latest && <span className="chip blue">v{latest.version}</span>}
          </div>
          {project.description && <p className="muted" style={{ margin: "6px 0 0" }}>{project.description}</p>}
        </div>
        <DeleteButton onConfirm={remove} />
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "tab active" : "tab"} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      <ErrorBox error={error} />

      {tab === "Classify" && <ClassifyTab projectId={projectId} versions={versions} onNeedStructure={() => setTab("Structure")} />}
      {tab === "Structure" && <StructureTab projectId={projectId} versions={versions} onSaved={reload} />}
      {tab === "Examples" && <ExamplesTab projectId={projectId} latest={latest} />}
      {tab === "Evaluate" && <EvaluateTab projectId={projectId} versions={versions} />}
    </main>
  );
}

// Two-step inline confirm instead of a browser dialog.
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <div className="row">
      <span className="faint">Delete project and all its data?</span>
      <button className="btn ghost small danger" onClick={onConfirm}>Delete</button>
      <button className="btn text small" onClick={() => setArmed(false)}>Cancel</button>
    </div>
  ) : (
    <button className="btn text small danger" onClick={() => setArmed(true)}>Delete project</button>
  );
}
