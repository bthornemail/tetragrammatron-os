
theorem execution_requires_schema
  (a : AddressSchema) :
  schema_valid a →
  execution_admissible a
