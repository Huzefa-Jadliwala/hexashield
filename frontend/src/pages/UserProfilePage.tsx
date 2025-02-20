import { Box, TextField, Button, Stack, IconButton, CircularProgress } from '@mui/material';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import userImage from '../assests/images/User.png';
import { useUser } from '@app/users/hooks/useUser';

export default function UserProfilePage() {
  const { user, loading, updateUser, updateError, updateLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    profile: userImage, // Default profile image
  });
  const [profileFile, setProfileFile] = useState<File | null>(null); // File to upload

  const [initialData, setInitialData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: userImage,
  });

  useEffect(() => {
    if (user) {
      const userData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        profile: user.profile || userImage,
      };
      setFormData((prev) => ({ ...prev, ...userData }));
      setInitialData(userData);
    }
  }, [user]);

  const isFormChanged = () => {
    return (
      formData.first_name !== initialData.first_name ||
      formData.last_name !== initialData.last_name ||
      formData.password !== '' ||
      formData.confirm_password !== '' ||
      profileFile !== null // Check if a new profile image has been uploaded
    );
  };

  const isPasswordValid = formData.password === formData.confirm_password;

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file); // Set the file to upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profile: reader.result as string, // Preview image
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  function isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }
  const handleSubmit = async () => {
    if (!isPasswordValid) {
      alert('Passwords do not match!');
      return;
    }
    // Validate password length
    if ((formData.password.length < 8 || formData.password.length > 16) && formData.password !== "") {
      alert("Password must be between 8 and 16 characters long");
      return ;
    }

    try {
      if (user?.userId) {
        const data = new FormData();
        data.append('first_name', formData.first_name);
        data.append('last_name', formData.last_name);
        data.append('password', formData.password);
        data.append('confirm_password', formData.confirm_password);
        if (profileFile) {
          data.append('profile', profileFile); // Append the profile image
        }
        console.log(data)
        await updateUser(user.userId, data);
      } else {
        alert('Something went wrong!! Please try Later.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('There was an error updating the profile.');
    }
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        maxWidth: 1200,
        margin: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      {loading && <CircularProgress sx={{ color: '#C487E0' }} />}

      {!loading && (
        <>
          <Box sx={{ position: 'relative', width: 120, height: 120, marginBottom: 3 }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={
                  isBase64(formData.profile)
                    ? `data:image/jpeg;base64,${formData.profile}`
                    : formData.profile
                }
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                bgcolor: '#C487E0',
                '&:hover': { bgcolor: '#C487E0', opacity: 0.9 },
                padding: 1,
              }}
            >
              <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              <Camera size={20} color="white" />
            </IconButton>
          </Box>

          <Stack direction="row" spacing={3} sx={{ width: '100%' }}>
            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              sx={inputStyles}
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              sx={inputStyles}
            />
          </Stack>
          <TextField
            label="Email"
            name="email"
            disabled
            value={formData.email}
            variant="outlined"
            fullWidth
            sx={inputStyles}
          />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            InputProps={{
              endAdornment: (
                <IconButton onClick={togglePasswordVisibility} edge="end">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </IconButton>
              ),
            }}
            sx={inputStyles}
          />
          <TextField
            label="Confirm Password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirm_password}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            InputProps={{
              endAdornment: (
                <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </IconButton>
              ),
            }}
            sx={inputStyles}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!isFormChanged() || !isPasswordValid}
            sx={{
              bgcolor: '#C487E0',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '20px',
              fontWeight: 500,
              '&:hover': { bgcolor: '#C487E0', opacity: 0.8 },
              '&:disabled': { bgcolor: 'grey', opacity: 0.5 },
            }}
          >
            {updateLoading ? 'Updating Profile...' : 'Update Profile'}
          </Button>
          {updateError && <p style={{ color: 'red' }}>Error: {updateError}</p>}
        </>
      )}
    </Box>
  );
}

const inputStyles = {
  bgcolor: '#39497096',
  borderRadius: 3,
  input: { color: 'white' },
  label: { color: 'white' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'white' },
  },
};
