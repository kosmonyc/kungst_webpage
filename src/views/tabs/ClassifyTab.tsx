import { useState } from "react";
import { api, type PredictOut, type StructureVersion } from "../../api";
import PredictionCard from "../../components/PredictionCard";
import { Empty, ErrorBox, Spinner, errorText } from "../../components/ui";

interface Props {
  projectId: number;
  versions: StructureVersion[];
  onNeedStructure: () => void;
}

export default function ClassifyTab({ projectId, versions, onNeedStructure }: Props) {
  const [text, setText] = useState("");
  const [version, setVersion] = useState<number | "latest">("latest");
  const [result, setResult] = useState<PredictOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <Empty title="Add a structure first">
        <p className="muted" style={{ margin: 0 }}>The structure defines the questions and options the classifier answers.</p>
        <button className="btn blue" onClick={onNeedStructure}>Go to Structure</button>
      </Empty>
    );
  }

  const texts = text.split("\n").map((t) => t.trim()).filter(Boolean);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.predict(projectId, texts, version === "latest" ? undefined : version));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="card stack">
        <label className="field">
          <span>Texts to classify, one per line</span>
          <textarea
            className="textarea"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && texts.length) run();
            }}
            placeholder={"My order never arrived and nobody answers my emails.\n¿El plan incluye soporte telefónico?"}
          />
        </label>
        <div className="row between">
          <div className="row">
            <select className="select" style={{ width: "auto" }} value={version}
              onChange={(e) => setVersion(e.target.value === "latest" ? "latest" : Number(e.target.value))}>
              <option value="latest">Latest version</option>
              {versions.map((v) => <option key={v.version} value={v.version}>Version {v.version}</option>)}
            </select>
            <span className="faint">{texts.length} text{texts.length === 1 ? "" : "s"} · Ctrl+Enter to run</span>
          </div>
          <button className="btn primary" disabled={busy || texts.length === 0} onClick={run}>
            {busy ? <Spinner /> : "Classify"}
          </button>
        </div>
      </div>

      <ErrorBox error={error} />

      {result && (
        <div className="stack">
          <span className="faint">Results from version {result.version}</span>
          {result.predictions.map((p, i) => <PredictionCard key={i} prediction={p} />)}
        </div>
      )}
    </div>
  );
}
