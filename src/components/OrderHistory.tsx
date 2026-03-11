import React, { useState, useEffect } from 'react';
import { Order, CartItem, User } from '../types';
import { ChevronLeft, Package, Calendar, CreditCard, Hash, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderHistoryProps {
  user: User;
}

export default function OrderHistory({ user }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fail-safe: ensure loading is cleared after 10 seconds no matter what
    const failSafeId = setTimeout(() => {
      if (loading) {
        console.warn("OrderHistory: Fail-safe timeout triggered, forcing loading to false");
        setLoading(false);
      }
    }, 10000);

    console.log("OrderHistory: useEffect triggered for user", user.id);
    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log("OrderHistory: Fetching from API...");
        
        // Add a timeout to the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`/api/orders/${user.id}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        let apiOrders: Order[] = [];
        if (response.ok) {
          const data = await response.json();
          console.log("OrderHistory: API data received", data);
          apiOrders = Array.isArray(data) ? data : [];
        } else {
          console.warn("OrderHistory: API response not ok", response.status);
        }
        
        // Merge with local orders
        console.log("OrderHistory: Reading from localStorage...");
        let localOrders: Order[] = [];
        try {
          const stored = localStorage.getItem(`orders_${user.id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            localOrders = Array.isArray(parsed) ? parsed : [];
            console.log("OrderHistory: Local orders found", localOrders.length);
          }
        } catch (e) {
          console.error("OrderHistory: Failed to parse local orders", e);
        }
        
        const combined = [...apiOrders];
        localOrders.forEach(lo => {
          if (lo && lo.id && !combined.some(ao => ao.id === lo.id)) {
            combined.push(lo);
          }
        });
        
        combined.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return (dateB || 0) - (dateA || 0);
        });
        
        console.log("OrderHistory: Final combined orders", combined.length);
        setOrders(combined);
      } catch (err) {
        console.error("OrderHistory: Error in fetchOrders:", err);
        try {
          const stored = localStorage.getItem(`orders_${user.id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setOrders(Array.isArray(parsed) ? parsed : []);
          }
        } catch (e) {
          setOrders([]);
        }
      } finally {
        console.log("OrderHistory: Setting loading to false");
        setLoading(false);
        clearTimeout(failSafeId);
      }
    };

    fetchOrders();
    return () => clearTimeout(failSafeId);
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-zinc-300" />
        </div>
        <h2 className="text-xl font-bold text-zinc-800 mb-2">No Orders Yet</h2>
        <p className="text-zinc-500">Your shopping history will appear here once you make a purchase.</p>
      </div>
    );
  }

  const renderOrderDetail = (order: Order) => {
    const items: CartItem[] = JSON.parse(order.items);
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <button 
          onClick={() => setSelectedOrder(null)}
          className="flex items-center space-x-2 text-zinc-500 hover:text-emerald-600 transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold">Back to History</span>
        </button>

        <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-100">
            <div>
              <div className="flex items-center space-x-2 text-zinc-400 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Order ID</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">#{order.id.toString().padStart(6, '0')}</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-zinc-50 px-4 py-2 rounded-xl">
                <div className="flex items-center space-x-2 text-zinc-400 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Date & Time</span>
                </div>
                <p className="text-sm font-bold text-zinc-700">
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
              <div className="bg-zinc-50 px-4 py-2 rounded-xl">
                <div className="flex items-center space-x-2 text-zinc-400 mb-1">
                  <CreditCard className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Payment Mode</span>
                </div>
                <p className="text-sm font-bold text-zinc-700">{order.payment_method || 'Cash'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-zinc-800">Items Purchased</h3>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-zinc-800">{item.name}</h4>
                      <p className="text-xs text-zinc-500">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <p className="font-bold text-zinc-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-6 bg-emerald-500 rounded-2xl text-white">
            <span className="text-lg font-medium">Total Amount Paid</span>
            <span className="text-3xl font-bold">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {selectedOrder ? (
          renderOrderDetail(selectedOrder)
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">Order History</h1>
                <p className="text-zinc-500">Review your past purchases and receipts.</p>
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">
                {orders.length} Orders
              </div>
            </div>

            <div className="grid gap-4">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Package className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-800">Order #{order.id.toString().padStart(6, '0')}</h3>
                        <p className="text-xs text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })} • {order.payment_method || 'Cash'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-zinc-900">₹{order.total.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Completed</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
