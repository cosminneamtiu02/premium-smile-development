import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  // Story values default to Romanian with diacritics (§15.7)
  args: { children: 'Sună acum', variant: 'primary' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'ghost'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Închide' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
