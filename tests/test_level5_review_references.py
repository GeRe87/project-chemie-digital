"""Independent numerical regressions requested in review section E (2026-11-02).

Only the Python standard library is used; no R/SciPy probability functions.
These reference checks complement RDF/content checks, not replace them.
"""
import math
import statistics
import unittest


def integrate(function, upper, steps=4000):
    step = upper / steps
    return step / 3 * (function(0) + function(upper) + sum(
        (4 if i % 2 else 2) * function(i * step) for i in range(1, steps)))


def beta_cdf(x, a, b):
    # t=sin(theta)^2 removes the beta endpoint singularity used for t/F.
    constant = 2 * math.exp(math.lgamma(a+b)-math.lgamma(a)-math.lgamma(b))
    return integrate(lambda angle: constant * math.sin(angle)**(2*a-1)
                     * math.cos(angle)**(2*b-1), math.asin(math.sqrt(x)))


class ReviewNumericalReferences(unittest.TestCase):
    def test_normal_density_probability_and_inverse_threshold(self):
        normal = statistics.NormalDist()
        self.assertAlmostEqual(.05399096651318806, normal.pdf(2), places=12)
        self.assertAlmostEqual(.9772498680518208, normal.cdf(2), places=12)
        self.assertAlmostEqual(.0227501319481792, 1-normal.cdf(2), places=12)
        self.assertAlmostEqual(10.232634787404084, 10+.1*normal.inv_cdf(.99), places=10)

    def test_lognormal_centers_tail_and_quantile(self):
        normal = statistics.NormalDist()
        self.assertAlmostEqual(10.46027859908717, 10*math.exp(.3**2/2), places=10)
        self.assertAlmostEqual(.08826, 1-normal.cdf(math.log(15/10)/.3), places=5)
        self.assertAlmostEqual(16.38, 10*math.exp(.3*normal.inv_cdf(.95)), places=2)

    def test_chi_square_five_survival_at_twelve(self):
        # Upper regularized gamma recurrence from shape 1/2 to shape 5/2.
        q = math.erfc(math.sqrt(6))
        for shape in (.5, 1.5):
            q += math.exp(shape*math.log(6)-6-math.lgamma(shape+1))
        self.assertAlmostEqual(12, 5*.024/.1**2)
        self.assertAlmostEqual(.03478778050624185, q, places=11)

    def test_student_two_sided_probability_and_mean_interval(self):
        t = (.1)/(.1/math.sqrt(6))
        self.assertAlmostEqual(math.sqrt(6), t)
        self.assertAlmostEqual(.057972773557539936, beta_cdf(5/(5+t*t), 2.5, .5), places=10)
        margin = 2.570581835636312*.1/math.sqrt(6)
        self.assertAlmostEqual(9.995056436010401, 10.1-margin, places=10)
        self.assertAlmostEqual(10.204943563989598, 10.1+margin, places=10)

    def test_prespecified_f_ratio_two_tails_and_ordered_df(self):
        ratio = .3**2/.1**2
        self.assertAlmostEqual(9, ratio)
        self.assertAlmostEqual(.030749440885082358, 2*beta_cdf(1/(1+ratio), 2.5, 2.5), places=10)
        critical = 7.146381828732819
        self.assertAlmostEqual(.025, beta_cdf(1/(1+critical), 2.5, 2.5), places=10)
        self.assertAlmostEqual(.13993095022986146, 1/critical, places=10)
        # Squared t has numerator df 1, denominator df 5, not the devices' 5/5.
        f_upper = beta_cdf(5/(5+6), 2.5, .5)
        self.assertAlmostEqual(.05797277355754, f_upper, places=10)

    def test_pearson_contributions_and_four_df_tail(self):
        statistic = sum((3.6, 3.2, .4, .8, 3.6))
        self.assertAlmostEqual(11.6, statistic)
        # Chi-square-four survival has this elementary closed form.
        self.assertAlmostEqual(.02058737226855555,
                               math.exp(-statistic/2)*(1+statistic/2), places=10)

    def test_monte_carlo_nominal_and_named_seed_fallback(self):
        self.assertAlmostEqual(20, (.200-.010)*100/(.095*10))
        state = 20261101
        uniform = []
        for _ in range(30000):
            state = 16807*state % 2147483647
            uniform.append(state/2147483647)
        normal = statistics.NormalDist()
        result = []
        for i in range(0, len(uniform), 3):
            absorbance = .200+.003*normal.inv_cdf(uniform[i])
            pipette = 9.98+.04*uniform[i+1]
            flask = 99.92+.16*uniform[i+2]
            result.append((absorbance-.010)*flask/(.095*pipette))
        self.assertEqual(19.999, round(statistics.mean(result), 3))
        self.assertEqual(.317, round(statistics.stdev(result), 3))


if __name__ == '__main__':
    unittest.main()
