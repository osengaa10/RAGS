import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useAuthValue } from "../AuthContext";


function PrivacyModeSystemPrompt() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isLargerThan800 = useBreakpointValue({ base: false, md: true });

  const { 
    isPrivacyMode,
    systemPrompt,
    setSystemPrompt
   } = useAuthValue()

  const handleApply = () => {
    // Here you can handle the systemPrompt state as needed
    onClose(); // Close the modal
  };

  return (
    <>
      <Button onClick={onOpen}>Change system prompt</Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size={isLargerThan800 ? 'xl' : 'full'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Custom System Prompt</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
          <Textarea
              placeholder="Type your system prompt here..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              minH={'350px'} // Set a minimum height
              resize={'vertical'} // Allow vertical resize
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleApply}>
              Apply
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default PrivacyModeSystemPrompt;
