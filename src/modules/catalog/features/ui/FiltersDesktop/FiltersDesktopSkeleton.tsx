import s from './FiltersDesktop.module.scss';

interface Props {
  arrays: number;
  count: number;
}

export const FiltersDesktopSkeleton = ({ arrays, count }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.titleSkeleton} />

      {Array.from({ length: arrays }, (_, i) => (
        <div key={i} className={s.categories}>
          <div className={s.subtitleSkeleton} />
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className={s.checkBoxSkeleton} />
          ))}
        </div>
      ))}
    </div>
  );
};