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
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [cameras, setCameras] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  const fetchProduct = async (id: string) => {
    if (isProcessingRef.current) return false;
    isProcessingRef.current = true;
    
    setLoading(true);
    setError(null);
    setLastScanned(id);
    
    try {
      // Robust ID extraction
      // 1. Try to find Product-X pattern anywhere in the string (handles URLs)
      // 2. Fallback to trimmed uppercase
      let cleanId = id.trim();
      const productMatch = cleanId.match(/Product-\d+/i);
      
      if (productMatch) {
        cleanId = productMatch[0];
        // Capitalize P but keep the rest
        cleanId = 'Product-' + cleanId.split('-')[1];
      }
      
      const demoProducts: Record<string, Product> = {
        'Product-1': { id: 'Product-1', name: 'Tshirt', price: 999, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800', description: 'Comfortable cotton T-shirt.' },
        'Product-2': { id: 'Product-2', name: 'shirt', price: 1299, image_url: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800', description: 'Formal button-down shirt.' },
        'Product-3': { id: 'Product-3', name: 'denim jeans', price: 2499, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800', description: 'Classic blue denim jeans.' },
        'Product-4': { id: 'Product-4', name: 'socks', price: 299, image_url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&q=80&w=800', description: 'Soft cotton socks.' },
        'Product-5': { id: 'Product-5', name: 'cargo', price: 1899, image_url: 'https://images.unsplash.com/photo-1617113930975-f9c7243ae527?auto=format&fit=crop&q=80&w=800', description: 'Multi-pocket cargo pants.' },
      };

      if (demoProducts[cleanId]) {
        await new Promise(resolve => setTimeout(resolve, 600));
        onProductScanned(demoProducts[cleanId]);
        setSearchId('');
        setError(null);
        setLastScanned(null);
        return true;
      }

      const response = await fetch(`/api/products/${cleanId}`);
      if (response.ok) {
        const product = await response.json();
        onProductScanned(product);
        setSearchId('');
        setError(null);
        setLastScanned(null);
        return true;
      } else {
        setError(`Scanned: "${id}". No product found for ID "${cleanId}".`);
        return false;
      }
    } catch (err) {
      setError("Failed to fetch product details.");
      return false;
    } finally {
      setLoading(false);
      // Small cooldown to prevent double scans
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create a temporary element for file scanning if it doesn't exist
      let hiddenReader = document.getElementById("qr-reader-hidden");
      if (!hiddenReader) {
        hiddenReader = document.createElement("div");
        hiddenReader.id = "qr-reader-hidden";
        hiddenReader.style.display = "none";
        document.body.appendChild(hiddenReader);
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      await fetchProduct(decodedText);
    } catch (err) {
      setError("Could not find a QR code in this image. Try a closer, clearer photo of the code.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    isProcessingRef.current = false;
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          // Prioritize back camera
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
          );
          
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        }
      } catch (err) {
        console.error("Failed to get cameras", err);
      }
    };
    getCameras();
  }, []);

  useEffect(() => {
    if (scanning) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;

          const config = { 
            fps: 10, 
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(minEdge * 0.8),
                height: Math.floor(minEdge * 0.8)
              };
            },
            aspectRatio: 1.0,
            disableFlip: false
          };

          const cameraConfig = selectedCameraId ? { deviceId: selectedCameraId } : { facingMode: "environment" };

          await html5QrCode.start(
            cameraConfig,
            config,
            async (decodedText) => {
              if (isProcessingRef.current) return;
              const success = await fetchProduct(decodedText);
              if (success) {
                await stopScanner();
              }
            },
            () => {} 
          );
        } catch (err) {
          console.error("Scanner failed to start", err);
          setError("Camera access failed. This is common in previews. Please open the app in a NEW TAB to use the scanner.");
          setScanning(false);
        }
      };

      const timer = setTimeout(startScanner, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scanning, selectedCameraId]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-xl mx-auto">
      <div id="qr-reader-hidden" className="hidden"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Smart Scanner</h2>
        <p className="text-zinc-500 font-medium">Scan a tag to add it to your bag instantly</p>
      </motion.div>

      <motion.form 
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
          placeholder="Enter Product ID (e.g. Product-1)"
          className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] py-5 pl-14 pr-32 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-zinc-800 font-medium"
        />
        <button 
          type="submit"
          disabled={loading || !searchId.trim()}
          className="absolute right-2 top-2 bottom-2 bg-zinc-900 text-white px-6 rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
        </button>
      </motion.form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {!scanning ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScanning(true)}
            className="flex flex-col items-center justify-center w-full aspect-square bg-white border-2 border-zinc-100 rounded-[3rem] hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
              <Camera className="w-8 h-8 text-zinc-400 group-hover:text-emerald-600" />
            </div>
            <span className="text-lg font-bold text-zinc-800 group-hover:text-emerald-700 text-center px-4">Live Scanner</span>
            <p className="text-zinc-400 text-xs mt-2">Use your camera</p>
          </motion.button>
        ) : (
          <div className="col-span-1 sm:col-span-2 w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-zinc-100">
            <div className="p-5 border-b flex justify-between items-center bg-zinc-50/50">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="font-bold text-zinc-800">Scanner Active</h3>
                </div>
                {cameras.length > 1 && (
                  <select 
                    value={selectedCameraId || ''} 
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="text-[10px] bg-transparent border-none text-zinc-500 focus:ring-0 p-0 mt-1 cursor-pointer"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id}`}</option>
                    ))}
                  </select>
                )}
              </div>
              <button 
                onClick={stopScanner}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="relative aspect-square bg-black">
              <div id="reader" className="w-full h-full"></div>
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] aspect-square border-2 border-emerald-500/50 rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                >
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                  <p className="text-emerald-600 font-bold text-lg">Processing...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!scanning && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full aspect-square bg-white border-2 border-zinc-100 rounded-[3rem] hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden shadow-sm"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
              <QrCode className="w-8 h-8 text-zinc-400 group-hover:text-emerald-600" />
            </div>
            <span className="text-lg font-bold text-zinc-800 group-hover:text-emerald-700 text-center px-4">Upload Photo</span>
            <p className="text-zinc-400 text-xs mt-2">Pick from gallery</p>
          </motion.button>
        )}
      </div>

      {lastScanned && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full p-4 bg-zinc-100 rounded-2xl text-center"
        >
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Last Scanned Raw Content</p>
          <code className="text-xs font-mono text-zinc-800 break-all bg-white px-2 py-1 rounded border border-zinc-200">{lastScanned}</code>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] space-y-4"
        >
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900">Scanning Issue</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex-1 flex items-center justify-center space-x-2 text-sm font-bold text-white bg-red-600 px-6 py-3 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
            >
              <Camera className="w-4 h-4" />
              <span>Open in New Tab</span>
            </button>
            <button 
              onClick={() => setError(null)}
              className="flex-1 flex items-center justify-center space-x-2 text-sm font-bold text-red-700 bg-red-100 px-6 py-3 rounded-2xl hover:bg-red-200 transition-all"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-zinc-100/50 p-6 rounded-[2rem] w-full">
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Quick Test IDs</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Product-1', 'Product-2', 'Product-3', 'Product-4', 'Product-5'].map(id => (
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
