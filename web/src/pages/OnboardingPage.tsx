import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Car, Upload, Users, Bell, CheckCircle, ArrowRight, ArrowLeft,
  FileSpreadsheet, Clock, MessageSquare, Smartphone, Sparkles
} from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Bine ai venit!',
    description: 'Să configurăm contul tău în câțiva pași simpli',
  },
  {
    id: 'import',
    title: 'Importă clienții',
    description: 'Încarcă lista ta de clienți existenți',
  },
  {
    id: 'schedule',
    title: 'Program de lucru',
    description: 'Setează orele când ești disponibil',
  },
  {
    id: 'notifications',
    title: 'Notificări',
    description: 'Configurează când să trimitem reminder-uri',
  },
  {
    id: 'sms',
    title: 'SMS Gateway',
    description: 'Trimite SMS-uri de pe numărul tău',
  },
  {
    id: 'complete',
    title: 'Gata!',
    description: 'Contul tău este configurat',
  },
];

const daysOfWeek = [
  { id: 1, name: 'Luni', short: 'L' },
  { id: 2, name: 'Marți', short: 'Ma' },
  { id: 3, name: 'Miercuri', short: 'Mi' },
  { id: 4, name: 'Joi', short: 'J' },
  { id: 5, name: 'Vineri', short: 'V' },
  { id: 6, name: 'Sâmbătă', short: 'S' },
  { id: 0, name: 'Duminică', short: 'D' },
];

const notificationDays = [30, 14, 7, 3, 1];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [schedule, setSchedule] = useState(
    daysOfWeek.map(day => ({
      dayOfWeek: day.id,
      isOpen: day.id !== 0 && day.id !== 6,
      openTime: '08:00',
      closeTime: '17:00',
    }))
  );

  const [notifications, setNotifications] = useState({
    enableSms: true,
    enableEmail: true,
    reminderDays: [30, 14, 7, 3, 1],
    sendTime: '09:00',
  });

  const [smsGateway, setSmsGateway] = useState({
    useOwnGateway: false,
    deviceConnected: false,
  });

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = async () => {
    setIsLoading(true);

    try {
      // Save all settings to API
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          notifications,
          smsGateway,
        }),
      });

      navigate('/admin');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSchedule(prev =>
      prev.map(s =>
        s.dayOfWeek === dayId ? { ...s, isOpen: !s.isOpen } : s
      )
    );
  };

  const toggleReminderDay = (day: number) => {
    setNotifications(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition ${
                index < currentStep
                  ? 'bg-emerald-500'
                  : index === currentStep
                  ? 'bg-blue-500'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <motion.div
          className="bg-slate-800 border border-slate-700 rounded-2xl p-8"
          layout
        >
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bine ai venit la AutoEverything!
                </h2>
                <p className="text-slate-400 mb-8">
                  În următorii pași vom configura contul tău pentru a fi gata de utilizare în mai puțin de 5 minute.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left mb-8">
                  {[
                    { icon: Users, text: 'Importă clienții existenți' },
                    { icon: Clock, text: 'Setează programul de lucru' },
                    { icon: Bell, text: 'Configurează notificările' },
                    { icon: Smartphone, text: 'Conectează SMS Gateway' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-300">
                      <item.icon className="w-5 h-5 text-blue-400" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Import Clients */}
            {currentStep === 1 && (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Importă clienții</h2>
                    <p className="text-slate-400">Opțional - poți face asta mai târziu</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer mb-6">
                  <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">
                    Trage fișierul Excel aici
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    sau click pentru a selecta
                  </p>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
                    Selectează fișier
                  </button>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-2">
                    Fișierul trebuie să conțină coloanele:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Nume', 'Telefon', 'Nr. Înmatriculare', 'Data expirare ITP'].map((col) => (
                      <span key={col} className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Schedule */}
            {currentStep === 2 && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Program de lucru</h2>
                    <p className="text-slate-400">Când pot clienții face programări?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {daysOfWeek.map((day) => {
                    const daySchedule = schedule.find(s => s.dayOfWeek === day.id);
                    return (
                      <div
                        key={day.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition ${
                          daySchedule?.isOpen ? 'bg-slate-700' : 'bg-slate-800'
                        }`}
                      >
                        <button
                          onClick={() => toggleDay(day.id)}
                          className={`w-10 h-6 rounded-full transition ${
                            daySchedule?.isOpen ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition transform ${
                              daySchedule?.isOpen ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-white font-medium w-24">{day.name}</span>
                        {daySchedule?.isOpen && (
                          <div className="flex items-center gap-2 ml-auto">
                            <input
                              type="time"
                              value={daySchedule.openTime}
                              onChange={(e) =>
                                setSchedule(prev =>
                                  prev.map(s =>
                                    s.dayOfWeek === day.id
                                      ? { ...s, openTime: e.target.value }
                                      : s
                                  )
                                )
                              }
                              className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="time"
                              value={daySchedule.closeTime}
                              onChange={(e) =>
                                setSchedule(prev =>
                                  prev.map(s =>
                                    s.dayOfWeek === day.id
                                      ? { ...s, closeTime: e.target.value }
                                      : s
                                  )
                                )
                              }
                              className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                        )}
                        {!daySchedule?.isOpen && (
                          <span className="text-slate-500 ml-auto">Închis</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Notifications */}
            {currentStep === 3 && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Notificări automate</h2>
                    <p className="text-slate-400">Când să trimitem reminder-uri?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Channels */}
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Canale de comunicare</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, enableSms: !prev.enableSms }))}
                        className={`flex-1 p-4 rounded-xl border-2 transition ${
                          notifications.enableSms
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 bg-slate-700'
                        }`}
                      >
                        <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${
                          notifications.enableSms ? 'text-blue-400' : 'text-slate-400'
                        }`} />
                        <span className={notifications.enableSms ? 'text-white' : 'text-slate-400'}>
                          SMS
                        </span>
                      </button>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, enableEmail: !prev.enableEmail }))}
                        className={`flex-1 p-4 rounded-xl border-2 transition ${
                          notifications.enableEmail
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 bg-slate-700'
                        }`}
                      >
                        <Bell className={`w-6 h-6 mx-auto mb-2 ${
                          notifications.enableEmail ? 'text-blue-400' : 'text-slate-400'
                        }`} />
                        <span className={notifications.enableEmail ? 'text-white' : 'text-slate-400'}>
                          Email
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Reminder Days */}
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Trimite reminder cu X zile înainte de expirare
                    </label>
                    <div className="flex gap-2">
                      {notificationDays.map((day) => (
                        <button
                          key={day}
                          onClick={() => toggleReminderDay(day)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            notifications.reminderDays.includes(day)
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {day} zile
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send Time */}
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Ora de trimitere</label>
                    <input
                      type="time"
                      value={notifications.sendTime}
                      onChange={(e) => setNotifications(prev => ({ ...prev, sendTime: e.target.value }))}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: SMS Gateway */}
            {currentStep === 4 && (
              <motion.div
                key="sms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">SMS Gateway</h2>
                    <p className="text-slate-400">Trimite SMS-uri de pe numărul tău</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    onClick={() => setSmsGateway(prev => ({ ...prev, useOwnGateway: false }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      !smsGateway.useOwnGateway
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        !smsGateway.useOwnGateway ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                      }`} />
                      <div>
                        <h3 className="text-white font-medium">Folosește gateway-ul nostru</h3>
                        <p className="text-sm text-slate-400">SMS-urile vor fi trimise de pe un număr generic</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSmsGateway(prev => ({ ...prev, useOwnGateway: true }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      smsGateway.useOwnGateway
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        smsGateway.useOwnGateway ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                      }`} />
                      <div>
                        <h3 className="text-white font-medium">Folosește propriul telefon Android</h3>
                        <p className="text-sm text-slate-400">SMS-urile vor fi trimise de pe numărul tău</p>
                      </div>
                    </div>
                  </div>

                  {smsGateway.useOwnGateway && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-700/50 rounded-xl p-4"
                    >
                      <p className="text-sm text-slate-300 mb-4">
                        Descarcă aplicația SMS Gateway pe telefonul Android:
                      </p>
                      <a
                        href="/apps/sms-gateway/sms-gateway.apk"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                      >
                        <Smartphone className="w-4 h-4" />
                        Descarcă APK
                      </a>
                      <p className="text-xs text-slate-500 mt-2">
                        Poți configura asta și mai târziu din setări.
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Totul e configurat!
                </h2>
                <p className="text-slate-400 mb-8">
                  Contul tău este gata. Poți începe să folosești platforma.
                </p>

                <div className="bg-slate-700/50 rounded-xl p-6 text-left mb-8">
                  <h3 className="text-white font-medium mb-4">Ce urmează:</h3>
                  <ul className="space-y-3">
                    {[
                      'Adaugă primul client din dashboard',
                      'Testează trimiterea unui SMS',
                      'Configurează template-urile de mesaje',
                      'Activează programările online',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">
                          {i + 1}
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && currentStep < 5 && (
              <button
                onClick={prevStep}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Înapoi
              </button>
            )}

            {currentStep === 0 && (
              <button
                onClick={nextStep}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                Să începem!
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {currentStep > 0 && currentStep < 5 && (
              <button
                onClick={nextStep}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {currentStep === 1 ? 'Sari peste' : 'Continuă'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                onClick={finishOnboarding}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Se salvează...' : 'Mergi la Dashboard'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
