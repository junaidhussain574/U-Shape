import React, { useState, useEffect } from 'react';
import {
  useCrestronConnection,
  useCrestronDigital,
  useCrestronAnalog,
  useCrestronSerial,
} from '../crestron/useCrestron';
import {
  Wifi,
  WifiOff,
  Activity,
  Sliders,
  Radio,
  Send,
  Settings,
  Sun,
  Volume2,
  VolumeX,
  Power,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function CrestronDashboard() {
  const connection = useCrestronConnection();

  // Digital Joins 1, 2, 3 (Interlock Scene/Option Select)
  const scene1 = useCrestronDigital(1);
  const scene2 = useCrestronDigital(2);
  const scene3 = useCrestronDigital(3);

  // Digital Join 4 (Power Toggle) & 5 (Mute Toggle)
  const power = useCrestronDigital(4);
  const mute = useCrestronDigital(5);

  // Analog Join 1 (Master Lighting / Level: 0 - 65535)
  const analog1 = useCrestronAnalog(1, 32767);
  const [localAnalog, setLocalAnalog] = useState(32767);

  // Serial Join 1 (Processor Text / Feedback)
  const serial1 = useCrestronSerial(1, '');
  const [inputSerial, setInputSerial] = useState('');

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [targetHost, setTargetHost] = useState(connection.host || '192.168.40.29');
  const [targetIpId, setTargetIpId] = useState(connection.ipId || '0x03');
  const [targetRoomId, setTargetRoomId] = useState(connection.roomId || '');

  // Keep local analog in sync with Crestron feedback
  useEffect(() => {
    setLocalAnalog(analog1.value);
  }, [analog1.value]);

  const handleAnalogChange = (e) => {
    const val = Number(e.target.value);
    setLocalAnalog(val);
    analog1.send(val);
  };

  const stepAnalog = (amount) => {
    const nextVal = Math.max(0, Math.min(65535, localAnalog + amount));
    setLocalAnalog(nextVal);
    analog1.send(nextVal);
  };

  const handleSendSerial = (e) => {
    if (e) e.preventDefault();
    if (!inputSerial.trim()) return;
    serial1.send(inputSerial);
    setInputSerial('');
  };

  const handleApplySettings = (e) => {
    e.preventDefault();
    connection.reconnect(targetHost, targetIpId, targetRoomId);
    setShowSettings(false);
  };

  const analogPercent = Math.round((localAnalog / 65535) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Connection Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                U-Shape Villa
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  CH5 Control
                </span>
              </h1>
              <p className="text-xs text-slate-400">Crestron CIP / WebXPanel Interface</p>
            </div>
          </div>

          {/* Connection Status Badges */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                connection.isConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/70 shadow-sm shadow-emerald-500/20'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800/70'
              }`}
            >
              {connection.isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online (CIP Connected)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline ({connection.host}:{connection.ipId})</span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span>WS:</span>
              <span className={`w-2 h-2 rounded-full ${connection.wsConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="ml-1">CIP:</span>
              <span className={`w-2 h-2 rounded-full ${connection.cipConnected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Connection Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Processor Connection Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleApplySettings} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Control Processor IP / Host</label>
                <input
                  type="text"
                  value={targetHost}
                  onChange={(e) => setTargetHost(e.target.value)}
                  placeholder="192.168.40.29"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">IP ID (Hex)</label>
                <input
                  type="text"
                  value={targetIpId}
                  onChange={(e) => setTargetIpId(e.target.value)}
                  placeholder="0x03"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Room ID (Optional)</label>
                <input
                  type="text"
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  placeholder="Room identifier"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Connect
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl mx-auto p-6 w-full space-y-6">
        {/* Row 1: Interlock Scenes & Quick Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interlock 3-Button Section (Joins 1, 2, 3) */}
          <section className="lg:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-400" />
                  Scene Interlock (Digital Joins 1, 2, 3)
                </h2>
                <p className="text-xs text-slate-400">
                  Sends pulse on join 1-3. Feedback state lights up active option.
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                Mutual Exclusion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Scene 1 */}
              <button
                onClick={() => scene1.pulse(100)}
                className={`relative group p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                  scene1.value
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    scene1.value ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  <Sun className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base">Day Scene</span>
                <span className="text-xs text-slate-400 mt-1">Digital Join 1</span>
                {scene1.value && (
                  <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </button>

              {/* Scene 2 */}
              <button
                onClick={() => scene2.pulse(100)}
                className={`relative group p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                  scene2.value
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    scene2.value ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  <Activity className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base">Evening Relax</span>
                <span className="text-xs text-slate-400 mt-1">Digital Join 2</span>
                {scene2.value && (
                  <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </button>

              {/* Scene 3 */}
              <button
                onClick={() => scene3.pulse(100)}
                className={`relative group p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                  scene3.value
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    scene3.value ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  <Power className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base">Night / Off</span>
                <span className="text-xs text-slate-400 mt-1">Digital Join 3</span>
                {scene3.value && (
                  <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* Quick Controls Section */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
                <Power className="w-5 h-5 text-emerald-400" />
                System Controls
              </h2>
              <p className="text-xs text-slate-400 mb-4">Digital Toggles & Status</p>

              <div className="space-y-3">
                <button
                  onClick={() => power.toggle()}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    power.value
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Power className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-white">Main Power</div>
                      <div className="text-xs text-slate-400">Join 4</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      power.value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {power.value ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => mute.toggle()}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    mute.value
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {mute.value ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    <div className="text-left">
                      <div className="font-medium text-sm text-white">Audio Mute</div>
                      <div className="text-xs text-slate-400">Join 5</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      mute.value ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {mute.value ? 'MUTED' : 'UNMUTED'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Touchpanel Native Mode</span>
              <span className="font-mono text-slate-300">
                {connection.isContainerApp ? 'Container Enabled' : 'Browser Mode'}
              </span>
            </div>
          </section>
        </div>

        {/* Row 2: Analog Controls & Serial Communication */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analog Slider Section (Join 1) */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Analog Level (Join 1)
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/70 px-3 py-1 rounded-lg">
                    {analogPercent}% ({localAnalog})
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Full 16-bit analog signal range (0 - 65535) with continuous feedback.
              </p>

              {/* Slider & Step Controls */}
              <div className="space-y-6">
                <div className="relative flex items-center gap-4">
                  <button
                    onClick={() => stepAnalog(-1000)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    title="Step Down (-1000)"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="65535"
                      step="256"
                      value={localAnalog}
                      onChange={handleAnalogChange}
                      className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>0 (0%)</span>
                      <span>32767 (50%)</span>
                      <span>65535 (100%)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => stepAnalog(1000)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    title="Step Up (+1000)"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[0, 16384, 32768, 65535].map((presetVal, i) => {
                    const presetLabel = ['0%', '25%', '50%', '100%'][i];
                    return (
                      <button
                        key={presetVal}
                        onClick={() => {
                          setLocalAnalog(presetVal);
                          analog1.send(presetVal);
                        }}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          Math.abs(localAnalog - presetVal) < 1000
                            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {presetLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Feedback State:</span>
              <span className="font-mono text-cyan-300">{analog1.value}</span>
            </div>
          </section>

          {/* Serial String Join Section (Join 1) */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-400" />
                  Serial Text Terminal (Join 1)
                </h2>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/70 px-2.5 py-1 rounded-full">
                  Two-Way String
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Send strings and monitor incoming serial text from SIMPL Windows / Crestron.
              </p>

              {/* Received Serial Box */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Incoming Processor Feedback (Join 1)
                </label>
                <div className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 overflow-y-auto">
                  {serial1.value ? (
                    <span>{serial1.value}</span>
                  ) : (
                    <span className="text-slate-600 italic">No incoming text received yet...</span>
                  )}
                </div>
              </div>

              {/* Send Serial Form */}
              <form onSubmit={handleSendSerial} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transmit Serial String
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputSerial}
                    onChange={(e) => setInputSerial(e.target.value)}
                    placeholder="Enter command or message..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Contract / Direct Joins</span>
              <span className="font-mono text-slate-300">CrComLib active</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        U-Shape Villa Crestron CH5 Control UI • Compiled with @crestron/ch5-utilities-cli
      </footer>
    </div>
  );
}
