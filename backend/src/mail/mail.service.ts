import { Inject, Injectable } from "@nestjs/common";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { EmailVar, MailModuleOptions } from "./mail.interfaces";
import got from "got";
import * as FormData from "form-data";

@Injectable()
export class MailService {
    constructor(
        @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
    ) {
        // console.log(options);
    }

    async sendEmail(
        subject: string,
        template: string,
        emailVars: EmailVar[],
        to: string
    ): Promise<boolean> {
        // console.log("hello world");
        // console.log(this.options.domain);
        // console.log(this.options.apiKey);

        const form = new FormData();

        form.append(
            "from",
            `Mailgun Sandbox <postmaster@${this.options.domain}>`
        );
        form.append("to", `<${to}>`);
        form.append("subject", subject);
        form.append("template", template);
        emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

        try {
            await got.post(
                `https://api.mailgun.net/v3/${this.options.domain}/messages`,
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `api:${this.options.apiKey}`
                        ).toString("base64")}`,
                    },
                    body: form,
                }
            );

            return true;
        } catch (e) {
            return false;
        }
    }

    async sendVarificationEmail(email: string, code: string) {
        await this.sendEmail(
            "Verify Your Email",
            "alert",
            [
                { key: "code", value: code },
                { key: "username", value: email },
            ],
            email
        );
    }
}
