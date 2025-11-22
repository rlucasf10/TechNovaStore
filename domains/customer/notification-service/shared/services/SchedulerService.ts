/**
 * Servicio de programación de tareas automáticas
 * Gestiona la verificación periódica de retrasos en entregas
 */

import { DelayScheduler } from '../../check-delivery-delays/DelayScheduler';
import { CheckDeliveryDelays } from '../../check-delivery-delays/CheckDeliveryDelays';
import { SendDelayAlert } from '../../send-delay-alert/SendDelayAlert';
import { EmailService } from '../email/EmailService';
import { TemplateService } from '../templates/TemplateService';

export class SchedulerService {
  private delayScheduler: DelayScheduler;

  constructor(
    emailService: EmailService,
    templateService: TemplateService
  ) {
    const sendDelayAlert = new SendDelayAlert(emailService, templateService);
    const checkDeliveryDelays = new CheckDeliveryDelays(sendDelayAlert);
    this.delayScheduler = new DelayScheduler(checkDeliveryDelays);
  }

  start(): void {
    this.delayScheduler.start();
  }

  stop(): void {
    this.delayScheduler.stop();
  }

  async triggerDelayCheck(): Promise<void> {
    await this.delayScheduler.triggerManualCheck();
  }
}
