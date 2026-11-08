
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Wallet,
  Trash2,
  Pencil,
  PiggyBank,
} from "lucide-react";
import api from "../services/api";

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

function Budgets() {
  const today = new Date();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [budgetResponse, categoryResponse] = await Promise.all([
        api.get<Budget[]>("/budgets/", {
          params: { month, year },
        }),
        api.get<Category[]>("/categories/"),
      ]);

      setBudgets(budgetResponse.data);
      setCategories(
        categoryResponse.data.filter(
          (category) => category.type === "expense"
        )
      );
    } catch (error) {
      console.error(error);
      alert("Không thể tải dữ liệu ngân sách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const formatMoney = (amount: number) =>
    amount.toLocaleString("vi-VN") + " đ";

  const totalBudget = budgets.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalSpent = budgets.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const openAddForm = () => {
    setEditingId(null);
    setForm({ category_id: "", amount: "" });
    setShowForm(true);
  };

  const openEditForm = (budget: Budget) => {
    setEditingId(budget.id);
    setForm({
      category_id: String(budget.category_id),
      amount: String(budget.amount),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        month,
        year,
      };

      if (editingId !== null) {
        await api.put(`/budgets/${editingId}`, payload);
        alert("Cập nhật ngân sách thành công!");
      } else {
        await api.post("/budgets/", payload);
        alert("Tạo ngân sách thành công!");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ category_id: "", amount: "" });

      await fetchData();
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.error ||
        "Không thể lưu ngân sách."
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngân sách này?")) {
      return;
    }

    try {
      await api.delete(`/budgets/${id}`);
      await fetchData();
      alert("Đã xóa ngân sách!");
    } catch (error) {
      console.error(error);
      alert("Không thể xóa ngân sách.");
    }
  };

  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <div>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Dashboard
          </Link>

          <h1>Quản lý ngân sách</h1>
          <p>Theo dõi và kiểm soát chi tiêu hàng tháng.</p>
        </div>

        <button className="add-button" onClick={openAddForm}>
          <Plus size={18} /> Thêm ngân sách
        </button>
      </header>

      <section className="budget-filter">
        <div>
          <label>Tháng</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Năm</label>
          <div className="budget-year-picker">
            <button
              type="button"
              className="year-step-button"
              aria-label={"N\u0103m tr\u01b0\u1edbc"}
              onClick={() => setYear((currentYear) => currentYear - 1)}
            >
              {"\u2212"}
            </button>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 7 },
                (_, index) => today.getFullYear() - 3 + index
              ).map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
              {!Array.from(
                { length: 7 },
                (_, index) => today.getFullYear() - 3 + index
              ).includes(year) && <option value={year}>{year}</option>}
            </select>
            <button
              type="button"
              className="year-step-button"
              aria-label={"N\u0103m ti\u1ebfp theo"}
              onClick={() => setYear((currentYear) => currentYear + 1)}
            >
              +
            </button>
          </div>
        </div>
      </section>

      <section className="budget-summary">
        <div className="summary-card">
          <div className="summary-icon purple">
            <PiggyBank size={22} />
          </div>
          <p>Tổng ngân sách</p>
          <h2>{formatMoney(totalBudget)}</h2>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            <Wallet size={22} />
          </div>
          <p>Đã chi tiêu</p>
          <h2>{formatMoney(totalSpent)}</h2>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            <Wallet size={22} />
          </div>
          <p>Ngân sách còn lại</p>
          <h2>{formatMoney(totalRemaining)}</h2>
        </div>
      </section>

      <section className="budget-list-section">
        <div className="budget-list-header">
          <h2>Ngân sách theo danh mục</h2>
          <span>Tháng {month}/{year}</span>
        </div>

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : budgets.length === 0 ? (
          <div className="budget-empty">
            <PiggyBank size={42} />
            <h3>Chưa có ngân sách</h3>
            <p>Hãy tạo ngân sách đầu tiên cho tháng này.</p>
            <button className="add-button" onClick={openAddForm}>
              <Plus size={17} /> Tạo ngân sách
            </button>
          </div>
        ) : (
          <div className="budget-grid">
            {budgets.map((budget) => {
              const percentage = Math.min(budget.percentage, 100);
              const exceeded = budget.spent > budget.amount;

              return (
                <article className="budget-card" key={budget.id}>
                  <div className="budget-card-top">
                    <div>
                      <h3>{budget.category_name}</h3>
                      <p>Ngân sách tháng này</p>
                    </div>

                    <div className="budget-actions">
                      <button
                        className="edit-button"
                        onClick={() => openEditForm(budget)}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(budget.id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="budget-numbers">
                    <strong>{formatMoney(budget.spent)}</strong>
                    <span>/ {formatMoney(budget.amount)}</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${
                        exceeded ? "over-budget" : ""
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="budget-card-bottom">
                    <span className={exceeded ? "warning-text" : ""}>
                      {exceeded
                        ? `Vượt ${formatMoney(budget.spent - budget.amount)}`
                        : `Còn ${formatMoney(budget.remaining)}`}
                    </span>

                    <strong className={exceeded ? "warning-text" : ""}>
                      {budget.percentage.toFixed(1)}%
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay">
          <div className="transaction-modal">
            <div className="modal-header">
              <h2>
                {editingId !== null
                  ? "Chỉnh sửa ngân sách"
                  : "Thêm ngân sách"}
              </h2>

              <button onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Danh mục chi tiêu</label>
              <select
                required
                disabled={editingId !== null}
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                <option value="">-- Chọn danh mục --</option>

                {categories
                  .filter(
                    (category) =>
                      editingId !== null ||
                      !budgets.some(
                        (budget) => budget.category_id === category.id
                      )
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>

              <label>Ngân sách (VNĐ)</label>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="Nhập số tiền"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>

                <button type="submit" className="add-button">
                  {editingId !== null ? "Cập nhật" : "Lưu ngân sách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
