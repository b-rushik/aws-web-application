import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { toast, useToast } from './hooks/use-toast';
import { ShoppingCart, Book, User, LogOut, Plus, Edit, Trash2, Package, CreditCard, CheckCircle, Clock, AlertCircle, Eye, Star, TrendingUp, Mail, Phone, MapPin, Heart } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API utilities
const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';

    if (token && userId) {
      setUser({ id: userId, token });
      setIsAdmin(adminStatus);
    }
    setLoading(false);
  }, []);

  const login = (token, userId, adminStatus = false) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('isAdmin', adminStatus.toString());
    setUser({ id: userId, token });
    setIsAdmin(adminStatus);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Cart context
const CartContext = React.createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (book) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        return prev.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...book, quantity: 1 }];
    });
    toast({
      title: "Added to Cart!",
      description: `${book.title} has been added to your cart.`,
    });
  };

  const removeFromCart = (bookId) => {
    setCartItems(prev => prev.filter(item => item.id !== bookId));
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === bookId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => React.useContext(CartContext);

// Navigation component
const Navigation = ({ showAuthLinks = true }) => {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    if (user && !isAdmin) {
      setIsCartOpen(true);
    }
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <Book className="h-6 w-6" />
          <h1 className="text-xl font-bold">BookStore</h1>
        </div>

        <div className="flex items-center space-x-6">
          {!user && showAuthLinks && (
            <>
              <Button variant="ghost" onClick={() => navigate('/about')}>About Us</Button>
              <Button variant="ghost" onClick={() => navigate('/contact')}>Contact Us</Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>Sign Up / Login</Button>
            </>
          )}

          {user && !isAdmin && (
            <Button variant="outline" className="relative" onClick={handleCartClick}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              My Cart ({cartCount})
            </Button>
          )}

          {user && (
            <Button variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Home page component
const HomePage = () => {
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopBooks();
  }, []);

  const fetchTopBooks = async () => {
    try {
      const response = await api.get('/books');
      // For demo, we'll show all books as "top selling"
      setTopBooks(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopNow = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6">
            Discover Your Next
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600"> Great Read</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Immerse yourself in a world of knowledge and imagination. From bestsellers to hidden gems,
            find the perfect book for every mood and moment.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" onClick={handleShopNow}>
              <Book className="mr-2 h-5 w-5" />
              Explore Books
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/about')}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Top Selling Books */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              <TrendingUp className="inline mr-3 h-8 w-8 text-amber-600" />
              Bestselling Books
            </h2>
            <p className="text-lg text-slate-600">Discover what readers are loving right now</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-[3/4] rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topBooks.map((book, index) => (
                <Card key={book.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        #{index + 1} Bestseller
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{book.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">by {book.author}</p>
                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">(4.8)</span>
                    </div>
                    <Badge variant="secondary" className="mb-3">{book.category}</Badge>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-emerald-600">${book.price}</span>
                      {user && !user.isAdmin ? (
                        <Button
                          size="sm"
                          onClick={() => addToCart(book)}
                          disabled={book.stock_quantity <= 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {book.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => navigate('/auth')}>
                          <Heart className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" onClick={handleShopNow}>
              View All Books
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-12">Why Choose Our Bookstore?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-muted-foreground">Simple and secure checkout process with multiple payment options.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Quick and reliable shipping to get your books to you as soon as possible.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Curated Selection</h3>
              <p className="text-muted-foreground">Handpicked books across all genres to ensure quality and variety.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// About Us page
const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            <CardTitle className="text-3xl">About Our Bookstore</CardTitle>
            <CardDescription className="text-amber-100">
              Discover our passion for books and commitment to readers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Our Story</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Founded with a simple mission: to connect readers with the books they love. Our online bookstore
                  has grown from a small passion project to a comprehensive platform serving book lovers worldwide.
                  We believe that every book has the power to transform lives, spark imagination, and broaden horizons.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To make quality books accessible to everyone, everywhere. We carefully curate our collection to
                  include bestsellers, hidden gems, and diverse voices from around the world. Our goal is to create
                  a seamless shopping experience that helps you discover your next great read.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Why Choose Us?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Carefully curated book selection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Competitive pricing and regular discounts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Fast and secure checkout process
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Excellent customer service
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Reliable shipping and delivery
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Contact Us page
const ContactPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Contact Us</h1>
          <p className="text-lg text-slate-600">We'd love to hear from you. Get in touch with us!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>Fill out the form below and we'll respond as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Here's how you can reach us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">support@bookstore.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">123 Book Street<br />Reading City, RC 12345</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login/Register component
const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminUsername: '',
    adminPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, {
        email: formData.email,
        password: formData.password
      });

      login(response.data.access_token, response.data.user_id, response.data.is_admin);
      toast({
        title: "Success!",
        description: isLogin ? "Logged in successfully" : "Account created successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/admin/login', {
        username: formData.adminUsername,
        password: formData.adminPassword
      });

      login(response.data.access_token, 'admin', true);
      toast({
        title: "Success!",
        description: "Admin logged in successfully",
      });
      navigate('/admin');
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation showAuthLinks={false} />

      <div className="flex items-center justify-center p-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {showAdminLogin ? 'Admin Login' : (isLogin ? 'Login' : 'Create Account')}
            </CardTitle>
            <CardDescription className="text-center">
              {showAdminLogin ? 'Enter admin credentials to access dashboard' : 'Welcome to our Online Bookstore'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showAdminLogin ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-medium text-blue-800 mb-1">Demo Admin Credentials:</p>
                  <p className="text-blue-700">Username: <code className="bg-blue-100 px-1 rounded">admin</code></p>
                  <p className="text-blue-700">Password: <code className="bg-blue-100 px-1 rounded">bookstore2025</code></p>
                </div>
                <div>
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                    placeholder="Enter admin username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Admin Login'}
                </Button>
              </form>
            )}

            <div className="mt-4 space-y-2">
              {!showAdminLogin && (
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                  </Button>
                </div>
              )}

              <div className="text-center pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAdminLogin(!showAdminLogin)}
                  className="w-full"
                  disabled={loading}
                >
                  <User className="h-4 w-4 mr-2" />
                  {showAdminLogin ? 'Back to User Login' : 'Admin Login'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Cart Dialog Component
const CartDialog = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      // Create order
      const orderResponse = await api.post('/orders', {
        items: cartItems.map(item => ({ book_id: item.id, quantity: item.quantity }))
      });

      // Create checkout session
      const checkoutResponse = await api.post('/payments/checkout', {
        order_id: orderResponse.data.id
      }, {
        headers: {
          'Origin': window.location.origin
        }
      });

      // Redirect to Stripe checkout
      window.location.href = checkoutResponse.data.checkout_url;
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: error.response?.data?.detail || "Failed to process checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Shopping Cart</DialogTitle>
          <DialogDescription>Review your items before checkout</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <img src={item.cover_image_url} alt={item.title} className="w-12 h-16 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">by {item.author}</p>
                    <p className="text-sm font-medium">${item.price}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 w-7 p-0 ml-2"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">Total: ${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={loading || cartItems.length === 0}
              className="w-full"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Book grid component
const BookGrid = ({ books, onAddToCart }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">by {book.author}</p>
            <Badge variant="secondary" className="mb-2">{book.category}</Badge>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{book.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-emerald-600">${book.price}</span>
              <Button
                size="sm"
                onClick={() => onAddToCart(book)}
                disabled={book.stock_quantity <= 0}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {book.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Customer dashboard
const CustomerDashboard = () => {
  const { addToCart } = useCart();
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    fetchBooks();
    fetchOrders();

    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const status = urlParams.get('status');

    if (sessionId && status === 'success') {
      checkPaymentStatus(sessionId);
    }
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    if (attempts >= maxAttempts) {
      setPaymentStatus({ type: 'error', message: 'Payment verification timed out' });
      return;
    }

    try {
      const response = await api.get(`/payments/status/${sessionId}`);

      if (response.data.payment_status === 'paid') {
        setPaymentStatus({ type: 'success', message: 'Payment successful! Your order has been confirmed.' });
        fetchOrders();

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (response.data.status === 'expired') {
        setPaymentStatus({ type: 'error', message: 'Payment session expired' });
        return;
      }

      // Continue polling
      setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      setPaymentStatus({ type: 'error', message: 'Failed to verify payment' });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      paid: { variant: 'default', icon: CreditCard, label: 'Paid' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
      shipped: { variant: 'outline', icon: Package, label: 'Shipped' },
      delivered: { variant: 'default', icon: CheckCircle, label: 'Delivered' }
    };

    const config = statusMap[status] || { variant: 'secondary', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <CartDialog />

      {paymentStatus && (
        <div className={`p-4 text-center ${
          paymentStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {paymentStatus.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books">Browse Books</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Discover Amazing Books</h2>
              <BookGrid books={books} onAddToCart={addToCart} />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your past and current orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders found</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.title} x {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-medium">
                              <span>Total</span>
                              <span>${order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Admin dashboard component (unchanged from previous version)
const AdminDashboard = () => {
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    price: '',
    description: '',
    cover_image_url: '',
    stock_quantity: '',
    category: ''
  });

  useEffect(() => {
    fetchBooks();
    fetchOrders();
    initializeSampleData();
  }, []);

  const initializeSampleData = async () => {
    try {
      await api.post('/admin/init-sample-data');
      fetchBooks();
    } catch (error) {
      console.log('Sample data may already exist');
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookData = {
        ...bookForm,
        price: parseFloat(bookForm.price),
        stock_quantity: parseInt(bookForm.stock_quantity)
      };

      if (editingBook) {
        await api.put(`/admin/books/${editingBook.id}`, bookData);
      } else {
        await api.post('/admin/books', bookData);
      }

      setShowBookDialog(false);
      setEditingBook(null);
      resetBookForm();
      fetchBooks();

      toast({
        title: "Success!",
        description: `Book ${editingBook ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save book",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await api.delete(`/admin/books/${bookId}`);
      fetchBooks();
      toast({
        title: "Success!",
        description: "Book deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      fetchOrders();
      toast({
        title: "Success!",
        description: "Order status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      price: '',
      description: '',
      cover_image_url: '',
      stock_quantity: '',
      category: ''
    });
  };

  const openBookDialog = (book = null) => {
    if (book) {
      setEditingBook(book);
      setBookForm({
        title: book.title,
        author: book.author,
        price: book.price.toString(),
        description: book.description,
        cover_image_url: book.cover_image_url,
        stock_quantity: book.stock_quantity.toString(),
        category: book.category
      });
    } else {
      setEditingBook(null);
      resetBookForm();
    }
    setShowBookDialog(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'secondary', icon: Clock },
      paid: { variant: 'default', icon: CreditCard },
      completed: { variant: 'default', icon: CheckCircle },
      shipped: { variant: 'outline', icon: Package },
      delivered: { variant: 'default', icon: CheckCircle }
    };

    const config = statusMap[status] || { variant: 'secondary', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList>
            <TabsTrigger value="books">Manage Books</TabsTrigger>
            <TabsTrigger value="orders">Manage Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Books Management</h2>
              <Button onClick={() => openBookDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cover</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <img src={book.cover_image_url} alt={book.title} className="w-12 h-16 object-cover rounded" />
                        </TableCell>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>${book.price}</TableCell>
                        <TableCell>{book.stock_quantity}</TableCell>
                        <TableCell>{book.category}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openBookDialog(book)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteBook(book.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold">Orders Management</h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">#{order.id.slice(-8)}</TableCell>
                        <TableCell>{order.user_id.slice(-8)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.items.map((item, idx) => (
                              <div key={idx}>{item.title} x{item.quantity}</div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(status) => handleUpdateOrderStatus(order.id, status)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            <DialogDescription>
              {editingBook ? 'Update the book details' : 'Enter the details for the new book'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={bookForm.title}
                onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={bookForm.author}
                onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={bookForm.price}
                  onChange={(e) => setBookForm({...bookForm, price: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={bookForm.stock_quantity}
                  onChange={(e) => setBookForm({...bookForm, stock_quantity: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={bookForm.category}
                onChange={(e) => setBookForm({...bookForm, category: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                type="url"
                value={bookForm.cover_image_url}
                onChange={(e) => setBookForm({...bookForm, cover_image_url: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={bookForm.description}
                onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                {editingBook ? 'Update Book' : 'Add Book'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowBookDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main app component
function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Book className="h-12 w-12 mx-auto mb-4 animate-bounce" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={user ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} /> : <AuthPage />} />
        <Route path="/dashboard" element={user && !isAdmin ? <CustomerDashboard /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Root component with providers
function AppRoot() {
  return (
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  );
}

export default AppRoot;