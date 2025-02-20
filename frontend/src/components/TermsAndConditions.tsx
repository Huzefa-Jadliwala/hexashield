import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface TermsAndConditionsProps {
  open: boolean;
  onClose: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px', // Set the border radius to make the edges rounded
          backgroundColor: '#202840', // Ensure the background color matches the theme
        },
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#2a385d', color: '#fff', padding: '16px 24px' }}>
        Terms and Conditions
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#202840', color: '#94A3B8' }}>
        <Typography variant="body1" gutterBottom>
          Welcome to HexaShield. These terms and conditions outline the rules and regulations for the use of our website.
        </Typography>
        <Typography variant="h6" gutterBottom>
          1. Introduction
        </Typography>
        <Typography variant="body1" gutterBottom>
          By accessing this website, we assume you accept these terms and conditions. Do not continue to use HexaShield if you do not agree to all of the terms and conditions stated on this page.
        </Typography>
        <Typography variant="h6" gutterBottom>
          2. Intellectual Property Rights
        </Typography>
        <Typography variant="body1" gutterBottom>
          Unless otherwise stated, HexaShield and/or its licensors own the intellectual property rights for all material on HexaShield. All intellectual property rights are reserved. You may access this from HexaShield for your own personal use subjected to restrictions set in these terms and conditions.
        </Typography>
        <Typography variant="h6" gutterBottom>
          3. User Responsibilities
        </Typography>
        <Typography variant="body1" gutterBottom>
          You must not:
          <ul>
            <li>Republish material from HexaShield</li>
            <li>Sell, rent, or sub-license material from HexaShield</li>
            <li>Reproduce, duplicate, or copy material from HexaShield</li>
            <li>Redistribute content from HexaShield</li>
          </ul>
        </Typography>
        <Typography variant="h6" gutterBottom>
          4. Limitation of Liability
        </Typography>
        <Typography variant="body1" gutterBottom>
          In no event shall HexaShield, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website whether such liability is under contract. HexaShield, including its officers, directors, and employees shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this website.
        </Typography>
        <Typography variant="h6" gutterBottom>
          5. Governing Law
        </Typography>
        <Typography variant="body1" gutterBottom>
          These terms and conditions are governed by and construed in accordance with the laws of the State of [Your State] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
        </Typography>
        <Typography variant="body1" gutterBottom>
          2025 HexaShield. This website has been created as part of the Web Engineering Planspiel Project at TU Chemnitz.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#2a385d' }}>
        <Button onClick={onClose} sx={{ color: '#8B5CF6' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndConditions;