from routes.distribution import distribution_bp
from routes.inventory import inventory_bp
from routes.beneficiaries import beneficiaries_bp
from routes.reports import reports_bp
from routes.ration_items import ration_items_bp
from routes.monthly_closure import monthly_closure_bp
from routes.audit import audit_bp
from routes.warehouse_return import warehouse_bp
from routes.settings import settings_bp
from flask import Flask
from flask_cors import CORS
from warehouse_login import warehouse_login_bp
from routes.warehouse_dashboard import warehouse_dashboard_bp
from routes.warehouse_verification import warehouse_verification_bp
from routes.beneficiary_dashboard import beneficiary_dashboard_bp
from routes.auth import auth

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth)
app.register_blueprint(reports_bp)
app.register_blueprint(beneficiaries_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(distribution_bp)
app.register_blueprint(monthly_closure_bp)
app.register_blueprint(ration_items_bp)
app.register_blueprint(warehouse_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(warehouse_login_bp)
app.register_blueprint(warehouse_dashboard_bp)
app.register_blueprint(warehouse_verification_bp)
app.register_blueprint(audit_bp)
app.register_blueprint(beneficiary_dashboard_bp)

@app.route("/")
def home():
    return {
        "message": "Smart Ration Hub API Running"
    }

if __name__ == "__main__":
    app.run(debug=True)