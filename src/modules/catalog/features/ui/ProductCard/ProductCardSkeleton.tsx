import s from "./ProductCard.module.scss";

export const ProductCardSkeleton = () => {
  return (
    <div className={s.root}>
      <div className={s.imgWrapSkeleton} />

      <div className={s.textWrap}>
        <div className={s.titleSkeleton} />
        <div className={s.categorySkeleton} />
      </div>

      <div className={s.bottom}>
        <div className={s.bottomWrap}>
          <div className={s.priceSkeleton} />
          <div className={s.buttonSkeleton} />
        </div>
      </div>
    </div>
  );
};
