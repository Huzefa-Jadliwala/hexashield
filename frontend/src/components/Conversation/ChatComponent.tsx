// src/components/Conversations/ChatComponent.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    ListItem,
    CircularProgress,
    Grow,
    Button,
    Fab,
    Stack,
    Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAppDispatch, useAppSelector } from "@app/hook";
import { createConversationThunk } from "@app/conversations/slices/conversationsSlice";
import { RootState } from "@app/store";
import { socket } from "@app/socket";
import ObjectId from "bson-objectid";
import { Message } from "@app/messages/types/message.types";
import { AiMessage } from "@components/Conversation/AiMessage";
import { UserMessage } from "@components/Conversation/UserMessage";
import ReportIcon from "@mui/icons-material/Assessment"; // Import an appropriate icon
import { useConversations } from '@app/conversations/hooks/useConversations';
import { Alert, Snackbar } from "@mui/material"; // Import these components
import { useNavigate, useParams } from 'react-router-dom';
import DownloadAgentModal from './DownloadAgentModal';
import { getUserIdFromLocalStorage } from 'utils/cookieValidation';
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

interface ChatComponentProps {
    onConversationCreated?: (conversationId: string) => void;
}

export default function ChatComponent({ onConversationCreated }: ChatComponentProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { conversationId, conversationType, conversationStandard } = useParams();

    const { loading: conversationLoading } = useAppSelector((state: RootState) => state.conversations);
    const { agents } = useAppSelector((state: RootState) => state.agents);
    const { generateConversationReport, generateReportLoading, generateReportError } = useConversations();

    // Inside the component
    const [successAlert, setSuccessAlert] = useState(false);

    // State Management
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [webHexInput, setWebHexInput] = useState("");
    const [isUrlChecking, setIsUrlChecking] = useState(false);
    const [isWebhexUrlValid, setIsWebhexUrlValid] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [connectedAgent, setConnectedAgent] = useState<string | null>(null);
    const [agentId, setAgentId] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const [isWebhexComplete, setIsWebhexComplete] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isListening, setIsListening] = useState(false); // Manage microphone listening state
    const recognitionRef = useRef<SpeechRecognition | null>(null); // Reference for speech recognition
    const [isFullScreen, setIsFullScreen] = useState(false);



    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // Close full screen on "Escape" key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullScreen]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0].transcript)
                    .join("");
                setInputValue(transcript); // Update input value with speech transcript
            };

            recognition.onend = () => {
                setIsListening(false); // Stop listening when recognition ends
            };

            recognitionRef.current = recognition;
        }
    }, []);


    // Start or Stop Speech Recognition
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleGenerateReport = async () => {
        if (generateReportLoading || !conversationId) return; // Prevent duplicate triggers
        try {
            console.log("Generate report triggered!");
            await generateConversationReport(conversationId);
            setSuccessAlert(true); // Show success alert
        } catch (err) {
            console.error("Error generating report:", generateReportError, err);
        }
    };


    // Utility Functions
    const isValidIPorURL = (input: string): boolean => {
        const ipRegex =
            /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
        const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
        return ipRegex.test(input) || urlRegex.test(input);
    };

    const validateReachability = useCallback(async (input: string) => {
        setIsUrlChecking(true);
        setValidationError(null);
        try {
            const formattedInput = /^https?:\//i.test(input) ? input : `http://${input}`;
            const response = await fetch(formattedInput, { method: "HEAD", mode: "no-cors" });
            setIsWebhexUrlValid(response.type === "opaque" || response.ok);
        } catch {
            setIsWebhexUrlValid(false);
            setValidationError("Invalid or unreachable URL");
        } finally {
            setIsUrlChecking(false);
        }
    }, []);

    const addMessage = useCallback((message: Message) => {
        setMessages((prevMessages) => {
            const exists = prevMessages.some((msg) => msg._id === message._id);
            if (exists) {
                return prevMessages.map((msg) =>
                    msg._id === message._id ? { ...msg, ...message } : msg
                );
            }
            return [...prevMessages, message].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        });
    }, []);

    // Socket Handlers
    useEffect(() => {
        const handleAgentConnection = (data: any) => {
            console.log("handleAgentConnection", data)
            if (data.conversation_id && data.conversation_id === conversationId && data.status == "online") {
                setConnectedAgent(data.client_info.hostname || "Unknown Agent");
                setAgentId(data.agent_id)
            }
            if (agentId == data.agent_id) {
                setConnectedAgent(null)
                setAgentId(null)
            }
        };

        const handleMessageHistory = ({ messages }: { messages: Message[] }) => {
            console.log("messages", messages)
            if (messages.length) {
                setMessages((prev) => {
                    const combinedMessages = [
                        ...prev.filter((prevMsg) => !messages.some((newMsg) => newMsg._id === prevMsg._id)),
                        ...messages,
                    ];
                    return combinedMessages.sort(
                        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                });

                if (conversationType === "webhex" && messages.length >= 2) {
                    setIsWebhexComplete(true)
                }
            }
            // setIsFetching(false);
        };

        // const handleAiMessage = (message: Message) => {
        //     if (message.conversation_id === conversationId) addMessage(message);
        // };


        const handleAiMessageStream = (aiMessage: Message) => {
            // console.log("aiMessage", aiMessage)
            if (aiMessage.conversation_id === conversationId) {
                setMessages((prev) => {
                    const index = prev.findIndex((msg) => msg._id === aiMessage._id);

                    if (index !== -1) {
                        const updatedMessages = [...prev];
                        const currentContent = updatedMessages[index].content + aiMessage.content;

                        updatedMessages[index] = {
                            ...updatedMessages[index],
                            content: currentContent,
                        };
                        return updatedMessages;
                    }

                    return [...prev, aiMessage];
                });
            }
        };

        socket.on("handle_agent_to_conversation_connection", handleAgentConnection);
        socket.on("message_history", handleMessageHistory);
        socket.on("ai_message_stream", handleAiMessageStream);
        // socket.on("ai_message", handleAiMessage);

        return () => {
            socket.off("handle_agent_to_conversation_connection", handleAgentConnection);
            socket.off("message_history", handleMessageHistory);
            socket.off("ai_message_stream", handleAiMessageStream);
            // socket.off("ai_message", handleAiMessage);
        };

    }, [conversationId, addMessage, agentId, conversationType]);


    // Join Room on Conversation ID Change
    useEffect(() => {
        if (conversationId !== "new" || conversationId == "new") {
            socket.emit("join_room", { conversation_id: conversationId });
            setMessages([]);
            setIsWebhexComplete(false)
        }

        setValidationError(null);
        setInputValue("");
        setWebHexInput("")


        // webhex
        if (conversationType === "webhex" && messages.length >= 2) {
            setIsWebhexComplete(true)
        }

        console.log("conversationType", conversationType)
        console.log("isWebhexComplete", isWebhexComplete)


        // Check if conversationAgent exists in agents by matching agent.client_info.hostname
        console.log("agents", agents)
        const matchingAgent = agents.find(agent => agent.conversation_id === conversationId);
        console.log("matchingAgent", matchingAgent)
        if (matchingAgent && matchingAgent?.status == "online") {
            console.log("ConversationAgent exists in agents.");
            setAgentId(matchingAgent.agent_id)
            setConnectedAgent(matchingAgent.client_info.hostname)
        } else {
            console.log("ConversationAgent does not exist in agents.");
            setAgentId(null)
            setConnectedAgent(null)
        }


    }, [conversationId, conversationType]);

    // Scroll to Bottom on New Messages
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    // Input Handlers
    const handleWebHexInputChange = async (value: string) => {
        setWebHexInput(value);
        if (isValidIPorURL(value)) {
            await validateReachability(value);
        } else {
            setIsWebhexUrlValid(false);
            setValidationError("Invalid input. Please enter a valid IP or URL.");
        }
    };



    const createConversation = async (conversationTitle: string, conversationStandard: string) => {
        if (conversationId && conversationType) {
            const userId = getUserIdFromLocalStorage();
            isCreatingConversation.current = true;
            const resultAction = await dispatch(
                createConversationThunk({
                    id: ObjectId().toHexString(),
                    title: conversationTitle,
                    created_by: userId,
                    type: conversationType,
                    standard: conversationStandard
                })
            );

            if (createConversationThunk.fulfilled.match(resultAction)) {
                const newConversation = resultAction.payload;
                onConversationCreated?.(newConversation._id);
                navigate(`/conversations/${newConversation._id}/${newConversation.type}/${newConversation.standard}`);
            }
            isCreatingConversation.current = false;
        }
    };

    const generateConversationTitle = (
        type: string | undefined,
        agentName: string | null,
        userInput: string | null = null
    ): string => {
        if (userInput?.trim()) return userInput; // Use user input if provided

        const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
        const baseTitle = `${type || "conversation"}-${timestamp}`;

        if (type === "auto" && agentName) {
            return `${baseTitle} (Agent: ${agentName})`;
        }

        return baseTitle;
    };

    const isCreatingConversation = useRef(false);

    useEffect(() => {
        console.log("select convType", conversationType);
        console.log("select convId", conversationId);
        console.log("select standard", conversationStandard);
        if (conversationId === "new" && conversationStandard && !isCreatingConversation.current) {
            isCreatingConversation.current = true;
            const title = generateConversationTitle(conversationType, connectedAgent);
            if (!title) return;
            createConversation(title, conversationStandard);
        }
    }, [conversationId, conversationStandard]);


    const handleSendMessage = async (customInputValue = inputValue) => {

        console.log("customInputValue", customInputValue)
        if (!customInputValue.trim()) return;
        const convId: string = conversationId || "";
        console.log("convId", convId)
        if (!convId) {
            return
        }

        try {
            const message: Message = {
                _id: ObjectId().toHexString(),
                conversation_id: convId,
                role: "user",
                content: conversationType === "webhex" && isWebhexComplete === false ? `WebHex request: ${webHexInput}` : customInputValue,
                type: conversationType || "manual",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...(conversationType === "webhex" && { details: { url: webHexInput } }),
            };

            let tempMessage: any = message;
            if (isWebhexComplete) {
                tempMessage['isWebhexComplete'] = true
            }

            if (agentId) {
                tempMessage['agentId'] = agentId
            }

            if (conversationStandard) {
                tempMessage['standard'] = conversationStandard
            }

            // console.log("isWebhexComplete", isWebhexComplete)
            // console.log("tempMessage", tempMessage)
            // return
            socket.emit("on_stream_message_to_ai", tempMessage);
            addMessage(message);
            setInputValue("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // Render
    return (




        <Box sx={{
            position: isFullScreen ? "fixed" : "relative",
            top: 0, left: 0,
            width: isFullScreen ? "100vw" : "100%",
            height: isFullScreen ? "100vh" : "100%",
            bgcolor: "background.paper",
            zIndex: isFullScreen ? 2000 : "auto",
            display: "flex",
            flexDirection: "column",
            p: 2
        }}>

            {/* Fullscreen Toggle Button */}
            <Tooltip title={isFullScreen ? "Exit Full-Screen" : "Enter Full-Screen"} arrow>
                <IconButton
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 40,
                        zIndex: 10,
                        color: "white", // Set icon color to white
                        bgcolor: "rgba(0, 0, 0, 0.3)", // Optional: Adds a subtle dark background for contrast
                        "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.5)", // Darker background on hover
                        },
                        p: 1.5 // Increase padding for better clickability
                    }}
                    onClick={toggleFullScreen}
                >
                    {isFullScreen ? (
                        <FullscreenExitIcon sx={{ fontSize: 40 }} /> // Bigger icon
                    ) : (
                        <FullscreenIcon sx={{ fontSize: 40 }} /> // Bigger icon
                    )}
                </IconButton>
            </Tooltip>



            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {conversationType != "webhex" && (
                    <>
                        <Tooltip title="Generate Report" arrow>
                            <Fab
                                aria-label="generate-report"
                                onClick={handleGenerateReport}
                                disabled={generateReportLoading} // Disable button while generating report
                                sx={{
                                    position: "absolute",
                                    top: 75,
                                    right: 45,
                                    zIndex: 1000,
                                    bgcolor: "rgba(0, 0, 0, 0.3)", // Subtle dark background
                                    color: "white", // White icon color
                                    "&:hover": {
                                        bgcolor: "rgba(0, 0, 0, 0.5)", // Darker background on hover
                                    },
                                    p: 2, // Increase padding for better clickability
                                }}
                            >
                                {generateReportLoading ? (
                                    <CircularProgress sx={{ color: "white", width: 32, height: 32 }} /> // Bigger loader
                                ) : (
                                    <ReportIcon sx={{ fontSize: 40 }} /> // Bigger icon
                                )}
                            </Fab>
                        </Tooltip>

                        <Snackbar
                            open={successAlert}
                            autoHideDuration={3000} // Automatically close after 3 seconds
                            onClose={() => setSuccessAlert(false)}
                            anchorOrigin={{ vertical: "top", horizontal: "right" }} // Adjust position if needed
                        >
                            <Alert onClose={() => setSuccessAlert(false)} severity="success" sx={{ width: "100%" }}>
                                Report has been generated successfully! You can access it in {conversationType} report section
                            </Alert>
                        </Snackbar>
                    </>
                )}

                <Box
                    ref={chatContainerRef}
                    sx={{
                        flexGrow: 1,
                        overflowY: "auto",
                        overflowX: "hidden", // ✅ Prevents horizontal scroll
                        maxWidth: "100%", // ✅ Ensures content doesn't exceed container width
                        display: "flex",
                        flexDirection: "column",
                        pb: 2, // Padding at bottom for input field spacing
                    }}
                >
                    {conversationLoading ? (
                        <CircularProgress />
                    ) : (
                        messages.length === 0 && <Typography>No messages yet.</Typography>
                    )}
                    {messages.map((msg) => (
                        <Grow in key={msg._id} timeout={500}>
                            <ListItem
                                sx={{
                                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                    width: "100%", // ✅ Ensures messages don’t overflow
                                    maxWidth: "100%",
                                    overflowWrap: "break-word", // ✅ Breaks long words inside messages
                                    wordBreak: "break-word",
                                }}
                            >
                                {msg.role === "assistant" ? <AiMessage message={msg} agentId={agentId} /> : <UserMessage message={msg} />}
                            </ListItem>
                        </Grow>
                    ))}
                </Box>



                {conversationType === "auto" && !connectedAgent && (
                    <>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                mt: 2,
                                textAlign: "center",
                                width: "100%",
                                maxWidth: 600,
                                margin: "0 auto",
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Download the Agent
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                To get started, download and run the agent on your device.
                            </Typography>
                            <Stack direction="column" spacing={2} alignItems="center">
                                {/* <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={async () => {
                                        try {
                                            let targetConversationId = conversationId;
                                            const userId = getUserIdFromLocalStorage();

                                            if (conversationId === "new" && conversationType) {
                                                const resultAction = await dispatch(
                                                    createConversationThunk({
                                                        id: ObjectId().toHexString(),
                                                        title: "Agent Conversation",
                                                        created_by: userId,
                                                        standard: "ISO27001-A",
                                                        type: "auto", // Assuming "auto" for agent-related conversations
                                                    })
                                                );

                                                if (createConversationThunk.fulfilled.match(resultAction)) {
                                                    const newConversation = resultAction.payload;
                                                    onConversationCreated?.(newConversation._id);
                                                    navigate(`/conversations/${newConversation._id}/${newConversation.type}/${newConversation.standard}`);
                                                    targetConversationId = newConversation._id;
                                                } else {
                                                    console.error("Failed to create conversation");
                                                    return; // Exit if the conversation creation fails
                                                }
                                            }

                                            // Trigger the download
                                            const downloadUrl = `http://localhost:5000/web/api/v1/download/agent_ui_app/${targetConversationId}`;
                                            window.open(downloadUrl, "_blank");
                                        } catch (error) {
                                            console.error("Error creating conversation or initiating download:", error);
                                        }
                                    }}
                                >
                                    Download Agent App
                                </Button> */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleOpenModal}
                                >
                                    Download Agent Binary
                                </Button>
                            </Stack>

                        </Paper>
                        <DownloadAgentModal open={isModalOpen} handleClose={handleCloseModal} conversationId={conversationId}></DownloadAgentModal>
                    </>
                )}



                {connectedAgent && conversationType === "auto" && (
                    <Paper
                        elevation={3}
                        sx={{
                            p: 2,
                            mt: 2,
                            textAlign: "center",
                            width: "100%",
                            maxWidth: 400,
                            margin: "0 auto",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Agent Connected
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            The agent <strong>{connectedAgent}</strong> is connected to this conversation.
                        </Typography>
                    </Paper>
                )}




                {((conversationType === "auto" && connectedAgent) || conversationType === "manual" || conversationType === "webhex") && (
                    <Paper sx={{ display: "flex", flexDirection: "column", p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <TextField
                                fullWidth
                                placeholder={conversationType === "webhex" && isWebhexComplete === false ? "Enter Website IP or Domain. e.g. www.google.com" : "Type a message..."}
                                value={conversationType === "webhex" && isWebhexComplete === false ? webHexInput : inputValue}
                                onChange={(e) =>
                                    conversationType === "webhex" && isWebhexComplete == false
                                        ? handleWebHexInputChange(e.target.value)
                                        : setInputValue(e.target.value)
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                error={!!validationError}
                                helperText={validationError}
                            />
                            <IconButton color="primary" onClick={toggleListening}>
                                {isListening ? <MicOffIcon /> : <MicIcon />}
                            </IconButton>
                            <IconButton
                                color="primary"
                                onClick={() => handleSendMessage(webHexInput || inputValue)}
                                disabled={
                                    conversationLoading ||
                                    (conversationType === "webhex" && isWebhexComplete == false
                                        ? isUrlChecking || !isWebhexUrlValid
                                        : !(inputValue.trim() || webHexInput.trim()))
                                }
                            >
                                {isUrlChecking ? <CircularProgress size={24} /> : <SendIcon />}
                            </IconButton>
                        </Box>
                    </Paper>
                )}



            </Box>


        </Box>

    );
}
