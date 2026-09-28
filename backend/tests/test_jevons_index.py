import numpy as np

def test_jevons_index_formula():
    # Jevons index is geometric mean of price relatives: I(t) = I(t-1) * exp( mean( ln( p_t / p_{t-1} ) ) )
    prev_fares = [4000.0, 5000.0, 6000.0]
    curr_fares = [4200.0, 5100.0, 6300.0]

    relatives = [c / p for c, p in zip(curr_fares, prev_fares)]
    geom_relative = np.exp(np.mean(np.log(relatives)))

    prev_index = 100.0
    curr_index = prev_index * geom_relative

    assert round(curr_index, 2) == 103.99
