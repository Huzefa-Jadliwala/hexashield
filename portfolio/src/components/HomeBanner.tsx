import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

const HomeBanner = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      id="home"
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        flexDirection: isSmallScreen ? 'column' : 'row',
        minHeight: '60vh',
        margin: isSmallScreen ? theme.spacing(6, 2, 2, 2) : theme.spacing(4, 8),
      }}
    >
      {/* Content Section */}
      <Box
        component={motion.div}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{
          maxWidth: 500,
          textAlign: isSmallScreen ? 'center' : 'left',
          marginBottom: isSmallScreen ? theme.spacing(3) : 0,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            marginBottom: theme.spacing(2),
          }}
        >
          Scaled.
          <br /> 
          Solutions.
          <br />
          Simplified.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1rem',
            color: theme.palette.text.secondary,
            marginBottom: theme.spacing(3),
          }}
        >
          Elevate your business with our scalable software solutions designed to simplify complexities and drive growth. Our expert team works closely with you to transform your vision into impactful results, ensuring optimized operations and a competitive edge in an evolving landscape.
        </Typography>
        <Box
          component={motion.div}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          sx={{
            display: 'flex',
            gap: theme.spacing(2),
            justifyContent: isSmallScreen ? 'center' : 'flex-start',
            flexDirection: isSmallScreen ? 'column' : 'row', // Make buttons stack on small screens
          }}
        >
          {/* <ScrollLink to="team" smooth={true} duration={500} style={{ textDecoration: 'none' }}> */}
            <Button
              variant="contained"
              color="primary"
              sx={{
                fontWeight: 'bold',
                padding: isSmallScreen ? theme.spacing(1, 2) : theme.spacing(1, 3),
                borderRadius: '5px',
                width: isSmallScreen ? '100%' : 'auto',
              }}
            >
              Meet The Team
            </Button>
          {/* </ScrollLink> */}

          {/* <ScrollLink to="contact-us" smooth={true} duration={500} style={{ textDecoration: 'none' }}> */}
            <Button
              variant="outlined"
              color="primary"
              sx={{
                fontWeight: 'bold',
                padding: isSmallScreen ? theme.spacing(1, 2) : theme.spacing(1, 3),
                borderRadius: '5px',
                width: isSmallScreen ? '100%' : 'auto',
              }}
            >
              Contact Us
            </Button>
          {/* </ScrollLink> */}
        </Box>
      </Box>

      {/* Image Section */}
      <Box
        component={motion.div}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src="/images/home_banner1.png"
          alt="Software development illustration"
          style={{
            width: isSmallScreen ? '100%' : '400px',
            height: 'auto',
          }}
        />
      </Box>
    </Box>
  );
};

export default HomeBanner;
