from datetime import date
from sqlalchemy import UniqueConstraint
from .extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    # type: income hoặc expense

    transactions = db.relationship(
        "Transaction",
        back_populates="category"
    )

    budgets = db.relationship(
        "Budget",
        back_populates="category"
    )


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    note = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False, default=date.today)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id"),
        nullable=False
    )

    category = db.relationship(
        "Category",
        back_populates="transactions"
    )


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id"),
        nullable=False
    )

    category = db.relationship(
        "Category",
        back_populates="budgets"
    )

    __table_args__ = (
        UniqueConstraint(
            "category_id",
            "month",
            "year",
            name="unique_category_month_year"
        ),
    )