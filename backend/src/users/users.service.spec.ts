import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";

const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
});

const mockJwtService = () => ({
    sign: jest.fn(() => "signed-token"),
    verify: jest.fn(),
});

const mockMailService = () => ({
    sendVarificationEmail: jest.fn(),
});

type MockRepository<T extends object = any> = Partial<
    Record<keyof Repository<T>, jest.Mock>
>;

describe("UserService", () => {
    let service: UsersService;
    let usersRespository: MockRepository<User>;
    let verificationsRepository: MockRepository<Verification>;
    let mailService: MailService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository(),
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService(),
                },
                {
                    provide: MailService,
                    useValue: mockMailService(),
                },
            ],
        }).compile();
        service = module.get<UsersService>(UsersService);
        mailService = module.get<MailService>(MailService);
        usersRespository = module.get(getRepositoryToken(User));
        verificationsRepository = module.get(getRepositoryToken(Verification));
        jwtService = module.get<JwtService>(JwtService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    // it.todo("createAccount");

    describe("createAccount", () => {
        const createAccountArgs = {
            email: "bull@shit.com",
            password: "bullshit.password",
            role: 0,
        };
        it("should fail if user exists", async () => {
            usersRespository.findOne?.mockResolvedValue({
                id: 1,
                email: "hello@world.com",
            });
            const result = await service.createAccount(createAccountArgs);
            expect(result).toMatchObject({
                ok: false,
                error: "There is a user with that email already",
            });
        });

        it("should create a new user", async () => {
            usersRespository.findOne?.mockReturnValue(undefined);
            usersRespository.create?.mockReturnValue(createAccountArgs);
            usersRespository.save?.mockResolvedValue(createAccountArgs);
            verificationsRepository.create?.mockReturnValue({
                user: createAccountArgs,
            });
            verificationsRepository.save?.mockResolvedValue({ code: "code" });
            const result = await service.createAccount(createAccountArgs);
            expect(usersRespository.create).toHaveBeenCalledTimes(1);
            expect(usersRespository.create).toHaveBeenCalledWith(
                createAccountArgs
            );
            expect(usersRespository.save).toHaveBeenCalledTimes(1);
            expect(usersRespository.save).toHaveBeenCalledWith(
                createAccountArgs
            );
            expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.create).toHaveBeenCalledWith({
                user: createAccountArgs,
            });
            expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.save).toHaveBeenCalledWith({
                user: createAccountArgs,
            });
            expect(mailService.sendVarificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVarificationEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String)
            );
            expect(result).toEqual({ ok: true });
        });

        it("should fail on exception", async () => {
            usersRespository.findOne?.mockRejectedValue(
                new Error("not important")
            );
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({
                ok: false,
                error: "Could not create account",
            });
        });
    });

    // it.todo("login");
    describe("login", () => {
        const loginArgs = {
            email: "bs@email.com",
            password: "bs.password",
        };
        it("should fail if user does not exist", async () => {
            usersRespository.findOne?.mockResolvedValue(null);
            const result = await service.login(loginArgs);
            expect(usersRespository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRespository.findOne).toHaveBeenCalledWith(
                expect.any(Object)
            );
            expect(result).toEqual({
                ok: false,
                error: "User not found",
            });
        });

        it("should fail if the password is wrong", async () => {
            const mockedUser = {
                checkPassword: jest.fn(() => Promise.resolve(false)),
            };
            usersRespository.findOne?.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual({ ok: false, error: "Wrong password" });
        });

        it("should return token if password correct", async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(true)),
            };
            usersRespository.findOne?.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({ ok: true, token: "signed-token" });
        });

        it("should fail on exception", async () => {
            usersRespository.findOne?.mockRejectedValue(new Error());
            const result = await service.login(loginArgs);
            expect(result).toEqual({ ok: false, error: "Login Failed" });
        });
    });

    // it.todo("findById");
    describe("findById", () => {
        const findByIdArgs = { id: 1 };
        it("should find an existing user", async () => {
            usersRespository.findOneOrFail?.mockResolvedValue(findByIdArgs);
            const result = await service.findById(1);
            expect(result).toEqual({ ok: true, user: findByIdArgs });
        });

        it("should fail if no user is found", async () => {
            usersRespository.findOneOrFail?.mockRejectedValue(new Error());
            const result = await service.findById(1);
            expect(result).toEqual({ ok: false, error: "User Not Found" });
        });
    });

    // it.todo("editProfile");
    describe("editProfile", () => {
        it("should change email", async () => {
            const oldUser = {
                email: "bs@old.com",
                verified: true,
            };
            const editProfileArgs = {
                userId: 1,
                input: { email: "bs@new.com" },
            };

            const newVerification = {
                code: "code",
            };
            const newUser = {
                verified: false,
                email: editProfileArgs.input.email,
            };

            usersRespository.findOne?.mockResolvedValue(oldUser);
            verificationsRepository.create?.mockReturnValue(newVerification);
            verificationsRepository.save?.mockResolvedValue(newVerification);
            await service.editProfile(
                editProfileArgs.userId,
                editProfileArgs.input
            );

            expect(usersRespository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRespository.findOne).toHaveBeenCalledWith({
                where: { id: editProfileArgs.userId },
            });
            expect(verificationsRepository.create).toHaveBeenCalledWith({
                user: newUser,
            });
            expect(verificationsRepository.save).toHaveBeenCalledWith(
                newVerification
            );

            expect(mailService.sendVarificationEmail).toHaveBeenCalledWith(
                newUser.email,
                newVerification.code
            );
        });

        it("should change password", async () => {
            const editProfileArgs = {
                userId: 1,
                input: { password: "new.password" },
            };
            usersRespository.findOne?.mockResolvedValue({ password: "old" });
            const result = await service.editProfile(
                editProfileArgs.userId,
                editProfileArgs.input
            );
            expect(usersRespository.save).toHaveBeenCalledTimes(1);
            expect(usersRespository.save).toHaveBeenCalledWith(
                editProfileArgs.input
            );
            expect(result).toEqual({ ok: true });
        });

        it("should fail on exception", async () => {
            usersRespository.findOne?.mockRejectedValue(new Error());
            const result = await service.editProfile(1, {
                email: "hello@world.com",
            });
            expect(result).toEqual({
                ok: false,
                error: "Could not update profile.",
            });
        });
    });

    // it.todo("verifyEmail");
    describe("verifyEmail", () => {
        it("should verify email", async () => {
            const mockedVerification = {
                user: {
                    verified: false,
                },
                id: 1,
            };
            verificationsRepository.findOne?.mockResolvedValue(
                mockedVerification
            );
            const result = await service.verifyEmail("code");

            expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.findOne).toHaveBeenCalledWith(
                expect.any(Object)
            );
            expect(usersRespository.save).toHaveBeenCalledTimes(1);
            expect(usersRespository.save).toHaveBeenCalledWith({
                verified: true,
            });
            expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.delete).toHaveBeenCalledWith(
                mockedVerification.id
            );
            expect(result).toEqual({ ok: true });
        });

        it("should fail on verification not found", async () => {
            verificationsRepository.findOne?.mockResolvedValue(undefined);
            const result = await service.verifyEmail("code");
            expect(result).toEqual({
                ok: false,
                error: "Verification Not Found",
            });
        });

        it("should fail on exception", async () => {
            verificationsRepository.findOne?.mockRejectedValue(new Error());
            const result = await service.verifyEmail("code");
            expect(result).toEqual({
                ok: false,
                error: "Could not Verify Email",
            });
        });
    });
});
