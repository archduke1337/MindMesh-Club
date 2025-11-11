// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, loginWithGitHub } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    }
  };

  const handleGitHubLogin = () => {
    try {
      loginWithGitHub();
    } catch (err: any) {
      setError(err.message || "Failed to login with GitHub");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <Card className="w-full max-w-sm md:max-w-md">
        <CardHeader className="flex flex-col gap-1 items-start px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome Back</h1>
          <p className="text-xs sm:text-small text-default-500">Login to your Mind Mesh account</p>
        </CardHeader>
        <CardBody className="p-4 sm:p-6 md:p-8 gap-3 md:gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
            <Input
              label="Email"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              isDisabled={loading}
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small"
              }}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              isDisabled={loading}
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small"
              }}
            />
            {error && (
              <div className="text-danger text-xs sm:text-small bg-danger/10 p-2 md:p-3 rounded">{error}</div>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="w-full"
              size="lg"
            >
              Login
            </Button>
          </form>

          {/* OAuth buttons commented out
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-divider"></div>
            <span className="flex-shrink mx-4 text-default-400 text-small">OR</span>
            <div className="flex-grow border-t border-divider"></div>
          </div>

          <Button
            variant="bordered"
            className="w-full"
            startContent={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
            onPress={handleGoogleLogin}
          >
            Continue with Google
          </Button>

          <Button
            variant="bordered"
            className="w-full"
            startContent={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            }
            onPress={handleGitHubLogin}
          >
            Continue with GitHub
          </Button>
          */}
        </CardBody>
        <CardFooter className="flex flex-col gap-2 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
          <div className="text-xs sm:text-small text-center w-full">
            Don't have an account?{" "}
            <Link as={NextLink} href="/register" size="sm">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}