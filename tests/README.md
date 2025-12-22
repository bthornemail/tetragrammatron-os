# Testing Suite

This directory contains tests for the Tetragrammatron-OS tools and pipeline.

## Structure

- `fixtures/` - Test data files (sample probe.jsonl, expected outputs)
- `unit/` - Unit tests for individual tools
- `integration/` - End-to-end pipeline tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
node tests/unit/test_validate_jsonl.mjs
```

## Test Philosophy

- Tests validate behavior, not implementation
- Use fixtures for deterministic testing
- Test both success and failure cases
- Verify immutability (no source data mutation)
- Check determinism (same input → same output)



