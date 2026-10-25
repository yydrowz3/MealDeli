import { message as localizedMessage } from "../../../shared/i18n";
import { z } from "zod";

export const uploadedImageSchema = z.object({
  key: z.string().min(1),
  url: z.url().refine((url) => {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  }, localizedMessage("media.httpRequired")),
});
