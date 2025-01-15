import { Logger, Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { AppService, CoreService } from './core.service';
import { CoreRepository } from './core.repository';
import { HttpModule } from '@nestjs/axios'
import { SaldoConsumerService } from "./core.saldoconsumerservice";

@Module({
  imports: [HttpModule],
  controllers: [CoreController],
  providers: [CoreService, CoreRepository, Logger,SaldoConsumerService, AppService],
})
export class CoreModule {}