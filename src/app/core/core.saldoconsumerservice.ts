// saldo-consumer.service.ts en el proyecto Retiro
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Any } from 'typeorm';

@Injectable()
export class SaldoConsumerService {
    constructor(private readonly httpService: HttpService) { }

    async getSaldoUser(cuenta: number): Promise<number> {
        let response: any;
        try {
            try {
                console.log('linea15');
                response = await firstValueFrom(
                    
                    this.httpService.get(`http://localhost:3000/saldo/${cuenta}`)
                );
                console.log('response: ', response);
            } catch (error) {
                throw new InternalServerErrorException('El servicio de saldo no responde', error.message);
                console.log('a');
            }

            console.log('Respuesta del servicio de saldo:', response.data);

            // Verificar si la respuesta es un array y contiene al menos un elemento 
            if (!Array.isArray(response.data) || response.data.length === 0) {
                throw new InternalServerErrorException('Sin saldo');
            }
            const saldoData = response.data[0];
            console.log('b');

            console.log('El valor de saldo es:', saldoData.saldo);
            // Imprimir el saldo para verificar 
            return saldoData.saldo;
        }
        catch (error) {
            throw new InternalServerErrorException('InternalServerErrorException', error.message);
        }
    }
}