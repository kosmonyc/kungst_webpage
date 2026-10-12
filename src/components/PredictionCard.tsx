import type { Prediction, QuestionResult } from "../api";
import { Bar, pct } from "./ui";

function QuestionBox({ q }: { q: QuestionResult }) {
  if (q.type === "binary") {
    const yes = q.probability >= 0.5;
    return (
      <div className="qbox">
        <div className="row between">
          <span className="faint">{q.question_id}</span>
          <span className="chip outline">binary</span>
        </div>
        <div className="answer">{yes ? q.option_id : `not ${q.option_id}`}</div>
        <div className="opt">
          <span className="muted">p({q.option_id})</span>
          <span className="num">{pct(q.probability)}</span>
          <Bar value={q.probability} />
        </div>
      </div>
    );
  }
  const top = q.options[0];
  return (
    <div className="qbox">
      <div className="row between">
        <span className="faint">{q.question_id}</span>
        <span className="chip outline">{q.type}</span>
      </div>
      <div className="answer">
        {top.option_id}
        {q.type === "score" && (
          <span className="muted num" style={{ fontSize: 14, fontWeight: 500, marginLeft: 8 }}>
            ≈ {q.expected_value.toFixed(2)}
          </span>
        )}
      </div>
      <div className="faint" title={top.label}
        style={{ marginTop: -6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {top.label}
      </div>
      {q.options.slice(0, 4).map((o, i) => (
        <div className="opt" key={o.option_id}>
          <span className={i === 0 ? "" : "muted"}>{o.option_id}</span>
          <span className="num">{pct(o.probability)}</span>
          <Bar value={o.probability} dim={i !== 0} />
        </div>
      ))}
    </div>
  );
}

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div className="card">
      <div style={{ fontSize: 17, fontWeight: 500 }}>“{prediction.query}”</div>
      <div className="result">
        {prediction.questions.map((q) => (
          <QuestionBox key={q.question_id} q={q} />
        ))}
      </div>
    </div>
  );
}
