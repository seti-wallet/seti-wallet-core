import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param, ParseIntPipe, Post, Inject, Injectable } from "@nestjs/common";
import { CoreRepository } from "./core.repository";
import { CoreService } from "./core.service";
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('core')
//@Inject('RABBITMQ_SERVICE')
export class CoreController {
  private readonly MODULE_NAME = 'CoreController';
  constructor(
    private coreService: CoreService,
    private coreRepository: CoreRepository,
    private readonly logger: Logger,
    //private readonly rabbitMqClient: ClientProxy,
  ) { }

  /**
      * Method consignarMonto
      * @param cuenta
      * @param valor
      * @returns
      */
  @Post('/consignar/:cuenta')
  async consignarMonto(
    @Param('cuenta') cuenta: string,
    @Body('valor') valor: string) {

    const cuentaNumero = parseInt(cuenta, 10);
    const valorNumero = parseFloat(valor);

    if (isNaN(cuentaNumero) || isNaN(valorNumero)) {
      throw new BadRequestException('Los parámetros deben ser números.');
    }
    // Iniciar una nueva transacción para la consignación 
    const queryRunner = this.coreRepository.createQueryRunner();
    await queryRunner.connect();

    //const payload = { cuenta: cuentaNumero, valor: valorNumero };
    //const response_1 = this.rabbitMqClient.emit('consignar_event', payload); // 'consignar_event' es el nombre del evento

    //console.log(payload)
    //console.log(response_1)

    try {
      await queryRunner.startTransaction();
      const result = await this.coreRepository.consignarMonto(queryRunner, cuentaNumero, valorNumero);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException('Error inesperado', error.message);
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
  @Post('/retirar/:cuenta')
  async retirarMonto(
    @Param('cuenta') cuenta: string,
    @Body('valor') valor: string) {

    const cuentaNumero = parseInt(cuenta, 10);
    const valorNumero = parseFloat(valor);

    console.log('entra');
    if (isNaN(cuentaNumero) || isNaN(valorNumero)) { throw new BadRequestException('Los parámetros deben ser números.'); }

    const queryRunner = this.coreRepository.createQueryRunner();
    await queryRunner.connect();


    try {
      await queryRunner.startTransaction();
      console.log('entrando controller try');
      const result = await this.coreRepository.retirarMonto(queryRunner, cuentaNumero, valorNumero);
      console.log('antes del primer commit');
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      if (queryRunner.isTransactionActive) { await queryRunner.rollbackTransaction(); }

      if (error instanceof NotFoundException) { throw new NotFoundException(error.message); }

      if (error instanceof BadRequestException) { throw new BadRequestException(error.message); }

      throw new InternalServerErrorException('Error', error.message);
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
  @Post('/transferir')
  async transferirMonto(
    @Body() body: { cuentaOrigen: number, cuentaDestino: number, valor: number }) {
    const { cuentaOrigen, cuentaDestino, valor } = body;
    if (isNaN(cuentaOrigen) || isNaN(cuentaDestino) || isNaN(valor)) { throw new BadRequestException('Los parámetros deben ser números.'); }
    return this.coreRepository.transferirMonto(cuentaOrigen, cuentaDestino, valor);
  }

  @MessagePattern('retiroMQ') //Escucha los mensajes con el patrón realizar_retiro
    async handleRetiro(@Payload() data: { id: number; monto: number }) {
      const queryRunner = this.coreRepository.createQueryRunner();
      await queryRunner.connect();

    try {
      console.log('Inicio de handleRetiro');
      console.log(`Datos recibidos: ${JSON.stringify(data)}`);
      console.log(`Mensaje de Retiro recibido: ID=${data.id}, Monto=${data.monto}`);
      return await this.coreRepository.retirarMonto(queryRunner, data.id, data.monto);
    } catch (error) {
    console.error('Error en handleRetiro:', error);
    throw new Error('Internal server error');
  }
  }
  
}
