import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';

export default function MyRecordScreen() {
  return (
    <PageTemplate title="我的紀錄" selectedTab="record">
      <ThemedText type='default'>這一頁是我的紀錄</ThemedText>
    </PageTemplate>
  );
}
