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
    try {
      return await this.coreRepository.consignarMonto(
        cuentaNumero,
        valorNumero,
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

    try {
      return await this.coreRepository.retirarMonto(
        cuentaNumero,
        valorNumero,
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