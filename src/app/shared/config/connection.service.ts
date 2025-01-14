import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { MovimientosEntity } from 'src/app/entities/movimiento.entity';
import { SaldosDiariosEntity } from 'src/app/entities/saldo.entity';


@Injectable()
export class ConfigMySql implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: '192.168.9.225',
      port: 3306,
      username: 'arq1',
      password: '2wgzlVxFoU#zUbMg80qz',
      database: 'arq1',
      entities: [
   
       SaldosDiariosEntity,
       MovimientosEntity
        
      ],
      synchronize: false,
      logging: ['error', 'warn', 'info', 'log'],
    };
  }
}
