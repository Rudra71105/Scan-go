import React, { useState } from 'react';
import { CartItem } from '../types';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, CheckCircle2, CreditCard, Smartphone, Wallet, Landmark, Ticket, Percent, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (paymentDetails: any) => void;
  isCheckingOut: boolean;
  orderComplete: boolean;
}

type PaymentMethod = 'card' | 'upi' | 'wallet' | 'netbanking';

export default function Cart({ items, onUpdateQuantity, onRemove, onCheckout, isCheckingOut, orderComplete }: CartProps) {
  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  // Payment Details State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  // Carry Bag State
  const [addCarryBag, setAddCarryBag] = useState(false);
  const CARRY_BAG_CHARGE = 15;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalGst = items.reduce((sum, item) => {
    const rate = item.price > 2500 ? 0.18 : 0.05;
    // Assuming price is inclusive of GST
    const gstPerItem = item.price - (item.price / (1 + rate));
    return sum + (gstPerItem * item.quantity);
  }, 0);
  
  const carryBagCharge = addCarryBag ? CARRY_BAG_CHARGE : 0;
  const total = subtotal - discount + carryBagCharge;

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponInput.trim().toLowerCase();
    
    if (code === 'qwertyiopasdfghjkl') {
      setDiscount(subtotal * 0.2); // 20% discount for this long code
      setAppliedCoupon('qwertyiopasdfghjkl');
      setCouponInput('');
    } else {
      setCouponError('This coupon code is not applicable');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponError(null);
  };

  const handleFinalCheckout = () => {
    const paymentDetails = {
      method: paymentMethod,
      details: paymentMethod === 'card' ? { cardNumber, expiry, cvv } : 
               paymentMethod === 'upi' ? { upiId } : {},
      coupon: appliedCoupon,
      carryBag: addCarryBag,
      total
    };
    onCheckout(paymentDetails);
  };

  if (orderComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 text-center"
      >
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-2">Payment Successful!</h2>
        <p className="text-zinc-500 mb-8">Your order has been placed. You can now leave the store with your items.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
        >
          Start New Session
        </button>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-zinc-300" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Your bag is empty</h2>
        <p className="text-zinc-400 max-w-xs">Scan items or search by ID to add them to your shopping bag.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Checkout</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {step === 'review' ? 'Review your items before payment' : 'Complete your payment details'}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'review' ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6 mb-10"
          >
            <div className="space-y-4">
              {items.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="flex items-center bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-20 h-24 object-cover rounded-2xl mr-5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-zinc-900 text-lg">{item.name}</h3>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-baseline space-x-2 mb-3">
                      <p className="text-emerald-600 font-bold text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      {item.quantity > 1 && (
                        <p className="text-zinc-400 text-xs font-medium">₹{item.price.toLocaleString('en-IN')} each</p>
                      )}
                    </div>
                    <div className="flex items-center bg-zinc-50 w-fit rounded-xl p-1 border border-zinc-100">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <Minus className="w-4 h-4 text-zinc-600" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4 text-zinc-600" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Carry Bag Option */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    addCarryBag ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                  )}>
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">Add a Carry Bag</h3>
                    <p className="text-zinc-500 text-xs">Environment-friendly reusable bag</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-zinc-900 text-sm">₹15</span>
                  <div 
                    onClick={() => setAddCarryBag(!addCarryBag)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      addCarryBag ? "bg-emerald-500" : "bg-zinc-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      addCarryBag ? "left-7" : "left-1"
                    )} />
                  </div>
                </div>
              </label>
            </div>

            {/* Coupon Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Ticket className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-zinc-900">Apply Coupon</h3>
              </div>
              
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        if (couponError) setCouponError(null);
                      }}
                      placeholder="Enter code (qwerty...)"
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!couponInput}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs font-bold pl-1"
                    >
                      {couponError}
                    </motion.p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Percent className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-700 font-bold text-sm">{appliedCoupon} Applied</p>
                      <p className="text-emerald-600 text-xs">You saved ₹{discount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 mb-10"
          >
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
                { id: 'upi', name: 'UPI Payment', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
                { id: 'netbanking', name: 'Net Banking', icon: Landmark, desc: 'All major banks supported' },
                { id: 'wallet', name: 'Digital Wallet', icon: Wallet, desc: 'Apple Pay, Samsung Pay' },
              ].map((method) => (
                <div key={method.id} className="space-y-4">
                  <button
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={cn(
                      "w-full flex items-center p-6 rounded-[2rem] border-2 transition-all text-left",
                      paymentMethod === method.id 
                        ? "border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10" 
                        : "border-zinc-100 bg-white hover:border-zinc-200"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mr-5",
                      paymentMethod === method.id ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500"
                    )}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900">{method.name}</h4>
                      <p className="text-zinc-500 text-sm">{method.desc}</p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === method.id ? "border-emerald-500 bg-emerald-500" : "border-zinc-200"
                    )}>
                      {paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>

                  {/* Conditional Inputs */}
                  <AnimatePresence>
                    {paymentMethod === method.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 mt-2 space-y-4 shadow-sm">
                          {method.id === 'card' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Card Number</label>
                                <input 
                                  type="text" 
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  placeholder="0000 0000 0000 0000"
                                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-mono"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Expiry Date</label>
                                  <input 
                                    type="text" 
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">CVV</label>
                                  <input 
                                    type="password" 
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    placeholder="***"
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {method.id === 'upi' && (
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">UPI ID</label>
                              <input 
                                type="text" 
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="username@upi"
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
                              />
                            </div>
                          )}
                          {method.id === 'netbanking' && (
                            <div className="text-zinc-500 text-sm italic">
                              You will be redirected to your bank's secure portal after clicking pay.
                            </div>
                          )}
                          {method.id === 'wallet' && (
                            <div className="text-zinc-500 text-sm italic">
                              Securely pay using your saved digital wallet.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-900/30">
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-zinc-400 text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400 text-sm">
              <span>Discount</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {addCarryBag && (
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Carry Bag</span>
              <span>₹15</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-400 text-sm">
            <span>GST (Calculated)</span>
            <span>₹{totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-zinc-400 text-xs italic">
            <span className="text-zinc-500">5% for items ≤ ₹2,500 | 18% for items &gt; ₹2,500</span>
          </div>
          <div className="h-px bg-zinc-800 my-4" />
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-emerald-400">₹{total.toLocaleString('en-IN')}</p>
            </div>
            {step === 'payment' && (
              <button 
                onClick={() => setStep('review')}
                className="text-zinc-400 hover:text-white text-sm font-medium underline underline-offset-4"
              >
                Edit Order
              </button>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (step === 'review') {
              setStep('payment');
            } else {
              handleFinalCheckout();
            }
          }}
          disabled={isCheckingOut}
          className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-600 transition-all disabled:opacity-70 shadow-lg shadow-emerald-500/20"
        >
          {isCheckingOut ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <>
              <span>{step === 'review' ? 'Select Payment' : `Pay ₹${total.toLocaleString('en-IN')}`}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
