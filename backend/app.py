import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import db
from routes.auth import auth_bp
from routes.master_data import master_bp
from routes.environmental import environmental_bp
from routes.social_gamification import social_bp
from routes.governance import gov_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    
    jwt = JWTManager(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(master_bp)
    app.register_blueprint(environmental_bp)
    app.register_blueprint(social_bp)
    app.register_blueprint(gov_bp)

    # Global Health Check Route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "EcoSphere ESG Platform Backend API is running",
            "environment": os.environ.get('FLASK_ENV', 'development')
        }), 200

    # Global JWT Error Handlers Customization
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "message": "The token has expired",
            "error": "token_expired"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "message": "Signature verification failed",
            "error": "invalid_token"
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "message": "Request does not contain an access token",
            "error": "authorization_required"
        }), 401

    # Generic Global Error Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if hasattr(e, 'code'):
            return jsonify({
                "message": getattr(e, 'description', str(e)),
                "error": e.__class__.__name__
            }), e.code
        
        # Non-HTTP exceptions
        return jsonify({
            "message": "An unexpected server error occurred",
            "error": str(e)
        }), 500

    return app

if __name__ == '__main__':
    app = create_app()
    # Run server on port 5000 in development mode
    app.run(host='0.0.0.0', port=5000, debug=True)
