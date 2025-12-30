import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, Search, MapPin, Star, Clock, Phone, Shield,
  Calendar, CheckCircle, ArrowRight, Filter, Navigation,
  Zap, FileText, AlertCircle
} from 'lucide-react';

// Mock data for stations - în producție va veni de la API
const mockStations = [
  {
    id: '1',
    name: 'MISEDA INSPECT SRL',
    address: 'Str. Bogdan Vodă 125, Rădăuți',
    county: 'Suceava',
    rating: 4.9,
    reviewCount: 127,
    distance: 2.5,
    services: ['ITP', 'Verificări tahograf'],
    nextAvailable: '2024-12-31T09:00:00',
    priceRange: { itp: '100-200 RON' },
    isVerified: true,
    phone: '0756 596 565',
  },
  {
    id: '2',
    name: 'AUTO SERVICE PRIMA',
    address: 'Str. Principală 45, Suceava',
    county: 'Suceava',
    rating: 4.7,
    reviewCount: 89,
    distance: 15.3,
    services: ['ITP', 'Service auto', 'Vulcanizare'],
    nextAvailable: '2024-12-30T14:00:00',
    priceRange: { itp: '120-180 RON' },
    isVerified: true,
    phone: '0745 123 456',
  },
  {
    id: '3',
    name: 'STAȚIE ITP BUCOVINA',
    address: 'Str. Tudor Vladimirescu 78, Gura Humorului',
    county: 'Suceava',
    rating: 4.5,
    reviewCount: 56,
    distance: 25.0,
    services: ['ITP'],
    nextAvailable: '2024-12-30T10:00:00',
    priceRange: { itp: '90-150 RON' },
    isVerified: false,
    phone: '0744 987 654',
  },
];

const counties = [
  'București', 'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud',
  'Botoșani', 'Brașov', 'Brăila', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj',
  'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj',
  'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți',
  'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava',
  'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
];

const serviceTypes = [
  { id: 'itp', label: 'Inspecție ITP', icon: Shield },
  { id: 'rca', label: 'Asigurare RCA', icon: FileText },
  { id: 'service', label: 'Service Auto', icon: Car },
  { id: 'tire', label: 'Anvelope', icon: Zap },
];

export function PublicMarketplacePage() {
  const [selectedService, setSelectedService] = useState('itp');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const formatNextAvailable = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Azi, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Mâine, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('ro-RO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AutoEverything</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/cauta" className="text-white font-medium">
                Caută servicii
              </Link>
              <Link to="/verificare-itp" className="text-slate-300 hover:text-white transition">
                Verifică ITP
              </Link>
              <Link to="/pentru-afaceri" className="text-slate-300 hover:text-white transition">
                Pentru afaceri
              </Link>
            </div>

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

      {/* Hero + Search */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Găsește cele mai bune servicii auto
            </h1>
            <p className="text-slate-400 text-lg">
              ITP, RCA, Service, Anvelope - toate într-un singur loc
            </p>
          </motion.div>

          {/* Service Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            {serviceTypes.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                  selectedService === service.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <service.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{service.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selectează județul</option>
                  {counties.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Caută după nume sau adresă..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Caută
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
              >
                <Filter className="w-4 h-4" />
                Filtre avansate
              </button>
              <button className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                <Navigation className="w-4 h-4" />
                Folosește locația mea
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400">
              {mockStations.length} stații găsite
              {selectedCounty && ` în ${selectedCounty}`}
            </p>
            <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
              <option>Sortează: Cele mai apropiate</option>
              <option>Sortează: Cele mai bine cotate</option>
              <option>Sortează: Disponibilitate</option>
              <option>Sortează: Preț</option>
            </select>
          </div>

          <div className="space-y-4">
            {mockStations.map((station, index) => (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Station Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-white">{station.name}</h3>
                          {station.isVerified && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificat
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {station.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400 mb-1">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-white font-bold">{station.rating}</span>
                          <span className="text-slate-400 text-sm">({station.reviewCount})</span>
                        </div>
                        <p className="text-slate-400 text-sm">{station.distance} km</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {station.services.map((service) => (
                        <span
                          key={service}
                          className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Disponibil: {formatNextAvailable(station.nextAvailable)}</span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        ITP: {station.priceRange.itp}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 md:w-48">
                    <Link
                      to={`/statie/${station.id}/programare`}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Programează
                    </Link>
                    <a
                      href={`tel:${station.phone.replace(/\s/g, '')}`}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Sună
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ITP Check Section */}
      <section className="py-16 px-4 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-center"
          >
            <Shield className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Verifică valabilitatea ITP-ului
            </h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Introdu numărul de înmatriculare pentru a verifica când expiră ITP-ul și pentru a primi notificări automate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Ex: SV 01 ABC"
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-transparent uppercase"
              />
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2">
                Verifică
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Cum funcționează?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Caută',
                description: 'Găsește stații ITP, service-uri sau asigurări în zona ta.',
                icon: Search,
              },
              {
                step: '2',
                title: 'Compară',
                description: 'Vezi prețuri, recenzii și disponibilitate în timp real.',
                icon: Star,
              },
              {
                step: '3',
                title: 'Programează',
                description: 'Rezervă online și primește confirmare instant.',
                icon: Calendar,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Businesses */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ai o stație ITP sau service auto?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Înscrie-te gratuit și primește clienți noi. Gestionează programările, trimite notificări automate și crește afacerea.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition"
          >
            Înregistrează-ți afacerea
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
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link to="/termeni" className="hover:text-white transition">Termeni</Link>
            <Link to="/confidentialitate" className="hover:text-white transition">Confidențialitate</Link>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 AutoEverything. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  );
}
