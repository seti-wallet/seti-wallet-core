import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigMySql } from './app/shared/config/connection.service';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { CoreModule } from './app/core/core.module';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { CoreController } from './app/core/core.controller';
import { CoreService } from './app/core/core.service';
import { RabbitMQModule } from './app/core/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({ useClass: ConfigMySql }),
    CoreModule,
    /*ClientsModule.register([
        {
         name: 'CoreService', // Nombre del servicio
         transport: Transport.RMQ, // Transportador RabbitMQ
         options: {
          urls: ['amqp://admin:seti2024@192.168.9.44:30001'], // URL de RabbitMQ
          queue: 'jairo-edu-viky-TransaccionesQueue', // Nombre de la cola
          queueOptions: {
           durable: true, // Asegura que la cola sea durable
          },
         },
        },
        ]),*/
    RabbitMQModule,
     ],
  controllers: [],
  providers: [],
 
})
export class AppModule {}
