import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';

export default function FriendListScreen() {
  return (
    <PageTemplate title="好友列表" selectedTab="friend">
      <ThemedText type='default'>這一頁是好友列表</ThemedText>
    </PageTemplate>
  );
}
