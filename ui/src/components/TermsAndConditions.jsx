import React, { useState } from 'react';
import { Modal, Button } from 'antd';

const TermsAndConditions = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
        <Button onClick={showModal} style={{ color: '#555', backgroundColor: '#f8f8f8', border: '1px solid #ddd' }}>
            View Terms and Conditions
        </Button>
        <Modal
        title="Terms and Conditions"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        centered
        width="90vw"
        style={{ maxHeight: '90vh'}} 
        >
        <p style={{ textAlign: 'center' }}>lol</p>
        </Modal>
    </>
  );
};

export default TermsAndConditions;
