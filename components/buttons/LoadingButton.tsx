import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

interface Props extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingIconClassname?: string;
}

export const LoadingButton = ({
  loading = false,
  disabled,
  children,
  className,
  loadingIconClassname,
  ...props
}: Props) => {
  return (
    <Button
      disabled={loading || disabled}
      className={cn(
        loading && "[&_svg:not([data-icon='loading'])]:hidden!",
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2
          data-icon="loading"
          className={cn("animate-spin", loadingIconClassname)}
        />
      )}
      {children}
    </Button>
  );
};
