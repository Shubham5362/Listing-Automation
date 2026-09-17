from app.api.growth_opportunities import router


def test_growth_opportunity_route_registered():
    paths = {route.path for route in router.routes}
    assert "/analytics/growth-opportunities" in paths
