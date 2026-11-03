import { useNavigate } from "react-router-dom";
import successmodalimg from "../../assets/successmodalimg.svg";
import Modal from "./Modal";

type SuccessModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  redirectTo?: string;
};

export default function SuccessModal({
  open,
  title,
  description,
  onClose,
  redirectTo,
}: SuccessModalProps) {
  const navigate = useNavigate();

  const handleOk = () => {
    onClose();

    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      containerClassName="max-w-[642px] items-center text-center"
    >
      <h2
        className="
          text-black max-w-[336px] leading-[1.2]
          text-[28px]
          font-semibold
        "
      >
        {title}
      </h2>

      {description && (
        <p className="text-gray-600 text-sm mt-2 max-w-[400px]">
          {description}
        </p>
      )}

      <img
        src={successmodalimg}
        alt="success"
        className="w-[180px] h-[180px] "
      />

      <button
        onClick={handleOk}
        className="
          w-full max-w-[420px]
          py-2.5
          rounded-[14px]
          text-white
          text-[20px] sm:text-[24px]
          font-semibold
          bg-gradient-to-r from-[#2563EB] to-[#4F46E5]
          hover:opacity-90
          transition
        "
      >
        Ok
      </button>
    </Modal>
  );
}
