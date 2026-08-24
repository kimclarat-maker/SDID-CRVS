import WarningModal from "@/components/crvs/modals/WarningModal";

/** Shown when a matched SDID identity is already marked DECEASED — almost
 * certainly the duplicate-death scenario, so this steers the officer to the
 * duplicate check rather than letting them silently re-register the same
 * person (spec §8 "Identity already marked deceased"). */
export default function IdentityAlreadyDeceasedModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <WarningModal show={show} onClose={onClose} title="This identity is already marked deceased" testId="identity-already-deceased-modal">
      <p style={{ margin: 0 }}>
        The SDID identity you matched has already been marked deceased by a previous death registration. Continuing
        with this case may create a duplicate death record — check the duplicate-detection results in the Identity
        &amp; duplicate checks step before submitting.
      </p>
    </WarningModal>
  );
}
