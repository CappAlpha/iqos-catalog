import clsx from "clsx";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import { useViewport } from "@/shared/hooks/useViewport";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

import s from "../Header.module.scss";

interface IUnavailableNavItemProps {
  children: ReactNode;
  reason: string;
  tooltipId: string;
}

export const UnavailableNavItem = ({
  children,
  reason,
  tooltipId,
}: IUnavailableNavItemProps) => {
  const { isMobileM } = useViewport();
  const [isHoveredWithMouse, setIsHoveredWithMouse] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const updateTooltipPosition = () => {
    if (!isMobileM || !wrapperRef.current || !tooltipRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const unboundedLeft =
      wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
    const left = Math.max(
      12,
      Math.min(unboundedLeft, viewportWidth - tooltipRect.width - 12),
    );

    tooltipRef.current.style.setProperty(
      "--tooltip-shift-x",
      `${left - unboundedLeft}px`,
    );
  };

  const handleClick = () => {
    if (!isMobileM) return;

    customToastTemplate({
      title: "Страница недоступна",
      description: reason,
      type: "info",
      duration: 5000,
    });
  };

  const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== "mouse") return;

    updateTooltipPosition();
    setIsHoveredWithMouse(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === "mouse") setIsHoveredWithMouse(false);
  };

  return (
    <span
      className={clsx(s.disabledLinkWrap, {
        [s.tooltipVisible]: isHoveredWithMouse,
      })}
      ref={wrapperRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="button"
        className={clsx(s.navLink, s.disabled)}
        onClick={handleClick}
        onFocus={updateTooltipPosition}
      >
        {children}
      </button>
      <span
        className={s.tooltip}
        id={tooltipId}
        role="tooltip"
        ref={tooltipRef}
      >
        {reason}
      </span>
    </span>
  );
};
