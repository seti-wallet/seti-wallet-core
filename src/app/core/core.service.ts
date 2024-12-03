import { Injectable } from "@nestjs/common";
import { CoreRepository } from "./core.repository";

@Injectable()
export class CoreService {
  private readonly MODULE_NAME = 'CoreService';
  constructor(private coreRepository: CoreRepository) {}}