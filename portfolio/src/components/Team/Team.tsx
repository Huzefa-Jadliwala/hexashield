import React from 'react';
import { Container, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard.tsx';

const Team: React.FC = () => {
  const theme = useTheme();

  const teamMembers = [
    {
      name: 'Md Hafizur Rahman',
      role: 'Software Engineer',
      description: 'Building secure, sleek, and scalable solutions one line at a time.',
      imageUrl: 'images/team/hafiz-square.png',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/mdhafizur98/',
        instagram: '',
        x: 'https://x.com/callme_hafizur',
        github: 'https://github.com/mdhafizur',
      },
    },
    {
      name: 'Huzefa Ismail Jadliwala',
      role: 'Software Engineer',
      description: 'Digital innovator, crafting breakthrough solutions that drive industries forward and turn ambitious ideas into impactful realities.',
      imageUrl: 'images/team/huzefa-square.png',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/huzefa-jadliwala/',
        instagram: 'https://www.instagram.com/huzefa.jadliwala/',
        github: 'https://github.com/Huzefa-Jadliwala',
      },
    },
    {
      name: 'Tanvir Islam',
      role: 'Backend Developer',
      description: 'Passionate about competitive programming and Software Development',
      imageUrl: 'images/team/tanvir-square.jpeg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/tanvieer',
        instagram: 'https://instagram.com/tanvieer',
        github: 'https://github.com/tanvieer',
      },
    },
    {
      name: 'Karan Dhanawade',
      role: 'Frontend Developer',
      description: 'Passionate about UI/UX design and React development.',
      imageUrl: 'images/team/karan-square.png',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/karan-dhanawade',
        instagram: 'https://instagram.com/karan_dhanawade_10',
        github: 'https://github.com/karand11',
      },
    },
    {
      name: 'Usman Sameer Khan',
      role: 'Frontend Developer',
      description: 'Building responsive, dynamic React interfaces',
      imageUrl: "images/team/usman-square.png",
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/usman-khan-913790311',
        instagram: 'https://www.instagram.com/hasty.beginner',
        github: 'https://github.com/muhammadusman876',
      },
    },

  ];

  return (
    <Container id="team" sx={{ marginTop: theme.spacing(8), textAlign: 'center' }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Our Team
        </Typography>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Typography
          variant="h6"
          mb={4}
          textAlign="center"
          color={theme.palette.text.secondary}
          sx={{ fontWeight: 300 }}
        >
          Meet the brilliant minds and passionate innovators driving our success.
        </Typography>
      </motion.div>

      {/* Team Members Flexbox */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: theme.spacing(4),
          mt: theme.spacing(4),
        }}
      >
        {teamMembers.map((member, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flex: '1 1 300px',
              maxWidth: '300px',
            }}
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            <TeamMemberCard {...member} />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Team;
