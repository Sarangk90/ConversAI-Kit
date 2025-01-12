import { render, screen } from '@testing-library/react';
import App from './components/App';

test('renders without crashing', () => {
  render(<App />);
});
