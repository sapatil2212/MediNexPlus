import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  SESSION_SECRET: z.string().min(10),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string(),
  EMAIL_USERNAME: z.string(),
  EMAIL_PASSWORD: z.string(),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string(),
  SUPER_ADMIN_SECURITY_KEY: z.string(),
});

type Env = z.infer<typeof envSchema>;

let _cachedEnv: Env | undefined;

function getEnv(): Env {
  if (_cachedEnv) return _cachedEnv;

  const _env = envSchema.safeParse(process.env);

  if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment variables");
  }

  _cachedEnv = _env.data;
  return _cachedEnv;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
