import { useShopController } from './controllers/useShopController.js';
import { AppView } from './views/AppView.jsx';

export default function App() {
  const controller = useShopController();
  return <AppView {...controller} />;
}
