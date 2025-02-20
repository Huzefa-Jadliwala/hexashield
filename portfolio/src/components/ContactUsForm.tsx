import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    FormHelperText,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { sendEmail } from '../services/sesEmailService';
import 'react-toastify/dist/ReactToastify.css';

type FormData = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

const ContactUsForm = () => {
    const theme = useTheme();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { name, email, subject, message } = formData;
        setLoading(true);
        try {
            await sendEmail(email, subject, `Name: ${name}\n\n${message}`);
            toast.success('Your message has been sent successfully!', { autoClose: 2000 });
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to send your message. Please try again.', { autoClose: 2000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            id="contact-us"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: theme.spacing(4),
                backgroundColor: theme.palette.background.default,
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[4],
                    padding: theme.spacing(4),
                    maxWidth: '700px',
                    width: '100%',
                    color: theme.palette.text.primary,
                }}
            >
                <Typography
                    variant="h4"
                    mb={2}
                    textAlign="center"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                >
                    Contact Us
                </Typography>
                <Typography
                    variant="h6"
                    mb={4}
                    textAlign="center"
                    color={theme.palette.text.secondary}
                    sx={{ fontWeight: 300 }}
                >
                    Get in touch for tailored software solutions to meet your IT needs.
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: theme.spacing(3),
                    }}
                >
                    <Box sx={{ flex: '1 1 45%' }}>
                        <FormControl fullWidth variant="filled">
                            <InputLabel htmlFor="name" shrink sx={{ color: theme.palette.text.primary }}>
                                Name
                            </InputLabel>
                            <TextField
                                id="name"
                                name="name"
                                variant="filled"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiFilledInput-root': {
                                        backgroundColor: theme.palette.background.default,
                                        color: theme.palette.text.primary,
                                    },
                                }}
                            />
                            <FormHelperText sx={{ color: theme.palette.text.secondary }}>
                                Please enter your full name.
                            </FormHelperText>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 45%' }}>
                        <FormControl fullWidth variant="filled">
                            <InputLabel htmlFor="email" shrink sx={{ color: theme.palette.text.primary }}>
                                Email
                            </InputLabel>
                            <TextField
                                id="email"
                                name="email"
                                type="email"
                                variant="filled"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiFilledInput-root': {
                                        backgroundColor: theme.palette.background.default,
                                        color: theme.palette.text.primary,
                                    },
                                }}
                            />
                            <FormHelperText sx={{ color: theme.palette.text.secondary }}>
                                We'll never share your email.
                            </FormHelperText>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 100%' }}>
                        <FormControl fullWidth variant="filled">
                            <InputLabel htmlFor="subject" shrink sx={{ color: theme.palette.text.primary }}>
                                Subject
                            </InputLabel>
                            <TextField
                                id="subject"
                                name="subject"
                                variant="filled"
                                required
                                value={formData.subject}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiFilledInput-root': {
                                        backgroundColor: theme.palette.background.default,
                                        color: theme.palette.text.primary,
                                    },
                                }}
                            />
                            <FormHelperText sx={{ color: theme.palette.text.secondary }}>
                                Briefly summarize your inquiry.
                            </FormHelperText>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 100%' }}>
                        <FormControl fullWidth variant="filled">
                            <InputLabel htmlFor="message" shrink sx={{ color: theme.palette.text.primary }}>
                                Message
                            </InputLabel>
                            <TextField
                                id="message"
                                name="message"
                                variant="filled"
                                required
                                multiline
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiFilledInput-root': {
                                        backgroundColor: theme.palette.background.default,
                                        color: theme.palette.text.primary,
                                    },
                                }}
                            />
                            <FormHelperText sx={{ color: theme.palette.text.secondary }}>
                                Provide detailed information about your request.
                            </FormHelperText>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 100%' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                marginTop: theme.spacing(2),
                                padding: theme.spacing(1.5),
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: theme.palette.text.primary }} /> : 'Send Message'}
                        </Button>
                    </Box>
                </Box>
                <ToastContainer theme="colored" />
            </Box>
        </Box>
    );
};

export default ContactUsForm;
