import { supabase } from './supabase';
import { toast } from './toast';

const PUSH_KEY = 'web_push_subscriptions';

export interface PushSub {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function getSubscriptions(): Promise<PushSub[]> {
  const { data } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', PUSH_KEY)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return [];
  try {
    return JSON.parse(data.video_url);
  } catch {
    return [];
  }
}

export async function addSubscription(sub: PushSub): Promise<void> {
  const current = await getSubscriptions();
  const filtered = current.filter(s => s.endpoint !== sub.endpoint);
  filtered.push(sub);
  
  await supabase.from('factory_generations').insert({
    prompt: PUSH_KEY,
    video_url: JSON.stringify(filtered)
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupWebPush() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        // Тихо: не навязываемся, если пользователь отклонил/отложил
        console.info('Push permission not granted:', permission);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID public key missing in configuration');
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      await addSubscription(subscription.toJSON() as PushSub);
      // Успех — тихо, без назойливого уведомления при каждом входе
    } catch (err: any) {
      console.error('Failed to setup Web Push:', err);
      toast('Не удалось включить push-уведомления', 'error');
      throw err;
    }
  } else {
    // Не поддерживается (частый случай на десктопе/iOS-браузере) — тихо
    console.info('Web Push not supported in this browser/OS');
  }
}
