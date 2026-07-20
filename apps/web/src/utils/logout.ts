import type { NavigateFunction } from "react-router-dom";
import type { AppAction } from "@/state/Reducer";
import type React from "react";

export const logout = (
  dispatch: React.Dispatch<AppAction> | null = null,
  navigate: NavigateFunction | null = null
) => {
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
