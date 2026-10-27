import { useEffect, useMemo, useState } from "react";
import { expenseApi, categoryApi } from "../services/api.js";
import ExpenseForm from "../components/ExpenseForm.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState({ open: false, editing: null });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [expensesData, categoriesData] = await Promise.all([
        expenseApi.list(),
        categoryApi.list(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categoryById = useMemo(() => {
    const map = {};
    for (const category of categories) map[category.id] = category;
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return expenses
      .filter((expense) => {
        if (categoryFilter !== "all" && expense.category_id !== Number(categoryFilter)) return false;
        if (search && !`${expense.description || ""} ${expense.amount}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (fromDate && expense.expense_date < fromDate) return false;
        if (toDate && expense.expense_date > toDate) return false;
        return true;
      })
      .sort((a, b) => (a.expense_date < b.expense_date ? 1 : a.expense_date > b.expense_date ? -1 : b.id - a.id));
  }, [expenses, search, categoryFilter, fromDate, toDate]);

  function openAdd() {
    setModal({ open: true, editing: null });
  }

  function openEdit(expense) {
    setModal({ open: true, editing: expense });
  }

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  async function handleSubmit(payload) {
    setSaving(true);
    setError("");
    try {
      if (modal.editing) {
        await expenseApi.update(modal.editing.id, payload);
      } else {
        await expenseApi.create(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    setError("");
    try {
      await expenseApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="muted">
            {filtered.length} expense{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add expense
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="filters card">
        <input
          type="search"
          placeholder="Search description or amount"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          aria-label="To date"
        />
      </div>

      {loading ? (
        <div className="card">
          <p className="muted">Loading expenses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <p>No expenses found.</p>
          <button className="btn btn-primary" onClick={openAdd}>
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => {
                const category = categoryById[expense.category_id];
                return (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.expense_date)}</td>
                    <td>{expense.description || <span className="muted">—</span>}</td>
                    <td>{category ? category.name : <span className="muted">Uncategorized</span>}</td>
                    <td className="text-right amount-negative">−{formatCurrency(expense.amount)}</td>
                    <td className="text-right actions-cell">
                      <button className="btn btn-ghost" onClick={() => openEdit(expense)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(expense.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <ExpenseForm
              initial={modal.editing}
              categories={categories}
              loading={saving}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </section>
  );
}
