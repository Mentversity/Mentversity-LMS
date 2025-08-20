import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: AlertModalProps) => {
  const iconMap = {
    success: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
        <DialogHeader className="flex flex-col items-center text-center p-4">
          <div className="mb-2">{iconMap[type]}</div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center text-gray-600">
          <p>{message}</p>
        </div>
        <DialogFooter className="flex justify-center p-4 border-t">
          <Button
            onClick={onClose}
            className="rounded-full bg-[#05d6ac] text-white hover:bg-[#04b895]"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;