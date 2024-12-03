import {
    Logger,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { DataSource } from "typeorm";
import { InjectDataSource } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { SaldosDiariosEntity } from "../entities/saldo.entity";
import { MovimientosEntity } from '../entities/movimiento.entity';


export class CoreRepository {
    private readonly MODULE_NAME = 'CoreRepository';
    constructor(
        private readonly logger: Logger,
        @InjectDataSource() private dataSource: DataSource,
        //private readonly httpService: HttpService,
    ) { }

    /**
      * Method consignarMonto
      * @param cuenta
      * @param valor
      * @returns
      */
    async consignarMonto(cuenta: number, valor: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction()
    
        
    
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

    saldoExistente.saldo += valor; // Añadir el valor al saldo existente 
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
    movimiento.origen = "Consignación en banco";
    await movimientosRepo.save(movimiento);
    await queryRunner.commitTransaction();
    return saldoExistente;

} catch (error) {
    await queryRunner.rollbackTransaction
    Logger.error({
        method: `${this.MODULE_NAME}.consignarMonto`,
        message: error,
    });
    // Re-lanzar la excepción para que el controlador la maneje 
    throw error;
} finally {
    await queryRunner.release();
}
    }
    /**
         * Method retirarMonto
         * @param cuenta
         * @param valor
         * @returns
         */
    async retirarMonto(cuenta: number, valor: number) {
    const repo = this.dataSource.getRepository(SaldosDiariosEntity);

    try {
        const saldoExistente = await repo.findOne({
            where: { cuenta: Number(cuenta) }
        });


        if (!saldoExistente) {
            throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
        }

        if (saldoExistente.saldo < valor) {
            throw new BadRequestException(`No tiene fondos suficientes para realizar el retiro de la cuenta: ${cuenta}`);
        }

        const fechaActual = new Date();

        // Restar el valor al saldo existente 
        saldoExistente.saldo -= valor;
        saldoExistente.fecha = fechaActual;

        await repo.save(saldoExistente);

        return saldoExistente;

    } catch (error) {
        Logger.error({
            method: `${this.MODULE_NAME}.retirarMonto`,
            message: error.message,
        });
        // Re-lanzar la excepción para que el controlador la maneje 
        throw error;
    }
}


    /**
        * Method transferirMonto
        * @param cuentaOrigen
        * @param cuentaDestino
        * @param valor
        * @returns
        */
    async transferirMonto(cuentaOrigen: number, cuentaDestino: number, valor: number) {
    // QueryRunner para manejar las transacciones manualmente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    //Conecta y empieza una transacción con startTransaction()
    await queryRunner.startTransaction();

    try {
        const saldoOrigenExistente = await queryRunner.manager.findOne(SaldosDiariosEntity, {
            where: { cuenta: Number(cuentaOrigen) }
        });

        if (!saldoOrigenExistente) {
            throw new NotFoundException(`No se encontró el número de cuenta origen: ${cuentaOrigen}`);
        }

        if (saldoOrigenExistente.saldo < valor) {
            throw new BadRequestException(`No tiene fondos suficientes para realizar la transferencia desde la cuenta: ${cuentaOrigen}`);
        }

        const saldoDestinoExistente = await queryRunner.manager.findOne(SaldosDiariosEntity, {
            where: { cuenta: Number(cuentaDestino) }
        });

        if (!saldoDestinoExistente) {
            throw new NotFoundException(`No se encontró el número de cuenta destino: ${cuentaDestino}`);
        }

        const fechaActual = new Date();

        // Restar el valor al saldo existente de la cuenta origen
        saldoOrigenExistente.saldo -= valor;
        saldoOrigenExistente.fecha = fechaActual;
        //Guarda los cambios en la base de datos utilizando el QueryRunner
        await queryRunner.manager.save(saldoOrigenExistente);




        // Añadir el valor al saldo existente de la cuenta destino
        saldoDestinoExistente.saldo += valor;
        saldoDestinoExistente.fecha = fechaActual;
        await queryRunner.manager.save(saldoDestinoExistente);
        //Si todo es exitoso, hace commitTransaction()
        await queryRunner.commitTransaction();
        return saldoOrigenExistente;
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

