import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSave: () => void;
    children: ReactNode;
    isLoading?: boolean;
}

export default function EditModal({ isOpen, onClose, title, onSave, children, isLoading = false }: EditModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent className="bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
                <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
                    {title}
                </ModalHeader>
                <ModalBody>
                    {children}
                </ModalBody>
                <ModalFooter className="border-t border-gray-100 dark:border-white/5 transition-colors duration-300">
                    <Button color="default" variant="light" onPress={onClose} isDisabled={isLoading} className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={onSave}
                        className="bg-primary text-white"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
