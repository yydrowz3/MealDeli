import { Test } from "@nestjs/testing";
import * as FormData from "form-data";
import got from "got";
import { MailService } from "./mail.service";
import { CONFIG_OPTIONS } from "src/common/common.constants";

// jest.mock("got", () => {
//     return {
//         post: jest.fn(),
//     };
// });
// jest.mock("form-data", () => {
//     return {
//         append: jest.fn(),
//     };
// });
jest.mock("got");
jest.mock("form-data");

const TEST_DOMAIN = "test-domain";

describe("MailService", () => {
    let service: MailService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: CONFIG_OPTIONS,
                    useValue: {
                        apiKey: "test-apiKey",
                        domain: TEST_DOMAIN,
                    },
                },
            ],
        }).compile();
        service = module.get<MailService>(MailService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    // it.todo("sendVerificationEmail");
    describe("sencVerificationEmail", () => {
        it("should call sendEmail", () => {
            const sendVerificationEmailArgs = {
                email: "email",
                code: "code",
            };
            jest.spyOn(service, "sendEmail").mockImplementation(
                async () => true
            );
            service.sendVarificationEmail(
                sendVerificationEmailArgs.email,
                sendVerificationEmailArgs.code
            );
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith(
                "Verify Your Email",
                "alert",
                [
                    { key: "code", value: sendVerificationEmailArgs.code },
                    { key: "username", value: sendVerificationEmailArgs.email },
                ]
            );
        });
    });

    // it.todo("sendEmail");
    describe("sendEmail", () => {
        it("sends email", async () => {
            const ok = await service.sendEmail("", "", []);
            const formSpy = jest.spyOn(FormData.prototype, "append");
            expect(formSpy).toHaveBeenCalled();
            expect(got.post).toHaveBeenCalledTimes(1);
            expect(got.post).toHaveBeenCalledWith(
                expect.any(
                    `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`
                ),
                expect.any(Object)
            );
            expect(ok).toEqual(true);
        });
    });

    it("fails on error", async () => {
        jest.spyOn(got, "post").mockImplementation(() => {
            throw new Error();
        });
        const ok = await service.sendEmail("", "", []);
        expect(ok).toEqual(false);
    });
});
