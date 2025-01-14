import { Injectable } from "@nestjs/common";
import { CoreRepository } from "./core.repository";
import { RabbitMQService } from "./rabbitmq.service";

@Injectable()
export class CoreService {
  private readonly MODULE_NAME = 'CoreService';
  constructor(private coreRepository: CoreRepository) {}}

@Injectable()
  export class AppService {
    constructor(private readonly rabbitMQService: RabbitMQService) {}
  
    async handleRequest(messageData: any) {
      const message = {
        id: messageData.id || 'default-id',
        type: messageData.type || 'default-type',
        timestamp: new Date().toISOString(),
        payload: messageData.payload || {},
      };
  
      await this.rabbitMQService.sendMessage(message);
      console.log('Solicitud procesada y mensaje enviado a RabbitMQ');
    }
  }