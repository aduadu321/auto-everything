import { useState } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { emailService } from '../services/api';

export function EmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await emailService.send(to, subject, body);

      if (response.success) {
        setResult({
          success: true,
          message: `Email trimis cu succes! ID: ${response.messageId}`,
        });
        setTo('');
        setSubject('');
        setBody('');
      } else {
        setResult({
          success: false,
          message: `Eroare: ${response.error}`,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Eroare: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Email Notification</h1>

      {/* Provider Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">SG</span>
        </div>
        <div>
          <p className="font-medium text-blue-800">SendGrid Activ</p>
          <p className="text-sm text-blue-700">
            Emailurile sunt trimise prin SendGrid API
          </p>
        </div>
      </div>

      {/* Send Email Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Trimite Email</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catre (Email)
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="destinatar@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subiect
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subiectul emailului"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Continut
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Scrie continutul emailului aici..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Se trimite...</span>
            ) : (
              <>
                <Send size={20} />
                <span>Trimite Email</span>
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
