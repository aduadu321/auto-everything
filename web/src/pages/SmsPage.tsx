import { useState, useEffect } from 'react';
import { Send, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { smsService } from '../services/api';
import type { BalanceResponse } from '../services/api';

export function SmsPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await smsService.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await smsService.send(phone, message);

      if (response.success) {
        setResult({
          success: true,
          message: `SMS trimis cu succes! ID: ${response.messageId}`,
        });
        setPhone('');
        setMessage('');
        loadBalance();
      } else {
        setResult({
          success: false,
          message: `Eroare: ${response.error}`,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Eroare: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">SMS Notification</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-500" size={24} />
            <span className="text-gray-600">Twilio (Primary)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ${balance?.twilio?.credits?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-blue-500" size={24} />
            <span className="text-gray-600">SMSLink (Backup)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {balance?.smslink?.credits || 0} RON
          </p>
        </div>
      </div>

      {/* Send SMS Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Trimite SMS</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numar de telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+40756123456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesaj
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrie mesajul tau aici..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {message.length}/160 caractere
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Se trimite...</span>
            ) : (
              <>
                <Send size={20} />
                <span>Trimite SMS</span>
              </>
            )}
          </button>
        </form>

        {/* Result Message */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              result.success
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {result.success ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
