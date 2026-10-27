import { useEffect, useState } from "react";
import { statsApi, categoryApi } from "../services/api.js";
import { formatCurrency, monthLabel } from "../utils/format.js";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([statsApi.summary(), categoryApi.list()])
      .then(([summaryData, categoryData]) => {
        if (!active) return;
        setSummary(summaryData);
        setCategories(categoryData);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function categoryName(id) {
    if (id === null || id === undefined) return "Uncategorized";
    return categories.find((category) => category.id === id)?.name || "Uncategorized";
  }

  const total = summary?.total || 0;
  const max = summary?.byCategory?.length ? summary.byCategory[0].total : 0;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Spending insights</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="card">
          <p className="muted">Loading report…</p>
        </div>
      ) : !summary || summary.byCategory.length === 0 ? (
        <div className="empty-state card">
          <p>No expenses to report this month.</p>
        </div>
      ) : (
        <div className="card">
          <h2>Spending by category — {monthLabel(summary.month)}</h2>
          <p className="muted">Total: {formatCurrency(total)}</p>
          <ul className="report-list">
            {summary.byCategory.map((item) => (
              <li key={item.categoryId ?? "uncategorized"}>
                <div className="report-row">
                  <span className="category-badge">{categoryName(item.categoryId)}</span>
                  <span className="report-values">
                    {formatCurrency(item.total)} · {Math.round((item.total / total) * 100)}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(item.total / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
