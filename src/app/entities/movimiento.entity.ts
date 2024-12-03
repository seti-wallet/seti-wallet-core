import {
    Column, Entity, Long, PrimaryGeneratedColumn,
} from "typeorm";

@Entity('ant_movimientos')
export class MovimientosEntity {
    @PrimaryGeneratedColumn({ name: 'mov_codigo' })
    codigo: number;

    @Column({ name: 'mov_canal' })
    canal: number;

    @Column({ name: 'mov_cliente_producto' })
    clienteProducto: number;


    @Column({ name: 'mov_descripcion' })
    descripcion: String;

    @Column({ name: 'mov_destino' })
    destino: String;

    @Column({ name: 'mov_fecha' })
    fecha: Date;

    @Column({ name: 'mov_monto' })
    monto: number;

    @Column({ name: 'mov_naturaleza' })
    naturaleza: String;

    @Column({ name: 'mov_origen' })
    origen: String;

}