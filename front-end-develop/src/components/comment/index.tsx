import Button from "@/components/button";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext } from "react";
import { ButtonToolbar } from "rsuite";
import SelectDropdown from "../select";

interface Props {
  openCommentModal: boolean;
  setOpenCommentModal: (open: boolean) => void;
  updatedComment: string;
  setUpdatedComment: (comment: string) => void;
  setComment: (comment: any) => void;
  enableCapture: boolean;
  listComments: any[];
}

const Comment: React.FC<Props> = ({
  openCommentModal,
  setOpenCommentModal,
  updatedComment,
  setUpdatedComment,
  setComment,
  enableCapture,
  listComments,
}) => {
  const { translation } = useContext(LanguageContext);
  const handleUpdate = async (value: string) => {
    setUpdatedComment(value);
  };

  return (
    <div>
      <Modal
        show={openCommentModal}
        handleClose={() => setOpenCommentModal(false)}
      >
        <div className="rs-modal-body">
          <div>
            <SelectDropdown
              options={listComments}
              label={translation.comment}
              placeholder={translation.select}
              name="comment"
              value={updatedComment}
              onChange={(value) => handleUpdate(value)}
              testId="updatedComment"
              disabled={!enableCapture}
            />
          </div>

          <ButtonToolbar>
            <Button
              appearance="default"
              text={translation.cancel}
              onClick={() => setOpenCommentModal(false)}
            />
            <Button
              text={translation.save}
              onClick={() => {
                setComment(updatedComment);
                setUpdatedComment("");
                setOpenCommentModal(false);
              }}
            />
          </ButtonToolbar>
        </div>
      </Modal>
    </div>
  );
};

export default Comment;
