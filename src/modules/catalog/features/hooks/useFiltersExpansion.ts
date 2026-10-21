import { useState, type RefObject, type TransitionEvent } from "react";

const scrollExpandedCategories = (
  element: HTMLDivElement,
  container: HTMLDivElement | null,
) => {
  const group = element.parentElement;
  if (!container || !group) return;

  const top = container.getBoundingClientRect().top + container.clientTop;
  const bottom = top + container.clientHeight;
  const groupBounds = group.getBoundingClientRect();
  const target =
    groupBounds.height <= container.clientHeight
      ? groupBounds
      : element.getBoundingClientRect();

  if (target.bottom <= bottom) return;

  const offset =
    target.height <= container.clientHeight
      ? target.bottom - bottom
      : Math.max(0, target.top - top);

  container.scrollTo({ top: container.scrollTop + offset });
};

export const useFiltersExpansion = (
  scrollContainerRef: RefObject<HTMLDivElement | null>,
) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((expanded) => !expanded);
  };

  const handleExpandEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      isExpanded &&
      event.target === event.currentTarget &&
      event.propertyName === "grid-template-rows"
    ) {
      scrollExpandedCategories(event.currentTarget, scrollContainerRef.current);
    }
  };

  return { isExpanded, toggleExpanded, handleExpandEnd };
};
