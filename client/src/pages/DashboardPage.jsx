import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { statsApi, categoryApi } from "../services/api.js";
import { formatCurrency, formatDate, monthLabel } from "../utils/format.js";

export default function DashboardPage() {
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

  const maxCategory = summary?.byCategory?.length ? summary.byCategory[0].total : 0;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">{summary ? monthLabel(summary.month) : "This month"}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="card">
          <p className="muted">Loading dashboard…</p>
        </div>
      ) : summary ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Spent this month</span>
              <span className="stat-value amount-negative">{formatCurrency(summary.total)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Expenses this month</span>
              <span className="stat-value">{summary.count}</span>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <h2>Spending by category</h2>
              {summary.byCategory.length === 0 ? (
                <div className="empty-state">
                  <p>No expenses this month yet.</p>
                </div>
              ) : (
                <ul className="category-list">
                  {summary.byCategory.map((item) => (
                    <li key={item.categoryId ?? "uncategorized"}>
                      <div className="category-row">
                        <span>{categoryName(item.categoryId)}</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${(item.total / maxCategory) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Recent expenses</h2>
                <Link to="/expenses" className="btn btn-ghost">
                  View all
                </Link>
              </div>
              {summary.recent.length === 0 ? (
                <div className="empty-state">
                  <p>No expenses yet.</p>
                </div>
              ) : (
                <ul className="recent-list">
                  {summary.recent.map((expense) => (
                    <li key={expense.id} className="recent-row">
                      <div>
                        <strong>{expense.description || "—"}</strong>
                        <span className="muted">{formatDate(expense.expense_date)}</span>
                      </div>
                      <span className="amount-negative">−{formatCurrency(expense.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state card">
          <p>No summary available.</p>
        </div>
      )}
    </section>
  );
}
