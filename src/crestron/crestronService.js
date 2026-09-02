/**
 * Crestron CH5 Communication Service
 * Handles WebXPanel initialization, connection lifecycle, and CrComLib event/state bridge.
 */

class CrestronService {
  constructor() {
    this.listeners = new Set();
    this.connectionState = {
      isInitialized: false,
      isActive: false,
      isContainerApp: false,
      wsConnected: false,
      cipConnected: false,
      error: null,
      host: '192.168.40.29',
      ipId: '0x03',
      roomId: '',
    };
    this.init();
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.connectionState });
      } catch (e) {
        console.error('Error in CrestronService listener:', e);
      }
    }
  }

  subscribeConnection(callback) {
    this.listeners.add(callback);
    callback({ ...this.connectionState });
    return () => this.listeners.delete(callback);
  }

  init(customConfig = {}) {
    if (typeof window === 'undefined') return;

    // Check if WebXPanel is available
    if (window.WebXPanel && typeof window.WebXPanel.getWebXPanel === 'function') {
      try {
        const isContainer = window.WebXPanel.runsInContainerApp && window.WebXPanel.runsInContainerApp();
        this.connectionState.isContainerApp = !!isContainer;

        const { WebXPanel, isActive, WebXPanelConfigParams, WebXPanelEvents } =
          window.WebXPanel.getWebXPanel(!isContainer);

        this.connectionState.isActive = !!isActive;

        if (isActive && WebXPanelConfigParams) {
          const host = customConfig.host || this.connectionState.host || (window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.40.29');
          const ipId = customConfig.ipId || this.connectionState.ipId || '0x03';
          const roomId = customConfig.roomId || this.connectionState.roomId || '';

          this.connectionState.host = host;
          this.connectionState.ipId = ipId;
          this.connectionState.roomId = roomId;

          WebXPanelConfigParams.host = host;
          WebXPanelConfigParams.ipId = ipId;
          if (roomId) WebXPanelConfigParams.roomId = roomId;

          console.log('[Crestron] Initializing WebXPanel with config:', JSON.stringify(WebXPanelConfigParams));
          WebXPanel.initialize(WebXPanelConfigParams);
        }

        if (WebXPanelEvents && !this.connectionState.isInitialized) {
          window.addEventListener(WebXPanelEvents.CONNECT_WS, ({ detail }) => {
            console.log('[Crestron] WebSocket connected:', detail);
            this.connectionState.wsConnected = true;
            this.connectionState.error = null;
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.CONNECT_CIP, ({ detail }) => {
            console.log('[Crestron] CIP connected:', detail);
            this.connectionState.cipConnected = true;
            this.connectionState.wsConnected = true;
            this.connectionState.error = null;
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.DISCONNECT_WS, ({ detail }) => {
            console.log('[Crestron] WebSocket disconnected:', detail);
            this.connectionState.wsConnected = false;
            this.connectionState.cipConnected = false;
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.DISCONNECT_CIP, ({ detail }) => {
            console.log('[Crestron] CIP disconnected:', detail);
            this.connectionState.cipConnected = false;
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.ERROR_WS, ({ detail }) => {
            console.error('[Crestron] WebSocket Error:', detail);
            this.connectionState.wsConnected = false;
            this.connectionState.cipConnected = false;
            this.connectionState.error = 'WebSocket Connection Failed';
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.AUTHENTICATION_FAILED, ({ detail }) => {
            console.error('[Crestron] Authentication failed:', detail);
            this.connectionState.error = 'Authentication Failed';
            this.notify();
          });

          window.addEventListener(WebXPanelEvents.NOT_AUTHORIZED, ({ detail }) => {
            console.warn('[Crestron] Not authorized, redirecting:', detail);
            if (detail && detail.redirectTo) {
              window.location.href = detail.redirectTo;
            }
          });
        }

        this.connectionState.isInitialized = true;
        this.notify();
      } catch (err) {
        console.error('[Crestron] Failed to initialize WebXPanel:', err);
        this.connectionState.error = err.message;
        this.notify();
      }
    } else {
      console.warn('[Crestron] WebXPanel library not detected. Running in standalone / simulation mode.');
    }
  }

  reconnect(host, ipId, roomId = '') {
    this.init({ host, ipId, roomId });
  }

  /**
   * Publish a Digital (Boolean) signal to Crestron
   * @param {string|number} join
   * @param {boolean} value
   */
  publishDigital(join, value) {
    const joinStr = String(join);
    if (typeof window !== 'undefined' && window.CrComLib) {
      window.CrComLib.publishEvent('b', joinStr, Boolean(value));
    } else {
      console.log(`[Crestron Mock] Publish Digital [${joinStr}] = ${value}`);
    }
  }

  /**
   * Pulse a Digital signal (true then false after duration)
   * @param {string|number} join
   * @param {number} durationMs
   */
  pulseDigital(join, durationMs = 100) {
    this.publishDigital(join, true);
    setTimeout(() => {
      this.publishDigital(join, false);
    }, durationMs);
  }

  /**
   * Publish an Analog (Numeric) signal to Crestron (0-65535)
   * @param {string|number} join
   * @param {number} value
   */
  publishAnalog(join, value) {
    const joinStr = String(join);
    const numValue = Math.max(0, Math.min(65535, Math.round(Number(value) || 0)));
    if (typeof window !== 'undefined' && window.CrComLib) {
      window.CrComLib.publishEvent('n', joinStr, numValue);
    } else {
      console.log(`[Crestron Mock] Publish Analog [${joinStr}] = ${numValue}`);
    }
  }

  /**
   * Publish a Serial (String) signal to Crestron
   * @param {string|number} join
   * @param {string} value
   */
  publishSerial(join, value) {
    const joinStr = String(join);
    const strVal = String(value ?? '');
    if (typeof window !== 'undefined' && window.CrComLib) {
      window.CrComLib.publishEvent('s', joinStr, strVal);
    } else {
      console.log(`[Crestron Mock] Publish Serial [${joinStr}] = "${strVal}"`);
    }
  }

  /**
   * Subscribe to a Crestron state feedback
   * @param {'b'|'n'|'s'} type - 'b' (boolean/digital), 'n' (number/analog), 's' (string/serial)
   * @param {string|number} join
   * @param {function} callback
   * @returns {function} Unsubscribe function
   */
  subscribe(type, join, callback) {
    const joinStr = String(join);
    if (typeof window !== 'undefined' && window.CrComLib) {
      const subscriptionId = window.CrComLib.subscribeState(type, joinStr, callback);
      return () => {
        try {
          if (window.CrComLib.unsubscribeState) {
            window.CrComLib.unsubscribeState(type, joinStr, subscriptionId);
          }
        } catch (e) {
          console.warn('[Crestron] Unsubscribe error:', e);
        }
      };
    }
    return () => {};
  }
}

export const crestronService = new CrestronService();
export default crestronService;
