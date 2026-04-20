import { useState, useEffect } from 'react';
import { 
  Phone, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Wallet, 
  Globe, 
  Cpu, 
  MessageSquare,
  AlertCircle,
  Loader2,
  ShoppingCart,
  History,
  Info,
  LogIn,
  LogOut,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

// --- Types ---

interface Country {
  id_negara: number;
  nama_negara: string;
}

interface Service {
  harga: number;
  stok: number;
  layanan: string;
  key: string; 
}

interface Order {
  id?: string; // Firestore doc ID
  order_id: number;
  number: string;
  service_name: string;
  country_name: string;
  operator: string;
  price: number;
  otp?: string;
  status: 'active' | 'completed' | 'cancelled';
  timestamp: any;
}

// --- Admin Components ---

function AdminPanel() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all buyers
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setBuyers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch pending requests
    const qReqs = query(collection(db, 'topup_requests'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
    const unsubReqs = onSnapshot(qReqs, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReqs();
    };
  }, []);

  const approveTopup = async (req: any) => {
    try {
      // 1. Update status to approved
      await updateDoc(doc(db, 'topup_requests', req.id), { status: 'approved' });
      // 2. Add balance to user
      await updateDoc(doc(db, 'users', req.uid), { balance: increment(req.amount) });
      alert(`Berhasil menyetujui Rp ${req.amount.toLocaleString()} untuk ${req.email}`);
    } catch (err) {
      console.error(err);
      alert('Gagal menyetujui permintaan.');
    }
  };

  const rejectTopup = async (req: any) => {
    try {
      await updateDoc(doc(db, 'topup_requests', req.id), { status: 'rejected' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topup Requests */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="px-5 py-[15px] border-b border-[#e2e8f0] font-bold bg-blue-50 text-blue-800 flex items-center gap-2">
            <PlusCircle size={18} /> Permintaan Top Up
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Nominal</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400 italic">Tidak ada permintaan pending</td>
                  </tr>
                ) : (
                  requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                         <div className="font-medium text-slate-700">{req.email}</div>
                         <div className="text-[10px] text-slate-400">{new Date(req.timestamp?.seconds * 1000).toLocaleString()}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">Rp {req.amount.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => approveTopup(req)}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Setujui"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => rejectTopup(req)}
                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="Tolak"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Buyers List */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="px-5 py-[15px] border-b border-[#e2e8f0] font-bold bg-slate-50 text-slate-800 flex items-center gap-2">
             <Globe size={18} /> Daftar Konsumen
          </div>
          <div className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Saldo</th>
                  <th className="px-5 py-3 text-center">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {buyers.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                       <div className="font-medium text-slate-700 truncate max-w-[150px]">{b.email}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm">Rp {b.balance?.toLocaleString() || 0}</td>
                    <td className="px-5 py-3 text-center">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${b.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                         {b.role || 'user'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- App Component ---

export default function App() {
  const { user, profile, login, loginEmail, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'admin'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPassInput, setLoginPassInput] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [operators, setOperators] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('any');
  const [services, setServices] = useState<Record<string, Service>>({});
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(10000);
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // --- API & Firebase Calls ---
  
  const filteredCountries = countries.filter(c => 
    c.nama_negara.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredServices = (Object.values(services) as Service[]).filter(s => 
    s.layanan.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const fetchCountries = async () => {
    try {
      setLoading(prev => ({ ...prev, countries: true }));
      const res = await fetch('/api/countries');
      const data = await res.json();
      if (data.success) {
        setCountries(data.data);
      }
    } catch (err) {
      setError('Failed to load countries');
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchOperators = async (countryId: number) => {
    try {
      setLoading(prev => ({ ...prev, operators: true }));
      const res = await fetch(`/api/operators?negara=${countryId}`);
      const data = await res.json();
      if (data.success) {
        const ops = data.data[countryId] || [];
        setOperators(ops);
      }
    } catch (err) {
      console.error('Failed to fetch operators', err);
    } finally {
      setLoading(prev => ({ ...prev, operators: false }));
    }
  };

  const fetchServices = async (countryId: number) => {
    try {
      setLoading(prev => ({ ...prev, services: true }));
      const res = await fetch(`/api/services?negara=${countryId}`);
      const responseData = await res.json();
      
      // Handle both formats: raw map or { success: true, data: { ... } }
      let countryServices = {};
      if (responseData.success && responseData.data) {
        countryServices = responseData.data[countryId] || responseData.data || {};
      } else {
        countryServices = responseData[countryId] || responseData || {};
      }

      const mappedServices: Record<string, Service> = {};
      Object.keys(countryServices).forEach(key => {
        const item = countryServices[key];
        if (typeof item === 'object' && item !== null && 'layanan' in item) {
          mappedServices[key] = { 
            ...item, 
            key 
          };
        }
      });
      
      setServices(mappedServices);
    } catch (err) {
      console.error('Failed to fetch services', err);
      setError('Gagal memuat daftar layanan. Silakan coba lagi.');
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  };

  const handleTopup = async () => {
    if (!user) return;
    try {
      setLoading(prev => ({ ...prev, topup: true }));
      
      // Save topup request for admin to see
      await addDoc(collection(db, 'topup_requests'), {
        uid: user.uid,
        email: user.email,
        amount: topupAmount,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      const waNumber = '6283845890648';
      const message = `Halo Admin, saya ingin topup saldo di MWSTORE.\n\nDetail Akun:\nEmail: ${user.email}\nNominal: Rp ${topupAmount.toLocaleString()}\n\nStatus: Menunggu Persetujuan.`;
      window.location.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      
      setShowTopup(false);
    } catch (err) {
      console.error(err);
      setError('Gagal mengirim permintaan top up.');
    } finally {
      setLoading(prev => ({ ...prev, topup: false }));
    }
  };

  const placeOrder = async () => {
    if (!user || !profile || !selectedCountry || !selectedServiceKey || !selectedOperator) return;

    const price = services[selectedServiceKey].harga;
    if (profile.balance < price) {
      setError('Saldo tidak cukup. Silakan isi saldo terlebih dahulu.');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, order: true }));
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negara: selectedCountry.id_negara,
          layanan: selectedServiceKey,
          operator: selectedOperator
        })
      });
      const data = await res.json();

      if (data.success) {
        // Save to Firestore
        const orderData = {
          uid: user.uid,
          order_id: data.data.order_id,
          number: data.data.number,
          service_name: services[selectedServiceKey].layanan,
          country_name: selectedCountry.nama_negara,
          operator: selectedOperator,
          price: price,
          status: 'active',
          timestamp: serverTimestamp()
        };
        await addDoc(collection(db, 'orders'), orderData);
        
        // Deduct balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(-price)
        });

      } else {
        setError(data.message || 'Order failed');
      }
    } catch (err) {
      setError('Failed to place order');
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  };

  const checkOtp = async (order: Order) => {
    if (!order.id) return;
    try {
      const res = await fetch(`/api/sms?order_id=${order.order_id}`);
      const data = await res.json();
      if (data.success && data.data.otp) {
        await updateDoc(doc(db, 'orders', order.id), {
          otp: data.data.otp,
          status: 'completed'
        });
      }
    } catch (err) {
      console.error('Failed to check OTP', err);
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!order.id || !user) return;
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id })
      });
      const data = await res.json();
      if (data.success) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'cancelled'
        });
        
        // Refund balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(order.price)
        });
      } else {
        setError(data.message || 'Cancellation failed');
      }
    } catch (err) {
      console.error('Failed to cancel order', err);
    }
  };

  // --- Effects ---

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchOperators(selectedCountry.id_negara);
      fetchServices(selectedCountry.id_negara);
      setSelectedServiceKey(null);
      setSelectedOperator('any');
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setActiveOrders(orders);
      });
      return () => unsubscribe();
    } else {
      setActiveOrders([]);
    }
  }, [user]);

  // --- Render Helpers ---

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex bg-[#f0f2f5] text-[#1e293b] font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[14px] h-screen overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-[#1e293b] text-white p-5 flex flex-col h-full shrink-0
        transition-transform duration-300 ease-in-out lg:relative 
        ${user ? 'lg:translate-x-0' : 'lg:-translate-x-full lg:hidden'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <img 
               src="https://api.studio.google.com/build/api/v1/files/input_file_0.png" 
               alt="MWSTORE Logo" 
               className="h-9 w-auto brightness-110 contrast-125"
               referrerPolicy="no-referrer"
               onError={(e) => {
                 // Fallback if image not found
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }}
             />
             <h1 className="hidden text-[18px] tracking-[1px] text-[#3b82f6] font-extrabold uppercase">
               MWSTORE
             </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded-md text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-1">
          <div 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'bg-[#3b82f6]' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <ShoppingCart size={18} />
            <span className="font-medium">Dashboard</span>
          </div>
          <div 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'history' ? 'bg-[#3b82f6]' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <History size={18} />
            <span className="font-medium">Riwayat</span>
          </div>
          {profile?.role === 'admin' && (
            <div 
              onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'admin' ? 'bg-[#3b82f6]' : 'hover:bg-white/10 text-slate-400'}`}
            >
              <Cpu size={18} />
              <span className="font-medium">Admin Panel</span>
            </div>
          )}
          <button 
            onClick={() => { setShowTopup(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-slate-400 text-left"
          >
            <Wallet size={18} />
            <span className="font-medium">Top Up Saldo</span>
          </button>
        </div>

        <div className="mt-auto space-y-1">
          <a 
            href="https://wa.me/6283845890648" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-lg hover:bg-green-500/10 cursor-pointer transition-colors text-green-400"
          >
            <MessageSquare size={18} />
            <span className="font-medium">WhatsApp Admin</span>
          </a>
          <a 
            href="https://whatsapp.com/channel/0029Vb7FFLl8KMqgTJlul03P" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-lg hover:bg-blue-500/10 cursor-pointer transition-colors text-blue-400"
          >
            <Globe size={18} />
            <span className="font-medium">Saluran WA</span>
          </a>
          <div className="flex items-center gap-2.5 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-slate-400">
            <Info size={18} />
            <span className="font-medium">API Docs</span>
          </div>
          {user ? (
            <button 
              onClick={logout}
              className="w-full flex items-center gap-2.5 p-3 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors text-red-400 text-left"
            >
              <LogOut size={18} />
              <span className="font-medium">Keluar</span>
            </button>
          ) : (
            <button 
              onClick={login}
              className="w-full flex items-center gap-2.5 p-3 rounded-lg hover:bg-blue-500/10 cursor-pointer transition-colors text-blue-400 text-left"
            >
              <LogIn size={18} />
              <span className="font-medium">Masuk</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <header className="h-[60px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 lg:px-[30px] shrink-0 gap-4">
          <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-600"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="font-bold text-sm lg:text-[16px] truncate">
              {user ? `Halo, ${user.displayName || 'User'}` : 'Silakan Masuk'}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {profile && (
              <div 
                className={`bg-[#eff6ff] border border-[#bfdbfe] py-1.5 px-4 rounded-md font-bold text-[#3b82f6] ${profile.role === 'admin' ? 'border-purple-200 bg-purple-50 text-purple-600' : ''}`}
              >
                {profile.role === 'admin' ? 'ADMIN' : `Saldo: Rp ${profile.balance.toLocaleString()}`}
              </div>
            )}
            {!user && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-[#3b82f6] text-white py-1.5 px-4 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <LogIn size={14} /> Masuk Akun
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Context Area */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-5">
          {!user ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                  <Phone size={48} />
                </div>
                <h2 className="text-2xl font-bold">Akses Terbatas</h2>
                <p className="text-slate-500 max-w-sm">
                  Silakan masuk menggunakan akun Google atau Admin untuk melakukan pembelian nomor virtual dan melihat riwayat pesanan Anda.
                </p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-8 py-3 bg-[#3b82f6] text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Masuk Sekarang
                </button>
             </div>
          ) : activeTab === 'admin' && profile?.role === 'admin' ? (
            <AdminPanel />
          ) : (
            <>
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} />
                      <p className="text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                      <XCircle size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 items-start">
                
                {/* Left Side (Order Form) */}
                <div className="flex flex-col gap-5">
                  <section className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col overflow-hidden shadow-sm">
                    <div className="px-5 py-[15px] border-b border-[#e2e8f0] font-bold bg-[#fafafa]">
                      Pesan Nomor Baru
                    </div>
                    <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] uppercase text-[#64748b] font-bold tracking-wider flex justify-between">
                        <span>Negara</span>
                        <span className="text-[10px] lowercase font-normal">({countries.length} negara tersedia)</span>
                      </label>
                      <div className="relative group/search">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Cari negara..."
                          className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-md outline-none bg-white focus:border-[#3b82f6] text-sm"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[180px] overflow-y-auto border border-[#e2e8f0] rounded-md divide-y divide-slate-50 bg-white shadow-inner custom-scrollbar">
                        {loading.countries ? (
                          <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                             <Loader2 size={14} className="animate-spin" />
                             <span className="text-xs">Memuat negara...</span>
                          </div>
                        ) : filteredCountries.length > 0 ? (
                          filteredCountries.map(c => (
                            <div 
                              key={c.id_negara}
                              onClick={() => {
                                setSelectedCountry(c);
                                setCountrySearch('');
                              }}
                              className={`px-3 py-2.5 text-sm cursor-pointer transition-all flex items-center justify-between group ${
                                selectedCountry?.id_negara === c.id_negara 
                                ? 'bg-blue-50 text-blue-700 font-bold' 
                                : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="uppercase tracking-tight">{c.nama_negara}</span>
                              {selectedCountry?.id_negara === c.id_negara && <CheckCircle2 size={14} className="text-blue-600" />}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 italic">Negara tidak ditemukan</div>
                        )}
                      </div>
                    </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase text-[#64748b] font-bold tracking-wider flex justify-between">
                          <span>Layanan / Aplikasi</span>
                          <span className="text-[10px] lowercase font-normal">({Object.keys(services).length} tersedia)</span>
                        </label>
                        <div className="relative group/search-service">
                          <ShoppingCart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search-service:text-blue-500 transition-colors" />
                          <input 
                            type="text"
                            placeholder="Cari aplikasi (WA, Tele, dll)..."
                            disabled={!selectedCountry || loading.services}
                            className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-md outline-none bg-white focus:border-[#3b82f6] text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                          />
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto border border-[#e2e8f0] rounded-md divide-y divide-slate-50 bg-white shadow-inner custom-scrollbar">
                          {loading.services ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                               <Loader2 size={24} className="animate-spin text-blue-500" />
                               <span className="text-xs font-medium">Mengambil daftar layanan...</span>
                            </div>
                          ) : !selectedCountry ? (
                            <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
                              <Info size={20} className="text-slate-300" />
                              Pilih negara terlebih dahulu untuk melihat layanan
                            </div>
                          ) : filteredServices.length > 0 ? (
                            <div className="grid grid-cols-1 gap-px bg-slate-50">
                              {filteredServices.map((service: Service) => {
                                const isSelected = selectedServiceKey === service.key;
                                return (
                                  <div 
                                    key={service.key}
                                    onClick={() => setSelectedServiceKey(service.key)}
                                    className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between group bg-white ${
                                      isSelected 
                                      ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-200 z-10' 
                                      : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold uppercase ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                          {service.layanan}
                                        </span>
                                        {service.stok > 100 && (
                                          <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">STOK MELIMPAH</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1 font-mono">
                                          <Wallet size={10} /> Rp {service.harga.toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <RefreshCcw size={10} /> Stok: {service.stok}
                                        </span>
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
                                        <CheckCircle2 size={14} />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-slate-200 group-hover:border-blue-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-xs text-slate-400 italic">Layanan tidak ditemukan</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Operator</label>
                        <select 
                          className="w-full p-2.5 border border-[#e2e8f0] rounded-md outline-none bg-white focus:border-[#3b82f6] disabled:bg-gray-50 text-sm"
                          disabled={!selectedCountry || loading.operators}
                          value={selectedOperator}
                          onChange={(e) => setSelectedOperator(e.target.value)}
                        >
                          <option value="any">ANY (REKOMENDASI)</option>
                          {operators.map(op => (
                            <option key={op} value={op}>{op.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={placeOrder}
                        disabled={!selectedServiceKey || loading.order}
                        className="w-full p-3 bg-[#3b82f6] text-white rounded-md font-bold uppercase transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading.order ? <Loader2 size={18} className="animate-spin" /> : 'ORDER SEKARANG'}
                      </button>

                      <div className="mt-4 text-[12px] text-[#64748b] border-t border-gray-100 pt-3">
                        <p>* Saldo akan terpotong secara otomatis.</p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Side */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col overflow-hidden shadow-sm">
                  <div className="px-5 py-[15px] border-b border-[#e2e8f0] font-bold bg-slate-50 flex justify-between items-center text-slate-800">
                    <div className="flex items-center gap-2">
                       <ShoppingCart size={18} className="text-blue-600" />
                       <span>Aktivitas Pesanan</span>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                      {activeOrders.length} Transaksi
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar bg-slate-50/20">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {activeOrders.map((order) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={order.order_id} 
                          className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
                        >
                          {/* Accent bar for active status */}
                          {order.status === 'active' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-400" />}
                          {order.status === 'completed' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500" />}

                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 text-[12px] uppercase tracking-tight truncate max-w-[150px]">{order.service_name}</span>
                                  <span className={`text-[8px] font-black px-1 py-0.5 rounded uppercase ${
                                    order.status === 'active' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {order.status === 'active' ? 'Proses' : 
                                     order.status === 'completed' ? 'Ok' : 'Gagal'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                  <Globe size={10} />
                                  <span className="uppercase">{order.country_name}</span>
                                  <span className="mx-0.5">•</span>
                                  <span className="font-mono text-[9px]">#{order.order_id}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {order.status === 'active' && (
                                  <>
                                    <button 
                                      onClick={() => checkOtp(order)}
                                      className="p-1.5 bg-white text-blue-600 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                      title="Refresh"
                                    >
                                      <RefreshCcw size={14} />
                                    </button>
                                    <button 
                                      onClick={() => cancelOrder(order)}
                                      className="p-1.5 bg-white text-red-500 border border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
                                      title="Cancel"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
                                {order.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                                {order.status === 'cancelled' && <XCircle size={18} className="text-slate-200" />}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div 
                                onClick={() => copyToClipboard(order.number)}
                                className="flex flex-col bg-slate-50 p-1.5 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group/num"
                              >
                                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Nomor</span>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-slate-700 text-[12px] tracking-tight">{order.number}</span>
                                  <Copy size={10} className="text-slate-400" />
                                </div>
                              </div>

                              <div 
                                onClick={() => order.otp && copyToClipboard(order.otp)}
                                className={`flex flex-col p-1.5 rounded-lg border transition-all ${
                                  order.otp 
                                  ? 'bg-blue-50 border-blue-100 text-blue-700 cursor-pointer hover:bg-blue-100' 
                                  : 'bg-slate-50 border-slate-100 text-slate-300'
                                }`}
                              >
                                <span className="text-[9px] font-bold uppercase mb-1">{order.otp ? 'OTP' : 'Menunggu'}</span>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-[14px] leading-none tracking-wider">
                                    {order.otp || '------'}
                                  </span>
                                  {order.otp && <Copy size={10} className="text-blue-400" />}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress animation for active orders */}
                          {order.status === 'active' && (
                            <div className="mt-2 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="h-full w-1/3 bg-blue-500"
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {activeOrders.length === 0 && (
                      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <History size={32} className="text-slate-300" />
                        </div>
                        <p className="italic text-sm">Belum ada aktivitas pesanan hari ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Topup Modal */}
      <AnimatePresence>
        {showTopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-[#1e293b] text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <PlusCircle className="text-blue-400" />
                  <h3 className="font-bold text-lg">Top Up Saldo</h3>
                </div>
                <button onClick={() => setShowTopup(false)} className="hover:rotate-90 transition-transform">
                  <XCircle size={24} className="text-white/50 hover:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Pilih Nominal</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[10000, 25000, 50000, 100000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setTopupAmount(amount)}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                          topupAmount === amount 
                          ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500/20' 
                          : 'border-slate-100 bg-slate-50 hover:border-blue-200'
                        }`}
                      >
                        Rp {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f8fafc] p-5 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-slate-900 border-b border-slate-200 pb-2">
                    <span className="text-sm font-bold uppercase tracking-wider">Metode Pembayaran</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Bank Transfer / E-Wallet</span>
                      <span className="font-bold text-blue-600">Manual</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-100 text-[11px] text-slate-500 leading-relaxed font-mono">
                      Transfer ke salah satu rekening Admin, lalu kirim bukti transfer ke WhatsApp untuk proses approval saldo.
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleTopup}
                  disabled={loading.topup}
                  className="w-full py-4 bg-[#3b82f6] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading.topup ? <Loader2 className="animate-spin" /> : <><MessageSquare size={18} /> KONFIRMASI PEMBAYARAN</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-4">
                     <LogIn size={32} />
                   </div>
                   <h3 className="text-2xl font-bold">Akses Akun</h3>
                   <p className="text-slate-400 text-sm">Masuk untuk melanjutkan transaksi</p>
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={async () => {
                       try {
                         await login();
                         setShowLoginModal(false);
                       } catch (e) {}
                     }}
                     className="w-full py-3.5 border border-[#e2e8f0] rounded-xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                   >
                     <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5" />
                     LOGIN GOOGLE (USER)
                   </button>

                   <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-white px-2">Atau Panel Admin</div>
                   </div>

                   <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="Email Admin"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-400 text-sm"
                        value={loginEmailInput}
                        onChange={(e) => setLoginEmailInput(e.target.value)}
                      />
                      <input 
                        type="password" 
                        placeholder="Password Admin"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-400 text-sm"
                        value={loginPassInput}
                        onChange={(e) => setLoginPassInput(e.target.value)}
                      />
                      <button 
                        onClick={async () => {
                          try {
                            await loginEmail(loginEmailInput, loginPassInput);
                            setShowLoginModal(false);
                          } catch (e) {
                            alert('Login Admin Gagal: Cek email/password Anda.');
                          }
                        }}
                        className="w-full py-3.5 bg-[#1e293b] text-white rounded-xl font-bold hover:bg-black transition-colors"
                      >
                        MASUK ADMIN PANEL
                      </button>
                   </div>
                </div>

                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="w-full text-slate-400 text-sm hover:text-slate-600 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
