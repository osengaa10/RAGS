import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  IconButton,
  useDisclosure,
  FormLabel,
  Box,
  UnorderedList,
  ListItem,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';

function PrivacyModalExplantaion() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box>
        <Flex direction='row'>
      <FormLabel htmlFor="privacy-mode" ml={2}>Privacy Mode</FormLabel>
      <Tooltip label="What is privacy mode?" hasArrow>
        <IconButton
          onClick={onOpen}
          bgColor='white'
          aria-label="View system prompt"
          icon={<QuestionOutlineIcon />}
          size="sm"
          variant="ghost"
          ml={2}
        />
      </Tooltip>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Privacy measures:</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UnorderedList align="left">
              <ListItem>Raw PDF files will never be archived in any way.</ListItem>
              <ListItem>Only embeddings of the PDFs will be maintained until you chose to delete them. Nothing will be stored in any database</ListItem>
            </UnorderedList>

            <ModalHeader>Feature limitations:</ModalHeader>
            <UnorderedList align="left">
              <ListItem>No chat history.</ListItem>
              <ListItem>Cannot view or download the PDFs that make up your knowledge bases</ListItem>
              <ListItem>Custom system prompts will revert to default upon refreshing the page. They are not saved. </ListItem>
            </UnorderedList>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default PrivacyModalExplantaion;
