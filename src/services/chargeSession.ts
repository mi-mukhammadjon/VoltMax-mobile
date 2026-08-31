import { SessionsAPI } from './api';
import { ChargingSession } from '@/types';

// Mock stansiyalarda backend sessiyani darhol (201) qaytaradi. Haqiqiy charger'ga
// ulangan stansiyalarda esa backend 202 qaytaradi va RemoteStartTransaction
// charger'ga yuboriladi — charger o'zi StartTransaction bilan javob berguncha
// (odatda bir necha soniya, foydalanuvchi ulagichni mashinaga ulashini kutish
// bilan bir vaqtda) shu yerda /sessions/active/ so'rab turiladi (poll).
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

/**
 * Ulanish jarayonining bosqichlari — UI shular asosida foydalanuvchiga
 * "hozir nima bo'layotganini" ko'rsatadi (ConnectorConnectingOverlay).
 *
 *  requesting    → serverga so'rov yuborilmoqda
 *  contacting    → server charger'ga RemoteStartTransaction yubordi (202)
 *  awaiting_plug → charger javobini kutamiz; foydalanuvchi ulagichni ulashi kerak
 *  started       → sessiya boshlandi
 */
export type ChargingStage = 'requesting' | 'contacting' | 'awaiting_plug' | 'started';

export class ChargerTimeoutError extends Error {}
export class ChargingCancelledError extends Error {}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StartChargingOptions {
  /** Har bosqich boshlanganda chaqiriladi */
  onStage?: (stage: ChargingStage) => void;
  cancelRef?: { current: boolean };
}

export async function startChargingSession(
  stationId: string,
  connectorId?: string,
  options?: StartChargingOptions
): Promise<ChargingSession> {
  options?.onStage?.('requesting');
  const res = await SessionsAPI.start(stationId, connectorId);
  if (res.status === 201) {
    options?.onStage?.('started');
    return res.data as ChargingSession;
  }

  // 202 — real charger, RemoteStartTransaction yuborildi. Foydalanuvchi
  // ulagichni mashinaga ulashini va charger javob berishini kutamiz.
  options?.onStage?.('contacting');

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let announcedPlugStage = false;

  while (Date.now() < deadline) {
    if (options?.cancelRef?.current) {
      throw new ChargingCancelledError('Bekor qilindi');
    }
    await delay(POLL_INTERVAL_MS);
    if (options?.cancelRef?.current) {
      throw new ChargingCancelledError('Bekor qilindi');
    }

    // Birinchi poll'dan keyin charger buyruqni qabul qilgan deb hisoblanadi —
    // endi to'siq foydalanuvchi tomonida: ulagichni avtomobilga ulash kerak.
    if (!announcedPlugStage) {
      announcedPlugStage = true;
      options?.onStage?.('awaiting_plug');
    }

    const activeRes = await SessionsAPI.getActive();
    if (activeRes.status === 200 && activeRes.data) {
      options?.onStage?.('started');
      return activeRes.data as ChargingSession;
    }
  }
  throw new ChargerTimeoutError("Charger javob bermadi, birozdan so'ng qayta urinib ko'ring");
}
