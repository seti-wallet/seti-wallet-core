import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { MovimientosEntity } from 'src/app/entities/movimiento.entity';
import { SaldosDiariosEntity } from 'src/app/entities/saldo.entity';


@Injectable()
export class ConfigMySql implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [
   
       SaldosDiariosEntity,
       MovimientosEntity
        
      ],
      synchronize: false,
      logging: ['error', 'warn', 'info', 'log'],
    };
  }
}
