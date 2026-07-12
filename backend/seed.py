import sys
import os
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash

# Ensure backend directory is in path for module imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database import db
from models import (
    Department,
    Employee,
    Category,
    EmissionFactor,
    EnvironmentalGoal,
    ProductESGProfile,
    Policy,
    Badge,
    Reward,
    CarbonTransaction,
    CSRActivity,
    EmployeeParticipation,
    Challenge,
    ChallengeParticipation,
    PolicyAcknowledgement,
    Audit,
    ComplianceIssue,
    DepartmentScore,
    Notification,
    RewardRedemption
)

def seed_database():
    print("Initializing Flask App context...")
    app = create_app()
    
    with app.app_context():
        print("Dropping existing tables...")
        db.drop_all()
        
        print("Creating all tables from SQLAlchemy schemas...")
        db.create_all()
        
        print("Seeding database fixtures...")
        
        # 1. Departments
        sustainability = Department(name="Sustainability", description="ESG compliance, standards, and metrics tracking.")
        engineering = Department(name="Engineering", description="Software development and product architectures.")
        operations = Department(name="Operations", description="Facilities management, supply chain, and physical offices.")
        sales = Department(name="Sales", description="Customer relations, outreach, and global marketing.")
        
        db.session.add_all([sustainability, engineering, operations, sales])
        db.session.flush() # Populate IDs
        
        # 2. Employees (Password hashing via werkzeug)
        hashed_pwd_admin = generate_password_hash("admin123")
        hashed_pwd_emp = generate_password_hash("employee123")
        
        admin = Employee(
            name="Eco Admin",
            email="admin@ecosphere.com",
            password_hash=hashed_pwd_admin,
            role="Admin",
            points=100,
            xp=500,
            department_id=sustainability.id
        )
        
        jane = Employee(
            name="Jane Employee",
            email="employee@ecosphere.com",
            password_hash=hashed_pwd_emp,
            role="Employee",
            points=450,
            xp=2450,
            department_id=engineering.id
        )
        
        auditor = Employee(
            name="Auditor Smith",
            email="auditor@ecosphere.com",
            password_hash=hashed_pwd_admin,
            role="Admin",
            points=50,
            xp=300,
            department_id=operations.id
        )
        
        michael = Employee(
            name="Michael Sales",
            email="sales@ecosphere.com",
            password_hash=hashed_pwd_emp,
            role="Employee",
            points=120,
            xp=800,
            department_id=sales.id
        )
        
        db.session.add_all([admin, jane, auditor, michael])
        db.session.flush()
        
        # 3. ESG Categories
        environmental_cat = Category(name="Environmental", description="Carbon footprint, energy, waste, and raw materials.")
        social_cat = Category(name="Social", description="Employee health/safety, CSR, training, and community engagement.")
        governance_cat = Category(name="Governance", description="Compliance audits, legal guidelines, and corporate ethics.")
        
        db.session.add_all([environmental_cat, social_cat, governance_cat])
        db.session.flush()
        
        # 4. Emission Factors
        elec_factor = EmissionFactor(
            name="Purchased Grid Electricity",
            factor=0.385, # kg CO2e per kWh
            unit="kWh",
            category_id=environmental_cat.id
        )
        gas_factor = EmissionFactor(
            name="Natural Gas Heating",
            factor=1.891, # kg CO2e per m3
            unit="m3",
            category_id=environmental_cat.id
        )
        diesel_factor = EmissionFactor(
            name="Company Diesel Vehicles",
            factor=2.684, # kg CO2e per L
            unit="L",
            category_id=environmental_cat.id
        )
        
        db.session.add_all([elec_factor, gas_factor, diesel_factor])
        db.session.flush()
        
        # 5. Environmental Goals
        corporate_goal = EnvironmentalGoal(
            name="Corporate Net Zero Target",
            target_value=0.0,
            current_value=45.2,
            unit="tCO2e",
            start_date=date(2026, 1, 1),
            target_date=date(2028, 12, 31),
            category_id=environmental_cat.id,
            department_id=None # Corporate-wide
        )
        engineering_electricity_goal = EnvironmentalGoal(
            name="Reduce Labs Grid Draw",
            target_value=8000.0,
            current_value=9500.0,
            unit="kWh",
            start_date=date(2026, 7, 1),
            target_date=date(2026, 12, 31),
            category_id=environmental_cat.id,
            department_id=engineering.id
        )
        
        db.session.add_all([corporate_goal, engineering_electricity_goal])
        db.session.flush()
        
        # 6. Product ESG Profiles
        solar_charger = ProductESGProfile(
            name="Solar Charger (Model S)",
            carbon_footprint=1.2,
            social_score=9.5,
            governance_score=9.0,
            overall_esg_score=9.2
        )
        cotton_tshirt = ProductESGProfile(
            name="Eco Organic Cotton Tee",
            carbon_footprint=0.8,
            social_score=8.5,
            governance_score=8.0,
            overall_esg_score=8.1
        )
        
        db.session.add_all([solar_charger, cotton_tshirt])
        db.session.flush()
        
        # 7. Policies
        zero_waste_policy = Policy(
            title="Zero Single-Use Plastics Policy",
            content="This policy establishes guidelines for eliminating all single-use plastics from office workspaces, catering events, and facilities. Employees must use provided eco-mugs and reusable dining ware.",
            version="1.1",
            effective_date=date(2026, 1, 1)
        )
        labor_policy = Policy(
            title="Fair Sourcing and Labor Policy",
            content="We mandate that all hardware and merchandise suppliers adhere strictly to fair labor standard guidelines, equal pay, transparent working conditions, and carbon offsetting.",
            version="2.0",
            effective_date=date(2026, 3, 15)
        )
        
        db.session.add_all([zero_waste_policy, labor_policy])
        db.session.flush()
        
        # 8. Badges
        eco_champion = Badge(
            name="Eco Champion",
            description="Awarded for participating in 3 environmental challenges or events.",
            icon_name="award-green",
            xp_required=300
        )
        carbon_saver = Badge(
            name="Carbon Saver",
            description="Awarded for logging 10 or more low-emissions entries.",
            icon_name="leaf-gold",
            xp_required=500
        )
        policy_guardian = Badge(
            name="Policy Guardian",
            description="Unlock by acknowledging all current company compliance regulations.",
            icon_name="shield-indigo",
            xp_required=150
        )
        
        db.session.add_all([eco_champion, carbon_saver, policy_guardian])
        db.session.flush()
        
        # Assign badges to employees
        jane.badges.append(eco_champion)
        jane.badges.append(policy_guardian)
        michael.badges.append(policy_guardian)
        
        # 9. Rewards
        travel_mug = Reward(
            name="Bamboo Travel Mug",
            description="Double-walled vacuum insulated, certified organic bamboo cover.",
            points_cost=200,
            stock=45
        )
        charger_reward = Reward(
            name="Solar Charger Pad",
            description="Heavy duty waterproof folding solar charger with dual USB inputs.",
            points_cost=500,
            stock=15
        )
        tree_reward = Reward(
            name="1 Tree Planted",
            description="A tree will be planted in deforested locations in your name.",
            points_cost=100,
            stock=999
        )
        
        db.session.add_all([travel_mug, charger_reward, tree_reward])
        db.session.flush()
        
        # 10. Carbon Transactions (Last 6 Months historical data for charts)
        today = date.today()
        transactions = []
        
        # Generate some mock data stretching back 180 days
        for i in range(1, 7):
            month_date = today - timedelta(days=30 * i)
            # Add Electricity consumption entries
            transactions.append(CarbonTransaction(
                activity_name="Utility Grid Draw",
                quantity=1200.0 + (i * 100),
                calculated_emissions=(1200.0 + (i * 100)) * elec_factor.factor / 1000.0, # Convert kg to metric tons
                date=month_date,
                department_id=engineering.id,
                category_id=environmental_cat.id,
                emission_factor_id=elec_factor.id
            ))
            transactions.append(CarbonTransaction(
                activity_name="Facility Power",
                quantity=3000.0 - (i * 80),
                calculated_emissions=(3000.0 - (i * 80)) * elec_factor.factor / 1000.0,
                date=month_date,
                department_id=operations.id,
                category_id=environmental_cat.id,
                emission_factor_id=elec_factor.id
            ))
            # Add Gas heating entries
            transactions.append(CarbonTransaction(
                activity_name="Gas Boiler usage",
                quantity=500.0 + (i * 20),
                calculated_emissions=(500.0 + (i * 20)) * gas_factor.factor / 1000.0,
                date=month_date,
                department_id=operations.id,
                category_id=environmental_cat.id,
                emission_factor_id=gas_factor.id
            ))
            # Add Diesel vehicle fuel entries
            transactions.append(CarbonTransaction(
                activity_name="Sales Fleet Transport",
                quantity=300.0 + (i * 40),
                calculated_emissions=(300.0 + (i * 40)) * diesel_factor.factor / 1000.0,
                date=month_date,
                department_id=sales.id,
                category_id=environmental_cat.id,
                emission_factor_id=diesel_factor.id
            ))
            
        db.session.add_all(transactions)
        db.session.flush()
        
        # 11. CSR Activities
        clean_up = CSRActivity(
            title="Community Park Solar Clean-up",
            description="Volunteer to clear rubbish and maintain brush borders around the community solar fields.",
            date=date.today() + timedelta(days=10),
            location="Westside Community Solar Farm",
            points_reward=100,
            xp_reward=400,
            max_participants=20
        )
        training = CSRActivity(
            title="Supplier Ethics & ESG Standards Training",
            description="Virtual and physical onboarding session reviewing green vendor selection rules.",
            date=date.today() - timedelta(days=5),
            location="Room 404 & Zoom Portal",
            points_reward=50,
            xp_reward=150,
            max_participants=50
        )
        
        db.session.add_all([clean_up, training])
        db.session.flush()
        
        # 12. Employee Participations
        jane_participation = EmployeeParticipation(
            employee_id=jane.id,
            csr_activity_id=training.id,
            status="Approved",
            proof_url="http://example.com/training_certificate.pdf",
            submitted_at=datetime.utcnow() - timedelta(days=5),
            approved_at=datetime.utcnow() - timedelta(days=4)
        )
        michael_participation = EmployeeParticipation(
            employee_id=michael.id,
            csr_activity_id=clean_up.id,
            status="Registered",
            submitted_at=datetime.utcnow() - timedelta(days=1)
        )
        
        db.session.add_all([jane_participation, michael_participation])
        db.session.flush()
        
        # 13. Challenges (Gamification)
        plastics_challenge = Challenge(
            title="Zero Plastic Workweek Challenge",
            description="Avoid logging single-use water bottles, straws, or plastic cutlery for a whole week.",
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() + timedelta(days=4),
            status="Active",
            points_reward=200,
            xp_reward=600
        )
        commute_challenge = Challenge(
            title="Bike or Carpool Commute",
            description="Ditch solo driving. Bike, walk, or carpool with colleagues for 10 commutes.",
            start_date=date.today() + timedelta(days=15),
            end_date=date.today() + timedelta(days=30),
            status="Draft",
            points_reward=350,
            xp_reward=900
        )
        
        db.session.add_all([plastics_challenge, commute_challenge])
        db.session.flush()
        
        # 14. Challenge Participations
        jane_challenge = ChallengeParticipation(
            employee_id=jane.id,
            challenge_id=plastics_challenge.id,
            progress=85.0,
            status="Joined"
        )
        
        db.session.add_all([jane_challenge])
        db.session.flush()
        
        # 15. Policy Acknowledgements
        jane_ack = PolicyAcknowledgement(
            employee_id=jane.id,
            policy_id=zero_waste_policy.id,
            acknowledged_at=datetime.utcnow() - timedelta(days=10)
        )
        michael_ack = PolicyAcknowledgement(
            employee_id=michael.id,
            policy_id=zero_waste_policy.id,
            acknowledged_at=datetime.utcnow() - timedelta(days=8)
        )
        
        db.session.add_all([jane_ack, michael_ack])
        db.session.flush()
        
        # 16. Audits (Governance)
        q2_audit = Audit(
            title="Q2 Scope 1 & 2 Carbon Emissions Verification",
            description="Internal inspection verify electricity grid statements and sales team fuel receipt totals.",
            audit_date=date.today() - timedelta(days=20),
            status="Completed",
            lead_auditor_id=auditor.id
        )
        q3_audit = Audit(
            title="Q3 Scope 3 Procurement Audit",
            description="Evaluate supply chain compliance with ethical vendor declarations.",
            audit_date=date.today() + timedelta(days=40),
            status="Scheduled",
            lead_auditor_id=auditor.id
        )
        
        db.session.add_all([q2_audit, q3_audit])
        db.session.flush()
        
        # 17. Compliance Issues (Governance)
        ops_threshold_issue = ComplianceIssue(
            title="Facility Heat Leakage in Server Room",
            description="Operations division insulation failed leading to 15% increase in cooling emissions.",
            status="Open",
            severity="High",
            due_date=date.today() + timedelta(days=15),
            owner_id=jane.id, # Assigned to Jane to fix
            audit_id=q2_audit.id
        )
        resolved_receipt_issue = ComplianceIssue(
            title="Missing Scope 3 Air Travel Receipts",
            description="Missing details regarding flight lengths and offsets.",
            status="Resolved",
            severity="Medium",
            due_date=date.today() - timedelta(days=5),
            resolved_at=datetime.utcnow() - timedelta(days=7),
            owner_id=michael.id,
            audit_id=q2_audit.id
        )
        
        db.session.add_all([ops_threshold_issue, resolved_receipt_issue])
        db.session.flush()
        
        # 18. Department Scores (Monthly Historical metrics)
        scores = []
        for i in range(1, 7):
            month_str = f"2026-0{i}" if i < 10 else f"2026-{i}"
            scores.append(DepartmentScore(
                department_id=engineering.id,
                environmental_score=75.0 + (i * 2.0),
                social_score=80.0,
                governance_score=82.0,
                overall_score=(75.0 + (i * 2.0)) * 0.4 + 80.0 * 0.3 + 82.0 * 0.3,
                month=month_str
            ))
            scores.append(DepartmentScore(
                department_id=operations.id,
                environmental_score=60.0 + (i * 1.5),
                social_score=70.0,
                governance_score=75.0,
                overall_score=(60.0 + (i * 1.5)) * 0.4 + 70.0 * 0.3 + 75.0 * 0.3,
                month=month_str
            ))
            scores.append(DepartmentScore(
                department_id=sales.id,
                environmental_score=70.0 + i,
                social_score=75.0,
                governance_score=78.0,
                overall_score=(70.0 + i) * 0.4 + 75.0 * 0.3 + 78.0 * 0.3,
                month=month_str
            ))
            
        db.session.add_all(scores)
        db.session.flush()
        
        # 19. Notifications
        jane_notif1 = Notification(
            title="New Badge Unlocked!",
            description="Congratulations! You unlocked the 'Eco Champion' badge.",
            type="badge",
            read=False,
            created_at=datetime.utcnow() - timedelta(hours=2),
            employee_id=jane.id
        )
        jane_notif2 = Notification(
            title="Policy Acknowledged",
            description="You acknowledged the 'Zero Single-Use Plastics Policy'.",
            type="policy",
            read=True,
            created_at=datetime.utcnow() - timedelta(days=10),
            employee_id=jane.id
        )
        
        db.session.add_all([jane_notif1, jane_notif2])
        db.session.flush()
        
        # 20. Reward Redemptions
        jane_redemption = RewardRedemption(
            employee_id=jane.id,
            reward_id=tree_reward.id,
            redeemed_at=datetime.utcnow() - timedelta(days=3),
            points_spent=100,
            status="Fulfilled"
        )
        
        db.session.add_all([jane_redemption])
        
        print("Committing changes...")
        db.session.commit()
        print("Database successfully created and seeded!")

if __name__ == '__main__':
    seed_database()
