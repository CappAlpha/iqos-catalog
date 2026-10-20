import { observer } from "mobx-react-lite";

import { catalogM } from "../../model/catalogM";
import { CatalogToolbar } from "../CatalogToolbar";

import s from "./CatalogHeader.module.scss";

interface IProps {
  onScrollToTop: () => void;
}

export const CatalogHeader = observer(({ onScrollToTop }: IProps) => {
  const { error } = catalogM;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Каталог</h1>

      {!error && <CatalogToolbar onScrollToTop={onScrollToTop} />}
    </div>
  );
});
