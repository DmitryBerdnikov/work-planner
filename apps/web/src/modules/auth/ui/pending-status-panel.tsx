import type { ProfileStatus } from "@work-planner/shared";
import { Clock3, ShieldBan } from "lucide-react";
import { cn } from "@shared/lib/cn";

type PendingStatusPanelProps = {
  email: string;
  status: ProfileStatus;
};

export const PendingStatusPanel = ({ email, status }: PendingStatusPanelProps) => {
  const isBlocked = status === "blocked";

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className={cn("rounded-full p-3", isBlocked ? "bg-danger/15 text-danger" : "bg-accent-blue/15 text-accent-blue")}>
          {isBlocked ? <ShieldBan size={22} /> : <Clock3 size={22} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isBlocked ? "Доступ закрыт" : "Аккаунт ожидает активации"}</h1>
          <p className="text-sm text-text-muted">{email}</p>
        </div>
      </div>

      {isBlocked ? (
        <p className="text-sm leading-6 text-text-muted">
          Профиль заблокирован. Рабочие разделы недоступны. Если это ошибка, обратитесь к администратору.
        </p>
      ) : (
        <p className="text-sm leading-6 text-text-muted">
          Регистрация прошла успешно. Доступ к клиентам, записям и отчетам откроется после ручной активации профиля в
          базе данных.
        </p>
      )}
    </>
  );
};
