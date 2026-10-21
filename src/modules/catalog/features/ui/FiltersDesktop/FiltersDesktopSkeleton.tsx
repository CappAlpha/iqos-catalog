import groupS from "../FiltersGroup/FiltersGroup.module.scss";
import s from "./FiltersDesktop.module.scss";

interface IProps {
  arrays: number;
  count: number;
}

export const FiltersDesktopSkeleton = ({ arrays, count }: IProps) => {
  return (
    <>
      {Array.from({ length: arrays }, (_, i) => (
        <div key={i} className={s.skeletonGroup} aria-hidden="true">
          <div className={s.subtitleSkeleton} />
          <div className={groupS.categoryList}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={s.checkBoxSkeleton} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
