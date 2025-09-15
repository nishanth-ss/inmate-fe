import { BrowserRouter as Router } from 'react-router-dom';
import './App.css'
import AppRoutes from './routes/AppRoutes';
import { Provider } from 'react-redux';
import { store} from "./redux/store";

function App() {

  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  )
}

export default App;
