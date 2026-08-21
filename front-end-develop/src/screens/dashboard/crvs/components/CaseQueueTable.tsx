import Empty from "@/components/empty";

export type QueueColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

export type CaseQueueTableProps<T> = {
  rows: T[];
  columns: QueueColumn<T>[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: string;
};

/** Config-driven queue/list table shared by every CRVS queue screen (spec
 * §6/§12/§16/§17): columns and per-row actions are supplied by the caller,
 * this owns loading/empty/error states and the horizontal-scroll container
 * that keeps wide queues from ever overflowing the page. */
export default function CaseQueueTable<T>({
  rows,
  columns,
  getRowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyIcon = "inbox",
}: CaseQueueTableProps<T>) {
  if (loading) {
    return (
      <div className="crvs-table-scroll" aria-busy="true" aria-label="Loading">
        <table className="crvs-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    <span className="crvs-skeleton-line" style={{ display: "inline-block", width: "80%", height: 12, background: "var(--status-neutral-bg)", borderRadius: 6 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        icon="error"
        title="Couldn't load this list"
        description={error}
        button={
          onRetry ? (
            <button type="button" className="crvs-tab" onClick={onRetry} style={{ marginTop: 8 }}>
              Try again
            </button>
          ) : undefined
        }
      />
    );
  }

  if (rows.length === 0) {
    return <Empty icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="crvs-table-scroll">
      <table className="crvs-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
