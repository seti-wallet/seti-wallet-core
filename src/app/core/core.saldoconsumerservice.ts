// saldo-consumer.service.ts en el proyecto Retiro
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Any } from 'typeorm';

@Injectable()
export class SaldoConsumerService {
    constructor(private readonly httpService: HttpService) { }

    async getSaldoUser(cuenta: number): Promise<number> {
        let response: any;
        try {
            console.log('entrando al servicio saldos');
            response = await firstValueFrom(
                this.httpService.get(`http://localhost:3000/saldo/${cuenta}`)
            );
            console.log('response: ', response);

            // Verificar si la respuesta es un array y contiene al menos un elemento 
            if (!Array.isArray(response.data) || response.data.length === 0) {
                throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
            }
            const saldoData = response.data[0];

            console.log('El valor de saldo es:', saldoData.saldo);
            return saldoData.saldo;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new NotFoundException(`No se encontró el número de cuenta: ${cuenta}`);
            } console.log('catch del error', error.message);
            throw new InternalServerErrorException('El servicio de saldo no responde', error.message);
        }
    }
}