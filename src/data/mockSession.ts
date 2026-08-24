import { ChargingSession } from '@/types';

// TODO: SessionsAPI.getById(sessionId) bilan almashtiriladi,
// WebSocket orqali currentPercent/kwhCharged/costSoFar real-vaqtda yangilanadi

export function getMockSession(sessionId: string): ChargingSession {
  return {
    id: sessionId,
    stationId: 'st-003',
    startedAt: new Date().toISOString(),
    status: 'charging',
    currentPercent: 96,
    powerKw: 18,
    elapsedSeconds: 0,
    costSoFar: 20531,

    remainingSeconds: 58 * 60 + 37,
    kwhCharged: 10.806,
    pricePerKwh: 1900,
    currentAmps: 45.3,
    voltageV: 411.5,
    parkingFeePerMin: 500,
    connectorLabel: 'A',
  };
}
