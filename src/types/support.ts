// Нормализованный тип деталей заказа — работает для любой платформы
export interface OrderDetails {
  platform: string
  platformLabel: string
  orderId: string | number
  productName: string
  productId?: string
  buyerEmail?: string
  buyerIp?: string
  paymentMethod?: string
  paymentAggregator?: string
  status: string
  statusColor: 'green' | 'yellow' | 'red' | 'gray'
  amount?: number
  currency?: string
  profit?: number
  createdAt?: string
  paidAt?: string
  options?: { id: number; name: string; user_data: string }[]
  lockState?: string
  orderUrl?: string
}

export interface QuickReply {
  id: string
  platform: string
  title: string
  body: string
  sort_order: number
}

export interface ProcedureStep {
  text: string
  note?: string
}

export interface Procedure {
  id: string
  platform: string
  title: string
  steps: ProcedureStep[]
  sort_order: number
}
