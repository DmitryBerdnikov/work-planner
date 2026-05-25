import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { authClient } from "@shared/auth/auth-client";
import { fetchSession } from "@shared/api/generated/work-planner-api";
import { ApiError } from "@shared/api/http";
import {
  authCredentialsSchema,
  defaultAuthCredentials,
  type AuthCredentials,
  type AuthMode
} from "../model/auth-form";
import { authErrorMessages } from "../model/auth-messages";

export const useAuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AuthCredentials>({
    resolver: zodResolver(authCredentialsSchema),
    defaultValues: defaultAuthCredentials
  });

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = form.handleSubmit(async (credentials) => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const result = await authClient.signUp.email({
          email: credentials.email,
          password: credentials.password,
          name: credentials.email
        });

        if (result.error) {
          setError(result.error.message ?? authErrorMessages.registerFailed);
          return;
        }

        await navigate({ to: "/pending" });
        return;
      }

      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password
      });

      if (result.error) {
        setError(result.error.message ?? authErrorMessages.loginFailed);
        return;
      }

      const session = await fetchSession();

      if (session.profile.status === "active") {
        await navigate({ to: "/" });
        return;
      }

      await navigate({ to: "/pending" });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
        return;
      }

      setError(submitError instanceof Error ? submitError.message : authErrorMessages.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    mode,
    error,
    isSubmitting,
    form,
    handleModeChange,
    handleSubmit
  };
};
