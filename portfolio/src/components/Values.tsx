import { Box, Typography, Grid, Card, Container, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { Star, Target, Shield, Zap, PieChart, Globe, Users, Rocket } from 'lucide-react';

// Values Data with updated structure
const values = [
  {
    title: "Innovation",
    description: "Pushing boundaries with creative solutions that transform challenges into opportunities.",
    color: "#ff6f61", // Coral Red
    icon: Rocket,
  },
  {
    title: "Client Success",
    description: "Dedicated to understanding and exceeding our clients' most ambitious goals.",
    color: "#42a5f5", // Sky Blue
    icon: Target,
  },
  {
    title: "Quality & Reliability",
    description: "Delivering exceptional, dependable solutions that stand the test of time.",
    color: "#66bb6a", // Leaf Green
    icon: Shield,
  },
  {
    title: "Collaboration",
    description: "Uniting diverse talents to create breakthrough solutions and shared success.",
    color: "#ffca28", // Gold Yellow
    icon: Users,
  },
  {
    title: "Integrity",
    description: "Building trust through transparent, ethical practices in every interaction.",
    color: "#ab47bc", // Amethyst Purple
    icon: Star,
  },
  {
    title: "Sustainability",
    description: "Committed to innovative solutions that support a greener, more responsible future.",
    color: "#26c6da", // Teal Blue
    icon: Globe,
  },
  {
    title: "Agility",
    description: "Rapidly adapting to change, turning challenges into competitive advantages.",
    color: "#ffa726", // Vibrant Orange
    icon: Zap,
  },
  {
    title: "Continuous Growth",
    description: "Constantly evolving, learning, and staying ahead in the dynamic tech landscape.",
    color: "#7e57c2", // Lavender Purple
    icon: PieChart,
  },
];

const Values = () => {
  const theme = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      rotate: 2,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 }, // Adjusted padding-y for top and bottom
        px: 3,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px' // Rounded edges
      }}
    >
      {/* Decorative Background Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [0.8, 1, 0.8] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,99,132,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }}
      />

      <Container maxWidth="lg">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? "#ffffff" : "#2c3e50",
              mb: 6,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Our Core Values
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{
              color: theme.palette.mode === 'dark' ? "#e0e0e0" : "#34495e",
              mb: 8,
              maxWidth: 800,
              mx: 'auto',
              opacity: 0.8,
            }}
          >
            At the heart of our company lies a commitment to excellence, innovation, and meaningful impact.
          </Typography>
        </motion.div>

        {/* Values Grid */}
        <Grid
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          container
          spacing={4}
          justifyContent="center"
        >
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                key={index}
                component={motion.div}
                variants={itemVariants}
                whileHover="hover"
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 10px 25px rgba(0,0,0,0.5)'
                      : '0 10px 25px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 15px 35px rgba(0,0,0,0.6)'
                        : '0 15px 35px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      background: value.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80
                    }}
                  >
                    <IconComponent
                      size={40}
                      color="white"
                      strokeWidth={1.5}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? "#ffffff" : '#2c3e50'
                    }}
                  >
                    {value.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? "#e0e0e0" : '#34495e',
                      opacity: 0.8
                    }}
                  >
                    {value.description}
                  </Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default Values;