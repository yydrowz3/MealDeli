import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserProfileOutput } from "./dto/user-profile.dto";
import { User } from "./entities/user.entity";
import { JwtService } from "../jwt/jwt.service";
import { SignUpInput, SignUpOutput } from "./dto/sign-up.dto";
import { SignInInput, SignInOutput } from "./dto/sign-in.dto";
import * as argon2 from "argon2";
import { EditProfileInput, EditProfileOutput } from "./dto/edit-profile.dto";
import { VerifyEmailOutput } from "./dto/verify-email.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    // private readonly mailService: MailService,
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
      await this.prismaService.user.create({
        data: { email, passwordHash, name, verifiedAt: new Date() },
      });
      // const user = await this.prismaService.user.create({
      //   data: { email, passwordHash, name },
      // });
      //TODO: Create email verification
      // const verification = await this.prismaService.emailVerification.create({
      //   data: {
      //     userId: user.id,
      //     tokenHash: "",
      //     expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      //   }
      // })
      // await this.mailService.sendVarificationEmail(user.email, user.)

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
        };
      }
      const passwordMatches = await argon2.verify(user.passwordHash, signInInput.password);
      if (!passwordMatches) {
        return {
          ok: false,
          error: "Incorrect email or password.",
        };
      }
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

  async findById(id: string): Promise<UserProfileOutput> {
    try {
      const user = (await this.prismaService.user.findUnique({
        where: {
          id,
        },
      })) as User;
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
    userId: string,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return {
          ok: false,
          error: "User Not Found",
        };
      }
      if (editProfileInput.email) {
        const exists = await this.prismaService.user.findUnique({
          where: { email: editProfileInput.email },
        });
        if (exists) {
          return {
            ok: false,
            error: "Email already exists.",
          };
        }
        user.email = editProfileInput.email;
        user.verifiedAt = null;
        // await this.prismaService.emailVerification.delete({ where: { userId: userId } });
        // const verification = await this.prismaService.emailVerification.create({
        //   data: {
        //     userId: user.id,
        //     tokenHash: "",
        //     expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        //   },
        // });
        // await this.mailService.sendVarificationEmail(user.email, verification.tokenHash);
      }
      if (editProfileInput.password) {
        user.passwordHash = await argon2.hash(editProfileInput.password);
      }
      if (editProfileInput.name) {
        user.name = editProfileInput.name;
      }
      if (editProfileInput.address) {
        user.address = editProfileInput.address;
      }
      if (editProfileInput.image) {
        user.image = editProfileInput.image;
      }
      await this.prismaService.user.update({
        where: { id: userId },
        data: user,
      });

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "Could not update profile.",
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.prismaService.emailVerification.findUnique({
        where: { tokenHash: code },
        select: {
          id: true,
          user: true,
        },
      });
      if (!verification) {
        return {
          ok: false,
          error: "Verification Not Found",
        };
      }
      verification.user.verifiedAt = new Date();
      await this.prismaService.user.update({
        where: { id: verification.user.id },
        data: verification.user,
      });
      await this.prismaService.emailVerification.delete({
        where: { id: verification.id },
      });
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
}
