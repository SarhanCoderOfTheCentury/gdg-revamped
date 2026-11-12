import {createRoot} from 'react-dom/client';
import {CommunityMotion} from './components/community/CommunityMotion';
import {DiscordCommunity} from './components/community/DiscordCommunity';

export function mountCommunity(element: HTMLElement) {
  const root = createRoot(element, {identifierPrefix: 'gdg-community-'});
  root.render(<CommunityMotion theme="light" layout="auto" showControls={false} />);
  return () => root.unmount();
}

export function mountDiscord(element: HTMLElement) {
  const root = createRoot(element, {identifierPrefix: 'gdg-discord-'});
  root.render(
    <DiscordCommunity
      layout="auto"
      showControls={false}
      inviteUrl="https://discord.gg/vuHB4E7DVq"
    />,
  );
  return () => root.unmount();
}
