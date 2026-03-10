import React, { useState, useEffect } from 'react';
import { User, CartItem, Product } from './types';
import Login from './components/Login';
import Signup from './components/Signup';
import Scanner from './components/Scanner';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'cart' | 'profile'>('scan');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCart([]);
  };

  const handleProductScanned = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Automatically switch to cart or show a toast? Let's stay on scanner but show feedback
    // For this demo, let's switch to cart to show it was added
    setActiveTab('cart');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (paymentDetails: any) => {
    if (!user) return;
    setIsCheckingOut(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          total: paymentDetails.total,
          items: cart,
          paymentMethod: paymentDetails.method,
          paymentDetails: paymentDetails.details,
          coupon: paymentDetails.coupon
        }),
      });

      if (response.ok) {
        setOrderComplete(true);
        setCart([]);
      } else {
        // Fallback for Vercel/Static deployments
        const newOrder = {
          id: Date.now(),
          user_id: user.id,
          total: paymentDetails.total,
          items: JSON.stringify(cart),
          payment_method: paymentDetails.method || 'Cash',
          created_at: new Date().toISOString()
        };
        const localOrders = JSON.parse(localStorage.getItem(`orders_${user.id}`) || '[]');
        localStorage.setItem(`orders_${user.id}`, JSON.stringify([newOrder, ...localOrders]));
        setOrderComplete(true);
        setCart([]);
      }
    } catch (err) {
      // Fallback for network errors
      const newOrder = {
        id: Date.now(),
        user_id: user.id,
        total: paymentDetails.total,
        items: JSON.stringify(cart),
        payment_method: paymentDetails.method || 'Cash',
        created_at: new Date().toISOString()
      };
      const localOrders = JSON.parse(localStorage.getItem(`orders_${user.id}`) || '[]');
      localStorage.setItem(`orders_${user.id}`, JSON.stringify([newOrder, ...localOrders]));
      setOrderComplete(true);
      setCart([]);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!user) {
    return authMode === 'login' ? (
      <Login onLogin={handleLogin} onGoToSignup={() => setAuthMode('signup')} />
    ) : (
      <Signup onSignup={handleLogin} onBackToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 md:pb-0 md:pt-24">
      <Navbar 
        user={user} 
        cartItems={cart} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
      />

      <main className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Scan & Go</h1>
                <p className="text-zinc-500">Scan the QR code on any item to add it to your bag.</p>
              </div>
              <Scanner onProductScanned={handleProductScanned} />
            </motion.div>
          ) : activeTab === 'cart' ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Cart 
                items={cart} 
                onUpdateQuantity={updateQuantity} 
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                isCheckingOut={isCheckingOut}
                orderComplete={orderComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Profile user={user} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
