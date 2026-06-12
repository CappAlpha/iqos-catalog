import s from "./EndpointsSection.module.scss";

export interface Props {
  interfaces: USBInterface[];
}

export const EndpointsSection = ({ interfaces }: Props) => {
  const endpoints = interfaces.flatMap((iface) => {
    const alternate = iface.alternate ?? iface.alternates[0];
    const endpointList = alternate?.endpoints ?? [];

    return endpointList.map((ep) => ({
      interfaceNumber: iface.interfaceNumber,
      endpointNumber: ep.endpointNumber,
      direction: ep.direction,
      type: ep.type,
    }));
  });

  if (endpoints.length === 0) return null;

  return (
    <section className={s.root}>
      <h3 className={s.title}>Endpoints</h3>
      <div className={s.wrap}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr className={s.tableRow}>
              <th>
                <b>INTERFACE</b>
              </th>
              <th>
                <b>ENDPOINT</b>
              </th>
              <th>
                <b>DIRECTION</b>
              </th>
              <th>
                <b>TYPE</b>
              </th>
            </tr>
          </thead>
          <tbody className={s.tableBody}>
            {endpoints.map((endpoint) => {
              const key = `${endpoint.interfaceNumber}-${endpoint.endpointNumber}-${endpoint.direction}`;
              return (
                <tr key={key}>
                  <td>{endpoint.interfaceNumber}</td>
                  <td>{endpoint.endpointNumber}</td>
                  <td>{endpoint.direction}</td>
                  <td>{endpoint.type}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
