import { useState } from "react";

function emptyErrors() {
  return { amount: "", date: "", description: "" };
}

export default function ExpenseForm({ initial, categories, loading, onSubmit, onCancel }) {
  const isEdit = Boolean(initial);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category_id ?? "") : "");
  const [date, setDate] = useState(initial?.expense_date || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [errors, setErrors] = useState(emptyErrors());

  function validate() {
    const next = emptyErrors();
    const numeric = Number(amount);

    if (!amount.trim()) {
      next.amount = "Amount is required";
    } else if (Number.isNaN(numeric) || numeric <= 0) {
      next.amount = "Enter an amount greater than 0";
    }

    if (!date) next.date = "Date is required";
    if (description.length > 255) next.description = "Description is too long";

    setErrors(next);
    return !next.amount && !next.date && !next.description;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      category_id: categoryId ? Number(categoryId) : null,
      amount: Number(amount),
      description: description.trim(),
      expense_date: date,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">{isEdit ? "Edit Expense" : "Add Expense"}</h2>

      <div className="form-group">
        <label htmlFor="expense-amount">Amount</label>
        <input
          id="expense-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
        {errors.amount && <span className="error-text">{errors.amount}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="expense-category">Category</label>
        <select id="expense-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="expense-date">Date</label>
        <input id="expense-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        {errors.date && <span className="error-text">{errors.date}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="expense-description">Description</label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Groceries"
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
