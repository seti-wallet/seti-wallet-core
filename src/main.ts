import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClientProxy, ClientProxyFactory, MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);

  app.connectMicroservice( {
  transport: Transport.RMQ,
  options: {
   urls: ['amqp://admin:seti2024@192.168.9.44:30001'], 
   queue: 'victorbotero-transactions', 
   queueOptions: {
    durable: true,
   },
   noAck: false,
  },
 });

 await app.startAllMicroservices();
 console.log('Microservicio de RabbitMQ escuchando...');
}

bootstrap();
