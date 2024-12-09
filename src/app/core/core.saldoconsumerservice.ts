import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as Opossum from 'opossum';

@Injectable()
export class SaldoConsumerService {
  private circuitBreaker: Opossum;

  constructor(private readonly httpService: HttpService) {
    // Configurar el Circuit Breaker con las opciones necesarias
    const options = {
      timeout: 3000, // Tiempo máximo en milisegundos para realizar la llamada
      errorThresholdPercentage: 50, // Porcentaje de fallos que activan el Circuit Breaker
      resetTimeout: 5000, // Tiempo en milisegundos después del cual se vuelve a intentar
    };

    this.circuitBreaker = new Opossum(
      (cuenta: number) => this.callSaldoService(cuenta),
      options,
    );

    this.circuitBreaker.on('open', () =>
      console.log('Circuito abierto: El servicio de saldo está fallando.'),
    );
    this.circuitBreaker.on('halfOpen', () =>
      console.log('Circuito en estado intermitente, probando recuperación.'),
    );
    this.circuitBreaker.on('close', () =>
      console.log('Circuito cerrado: El servicio de saldo se recuperó.'),
    );
  }

  /**
   * Función que realiza la llamada real al servicio de saldo
   */
  async callSaldoService(cuenta: number): Promise<number> {
    try {
      console.log('Realizando llamada al servicio de saldo...');
      const response = await firstValueFrom(
        this.httpService.get(`http://localhost:3000/saldo/${cuenta}`),
      );

      console.log('Respuesta del servicio de saldo: ', response);

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
      }

      const saldoData = response.data[0];
      console.log('Saldo obtenido: ', saldoData.saldo);
      return saldoData.saldo;
    } catch (error) {
      console.error('Error al llamar el servicio de saldo: ', error.message);
      throw new InternalServerErrorException('No se pudo obtener el saldo');
    }
  }

  /**
   * Lógica de llamada a través del Circuit Breaker
   */
  async getSaldoUser(cuenta: number): Promise<number> {
    try {
      return await this.circuitBreaker.fire(cuenta);
    } catch (error) {
      console.error('Error durante la llamada protegida con Circuit Breaker', error);
      throw new InternalServerErrorException(
        'El servicio de saldo no está disponible en este momento',
      );
    }
  }
}
