import { toast, type ToastT } from "sonner";

interface IToastOptions {
  title: string;
  type?: ToastT["type"];
  description?: string;
  buttonLabel?: string;
  action?: () => void;
  duration?: ToastT["duration"];
  position?: ToastT["position"];
}

export const customToastTemplate = ({
  title,
  type = "default",
  description,
  buttonLabel,
  action,
  duration = 5000,
  position,
}: IToastOptions) => {
  const options: Parameters<typeof toast>[1] = {
    duration,
    position,
  };

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
