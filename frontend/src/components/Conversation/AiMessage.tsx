import { useCallback, useState } from "react";
import { Message } from "@app/messages/types/message.types";
import { Paper, Typography, Avatar, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Collapse, IconButton, Tooltip, TextField, CircularProgress } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark, materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { commandClient } from "@app/axios.client";
import ReportProgressModal from "./ReportProgressModal";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

const extractJson = (content: string): string | null => {
    try {
        // If already a valid JSON, return formatted version
        return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
        // Otherwise, attempt to extract JSON from Markdown
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        return jsonMatch ? jsonMatch[1] : null;
    }
};

const isJsonWithKeys = (content: string | null, requiredKeys: string[]): boolean => {
    if (!content) return false; // Prevents parsing empty content
    try {
        const parsed = JSON.parse(content);
        return requiredKeys.every((key) => key in parsed);
    } catch {
        return false;
    }
};

export function AiMessage({ message, agentId }: { message: Message; agentId: string | null }) {
    const { report, task } = message;
    const reportId = report?._id;

    const [progressOpen, setProgressOpen] = useState(false);
    const handleProgressClose = useCallback(() => setProgressOpen(false), []);

    const requiredKeys = ["description", "type", "scenario"];
    const jsonContent = extractJson(message.content);
    const isValidJson = jsonContent ? isJsonWithKeys(jsonContent, requiredKeys) : false;
    const jsonData = isValidJson ? JSON.parse(jsonContent!) : null;
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);
    const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

    const [inputValues, setInputValues] = useState<Record<string, string>>(
        jsonData?.scenario?.inputs?.reduce((acc, input) => {
            acc[input.name] = input.value; // set default value initially
            return acc;
        }, {} as Record<string, string>) || {}
    );

    const handleInputChange = (name: string, value: string) => {
        setInputValues((prev) => ({
            ...prev,
            [name]: value === "" ? jsonData?.scenario?.inputs?.find((input) => input.name === name)?.value || "" : value,
        }));
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied({ ...copied, [id]: true });
        setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
    };


    const handleApiCall = async () => {
        if (jsonData) {
            const updatedScenario = {
                ...jsonData.scenario,
                inputs: jsonData.scenario.inputs.map((input) => ({
                    ...input,
                    // Use default only if inputValues[input.name] is undefined, not if it's an empty string.
                    value: inputValues[input.name] === undefined ? input.value : inputValues[input.name],
                })),
            };

            try {
                const response = await commandClient.post(`/agents/${agentId}/commands`, updatedScenario);
                console.log("API Response:", response.data);
            } catch (error) {
                console.error("API Call Error:", error);
            }
        }
    };

    const renderContent = useCallback(() => {
        let parsedContent;

        // Try parsing the content as JSON
        try {
            parsedContent = JSON.parse(message.content);
        } catch (e) {
            parsedContent = null;
        }

        // If valid JSON and contains `description` & `scenario`, render them
        if (parsedContent && parsedContent.description && parsedContent.scenario) {
            return (
                <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        {parsedContent.description}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        Vulnerability
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        Name: {parsedContent.detection.vulnerability}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        Level: {parsedContent.detection.severity}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        Notes
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        {parsedContent.notes}
                    </Typography>
                    {/* Inputs Section */}
                    {parsedContent.scenario.inputs && parsedContent.scenario.inputs.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Inputs
                            </Typography>
                            {parsedContent.scenario.inputs.map((input) => (
                                <TextField
                                    key={input.name}
                                    label={input.description}
                                    value={inputValues[input.name] || ""}
                                    placeholder={input.value}
                                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                            ))}
                        </Box>
                    )}

                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        Scenario
                    </Typography>
                    <SyntaxHighlighter language="json" style={materialDark}>
                        {JSON.stringify(parsedContent.scenario, null, 2)}
                    </SyntaxHighlighter>
                </Box>
            );
        }

        // If not JSON or missing fields, render Markdown
        return (
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeId = String(children).slice(0, 10); // Unique ID for copy tracking

                        return !inline && match ? (
                            <Box sx={{ position: "relative" }}>
                                <Tooltip title={copied[codeId] ? "Copied!" : "Copy"} arrow>
                                    <IconButton
                                        onClick={() => handleCopy(String(children).replace(/\n$/, ""), codeId)}
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            zIndex: 1,
                                            backgroundColor: "rgba(255,255,255,0.2)",
                                            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
                                        }}
                                    >
                                        {copied[codeId] ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                                    </IconButton>
                                </Tooltip>
                                <SyntaxHighlighter style={materialDark} language={match[1]} PreTag="div" {...props}>
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                            </Box>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    ul({ children }) {
                        return <ul style={{ paddingLeft: "1.5rem", marginTop: 0 }}>{children}</ul>;
                    },
                    ol({ children }) {
                        return <ol style={{ paddingLeft: "1.5rem", marginTop: 0 }}>{children}</ol>;
                    },
                    li({ children }) {
                        return <li style={{ marginBottom: "0.3rem" }}>{children}</li>;
                    },
                    p({ children }) {
                        return <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>{children}</Typography>;
                    }
                }}
            >
                {message.content}
            </ReactMarkdown>
        );
    }, [message.content, copied]);


    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    mb: 1,
                }}
            >
                <Avatar
                    sx={{
                        mr: 2,
                        bgcolor: "secondary.main",
                    }}
                >
                    <SmartToyIcon />
                </Avatar>

                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        maxWidth: "70%",
                        width: "fit-content", // ✅ Prevents expanding beyond necessary width
                        bgcolor: "grey.200",
                        color: "primary.contrastText",
                        wordBreak: "break-word", // ✅ Breaks long words
                        overflowWrap: "break-word",
                    }}
                >
                    {renderContent()}
                    {isValidJson && (
                        <Box sx={{ mt: 1 }}>
                            {/* <Typography variant="subtitle2" color="primary">
                                Valid JSON Detected:
                            </Typography> */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleApiCall}
                                    sx={{ mr: 2 }}
                                >
                                    Execute Scenario
                                </Button>
                                <IconButton
                                    onClick={() => setJsonPreviewOpen(!jsonPreviewOpen)}
                                    aria-label={jsonPreviewOpen ? "Collapse JSON preview" : "Expand JSON preview"}
                                >
                                    {jsonPreviewOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={jsonPreviewOpen}>
                                <Box
                                    sx={{
                                        mt: 1,
                                        p: 1,
                                        border: "1px solid",
                                        borderColor: "grey.400",
                                        borderRadius: 1,
                                        bgcolor: "grey.100",
                                    }}
                                >
                                    <SyntaxHighlighter language="json" style={materialLight}>
                                        {jsonContent}
                                    </SyntaxHighlighter>
                                </Box>
                            </Collapse>
                        </Box>
                    )}

                    {task && (
                        <Box sx={{ mt: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    display: "block",
                                    color: "primary",
                                }}
                            >
                                Status: {task.status}
                            </Typography>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => setTaskModalOpen(true)}
                            >
                                View Task Details
                            </Button>
                        </Box>
                    )}
                    {message.type === "webhex" && reportId && (
                        <Button
                            variant="contained"
                            color="secondary"
                            aria-label="View Item"
                            onClick={() => setProgressOpen(true)}
                            sx={{ mt: 1 }}
                        >
                            View Report
                        </Button>
                    )}
                    <Typography
                        variant="caption"
                        sx={{ mt: 0.5, display: "block", textAlign: "right" }}
                    >
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </Typography>
                </Paper>
            </Box>

            <Dialog open={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Task Details</DialogTitle>
                <DialogContent>
                    {task ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                General Information
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-line", mb: 2 }}>
                                <strong>Task ID:</strong> {task._id}{"\n"}
                                <strong>Agent ID:</strong> {task.agent_id}{"\n"}
                                <strong>Conversation ID:</strong> {task.conversation_id}{"\n"}
                                <strong>Status:</strong> {task.status}{"\n"}
                                <strong>Priority:</strong> {task.priority}{"\n"}
                                <strong>Execution Time:</strong> {task.execution_time}{"\n"}
                                <strong>Created At:</strong> {task.created_at}{"\n"}
                                <strong>Completed At:</strong> {task.completed_at}
                            </Typography>

                            <Typography variant="h6" gutterBottom>
                                Outputs
                            </Typography>
                            {task.outputs.map((output, index) => (
                                <Box key={index} sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                        <strong>Type:</strong> {output.type}{"\n"}
                                        <strong>Command:</strong> {output.command}{"\n"}
                                        <strong>Output:</strong> {output.output || "No output"}{"\n"}
                                        <strong>Status:</strong> {output.status}
                                    </Typography>
                                </Box>
                            ))}
                        </>
                    ) : (
                        <Typography variant="body2" color="error">
                            No task details available.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTaskModalOpen(false)} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            {message.type === "webhex" && reportId && (
                <ReportProgressModal open={progressOpen} onClose={handleProgressClose} reportId={reportId} />
            )}
        </>
    );
}
