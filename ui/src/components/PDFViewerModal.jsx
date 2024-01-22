import React, { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    CloseButton,
    HStack,
    IconButton
} from '@chakra-ui/react';
import { DownloadOutlined } from '@ant-design/icons';

function PDFViewerModal({ pdfBlob, isOpen, onClose, fileName }) {
    const [pdfUrl, setPdfUrl] = useState('');
    useEffect(() => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [pdfBlob]);

    const handleDownload = () => {
        // Create a temporary anchor to trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName; // Name of the downloaded file
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {fileName}
                    <HStack spacing="10px" float="right">
                    <IconButton
                        aria-label="Download file"
                        icon={<DownloadOutlined />}
                        size="sm"
                        onClick={handleDownload}
                    />
                        <CloseButton colorScheme="gray" onClick={onClose}/>
                           
                    </HStack>
                </ModalHeader>
                <ModalBody>
                    {pdfUrl && (
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <Viewer fileUrl={pdfUrl} />
                        </Worker>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default PDFViewerModal;
