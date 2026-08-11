import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { SignUpInput, SignUpOutput } from "./dto/sign-up.dto";
import { SignInInput, SignInOutput } from "./dto/sign-in.dto";
import { UserProfileInput, UserProfileOutput } from "./dto/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dto/edit-profile.dto";
import { UseGuards } from "@nestjs/common";
import { VerifyEmailInput, VerifyEmailOutput } from "./dto/verify-email.dto";

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => SignUpOutput)
  async signUp(@Args("input" signUpInput: SignUpInput)): Promise<SignUpOutput> {
    return this.usersService.signUp(signUpInput)
  }


  async signIn(@Args("input") signInInput: SignInInput): Promise<SignInOutput> {
    return this.usersService.signIn(signInInput)
  }

  @Query(() => User)
  @Role["Any"]
  me(@AuthUser() authUser: User) {
    return authUser
  }

  @Role(["Any"])
  @Query(() => UserProfileInput)
  async userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId)
  }

  // @UseGuards(AuthGuard)
  @Role(["Any"])
  @Mutation(() => EditProfileOutput)
  async editProfile(@AuthUser() authUser: User, @Args("input") editProfileInput: EditProfileInput): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput)
  }

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(@Args("input")  verifyEmailInput: VerifyEmailInput): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput)
  }

}

