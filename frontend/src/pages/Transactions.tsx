
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Wallet, Pencil } from "lucide-react"; 
import api from "../services/api";

interface Transaction {
    id: number;
    title: string;
    amount: number;
    type: "income" | "expense";
    note: string | null;
    date: string;
    category_id: number;
    category_name: string;
}

interface Category {
    id: number;
    name: string;
    type: "income" | "expense";
}

function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filter, setFilter] = useState("all");

    const [form, setForm] = useState({
        title: "",
        amount: "",
        type: "expense",
        note: "",
        date: new Date().toLocaleDateString("en-CA"),
        category_id: "",
    });

    const fetchData = async () => {
        try {
        setLoading(true);

        const [transactionResponse, categoryResponse] =
            await Promise.all([
            api.get<Transaction[]>("/transactions/"),
            api.get<Category[]>("/categories/"),
            ]);

        setTransactions(transactionResponse.data);
        setCategories(categoryResponse.data);
        setError("");
        } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu giao dịch.");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter((item) => {
        if (filter === "all") return true;
        return item.type === filter;
    });

    const handleTypeChange = (type: string) => {
        setForm({
        ...form,
        type,
        category_id: "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form,
            amount: Number(form.amount),
            category_id: Number(form.category_id),
        };

        try {
            if (editingId !== null) {
            // Đang sửa giao dịch
            await api.put(`/transactions/${editingId}`, payload);
            alert("Cập nhật giao dịch thành công!");
            } else {
            // Đang thêm giao dịch mới
            await api.post("/transactions/", payload);
            alert("Thêm giao dịch thành công!");
            }

            setShowForm(false);
            setEditingId(null);

            setForm({
            title: "",
            amount: "",
            type: "expense",
            note: "",
            date: new Date().toLocaleDateString("en-CA"),
            category_id: "",
            });

            await fetchData();
        } catch (err) {
            console.error(err);
            alert("Không thể lưu giao dịch. Hãy kiểm tra dữ liệu.");
        }
    };

    const handleEdit = (item: Transaction) => {
        setEditingId(item.id);

        setForm({
            title: item.title,
            amount: String(item.amount),
            type: item.type,
            note: item.note || "",
            date: item.date,
            category_id: String(item.category_id),
        });

        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
        "Bạn có chắc chắn muốn xóa giao dịch này?"
        );

        if (!confirmed) return;

        try {
        await api.delete(`/transactions/${id}`);
        await fetchData();
        } catch (err) {
        console.error(err);
        alert("Không thể xóa giao dịch.");
        }
    };

    const formatMoney = (amount: number) =>
        amount.toLocaleString("vi-VN") + " đ";

    const availableCategories = categories.filter(
        (category) => category.type === form.type
    );

    return (
        <div className="transactions-page">
        <header className="transactions-header">
            <div>
            <Link to="/" className="back-link">
                <ArrowLeft size={16} /> Dashboard
            </Link>
            <h1>Transactions</h1>
            <p>Quản lý các khoản thu và chi của bạn.</p>
            </div>

            <button
                className="add-button"
                onClick={() => {
                    setEditingId(null);

                    setForm({
                    title: "",
                    amount: "",
                    type: "expense",
                    note: "",
                    date: new Date().toLocaleDateString("en-CA"),
                    category_id: "",
                    });

                    setShowForm(true);
                }}
            >
                <Plus size={18} /> Thêm giao dịch
            </button>
        </header>

        <section className="transaction-panel">
            <div className="transaction-toolbar">
            <h2>Danh sách giao dịch</h2>

            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="all">Tất cả giao dịch</option>
                <option value="income">Khoản thu</option>
                <option value="expense">Khoản chi</option>
            </select>
            </div>

            {loading ? (
            <p>Đang tải dữ liệu...</p>
            ) : error ? (
            <p className="error">{error}</p>
            ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
                <Wallet size={35} />
                <p>Chưa có giao dịch phù hợp.</p>
            </div>
            ) : (
            <div className="transaction-table-wrapper">
                <table className="transaction-table">
                <thead>
                    <tr>
                    <th>Tên giao dịch</th>
                    <th>Danh mục</th>
                    <th>Ngày</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredTransactions.map((item) => (
                    <tr key={item.id}>
                        <td>
                        <strong>{item.title}</strong>
                        <small>{item.note || "Không có ghi chú"}</small>
                        </td>

                        <td>{item.category_name}</td>
                        <td>{item.date}</td>

                        <td>
                        <span className={`type-badge ${item.type}`}>
                            {item.type === "income" ? "Thu nhập" : "Chi tiêu"}
                        </span>
                        </td>

                        <td className={`table-amount ${item.type}`}>
                        {item.type === "income" ? "+" : "-"}
                        {formatMoney(item.amount)}
                        </td>

                        <td>
                            <div className="action-buttons">
                                <button
                                className="edit-button"
                                title="Sửa giao dịch"
                                onClick={() => handleEdit(item)}
                                >
                                <Pencil size={17} />
                                </button>

                                <button
                                className="delete-button"
                                title="Xóa giao dịch"
                                onClick={() => handleDelete(item.id)}
                                >
                                <Trash2 size={17} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </section>

        {showForm && (
            <div className="modal-overlay">
            <div className="transaction-modal">
                <div className="modal-header">
                <h2>
                    {editingId !== null ? "Chỉnh sửa giao dịch" : "Thêm giao dịch"}
                </h2>
                <button onClick={() => setShowForm(false)}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                <label>Loại giao dịch</label>
                <select
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                >
                    <option value="expense">Chi tiêu</option>
                    <option value="income">Thu nhập</option>
                </select>

                <label>Tên giao dịch</label>
                <input
                    required
                    value={form.title}
                    onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Ví dụ: Ăn trưa"
                />

                <label>Số tiền (VNĐ)</label>
                <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="Nhập số tiền"
                />

                <label>Danh mục</label>
                <select
                    required
                    value={form.category_id}
                    onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                    }
                >
                    <option value="">-- Chọn danh mục --</option>
                    {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                    ))}
                </select>

                <label>Ngày giao dịch</label>
                <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                    }
                />

                <label>Ghi chú</label>
                <textarea
                    value={form.note}
                    onChange={(e) =>
                    setForm({ ...form, note: e.target.value })
                    }
                    placeholder="Ghi chú thêm (không bắt buộc)"
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
                        {editingId !== null ? "Cập nhật" : "Lưu giao dịch"}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
}

export default Transactions;
