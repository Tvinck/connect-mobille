// Тарифы «Ручной регистрации» под Авито — цены уже с учётом комиссий/процентов.
// ВАЖНО: этот список — источник правды на клиенте, но цена ОБЯЗАТЕЛЬНО валидируется
// на сервере (Connect API) при инициации оплаты, чтобы её нельзя было подменить.

export interface Tariff {
  guaranteeMonths: number;
  price: number; // рубли
  label: string;
}

export const AVITO_TARIFFS: Tariff[] = [
  { guaranteeMonths: 1, price: 400, label: 'Гарантия 1 месяц' },
  { guaranteeMonths: 2, price: 550, label: 'Гарантия 2 месяца' },
  { guaranteeMonths: 3, price: 650, label: 'Гарантия 3 месяца' },
  { guaranteeMonths: 10, price: 900, label: 'Гарантия 10 месяцев' },
  { guaranteeMonths: 12, price: 1300, label: 'Гарантия 12 месяцев' },
];

export function tariffByMonths(months: number): Tariff | undefined {
  return AVITO_TARIFFS.find((t) => t.guaranteeMonths === months);
}

export const REGISTRATION_PLATFORMS = [
  { key: 'avito', label: 'Авито' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'other', label: 'Другое' },
] as const;

export type RegistrationPlatform = (typeof REGISTRATION_PLATFORMS)[number]['key'];

// Согласующий по умолчанию — Артём Кошелев (users.id)
export const DEFAULT_APPROVER = {
  id: '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6',
  name: 'Артём Кошелев',
  handle: '@art.koshelev',
};

// Базовый адрес боевого сайта bazzar serts для генерации спец-ссылки
export const BAZZAR_SERTS_URL = 'https://bazzar-serts.shop';

// Генерация короткого кода для ссылки /r/<code>
export function generateRegistrationCode(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

export const registrationStatusMeta: Record<
  string,
  { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'blue' }
> = {
  thinking: { label: 'Думает', tone: 'amber' },
  awaiting_payment: { label: 'Ждёт оплату', tone: 'blue' },
  paid: { label: 'Оплачено', tone: 'green' },
  refused: { label: 'Отказался', tone: 'red' },
};
