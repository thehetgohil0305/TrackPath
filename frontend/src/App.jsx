import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from "recharts";

const API = "http://127.0.0.1:5000/api";
const initial = {
  age: 17, studytime: 2, failures: 0, absences: 4, traveltime: 1,
  famrel: 4, freetime: 3, goout: 3, health: 4, Medu: 2, Fedu: 2,
  schoolsup: "no", famsup: "yes", paid: "no", activities: "yes", higher: "yes", internet: "yes",
  school: "GP", sex: "F", address: "U", famsize: "GT3", Pstatus: "T",
  Mjob: "other", Fjob: "other", reason: "course", guardian: "mother", nursery: "yes", romantic: "no"
};

function MetricCard({ icon, label, value, hint }) {
  return <div className="metric-card">
    <div className="metric-icon"><i className={`bi ${icon}`} /></div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value ?? "—"}</div>
    <div className="metric-hint">{hint}</div>
  </div>;
}

function SelectField({ label, name, value, onChange, options }) {
  return <div className="col-md-6">
    <label className="form-label" htmlFor={name}>{label}</label>
    <select id={name} name={name} className="form-select" value={value} onChange={onChange}>
      {options.map(([v, text]) => <option value={v} key={v}>{text}</option>)}
    </select>
  </div>;
}

function NumberField({ label, name, value, onChange, min, max }) {
  return <div className="col-md-6">
    <label className="form-label" htmlFor={name}>{label}</label>
    <input className="form-control" id={name} name={name} type="number"
      min={min} max={max} value={value} onChange={onChange} required />
    <div className="field-range">Range: {min}–{max}</div>
  </div>;
}

export default function App() {
  const [form, setForm] = useState(initial);
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState("checking");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [batchMessage, setBatchMessage] = useState("");

  useEffect(() => {
    axios.get(`${API}/health`).then(() => setHealth("connected"))
      .catch(() => setHealth("offline"));
    axios.get(`${API}/overview`).then(r => setOverview(r.data)).catch(() => {});
  }, []);

  const update = (e) => {
    const { name, value, type } = e.target;
    setForm(old => ({ ...old, [name]: type === "number" ? Number(value) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setPrediction(null);
    try {
      const res = await axios.post(`${API}/predict`, form);
      setPrediction(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach the prediction API. Check that Flask is running.");
    } finally { setLoading(false); }
  };

  const batchUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchMessage("Preparing batch predictions…");
    const data = new FormData(); data.append("file", file);
    try {
      const res = await axios.post(`${API}/predict-batch`, data, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = "edupredict_results.csv"; a.click();
      URL.revokeObjectURL(url);
      setBatchMessage("Predictions generated. The results CSV was downloaded.");
    } catch (err) {
      let msg = "Batch prediction failed. Check that your CSV contains the required model feature columns.";
      if (err.response?.data instanceof Blob) {
        try { msg = JSON.parse(await err.response.data.text()).error || msg; } catch {}
      }
      setBatchMessage(msg);
    }
    e.target.value = "";
  };

  const metrics = overview?.metrics;
  const importance = useMemo(() => metrics?.feature_importance || [], [metrics]);
  const gradeDistribution = overview?.grade_distribution || [];
  const categoryData = prediction ? [
    { name: "Predicted grade", value: prediction.predicted_grade },
    { name: "Remaining scale", value: Math.max(0, 20 - prediction.predicted_grade) }
  ] : [];
  const categoryColor = prediction?.predicted_grade < 10 ? "needs" : prediction?.predicted_grade < 14 ? "developing" : "strong";

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><i className="bi bi-mortarboard-fill" /></div>
        <div><strong>EduPredict</strong><span>AI STUDENT ANALYTICS</span></div>
      </div>
      <div className="nav-caption">WORKSPACE</div>
      <a className="side-link active" href="#overview"><i className="bi bi-grid-1x2-fill" /> Overview</a>
      <a className="side-link" href="#predict"><i className="bi bi-magic" /> Grade prediction</a>
      <a className="side-link" href="#insights"><i className="bi bi-bar-chart-line-fill" /> Model insights</a>
      <a className="side-link" href="#batch"><i className="bi bi-file-earmark-spreadsheet" /> Batch prediction</a>
      <div className="sidebar-bottom">
        <div className="side-note"><i className="bi bi-info-circle" /><div><strong>Academic prototype</strong><p>Predictions are estimates, not definitive student assessments.</p></div></div>
        <div className="connection"><span className={`status-dot ${health}`} /> API {health === "connected" ? "connected" : health === "offline" ? "offline" : "checking"}</div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div><div className="eyebrow">STUDENT SUCCESS / ANALYTICS</div><h1>Academic performance overview</h1></div>
        <div className="topbar-right"><span className="live-pill"><span className={`status-dot ${health}`} /> {health === "connected" ? "System online" : "System status"}</span><div className="avatar">EP</div></div>
      </header>

      <section id="overview" className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker"><i className="bi bi-stars" /> MACHINE LEARNING WORKSPACE</div>
          <h2>Understand performance.<br/><span>Support student success.</span></h2>
          <p>Explore academic patterns and estimate a final grade using a Random Forest model trained on historical student data.</p>
          <a className="btn btn-light hero-button" href="#predict">Make a prediction <i className="bi bi-arrow-up-right ms-2" /></a>
        </div>
        <div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
          <div className="hero-icon"><i className="bi bi-mortarboard-fill" /></div>
          <div className="floating-stat stat-top"><i className="bi bi-graph-up-arrow"></i><span>Model insights</span></div>
          <div className="floating-stat stat-bottom"><i className="bi bi-stars"></i><span>Data-driven estimates</span></div>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard icon="bi-people-fill" label="DATASET RECORDS" value={metrics?.dataset_rows ?? "—"} hint="Mathematics students" />
        <MetricCard icon="bi-bullseye" label="MEAN ABSOLUTE ERROR" value={metrics ? metrics.mae : "—"} hint="Grade points · lower is better" />
        <MetricCard icon="bi-activity" label="ROOT MEAN SQUARED ERROR" value={metrics ? metrics.rmse : "—"} hint="Grade points · lower is better" />
        <MetricCard icon="bi-graph-up" label="R² SCORE" value={metrics ? metrics.r2 : "—"} hint="Held-out test set" />
      </section>

      <section className="content-grid" id="insights">
        <div className="panel">
          <div className="panel-heading"><div><h3>Grade distribution</h3><p>Observed final grades in the dataset</p></div><span className="chart-chip">G3 · 0–20</span></div>
          {gradeDistribution.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={245}>
            <BarChart data={gradeDistribution} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf4" />
              <XAxis dataKey="grade" tick={{ fill: "#758198", fontSize: 11 }} />
              <YAxis tick={{ fill: "#758198", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebf3" }} />
              <Bar dataKey="count" name="Students" fill="#625cf5" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer></div> : <div className="empty-chart">Dataset overview appears after the backend starts.</div>}
        </div>
        <div className="panel dataset-panel">
          <div className="panel-heading"><div><h3>Dataset snapshot</h3><p>Source and key statistics</p></div><i className="bi bi-database dataset-icon" /></div>
          <div className="source-label">DATA SOURCE</div>
          <strong className="dataset-title">UCI Student Performance</strong>
          <p className="dataset-description">Mathematics course · Portuguese secondary schools</p>
          <div className="snapshot-row"><span>Mean final grade</span><strong>{overview?.dataset?.mean_grade ?? "—"} <small>/ 20</small></strong></div>
          <div className="snapshot-row"><span>Grade ≥ 10 (dataset)</span><strong>{overview?.dataset?.pass_rate != null ? `${overview.dataset.pass_rate}%` : "—"}</strong></div>
          <div className="snapshot-row"><span>Mean absences</span><strong>{overview?.dataset?.mean_absences ?? "—"}</strong></div>
          <a href="https://archive.ics.uci.edu/dataset/320/student+performance" target="_blank" rel="noreferrer" className="source-link">View original dataset <i className="bi bi-box-arrow-up-right" /></a>
        </div>
      </section>

      <section className="panel prediction-panel" id="predict">
        <div className="section-heading"><div><div className="eyebrow">PREDICTIVE ANALYTICS</div><h3>Estimate a student's final grade</h3><p>Enter the student's available background and study information. All fields are editable.</p></div>
          <div className="model-tag"><i className="bi bi-cpu" /> Random Forest Regressor</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-section-title"><span>01</span> Student profile</div>
          <div className="row g-3">
            <NumberField label="Age" name="age" value={form.age} onChange={update} min="15" max="22" />
            <SelectField label="School" name="school" value={form.school} onChange={update} options={[["GP","Gabriel Pereira"],["MS","Mousinho da Silveira"]]} />
            <SelectField label="Home address" name="address" value={form.address} onChange={update} options={[["U","Urban"],["R","Rural"]]} />
            <SelectField label="Sex (dataset field)" name="sex" value={form.sex} onChange={update} options={[["F","F"],["M","M"]]} />
          </div>
          <div className="form-section-title mt-4"><span>02</span> Study and academic history</div>
          <div className="row g-3">
            <SelectField label="Weekly study time" name="studytime" value={form.studytime} onChange={update} options={[[1,"Less than 2 hours"],[2,"2–5 hours"],[3,"5–10 hours"],[4,"More than 10 hours"]]} />
            <SelectField label="Past class failures" name="failures" value={form.failures} onChange={update} options={[[0,"0"],[1,"1"],[2,"2"],[3,"3 or more (coded as 3)"]]} />
            <NumberField label="School absences" name="absences" value={form.absences} onChange={update} min="0" max="93" />
            <SelectField label="Travel time to school" name="traveltime" value={form.traveltime} onChange={update} options={[[1,"Less than 15 minutes"],[2,"15–30 minutes"],[3,"30–60 minutes"],[4,"More than 60 minutes"]]} />
            <SelectField label="Mother's education" name="Medu" value={form.Medu} onChange={update} options={[[0,"None"],[1,"Primary"],[2,"Grades 5–9"],[3,"Secondary"],[4,"Higher education"]]} />
            <SelectField label="Father's education" name="Fedu" value={form.Fedu} onChange={update} options={[[0,"None"],[1,"Primary"],[2,"Grades 5–9"],[3,"Secondary"],[4,"Higher education"]]} />
          </div>
          <div className="form-section-title mt-4"><span>03</span> Lifestyle and support</div>
          <div className="row g-3">
            <SelectField label="School support" name="schoolsup" value={form.schoolsup} onChange={update} options={[["no","No"],["yes","Yes"]]} />
            <SelectField label="Family educational support" name="famsup" value={form.famsup} onChange={update} options={[["yes","Yes"],["no","No"]]} />
            <SelectField label="Paid extra classes" name="paid" value={form.paid} onChange={update} options={[["no","No"],["yes","Yes"]]} />
            <SelectField label="Extra-curricular activities" name="activities" value={form.activities} onChange={update} options={[["yes","Yes"],["no","No"]]} />
            <SelectField label="Wants higher education" name="higher" value={form.higher} onChange={update} options={[["yes","Yes"],["no","No"]]} />
            <SelectField label="Internet at home" name="internet" value={form.internet} onChange={update} options={[["yes","Yes"],["no","No"]]} />
            <SelectField label="Family relationship (1–5)" name="famrel" value={form.famrel} onChange={update} options={[[1,"1 — Very poor"],[2,"2"],[3,"3"],[4,"4"],[5,"5 — Excellent"]]} />
            <SelectField label="Free time (1–5)" name="freetime" value={form.freetime} onChange={update} options={[[1,"1 — Very low"],[2,"2"],[3,"3"],[4,"4"],[5,"5 — Very high"]]} />
            <SelectField label="Going out (1–5)" name="goout" value={form.goout} onChange={update} options={[[1,"1 — Very low"],[2,"2"],[3,"3"],[4,"4"],[5,"5 — Very high"]]} />
            <SelectField label="Current health (1–5)" name="health" value={form.health} onChange={update} options={[[1,"1 — Very poor"],[2,"2"],[3,"3"],[4,"4"],[5,"5 — Very good"]]} />
          </div>
          <div className="form-actions"><button className="btn btn-primary predict-button" disabled={loading || health !== "connected"} type="submit">
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Predicting…</> : <><i className="bi bi-stars me-2" />Predict final grade</>}
          </button><button type="button" className="btn btn-outline-secondary" onClick={() => {setForm(initial);setPrediction(null);setError("");}}>Reset form</button></div>
        </form>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {prediction && <div className="result-panel mt-4">
          <div className="result-top"><div><div className="eyebrow">MODEL OUTPUT</div><h4>Estimated final grade</h4><p>Predicted value on the dataset's 0–20 scale</p></div><div className={`grade-ring ${categoryColor}`}><strong>{prediction.predicted_grade}</strong><span>/ 20</span></div></div>
          <div className="grade-track"><div style={{width:`${prediction.predicted_grade / 20 * 100}%`}} /></div>
          <div className="result-bottom"><span className={`category-pill ${categoryColor}`}>{prediction.performance_category}</span><span className="result-disclaimer">{prediction.disclaimer}</span></div>
        </div>}
      </section>

      <section className="content-grid lower-grid">
        <div className="panel" id="batch">
          <div className="panel-heading"><div><h3>Batch prediction</h3><p>Predict grades for multiple rows at once</p></div><i className="bi bi-file-earmark-arrow-up dataset-icon" /></div>
          <p className="batch-copy">Upload a CSV containing the same input feature columns used by the model. The downloaded file includes a <code>predicted_G3</code> column.</p>
          <label className="upload-zone"><i className="bi bi-cloud-arrow-up" /><strong>Choose a CSV file</strong><span>CSV only · input feature columns required</span><input type="file" accept=".csv,text/csv" onChange={batchUpload} /></label>
          {batchMessage && <div className="batch-message">{batchMessage}</div>}
          <div className="small-note">Tip: use the columns from the dataset. Remove G1 and G2 from the uploaded features if they are present; the model ignores them.</div>
        </div>
        <div className="panel">
          <div className="panel-heading"><div><h3>Top model features</h3><p>Random Forest impurity-based importance</p></div><i className="bi bi-bar-chart-steps dataset-icon" /></div>
          {importance.length ? <ResponsiveContainer width="100%" height={260}>
            <BarChart data={importance.slice(0, 8)} layout="vertical" margin={{top:0,right:14,left:16,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8edf4" />
              <XAxis type="number" tick={{fill:"#758198",fontSize:10}} />
              <YAxis type="category" dataKey="feature" width={112} tick={{fill:"#536078",fontSize:10}} />
              <Tooltip />
              <Bar dataKey="importance" name="Importance" fill="#14b8a6" radius={[0,5,5,0]} />
            </BarChart>
          </ResponsiveContainer> : <div className="empty-chart">Feature importance appears after model training.</div>}
          <div className="small-note">Importance is model-specific, not proof of causation.</div>
        </div>
      </section>

      <footer className="footer"><div><strong>EduPredict AI</strong><span>Academic project prototype · React + Flask + Scikit-learn</span></div><div>Dataset: UCI Student Performance · <a href="https://archive.ics.uci.edu/dataset/320/student+performance" target="_blank" rel="noreferrer">Source & citation</a></div></footer>
    </main>
  </div>;
}
