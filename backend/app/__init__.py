from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from .extensions import db
import app.routes.transactions as transactions_routes
from app.routes.categories import categories_bp
from app.routes.dashboard import dashboard_bp
from .routes.budgets import budgets_bp
def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    #Khoi tao cac extension
    db.init_app(app)
    CORS(app)

    app.register_blueprint(
        
        transactions_routes.transactions_bp,
        url_prefix="/api/transactions"
    )   
    app.register_blueprint(
        categories_bp,
        url_prefix="/api/categories"
    )
    app.register_blueprint(
        dashboard_bp,
        url_prefix="/api/dashboard"
    )
    app.register_blueprint(
        budgets_bp, url_prefix="/api/budgets"
    )
    return app