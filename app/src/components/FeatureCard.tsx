import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function FeatureCard({ title, icon, children }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">{children}</CardContent>
    </Card>
  );
}
