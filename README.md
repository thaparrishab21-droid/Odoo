# EcoSphere

### Enterprise ESG Management Platform

EcoSphere is a full-stack platform that enables organizations to monitor, manage, and improve their Environmental, Social, and Governance (ESG) performance. It brings together operational data, employee engagement, governance compliance, sustainability analytics, AI-driven insights, and gamification into a single enterprise dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [ESG Score Engine](#esg-score-engine)
4. [AI Features](#ai-features)
5. [Reports](#reports)
6. [Database Design](#database-design)
7. [REST API](#rest-api)
8. [Tech Stack](#tech-stack)
9. [Future Enhancements](#future-enhancements)
10. [Contributors](#contributors)

---

## Overview

EcoSphere provides organizations with a centralized system to track sustainability performance across departments, empower employees to actively contribute to ESG goals, and give leadership real-time, data-driven visibility into environmental impact, social responsibility, and governance compliance.


## Key Features

### Authentication & Authorization
- JWT-based authentication with secure password hashing
- Login, logout, and protected routes
- Role-based access control (Admin, Employee)
- User profiles and session management

### Enterprise Dashboard
- Organization-wide and department-level ESG scores
- KPI cards, ESG health score, and department rankings
- Carbon, CSR, and governance analytics
- Interactive charts, activity timeline, and progress indicators

### Environmental Module
- Carbon transaction tracking with automatic calculation
- Emission factor management and monthly carbon analytics
- Environmental goal creation and progress monitoring
- Department-level KPI tracking

### Social Module
- CSR activity management with evidence upload and approval workflow
- Employee participation and training completion tracking
- Diversity metrics: gender, age, and department distribution
- Dedicated social performance dashboard

### Governance Module
- ESG policy management with acknowledgement tracking
- Audit management and compliance issue tracking
- Compliance ownership, due dates, and overdue alerts
- Governance-focused reporting dashboard

### Gamification Engine
- Challenges with full lifecycle management (draft, active, under review, completed, archived)
- XP system covering CSR and challenge participation
- Automatic badge unlocking (e.g., Eco Warrior, Green Leader, CSR Champion)
- Reward redemption with stock and XP management
- Global, department, monthly, and yearly leaderboards

### Notification System
- Real-time alerts for badges, rewards, approvals, and compliance issues
- Notification bell with unread counter and dedicated notification center

### Settings
- Organization profile and configurable ESG weightings
- Theme switching, evidence requirements, and automation toggles

### Search & Filtering
- Global search across employees, departments, policies, challenges, and rewards
- Advanced filtering by department, employee, date, category, and status

### Data Visualization
- KPI cards, pie/bar/line/area charts, progress bars, and leaderboards
- Department rankings and trend analysis

---

## ESG Score Engine

ESG scores are calculated automatically using a configurable, weighted model:

| Component | Default Weight |
|---|---|
| Environmental Score | 40% |
| Social Score | 30% |
| Governance Score | 30% |

**Calculation flow:**

Environmental Score
        +
   Social Score
        +
 Governance Score
        ↓
 Department ESG Score
        ↓
Organization ESG Score


Weights are fully configurable through the Settings module to reflect an organization's specific priorities.

---

## AI Features

### AI ESG Copilot
A conversational assistant that answers questions such as:
- Why did our ESG score decrease?
- Which department emits the most carbon?
- How can we improve our ESG score?
- Summarize this month's ESG performance.
- What compliance issues are currently overdue?

### AI Executive Report Generator
Generates a complete executive report in one click, including:
- Executive summary
- Environmental, social, and governance analysis
- Recommendations and future goals

### Personal Carbon Footprint Calculator
Employees can calculate their individual carbon footprint based on commute, electricity usage, flights, fuel, and food habits — with monthly scoring, trend tracking, and AI-generated sustainability suggestions.

### Predictive ESG Analytics
Machine learning models (powered by Scikit-Learn) forecast:
- Future ESG scores
- Carbon emission trends
- Governance trend patterns
- CSR participation levels

### Green Ideas Portal
A platform for employees to submit, vote on, and comment on sustainability ideas, with status tracking through the following workflow:

```
Submitted → Under Review → Approved → Implemented
```

---

## Reports

**Available Reports:** Environmental, Social, Governance, ESG Summary, and Custom Report Builder

**Export Formats:** PDF, Excel, CSV

**Filters:** Department, Employee, Date Range, Challenge, Category, Module, Status

---

## Database Design

Core data models include: Department, Employee, Category, EmissionFactor, EnvironmentalGoal, ProductESGProfile, Policy, Badge, Reward, CarbonTransaction, CSRActivity, EmployeeParticipation, Challenge, ChallengeParticipation, PolicyAcknowledgement, Audit, ComplianceIssue, DepartmentScore, Notification, RewardRedemption, and GreenIdea.

---

## REST API

The backend exposes a full REST API supporting standard CRUD operations (GET, POST, PUT, DELETE) with:

- JWT authentication
- Pagination, searching, filtering, and sorting
- Request validation
- Global error handling
- Consistent JSON response structure

---

## Tech Stack

**Frontend**
React · Vite · Tailwind CSS · React Router DOM · Axios · React Hook Form · Recharts · Lucide React

**Backend**
Flask · SQLAlchemy · Flask-JWT · Marshmallow · Flask-CORS

**Database**
SQLite

**AI & Machine Learning**
Google Gemini API · Scikit-Learn

---

## Future Enhancements

- Multi-tenant support
- Email notifications
- Mobile application
- IoT integration
- Carbon credit marketplace
- Blockchain-based ESG verification
- Industry benchmarking

---

## Contributors

Rishab Thapar
Brinda Nanda
Sagar Singh Solanki
Vanshika