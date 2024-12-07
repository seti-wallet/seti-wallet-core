import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CoreRepository } from "./core.repository";
import { CoreService } from "./core.service";


@Controller('core')
export class CoreController {
  private readonly MODULE_NAME = 'CoreController';
  constructor(
    private coreService: CoreService,
    private coreRepository: CoreRepository,
    private readonly logger: Logger,
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

}