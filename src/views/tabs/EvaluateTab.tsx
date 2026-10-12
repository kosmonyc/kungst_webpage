import { useState } from "react";
import { api, type Evaluation, type StructureVersion } from "../../api";
import { Bar, Empty, ErrorBox, Spinner, errorText, pct } from "../../components/ui";

interface Props {
  projectId: number;
  versions: StructureVersion[];
}

const METRIC_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  p_gold: "p(gold)",
  margin: "Margin",
  mae: "MAE",
  rmse: "RMSE",
  brier: "Brier",
  log_loss: "Log loss",
  auc: "AUC",
};

export default function EvaluateTab({ projectId, versions }: Props) {
  const [version, setVersion] = useState<number | "latest">("latest");
  const [report, setReport] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (versions.length === 0) {
    return <Empty title="Add a structure first" />;
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setReport(await api.evaluate(projectId, version === "latest" ? undefined : version));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="card row between">
        <div>
          <h2>Evaluate against your examples</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>Scores a structure version on every labelled example of this project.</p>
        </div>
        <div className="row">
          <select className="select" style={{ width: "auto" }} value={version}
            onChange={(e) => setVersion(e.target.value === "latest" ? "latest" : Number(e.target.value))}>
            <option value="latest">Latest version</option>
            {versions.map((v) => <option key={v.version} value={v.version}>Version {v.version}</option>)}
          </select>
          <button className="btn primary" disabled={busy} onClick={run}>{busy ? <Spinner /> : "Run evaluation"}</button>
        </div>
      </div>

      <ErrorBox error={error} />

      {report && (
        <>
          <div className="grid">
            <div className="card">
              <span className="faint">Macro accuracy · v{report.version}</span>
              <div className="stat num" style={{ margin: "8px 0 12px" }}>{pct(report.macro_accuracy)}</div>
              <Bar value={report.macro_accuracy} />
            </div>
            <div className="card">
              <span className="faint">Exact match (all questions right)</span>
              <div className="stat num" style={{ margin: "8px 0 12px" }}>{pct(report.exact_match)}</div>
              <Bar value={report.exact_match} dim />
            </div>
            <div className="card">
              <span className="faint">Examples scored</span>
              <div className="stat num" style={{ margin: "8px 0 12px" }}>{report.n_cases}</div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {Object.entries(report.questions).map(([qid, q]) => (
              <div className="card stack" key={qid} style={{ gap: 14 }}>
                <div className="row between">
                  <h2>{qid}</h2>
                  <span className="chip outline">{q.type}</span>
                </div>
                <table className="table">
                  <tbody>
                    {Object.entries(q.metrics).filter(([k]) => k !== "n").map(([k, v]) => (
                      <tr key={k}>
                        <td className="muted" style={{ padding: "8px 0" }}>{METRIC_LABELS[k] ?? k}</td>
                        <td className="num" style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>
                          {v === null ? "—" : ["accuracy", "p_gold", "margin"].includes(k) ? pct(v) : v.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {q.confusions.length > 0 ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <span className="faint">Most common mistakes</span>
                    {q.confusions.slice(0, 4).map((c) => (
                      <div className="row between" key={`${c.gold}-${c.predicted}`}>
                        <span>{c.gold} <span className="faint">→</span> {c.predicted}</span>
                        <span className="chip">{c.count}×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="faint">No mistakes on these examples</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
