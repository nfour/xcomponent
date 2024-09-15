import { createRoot } from 'react-dom/client';
import { Root } from './root/Root';

// We are using a storybook story file, so we don't need to render this
// but this is how you would do it if you were rendering this as a standalone app
createRoot(document.getElementById('body')!).render(<Root />);
