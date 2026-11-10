// Puente con el móvil (solo en la app de Android/iPhone). Se empaqueta con esbuild en www/js/native.bundle.js.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const native = Capacitor.isNativePlatform();

window.MareaNative = {
  isNative: native,
  platform: Capacitor.getPlatform(),
  async permission() {
    if (!native) return 'unavailable';
    return (await LocalNotifications.checkPermissions()).display;
  },
  async requestPermission() {
    if (!native) return 'unavailable';
    return (await LocalNotifications.requestPermissions()).display;
  },
  /** Sustituye todos los recordatorios pendientes por la lista nueva. */
  async schedule(list) {
    if (!native) return;
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    if (!list.length) return;
    await LocalNotifications.schedule({
      notifications: list.map((n) => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true }, smallIcon: 'ic_stat_marea', isExactNotification: false })),
    });
  },
  async cancelAll() {
    if (!native) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  },
};
