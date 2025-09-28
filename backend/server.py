from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, \
    CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer(auto_error=False)
SECRET_KEY = os.environ.get("JWT_SECRET", "bookstore-secret-key-2025")
ALGORITHM = "HS256"

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "bookstore2025"

# Create the main app
app = FastAPI(title="Online Bookstore API")
api_router = APIRouter(prefix="/api")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    is_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Book(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    price: float
    description: str
    cover_image_url: str
    stock_quantity: int = 100
    category: str = "General"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookCreate(BaseModel):
    title: str
    author: str
    price: float
    description: str
    cover_image_url: str
    stock_quantity: int = 100
    category: str = "General"


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None


class CartItem(BaseModel):
    book_id: str
    quantity: int


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    status: str = "pending"
    stripe_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    items: List[CartItem]


class OrderStatusUpdate(BaseModel):
    status: str


class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    order_id: str
    user_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CheckoutRequest(BaseModel):
    order_id: str


# JWT Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        is_admin = payload.get("is_admin", False)
        return {"user_id": user_id, "is_admin": is_admin}
    except jwt.PyJWTError:
        return None


def get_current_user(token_data=Depends(verify_token)):
    if not token_data or not token_data.get("user_id"):
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return token_data


def get_admin_user(token_data=Depends(verify_token)):
    if not token_data or not token_data.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_data


# Password utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# Sample books data
SAMPLE_BOOKS = [
    {
        "title": "The Psychology of Money",
        "author": "Morgan Housel",
        "price": 14.99,
        "description": "Timeless lessons on wealth, greed, and happiness from one of the most important financial books of our time.",
        "cover_image_url": "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXJzfGVufDB8fHx8MTc1NjM2MTkzNHww&ixlib=rb-4.1.0&q=85",
        "stock_quantity": 50,
        "category": "Business & Finance"
    },
    {
        "title": "Milk and Honey",
        "author": "Rupi Kaur",
        "price": 12.95,
        "description": "A collection of poetry and prose about survival, femininity, love, loss, and trauma.",
        "cover_image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxib29rJTIwY292ZXJzfGVufDB8fHx8MTc1NjM2MTkzNHww&ixlib=rb-4.1.0&q=85",
        "stock_quantity": 75,
        "category": "Poetry"
    },
    {
        "title": "The Subtle Art of Not Giving a F*ck",
        "author": "Mark Manson",
        "price": 13.99,
        "description": "A counterintuitive approach to living a good life that cuts through the crap to show you how to live more freely.",
        "cover_image_url": "https://images.unsplash.com/photo-1621827979802-6d778e161b28?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxib29rJTIwY292ZXJzfGVufDB8fHx8MTc1NjM2MTkzNHww&ixlib=rb-4.1.0&q=85",
        "stock_quantity": 60,
        "category": "Self Help"
    }
]


# Authentication endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    user = User(email=user_data.email, password_hash=hashed_password,
                is_verified=True)  # Skip email verification for MVP
    await db.users.insert_one(user.dict())

    # Create JWT token
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["id"]}


@api_router.post("/auth/admin/login")
async def admin_login(admin_data: AdminLogin):
    if admin_data.username != ADMIN_USERNAME or admin_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Create admin JWT token
    access_token = create_access_token(data={"sub": "admin", "is_admin": True})
    return {"access_token": access_token, "token_type": "bearer", "is_admin": True}


# Book endpoints
@api_router.get("/books", response_model=List[Book])
async def get_books():
    books = await db.books.find().to_list(length=None)
    return [Book(**book) for book in books]


@api_router.get("/books/{book_id}", response_model=Book)
async def get_book(book_id: str):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return Book(**book)


@api_router.post("/admin/books", response_model=Book)
async def create_book(book_data: BookCreate, admin=Depends(get_admin_user)):
    book = Book(**book_data.dict())
    await db.books.insert_one(book.dict())
    return book


@api_router.put("/admin/books/{book_id}", response_model=Book)
async def update_book(book_id: str, book_data: BookUpdate, admin=Depends(get_admin_user)):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = {k: v for k, v in book_data.dict().items() if v is not None}
    await db.books.update_one({"id": book_id}, {"$set": update_data})

    updated_book = await db.books.find_one({"id": book_id})
    return Book(**updated_book)


@api_router.delete("/admin/books/{book_id}")
async def delete_book(book_id: str, admin=Depends(get_admin_user)):
    result = await db.books.delete_one({"id": book_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book deleted successfully"}


# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user=Depends(get_current_user)):
    # Validate books and calculate total
    total_amount = 0.0
    order_items = []

    for item in order_data.items:
        book = await db.books.find_one({"id": item.book_id})
        if not book:
            raise HTTPException(status_code=404, detail=f"Book {item.book_id} not found")

        if book["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {book['title']}")

        item_total = book["price"] * item.quantity
        total_amount += item_total

        order_items.append({
            "book_id": book["id"],
            "title": book["title"],
            "author": book["author"],
            "price": book["price"],
            "quantity": item.quantity,
            "total": item_total
        })

    # Create order
    order = Order(
        user_id=current_user["user_id"],
        items=order_items,
        total_amount=total_amount
    )
    await db.orders.insert_one(order.dict())
    return order


@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user["user_id"]}).to_list(length=None)
    return [Order(**order) for order in orders]


@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin=Depends(get_admin_user)):
    orders = await db.orders.find().to_list(length=None)
    return [Order(**order) for order in orders]


@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: OrderStatusUpdate, admin=Depends(get_admin_user)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_data.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}


# Stripe payment endpoints
@api_router.post("/payments/checkout")
async def create_checkout_session(checkout_data: CheckoutRequest, request: Request,
                                  current_user=Depends(get_current_user)):
    # Get order
    order = await db.orders.find_one({"id": checkout_data.order_id, "user_id": current_user["user_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Initialize Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe configuration missing")

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    # Get frontend origin from request headers
    origin = request.headers.get("origin") or str(request.base_url).rstrip('/')
    success_url = f"{origin}?session_id={{CHECKOUT_SESSION_ID}}&status=success"
    cancel_url = f"{origin}?status=cancelled"

    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=order["total_amount"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order["id"],
            "user_id": current_user["user_id"]
        }
    )

    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)

        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            order_id=order["id"],
            user_id=current_user["user_id"],
            amount=order["total_amount"],
            currency="usd",
            payment_status="pending",
            metadata=checkout_request.metadata
        )
        await db.payment_transactions.insert_one(transaction.dict())

        # Update order with session ID
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc)}}
        )

        return {"checkout_url": session.url, "session_id": session.session_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    # Get payment transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    # Get Stripe status
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")

    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)

        # Update transaction status if changed
        if checkout_status.payment_status != transaction["payment_status"]:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": checkout_status.payment_status,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )

            # Update order status if payment is complete
            if checkout_status.payment_status == "paid":
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {
                        "status": "paid",
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )

                # Update book stock
                order = await db.orders.find_one({"id": transaction["order_id"]})
                if order:
                    for item in order["items"]:
                        await db.books.update_one(
                            {"id": item["book_id"]},
                            {"$inc": {"stock_quantity": -item["quantity"]}}
                        )

        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get payment status: {str(e)}")


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")

        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")

        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        # Process webhook event
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id

            # Update payment transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )

            # Update order status
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {
                        "status": "completed",
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")


# Initialize sample data
@api_router.post("/admin/init-sample-data")
async def initialize_sample_data(admin=Depends(get_admin_user)):
    # Check if books already exist
    existing_books = await db.books.count_documents({})
    if existing_books > 0:
        return {"message": "Sample data already exists"}

    # Insert sample books
    for book_data in SAMPLE_BOOKS:
        book = Book(**book_data)
        await db.books.insert_one(book.dict())

    return {"message": f"Initialized {len(SAMPLE_BOOKS)} sample books"}


# Health check
@api_router.get("/")
async def root():
    return {"message": "Online Bookstore API", "status": "running"}


# Include router
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()