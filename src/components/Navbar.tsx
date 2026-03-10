import React from 'react';
import { User, CartItem } from '../types';
import { ShoppingBag, LogOut, QrCode, ShoppingCart, User as UserIcon, History } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  user: User;
  cartItems: CartItem[];
  activeTab: 'scan' | 'cart' | 'profile';
  setActiveTab: (tab: 'scan' | 'cart' | 'profile') => void;
  onLogout: () => void;
}

export default function Navbar({ user, cartItems, activeTab, setActiveTab, onLogout }: NavbarProps) {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/80 backdrop-blur-xl border-t md:border-t-0 md:border-b border-zinc-100 z-50 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-zinc-900 tracking-tight text-lg">Scan&Go</span>
        </div>

        <div className="flex-1 md:flex-none flex items-center justify-around md:justify-end md:space-x-8">
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-4 py-2 rounded-2xl transition-all ${activeTab === 'scan' ? 'bg-emerald-50 text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <QrCode className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider md:tracking-normal md:capitalize">Scanner</span>
          </button>

          <button 
            onClick={() => setActiveTab('cart')}
            className={`relative flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-4 py-2 rounded-2xl transition-all ${activeTab === 'cart' ? 'bg-emerald-50 text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider md:tracking-normal md:capitalize">Bag</span>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 md:static md:ml-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-emerald-200"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-4 py-2 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <UserIcon className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider md:tracking-normal md:capitalize">Profile</span>
          </button>

          <div className="hidden md:flex items-center pl-8 border-l border-zinc-100 space-x-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center space-x-3 hover:bg-zinc-50 p-2 rounded-xl transition-all"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-medium transition-all ${activeTab === 'profile' ? 'text-emerald-600' : 'text-zinc-700'}`}>{user.name}</span>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="md:hidden p-2 text-zinc-300 hover:text-red-500 transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
