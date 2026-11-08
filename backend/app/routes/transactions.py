from datetime import date

from flask import Blueprint, jsonify, request
from app.money import InvalidMoney, parse_money
from app.extensions import db
from app.models import Transaction, Category
from app.extensions import db
from app.models import Transaction

transactions_bp = Blueprint(
    "transactions",
    __name__
)


@transactions_bp.route("/", methods=["GET"])
def get_transactions():

    transactions = Transaction.query.order_by(
        Transaction.date.desc()
    ).all()

    result = []

    for transaction in transactions:
        result.append({
            "id": transaction.id,
            "title": transaction.title,
            "amount": float(transaction.amount),
            "type": transaction.type,
            "note": transaction.note,
            "date": transaction.date.isoformat(),
            "category_id": transaction.category_id,
            "category_name": transaction.category.name
        })

    return jsonify(result), 200

@transactions_bp.route("/", methods=["POST"])
def create_transaction():
    data = request.get_json()

    # Kiểm tra dữ liệu đầu vào
    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    required_fields = [
        "title",
        "amount",
        "type",
        "date",
        "category_id"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"Missing field: {field}"
            }), 400

    # Kiểm tra loại giao dịch
    if data["type"] not in ["income", "expense"]:
        return jsonify({
            "error": "Type must be income or expense"
        }), 400

    # Kiểm tra số tiền
    try:
        amount = parse_money(data["amount"])
    except InvalidMoney:
        return jsonify({
            "error": "Amount must be positive, have at most 2 decimal places, and not exceed 9999999999.99"
        }), 400

    # Kiểm tra danh mục có tồn tại không
    category = db.session.get(
        Category,
        data["category_id"]
    )

    if category is None:
        return jsonify({
            "error": "Category not found"
        }), 404

    # Tạo giao dịch mới
    if category.type != data["type"]:
        return jsonify({
            "error": "Category type must match transaction type"
        }), 400

    try:
        transaction_date = date.fromisoformat(data["date"])
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid date format. Use YYYY-MM-DD"
        }), 400

    try:
        transaction = Transaction(
            title=data["title"],
            amount=amount,
            type=data["type"],
            note=data.get("note"),
            date=transaction_date,
            category_id=category.id
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "message": "Transaction created successfully",
            "id": transaction.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": str(e)
        }), 500

@transactions_bp.route("/<int:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    transaction = db.session.get(
        Transaction,
        transaction_id
    )

    if transaction is None:
        return jsonify({
            "error": "Transaction not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    # Validate the complete payload before mutating the SQLAlchemy object.
    updates = {}

    new_type = data.get("type", transaction.type)
    if new_type not in ["income", "expense"]:
        return jsonify({"error": "Type must be income or expense"}), 400
    updates["type"] = new_type

    new_category_id = data.get("category_id", transaction.category_id)
    category = db.session.get(Category, new_category_id)
    if category is None:
        return jsonify({"error": "Category not found"}), 404
    if category.type != new_type:
        return jsonify({
            "error": "Category type must match transaction type"
        }), 400
    updates["category_id"] = category.id

    if "title" in data:
        if not isinstance(data["title"], str) or not data["title"].strip():
            return jsonify({"error": "Title must not be empty"}), 400
        updates["title"] = data["title"]

    if "amount" in data:
        try:
            updates["amount"] = parse_money(data["amount"])
        except InvalidMoney:
            return jsonify({
                "error": "Amount must be positive, have at most 2 decimal places, and not exceed 9999999999.99"
            }), 400

    if "note" in data:
        updates["note"] = data["note"]

    if "date" in data:
        try:
            updates["date"] = date.fromisoformat(data["date"])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid date format. Use YYYY-MM-DD"
            }), 400

    for field, value in updates.items():
        setattr(transaction, field, value)

    try:
        db.session.commit()

        return jsonify({
            "message": "Transaction updated successfully",
            "id": transaction.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": str(e)
        }), 500

@transactions_bp.route(
    "/<int:transaction_id>",
    methods=["DELETE"]
)
def delete_transaction(transaction_id):

    # Tìm giao dịch theo ID
    transaction = db.session.get(
        Transaction,
        transaction_id
    )

    # Nếu không tìm thấy
    if transaction is None:
        return jsonify({
            "error": "Transaction not found"
        }), 404

    try:
        # Xóa giao dịch
        db.session.delete(transaction)

        # Lưu thay đổi vào database
        db.session.commit()

        return jsonify({
            "message": "Transaction deleted successfully",
            "id": transaction_id
        }), 200

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "error": str(e)
        }), 500