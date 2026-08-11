// import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
// import { JwtService } from "./jwt.service";
// import { UsersService } from "../users/users.service";
// import { Request, Response, NextFunction } from "express";

// @Injectable()
// export class JwtMiddleware implements NestMiddleware {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly usersService: UsersService,
//   ) {}
//   async use(req: Request, _res: Response, next: NextFunction) {
//     if (req.headers.authorization) {
//       const [type, token] = req.headers.authorization.split(" ") ?? [];
//       if (type === "Bearer" && token) {
//         try {
//           const decoded = this.jwtService.verify(token.toString());
//           if (typeof decoded === "object" && decoded.hasOwnProperty("id")) {
//             const { user, ok } = await this.usersService.findById(decoded["id"]);
//             if (ok) {
//               (req as any).user = user;
//             }
//           }
//         } catch {
//           throw new UnauthorizedException();
//         }
//       }
//     }
//     next();
//   }
// }
