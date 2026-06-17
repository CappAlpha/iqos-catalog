import { toast, type ToastT } from "sonner";

interface ToastOptions {
  title: string;
  type?: ToastT["type"];
  description?: string;
  buttonLabel?: string;
  action?: () => void;
}

export const customToastTemplate = ({
  title,
  type,
  description,
  buttonLabel,
  action,
}: ToastOptions) => {
  const options: Parameters<typeof toast>[1] = {};

  if (description) {
    options.description = description;
  }

  if (buttonLabel && action) {
    options.action = {
      label: buttonLabel,
      onClick: action,
    };
  }

  switch (type) {
    case "success":
      toast.success(title, options);
      break;
    case "error":
      toast.error(title, options);
      break;
    case "info":
      toast.info(title, options);
      break;
    case "warning":
      toast.warning(title, options);
      break;
    default:
      toast(title, options);
      break;
  }
};
