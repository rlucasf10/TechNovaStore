export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationData {
  [key: string]: any;
}

export interface ShipmentStatusData {
  orderId: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  customerEmail: string;
}

export interface DelayAlertData {
  orderId: string;
  originalDelivery: Date;
  newEstimatedDelivery: Date;
  customerEmail: string;
  reason?: string;
}

export type NotificationType = 
  | 'order_confirmation'
  | 'shipment_status_update'
  | 'delivery_delay'
  | 'order_cancelled'
  | 'payment_confirmation'
  | 'invoice_generated';

export interface NotificationRequest {
  type: NotificationType;
  recipient: string;
  data: NotificationData;
}