import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface PhoneGateProps {
  hasPhone: boolean | null | undefined;
  children: React.ReactNode;
}

export function PhoneGate({ hasPhone, children }: PhoneGateProps) {
  const { t } = useTranslation();

  if (hasPhone) return <>{children}</>;

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Phone className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700 dark:text-amber-400 font-bold">
          {t("phone.gateTitle")}
        </AlertTitle>
        <AlertDescription className="text-amber-600 dark:text-amber-300 mt-1">
          {t("phone.gateDesc")}
        </AlertDescription>
        <div className="mt-3">
          <Link href="/profile">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              {t("phone.goToProfile")}
            </Button>
          </Link>
        </div>
      </Alert>
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
    </div>
  );
}
