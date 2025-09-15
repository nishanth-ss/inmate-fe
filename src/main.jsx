import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SnackbarProvider } from 'notistack'

createRoot(document.getElementById('root')).render(

  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    autoHideDuration={3000}
    preventDuplicate
  >
    <App />
  </SnackbarProvider>

)
