import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Global() // Para que esté disponible globalmente
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}