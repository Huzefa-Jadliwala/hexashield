import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Toolbar,
  Button,
  Paper,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";

const BlogDetail: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        const response = await fetch(`/blogs/week-${blogId}.md`);
        if (!response.ok) throw new Error("Failed to load Markdown file");
        const text = await response.text();
        const { content } = matter(text); // Extract content without metadata
        setContent(content);
      } catch (error) {
        console.error("Error fetching Markdown file:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [blogId]);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Toolbar />
      <Container
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{
          flexGrow: 1,
          mt: 4,
          pb: 4,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/blogs")}
          sx={{
            color: theme.palette.primary.main,
            "&:hover": {
              color: theme.palette.mode === "dark" ? "#7e57c2" : "#9a68b0", // Darker purple shades
            },
            mb: 4,
            mt: 2, // Add margin-top to ensure proper spacing
          }}
        >
          Back to Blogs
        </Button>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="50vh"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={3} sx={{ p: 4 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{ mt: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{ mt: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ mt: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                h4: ({ node, ...props }) => (
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{ mt: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                p: ({ node, ...props }) => (
                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ mt: 0, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                a: ({ node, ...props }) => (
                  <Typography
                    component="a"
                    sx={{ color: theme.palette.primary.main }}
                    {...(props as any)}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <Box
                    component="ul"
                    sx={{ pl: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <Box
                    component="ol"
                    sx={{ pl: 4, mb: 2 }}
                    {...(props as any)}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <Box
                    component="blockquote"
                    sx={{
                      pl: 4,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      color: theme.palette.text.secondary,
                      fontStyle: "italic",
                      mb: 2,
                    }}
                    {...(props as any)}
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default BlogDetail;
