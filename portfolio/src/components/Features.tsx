import { useTheme } from '@mui/material';
import { Box, Typography, Grid, Button, Container } from '@mui/material';
import { motion } from 'framer-motion';
import {
    Shield,
    Zap,
    UserCheck,
    BarChart,
    Lock,
    Sliders,
    AlertTriangle,
    type LucideIcon,
} from 'lucide-react';

// AnimatedFeatureCard Component
const AnimatedFeatureCard = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <Box
                sx={{
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    padding: 3,
                    textAlign: 'center',
                    backgroundColor: 'background.default', // Use default background for dark mode
                    boxShadow: 6,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        borderColor: 'primary.dark',
                        boxShadow: 12,
                        transform: 'scale(1.05)',
                    },
                    '& .MuiTypography-root': {
                        marginBottom: 2,
                    },
                }}
            >
                <motion.div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(61, 61, 61, 0.1)', // Light background for icon circle
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 16px',
                    }}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <Icon size={32} style={{ color: '#888888' }} />
                </motion.div>
                <Typography variant="h6" fontWeight="500" gutterBottom color="text.primary">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </Box>
        </motion.div>
    );
};

// Features Array
const features = [
    { icon: Shield, title: 'Dual-Mode Assessment', description: 'Combines manual and automated workflows for vulnerability management.' },
    { icon: Zap, title: 'AI-Powered Guidance', description: 'Integrated with ChatGPT for contextual insights and recommendations.' },
    { icon: Sliders, title: 'Web Hex', description: 'A feature that scans websites, runs automated attacks, and identifies vulnerabilities with precision.' },
    { icon: Lock, title: 'GDPR Compliance', description: 'Ensures data protection compliance with actionable insights to mitigate risks.' },
    
    { icon: UserCheck, title: 'User-Friendly Interface', description: 'Simplifies complex cybersecurity processes for all users.' },
    { icon: BarChart, title: 'Real-Time Insights', description: 'Provides actionable reports during assessments.' },
    { icon: AlertTriangle, title: 'Vulnerability Prioritization', description: 'Ranks vulnerabilities by severity for efficient resolution.' },
];

// FeaturesPage Component
const Features = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                overflow: 'hidden',
                backgroundColor: theme.palette.background.default, // Use background.default for dark mode
                padding: theme.spacing(10),
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        textAlign: 'center',
                        color: theme.palette.text.primary,
                        marginBottom: theme.spacing(12),
                    }}
                >
                    <Typography
                        variant="h2"
                        fontWeight="700"
                        gutterBottom
                        sx={{
                            backgroundImage: 'linear-gradient(to right, rgb(204, 0, 255), rgb(20, 15, 25))',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            fontSize: '3rem',
                        }}
                    >
                        Our Product Offerings
                    </Typography>
                    <Typography
                        variant="h5"
                        color="text.primary"
                        sx={{
                            marginBottom: theme.spacing(6),
                            fontWeight: 300,
                            maxWidth: '800px',
                            margin: '0 auto',
                        }}
                    >
                        Discover how HexaSheild revolutionizes cybersecurity with its advanced features, designed to enhance security and simplify workflows.
                    </Typography>
                </Box>

                <Grid container spacing={4} justifyContent="center">
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={6} key={index}>
                            <AnimatedFeatureCard {...feature} />
                        </Grid>
                    ))}
                </Grid>

                <Box
                    sx={{
                        textAlign: 'left',
                        marginTop: theme.spacing(10),
                        backgroundColor: theme.palette.background.paper, // Use background.paper for better contrast in dark mode
                        padding: theme.spacing(8),
                        borderRadius: 10,
                    }}
                >
                    <Typography variant="h4" gutterBottom color="text.primary">
                        Secure Your Digital Assets with HexaShield
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.primary"
                        sx={{ marginBottom: theme.spacing(6), fontWeight: 300 }}
                    >
                        Join forward-thinking organizations that trust HexaShield for their comprehensive cybersecurity needs. Experience the perfect blend of AI-powered insights and human expertise.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => window.location.href = "https://hexashield.vercel.app/login"} // Navigate to login page
                        sx={{
                            backgroundColor: 'primary.main',
                            padding: '12px 32px',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                            transition: 'all 0.3s ease',
                            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        Get Started with HexaShield
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default Features;
