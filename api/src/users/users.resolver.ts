import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { SignUpInput, SignUpOutput } from "./dto/sign-up.dto";
import { SignInInput, SignInOutput } from "./dto/sign-in.dto";
import { UserProfileInput, UserProfileOutput } from "./dto/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dto/edit-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dto/verify-email.dto";
import { Roles } from "../auth/decorator/roles.decorator";
import { AuthUser } from "../auth/decorator/auth-user.decorator";
import { MeOutput } from "./dto/me.dto";

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => SignUpOutput)
  async signUp(@Args("input") signUpInput: SignUpInput): Promise<SignUpOutput> {
    return this.usersService.signUp(signUpInput);
  }

  @Mutation(() => SignInOutput)
  async signIn(@Args("input") signInInput: SignInInput): Promise<SignInOutput> {
    return this.usersService.signIn(signInInput);
  }

  @Roles("Any")
  @Query(() => MeOutput)
  me(@AuthUser() authUser: User): MeOutput {
    return this.usersService.me(authUser);
  }

  @Roles("Any")
  @Query(() => UserProfileOutput)
  async userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }

  @Roles("Any")
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args("input") editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(@Args("input") verifyEmailInput: VerifyEmailInput): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput.tokenHash);
  }
}
