import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly RABBITMQ_URL = 'amqp://admin:seti2024@192.168.9.44:30001';
  private readonly QUEUE_NAME = 'jairo-edu-viky-TransaccionesQueue';
  /*private client:ClientProxy;

  constructor () {
    this.client = ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
         urls: ['amqp://admin:seti2024@192.168.9.44:30001'], 
         queue: 'jairo-edu-viky-TransaccionesQueue',
         queueOptions: { durable: true }, 
        },
       });
  }*/

  async onModuleInit() {
    try {
      // Conectar a RabbitMQ
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Asegurar que la cola exista
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
      });

      console.log('Conexión a RabbitMQ establecida correctamente.');
    } catch (error) {
      console.error('Error al conectar a RabbitMQ:', error);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
    console.log('Conexión a RabbitMQ cerrada.');
  }

  // Método para enviar mensajes a RabbitMQ
  async sendMessage(message: any) {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(this.QUEUE_NAME, messageBuffer, {
        persistent: true,
      });
      console.log(`Mensaje enviado a RabbitMQ: ${JSON.stringify(message)}`);
    } catch (error) {
      console.error('Error al enviar mensaje a RabbitMQ:', error);
    }
  }

   /*async sendMessage(pattern: string, message: any): Promise<void> {     
    await this.client.send(pattern, message).toPromise();     
    console.log('Mensaje enviado a RabbitMQ:', message); 
}*/
}