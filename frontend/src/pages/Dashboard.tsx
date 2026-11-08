
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { DashboardData } from "../types";

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get<DashboardData>("/dashboard/");
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu Dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatMoney = (amount: number) =>
    amount.toLocaleString("vi-VN") + " đ";

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="error">Không có dữ liệu.</div>;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Wallet size={23} /></div>
          <span>SpendWise</span>
        </div>

        <p className="menu-label">MENU</p>

        <Link className="menu-item active" to="/">
            <LayoutDashboard size={19} />
            Dashboard
        </Link>

        <Link className="menu-item" to="/transactions">
            <Receipt size={19} />
            Transactions
        </Link>

        <Link className="menu-item" to="/budgets">
            <Wallet size={19} />
            Budgets
        </Link>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>
          <div>
            <strong>Student</strong>
            <p>Personal account</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Pages / Dashboard</p>
            <h1>Dashboard</h1>
          </div>
          <div className="today-label">
            {new Date().toLocaleDateString("vi-VN")}
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <h2>Xin chào! 👋</h2>
            <p>Đây là tổng quan tình hình tài chính của bạn.</p>
          </div>
          <div className="welcome-icon"><Wallet size={32} /></div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Thu nhập tháng {data.period_month}/{data.period_year}</span>
              <div className="stat-icon income"><TrendingUp size={21} /></div>
            </div>
            <h2>{formatMoney(data.total_income)}</h2>
            <p className="stat-note">Tổng thu trong tháng hiện tại</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Chi tiêu tháng {data.period_month}/{data.period_year}</span>
              <div className="stat-icon expense"><TrendingDown size={21} /></div>
            </div>
            <h2>{formatMoney(data.total_expense)}</h2>
            <p className="stat-note">Tổng chi trong tháng hiện tại</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Số dư hiện tại</span>
              <div className="stat-icon balance"><Wallet size={21} /></div>
            </div>
            <h2>{formatMoney(data.balance)}</h2>
            <p className="stat-note">Thu nhập trừ chi tiêu lũy kế từ các giao dịch đã ghi nhận</p>
          </div>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <h2>Giao dịch gần đây</h2>
              <p>Những khoản thu chi mới nhất của bạn</p>
            </div>
            <span className="transaction-count">
              {data.recent_transactions.length} giao dịch
            </span>
          </div>

          {data.recent_transactions.length === 0 ? (
            <div className="empty-state">
              <Receipt size={35} />
              <p>Chưa có giao dịch nào.</p>
            </div>
          ) : (
            <div className="transaction-list">
              {data.recent_transactions.map((item) => (
                <div className="transaction-row" key={item.id}>
                  <div className={`transaction-icon ${item.type}`}>
                    {item.type === "income" ? (
                      <ArrowDownRight size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>

                  <div className="transaction-info">
                    <strong>{item.title}</strong>
                    <span>{item.category_name} · {item.date}</span>
                  </div>

                  <strong className={`transaction-amount ${item.type}`}>
                    {item.type === "income" ? "+" : "-"}
                    {formatMoney(item.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
