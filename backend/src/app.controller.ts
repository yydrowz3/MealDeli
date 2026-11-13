import { Controller, Get } from "@nestjs/common";

@Controller("")
export class AppController {
    @Get()
    welcome() {
        return "Thank you for choosing Tiny Food Delivery.";
    }
}
