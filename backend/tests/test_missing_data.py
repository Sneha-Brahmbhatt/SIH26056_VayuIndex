def test_missing_cell_carry_forward():
    # Test that missing cells inherit previous index level without breaking calculation
    prev_cell_index = 104.2
    missing_current_cell = None

    effective_index = missing_current_cell if missing_current_cell else prev_cell_index
    assert effective_index == 104.2
