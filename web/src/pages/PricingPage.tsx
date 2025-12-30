import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, CheckCircle, ArrowRight, Star, Zap, Crown
} from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Star,
    price: { monthly: 99, yearly: 79 },
    description: 'Perfect pentru stații mici și începători',
    features: [
      'Până la 200 vehicule active',
      'Notificări SMS automate',
      'Programări online',
      'Dashboard cu statistici',
      'Import clienți din Excel',
      'Suport prin email',
    ],
    notIncluded: [
      'Notificări email',
      'API access',
      'White-label',
    ],
    popular: false,
    cta: 'Începe gratuit',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Zap,
    price: { monthly: 199, yearly: 159 },
    description: 'Cel mai popular pentru afaceri în creștere',
    features: [
      'Vehicule nelimitate',
      'Notificări SMS + Email',
      'Programări online avansate',
      'Dashboard cu rapoarte detaliate',
      'SMS Gateway propriu (Android)',
      'API access complet',
      'White-label (logo propriu)',
      'Suport prioritar telefonic',
      'Integrare calendar Google',
    ],
    notIncluded: [],
    popular: true,
    cta: 'Începe perioada de probă',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: { monthly: 399, yearly: 319 },
    description: 'Pentru rețele și operațiuni mari',
    features: [
      'Tot din Professional +',
      'Multi-locație (mai multe puncte de lucru)',
      'Manager de cont dedicat',
      'Integrări custom la cerere',
      'SLA garantat 99.9%',
      'Training pentru echipă',
      'Facturare personalizată',
      'Suport 24/7',
    ],
    notIncluded: [],
    popular: false,
    cta: 'Contactează-ne',
  },
];

const faqs = [
  {
    q: 'Pot să încerc gratuit înainte să plătesc?',
    a: 'Da! Toate planurile includ 14 zile gratuit, fără card bancar. Poți testa toate funcționalitățile înainte să te decizi.',
  },
  {
    q: 'Ce se întâmplă dacă depășesc limita de vehicule?',
    a: 'Te vom notifica înainte să atingi limita și poți face upgrade oricând. Nu vom opri serviciul brusc.',
  },
  {
    q: 'Pot să schimb planul ulterior?',
    a: 'Bineînțeles! Poți face upgrade sau downgrade oricând. Diferența se va calcula proporțional.',
  },
  {
    q: 'Cum funcționează SMS Gateway propriu?',
    a: 'Instalezi aplicația noastră pe un telefon Android și trimiți SMS-uri de pe numărul tău. Fără costuri extra pentru gateway!',
  },
  {
    q: 'Datele mele sunt sigure?',
    a: 'Folosim criptare SSL, servere în UE (România) și respectăm GDPR. Datele tale sunt în siguranță.',
  },
  {
    q: 'Pot anula abonamentul oricând?',
    a: 'Da, poți anula oricând fără penalități. Vei avea acces până la sfârșitul perioadei plătite.',
  },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AutoEverything</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-300 hover:text-white transition">
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Înregistrare
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Prețuri simple, fără surprize
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 mb-8"
          >
            Alege planul potrivit pentru afacerea ta. Toate includ 14 zile gratuit.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 p-1 bg-slate-800 rounded-xl"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                !annual ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunar
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                annual ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Anual
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                -20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-2 border-blue-400 scale-105'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">
                      Cel mai popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'bg-white/20' : 'bg-blue-500/20'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-blue-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                </div>

                <p className={`mb-6 ${plan.popular ? 'text-blue-200' : 'text-slate-400'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    {annual ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className={plan.popular ? 'text-blue-200' : 'text-slate-400'}>
                    {' '}RON/lună
                  </span>
                  {annual && (
                    <div className={`text-sm ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                      Facturat anual ({plan.price.yearly * 12} RON/an)
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-blue-300' : 'text-emerald-400'
                      }`} />
                      <span className={plan.popular ? 'text-blue-100' : 'text-slate-300'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Întrebări frecvente
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 bg-slate-800 border border-slate-700 rounded-xl"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Gata să începi?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            14 zile gratuit. Fără card bancar. Anulezi oricând.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition"
          >
            Creează cont gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-400" />
            <span className="text-white font-semibold">AutoEverything</span>
          </div>
          <p className="text-slate-400">
            © 2025 AutoEverything. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  );
}
