import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  MenuItem,
  ThemeProvider,
  createTheme,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Engineering as EngineeringIcon,
  AccessTime as AccessTimeIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff69b4',
      light: '#ff9cc8',
      dark: '#ff1493',
    },
    secondary: {
      main: '#4a90e2',
    },
    background: {
      default: '#fdf2f7',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        },
      },
    },
  },
});

const categories = [
  'General',
  'Work',
  'Family',
  'Health',
  'Relationship',
  'Other'
];

const statusColors = {
  pending: '#ffa726',
  acknowledged: '#4a90e2',
  'in-progress': '#ab47bc',
  completed: '#66bb6a',
};

function App() {
  const [thought, setThought] = useState('');
  const [category, setCategory] = useState('General');
  const [thoughts, setThoughts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [auth, setAuth] = useState({
    username: localStorage.getItem('username') || '',
    password: localStorage.getItem('password') || ''
  });
  const [showLogin, setShowLogin] = useState(!auth.username || !auth.password);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}`
  });

  const fetchThoughts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(process.env.REACT_APP_API_URL, {
        headers: getAuthHeaders()
      });
      setThoughts(response.data.thoughts);
    } catch (error) {
      if (error.response?.status === 401) {
        setShowLogin(true);
      }
      setSnackbar({
        open: true,
        message: 'Failed to fetch thoughts. Please check your credentials.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.username && auth.password) {
      fetchThoughts();
    }
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(process.env.REACT_APP_API_URL, {
        content: thought,
        category: category.toLowerCase()
      }, {
        headers: getAuthHeaders()
      });

      setSnackbar({
        open: true,
        message: 'Thank you for sharing your thoughts! 💕',
        severity: 'success'
      });
      setThought('');
      fetchThoughts();
    } catch (error) {
      if (error.response?.status === 401) {
        setShowLogin(true);
      }
      setSnackbar({
        open: true,
        message: 'Failed to submit thought. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (thought, updates) => {
    try {
      setLoading(true);
      await axios.put(process.env.REACT_APP_API_URL, {
        id: thought.id,
        timestamp: thought.timestamp,
        ...updates
      }, {
        headers: getAuthHeaders()
      });
      fetchThoughts();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update status. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (thought) => {
    try {
      setLoading(true);
      await axios.delete(process.env.REACT_APP_API_URL, {
        headers: getAuthHeaders(),
        data: {
          id: thought.id,
          timestamp: thought.timestamp
        }
      });
      fetchThoughts();
      setSnackbar({
        open: true,
        message: 'Thought deleted successfully.',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete thought. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem('username', auth.username);
    localStorage.setItem('password', auth.password);
    setShowLogin(false);
    fetchThoughts();
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    setAuth({ username: '', password: '' });
    setShowLogin(true);
    setThoughts([]);
    setSnackbar({
      open: true,
      message: 'Logged out successfully',
      severity: 'success'
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f7 0%, #fce4ec 100%)',
        pb: 4
      }}>
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Catty's Portal
            </Typography>
            {!showLogin && (
              <Tooltip title="Logout">
                <IconButton color="inherit" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: 'linear-gradient(145deg, #fff1f6 0%, #ffffff 100%)',
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FavoriteIcon sx={{ color: 'primary.main', mr: 1, fontSize: 40 }} />
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                background: 'linear-gradient(45deg, #ff69b4, #ff1493)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Sweet Thoughts
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary', fontWeight: 300 }}>
              Share anything that's on your mind, my love. I'm here to listen and support you. 💝
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    variant="outlined"
                  >
                    {categories.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    label="What's bothering you?"
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(45deg, #ff69b4 30%, #ff1493 90%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #ff1493 30%, #ff69b4 90%)',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Share Your Thoughts 💕'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {thoughts.length > 0 && (
            <Grid container spacing={3}>
              {thoughts.map((t) => (
                <Grid item xs={12} key={t.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={t.category} 
                          color="primary" 
                          variant="outlined" 
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(t.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {t.content}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={t.status || 'pending'}
                          sx={{ bgcolor: statusColors[t.status || 'pending'], color: 'white' }}
                          size="small"
                        />
                        <Tooltip title="Acknowledged">
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Acknowledged"
                            variant={t.isAcknowledged ? "filled" : "outlined"}
                            color="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(t, { isAcknowledged: !t.isAcknowledged })}
                          />
                        </Tooltip>
                        <Tooltip title="Action Taken">
                          <Chip
                            icon={<EngineeringIcon />}
                            label="Action Taken"
                            variant={t.actionTaken ? "filled" : "outlined"}
                            color="secondary"
                            size="small"
                            onClick={() => handleStatusUpdate(t, { actionTaken: !t.actionTaken })}
                          />
                        </Tooltip>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<AccessTimeIcon />}
                          onClick={() => handleStatusUpdate(t, { 
                            status: t.status === 'completed' ? 'pending' : 'completed'
                          })}
                        >
                          {t.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
                        </Button>
                      </Box>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(t)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Dialog open={showLogin} onClose={() => {}}>
            <DialogTitle>Login Required</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Username"
                fullWidth
                value={auth.username}
                onChange={(e) => setAuth(prev => ({ ...prev, username: e.target.value }))}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                value={auth.password}
                onChange={(e) => setAuth(prev => ({ ...prev, password: e.target.value }))}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleLogin} color="primary">
                Login
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 