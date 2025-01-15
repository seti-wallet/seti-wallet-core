import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param, ParseIntPipe, Post, Inject, Injectable } from "@nestjs/common";
import { CoreRepository } from "./core.repository";
import { AppService, CoreService } from "./core.service";
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { RabbitMQService } from "./rabbitmq.service";


@Controller('core')
//@Inject('RABBITMQ_SERVICE')
export class CoreController {
  private readonly MODULE_NAME = 'CoreController';
  constructor(
    private coreService: CoreService,
    private coreRepository: CoreRepository,
    private readonly logger: Logger,
    private appService: AppService,
    private rabbitMQservice: RabbitMQService
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
    
    const messageMQ = {
      id: 1,
      type: 'default-type',
      timestamp: new Date().toISOString(),
      payload: {},
    }

    try {
      await queryRunner.startTransaction();
      const result = await this.coreRepository.consignarMonto(queryRunner, cuentaNumero, valorNumero);
      await queryRunner.commitTransaction();
      
      setImmediate(async() => {
      await this.appService.handleRequest(messageMQ);
      });

      return result;
      
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      else {
        throw new BadRequestException(error.response, error.message);
      }
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

    // Iniciar una nueva transacción para la consignación 
    const queryRunner = this.coreRepository.createQueryRunner();
    await queryRunner.connect();
    
    const cuentaNumero = parseInt(cuenta, 10);
    const valorNumero = parseFloat(valor);

    try {
      await queryRunner.startTransaction();
      const result = await this.coreRepository.retirarMonto(queryRunner, cuentaNumero, valorNumero);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      else {
        throw new BadRequestException(error.response, error.message);
      }
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
    @Body() body: {
      cuentaOrigen: number, cuentaDestino: number, valor: number
    }) {
    const { cuentaOrigen, cuentaDestino, valor } = body;


    try {
      return await this.coreRepository.transferirMonto(
        cuentaOrigen,
        cuentaDestino,
        valor,
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      else {
        throw new BadRequestException(error.response, error.message);
      }
    }
  }
  
}
