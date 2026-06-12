import s from "./InterfacesSection.module.scss";

export interface Props {
  interfaces: USBInterface[];
}

export const InterfacesSection = ({ interfaces }: Props) => {
  if (interfaces.length === 0) return null;

  return (
    <section className={s.root}>
      <h3 className={s.title}>Интерфейсы</h3>
      <ul className={s.list}>
        {interfaces.map((iface) => (
          <li key={iface.interfaceNumber} className={s.item}>
            Интерфейс №{iface.interfaceNumber} — alternates:{" "}
            {iface.alternates.length}
          </li>
        ))}
      </ul>
    </section>
  );
};
