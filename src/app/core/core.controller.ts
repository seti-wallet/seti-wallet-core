import { BadRequestException, Body, Controller, Get, Logger, Param, ParseIntPipe, Post } from "@nestjs/common";
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
    @Param('cuenta') cuenta: string ,
    @Body('valor') valor: string) {

      const cuentaNumero = parseInt(cuenta, 10); 
      const valorNumero = parseFloat(valor); 
      
      if (isNaN(cuentaNumero) || isNaN(valorNumero)) 
        { throw new BadRequestException('Los parámetros deben ser números.'); }
    return this.coreRepository.consignarMonto(cuentaNumero, valorNumero)
  }

 /**
      * Method retirarMonto
      * @param cuenta
      * @param valor
      * @returns
      */
 @Post('/retirar/:cuenta')
 async retirarMonto(
   @Param('cuenta') cuenta: string ,
   @Body('valor') valor: string) {

     const cuentaNumero = parseInt(cuenta, 10); 
     const valorNumero = parseFloat(valor); 
     
     if (isNaN(cuentaNumero) || isNaN(valorNumero)) 
       { throw new BadRequestException('Los parámetros deben ser números.'); }
   return this.coreRepository.retirarMonto(cuentaNumero, valorNumero)
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
     if (isNaN(cuentaOrigen) || isNaN(cuentaDestino)|| isNaN(valor)) 
       { throw new BadRequestException('Los parámetros deben ser números.'); }
     return this.coreRepository.transferirMonto(cuentaOrigen, cuentaDestino, valor);
 }

}