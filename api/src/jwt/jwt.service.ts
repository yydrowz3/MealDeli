import { Inject, Injectable } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { CONFIG_OPTIONS } from "../common/common.constants";
import type { JwtModuleOptions } from "./jwt.interface";

@Injectable()
export class JwtService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions) {}

  sign(userId: string): string {
    return jwt.sign({ id: userId }, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
