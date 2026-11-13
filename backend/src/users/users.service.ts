import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
// import * as jwt from "jsonwebtoken";
import {
    CreateAccountInput,
    CreateAccountOutput,
} from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
// import { ConfigService } from "@nestjs/config";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification)
        private readonly verifications: Repository<Verification>,
        // private readonly config: ConfigService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ) {}

    async createAccount({
        email,
        password,
        role,
    }: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            const exists = await this.users.findOne({ where: { email } });
            if (exists) {
                // make error
                return {
                    ok: false,
                    error: "There is a user with that email already",
                };
            }
            const user = await this.users.save(
                this.users.create({ email, password, role })
            );
            // create verification
            const verification = await this.verifications.save(
                this.verifications.create({
                    user,
                })
            );

            await this.mailService.sendVarificationEmail(
                user.email,
                verification.code
            );

            return { ok: true };
        } catch {
            // make error
            return { ok: false, error: "Could not create account" };
        }
        // check that email does not exist (new user)
        // create user & hash the password
    }

    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        // find the user with the email
        // check if the password is correct
        // make a JWT and give it to the user
        try {
            const user = await this.users.findOne({
                where: { email },
                select: ["id", "password"],
            }); // if not select, password will be null
            if (!user) {
                return {
                    ok: false,
                    error: "User not found",
                };
            }
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return {
                    ok: false,
                    error: "Wrong password",
                };
            }
            // const token = jwt.sign(
            //     { id: user.id },
            //     String(this.config.get("SECRET_KEY"))
            // );
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token: token,
            };
        } catch {
            return {
                ok: false,
                error: "Login Failed",
            };
        }
    }

    async findById(id: number): Promise<UserProfileOutput> {
        try {
            const user = await this.users.findOneOrFail({ where: { id } });
            return {
                ok: true,
                user: user,
            };
        } catch {
            return {
                ok: false,
                error: "User Not Found",
            };
        }
    }

    async editProfile(
        userId: number,
        { email, password }: EditProfileInput
    ): Promise<EditProfileOutput> {
        try {
            const user = await this.users.findOne({ where: { id: userId } });
            if (!user) {
                throw Error("User Not Found");
            }
            if (email) {
                const exists = await this.users.findOne({ where: { email } });
                if (exists) {
                    throw Error("There is a user with that email already");
                }

                user.email = email;
                user.verified = false;
                await this.verifications.delete({ user: { id: user.id } });
                const verification = await this.verifications.save(
                    this.verifications.create({ user })
                );

                await this.mailService.sendVarificationEmail(
                    user.email,
                    verification.code
                );
            }
            if (password) {
                user.password = password;
            }
            await this.users.save(user);
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: "Could not update profile.",
            };
        }
        // this.users.update(userId, { email, password });
        // this.users.update(userId, { ...editProfileInput }); // 避免undefined
    }

    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            const verification = await this.verifications.findOne({
                where: { code },
                // loadRelationIds: true,
                relations: ["user"],
            });
            if (verification) {
                // console.log(verification, verification.user); // won't load relationships automatically
                verification.user.verified = true;
                await this.users.save(verification.user);
                await this.verifications.delete(verification.id);
                return { ok: true };
            }
            return { ok: false, error: "Verification Not Found" };
        } catch {
            return { ok: false, error: "Could not Verify Email" };
        }
    }
}
