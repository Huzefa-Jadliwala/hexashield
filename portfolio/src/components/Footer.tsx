import { Email, LinkedIn, X, Instagram, LocationOn, Facebook } from '@mui/icons-material';
import { Box, Grid, IconButton, Link, Typography, useTheme } from '@mui/material';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
        padding: theme.spacing(3, 2),
        textAlign: 'center',
        position: 'relative',
        bottom: 0,
        left: 0,
        width: '100%',
        marginTop: theme.spacing(6),
      }}
    >
      <Grid container spacing={4} justifyContent="center">
        {/* Address Section */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6" gutterBottom>
            Address
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
            <Link
              href="https://www.google.com/maps/dir//tu+chemnitz+address/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x47a746124369d00d:0xde05efaa075f2103?sa=X&ved=1t:3061&ictx=111"
              color="inherit"
              underline="none"
              target="_blank"
              rel="noopener"
            >
              Str. der Nationen 62, 09111 Chemnitz, Germany
            </Link>
          </Typography>
        </Grid>

        {/* Email Section */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6" gutterBottom>
            Contact
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            <Email sx={{ verticalAlign: 'middle', mr: 1 }} />
            <Link href="mailto:hexalayer.official@gmail.com" color="inherit" underline="none">
              hexalayer.official@gmail.com
            </Link>
          </Typography>
        </Grid>

        {/* Social Media Section */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6" gutterBottom>
            Follow Us
          </Typography>
          <Box>
            <IconButton
              component="a"
              href="https://www.facebook.com/profile.php?id=61568292851414"
              target="_blank"
              color="inherit"
              aria-label="Facebook"
              sx={{
                padding: theme.spacing(1),
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: "#0072b1" },
              }}
            >
              <Facebook />
            </IconButton>

            <IconButton
              component="a"
              href="https://instagram.com/hexalayer"
              target="_blank"
              color="inherit"
              aria-label="Instagram"
              sx={{
                padding: theme.spacing(1),
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: "#E1306C" },
              }}
            >
              <Instagram />
            </IconButton>

            <IconButton
              component="a"
              href="https://x.com/hexalayer_x"
              target="_blank"
              color="inherit"
              aria-label="X"
              sx={{
                padding: theme.spacing(1),
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: theme.palette.info.main },
              }}
            >
              <X />
            </IconButton>

            <IconButton
              component="a"
              href="https://linkedin.com/company/hexalayer-ln"
              target="_blank"
              color="inherit"
              aria-label="LinkedIn"
              sx={{
                padding: theme.spacing(1),
                color: theme.palette.text.primary,
                transition: "color 0.3s ease",
                "&:hover": { color: "#0072b1" },
              }}
            >
              <LinkedIn />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Footer Note */}
      <Typography
        variant="body2"
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
          lineHeight: 1.6,
          marginTop: theme.spacing(4),
        }}
      >
        © 2024 This website has been created as part of the Web Engineering Planspiel Project at TU Chemnitz.
        <br />
        For any concerns or complaints, please do not hesitate to contact us. We value your feedback.
      </Typography>
    </Box>
  );
};

export default Footer;
