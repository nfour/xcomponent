import { useRootState, X } from '~/X';
import { Navbar } from '../navigation/Navbar';

export const LandingPage = X(() => {
  const { router } = useRootState();

  return (
    <div>
      <Navbar />
      <h1>Home</h1>
      goto app:
      <button onClick={() => router.routes.app.push()}>App</button>
    </div>
  );
});
