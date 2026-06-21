import s from "./PageLoader.module.scss";

export const PageLoader = () => {
  return (
    <div className={s.root}>
      <div className={s.loader} />
    </div>
  );
};
