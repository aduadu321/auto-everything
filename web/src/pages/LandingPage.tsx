import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car, Shield, Bell, Calendar, MessageSquare,
  CheckCircle, ArrowRight, Star, Users, Clock,
  Smartphone, Mail, TrendingUp, Award, Menu, X
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Send to API
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AutoEverything</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">Funcționalități</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition">Prețuri</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition">Testimoniale</a>
              <a href="/admin/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                Login
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden bg-slate-800 border-b border-slate-700"
          >
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-slate-300 hover:text-white">Funcționalități</a>
              <a href="#pricing" className="block text-slate-300 hover:text-white">Prețuri</a>
              <a href="#testimonials" className="block text-slate-300 hover:text-white">Testimoniale</a>
              <a href="/admin/login" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center">
                Login
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8"
            >
              <Star className="w-4 h-4" />
              <span>Platforma #1 pentru stații ITP din România</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            >
              Tot ce ai nevoie pentru
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                mașina ta
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-slate-400 max-w-3xl mx-auto mb-12"
            >
              ITP, RCA, Rovinieta, Service - toate într-un singur loc.
              Notificări automate, programări online și istoric complet pentru vehiculele tale.
            </motion.p>

            {/* Waitlist Form */}
            <motion.div variants={fadeInUp} className="max-w-md mx-auto">
              {!submitted ? (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Email-ul tău"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Se trimite...' : 'Înscrie-te gratuit'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">
                    Fără spam. Vei primi doar actualizări importante.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Ești pe listă!</h3>
                  <p className="text-slate-400">Te vom anunța când lansăm.</p>
                </motion.div>
              )}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 flex flex-wrap items-center justify-center gap-8"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-5 h-5" />
                <span><strong className="text-white">500+</strong> stații înregistrate</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MessageSquare className="w-5 h-5" />
                <span><strong className="text-white">50,000+</strong> notificări/lună</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <TrendingUp className="w-5 h-5" />
                <span><strong className="text-white">+35%</strong> clienți returnați</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tot ce ai nevoie, într-o singură platformă
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              De la gestionarea clienților până la notificări automate -
              totul automatizat pentru afacerea ta.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Programări Online',
                description: 'Clienții își fac programare direct de pe site. Calendar inteligent cu disponibilități în timp real.'
              },
              {
                icon: Bell,
                title: 'Notificări Automate',
                description: 'SMS și email automat la 30, 14, 7, 3 și 1 zi înainte de expirarea ITP-ului.'
              },
              {
                icon: Shield,
                title: 'Verificare RCA',
                description: 'Verificare automată status RCA prin ASF. Clienții sunt notificați înainte de expirare.'
              },
              {
                icon: Smartphone,
                title: 'SMS Gateway Propriu',
                description: 'Trimite SMS-uri de pe numărul tău de telefon. Fără costuri extra pentru gateway.'
              },
              {
                icon: Mail,
                title: 'Email Marketing',
                description: 'Campanii email personalizate. Template-uri gata făcute pentru fidelizare clienți.'
              },
              {
                icon: TrendingUp,
                title: 'Dashboard & Rapoarte',
                description: 'Statistici în timp real. Vezi câți clienți revin, rata de conversie și revenue.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-slate-800 border border-slate-700 rounded-2xl hover:border-blue-500/50 transition group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Cum funcționează?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              3 pași simpli pentru a-ți automatiza afacerea
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Creează cont',
                description: 'Înregistrează-te gratuit în mai puțin de 2 minute. Nu este nevoie de card.'
              },
              {
                step: '2',
                title: 'Importă clienții',
                description: 'Încarcă lista de clienți din Excel sau adaugă-i manual. Noi facem restul.'
              },
              {
                step: '3',
                title: 'Automatizează',
                description: 'Configurează notificările și lasă platforma să lucreze pentru tine 24/7.'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prețuri simple, transparente
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Alege planul potrivit pentru afacerea ta
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '99',
                description: 'Perfect pentru stații mici',
                features: [
                  'Până la 200 vehicule',
                  'Notificări SMS automate',
                  'Programări online',
                  'Dashboard basic',
                  'Suport email'
                ],
                popular: false
              },
              {
                name: 'Professional',
                price: '199',
                description: 'Cel mai popular',
                features: [
                  'Vehicule nelimitate',
                  'SMS + Email notificări',
                  'Programări online',
                  'Dashboard avansat',
                  'API access',
                  'Suport prioritar',
                  'White-label (logo propriu)'
                ],
                popular: true
              },
              {
                name: 'Enterprise',
                price: '399',
                description: 'Pentru rețele de stații',
                features: [
                  'Multi-locație',
                  'Tot din Professional',
                  'Manager dedicat',
                  'Integrări custom',
                  'SLA garantat',
                  'Training echipă'
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-2 border-blue-400 scale-105'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-blue-400 text-blue-900 text-sm font-semibold rounded-full">
                      Cel mai popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className={plan.popular ? 'text-blue-200' : 'text-slate-400'}>{plan.description}</p>
                <div className="my-6">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className={plan.popular ? 'text-blue-200' : 'text-slate-400'}> RON/lună</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${plan.popular ? 'text-blue-300' : 'text-emerald-400'}`} />
                      <span className={plan.popular ? 'text-blue-100' : 'text-slate-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  Începe acum
                </button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-slate-400 mt-8">
            Toate planurile includ 14 zile gratuit. Fără card bancar.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ce spun clienții noștri
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ion Popescu',
                role: 'Stație ITP Suceava',
                content: 'De când folosim AutoEverything, rata de revenire a clienților a crescut cu 40%. Sistemul de notificări automate e fantastic!',
                rating: 5
              },
              {
                name: 'Maria Ionescu',
                role: 'Service Auto București',
                content: 'Am încercat multe soluții, dar aceasta e singura care face totul simplu. Clienții adoră că pot programa online.',
                rating: 5
              },
              {
                name: 'Andrei Gheorghe',
                role: 'Rețea 5 stații ITP',
                content: 'Gestionez 5 stații dintr-un singur loc. Dashboard-ul e foarte clar și rapoartele mă ajută să iau decizii mai bune.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-slate-800 border border-slate-700 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="p-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Gata să-ți automatizezi afacerea?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Începe gratuit azi. Fără card bancar, fără obligații.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
            >
              Creează cont gratuit
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AutoEverything</span>
              </div>
              <p className="text-slate-400">
                Platforma completă pentru gestionarea afacerii tale auto.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produs</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Funcționalități</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Prețuri</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Companie</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Despre noi</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Termeni și condiții</a></li>
                <li><a href="#" className="hover:text-white transition">Politica de confidențialitate</a></li>
                <li><a href="#" className="hover:text-white transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400">
              © 2025 AutoEverything. Toate drepturile rezervate.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Made with ❤️ in România</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
