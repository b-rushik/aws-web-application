import requests
import sys
import json
from datetime import datetime


class BookstoreAPITester:
    def __init__(self, base_url="https://literary-hub-13.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_book_id = None
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}

        # Add authorization if needed
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif not use_admin and self.user_token:
            test_headers['Authorization'] = f'Bearer {self.user_token}'

        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "/", 200)

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data={"email": test_email, "password": "test123"}
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            self.user_id = response['user_id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "test@example.com", "password": "test123"}
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            self.user_id = response['user_id']
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/admin/login",
            200,
            data={"username": "admin", "password": "bookstore2025"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained")
            return True
        return False

    def test_initialize_sample_data(self):
        """Test sample data initialization"""
        return self.run_test(
            "Initialize Sample Data",
            "POST",
            "/admin/init-sample-data",
            200,
            use_admin=True
        )

    def test_get_books(self):
        """Test getting all books"""
        success, response = self.run_test(
            "Get All Books",
            "GET",
            "/books",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} books")
            return True
        return False

    def test_create_book(self):
        """Test creating a new book (admin only)"""
        book_data = {
            "title": "Test Book API",
            "author": "Test Author",
            "price": 19.99,
            "description": "A test book created via API",
            "cover_image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxib29rJTIwY292ZXJzfGVufDB8fHx8MTc1NjM2MTkzNHww&ixlib=rb-4.1.0&q=85",
            "stock_quantity": 25,
            "category": "Test Category"
        }
        success, response = self.run_test(
            "Create New Book",
            "POST",
            "/admin/books",
            200,
            data=book_data,
            use_admin=True
        )
        if success and 'id' in response:
            self.created_book_id = response['id']
            print(f"   Created book ID: {self.created_book_id}")
            return True
        return False

    def test_get_single_book(self):
        """Test getting a single book by ID"""
        if not self.created_book_id:
            print("❌ No book ID available for testing")
            return False

        return self.run_test(
            "Get Single Book",
            "GET",
            f"/books/{self.created_book_id}",
            200
        )

    def test_update_book(self):
        """Test updating a book (admin only)"""
        if not self.created_book_id:
            print("❌ No book ID available for testing")
            return False

        update_data = {
            "price": 24.99,
            "stock_quantity": 30
        }
        return self.run_test(
            "Update Book",
            "PUT",
            f"/admin/books/{self.created_book_id}",
            200,
            data=update_data,
            use_admin=True
        )

    def test_create_order(self):
        """Test creating an order"""
        if not self.created_book_id:
            print("❌ No book ID available for testing")
            return False

        order_data = {
            "items": [
                {"book_id": self.created_book_id, "quantity": 2}
            ]
        }
        success, response = self.run_test(
            "Create Order",
            "POST",
            "/orders",
            200,
            data=order_data
        )
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Created order ID: {self.created_order_id}")
            return True
        return False

    def test_get_user_orders(self):
        """Test getting user orders"""
        return self.run_test(
            "Get User Orders",
            "GET",
            "/orders",
            200
        )

    def test_get_admin_orders(self):
        """Test getting all orders (admin only)"""
        return self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "/admin/orders",
            200,
            use_admin=True
        )

    def test_update_order_status(self):
        """Test updating order status (admin only)"""
        if not self.created_order_id:
            print("❌ No order ID available for testing")
            return False

        return self.run_test(
            "Update Order Status",
            "PUT",
            f"/admin/orders/{self.created_order_id}/status",
            200,
            data={"status": "completed"},
            use_admin=True
        )

    def test_create_checkout_session(self):
        """Test creating Stripe checkout session"""
        if not self.created_order_id:
            print("❌ No order ID available for testing")
            return False

        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "/payments/checkout",
            200,
            data={"order_id": self.created_order_id},
            headers={"Origin": "https://literary-hub-13.preview.emergentagent.com"}
        )
        if success and 'checkout_url' in response:
            print(f"   Checkout URL: {response['checkout_url'][:50]}...")
            return True
        return False

    def test_delete_book(self):
        """Test deleting a book (admin only) - should be last test"""
        if not self.created_book_id:
            print("❌ No book ID available for testing")
            return False

        return self.run_test(
            "Delete Book",
            "DELETE",
            f"/admin/books/{self.created_book_id}",
            200,
            use_admin=True
        )


def main():
    print("🚀 Starting Online Bookstore API Tests")
    print("=" * 50)

    tester = BookstoreAPITester()

    # Test sequence
    tests = [
        ("API Health Check", tester.test_health_check),
        ("User Registration", tester.test_user_registration),
        ("Admin Login", tester.test_admin_login),
        ("Initialize Sample Data", tester.test_initialize_sample_data),
        ("Get All Books", tester.test_get_books),
        ("Create New Book", tester.test_create_book),
        ("Get Single Book", tester.test_get_single_book),
        ("Update Book", tester.test_update_book),
        ("Create Order", tester.test_create_order),
        ("Get User Orders", tester.test_get_user_orders),
        ("Get Admin Orders", tester.test_get_admin_orders),
        ("Update Order Status", tester.test_update_order_status),
        ("Create Checkout Session", tester.test_create_checkout_session),
        ("Delete Book", tester.test_delete_book),
    ]

    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")

    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())