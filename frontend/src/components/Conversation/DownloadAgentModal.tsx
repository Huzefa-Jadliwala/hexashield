import { useState } from 'react';
import { Modal, Box, Typography, Tabs, Tab, Button } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getUserIdFromLocalStorage } from 'utils/cookieValidation';

const DownloadAgentModal = ({ open, handleClose, conversationId }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };
    const userId = getUserIdFromLocalStorage();
    const linuxCode = `curl -o agent_linux ${import.meta.env.VITE_WEB_API_URL}/download/agent/linux/${userId}/${conversationId}

chmod +x agent_linux

U_ID=${userId} C_ID=${conversationId} ./agent_linux`;

    const darwinCode = `curl -o agent_darwin ${import.meta.env.VITE_WEB_API_URL}/download/agent/darwin/${userId}/${conversationId}

chmod +x agent_darwin

U_ID=${userId} C_ID=${conversationId} ./agent_darwin`;

    const windowsCode = `Invoke-WebRequest -Uri ${import.meta.env.VITE_WEB_API_URL}/download/agent/windows/${userId}/${conversationId} -OutFile agent.exe

$env:U_ID = "${userId}"

$env:C_ID = "${conversationId}"

.\\agent.exe`;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: '1000px',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Download and Run the Agent
                </Typography>
                <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Linux" />
                    <Tab label="Darwin" />
                    <Tab label="Windows" />
                </Tabs>

                {tabIndex === 0 && (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <b>Download and Run the Linux Agent:</b>
                        </Typography>
                        <SyntaxHighlighter language="bash" style={materialDark}>
                            {linuxCode}
                        </SyntaxHighlighter>
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <b>Download and Run the Darwin Agent:</b>
                        </Typography>
                        <SyntaxHighlighter language="bash" style={materialDark}>
                            {darwinCode}
                        </SyntaxHighlighter>
                    </Box>
                )}

                {tabIndex === 2 && (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <b>Download and Run the Windows Agent on PowerShell:</b>
                        </Typography>
                        <SyntaxHighlighter language="powershell" style={materialDark}>
                            {windowsCode}
                        </SyntaxHighlighter>
                    </Box>
                )}

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button variant="contained" color="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default DownloadAgentModal;
