from flask import Blueprint, jsonify
from app.models import Category

categories_bp = Blueprint(
    "categories",
    __name__
)

@categories_bp.route("/", methods=["GET"])
def get_categories():

    categories = Category.query.order_by(
        Category.id.asc()
    ).all()

    result = []

    for category in categories:
        result.append({
            "id": category.id,
            "name": category.name,
            "type": category.type
        })

    return jsonify(result), 200