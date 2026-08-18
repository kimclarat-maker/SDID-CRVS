import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import { Heading, Modal } from "rsuite";

function Tutorial({
  handleClose,
  data,
}: {
  handleClose: () => void;
  data: { title: string; description: string }[];
}) {
  const { translation } = useContext(LanguageContext);
  const [page, setPage] = useState(0);

  const total = 2;

  const onNext = () => {};

  return (
    <div>
      <div>
        {data.map((el: any) => {
          return (
            <div>
              <Heading level={3}>{el.title}</Heading>
              <span>{el.description}</span>
            </div>
          );
        })}
      </div>
      <Modal.Footer>
        <Button
          text={translation.skip}
          onClick={handleClose}
          appearance="default"
        />
        {page !== total ? (
          <Button text={translation.next} onClick={onNext} />
        ) : (
          <Button text={translation.done} onClick={handleClose} />
        )}
      </Modal.Footer>
    </div>
  );
}

export default Tutorial;
