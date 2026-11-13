import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Verification } from "src/users/entities/verification.entity";
// import { getConnection } from "typeorm";

jest.mock("got", () => {
    return {
        post: jest.fn(),
    };
});

const GRAPHQL_ENDPOINT = "/graphql";

const testUser = {
    email: "what@ever.com",
    password: "121212",
    newEmail: "newshit@bull.com",
};

describe("UserModule (e2e)", () => {
    let app: INestApplication<App>;
    let usersRepository: Repository<User>;
    let verificationsRepository: Repository<Verification>;
    let jwtToken: string;

    const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
    const publicTest = (query: string) => baseTest().send({ query });
    const privateTest = (query: string) =>
        baseTest().set("X-JWT", jwtToken).send({ query });

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        usersRepository = module.get<Repository<User>>(
            getRepositoryToken(User)
        );
        verificationsRepository = module.get<Repository<Verification>>(
            getRepositoryToken(Verification)
        );
        await app.init();
    });

    afterAll(async () => {
        // await getConnection().dropDatabase();
        const tempUser = await usersRepository.findOne({
            where: { email: testUser.newEmail },
        });
        if (tempUser) {
            // await usersRepository.remove(tempUser);
            await usersRepository.delete(tempUser.id);
        }
        app.close();
    });

    // it("/ (GET)", () => {
    //     return request(app.getHttpServer())
    //         .get("/")
    //         .expect(200)
    //         .expect("Hello World!");
    // });

    // it.todo("createAccount");
    describe("createAccount", () => {
        it("should create account", () => {
            return publicTest(
                `mutation {
                    createAccount(input: {
                        email: "${testUser.email}",
                        password: "${testUser.password}",
                        role: Owner
                    }) {
                        ok
                        error
                    }
                }`
            )
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.createAccount.ok).toBe(true);
                    expect(res.body.data.createAccount.error).toBe(null);
                });
        });

        it("should fail if account already exists", () => {
            return publicTest(`mutation {
                                createAccount(input: {
                                    email: "${testUser.email}",
                                    password: "${testUser.password}",
                                    role: Owner
                                }) {
                                    ok
                                    error
                                }
                            }`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.createAccount.ok).toBe(false);
                    expect(res.body.data.createAccount.error).toEqual(
                        expect.any(String)
                    );
                });
        });
    });

    // it.todo("login");
    describe("login", () => {
        it("should login with correct credentials", () => {
            return publicTest(
                `mutation {
                    login(input: {
                        email:"${testUser.email}",
                        password: "${testUser.password}"
                    }) {
                        ok
                        error
                        token
                    }
                }`
            )
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: { login },
                        },
                    } = res;
                    expect(login.ok).toBe(true);
                    expect(login.error).toBe(null);
                    expect(login.token).toEqual(expect.any(String));
                    jwtToken = login.token;
                });
        });

        it("should not be able to login with wrong credentials", () => {
            return publicTest(`mutation {
                            login(input: {
                                email:"${testUser.email}",
                                password: "wrongpassword"
                            }) {
                                ok
                                error
                                token
                            }
                        }`)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: { login },
                        },
                    } = res;
                    expect(login.ok).toBe(false);
                    expect(login.error).toEqual(expect.any(String));
                    expect(login.token).toBe(null);
                });
        });
    });

    describe("userProfile", () => {
        let userId: number;
        beforeAll(async () => {
            const [user] = await usersRepository.find();
            userId = user.id;
        });
        it("should see a user's profile", () => {
            return privateTest(`{
                            userProfile(userId: ${userId}) {
                                ok
                                error
                                user {
                                    id
                                }
                            }
                        }`)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: {
                                    ok,
                                    error,
                                    user: { id },
                                },
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                    expect(id).toBe(userId);
                });
        });

        it("should not find a profile", () => {
            return privateTest(
                `{
                    userProfile(userId: 666) {
                        ok
                        error
                        user {
                            id
                        }
                    }
                }`
            )
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: { ok, error, user },
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe(expect.any(String));
                    expect(user).toBe(null);
                });
        });
    });

    // it.todo("me");
    describe("me", () => {
        it("should find my profile", () => {
            return privateTest(`
                        {
                            me {
                                email
                            }
                        }
                `)
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: { email },
                        },
                    } = res;
                    expect(email).toBe(testUser.email);
                });
        });

        it("should not allow logged out user", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        {
                            me {
                                email
                            }
                        }
                `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: { errors },
                    } = res;
                    const [error] = errors;
                    expect(error.message).toBe("Forbidden resource");
                });
        });
    });

    describe("editProfile", () => {
        it("should change email", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .set("X-JWT", jwtToken)
                .send({
                    query: `
                        mutation {
                            editProfile(input: {
                                email: "${testUser.newEmail}"
                            }) {
                                ok
                                error
                            }
                        }
                    `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                editProfile: { ok, error },
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                });
        });

        it("should have new email", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                                {
                                    me {
                                        email
                                    }
                                }`,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                me: { email },
                            },
                        },
                    } = res;
                    expect(email).toBe(testUser.newEmail);
                });
        });
    });

    // it.todo("verifyEmail");
    describe("verifyEmail", () => {
        let verificationCode: string;
        beforeAll(async () => {
            const [verification] = await verificationsRepository.find();
            // console.log(verification);
            verificationCode = verification.code;
        });
        it("should verifiy email", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                    mutation {
                        verifyEmail(input: {
                            code: "${verificationCode}"
                        }) {
                            ok
                            error
                        }
                    }
                `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                verifyEmail: { ok, error },
                            },
                        },
                    } = res;
                    expect(ok).toBe(true);
                    expect(error).toBe(null);
                });
        });
        it("should fail on verfication code not found", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                    mutation {
                        verifyEmail(input: {
                            code: "bullshit"
                        }) {
                            ok
                            error
                        }
                    }
                `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                verifyEmail: { ok, error },
                            },
                        },
                    } = res;
                    expect(ok).toBe(false);
                    expect(error).toBe(expect.any(String));
                });
        });
    });
});
