
from datetime import date
from app.money import InvalidMoney, parse_money
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import Budget, Category, Transaction

budgets_bp = Blueprint("budgets", __name__)


# GET: Lấy danh sách ngân sách theo tháng
@budgets_bp.route("/", methods=["GET"])
def get_budgets():
    today = date.today()

    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

    if not 1 <= month <= 12 or year < 2000:
        return jsonify({"error": "Tháng hoặc năm không hợp lệ"}), 400

    budgets = Budget.query.filter_by(
        month=month,
        year=year
    ).all()

    result = []

    for budget in budgets:
        spent = db.session.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            Transaction.date >= date(year, month, 1),
            Transaction.date < (
                date(year + 1, 1, 1)
                if month == 12
                else date(year, month + 1, 1)
            )
        ).scalar()

        spent = float(spent)
        amount = float(budget.amount)

        result.append({
            "id": budget.id,
            "category_id": budget.category_id,
            "category_name": budget.category.name,
            "amount": amount,
            "spent": spent,
            "remaining": amount - spent,
            "percentage": round(spent / amount * 100, 2)
                if amount > 0 else 0,
            "month": budget.month,
            "year": budget.year
        })

    return jsonify(result)


# POST: Tạo ngân sách mới
@budgets_bp.route("/", methods=["POST"])
def create_budget():
    data = request.get_json() or {}

    try:
        amount = parse_money(data.get("amount", 0))
    except InvalidMoney:
        return jsonify({
            "error": "Amount must be positive, have at most 2 decimal places, and not exceed 9999999999.99"
        }), 400

    try:
        category_id = int(data.get("category_id", 0))
        month = int(data.get("month", 0))
        year = int(data.get("year", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "D? li?u kh?ng h?p l?"}), 400

    if not 1 <= month <= 12 or year < 2000:
        return jsonify({"error": "Tháng hoặc năm không hợp lệ"}), 400

    category = db.session.get(Category, category_id)

    if not category or category.type != "expense":
        return jsonify({"error": "Danh mục chi tiêu không hợp lệ"}), 400

    budget = Budget(
        amount=amount,
        category_id=category_id,
        month=month,
        year=year
    )

    db.session.add(budget)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "Danh mục này đã có ngân sách trong tháng"
        }), 409

    return jsonify({
        "message": "Tạo ngân sách thành công",
        "id": budget.id
    }), 201


# PUT: Cập nhật ngân sách
@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
def update_budget(budget_id):
    budget = db.session.get(Budget, budget_id)

    if not budget:
        return jsonify({"error": "Không tìm thấy ngân sách"}), 404

    data = request.get_json() or {}

    try:
        amount = parse_money(data.get("amount", 0))
    except InvalidMoney:
        return jsonify({
            "error": "Amount must be positive, have at most 2 decimal places, and not exceed 9999999999.99"
        }), 400

    budget.amount = amount
    db.session.commit()

    return jsonify({"message": "Cập nhật ngân sách thành công"})


# DELETE: Xóa ngân sách
@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
def delete_budget(budget_id):
    budget = db.session.get(Budget, budget_id)

    if not budget:
        return jsonify({"error": "Không tìm thấy ngân sách"}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({"message": "Xóa ngân sách thành công"})
