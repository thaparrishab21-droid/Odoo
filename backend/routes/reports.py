from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
import csv
import io
from datetime import datetime

from database import db
from utils.auth import role_required
from models import (
    Employee,
    CarbonTransaction,
    EmployeeParticipation,
    PolicyAcknowledgement,
    ComplianceIssue,
    DepartmentScore,
    Department
)

reports_bp = Blueprint('reports', __name__, url_prefix='/api')

@reports_bp.route('/reports/esg-summary', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_esg_summary():
    department_id = request.args.get('department_id', type=int)
    
    # Base queries
    tx_query = CarbonTransaction.query
    part_query = EmployeeParticipation.query
    ack_query = PolicyAcknowledgement.query
    issue_query = ComplianceIssue.query
    score_query = DepartmentScore.query
    
    if department_id:
        tx_query = tx_query.filter(CarbonTransaction.department_id == department_id)
        part_query = part_query.join(Employee).filter(Employee.department_id == department_id)
        ack_query = ack_query.join(Employee).filter(Employee.department_id == department_id)
        issue_query = issue_query.join(Employee).filter(Employee.department_id == department_id)
        score_query = score_query.filter(DepartmentScore.department_id == department_id)

    # 1. Environmental calculations
    transactions = tx_query.all()
    total_emissions = sum(tx.calculated_emissions for tx in transactions)
    
    # Check category and scope mapping based on category link
    # Let's inspect scope based on category name
    scope1 = sum(tx.calculated_emissions for tx in transactions if tx.category and tx.category.name in ['Direct Emissions', 'Combustion'])
    scope2 = sum(tx.calculated_emissions for tx in transactions if tx.category and tx.category.name in ['Electricity', 'Steam'])
    scope3 = total_emissions - (scope1 + scope2)
    
    # 2. Social calculations
    participations = part_query.all()
    total_participations = len(participations)
    approved_participations = sum(1 for p in participations if p.status == 'Approved')
    pending_participations = sum(1 for p in participations if p.status == 'Submitted')
    
    # 3. Governance calculations
    total_acks = ack_query.count()
    issues = issue_query.all()
    total_issues = len(issues)
    resolved_issues = sum(1 for i in issues if i.status == 'Resolved')
    open_issues = sum(1 for i in issues if i.status == 'Open' or i.status == 'In Progress')
    overdue_issues = sum(1 for i in issues if i.status == 'Overdue')
    
    # 4. Department scores calculations
    scores = score_query.all()
    avg_e = sum(s.environmental_score for s in scores) / len(scores) if scores else 75.0
    avg_s = sum(s.social_score for s in scores) / len(scores) if scores else 75.0
    avg_g = sum(s.governance_score for s in scores) / len(scores) if scores else 78.0
    avg_overall = sum(s.overall_score for s in scores) / len(scores) if scores else 75.9
    
    return jsonify({
        "environmental": {
            "total_emissions": round(total_emissions, 2),
            "scope1": round(scope1, 2),
            "scope2": round(scope2, 2),
            "scope3": round(scope3, 2),
            "transactions_count": len(transactions)
        },
        "social": {
            "total_participations": total_participations,
            "approved_participations": approved_participations,
            "pending_participations": pending_participations
        },
        "governance": {
            "policy_acknowledgements_count": total_acks,
            "total_issues": total_issues,
            "resolved_issues": resolved_issues,
            "open_issues": open_issues,
            "overdue_issues": overdue_issues
        },
        "averages": {
            "environmental_score": round(avg_e, 2),
            "social_score": round(avg_s, 2),
            "governance_score": round(avg_g, 2),
            "overall_score": round(avg_overall, 2)
        }
    }), 200

@reports_bp.route('/reports/export-csv', methods=['GET'])
@role_required(['Admin', 'Employee'])
def export_esg_csv():
    report_type = request.args.get('type', 'emissions', type=str)
    department_id = request.args.get('department_id', type=int)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == 'emissions':
        writer.writerow(['Transaction ID', 'Department', 'Activity Description', 'Quantity', 'Footprint (kg CO2e)', 'Logged Date'])
        
        query = CarbonTransaction.query
        if department_id:
            query = query.filter(CarbonTransaction.department_id == department_id)
        
        txs = query.order_by(CarbonTransaction.date.desc()).all()
        for t in txs:
            dept_name = t.department.name if t.department else 'N/A'
            writer.writerow([
                t.id, dept_name, t.activity_name, t.quantity, t.calculated_emissions, t.date.isoformat()
            ])
            
    elif report_type == 'social':
        writer.writerow(['Participation ID', 'Employee Name', 'Department', 'CSR Activity Name', 'Points Reward', 'XP Reward', 'Status', 'Submitted At', 'Approved At'])
        
        query = EmployeeParticipation.query
        if department_id:
            query = query.join(Employee).filter(Employee.department_id == department_id)
            
        parts = query.order_by(EmployeeParticipation.submitted_at.desc()).all()
        for p in parts:
            emp_name = p.employee.name if p.employee else 'Unknown'
            dept_name = p.employee.department.name if p.employee and p.employee.department else 'N/A'
            activity_title = p.csr_activity.title if p.csr_activity else 'N/A'
            pts = p.csr_activity.points_reward if p.csr_activity else 0
            xp = p.csr_activity.xp_reward if p.csr_activity else 0
            writer.writerow([
                p.id, emp_name, dept_name, activity_title, pts, xp, p.status, 
                p.submitted_at.isoformat() if p.submitted_at else 'N/A', 
                p.approved_at.isoformat() if p.approved_at else 'N/A'
            ])
            
    elif report_type == 'governance':
        writer.writerow(['Issue ID', 'Issue Title', 'Severity', 'Status', 'Assignee Owner', 'Department', 'Due Date', 'Resolved At'])
        
        query = ComplianceIssue.query
        if department_id:
            query = query.join(Employee).filter(Employee.department_id == department_id)
            
        issues = query.order_by(ComplianceIssue.due_date.asc()).all()
        for i in issues:
            emp_name = i.owner.name if i.owner else 'Unassigned'
            dept_name = i.owner.department.name if i.owner and i.owner.department else 'N/A'
            writer.writerow([
                i.id, i.title, i.severity, i.status, emp_name, dept_name, 
                i.due_date.isoformat(), 
                i.resolved_at.isoformat() if i.resolved_at else 'N/A'
            ])
            
    else:
        return jsonify({"message": "Invalid report type"}), 400
        
    csv_data = output.getvalue()
    output.close()
    
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename=ecosphere_{report_type}_report.csv"}
    )
