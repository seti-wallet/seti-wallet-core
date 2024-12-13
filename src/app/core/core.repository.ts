import {
    Logger,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { DataSource, QueryRunner } from "typeorm";
import { InjectDataSource } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { SaldosDiariosEntity } from "../entities/saldo.entity";
import { MovimientosEntity } from '../entities/movimiento.entity';
import { SaldoConsumerService } from "./core.saldoconsumerservice";

@Injectable()
export class CoreRepository {
    private readonly MODULE_NAME = 'CoreRepository';

    constructor(
        private readonly logger: Logger,
        @InjectDataSource() private dataSource: DataSource,
        private readonly httpService: HttpService,
        private readonly saldoConsumerService: SaldoConsumerService
    ) { }

    createQueryRunner() { return this.dataSource.createQueryRunner(); }

    /**
      * Method consignarMonto
      * @param cuenta
      * @param valor
      * @returns
      */
    async consignarMonto(cuenta: number, valor: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {

            if (isNaN(cuenta) || isNaN(valor)) {
                throw new BadRequestException('Los parámetros deben ser números.');
            }
            const repo = queryRunner.manager.getRepository(SaldosDiariosEntity);
            const movimientosRepo = queryRunner.manager.getRepository(MovimientosEntity);

            const saldoExistente = await repo.findOne({
                where: { cuenta: Number(cuenta) }
            });


            if (!saldoExistente) {
                throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
            }

            const fechaActual = new Date();

            saldoExistente.saldo = Number(saldoExistente.saldo) + Number(valor); // Convertir a número y sumar 
            saldoExistente.fecha = fechaActual;

           

            // Registrar el movimiento en movimientos 
            const movimiento = new MovimientosEntity();
            movimiento.canal = 1;
            movimiento.clienteProducto = 3;
            movimiento.descripcion = "consignación";
            movimiento.destino = cuenta.toString();
            movimiento.fecha = fechaActual;
            movimiento.monto = valor;
            movimiento.naturaleza = "DB";
            movimiento.origen = "1";
            await movimientosRepo.save(movimiento);

            await queryRunner.manager.save(saldoExistente);
            await queryRunner.commitTransaction();
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }

            return saldoExistente;

        } catch (error) {
            Logger.error({
                method: `${this.MODULE_NAME}.consignarMonto`,
                message: error,
            });
            await queryRunner.rollbackTransaction();
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }

            throw new InternalServerErrorException('Error inesperado', error.message);
        }

    }

    /**
         * Method retirarMonto
         * @param cuenta
         * @param valor
         * @returns
         */
    async retirarMonto(cuenta: number, valor: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            if (isNaN(cuenta) || isNaN(valor)) {
                throw new BadRequestException('Los parámetros deben ser números.');
            }

            const repo = queryRunner.manager.getRepository(SaldosDiariosEntity);
            const movimientosRepo = queryRunner.manager.getRepository(MovimientosEntity);

            const saldo = await this.saldoConsumerService.getSaldoUser(cuenta);
            console.log(`El valor de saldo es: ${saldo}`);

            if (saldo < valor) {
                throw new BadRequestException(`No tiene fondos suficientes para realizar el retiro de la cuenta: ${cuenta}`);
            }
            const saldoExistente = await repo.findOne({
                where: { cuenta: Number(cuenta) }
            });

            if (!saldoExistente) {
                throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
            }

            const fechaActual = new Date();
            saldoExistente.saldo = Number(saldoExistente.saldo) - Number(valor);
            
            saldoExistente.fecha = fechaActual;

           

             // Registrar el movimiento en movimientos
            const movimiento = new MovimientosEntity();
            movimiento.canal = 1;
            movimiento.clienteProducto = 3;
            movimiento.descripcion = "retiro";
            movimiento.destino = cuenta.toString();
            movimiento.fecha = fechaActual;
            movimiento.monto = valor;
            movimiento.naturaleza = "DB";
            movimiento.origen = "1";
            await movimientosRepo.save(movimiento);

            await queryRunner.manager.save(saldoExistente);
            await queryRunner.commitTransaction();
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }

            return saldoExistente;
        } catch (error) {
            Logger.error({
                method: `${this.MODULE_NAME}.retirarMonto`,
                message: error,
            });
            await queryRunner.rollbackTransaction();
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }

            throw new InternalServerErrorException('Error inesperado', error.message);
        }

    }

    /**
        * Method transferirMonto
        * @param cuentaOrigen
        * @param cuentaDestino
        * @param valor
        * @returns
        */
    async transferirMonto(cuentaOrigen: number, cuentaDestino: number, valor: number): Promise<string> {
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (isNaN(cuentaOrigen) || isNaN(cuentaDestino) || isNaN(valor)) {
                throw new BadRequestException('Los parámetros deben ser números.');
              }
            // Retirar monto de la cuenta origen 
            const retiroMonto = await this.retirarMonto(cuentaOrigen, valor);
            console.log(`Monto retirado de la cuenta ${retiroMonto}`);

            // Consignar monto en la cuenta destino 
            await this.consignarMonto(cuentaDestino, valor);
            console.log(`Monto consignado en la cuenta ${cuentaDestino}`);

            return 'Transferencia realizada con éxito';

        } catch (error) {
            Logger.error({
                method: `${this.MODULE_NAME}.transferirMonto`,
                message: error,
            });
            await queryRunner.rollbackTransaction();
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }

            throw new InternalServerErrorException('Error inesperado', error.message);
        }

    }
}

