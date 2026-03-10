import React from 'react';
import { User, Order } from '../types';
import { User as UserIcon, Mail, MapPin, Calendar, ShieldCheck, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import OrderHistory from './OrderHistory';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* User Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 bg-emerald-100 rounded-[2rem] flex items-center justify-center shadow-inner">
            <UserIcon className="w-16 h-16 text-emerald-600" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold text-zinc-900">{user.name}</h1>
              <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified Member
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-500">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.id}@scanandgo.com</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Mumbai, India</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined March 2026</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm">Customer ID: #{user.id}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 px-6 py-3 bg-zinc-50 text-zinc-600 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-zinc-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>

      {/* Order History Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4 px-2">
          <h2 className="text-2xl font-bold text-zinc-900">Purchase History</h2>
          <div className="h-px bg-zinc-200 flex-1" />
        </div>
        <div className="-mx-6">
          <OrderHistory user={user} />
        </div>
      </div>
    </div>
  );
}
