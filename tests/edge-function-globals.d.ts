declare const Deno: {
  env: { get(name: string): string | undefined };
};

declare module "npm:@supabase/server@^1" {
  export function withSupabase(options: unknown, handler: (request: Request, context: any) => Promise<Response>): unknown;
}
