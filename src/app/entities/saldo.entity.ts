import {
    Column, Entity, PrimaryGeneratedColumn,
} from "typeorm";

@Entity('ant_saldos_diarios')
export class SaldosDiariosEntity {
    @PrimaryGeneratedColumn({ name: 'sad_consecutivo' })
    id: number;

    @Column({ name: 'sad_cliente_producto' })
    cuenta: number;

    @Column({ name: 'sad_saldo' })
    saldo: number;


    @Column({ name: 'sad_fecha' })
    fecha: Date;
}