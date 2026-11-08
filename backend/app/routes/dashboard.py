from datetime import date

from flask import Blueprint, jsonify
from sqlalchemy import func

from app.extensions import db
from app.models import Transaction

dashboard_bp = Blueprint(
    "dashboard",
    __name__
)


@dashboard_bp.route("/", methods=["GET"])
def get_dashboard():
    today = date.today()
    period_start = date(today.year, today.month, 1)
    period_end = (
        date(today.year + 1, 1, 1)
        if today.month == 12
        else date(today.year, today.month + 1, 1)
    )

    period_totals = db.session.query(
        Transaction.type,
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.date >= period_start,
        Transaction.date < period_end
    ).group_by(Transaction.type).all()

    totals_by_type = {
        transaction_type: float(total)
        for transaction_type, total in period_totals
    }
    total_income = totals_by_type.get("income", 0)
    total_expense = totals_by_type.get("expense", 0)

    # Monthly balance uses the same month window as budget spending totals.
    balance = total_income - total_expense

    recent_transactions = Transaction.query.order_by(
        Transaction.date.desc(),
        Transaction.id.desc()
    ).limit(5).all()

    recent_data = []
    for transaction in recent_transactions:
        recent_data.append({
            "id": transaction.id,
            "title": transaction.title,
            "amount": float(transaction.amount),
            "type": transaction.type,
            "date": transaction.date.isoformat(),
            "category_name": transaction.category.name
        })

    return jsonify({
        "period_month": today.month,
        "period_year": today.year,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "recent_transactions": recent_data
    }), 200