import os
import requests
import json
from datetime import datetime
from database import db
from models import (
    Department,
    Employee,
    Category,
    CarbonTransaction,
    EnvironmentalGoal,
    CSRActivity,
    EmployeeParticipation,
    ComplianceIssue,
    DepartmentScore,
    GreenIdea
)

def get_esg_database_context(department_id=None):
    """
    Compiles database tables into a structured text layout to feed as context to the AI model.
    """
    context_lines = []
    
    # 1. Department scores & Overall averages
    scores = DepartmentScore.query
    if department_id:
        scores = scores.filter(DepartmentScore.department_id == department_id)
    scores = scores.all()
    
    context_lines.append("## Department ESG Scores History:")
    if not scores:
        context_lines.append("- No department scores available yet.")
    else:
        context_lines.append("| Department | Month | Environmental Score | Social Score | Governance Score | Overall Score |")
        context_lines.append("| --- | --- | --- | --- | --- | --- |")
        for s in scores:
            dept_name = s.department.name if s.department else f"ID {s.department_id}"
            context_lines.append(f"| {dept_name} | {s.month} | {s.environmental_score} | {s.social_score} | {s.governance_score} | {s.overall_score} |")
            
    # 2. Emissions Ledger Summary
    txs = CarbonTransaction.query
    if department_id:
        txs = txs.filter(CarbonTransaction.department_id == department_id)
    txs = txs.all()
    
    total_emissions = sum(tx.calculated_emissions for tx in txs)
    scope1 = sum(tx.calculated_emissions for tx in txs if tx.category and tx.category.name in ['Direct Emissions', 'Combustion'])
    scope2 = sum(tx.calculated_emissions for tx in txs if tx.category and tx.category.name in ['Electricity', 'Steam'])
    scope3 = total_emissions - (scope1 + scope2)
    
    context_lines.append("\n## Carbon Emissions Ledger Summary:")
    context_lines.append(f"- Total Emissions: {total_emissions:.2f} kg CO2e")
    context_lines.append(f"- Scope 1 (Direct): {scope1:.2f} kg CO2e")
    context_lines.append(f"- Scope 2 (Indirect Grid): {scope2:.2f} kg CO2e")
    context_lines.append(f"- Scope 3 (Supply Chain/Other): {scope3:.2f} kg CO2e")
    context_lines.append(f"- Number of logs entries: {len(txs)}")
    
    # Department breakdown
    depts = Department.query.all()
    context_lines.append("\n## Emissions by Department:")
    for d in depts:
        d_txs = [t for t in txs if t.department_id == d.id]
        d_sum = sum(t.calculated_emissions for t in d_txs)
        context_lines.append(f"- {d.name}: {d_sum:.2f} kg CO2e")
        
    # Category breakdown
    cats = Category.query.all()
    context_lines.append("\n## Emissions by Category:")
    for c in cats:
        c_txs = [t for t in txs if t.category_id == c.id]
        c_sum = sum(t.calculated_emissions for t in c_txs)
        context_lines.append(f"- {c.name}: {c_sum:.2f} kg CO2e")

    # 3. Environmental Goals
    goals = EnvironmentalGoal.query
    if department_id:
        goals = goals.filter(EnvironmentalGoal.department_id == department_id)
    goals = goals.all()
    context_lines.append("\n## Environmental Sustainability Goals:")
    if not goals:
        context_lines.append("- No active goals defined.")
    else:
        context_lines.append("| Goal Name | Target Value | Current Progress | Unit | Start Date | Target Date | Status |")
        context_lines.append("| --- | --- | --- | --- | --- | --- | --- |")
        for g in goals:
            status = "Achieved" if g.current_value <= g.target_value else "In Progress"
            context_lines.append(f"| {g.name} | {g.target_value} | {g.current_value} | {g.unit} | {g.start_date} | {g.target_date} | {status} |")

    # 4. Social CSR & Volunteering
    csr_acts = CSRActivity.query.all()
    context_lines.append("\n## CSR Activities & Employee Volunteering:")
    if not csr_acts:
        context_lines.append("- No CSR activities recorded.")
    else:
        context_lines.append("| Activity Title | Date | Location | Reward (Points/XP) | Approved Vol. | Registered Vol. |")
        context_lines.append("| --- | --- | --- | --- | --- | --- |")
        for a in csr_acts:
            parts = EmployeeParticipation.query.filter_by(csr_activity_id=a.id).all()
            approved_count = sum(1 for p in parts if p.status == 'Approved')
            registered_count = sum(1 for p in parts if p.status == 'Registered')
            context_lines.append(f"| {a.title} | {a.date} | {a.location or 'N/A'} | {a.points_reward} pts / {a.xp_reward} XP | {approved_count} | {registered_count} |")

    # Leaderboard
    employee_parts = db.session.query(
        Employee.name, db.func.count(EmployeeParticipation.id)
    ).join(EmployeeParticipation).filter(EmployeeParticipation.status == 'Approved').group_by(Employee.name).all()
    context_lines.append("\n## CSR Approved Participations Leaderboard:")
    for name, cnt in employee_parts:
        context_lines.append(f"- {name}: {cnt} activities completed")

    # 5. Governance Audits & Compliance
    issues = ComplianceIssue.query
    if department_id:
        issues = issues.join(Employee).filter(Employee.department_id == department_id)
    issues = issues.all()
    
    open_issues = [i for i in issues if i.status in ['Open', 'In Progress']]
    today_date = datetime.now().date()
    overdue_issues = [i for i in issues if i.status == 'Overdue' or (i.status in ['Open', 'In Progress'] and i.due_date < today_date)]
    resolved_issues = [i for i in issues if i.status == 'Resolved']
    
    context_lines.append("\n## Governance Compliance Issues:")
    context_lines.append(f"- Open Issues: {len(open_issues)}")
    context_lines.append(f"- Overdue Issues: {len(overdue_issues)}")
    context_lines.append(f"- Resolved Issues: {len(resolved_issues)}")
    
    if open_issues:
        context_lines.append("\n### Open & Overdue Compliance Issues details:")
        context_lines.append("| Issue Title | Severity | Due Date | Owner | Status |")
        context_lines.append("| --- | --- | --- | --- | --- |")
        for i in open_issues:
            owner_name = i.owner.name if i.owner else "Unassigned"
            status_label = "OVERDUE" if i in overdue_issues else i.status
            context_lines.append(f"| {i.title} | {i.severity} | {i.due_date} | {owner_name} | {status_label} |")
            
    # 6. Green Ideas Submitted
    ideas = GreenIdea.query.all()
    context_lines.append("\n## Submitted Green Ideas (Sustainability Portal):")
    if not ideas:
        context_lines.append("- No ideas submitted yet.")
    else:
        context_lines.append("| Title | Category | Department | Votes | Status | Submitter |")
        context_lines.append("| --- | --- | --- | --- | --- | --- |")
        for id_ in ideas:
            submitter_name = id_.employee.name if id_.employee else "Unknown"
            context_lines.append(f"| {id_.title} | {id_.category} | {id_.department} | {id_.votes_count} | {id_.status} | {submitter_name} |")
            
    return "\n".join(context_lines)


def call_gemini_api(prompt, system_instruction):
    """
    Makes a direct REST request to Gemini API using GEMINI_API_KEY.
    If no key is configured, falls back to custom local generator using actual DB statistics.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback to local custom generator
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"System Instructions: {system_instruction}\n\nUser Question/Request: {prompt}"}
                ]
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code == 200:
            res_data = response.json()
            return res_data['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"Gemini API returned error code {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Exception while calling Gemini API: {e}")
        return None


def generate_mock_copilot_response(query):
    """
    Generates a highly realistic mock answer using active statistics from the DB.
    """
    total_tx = CarbonTransaction.query.count()
    total_emissions = sum(tx.calculated_emissions for tx in CarbonTransaction.query.all())
    open_issues = ComplianceIssue.query.filter(ComplianceIssue.status.in_(['Open', 'In Progress'])).all()
    today_date = datetime.now().date()
    overdue_issues_count = sum(1 for i in open_issues if i.due_date < today_date)
    
    highest_dept = None
    highest_emissions = 0.0
    for d in Department.query.all():
        d_sum = sum(t.calculated_emissions for t in d.carbon_transactions)
        if d_sum > highest_emissions:
            highest_emissions = d_sum
            highest_dept = d.name

    top_emp_name = "Jane Employee"
    top_emp_count = 1
    employee_parts = db.session.query(
        Employee.name, db.func.count(EmployeeParticipation.id)
    ).join(EmployeeParticipation).filter(EmployeeParticipation.status == 'Approved').group_by(Employee.name).order_by(db.func.count(EmployeeParticipation.id).desc()).first()
    if employee_parts:
        top_emp_name, top_emp_count = employee_parts
        
    scores = DepartmentScore.query.all()
    avg_overall = sum(s.overall_score for s in scores) / len(scores) if scores else 75.9
    avg_e = sum(s.environmental_score for s in scores) / len(scores) if scores else 75.0
    avg_s = sum(s.social_score for s in scores) / len(scores) if scores else 75.0
    avg_g = sum(s.governance_score for s in scores) / len(scores) if scores else 78.0

    query_lower = query.lower()

    if "emission" in query_lower or "department" in query_lower or "carbon" in query_lower:
        summary = f"Our carbon footprint ledger reports **{total_tx} transactions** totaling **{total_emissions:.2f} kg CO2e**."
        if highest_dept:
            summary += f" The **{highest_dept}** department is the highest source with **{highest_emissions:.2f} kg CO2e**."
        insights = [
            f"Emissions are heavily dominated by the {highest_dept or 'Operations'} department's operational loads.",
            "Indirect grid electricity represents the largest category of scope emissions logged."
        ]
        recs = [
            "Upgrade lab server cooling equipment and facility boilers to low-emission versions.",
            "Install automatic power-saving timers for computing servers and office HVAC units."
        ]
        actions = [
            f"Department lead of {highest_dept or 'Operations'} to investigate power spikes.",
            "Verify grid emissions logs for accuracy next week."
        ]
    elif "employee" in query_lower or "csr" in query_lower or "activities" in query_lower or "volunteer" in query_lower:
        summary = f"CSR participation registers **{top_emp_name}** as our top contributor, having completed **{top_emp_count} approved volunteering events**."
        insights = [
            "Volunteering sessions show strong employee engagement (e.g. Community Park Clean-up).",
            "Gamification points encourage registrations, but proof approvals need faster turnaround."
        ]
        recs = [
            "Add monthly recognition badges to top volunteers on the dashboard leaderboard.",
            "Extend hours for company-sponsored volunteer projects."
        ]
        actions = [
            "HR department to post clean-up rosters tomorrow morning.",
            "Deliver eco-reward travel mugs to employees exceeding 2000 XP."
        ]
    elif "overdue" in query_lower or "compliance" in query_lower or "governance" in query_lower or "issues" in query_lower:
        summary = f"EcoSphere shows **{len(open_issues)} open compliance issues**, with **{overdue_issues_count} issues** currently overdue."
        insights = [
            f"The key outstanding concern is '{open_issues[0].title if open_issues else 'None'}', owned by {open_issues[0].owner.name if (open_issues and open_issues[0].owner) else 'Unassigned'}.",
            "Average resolution times are currently lagging target dates, posing a compliance risk."
        ]
        recs = [
            "Enable automated email triggers to ticket owners 5 days before their deadline.",
            "Incorporate compliance resolution speed in department managers' scores."
        ]
        actions = [
            f"Remind owners of overdue compliance logs to submit progress updates.",
            "Schedule a Q3 governance audit review."
        ]
    elif "improve" in query_lower or "score" in query_lower:
        summary = f"Our current average scores are: Environmental (**{avg_e:.1f}%**), Social (**{avg_s:.1f}%**), and Governance (**{avg_g:.1f}%**), for an overall ESG average of **{avg_overall:.1f}%**."
        insights = [
            "Environmental score has room to improve by logging more offset activities.",
            "Social scores can be improved by completing outstanding employee CSR challenges.",
            "Governance improvement requires immediate resolution of the open compliance tickets."
        ]
        recs = [
            "Introduce strict SLAs for resolving high-severity compliance issues.",
            "Encourage single-use plastic reduction challenges among all divisions."
        ]
        actions = [
            "Assign pending compliance issues to owners with fixed target dates.",
            "Verify all employees have acknowledged the Zero Plastic Sourcing policy."
        ]
    else:
        summary = f"EcoSphere reports a consolidated ESG score of **{avg_overall:.1f}%** (B+). All core indicators are active and tracking correctly."
        insights = [
            f"Environmental indicator is stable at **{avg_e:.1f}%** with standard utility entries.",
            f"Social indicator is at **{avg_s:.1f}%**, driven by strong training session engagement.",
            f"Governance indicator leads at **{avg_g:.1f}%** due to complete policy audits."
        ]
        recs = [
            "Create a personal carbon footprint calculator for employees to capture work-from-home emissions.",
            "Expand the green ideas portal to crowdsource sustainability initiatives from employees."
        ]
        actions = [
            "Schedule monthly department score recalculations.",
            "Review submitted green ideas in the upcoming committee session."
        ]

    md = [
        "### Summary",
        summary,
        "### Insights",
        "\n".join(f"- {i}" for i in insights),
        "### Recommendations",
        "\n".join(f"- {r}" for r in recs),
        "### Priority Actions",
        "\n".join(f"- {a}" for a in actions)
    ]
    return "\n\n".join(md)


def ask_esg_copilot(query):
    """
    Answers an ESG query using live database context and Gemini.
    """
    db_context = get_esg_database_context()
    system_instruction = (
        "You are the EcoSphere AI ESG Copilot, an expert sustainability and compliance assistant.\n"
        "You have full access to the real-time company ESG data listed below. Answer the user's question accurately.\n"
        "You MUST structure your output in clean Markdown with exactly these four headers:\n"
        "### Summary\n[brief answer summary]\n"
        "### Insights\n[bulleted list of analytical insights]\n"
        "### Recommendations\n[bulleted list of actionable recommendations]\n"
        "### Priority Actions\n[bulleted list of immediate priority actions]\n\n"
        f"Real-time database context:\n{db_context}"
    )
    
    response = call_gemini_api(query, system_instruction)
    if not response:
        response = generate_mock_copilot_response(query)
    return response


def generate_executive_report(department_id=None):
    """
    Generates a full ESG Executive Report.
    """
    db_context = get_esg_database_context(department_id)
    
    prompt = "Generate a comprehensive ESG Executive Report for the company board."
    system_instruction = (
        "You are the EcoSphere AI Executive Reporter. You draft professional ESG reports for board reviews.\n"
        "Use the company's real-time database context provided below to formulate the report.\n"
        "Your report MUST be structured in clean Markdown with the following headings:\n"
        "# ESG Executive Report\n\n"
        "## Executive Summary\n[High-level overview of ESG performance]\n\n"
        "## Environmental Analysis\n[Analysis of emissions, scope breakdown, carbon metrics]\n\n"
        "## Social Analysis\n[Analysis of volunteering, training, employee participation in CSR]\n\n"
        "## Governance Analysis\n[Analysis of audits, policy acknowledgements, open compliance issues]\n\n"
        "## Strengths\n[What the organization is doing well based on metrics]\n\n"
        "## Weaknesses\n[Areas of risk or low scores]\n\n"
        "## Recommended Actions\n[Immediate actions to address weaknesses]\n\n"
        "## Future Goals\n[Future outlook and targets]\n\n"
        f"Real-time database context:\n{db_context}"
    )
    
    response = call_gemini_api(prompt, system_instruction)
    if not response:
        # Generate mock report based on actual database metrics
        total_emissions = sum(tx.calculated_emissions for tx in CarbonTransaction.query.all())
        open_issues = ComplianceIssue.query.filter(ComplianceIssue.status.in_(['Open', 'In Progress'])).all()
        scores = DepartmentScore.query.all()
        avg_overall = sum(s.overall_score for s in scores) / len(scores) if scores else 75.9
        avg_e = sum(s.environmental_score for s in scores) / len(scores) if scores else 75.0
        avg_s = sum(s.social_score for s in scores) / len(scores) if scores else 75.0
        avg_g = sum(s.governance_score for s in scores) / len(scores) if scores else 78.0
        
        response = (
            f"# ESG Executive Report\n\n"
            f"## Executive Summary\n"
            f"This Executive Report evaluates EcoSphere's ESG performance across all departments. Currently, the company maintains a consolidated ESG rating of **{avg_overall:.1f}%**, reflecting robust corporate ethics and high employee engagement, with opportunities for direct carbon footprint reductions.\n\n"
            f"## Environmental Analysis\n"
            f"Our cumulative emissions log records **{total_emissions:.2f} kg CO2e**. Operations and Sales are the leading sources of emissions. High scope grid electricity and vehicle fuels represent major focus areas for utility transition.\n\n"
            f"## Social Analysis\n"
            f"Social engagement remains a key strength, driven by strong attendance in corporate training and green volunteering events. CSR programs have registered high engagement levels, promoting sustainability ethics throughout the divisions.\n\n"
            f"## Governance Analysis\n"
            f"Our compliance metrics report **{len(open_issues)} open issues** and complete audit trials. Acknowledgment rates for critical internal regulations remain high, though SLA compliance on resolving outstanding audit issues requires stricter enforcement.\n\n"
            f"## Strengths\n"
            f"- Strong governance with complete audit trials and high policy acknowledgment rates.\n"
            f"- Highly engaged staff with active CSR volunteering registrations.\n"
            f"- Healthy overall average score of **{avg_overall:.1f}%**.\n\n"
            f"## Weaknesses\n"
            f"- High operational carbon footprint from Grid Electricity draw and fleet fuel.\n"
            f"- Delay in resolving outstanding compliance items, creating potential audit bottlenecks.\n\n"
            f"## Recommended Actions\n"
            f"1. Transition company facility heating and vehicle fleets to hybrid or electric alternatives.\n"
            f"2. Enforce target deadlines on outstanding compliance issues.\n"
            f"3. Deploy employee carbon calculators to track and reduce distributed home-working emissions.\n\n"
            f"## Future Goals\n"
            f"- Achieve a target environmental score above 85% by Q4 2026.\n"
            f"- Transition to 100% renewable grid electricity across corporate offices by 2027.\n"
            f"- Reach a zero overdue compliance status."
        )
    return response


def get_calculator_suggestions(inputs):
    """
    Generates personalized recommendations based on Carbon Footprint Calculator inputs.
    """
    prompt = f"Review these monthly employee footprint metrics and suggest carbon reduction tips: {json.dumps(inputs)}"
    system_instruction = (
        "You are the EcoSphere Personal Sustainability Coach.\n"
        "Analyze the provided employee carbon calculation metrics (commuting, electricity, flight, food) "
        "and list 3-4 personalized, practical, and highly impactful recommendations in clean Markdown format to reduce their footprint."
    )
    
    response = call_gemini_api(prompt, system_instruction)
    if not response:
        # Mock suggestions based on food and commute inputs
        commute = inputs.get('commute_distance', 0)
        food = inputs.get('food_preference', 'Balanced')
        electricity = inputs.get('electricity_usage', 0)
        flights = inputs.get('flight_hours', 0)
        
        suggestions = []
        if commute > 20:
            suggestions.append("- **Commuting**: Consider carpooling twice a week or using public transit to cut transportation emissions.")
        else:
            suggestions.append("- **Commuting**: Ditch short driving trips. Walk, bike, or use micro-mobility options for distance under 5 km.")
            
        if food == 'Meat-heavy':
            suggestions.append("- **Dietary**: Introduce 'Meatless Mondays' or replace beef/lamb with poultry or plant protein to reduce your food carbon footprint by up to 30%.")
        elif food == 'Balanced':
            suggestions.append("- **Dietary**: Incorporate more organic, locally sourced vegetables and grains to reduce transportation-related food emissions.")
            
        if electricity > 150:
            suggestions.append("- **Energy**: Switch to energy-efficient LED lighting, unplug idle electronics, and consider setting smart thermostat configurations.")
            
        if flights > 5:
            suggestions.append("- **Air Travel**: Reduce short-haul business flights by utilizing video conferencing tools, or choose direct flights and purchase carbon offset credits.")
            
        if not suggestions:
            suggestions.append("- **Great Job!**: Your inputs indicate a relatively low carbon footprint. Share your habits with colleagues to spread the word.")
            
        response = "Based on your inputs, here are key actions you can take to lower your monthly emissions:\n\n" + "\n".join(suggestions)
        
    return response
