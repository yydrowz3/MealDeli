import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserProfileOutput } from "./dto/user-profile.dto";
import { User } from "./entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { SignUpInput, SignUpOutput } from "./dto/sign-up.dto";
import { SignInInput, SignInOutput } from "./dto/sign-in.dto";
import * as argon2 from "argon2";
import { EditProfileInput, EditProfileOutput } from "./dto/edit-profile.dto";
import { VerifyEmailOutput } from "./dto/verify-email.dto";
import { MailsService } from "../mails/mails.service";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "../generated/prisma/client";

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailsService: MailsService,
  ) {}

  async signUp({ email, name, password }: SignUpInput): Promise<SignUpOutput> {
    try {
      const exists = await this.prismaService.user.findUnique({ where: { email } });
      if (exists) {
        return {
          ok: false,
          error: "Email already exists.",
        };
      }
      const passwordHash = await argon2.hash(password);
      const user = await this.prismaService.user.create({
        data: { email, passwordHash, name },
      });

      const token = this.generateVerificationToken();
      const tokenHash = this.hashVerificationToken(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      await this.prismaService.emailVerification.upsert({
        where: { userId: user.id },
        update: {
          tokenHash,
          expiresAt,
        },
        create: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
      await this.mailsService.sendVerificationEmail(user.email, token);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "Could not create account",
      };
    }
  }

  async signIn(signInInput: SignInInput): Promise<SignInOutput> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email: signInInput.email },
        select: {
          id: true,
          passwordHash: true,
        },
      });
      if (!user) {
        return {
          ok: false,
          error: "User not found",
          accessToken: null,
        };
      }
      const passwordMatches = await argon2.verify(user.passwordHash, signInInput.password);
      if (!passwordMatches) {
        return {
          ok: false,
          error: "Incorrect email or password.",
          accessToken: null,
        };
      }
      const token = await this.jwtService.signAsync({
        sub: user.id,
      });
      return {
        ok: true,
        accessToken: token,
      };
    } catch {
      return {
        ok: false,
        error: "Login Failed",
        accessToken: null,
      };
    }
  }

  async findById(id: string): Promise<UserProfileOutput> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        return {
          ok: false,
          error: "User Not Found",
          user: null,
        };
      }
      return {
        ok: true,
        user: user,
      };
    } catch {
      return {
        ok: false,
        error: "User Not Found",
        user: null,
      };
    }
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async editProfile(
    userId: string,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const { password, email, ...profileData } = editProfileInput;
      const passwordHash = password ? await argon2.hash(password) : undefined;
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...profileData,
          ...(passwordHash && { passwordHash }),
          ...(email && { email: email.trim().toLocaleLowerCase(), verifiedAt: null }),
        },
      });
      return {
        ok: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return {
          ok: false,
          error: "Email already exists.",
        };
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return {
          ok: false,
          error: "User not found.",
        };
      }

      return {
        ok: false,
        error: "Could not update profile.",
      };
    }
  }

  async verifyEmail(token: string): Promise<VerifyEmailOutput> {
    try {
      const tokenHash = this.hashVerificationToken(token);
      const verification = await this.prismaService.emailVerification.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
        },
      });
      if (!verification) {
        return {
          ok: false,
          error: "Verification Not Found",
        };
      }

      if (verification.expiresAt <= new Date()) {
        await this.prismaService.emailVerification.delete({
          where: { id: verification.id },
        });
        return {
          ok: false,
          error: "Verfication token has expired.",
        };
      }

      await this.prismaService.$transaction([
        this.prismaService.user.update({
          where: {
            id: verification.userId,
          },
          data: {
            verifiedAt: new Date(),
          },
        }),
        this.prismaService.emailVerification.delete({
          where: {
            id: verification.id,
          },
        }),
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "Could not verify email.",
      };
    }
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashVerificationToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
