import { http, HttpResponse, type HttpHandler } from "msw";

export type MediaHandlerOptions = {
  endpoint?: string;
  expectedToken?: string;
  response?: { key: string; url: string };
};

export function createMediaHandlers({
  endpoint = "http://localhost/uploads",
  expectedToken = "access-token",
  response = {
    key: "uploads/test.webp",
    url: "https://assets.example.com/uploads/test.webp",
  },
}: MediaHandlerOptions = {}): HttpHandler[] {
  return [
    http.post(endpoint, async ({ request }) => {
      if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
        return HttpResponse.json({}, { status: 401 });
      }
      const body = new TextDecoder().decode(await request.arrayBuffer());
      if (!body.includes('name="file"')) return HttpResponse.json({}, { status: 400 });
      return HttpResponse.json(response);
    }),
  ];
}
