export const logout = (dispatch = null, navigate = null) => {
  // Clear all localStorage items
  localStorage.removeItem('Token');
  localStorage.removeItem('RefreshToken');
  localStorage.removeItem('sessionExp');
  localStorage.removeItem('User');
  localStorage.removeItem('Business');
  
  // Dispatch RESET action if dispatch function is provided
  if (dispatch) {
    try {
      dispatch({ type: 'RESET' });
    } catch (error) {
      console.error('Error dispatching RESET action:', error);
    }
  }
  
  // Redirect to sign-in page
  if (navigate) {
    navigate('/auth/sign-in');
  } else {
    window.location.href = '/auth/sign-in';
  }
};

