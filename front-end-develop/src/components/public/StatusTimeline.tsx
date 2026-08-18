export default function StatusTimeline({
  stages,
  currentIndex,
}: {
  stages: string[];
  currentIndex: number;
}) {
  return (
    <ol className="public-timeline" aria-label="Application status timeline">
      {stages.map((stage, index) => {
        let stateClass = "";
        if (index < currentIndex) stateClass = "is-complete";
        if (index === currentIndex) stateClass = "is-current";

        return (
          <li key={stage} className={stateClass}>
            <strong>{stage}</strong>
            {index === currentIndex && (
              <span className="visually-hidden"> (current status)</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
