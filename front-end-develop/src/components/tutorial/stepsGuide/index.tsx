import Joyride from "react-joyride";

function StepsGuide({ steps }: { steps: any }) {
  return (
    <div>
      <Joyride steps={steps} run />
    </div>
  );
}

export default StepsGuide;
