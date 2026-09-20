from datetime import datetime, timedelta
import json
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import User, SellerAccount, MarketplaceAccount, Marketplace
from app.models.catalog import Product, Listing, ListingStatus
from app.models.inventory import InventoryItem
from app.models.orders import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.returns import ReturnRequest, ReturnStatus, ReturnResolution
from app.models.pricing import PricingRule
from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance, CampaignStatus
from app.models.finance import FinanceEntry, FinanceEntryType, Settlement, SettlementStatus
from app.models.notifications import Notification, NotificationCategory
from app.models.automation import AutomationRule
from app.services.auth import hash_password

logger = logging.getLogger("seed_sellerhub")


def seed_sellerhub(db: Session) -> None:
    # 1. Primary User
    user = db.scalar(select(User).where(User.email == "shubham@sellerhub.io"))
    if not user:
        user = User(
            email="shubham@sellerhub.io",
            full_name="Shubham",
            password_hash=hash_password("SellerHub@123"),
            is_active=True,
        )
        db.add(user)
        db.flush()

    # 2. Primary Seller Account
    seller = db.scalar(select(SellerAccount).where(SellerAccount.name == "Shubham Enterprises"))
    if not seller:
        seller = SellerAccount(
            name="Shubham Enterprises",
            user_id=user.id,
            is_active=True,
        )
        db.add(seller)
        db.flush()
    elif seller.user_id != user.id:
        seller.user_id = user.id
        db.flush()

    # 3. Marketplaces
    amazon_account = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.seller_account_id == seller.id,
            MarketplaceAccount.marketplace == Marketplace.AMAZON.value,
        )
    )
    if not amazon_account:
        amazon_account = MarketplaceAccount(
            seller_account_id=seller.id,
            marketplace=Marketplace.AMAZON.value,
            display_name="Amazon India",
            external_account_id="A1B2C3D4E5",
            is_connected=True,
            last_sync_at=datetime.utcnow() - timedelta(minutes=2),
        )
        db.add(amazon_account)
        db.flush()

    flipkart_account = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.seller_account_id == seller.id,
            MarketplaceAccount.marketplace == Marketplace.FLIPKART.value,
        )
    )
    if not flipkart_account:
        flipkart_account = MarketplaceAccount(
            seller_account_id=seller.id,
            marketplace=Marketplace.FLIPKART.value,
            display_name="Flipkart India",
            external_account_id="FS12345678",
            is_connected=True,
            last_sync_at=datetime.utcnow() - timedelta(minutes=5),
        )
        db.add(flipkart_account)
        db.flush()

    # Check products count for this seller
    existing_products = list(db.scalars(select(Product).where(Product.seller_account_id == seller.id)).all())
    if len(existing_products) >= 8:
        # Already seeded
        db.commit()
        return

    # 4. Products
    products_data = [
        {
            "sku": "BOT-100-BLK",
            "title": "Stainless Steel Water Bottle 1L - Matte Black",
            "description": "Double wall vacuum insulated stainless steel water bottle keeps drinks cold for 24h and hot for 12h.",
            "brand": "AquaPure",
            "category": "Home & Kitchen",
            "hsn_code": "7323",
            "gst_rate": 18.0,
            "cost_price": 280.0,
            "mrp": 999.0,
            "price": 499.0,
            "stock": 142,
            "reserved": 12,
            "reorder": 30,
            "image": "bottle-black",
            "asin": "B08N5WRWNW",
        },
        {
            "sku": "TMB-450-COF",
            "title": "Insulated Coffee Tumbler 450ml with Leakproof Lid",
            "description": "Premium thermal travel tumbler for hot coffee and tea with splash-proof lid.",
            "brand": "AquaPure",
            "category": "Home & Kitchen",
            "hsn_code": "7323",
            "gst_rate": 18.0,
            "cost_price": 240.0,
            "mrp": 899.0,
            "price": 549.0,
            "stock": 85,
            "reserved": 8,
            "reorder": 25,
            "image": "tumbler",
            "asin": "B08N5XYZ12",
        },
        {
            "sku": "MUG-350-GRY",
            "title": "Thermal Travel Mug 350ml - Slate Grey",
            "description": "Ergonomic ceramic lined travel mug with non-slip silicone base.",
            "brand": "AquaPure",
            "category": "Home & Kitchen",
            "hsn_code": "7323",
            "gst_rate": 18.0,
            "cost_price": 210.0,
            "mrp": 799.0,
            "price": 399.0,
            "stock": 64,
            "reserved": 5,
            "reorder": 20,
            "image": "mug",
            "asin": "B08N5ABC34",
        },
        {
            "sku": "BOT-750-BLU",
            "title": "Hydration Sports Bottle 750ml - Ocean Blue",
            "description": "BPA-free Tritan sport sipper with fast-flow chug cap and measurement markers.",
            "brand": "AquaPure",
            "category": "Sports & Fitness",
            "hsn_code": "3924",
            "gst_rate": 18.0,
            "cost_price": 190.0,
            "mrp": 699.0,
            "price": 449.0,
            "stock": 110,
            "reserved": 15,
            "reorder": 25,
            "image": "bottle-blue",
            "asin": "B08N5DEF56",
        },
        {
            "sku": "HM-SSB-1000",
            "title": "Stainless Steel Water Bottle 1000ml Elite",
            "description": "Heavy duty 18/8 food-grade stainless steel bottle with sweat-proof powder coating.",
            "brand": "AquaPure",
            "category": "Home & Kitchen",
            "hsn_code": "7323",
            "gst_rate": 18.0,
            "cost_price": 310.0,
            "mrp": 1099.0,
            "price": 599.0,
            "stock": 3,  # Low stock trigger!
            "reserved": 1,
            "reorder": 20,
            "image": "bottle-steel",
            "asin": "B08N5GHI78",
        },
        {
            "sku": "FLK-1200-SLV",
            "title": "Vacuum Thermos Flask 1.2L with Cup Lid",
            "description": "Family sized vacuum insulated thermos flask with dual wall stopper and carrying strap.",
            "brand": "AquaPure",
            "category": "Home & Kitchen",
            "hsn_code": "7323",
            "gst_rate": 18.0,
            "cost_price": 480.0,
            "mrp": 1599.0,
            "price": 899.0,
            "stock": 48,
            "reserved": 4,
            "reorder": 15,
            "image": "flask-silver",
            "asin": "B08N5JKL90",
        },
        {
            "sku": "COP-1000-VED",
            "title": "Pure Copper Ayurveda Water Bottle 1000ml",
            "description": "100% pure hammered copper bottle for Ayurvedic health benefits.",
            "brand": "VedaPure",
            "category": "Health & Personal Care",
            "hsn_code": "7418",
            "gst_rate": 12.0,
            "cost_price": 420.0,
            "mrp": 1399.0,
            "price": 799.0,
            "stock": 32,
            "reserved": 2,
            "reorder": 15,
            "image": "bottle-copper",
            "asin": "B08N5MNO12",
        },
        {
            "sku": "KID-400-PNK",
            "title": "Kids Straw Sipper Bottle 400ml - Pastel Pink",
            "description": "Safe, drop-resistant silicone spout sipper with leak-proof lock and carry loop.",
            "brand": "TinySip",
            "category": "Baby Products",
            "hsn_code": "3924",
            "gst_rate": 18.0,
            "cost_price": 160.0,
            "mrp": 599.0,
            "price": 349.0,
            "stock": 78,
            "reserved": 6,
            "reorder": 20,
            "image": "sipper-pink",
            "asin": "B08N5PQR34",
        },
        {
            "sku": "GLS-600-INF",
            "title": "Borosilicate Glass Tea Infuser Bottle 600ml",
            "description": "Double-walled thermal glass tumbler with removable fine mesh stainless steel fruit/tea strainer.",
            "brand": "PureBrew",
            "category": "Home & Kitchen",
            "hsn_code": "7013",
            "gst_rate": 18.0,
            "cost_price": 340.0,
            "mrp": 1199.0,
            "price": 649.0,
            "stock": 0,  # Out of stock trigger!
            "reserved": 0,
            "reorder": 15,
            "image": "bottle-glass",
            "asin": "B08N5STU56",
        },
        {
            "sku": "SHK-700-AMB",
            "title": "Gym Protein Shaker 700ml with Blender Ball",
            "description": "Pro series fitness shaker with leak-proof flip cap and stainless wire whisk ball.",
            "brand": "AquaPure",
            "category": "Sports & Fitness",
            "hsn_code": "3924",
            "gst_rate": 18.0,
            "cost_price": 140.0,
            "mrp": 499.0,
            "price": 299.0,
            "stock": 195,
            "reserved": 18,
            "reorder": 40,
            "image": "shaker-black",
            "asin": "B08N5VWX78",
        },
    ]

    created_products: list[Product] = []
    for item in products_data:
        p = Product(
            seller_account_id=seller.id,
            sku=item["sku"],
            title=item["title"],
            description=item["description"],
            brand=item["brand"],
            category=item["category"],
            hsn_code=item["hsn_code"],
            gst_rate=item["gst_rate"],
            cost_price=item["cost_price"],
            mrp=item["mrp"],
            attributes_json=json.dumps({"color": "Matte Black", "material": "Stainless Steel"}),
            image_urls_json=json.dumps([f"/assets/{item['image']}.png"]),
            is_active=True,
        )
        db.add(p)
        db.flush()
        created_products.append(p)

        # Inventory Item
        inv = InventoryItem(
            seller_account_id=seller.id,
            product_id=p.id,
            warehouse="Central Mumbai Fulfilment Center",
            quantity=item["stock"],
            reserved_quantity=item["reserved"],
            reorder_level=item["reorder"],
        )
        db.add(inv)

        # Listings on Amazon
        amz_listing = Listing(
            product_id=p.id,
            marketplace_account_id=amazon_account.id,
            sku=item["sku"],
            external_listing_id=item["asin"],
            status=ListingStatus.ACTIVE.value if item["sku"] != "GLS-600-INF" else "suppressed",
            title=item["title"],
            price=item["price"],
            inventory_quantity=item["stock"],
            attributes_json=json.dumps({"asin": item["asin"], "fulfillment": "FBA"}),
            marketplace_data_json=json.dumps({"buy_box_won": item["stock"] > 0}),
            validation_errors_json=json.dumps(["Main image resolution below 1000px"] if item["sku"] == "GLS-600-INF" else []),
        )
        db.add(amz_listing)
        db.flush()

        # Listings on Flipkart
        fk_listing = Listing(
            product_id=p.id,
            marketplace_account_id=flipkart_account.id,
            sku=item["sku"],
            external_listing_id=f"FSN{p.id}82910",
            status=ListingStatus.ACTIVE.value,
            title=item["title"],
            price=item["price"],
            inventory_quantity=item["stock"],
            attributes_json=json.dumps({"fsn": f"FSN{p.id}82910", "fulfillment": "FBF"}),
            marketplace_data_json=json.dumps({"buy_box_won": True}),
        )
        db.add(fk_listing)
        db.flush()

        # Pricing Rule
        prule = PricingRule(
            seller_account_id=seller.id,
            listing_id=amz_listing.id,
            min_price=item["cost_price"] * 1.15,
            max_price=item["mrp"],
            target_margin_percent=35.0,
            enabled=True,
        )
        db.add(prule)

    # 5. Orders & Order Items
    orders_specs = [
        {
            "external_id": "408-7291823-1829102",
            "marketplace": amazon_account.id,
            "status": OrderStatus.DELIVERED.value,
            "customer_name": "Rahul Sharma",
            "customer_email": "rahul.sharma@email.com",
            "customer_phone": "+91 98765 43210",
            "address": "123, Green Park, New Delhi, Delhi - 110016",
            "carrier": "Amazon Shipping",
            "tracking": "AMZ123456789IN",
            "items": [(created_products[0], 1, 499.0), (created_products[9], 1, 299.0)],
            "days_ago": 1,
        },
        {
            "external_id": "OD329102910291",
            "marketplace": flipkart_account.id,
            "status": OrderStatus.DELIVERED.value,
            "customer_name": "Priya Verma",
            "customer_email": "priya.verma@example.com",
            "customer_phone": "+91 98123 45678",
            "address": "404 Sea View Apts, Bandra West, Mumbai, Maharashtra - 400050",
            "carrier": "Ekart Logistics",
            "tracking": "FMPC992817263IN",
            "items": [(created_products[1], 1, 549.0)],
            "days_ago": 1,
        },
        {
            "external_id": "408-9928172-8827162",
            "marketplace": amazon_account.id,
            "status": OrderStatus.SHIPPED.value,
            "customer_name": "Amitabh Sen",
            "customer_email": "amitabh.sen@rediffmail.com",
            "customer_phone": "+91 98300 12345",
            "address": "Flat 5B, Salt Lake Sector 1, Kolkata, West Bengal - 700064",
            "carrier": "Delhivery",
            "tracking": "DEL8827162IN",
            "items": [(created_products[5], 1, 899.0)],
            "days_ago": 2,
        },
        {
            "external_id": "OD882910293847",
            "marketplace": flipkart_account.id,
            "status": OrderStatus.CONFIRMED.value,
            "customer_name": "Deepika Sundaram",
            "customer_email": "deepika.sundaram@gmail.com",
            "customer_phone": "+91 94440 98765",
            "address": "No 18, 4th Main Road, Indira Nagar, Bangalore, Karnataka - 560038",
            "carrier": "Ekart Logistics",
            "tracking": "FMPC8829102IN",
            "items": [(created_products[3], 2, 449.0)],
            "days_ago": 0,
        },
        {
            "external_id": "408-1129384-9928174",
            "marketplace": amazon_account.id,
            "status": OrderStatus.PACKED.value,
            "customer_name": "Vikram Singh",
            "customer_email": "vikram.singh@gmail.com",
            "customer_phone": "+91 97112 88990",
            "address": "B-14 Gomti Nagar Extension, Lucknow, Uttar Pradesh - 226010",
            "carrier": "Amazon Shipping",
            "tracking": "AMZ771829440IN",
            "items": [(created_products[2], 1, 399.0)],
            "days_ago": 0,
        },
        {
            "external_id": "OD119283746528",
            "marketplace": flipkart_account.id,
            "status": OrderStatus.DELIVERED.value,
            "customer_name": "Neha Gupta",
            "customer_email": "neha.gupta@corp.in",
            "customer_phone": "+91 98230 45671",
            "address": "7th Floor, Gera Trinity Towers, Kharadi, Pune, Maharashtra - 411014",
            "carrier": "Ekart Logistics",
            "tracking": "FMPC771092834IN",
            "items": [(created_products[1], 1, 549.0), (created_products[0], 1, 499.0)],
            "days_ago": 3,
        },
        {
            "external_id": "408-5524312-8819203",
            "marketplace": amazon_account.id,
            "status": OrderStatus.RETURNED.value,
            "customer_name": "Karan Mehta",
            "customer_email": "karan.mehta@jaipurcrafts.com",
            "customer_phone": "+91 94140 12345",
            "address": "C-22 Malviya Nagar, Jaipur, Rajasthan - 302017",
            "carrier": "Blue Dart",
            "tracking": "BLU99281726IN",
            "items": [(created_products[6], 1, 799.0)],
            "days_ago": 4,
        },
        {
            "external_id": "408-4491823-1102934",
            "marketplace": amazon_account.id,
            "status": OrderStatus.DELIVERED.value,
            "customer_name": "Aditya Rao",
            "customer_email": "aditya.rao@hydtech.org",
            "customer_phone": "+91 98490 22334",
            "address": "Flat 302, Cyber Heights, Madhapur, Hyderabad, Telangana - 500081",
            "carrier": "Amazon Shipping",
            "tracking": "AMZ554433221IN",
            "items": [(created_products[3], 1, 449.0)],
            "days_ago": 5,
        },
        {
            "external_id": "OD992817263541",
            "marketplace": flipkart_account.id,
            "status": OrderStatus.CANCELLED.value,
            "customer_name": "Meera Joshi",
            "customer_email": "meera.joshi@vidarbha.in",
            "customer_phone": "+91 97650 33445",
            "address": "Ramdaspeth West, Near Central Mall, Nagpur, Maharashtra - 440010",
            "carrier": "Ekart Logistics",
            "tracking": "FMPC443322110IN",
            "items": [(created_products[7], 1, 349.0)],
            "days_ago": 2,
        },
        {
            "external_id": "408-6628192-3391028",
            "marketplace": amazon_account.id,
            "status": OrderStatus.DELIVERED.value,
            "customer_name": "Siddharth Nair",
            "customer_email": "siddharth.nair@cochin.ac.in",
            "customer_phone": "+91 94470 11223",
            "address": "Panampilly Nagar, Kochi, Kerala - 682036",
            "carrier": "Delhivery",
            "tracking": "DEL77281923IN",
            "items": [(created_products[0], 2, 499.0)],
            "days_ago": 6,
        },
    ]

    created_orders: list[Order] = []
    for o_spec in orders_specs:
        total = sum(qty * prc for _, qty, prc in o_spec["items"])
        order_date = datetime.utcnow() - timedelta(days=o_spec["days_ago"], hours=4)
        order = Order(
            seller_account_id=seller.id,
            marketplace_account_id=o_spec["marketplace"],
            external_order_id=o_spec["external_id"],
            status=o_spec["status"],
            payment_status=PaymentStatus.PAID.value if o_spec["status"] != OrderStatus.CANCELLED.value else PaymentStatus.REFUNDED.value,
            customer_name=o_spec["customer_name"],
            customer_email=o_spec["customer_email"],
            customer_phone=o_spec["customer_phone"],
            shipping_address=o_spec["address"],
            currency="INR",
            subtotal=total,
            shipping_fee=0.0,
            tax_amount=round(total * 0.18, 2),
            total_amount=total,
            ordered_at=order_date,
            shipped_at=order_date + timedelta(hours=8) if o_spec["status"] in {OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value} else None,
            delivered_at=order_date + timedelta(days=2) if o_spec["status"] == OrderStatus.DELIVERED.value else None,
            carrier=o_spec["carrier"],
            tracking_number=o_spec["tracking"],
        )
        db.add(order)
        db.flush()
        created_orders.append(order)

        for prod, qty, prc in o_spec["items"]:
            item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                sku=prod.sku,
                title=prod.title,
                quantity=qty,
                unit_price=prc,
                tax_amount=round(prc * qty * 0.18, 2),
                total_amount=prc * qty,
            )
            db.add(item)

        # Create finance sale entry
        if o_spec["status"] != OrderStatus.CANCELLED.value:
            sale_entry = FinanceEntry(
                seller_account_id=seller.id,
                marketplace_account_id=o_spec["marketplace"],
                order_id=order.id,
                entry_type=FinanceEntryType.SALE.value,
                amount=total,
                currency="INR",
                occurred_at=order_date,
                description=f"Marketplace sale for Order #{o_spec['external_id']}",
            )
            db.add(sale_entry)

            fee_entry = FinanceEntry(
                seller_account_id=seller.id,
                marketplace_account_id=o_spec["marketplace"],
                order_id=order.id,
                entry_type=FinanceEntryType.MARKETPLACE_FEE.value,
                amount=round(total * 0.12, 2),
                currency="INR",
                occurred_at=order_date,
                description=f"Referral & closing fee for Order #{o_spec['external_id']}",
            )
            db.add(fee_entry)

    # 6. Returns
    ret_order = created_orders[6]  # Order 7 marked as returned
    ret1 = ReturnRequest(
        seller_account_id=seller.id,
        order_id=ret_order.id,
        external_return_id="RET-AMZ-992817",
        status=ReturnStatus.REQUESTED.value,
        reason="Defective item: water leaking from cap seam",
        customer_note="Leaking from cap seal upon first wash",
        refund_amount=799.0,
        resolution=ReturnResolution.REFUND.value,
        requested_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(ret1)

    # 7. Advertising Campaigns
    ad1 = AdvertisingCampaign(
        seller_account_id=seller.id,
        marketplace_account_id=amazon_account.id,
        external_campaign_id="CAM-AMZ-001",
        name="Sponsored Products - Water Bottles Q4",
        campaign_type="sponsored_products",
        status=CampaignStatus.ENABLED.value,
        daily_budget=1500.0,
    )
    db.add(ad1)
    db.flush()

    ad1_perf = AdvertisingPerformance(
        campaign_id=ad1.id,
        report_date=datetime.utcnow() - timedelta(days=1),
        impressions=28450,
        clicks=1180,
        spend=11682.0,
        sales=64200.0,
        conversions=94,
        orders=94,
        keyword="stainless steel bottle 1 litre",
    )
    db.add(ad1_perf)

    ad2 = AdvertisingCampaign(
        seller_account_id=seller.id,
        marketplace_account_id=flipkart_account.id,
        external_campaign_id="CAM-FK-002",
        name="Flipkart PLA - AquaPure Brand Boost",
        campaign_type="sponsored_products",
        status=CampaignStatus.ENABLED.value,
        daily_budget=1200.0,
    )
    db.add(ad2)
    db.flush()

    ad2_perf = AdvertisingPerformance(
        campaign_id=ad2.id,
        report_date=datetime.utcnow() - timedelta(days=1),
        impressions=19200,
        clicks=740,
        spend=6956.0,
        sales=42800.0,
        conversions=68,
        orders=68,
        keyword="water bottle gym",
    )
    db.add(ad2_perf)

    # 8. Settlement
    settlement = Settlement(
        seller_account_id=seller.id,
        marketplace_account_id=amazon_account.id,
        external_settlement_id="SETT-2024-015",
        period_start=datetime.utcnow() - timedelta(days=14),
        period_end=datetime.utcnow(),
        gross_amount=148500.0,
        fees_amount=17820.0,
        refunds_amount=6330.0,
        net_amount=124350.0,
        status=SettlementStatus.RECONCILED.value,
    )
    db.add(settlement)

    # 9. Notifications
    notifs = [
        ("Low Stock Alert", "SKU HM-SSB-1000 is running low (3 units left in warehouse)", "inventory", "high"),
        ("New Order Received", "Order #408-7291823-1829102 for ₹798 confirmed", "order", "low"),
        ("Listing Suppressed", "Borosilicate Glass Tea Infuser Bottle was suppressed due to image resolution", "listing", "high"),
        ("Settlement Credited", "₹1,24,350 has been settled to your HDFC bank account (UTR: HDFC1234567890)", "finance", "medium"),
        ("Buy Box Won", "AquaPure 1L Matte Black is winning 94% of Buy Box traffic today", "pricing", "low"),
    ]
    for title, msg, cat, prio in notifs:
        notif = Notification(
            seller_account_id=seller.id,
            user_id=user.id,
            category=cat,
            severity=prio,
            title=title,
            message=msg,
            data={},
        )
        db.add(notif)

    # 10. Automations
    rules = [
        ("Auto Repricing: Buy Box Defense", "schedule", "Active", "Dynamic price matcher matches lowest competitor within ₹10 floor"),
        ("Inventory Replenishment Sentinel", "schedule", "Active", "Triggers supplier reorder PO when stock drops below reorder point"),
        ("Returns Auto-Validation", "event", "Active", "Instantly authorizes verified customer returns under ₹1,000 policy threshold"),
        ("Suppression Auto-Healer", "event", "Active", "Detects listing image/title suppression and flags for immediate fix"),
    ]
    for r_name, r_trig, r_stat, r_desc in rules:
        ar = AutomationRule(
            seller_account_id=seller.id,
            name=r_name,
            trigger_type=r_trig,
            trigger_config={"interval_minutes": 15},
            conditions=[{"field": "status", "operator": "eq", "value": "active"}],
            actions=[{"type": "notification", "message": r_desc}],
            enabled=True,
            status=r_stat,
        )
        db.add(ar)

    db.commit()
    logger.info("Successfully seeded SellerHub database for Shubham Enterprises!")
