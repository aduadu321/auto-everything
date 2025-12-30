import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, Mail, Lock, User, Phone, Building2, MapPin,
  ArrowRight, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const businessTypes = [
  { value: 'ITP_STATION', label: 'Stație ITP' },
  { value: 'AUTO_SERVICE', label: 'Service Auto' },
  { value: 'TIRE_SHOP', label: 'Vulcanizare' },
  { value: 'CAR_WASH', label: 'Spălătorie Auto' },
  { value: 'INSURANCE_BROKER', label: 'Broker Asigurări' },
  { value: 'MULTI_SERVICE', label: 'Servicii Multiple' },
];

const counties = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea'
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1 - Account
    email: '',
    password: '',
    confirmPassword: '',

    // Step 2 - Personal
    name: '',
    phone: '',

    // Step 3 - Business
    businessName: '',
    businessType: 'ITP_STATION',
    county: '',
    city: '',
    address: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Toate câmpurile sunt obligatorii');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email invalid');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name || !formData.phone) {
      setError('Toate câmpurile sunt obligatorii');
      return false;
    }
    if (!/^0[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Număr de telefon invalid (ex: 0712345678)');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.businessName || !formData.county || !formData.city) {
      setError('Toate câmpurile obligatorii trebuie completate');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
        businessType: formData.businessType,
        county: formData.county,
        city: formData.city,
        address: formData.address || undefined,
      });

      // Success - redirect to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Eroare la înregistrare';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AutoEverything</span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  step > s
                    ? 'bg-emerald-500 text-white'
                    : step === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 rounded ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 && 'Creează cont'}
            {step === 2 && 'Date personale'}
            {step === 3 && 'Detalii afacere'}
          </h2>
          <p className="text-slate-400 mb-6">
            {step === 1 && 'Introdu email-ul și o parolă sigură'}
            {step === 2 && 'Cum te putem contacta?'}
            {step === 3 && 'Spune-ne despre afacerea ta'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1 - Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@exemplu.ro"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Parolă</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Minim 8 caractere"
                    className="w-full pl-10 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Confirmă parola</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Repetă parola"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Personal */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nume complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Ion Popescu"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Business */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Numele afacerii</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Stație ITP Popescu SRL"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Tip afacere</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {businessTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Județ</label>
                  <select
                    value={formData.county}
                    onChange={(e) => updateField('county', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selectează...</option>
                    {counties.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Oraș</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="București"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Adresă (opțional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Strada, număr"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
              >
                Înapoi
              </button>
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Se creează...'
              ) : step === 3 ? (
                <>
                  Creează cont
                  <CheckCircle className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continuă
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-slate-400 mt-6">
            Ai deja cont?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Autentifică-te
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Prin crearea contului, ești de acord cu{' '}
          <a href="#" className="text-slate-400 hover:text-white">
            Termenii și condițiile
          </a>{' '}
          și{' '}
          <a href="#" className="text-slate-400 hover:text-white">
            Politica de confidențialitate
          </a>
        </p>
      </motion.div>
    </div>
  );
}
