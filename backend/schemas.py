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

class RewardSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    description = fields.Str(allow_none=True)
    points_cost = fields.Int(required=True, validate=validate.Range(min=1, error="Points cost must be at least 1."))
    stock = fields.Int(load_default=100, validate=validate.Range(min=0, error="Stock cannot be negative."))

class EmployeeSchema(Schema):
    name = fields.Str(required=True, validate=[validate.Length(min=1, max=100), validate_non_empty])
    email = fields.Email(required=True, validate=[validate.Length(max=100)])
    password = fields.Str(allow_none=True) # Optional in updates
    role = fields.Str(required=True, validate=validate.OneOf(['Admin', 'Employee']))
    points = fields.Int(load_default=0)
    xp = fields.Int(load_default=0)
    department_id = fields.Int(allow_none=True)


class CarbonTransactionSchema(Schema):
    activity_name = fields.Str(required=True, validate=[validate.Length(min=1, max=150), validate_non_empty])
    quantity = fields.Float(required=True, validate=validate.Range(min=0.0001, error="Quantity must be greater than zero."))
    date = fields.Date(required=True)
    department_id = fields.Int(required=True)
    category_id = fields.Int(required=True)
    emission_factor_id = fields.Int(required=True)

