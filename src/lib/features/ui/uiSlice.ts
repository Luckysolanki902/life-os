import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: UIState = {
  isSidebarOpen: true,
  theme: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
