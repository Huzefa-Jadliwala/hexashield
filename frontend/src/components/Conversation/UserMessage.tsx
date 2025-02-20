// UserMessage Component
import { Message } from '@app/messages/types/message.types';
import { Paper, Typography, Avatar, Box } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { formatDistanceToNow } from "date-fns";

export function UserMessage({ message }: { message: Message }) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "flex-end",
                mb: 1,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 1.5,
                    maxWidth: "70%",
                    width: "fit-content",
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
            >
                <Typography variant="body2">{message.content}</Typography>
                <Typography
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", textAlign: "right" }}
                >
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </Typography>
            </Paper>
            {/* Avatar for User */}
            <Avatar
                sx={{
                    ml: 2,
                    bgcolor: "primary.main",
                }}
            >
                <PersonIcon />
            </Avatar>
        </Box>
    );
}
