import React from 'react';
import { useState, useEffect } from 'react'
import { useAuthValue } from "../AuthContext"

import { useToast } from "@chakra-ui/react"

const SuccessToast = () => {
  const toast = useToast();
  const { 
    jobCompleteNotification,
    setJobCompleteNotification
  } = useAuthValue()

  useEffect(() => {
    if (jobCompleteNotification !== "") {
      toast({
        title: "Job Complete",
        description: jobCompleteNotification,
        status: "success",
        duration: 5000,
        isClosable: true,
        onCloseComplete: () => {
            setJobCompleteNotification(''); // Reset jobCompleteNotification after toast is closed
          }
      });
    }
  }, [jobCompleteNotification, toast]);

  return null; // Toast is rendered outside of the component tree
}

export default SuccessToast;