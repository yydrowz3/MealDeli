import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "./jwt.service";
import { UsersService } from "src/users/users.service";

// export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
//     console.log(req.headers);
//     next();
// }

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService
    ) {}
    async use(req: Request, res: Response, next: NextFunction) {
        // console.log(req.headers);
        if ("x-jwt" in req.headers) {
            const token = req.headers["x-jwt"];
            try {
                const decoded = this.jwtService.verify(token?.toString() || "");
                if (
                    typeof decoded === "object" &&
                    decoded.hasOwnProperty("id")
                ) {
                    const { user, ok } = await this.userService.findById(
                        decoded["id"]
                    );
                    if (ok) {
                        req["user"] = user;
                    }
                    // console.log(user);
                }
            } catch (e) {
                // console.log(e);
            }
        }
        next();
    }
}
