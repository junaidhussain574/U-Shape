import { useState, useEffect, useCallback } from 'react';
import { crestronService } from './crestronService';

/**
 * Hook to track Crestron Connection State
 */
export function useCrestronConnection() {
  const [connection, setConnection] = useState(crestronService.connectionState);

  useEffect(() => {
    const unsubscribe = crestronService.subscribeConnection((state) => {
      setConnection({ ...state });
    });
    return unsubscribe;
  }, []);

  const reconnect = useCallback((host, ipId, roomId) => {
    crestronService.reconnect(host, ipId, roomId);
  }, []);

  return {
    ...connection,
    isConnected: connection.cipConnected || connection.isContainerApp,
    reconnect,
  };
}

/**
 * Hook to subscribe to Digital feedback and publish digital signals
 * @param {string|number} join
 * @param {boolean} [initialValue=false]
 */
export function useCrestronDigital(join, initialValue = false) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const unsubscribe = crestronService.subscribe('b', join, (val) => {
      setValue(Boolean(val));
    });
    return unsubscribe;
  }, [join]);

  const pulse = useCallback((durationMs = 100) => {
    crestronService.pulseDigital(join, durationMs);
  }, [join]);

  const send = useCallback((val) => {
    crestronService.publishDigital(join, Boolean(val));
  }, [join]);

  const setHigh = useCallback(() => send(true), [send]);
  const setLow = useCallback(() => send(false), [send]);
  const toggle = useCallback(() => send(!value), [send, value]);

  return { value, pulse, send, setHigh, setLow, toggle };
}

/**
 * Hook to subscribe to Analog feedback and publish analog signals (0-65535)
 * @param {string|number} join
 * @param {number} [initialValue=0]
 */
export function useCrestronAnalog(join, initialValue = 0) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const unsubscribe = crestronService.subscribe('n', join, (val) => {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        setValue(num);
      }
    });
    return unsubscribe;
  }, [join]);

  const send = useCallback((val) => {
    crestronService.publishAnalog(join, val);
  }, [join]);

  return { value, send, setValue };
}

/**
 * Hook to subscribe to Serial (string) feedback and publish serial signals
 * @param {string|number} join
 * @param {string} [initialValue='']
 */
export function useCrestronSerial(join, initialValue = '') {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const unsubscribe = crestronService.subscribe('s', join, (val) => {
      setValue(String(val ?? ''));
    });
    return unsubscribe;
  }, [join]);

  const send = useCallback((val) => {
    crestronService.publishSerial(join, val);
  }, [join]);

  return { value, send, setValue };
}
