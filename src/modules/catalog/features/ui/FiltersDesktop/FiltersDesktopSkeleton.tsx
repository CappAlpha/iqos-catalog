import groupS from "../FiltersGroup/FiltersGroup.module.scss";
import s from "./FiltersDesktop.module.scss";

interface IProps {
  arrays: number;
  count: number;
}

export const FiltersDesktopSkeleton = ({ arrays, count }: IProps) => {
  return (
    <div className={s.root} aria-hidden="true">
      <div className={s.titleSkeleton} />

      <div className={s.body}>
        {Array.from({ length: arrays }, (_, i) => (
          <div key={i} className={groupS.categories}>
            <div className={s.subtitleSkeleton} />
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={s.checkBoxSkeleton} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
