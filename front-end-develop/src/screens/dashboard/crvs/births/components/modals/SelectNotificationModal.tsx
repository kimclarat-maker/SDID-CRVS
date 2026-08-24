import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoListNotifications } from "@/demo/services/crvsNotifications";
import { canConvertNotification } from "@/demo/services/crvsNotifications";
import { BirthNotification } from "@/domain/crvs/types";
import { childDisplayName, formatDate } from "../../shared";

export type SelectNotificationModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (notification: BirthNotification) => void;
};

/** Search/filter over ACCEPTED birth notifications for the "register from
 * notification" entry path. Already-converted notifications are shown but
 * disabled (canConvertNotification) rather than hidden, so the officer can
 * see why a case they expect isn't selectable. */
export default function SelectNotificationModal({ show, onClose, onSelect }: SelectNotificationModalProps) {
  const [search, setSearch] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<BirthNotification[]>([]);

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    demoListNotifications({ status: "ACCEPTED", search, facilityId: facilityId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, limit: 50 })
      .then((res) => {
        if (!cancelled) setNotifications(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Couldn't load notifications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show, search, facilityId, dateFrom, dateTo]);

  return (
    <Modal show={show} handleClose={onClose} title="Select a birth notification" size="lg" testId="select-notification-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-filter-bar">
          <div className="crvs-filter-field">
            <label htmlFor="sn-search">Search</label>
            <input id="sn-search" placeholder="Reference or child name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="sn-facility">Facility ID</label>
            <input id="sn-facility" placeholder="Facility ID" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="sn-from">Date of birth from</label>
            <input id="sn-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="sn-to">Date of birth to</label>
            <input id="sn-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        {loading && <p className="crvs-form-hint">Loading notifications…</p>}
        {error && <p className="crvs-form-error">{error}</p>}
        {!loading && !error && notifications.length === 0 && (
          <p className="crvs-form-hint">No accepted notifications match these filters.</p>
        )}

        <div className="crvs-table-scroll">
          {notifications.length > 0 && (
            <table className="crvs-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Child</th>
                  <th>Date of birth</th>
                  <th>Facility</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const convertible = canConvertNotification(n);
                  return (
                    <tr key={n.id}>
                      <td>{n.reference}</td>
                      <td>{childDisplayName(n.child)}</td>
                      <td>{formatDate(n.child.dateOfBirth)}</td>
                      <td>{n.facilityName}</td>
                      <td className="crvs-table-action-cell">
                        {convertible ? (
                          <Button type="button" text="Select" size="sm" appearance="primary" onClick={() => onSelect(n)} testId={`select-notification-${n.id}`} />
                        ) : (
                          <span className="crvs-status-pill crvs-status-neutral crvs-status-icon-label">
                            <Icon name="link" />
                            Already converted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
