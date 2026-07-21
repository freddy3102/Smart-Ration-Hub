from routes.distribution import distribution_bp
from routes.inventory import inventory_bp
from routes.beneficiaries import beneficiaries_bp
from routes.reports import reports_bp
from flask import Flask
from flask_cors import CORS

from routes.auth import auth

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth)
app.register_blueprint(reports_bp)
app.register_blueprint(beneficiaries_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(distribution_bp)

@app.route("/")
def home():
    return {
        "message": "Smart Ration Hub API Running"
    }

if __name__ == "__main__":
    app.run(debug=True)