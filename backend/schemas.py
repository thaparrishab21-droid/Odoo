from marshmallow import Schema, fields, validate, ValidationError

# Helper validator for non-empty strings
def validate_non_empty(val):
    if not val or not val.strip():
        raise ValidationError("Field cannot be empty or contain only whitespace.")

class DepartmentSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    description = fields.Str(allow_none=True)

class CategorySchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    description = fields.Str(allow_none=True)

class EmissionFactorSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    factor = fields.Float(required=True, validate=validate.Range(min=0.0001, error="Factor must be greater than zero."))
    unit = fields.Str(required=True, validate=[validate.Length(min=1, max=30), validate_non_empty])
    category_id = fields.Int(required=True)

class EnvironmentalGoalSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    target_value = fields.Float(required=True)
    current_value = fields.Float(load_default=0.0)
    unit = fields.Str(required=True, validate=[validate.Length(min=1, max=30), validate_non_empty])
    start_date = fields.Date(required=True)
    target_date = fields.Date(required=True)
    category_id = fields.Int(required=True)
    department_id = fields.Int(allow_none=True) # Null is corporate-wide

class ProductESGProfileSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    carbon_footprint = fields.Float(required=True, validate=validate.Range(min=0.0, error="Carbon footprint cannot be negative."))
    social_score = fields.Float(required=True, validate=validate.Range(min=0.0, max=10.0, error="Social score must be between 0 and 10."))
    governance_score = fields.Float(required=True, validate=validate.Range(min=0.0, max=10.0, error="Governance score must be between 0 and 10."))
    overall_esg_score = fields.Float(load_default=0.0)

class PolicySchema(Schema):
    title = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    content = fields.Str(required=True, validate=[validate.Length(min=5), validate_non_empty])
    version = fields.Str(load_default="1.0")
    effective_date = fields.Date(required=True)

class BadgeSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    description = fields.Str(allow_none=True)
    icon_name = fields.Str(required=True, validate=[validate.Length(min=1, max=50), validate_non_empty])
    xp_required = fields.Int(required=True, validate=validate.Range(min=0, error="XP required cannot be negative."))
    unlock_rule = fields.Str(allow_none=True)
    status = fields.Str(load_default='Active', validate=validate.OneOf(['Active', 'Inactive']))

class RewardSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    description = fields.Str(allow_none=True)
    points_cost = fields.Int(required=True, validate=validate.Range(min=1, error="Points cost must be at least 1."))
    stock = fields.Int(load_default=100, validate=validate.Range(min=0, error="Stock cannot be negative."))
    xp_required = fields.Int(required=True, validate=validate.Range(min=0, error="XP required cannot be negative."))
    status = fields.Str(load_default='Active', validate=validate.OneOf(['Active', 'Inactive']))

class EmployeeSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    email = fields.Email(required=True, validate=[validate.Length(max=100)])
    password = fields.Str(allow_none=True) # Optional in updates
    role = fields.Str(required=True, validate=validate.OneOf(['Admin', 'Employee']))
    points = fields.Int(load_default=0)
    xp = fields.Int(load_default=0)
    department_id = fields.Int(allow_none=True)
    gender = fields.Str(allow_none=True, validate=validate.OneOf(['Male', 'Female', 'Other']))
    age = fields.Int(allow_none=True, validate=validate.Range(min=18, max=100))
    employment_type = fields.Str(allow_none=True, validate=validate.OneOf(['Full-time', 'Part-time', 'Contract', 'Intern']))
    joining_date = fields.Date(allow_none=True)


class CarbonTransactionSchema(Schema):
    activity_name = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    quantity = fields.Float(required=True, validate=validate.Range(min=0.0001, error="Quantity must be greater than zero."))
    date = fields.Date(required=True)
    department_id = fields.Int(required=True)
    category_id = fields.Int(required=True)
    emission_factor_id = fields.Int(required=True)


class ChallengeSchema(Schema):
    title = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    description = fields.Str(allow_none=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    deadline = fields.Date(required=True)
    status = fields.Str(load_default='Draft', validate=validate.OneOf(['Draft', 'Active', 'Under Review', 'Completed', 'Archived']))
    points_reward = fields.Int(load_default=0)
    xp_reward = fields.Int(load_default=0)
    xp = fields.Int(load_default=0)
    category_id = fields.Int(allow_none=True)
    difficulty = fields.Str(load_default='Medium', validate=validate.OneOf(['Easy', 'Medium', 'Hard']))
    evidence_required = fields.Bool(load_default=False)


class ChallengeParticipationSchema(Schema):
    employee_id = fields.Int(required=True)
    challenge_id = fields.Int(required=True)
    progress = fields.Float(load_default=0.0, validate=validate.Range(min=0.0, max=100.0))
    status = fields.Str(load_default='Joined')
    proof = fields.Str(allow_none=True)
    approval = fields.Str(load_default='Pending', validate=validate.OneOf(['Pending', 'Approved', 'Rejected']))
    xp_awarded = fields.Int(load_default=0)
    completion = fields.Bool(load_default=False)


class PersonalCarbonCalculationSchema(Schema):
    commute_distance = fields.Float(required=True, validate=validate.Range(min=0.0))
    vehicle_type = fields.Str(required=True, validate=[validate.Length(min=1, max=50), validate_non_empty])
    electricity_usage = fields.Float(required=True, validate=validate.Range(min=0.0))
    flight_hours = fields.Float(required=True, validate=validate.Range(min=0.0))
    fuel_consumption = fields.Float(required=True, validate=validate.Range(min=0.0))
    food_preference = fields.Str(required=True, validate=[validate.Length(min=1, max=50), validate_non_empty])
    working_days = fields.Int(required=True, validate=validate.Range(min=1, max=31))


class GreenIdeaSchema(Schema):
    title = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    description = fields.Str(required=True, validate=[validate.Length(min=5), validate_non_empty])
    category = fields.Str(required=True, validate=[validate.Length(min=1, max=50), validate_non_empty])
    department = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])


class IdeaCommentSchema(Schema):
    content = fields.Str(required=True, validate=[validate.Length(min=1), validate_non_empty])


class SystemSettingSchema(Schema):
    environmental_weight = fields.Int(required=True, validate=validate.Range(min=0, max=100))
    social_weight = fields.Int(required=True, validate=validate.Range(min=0, max=100))
    governance_weight = fields.Int(required=True, validate=validate.Range(min=0, max=100))
    evidence_required = fields.Bool(load_default=True)
    auto_carbon = fields.Bool(load_default=True)
    auto_badge = fields.Bool(load_default=True)


