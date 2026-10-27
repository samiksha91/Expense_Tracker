import { useEffect, useState } from "react";
import { categoryApi } from "../services/api.js";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: "" });
  const [fieldError, setFieldError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setCategories(await categoryApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm({ id: null, name: "" });
    setFieldError("");
  }

  function validate() {
    if (!form.name.trim()) {
      setFieldError("Name is required");
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!validate()) return;

    setSaving(true);
    try {
      if (form.id) {
        await categoryApi.update(form.id, { name: form.name });
      } else {
        await categoryApi.create({ name: form.name });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category) {
    setForm({ id: category.id, name: category.name });
    setFieldError("");
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete "${category.name}"? Its expenses become uncategorized.`)) return;
    setError("");
    try {
      await categoryApi.remove(category.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted">Organize your expenses</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card form-card">
        <h2>{form.id ? "Edit category" : "Add category"}</h2>
        <form className="form form-inline" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Groceries"
            />
            {fieldError && <span className="error-text">{fieldError}</span>}
          </div>

          <div className="form-actions">
            {form.id && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Add category"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Categories</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet.</p>
          </div>
        ) : (
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id} className="category-row">
                <span className="category-badge">{category.name}</span>
                <span className="actions-cell">
                  <button className="btn btn-ghost" onClick={() => handleEdit(category)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(category)}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
