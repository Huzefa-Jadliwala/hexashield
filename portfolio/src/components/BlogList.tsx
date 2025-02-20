import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemProps,
  ListItemText,
  CircularProgress,
  Box,
  Toolbar,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import matter from "gray-matter";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";


interface Blog {
  id: string; // Use string to allow more flexible IDs
  week: number;
  title: string;
  author: string;
  date: string;
}


// Extend both ListItemProps and RouterLinkProps
type ListItemLinkProps = Omit<ListItemProps, "component"> & RouterLinkProps;

// Forward ref correctly
const ListItemLink = React.forwardRef<HTMLAnchorElement, ListItemLinkProps>(
  ({ to, ...rest }, ref) => {
    return (
      <ListItem
        component={RouterLink}
        to={to}
        ref={ref}
        {...rest}
      />
    );
  }
);




const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("/blogs/blogs.json");
        if (!response.ok) throw new Error("Failed to load blogs.json");

        const files: string[] = await response.json();

        const blogPromises = files.map(async (file) => {
          const res = await fetch(`/blogs/${file}`);
          const text = await res.text(); // Convert the response to text
          const { data } = matter(text); // Pass the text directly to gray-matter

          return {
            id: data.id || file.replace(".md", ""), // Fallback to filename if no id
            week: data.week,
            title: data.title,
            author: data.author,
            date: data.date,
          };
        });

        const blogs = await Promise.all(blogPromises);
        setBlogs(blogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page when the component mounts
  }, []);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Toolbar />
      <Container
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{ flexGrow: 1, mt: 4 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Blog Posts by Week
        </Typography>
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
          <List>
            {blogs.map((blog) => (
              <ListItemLink
                key={blog.id}
                to={`/blogs/${blog.id}`}
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#9a68b0" : "#e5b1f1", // Purple shades
                  borderRadius: 2,
                  mb: 2,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#7e57c2" : "#d094ea", // Darker purple shades
                  },
                }}
              >
                <ListItemText
                  primary={`Week ${blog.week}: ${blog.title}`}
                  secondary={`Author: ${blog.author} | Date: ${blog.date}`}
                  primaryTypographyProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                  secondaryTypographyProps={{
                    style: { color: theme.palette.text.secondary },
                  }}
                />
              </ListItemLink>
            ))}
          </List>
        )}
      </Container>
    </Box>
  );
};

export default BlogList;
