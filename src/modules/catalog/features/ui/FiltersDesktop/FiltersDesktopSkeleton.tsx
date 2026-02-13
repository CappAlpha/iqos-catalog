import s from './FiltersDesktop.module.scss';

interface Props {
  count: number;
}

export const FiltersDesktopSkeleton = ({ count }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.titleSkeleton} />

      <div className={s.categories}>
        <div className={s.subtitleSkeleton} />
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={s.checkBoxSkeleton} />
        ))}
      </div>

      <div className={s.categories}>
        <div className={s.subtitleSkeleton} />
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={s.checkBoxSkeleton} />
        ))}
      </div>
    </div>
  );
};