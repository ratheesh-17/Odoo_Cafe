import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.payment_method import PaymentMethod, PaymentType
from app.models.self_order_config import SelfOrderConfig
from app.models.user import User, UserRole
from app.models.floor import Floor
from app.models.table import Table
from app.models.category import Category
from app.models.product import Product, UnitOfMeasure
from app.models.customer import Customer
from app.models.coupon import Coupon
from app.models.promotion import Promotion, PromotionAppliesTo
from app.models.session import PosSession, SessionStatus
from app.models.order import Order, OrderStatus, OrderSource
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.kitchen_ticket import KitchenTicket, KitchenStage
from app.models.kitchen_ticket_item import KitchenTicketItem
from app.models.enums import DiscountType
from app.utils.password_hash import hash_password


# Free placeholder image URLs (example service) — using a format that cycles through categories
def get_product_image_url(product_name: str, idx: int) -> str:
    """Generate a product image URL using a free placeholder service."""
    keywords = {
        "drinks": ["coffee", "tea", "juice", "smoothie", "cocktail"],
        "food": ["pizza", "burger", "pasta", "salad", "sandwich"],
        "desserts": ["cake", "ice-cream", "donut", "cheesecake", "brownie"],
        "specials": ["appetizer", "grilled", "steak", "seafood", "chicken"],
    }
    # Use a free placeholder service like lorempicsum.com or picsum.photos
    return f"https://picsum.photos/seed/{product_name.replace(' ', '-')}-{idx}/400/300?random"


def run_seed():
    db: Session = SessionLocal()
    try:
        print("🌱 Seeding demo data...")
        _seed_payment_methods(db)
        _seed_users(db)
        _seed_floors_and_tables(db)
        _seed_categories(db)
        _seed_products(db)
        _seed_customers(db)
        _seed_coupons_and_promotions(db)
        _seed_self_order_config(db)
        _seed_demo_session_and_orders(db)
        print("✅ Seeding complete!")
        print("\n" + "="*60)
        print("🎭 DEMO CREDENTIALS")
        print("="*60)
        print("Admin:\n  Email: admin@odoocafe.com\n  Password: Admin@123")
        print("\nEmployee:\n  Email: alice@cafe.com\n  Password: Employee@123")
        print("="*60 + "\n")
    finally:
        db.close()


def _seed_payment_methods(db: Session):
    for payment_type in PaymentType:
        exists = db.query(PaymentMethod).filter_by(type=payment_type).first()
        if not exists:
            db.add(PaymentMethod(type=payment_type, is_enabled=True))
    db.commit()
    print("✓ Payment methods seeded")


def _seed_users(db: Session):
    # Admin
    if not db.query(User).filter_by(email="admin@odoocafe.com").first():
        db.add(User(
            name="Admin User",
            email="admin@odoocafe.com",
            password_hash=hash_password("Admin@123"),
            role=UserRole.admin,
            is_active=True,
        ))
    
    # Employee
    if not db.query(User).filter_by(email="alice@cafe.com").first():
        db.add(User(
            name="Alice",
            email="alice@cafe.com",
            password_hash=hash_password("Employee@123"),
            role=UserRole.employee,
            is_active=True,
        ))
    
    db.commit()
    print("✓ Users seeded (admin, employee)")


def _seed_floors_and_tables(db: Session):
    floors_data = ["Ground Floor", "First Floor"]
    for floor_name in floors_data:
        if not db.query(Floor).filter_by(name=floor_name).first():
            floor = Floor(name=floor_name)
            db.add(floor)
            db.flush()
            
            # Add 6 tables per floor
            for table_num in range(1, 7):
                token = secrets.token_urlsafe(32)
                db.add(Table(
                    floor_id=floor.id,
                    table_number=f"{floor_name[0]}{table_num}",  # e.g., G1, G2, F1, F2
                    seats=4,
                    is_active=True,
                    self_order_token=token,
                ))
    db.commit()
    print("✓ Floors and tables seeded (2 floors, 6 tables each)")


def _seed_categories(db: Session):
    categories_data = [
        {"name": "Drinks", "color": "#fbbf24"},
        {"name": "Food", "color": "#f87171"},
        {"name": "Desserts", "color": "#c084fc"},
        {"name": "Specials", "color": "#34d399"},
    ]
    for cat_data in categories_data:
        if not db.query(Category).filter_by(name=cat_data["name"]).first():
            db.add(Category(name=cat_data["name"], color=cat_data["color"]))
    db.commit()
    print("✓ Categories seeded (4 categories)")


def _seed_products(db: Session):
    products_data = [
        # Drinks
        {"name": "Espresso", "cat": "Drinks", "price": 80, "desc": "Strong Italian espresso", "kds": False,
         "img": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop"},
        {"name": "Cappuccino", "cat": "Drinks", "price": 120, "desc": "Creamy coffee with milk foam", "kds": False,
         "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop"},
        {"name": "Latte", "cat": "Drinks", "price": 130, "desc": "Smooth coffee and steamed milk", "kds": False,
         "img": "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&h=300&fit=crop"},
        {"name": "Iced Coffee", "cat": "Drinks", "price": 150, "desc": "Chilled espresso with ice", "kds": False,
         "img": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=300&fit=crop"},
        {"name": "Fresh Orange Juice", "cat": "Drinks", "price": 100, "desc": "Freshly squeezed orange juice", "kds": False,
         "img": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop"},
        # Food
        {"name": "Classic Burger", "cat": "Food", "price": 250, "desc": "Juicy beef patty with fresh toppings", "kds": True,
         "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop"},
        {"name": "Caesar Salad", "cat": "Food", "price": 180, "desc": "Crisp romaine with parmesan and croutons", "kds": True,
         "img": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"},
        {"name": "Margherita Pizza", "cat": "Food", "price": 280, "desc": "Fresh mozzarella, basil, and tomato", "kds": True,
         "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop"},
        {"name": "Grilled Chicken Sandwich", "cat": "Food", "price": 220, "desc": "Tender grilled chicken with mayo", "kds": True,
         "img": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop"},
        {"name": "Pasta Carbonara", "cat": "Food", "price": 300, "desc": "Creamy pasta with bacon and egg", "kds": True,
         "img": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop"},
        # Desserts
        {"name": "Chocolate Cake", "cat": "Desserts", "price": 150, "desc": "Rich and moist chocolate layer cake", "kds": False,
         "img": "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=300&fit=crop"},
        {"name": "Cheesecake", "cat": "Desserts", "price": 160, "desc": "Creamy New York style cheesecake", "kds": False,
         "img": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop"},
        {"name": "Ice Cream", "cat": "Desserts", "price": 120, "desc": "Vanilla, chocolate, or strawberry", "kds": False,
         "img": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop"},
        {"name": "Brownie", "cat": "Desserts", "price": 100, "desc": "Fudgy chocolate brownie", "kds": False,
         "img": "https://images.unsplash.com/photo-1607198179219-5cabf6e60249?w=400&h=300&fit=crop"},
        # Specials
        {"name": "Grilled Salmon", "cat": "Specials", "price": 450, "desc": "Fresh salmon fillet with lemon butter", "kds": True,
         "img": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop"},
        {"name": "Ribeye Steak", "cat": "Specials", "price": 520, "desc": "Premium cut grilled to perfection", "kds": True,
         "img": "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop"},
        {"name": "Tandoori Chicken", "cat": "Specials", "price": 350, "desc": "Marinated and roasted chicken", "kds": True,
         "img": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop"},
    ]

    for prod_data in products_data:
        if not db.query(Product).filter_by(name=prod_data["name"]).first():
            cat = db.query(Category).filter_by(name=prod_data["cat"]).first()
            if cat:
                db.add(Product(
                    name=prod_data["name"],
                    category_id=cat.id,
                    price=prod_data["price"],
                    description=prod_data["desc"],
                    image_url=prod_data["img"],
                    show_in_kds=prod_data["kds"],
                    is_active=True,
                    unit_of_measure=UnitOfMeasure.piece,
                    tax_percent=5.0,
                ))
    db.commit()
    print("✓ Products seeded (17 products with images)")


def _seed_customers(db: Session):
    customers_data = [
        {"name": "John Smith", "email": "john@example.com", "phone": "+91 9876543210"},
        {"name": "Sarah Johnson", "email": "sarah@example.com", "phone": "+91 9876543211"},
        {"name": "Michael Chen", "email": "michael@example.com", "phone": "+91 9876543212"},
    ]
    for cust_data in customers_data:
        if not db.query(Customer).filter_by(email=cust_data["email"]).first():
            db.add(Customer(**cust_data))
    db.commit()
    print("✓ Customers seeded (3 demo customers)")


def _seed_coupons_and_promotions(db: Session):
    # Coupons
    coupons_data = [
        {"code": "SAVE10", "discount_value": 10.0},
        {"code": "DEMO5", "discount_value": 5.0},
    ]
    for coup_data in coupons_data:
        if not db.query(Coupon).filter_by(code=coup_data["code"]).first():
            db.add(Coupon(
                code=coup_data["code"],
                discount_type=DiscountType.percent,
                discount_value=coup_data["discount_value"],
                is_active=True,
            ))
    
    # Promotions (apply to specific products)
    drinks_cat = db.query(Category).filter_by(name="Drinks").first()
    if drinks_cat and not db.query(Promotion).filter_by(name="Happy Hour").first():
        drinks_products = db.query(Product).filter_by(category_id=drinks_cat.id).limit(2).all()
        for prod in drinks_products:
            db.add(Promotion(
                name="Happy Hour",
                applies_to=PromotionAppliesTo.product,
                discount_type=DiscountType.percent,
                discount_value=15.0,
                product_id=prod.id,
                is_active=True,
            ))
    
    db.commit()
    print("✓ Coupons and promotions seeded")


def _seed_self_order_config(db: Session):
    exists = db.query(SelfOrderConfig).first()
    if not exists:
        db.add(SelfOrderConfig(
            is_enabled=True,
            mode="online_ordering",
            background_color="#fff7f2",
            background_image="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=800&fit=crop",
        ))
    db.commit()
    print("✓ Self-order config seeded (enabled, online_ordering mode)")


def _seed_demo_session_and_orders(db: Session):
    # Create an active POS session
    employee = db.query(User).filter_by(email="alice@cafe.com").first()
    if employee and not db.query(PosSession).filter_by(status=SessionStatus.open).first():
        session = PosSession(
            opened_by=employee.id,
            status=SessionStatus.open,
            opening_cash=1000.0,
        )
        db.add(session)
        db.flush()
        
        # Get some products and tables for demo orders
        products = db.query(Product).limit(5).all()
        tables = db.query(Table).limit(3).all()
        customers = db.query(Customer).all()
        
        if products and tables:
            order_count = 0
            
            # Draft order (for table 1)
            if tables:
                order = Order(
                    order_number=f"ORD-{secrets.token_hex(3).upper()}",
                    session_id=session.id,
                    table_id=tables[0].id,
                    employee_id=employee.id,
                    status=OrderStatus.draft,
                    order_source=OrderSource.pos,
                )
                db.add(order)
                db.flush()
                # Add items
                if len(products) >= 2:
                    db.add(OrderItem(order_id=order.id, product_id=products[0].id, quantity=1, unit_price=products[0].price))
                    db.add(OrderItem(order_id=order.id, product_id=products[1].id, quantity=2, unit_price=products[1].price))
                db.flush()
                order_count += 1
            
            # Sent-to-kitchen order (for table 2)
            if len(tables) > 1 and len(products) >= 2:
                order2 = Order(
                    order_number=f"ORD-{secrets.token_hex(3).upper()}",
                    session_id=session.id,
                    table_id=tables[1].id,
                    employee_id=employee.id,
                    status=OrderStatus.sent_to_kitchen,
                    order_source=OrderSource.pos,
                    subtotal=products[2].price,
                    tax_amount=products[2].price * 0.05,
                    total_amount=products[2].price * 1.05,
                )
                db.add(order2)
                db.flush()
                order_item = OrderItem(order_id=order2.id, product_id=products[2].id, quantity=1, unit_price=products[2].price)
                db.add(order_item)
                db.flush()
                
                # Create kitchen ticket
                kt = KitchenTicket(order_id=order2.id, stage=KitchenStage.to_cook)
                db.add(kt)
                db.flush()
                db.add(KitchenTicketItem(kitchen_ticket_id=kt.id, order_item_id=order_item.id, is_done=False))
                order_count += 1
            
            # Paid order (takeaway)
            if len(products) >= 1 and customers:
                order3 = Order(
                    order_number=f"ORD-{secrets.token_hex(3).upper()}",
                    session_id=session.id,
                    customer_id=customers[0].id,
                    employee_id=employee.id,
                    status=OrderStatus.paid,
                    order_source=OrderSource.pos,
                    subtotal=products[3].price,
                    tax_amount=products[3].price * 0.05,
                    total_amount=products[3].price * 1.05,
                )
                db.add(order3)
                db.flush()
                db.add(OrderItem(order_id=order3.id, product_id=products[3].id, quantity=1, unit_price=products[3].price))
                db.flush()
                
                # Create payment
                payment = db.query(PaymentMethod).filter_by(type="cash").first()
                if payment:
                    db.add(Payment(
                        order_id=order3.id,
                        payment_method_id=payment.id,
                        amount_paid=order3.total_amount + 100,
                        transaction_ref=None,
                        change_due=100,
                    ))
                order_count += 1
        
        db.commit()
        print(f"✓ Demo session and {order_count} orders seeded")
