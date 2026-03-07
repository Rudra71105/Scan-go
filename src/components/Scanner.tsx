import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../types';
import { Loader2, QrCode, X, Search, Tag, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ScannerProps {
  onProductScanned: (product: Product) => void;
}

export default function Scanner({ onProductScanned }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Client-side fallback for demo products (useful for Vercel/Static deployments)
      const demoProducts: Record<string, Product> = {
        'CLOTH-001': { id: 'CLOTH-001', name: 'Premium Polo T-shirt', price: 1499, image_url: 'https://picsum.photos/seed/polo/400/600', description: 'Classic fit premium cotton polo t-shirt.' },
        'CLOTH-002': { id: 'CLOTH-002', name: 'Vintage Denim Jacket', price: 4499, image_url: 'https://picsum.photos/seed/denim-jacket/400/600', description: 'Vintage wash denim jacket with metal buttons.' },
        'CLOTH-003': { id: 'CLOTH-003', name: 'Classic Blue Jeans', price: 2499, image_url: 'https://picsum.photos/seed/jeans/400/600', description: 'Durable and stylish classic blue denim jeans.' },
        'CLOTH-004': { id: 'CLOTH-004', name: 'Oversized Hoodie', price: 1999, image_url: 'https://picsum.photos/seed/hoodie/400/600', description: 'Warm and cozy oversized cotton hoodie.' },
      };

      if (demoProducts[id]) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        onProductScanned(demoProducts[id]);
        setSearchId('');
        return true;
      }

      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const product = await response.json();
        onProductScanned(product);
        setSearchId('');
        return true;
      } else {
        setError("Product not found. Check the ID and try again.");
        return false;
      }
    } catch (err) {
      setError("Failed to fetch product details.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      fetchProduct(searchId.trim());
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    if (scanning) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;

          const config = { fps: 10, qrbox: { width: 250, height: 250 } };

          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              const success = await fetchProduct(decodedText);
              if (success) {
                await stopScanner();
              }
            },
            (errorMessage) => {
              // Silent error for scanner
            }
          );
        } catch (err) {
          console.error("Scanner failed to start", err);
          setError("Could not access camera. Please ensure you have granted permissions. If you're in a preview, try opening the app in a new tab.");
          setScanning(false);
        }
      };

      // Small delay to ensure the #reader div is in the DOM
      const timer = setTimeout(startScanner, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scanning]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-xl mx-auto">
      {/* Search Bar */}
      <motion.form 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSearch}
        className="w-full relative group"
      >
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Search by Cloth ID (e.g. CLOTH-001)"
          className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] py-5 pl-14 pr-32 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-zinc-800 font-medium"
        />
        <button 
          type="submit"
          disabled={loading || !searchId.trim()}
          className="absolute right-2 top-2 bottom-2 bg-zinc-900 text-white px-6 rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </motion.form>

      <div className="flex items-center w-full space-x-4">
        <div className="h-px bg-zinc-200 flex-1" />
        <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">OR</span>
        <div className="h-px bg-zinc-200 flex-1" />
      </div>

      {!scanning ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setScanning(true)}
          className="flex flex-col items-center justify-center w-full aspect-square max-w-[320px] bg-white border-2 border-dashed border-zinc-200 rounded-[3rem] hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
            <QrCode className="w-10 h-10 text-zinc-400 group-hover:text-emerald-600" />
          </div>
          <span className="text-xl font-bold text-zinc-800 group-hover:text-emerald-700">Open QR Scanner</span>
          <p className="text-zinc-400 text-sm mt-2">Scan the tag on the cloth</p>
        </motion.button>
      ) : (
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-zinc-100">
          <div className="p-5 border-b flex justify-between items-center bg-zinc-50/50">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-zinc-800">Scanner Active</h3>
            </div>
            <button 
              onClick={stopScanner}
              className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          
          <div id="reader" className="w-full aspect-square bg-black"></div>
          
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
              >
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-emerald-600 font-bold text-lg">Identifying Cloth...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center space-y-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-red-600 font-medium text-sm">{error}</p>
          </div>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="flex items-center space-x-2 text-xs font-bold text-red-700 bg-red-100 px-4 py-2 rounded-xl hover:bg-red-200 transition-all"
          >
            <Camera className="w-3 h-3" />
            <span>Open in New Tab</span>
          </button>
        </motion.div>
      )}

      <div className="bg-zinc-100/50 p-6 rounded-[2rem] w-full">
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Quick Test IDs</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['CLOTH-001', 'CLOTH-002', 'CLOTH-003', 'CLOTH-004'].map(id => (
            <button 
              key={id}
              onClick={() => fetchProduct(id)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
