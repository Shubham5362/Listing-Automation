from app.models.catalog import Product
from app.services.product_knowledge import build_product_knowledge, merge_knowledge_candidates


def test_product_knowledge_versions_and_safe_merge(db_session):
    product = Product(
        seller_account_id=1, sku="SKU-1", title="Cotton Shirt", description="Everyday cotton shirt",
        brand="Acme", category="Shirts", hsn_code="6205", gst_rate=5, mrp=799,
        attributes_json='{"Colour":"Black","Fabric Type":"Cotton","Size":"M"}', image_urls_json='[]',
    )
    db_session.add(product)
    db_session.flush()

    row = build_product_knowledge(db_session, product)
    assert row.schema_version == 1
    assert row.completeness_score >= 70
    assert row.status == "ready"

    row, conflicts = merge_knowledge_candidates(db_session, product, {"colour": "Blue", "pattern": "Solid"})
    assert len(conflicts) == 1
    assert row.schema_version == 2
    assert row.status == "conflict"
    assert '"value":"Black"' in row.facts_json
    assert '"value":"Solid"' in row.facts_json
