def test_coverage_pct_calculation():
    intended_weight = 100.0
    missing_cell_rate = 15.0 # 15% missing
    covered_weight = intended_weight * (1.0 - (missing_cell_rate / 100.0))
    coverage_pct = (covered_weight / intended_weight) * 100.0

    assert coverage_pct == 85.0
