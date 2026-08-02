import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Image } from './Image';

const meta = {
  title: 'UI/Image',
  component: Image,
  args: {
    src: 'images/placeholder-hero.png',
    width: 1200,
    height: 800,
    // alt is translated content in real usage (§11) — RO default here (§15.7)
    alt: 'Cabinet stomatologic modern, luminos',
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hero: Story = {
  args: { priority: true },
};
