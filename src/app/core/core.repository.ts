import {
    Logger,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { DataSource } from "typeorm";
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
    async consignarMonto(queryRunner, cuenta: number, valor: number) {
        try {

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

            // Guardar la actualización del saldo 
            await repo.save(saldoExistente);

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

            return saldoExistente;

        } catch (error) { throw error; }
    }





    /**
         * Method retirarMonto
         * @param cuenta
         * @param valor
         * @returns
         */
    async retirarMonto(queryRunner, cuenta: number, valor: number): Promise<string> {
        const repos = queryRunner.manager.getRepository(SaldosDiariosEntity);
        try {
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
            // Convertir a número y restar 
            saldoExistente.fecha = fechaActual;

            await repo.save(saldoExistente);
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
            return 'Retiro realizado con éxito';
        } catch (error) { throw error; }
    }


    /**
        * Method transferirMonto
        * @param cuentaOrigen
        * @param cuentaDestino
        * @param valor
        * @returns
        */
    async transferirMonto(cuentaOrigen: number, cuentaDestino: number, valor: number): Promise<string> {
        // QueryRunner para manejar las transacciones manualmente
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        //Conecta y empieza una transacción con startTransaction()
        await queryRunner.startTransaction();

        try {
            // Retirar monto de la cuenta origen 
            const retiroMonto = await this.retirarMonto(queryRunner, cuentaOrigen, valor);
            console.log(`Monto retirado de la cuenta ${retiroMonto}`);


            console.log(`Monto retirado de la cuenta ${cuentaOrigen}`);

            // Consignar monto en la cuenta destino 
            await this.consignarMonto(queryRunner, cuentaDestino, valor);
            console.log(`Monto consignado en la cuenta ${cuentaDestino}`);
            await queryRunner.commitTransaction();
            return 'Transferencia realizada con éxito';



            //En caso de error, hace rollbackTransaction().
        } catch (error) {
            await queryRunner.rollbackTransaction();
            Logger.error({
                method: `${this.MODULE_NAME}.transferirMonto`,
                message: error.message,
            });
            throw error;
        } finally {
            //Liberar Recursos: Libera el QueryRunner con release().
            await queryRunner.release();
        }
    }
}

