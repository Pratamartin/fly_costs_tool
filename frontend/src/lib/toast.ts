import { toast as sonner } from "sonner";

const DURATION = 4000;

export const toast = {
  success: (message: string) => sonner.success(message, { duration: DURATION }),
  error: (message: string) => sonner.error(message, { duration: DURATION }),
  warning: (message: string) => sonner.warning(message, { duration: DURATION }),
};
