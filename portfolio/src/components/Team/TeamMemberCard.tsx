import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Stack,
  Box,
  useTheme,
} from "@mui/material";
import { LinkedIn, Instagram, GitHub, X } from "@mui/icons-material";

interface SocialLinks {
  instagram: string;
  linkedin?: string;
  github?: string;
  x?: string;
}

interface TeamMemberCardProps {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  socialLinks: SocialLinks;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  role,
  description,
  imageUrl,
  socialLinks,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: { xs: 300, sm: 345 },
        boxShadow: theme.shadows[4],
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <Box sx={{ overflow: "hidden" }}>
        <CardMedia
          component="img"
          height="300"
          image={imageUrl}
          alt={`${name}'s profile`}
          sx={{
            objectFit: "cover",
            width: "100%",
            transition: "transform 0.4s ease-in-out",
            "&:hover": {
              transform: "scale(1.1)",
            },
          }}
        />
      </Box>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 3,
          minHeight: 250, // Fixed height for consistent alignment
        }}
      >
        <Typography gutterBottom variant="h6" component="div">
          {name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {role}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, fontStyle: "italic" }}
        >
          {description}
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          sx={{ mt: 2 }}
        >
          {socialLinks.linkedin && (
            <IconButton
              href={socialLinks.linkedin}
              aria-label={`${name}'s LinkedIn`}
              target="_blank"
              sx={{
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: "#0072b1" },
              }}
            >
              <LinkedIn />
            </IconButton>
          )}
          {socialLinks.instagram && (
            <IconButton
              href={socialLinks.instagram}
              aria-label={`${name}'s Instagram`}
              target="_blank"
              sx={{
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: "#E1306C" },
              }}
            >
              <Instagram />
            </IconButton>
          )}
          {socialLinks.x && (
            <IconButton
              href={socialLinks.x}
              aria-label={`${name}'s Twitter (X)`}
              target="_blank"
              sx={{
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: theme.palette.info.main },
              }}
            >
              <X />
            </IconButton>
          )}
          {socialLinks.github && (
            <IconButton
              href={socialLinks.github}
              aria-label={`${name}'s GitHub`}
              target="_blank"
              sx={{
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: theme.palette.info.main },
              }}
            >
              <GitHub />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;
