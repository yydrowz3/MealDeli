import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createClient } from "@supabase/supabase-js";

@Controller("uploads")
export class UploadsController {
    @Post("")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const fallBackFileUrl = `https://img.daisyui.com/images/profile/demo/batperson@192.webp`;
        const SUPABASE_KEY = process.env.SUPABASE_KEY!;
        const SUPABASE_URL = process.env.SUPABASE_URL!;

        try {
            const objectName = `${Date.now() + file.originalname}`;
            const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
            const { error: errorSupabase } = await supabase.storage
                .from("bucket_name")
                .upload(objectName, file.buffer);
            if (errorSupabase) {
                return {
                    ok: false,
                    error: "Could not upload file.",
                    url: fallBackFileUrl,
                };
            } else {
                const uploadedFileUrl = `${SUPABASE_URL}/storage/v1/object/public/cover/public/${objectName}`;
                return { ok: true, url: uploadedFileUrl };
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could not upload file.",
                url: fallBackFileUrl,
            };
        }
    }
}
