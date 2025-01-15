import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClientProxy, ClientProxyFactory, MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);

 const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
   urls: ['amqp://admin:seti2024@192.168.9.44:30001'], 
   queue: 'jairo-edu-viky-TransaccionesQueue', 
   queueOptions: {
    durable: true,
   },
  },
 });

 const client: ClientProxy = ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: {
     urls: ['amqp://admin:seti2024@192.168.9.44:30001'], 
     queue: 'jairo-edu-viky-TransaccionesQueue',
     queueOptions: { durable: true }, 
    },
   });

   client.send('retiroMQ', { id: '1', monto: 1 }).subscribe((response) => {
    console.log('Respuesta del microservicio:', response);
   });

 await microservice.listen();
 console.log('Microservicio de RabbitMQ escuchando...');
}

bootstrap();
