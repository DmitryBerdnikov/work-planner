import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/cn";
import type { AuthMode } from "../model/auth-form";

type AuthModeSwitchProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

const modeButtonClassName = (isActive: boolean) =>
  cn(
    "min-h-10 w-full rounded-input px-3",
    isActive ? "bg-surface text-text shadow-sm" : "text-text-muted"
  );

export const AuthModeSwitch = ({ mode, onModeChange }: AuthModeSwitchProps) => {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-input bg-surface-muted p-1">
      <Button
        className={modeButtonClassName(mode === "login")}
        type="button"
        variant="ghost"
        onClick={() => onModeChange("login")}
      >
        Вход
      </Button>
      <Button
        className={modeButtonClassName(mode === "register")}
        type="button"
        variant="ghost"
        onClick={() => onModeChange("register")}
      >
        Регистрация
      </Button>
    </div>
  );
};
