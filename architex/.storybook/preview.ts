import '../src/app/globals.css';
import type { Preview } from '@storybook/react';
const preview: Preview = {
  parameters: { backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0f1015' }] } },
};
export default preview;
