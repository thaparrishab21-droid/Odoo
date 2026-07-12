from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from sqlalchemy import func, or_
from datetime import datetime

from database import db
from utils.auth import admin_required, role_required
from models import (
    CarbonTransaction,
    Department,
    Category,
    EmissionFactor,
    EnvironmentalGoal
)
from schemas import CarbonTransactionSchema

environmental_bp = Blueprint('environmental', __name__, url_prefix='/api')

def update_goal_progress():
    """Recalculate current_value for all active environmental goals based on transaction sums."""
    goals = EnvironmentalGoal.query.all()
    for goal in goals:
        # Sum matching transactions
        query = db.session.query(func.sum(CarbonTransaction.calculated_emissions)).filter(
            CarbonTransaction.category_id == goal.category_id,
            CarbonTransaction.date >= goal.start_date,
            CarbonTransaction.date <= goal.target_date
        )
        if goal.department_id is not None:
            query = query.filter(CarbonTransaction.department_id == goal.department_id)
            
        sum_emissions = query.scalar() or 0.0
        goal.current_value = float(sum_emissions)
    db.session.commit()


@environmental_bp.route('/carbon-transactions', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_transactions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search_query = request.args.get('search', '', type=str)
    
    query = CarbonTransaction.query
    
    # Filters
    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter(CarbonTransaction.department_id == dept_id)
        
    cat_id = request.args.get('category_id', type=int)
    if cat_id:
        query = query.filter(CarbonTransaction.category_id == cat_id)
        
    start_date_str = request.args.get('start_date', type=str)
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            query = query.filter(CarbonTransaction.date >= start_date)
        except ValueError:
            pass
            
    end_date_str = request.args.get('end_date', type=str)
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            query = query.filter(CarbonTransaction.date <= end_date)
        except ValueError:
            pass

    if search_query:
        query = query.filter(CarbonTransaction.activity_name.ilike(f"%{search_query}%"))

    # Order by newest first
    query = query.order_by(CarbonTransaction.date.desc(), CarbonTransaction.id.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "items": [t.to_dict() for t in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages
    }), 200


@environmental_bp.route('/carbon-transactions', methods=['POST'])
@role_required(['Admin', 'Employee'])
def create_transaction():
    try:
        data = CarbonTransactionSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    # Verify relationships exist
    Department.query.get_or_404(data['department_id'])
    Category.query.get_or_404(data['category_id'])
    ef = EmissionFactor.query.get_or_404(data['emission_factor_id'])

    # Auto calculate footprint
    data['calculated_emissions'] = float(data['quantity'] * ef.factor)

    new_tx = CarbonTransaction(**data)
    db.session.add(new_tx)
    db.session.commit()

    # Recalculate goals progress
    update_goal_progress()

    return jsonify(new_tx.to_dict()), 201


@environmental_bp.route('/carbon-transactions/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Employee'])
def update_transaction(id):
    tx = CarbonTransaction.query.get_or_404(id)
    try:
        data = CarbonTransactionSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    # Verify relationships
    Department.query.get_or_404(data['department_id'])
    Category.query.get_or_404(data['category_id'])
    ef = EmissionFactor.query.get_or_404(data['emission_factor_id'])

    # Re-calculate footprint
    data['calculated_emissions'] = float(data['quantity'] * ef.factor)

    for key, value in data.items():
        setattr(tx, key, value)
    db.session.commit()

    # Recalculate goals progress
    update_goal_progress()

    return jsonify(tx.to_dict()), 200


@environmental_bp.route('/carbon-transactions/<int:id>', methods=['DELETE'])
@role_required(['Admin', 'Employee'])
def delete_transaction(id):
    tx = CarbonTransaction.query.get_or_404(id)
    db.session.delete(tx)
    db.session.commit()

    # Recalculate goals progress
    update_goal_progress()

    return jsonify({"message": "Transaction deleted successfully"}), 200


@environmental_bp.route('/environmental-dashboard', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_dashboard_stats():
    # 1. Total Emissions
    total_val = db.session.query(func.sum(CarbonTransaction.calculated_emissions)).scalar() or 0.0
    
    # 2. Breakdown by Department
    dept_emissions = db.session.query(
        Department.name,
        func.sum(CarbonTransaction.calculated_emissions)
    ).join(CarbonTransaction, Department.id == CarbonTransaction.department_id).group_by(Department.name).all()
    by_department = [{"department_name": name, "emissions": float(val or 0)} for name, val in dept_emissions]
    
    # 3. Breakdown by Category
    cat_emissions = db.session.query(
        Category.name,
        func.sum(CarbonTransaction.calculated_emissions)
    ).join(CarbonTransaction, Category.id == CarbonTransaction.category_id).group_by(Category.name).all()
    by_category = [{"category_name": name, "emissions": float(val or 0)} for name, val in cat_emissions]
    
    # 4. Monthly Trend (last 6 months order)
    trend = db.session.query(
        func.strftime('%Y-%m', CarbonTransaction.date).label('month'),
        func.sum(CarbonTransaction.calculated_emissions)
    ).group_by('month').order_by('month').all()
    monthly_trend = [{"month": m, "emissions": float(val or 0)} for m, val in trend]
    
    # 5. Goal Progress
    goals_list = EnvironmentalGoal.query.all()
    goals = [g.to_dict() for g in goals_list]
    
    return jsonify({
        "total_emissions": float(total_val),
        "by_department": by_department,
        "by_category": by_category,
        "monthly_trend": monthly_trend,
        "goals": goals
    }), 200
