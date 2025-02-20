import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConversations } from "@app/conversations/hooks/useConversations";
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useMediaQuery,
  Theme,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChatComponent from "@components/Conversation/ChatComponent";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SummarizeIcon from '@mui/icons-material/Summarize';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import { useAgents } from '@app/agents/hooks/useAgents';


export default function ConversationListingPage() {
  const { queryConversations, updateConversation, conversations, loading, error } = useConversations();
  const { agents } = useAgents();
  const navigate = useNavigate();
  const location = useLocation();

  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>("ISO27001-A");


  const [conversationType, setConversationType] = useState<"auto" | "manual" | "webhex">("manual");

  const conversationTypes = [
    {
      label: "Manual Chat",
      value: "manual",
      description: "A chat to assist users in manual vulnerability assessment with step-by-step guidance and expert support via GorkAI."
    },
    {
      label: "Webhex Chat",
      value: "webhex",
      description: "A dedicated chat for vulnerability detection in IPs and websites using active (full) and passive (partial) scanning methods."
    },
    {
      label: "Auto Chat",
      value: "auto",
      description: "A one-on-one AI-driven chat for automated vulnerability assessment, leveraging lightweight agents for system scans and analysis."
    }
  ];

  const manualChatStandards = [
    { label: "OWASP", value: "OWASP" },
    { label: "NIST CSF", value: "NIST CSF" },
    { label: "ISO27001-A", value: "ISO27001-A" },
    { label: "GDPR", value: "GDPR" },
  ];

  const handleStartManualChat = () => {
    if (selectedStandard) {
      setSubModalOpen(false);
      setModalOpen(false);
      navigate(`/conversations/new/${conversationType}/${selectedStandard}`);
    }
  };



  useEffect(() => {
    // Split the URL into parts
    const pathParts = location.pathname.split("/");

    // Assuming the structure is `/chat/:conversationId/:conversationType`
    const convId = pathParts[2]; // conversationId
    // const conversationType = pathParts[3]; // conversationType

    console.log("select conversationId", convId)
    setSelectedConversation(convId === "new" ? "new" : convId || null);
  }, [location.pathname]);

  const handleCreateConversation = () => {
    setModalOpen(true);
  };

  const handleSelectConversationType = (conversationType: string) => {
    setConversationType(conversationType as "auto" | "manual" | "webhex");
    if (conversationType === "manual") {
      setSubModalOpen(true); // Open sub-modal for manual selection
    } else if (conversationType === "webhex") {
      navigate(`/conversations/new/${conversationType}/OWASP`);
      setModalOpen(false);
    } else {
      // Handle other conversation types normally
      navigate(`/conversations/new/${conversationType}/${selectedStandard}`);
      setModalOpen(false);
    }
  };


  const handleSelectConversation = (conversationId: string, conversationType: string, conversationStandard: string) => {
    setSelectedConversation(conversationId);
    setConversationType(conversationType as "auto" | "manual" | "webhex");
    navigate(`/conversations/${conversationId}/${conversationType}/${conversationStandard}`);
    console.log("conversationType", conversationType)
    console.log("conversationId", conversationId)
    console.log("conversationStandard", conversationStandard)
  };

  const handleStartEditing = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditedTitles((prev) => ({ ...prev, [conversationId]: currentTitle }));
  };

  const handleSaveTitle = (conversationId: string, created_by: string) => {
    if (editingConversationId) {
      const newTitle = editedTitles[conversationId]?.trim(); // Trim to avoid updates due to unnecessary spaces
      const currentTitle = conversations.find((c) => c._id === conversationId)?.title || "";

      // Only proceed with update if the title has changed
      if (newTitle && newTitle !== currentTitle) {
        updateConversation(conversationId, { title: newTitle, created_by });
        queryConversations({ created_by: created_by, page: 1, page_size: 100 });
      }

      setEditingConversationId(null);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Conversations Sidebar */}
      <Paper
        elevation={2}
        sx={{
          flexShrink: 0,
          width: isSmallScreen ? "100%" : 300,
          maxHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Sidebar Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="h6" sx={{ m: 2 }}>
            Conversations
          </Typography>
          <Tooltip title="Create Conversation">
            <IconButton color="primary" onClick={handleCreateConversation}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Conversation List */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto", // Makes the conversation list scrollable
            p: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
            },
          }}
        >
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Typography color="error" sx={{ m: 2 }}>
              Failed to load conversations
            </Typography>
          )}
          {!loading && !error && conversations.length === 0 && (
            <Typography sx={{ mt: 2 }}>No conversations available</Typography>
          )}
          {!loading && !error && conversations.length > 0 && (
            <List>
              {[...conversations]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((conversation) => (
                  <ListItemButton
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation._id, conversation.type, conversation.standard)}
                    selected={selectedConversation === conversation._id}
                    sx={(theme) => ({
                      "&.Mui-selected": {
                        backgroundColor: theme.palette.action.selected,
                        color: theme.palette.primary.main,
                        fontWeight: "bold",
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                      },
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    })}
                  >
                    {editingConversationId === conversation._id ? (
                      <TextField
                        size="small"
                        value={editedTitles[conversation._id] || ""}
                        onChange={(e) =>
                          setEditedTitles((prev) => ({ ...prev, [conversation._id]: e.target.value }))
                        }
                        onBlur={() => handleSaveTitle(conversation._id, conversation.created_by)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveTitle(conversation._id, conversation.created_by);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <ListItemText
                        primary={conversation.title || `Chat ${conversation._id}`}
                        primaryTypographyProps={{
                          variant: "body1",
                          noWrap: true,
                        }}
                      />
                    )}
                    <Tooltip title="Rename">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(conversation._id, conversation.title || "");
                        }}
                      >
                        {editingConversationId === conversation._id ? (
                          <DoneAllIcon sx={{ color: "white" }} />
                        ) : (
                          <DriveFileRenameOutlineIcon sx={{ color: "white" }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    {conversation.type === "webhex" ? <WebAssetIcon /> : conversation.type === "auto" ? (<AutoModeIcon />) : (<SummarizeIcon />)}
                  </ListItemButton>
                ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Chat Component */}
      <Box
        component="section"
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          p: isSmallScreen ? 1 : 3,
          overflowY: "auto",
        }}
      >
        {selectedConversation && conversationType ? (
          <ChatComponent />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a conversation or create a new one to start chatting.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Modal for Selecting Conversation Type */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Select Conversation Type</DialogTitle>
        <DialogContent>
          {conversationTypes.map((type) => (
            <Tooltip key={type.value} title={type.description} arrow>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => handleSelectConversationType(type.value)}
              >
                {type.value === "webhex" ? (
                  <WebAssetIcon />
                ) : type.value === "auto" ? (
                  <AutoModeIcon />
                ) : (
                  <SummarizeIcon />
                )}
                <span style={{ marginLeft: 8 }}>{type.label}</span>
              </Button>
            </Tooltip>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-Modal for Manual Chat Selection */}
      <Dialog open={subModalOpen} onClose={() => setSubModalOpen(false)}>
        <DialogTitle>Select Manual Chat Standard</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Standard</InputLabel>
            <Select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              label="Select Standard"
            >
              {manualChatStandards.map((standard) => (
                <MenuItem key={standard.value} value={standard.value}>
                  {standard.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubModalOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleStartManualChat} color="primary" disabled={!selectedStandard}>
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
