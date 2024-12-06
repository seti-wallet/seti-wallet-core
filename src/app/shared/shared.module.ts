import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

/**
 *Modulo para respuestas genericas de la aplicación
 **/
@Global()
@Module({
  imports: [HttpModule],
  exports: [HttpModule],
  providers: [],
})
export class SharedModule {}
