// Type stubs for optional dependencies not yet installed
declare module "@clerk/nextjs" {
  export function SignIn(props: Record<string, unknown>): React.ReactElement;
  export function SignUp(props: Record<string, unknown>): React.ReactElement;
}

declare module "@clerk/nextjs/server" {
  export function auth(): Promise<{ userId: string | null }>;
  export function currentUser(): Promise<Record<string, unknown> | null>;
}
