import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Plus, 
  History,
  TrendingUp,
  CreditCard,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
  recipientId?: {
    email: string;
    name: string;
  };
}

export const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Wallet Actions state
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const walletData = await paymentAPI.getWallet();
      const historyData = await paymentAPI.getHistory();
      setBalance(walletData.balance);
      setTransactions(historyData.transactions);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeAction === 'deposit') {
        await paymentAPI.deposit({ amount: parseFloat(amount), description });
        toast.success('Funds added successfully');
      } else if (activeAction === 'withdraw') {
        await paymentAPI.withdraw({ amount: parseFloat(amount), description });
        toast.success('Withdrawal processed');
      } else if (activeAction === 'transfer') {
        await paymentAPI.transfer({ recipientEmail, amount: parseFloat(amount), description });
        toast.success('Transfer successful');
      }
      
      setActiveAction(null);
      setAmount('');
      setRecipientEmail('');
      setDescription('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'failed': return <Badge variant="error">Failed</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Plus className="text-green-500" size={18} />;
      case 'withdraw': return <ArrowDownLeft className="text-red-500" size={18} />;
      case 'transfer_out': return <ArrowUpRight className="text-blue-500" size={18} />;
      case 'transfer_in': return <ArrowRightLeft className="text-indigo-500" size={18} />;
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Wallet</h1>
          <p className="text-gray-500 font-medium tracking-wide">Manage your liquidity and track financial history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setActiveAction('withdraw')}
            leftIcon={<ArrowDownLeft size={18} />}
            className="rounded-xl border-gray-200 text-xs font-black uppercase tracking-widest"
          >
            Withdraw
          </Button>
          <Button 
            variant="outline"
            onClick={() => setActiveAction('transfer')}
            leftIcon={<ArrowRightLeft size={18} />}
            className="rounded-xl border-gray-200 text-xs font-black uppercase tracking-widest"
          >
            Transfer
          </Button>
          <Button 
            onClick={() => setActiveAction('deposit')}
            leftIcon={<Plus size={18} />}
            className="rounded-xl shadow-lg shadow-primary-200 text-xs font-black uppercase tracking-widest"
          >
            Add Funds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Balance Card - Responsive Column Span */}
        <div className={activeAction ? "lg:col-span-7" : "lg:col-span-8"}>
          <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50">
            <div className="absolute -top-12 -right-12 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <Wallet size={240} />
            </div>
            <div className="p-8">
              <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Total Liquidity</span>
              <div className="mt-2 flex items-baseline space-x-3">
                <span className="text-6xl font-black text-gray-900 tracking-tighter">${balance.toLocaleString()}</span>
                <span className="text-2xl font-bold text-gray-400">USD</span>
              </div>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-green-100/50 shadow-sm">
                  <div className="flex items-center text-green-600 space-x-2">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Total Earnings</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-green-700">+$2,450.00</p>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-primary-100/50 shadow-sm">
                  <div className="flex items-center text-primary-600 space-x-2">
                    <CreditCard size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Accounts</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-primary-700">2 Connected</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dynamic Action Section */}
        <div className={activeAction ? "lg:col-span-5" : "lg:col-span-4"}>
          {!activeAction ? (
            <Card className="p-8 h-full flex flex-col items-center justify-center text-center border-none shadow-xl bg-white group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Shield size={120} />
              </div>
              <div className="p-4 bg-gray-50 rounded-full mb-6 border border-gray-100 group-hover:bg-primary-50 transition-colors">
                <ShieldCheck className="text-gray-300 group-hover:text-primary-500" size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">Nexus Secure Vault</h3>
              <p className="text-gray-400 font-medium text-xs leading-relaxed max-w-[200px]">
                Your assets are protected with AES-256 encryption & multi-party computation.
              </p>
              <div className="mt-8 flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Systems Nominal</span>
              </div>
            </Card>
          ) : (
            <Card className="border-none shadow-2xl bg-white overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    activeAction === 'deposit' ? 'bg-green-100 text-green-600' :
                    activeAction === 'withdraw' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activeAction === 'deposit' ? <Plus size={20} /> :
                     activeAction === 'withdraw' ? <ArrowDownLeft size={20} /> :
                     <ArrowRightLeft size={20} />}
                  </div>
                  <h3 className="font-black text-gray-900 tracking-tight">
                    {activeAction === 'deposit' ? 'Add Liquidity' :
                     activeAction === 'withdraw' ? 'Personal Withdrawal' : 'Direct Transfer'}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveAction(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleAction} className="space-y-6">
                  {activeAction === 'transfer' && (
                    <Input
                      label="Recipient Email"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="business@nexus.io"
                      required
                      className="bg-gray-50/50 border-gray-100"
                    />
                  )}
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        label="Transaction Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0.01"
                        step="0.01"
                        className="bg-gray-50/50 border-gray-100 pl-10 text-xl font-bold h-14"
                      />
                      <span className="absolute left-4 top-[44px] text-gray-400 font-bold">$</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['50', '100', '500'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className="px-3 py-1.5 rounded-lg border border-gray-100 bg-white text-[10px] font-black text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-all uppercase tracking-widest"
                        >
                          +${val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {amount && parseFloat(amount) > 0 && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 animate-in fade-in duration-300">
                       <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400">Total Settlement</span>
                        <span className="text-gray-900">${parseFloat(amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-green-600">
                        <span>Nexus Platform Fee</span>
                        <span>0%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      type="submit" 
                      fullWidth 
                      isLoading={isSubmitting}
                      className={`h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg ${
                        activeAction === 'deposit' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' :
                        activeAction === 'withdraw' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' :
                        'bg-primary-600 hover:bg-primary-700 shadow-primary-100'
                      }`}
                    >
                      Process {activeAction}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      fullWidth 
                      onClick={() => setActiveAction(null)}
                      className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest"
                    >
                      Discard & Back
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-none shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <History size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="gray" className="animate-pulse">Live Tracking</Badge>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
               {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, transactions.length)} of {transactions.length}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="p-20 text-center">
               <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Ledger...</p>
             </div>
          ) : currentTransactions.length > 0 ? (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50">
                    <th className="px-8 py-4">Financial Event</th>
                    <th className="px-8 py-4">Counterparty</th>
                    <th className="px-8 py-4 text-right">Volume</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl group-hover:scale-110 transition-transform">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 capitalize tracking-tight">
                              {tx.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 italic">{tx.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                            {tx.recipientId?.name?.charAt(0) || 'S'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{tx.recipientId?.name || 'Nexus System'}</span>
                            <span className="text-[10px] font-bold text-gray-400 tracking-tight">{tx.recipientId?.email || 'automated_settlement'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`text-sm font-black tracking-tighter ${
                          tx.type === 'deposit' || tx.type === 'transfer_in' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'transfer_in' ? '+' : '-'}
                          ${tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">{getStatusBadge(tx.status)}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-gray-900">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-8 py-6 flex items-center justify-between border-t border-gray-50 bg-white">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                          currentPage === page
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-20 text-center">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <History className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No transaction data available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
